#!/usr/bin/env python3
"""
Capitan Loop — Standalone video loop finder
Run: python capitan_loop.py
Requires: pip install gradio watchdog Pillow numpy
"""

import os, sys, io, json, base64, time, shutil, hashlib, threading, tempfile, subprocess
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image
import gradio as gr

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    HAS_WATCHDOG = True
except ImportError:
    HAS_WATCHDOG = False

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
THUMB_W, THUMB_H = 160, 90
MAX_TABS = 10
TEMP_DIR = Path(tempfile.gettempdir()) / "capitan_loop_tmp"
CONFIG_FILE = Path(__file__).parent / "capitan_loop_config.json"

def load_config() -> dict:
    try:
        return json.loads(CONFIG_FILE.read_text())
    except:
        return {}

def save_config(data: dict):
    try:
        cfg = load_config()
        cfg.update(data)
        CONFIG_FILE.write_text(json.dumps(cfg, indent=2))
    except:
        pass

def _init_temp():
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

_init_temp()


# ─────────────────────────────────────────────────────────────────────────────
# FFMPEG UTILS
# ─────────────────────────────────────────────────────────────────────────────
def _find_bin(name: str) -> Optional[str]:
    """Search for a binary in PATH and common ComfyUI / portable locations."""
    # 0. Same folder as this script — highest priority
    script_dir = Path(__file__).resolve().parent
    for ext in [".exe", ".EXE", ""]:
        p = script_dir / (name + ext)
        if p.is_file():
            return str(p)

    # 1. Explicit env variable
    env_key = "FFMPEG_PATH" if name == "ffmpeg" else "FFPROBE_PATH"
    env_val = os.environ.get(env_key)
    if env_val and os.path.isfile(env_val):
        return env_val
    # 2. Standard PATH
    p = shutil.which(name) or shutil.which(name + ".exe")
    if p:
        return p

    # 2. Common ComfyUI portable locations (Windows)
    candidates = []
    drives = ["C:", "D:", "E:"]
    comfy_roots = [
        "ComfyUI_windows_portable",
        "ComfyUI_windows_portable222",
        "ComfyUI",
        "ComfyUI-Desktop",
    ]
    ffmpeg_subdirs = [
        r"python_embeds\Scripts",
        r"python_embeds\Library\bin",
        r"python_embeds\lib\site-packages\imageio_ffmpeg\binaries",
        r"python_embeds",
        r"venv\Scripts",
        r"venv\Lib\site-packages\imageio_ffmpeg\binaries",
        r"portable\ffmpeg\bin",
        "",
    ]
    for drive in drives:
        for root in comfy_roots:
            for sub in ffmpeg_subdirs:
                base = os.path.join(drive, os.sep, root, sub) if sub else os.path.join(drive, os.sep, root)
                candidates.append(os.path.join(base, name + ".exe"))
                candidates.append(os.path.join(base, name))

    # 3. imageio_ffmpeg (installed alongside ComfyUI deps)
    try:
        from imageio_ffmpeg import get_ffmpeg_exe
        candidates.insert(0, get_ffmpeg_exe())
    except Exception:
        pass

    # 4. Script's own directory and parent
    script_dir = Path(__file__).parent
    for d in [script_dir, script_dir.parent]:
        candidates.append(str(d / (name + ".exe")))
        candidates.append(str(d / name))

    for c in candidates:
        if c and os.path.isfile(c):
            return c

    return None

def _ffmpeg():
    p = _find_bin("ffmpeg")
    if not p:
        raise RuntimeError(
            "ffmpeg not found.\n"
            "Options:\n"
            "  1. Set FFMPEG_PATH env variable to the full path of ffmpeg.exe\n"
            "  2. Copy ffmpeg.exe to the same folder as capitan_loop.py\n"
            "  3. Add ffmpeg to your system PATH\n"
            "ComfyUI's ffmpeg is usually at:\n"
            "  <ComfyUI>\\python_embeds\\Scripts\\ffmpeg.exe  (or similar)"
        )
    return p

def _ffprobe():
    # ffprobe is usually next to ffmpeg
    ffmpeg_path = _ffmpeg()
    ffprobe_path = ffmpeg_path.replace("ffmpeg", "ffprobe")
    if os.path.isfile(ffprobe_path):
        return ffprobe_path
    p = _find_bin("ffprobe")
    return p or ffprobe_path  # fallback: try anyway

def get_video_info(path: str) -> dict:
    path = os.path.normpath(path)
    ffprobe = _ffprobe()
    cmd = [ffprobe, "-v", "error", "-i", path,
           "-select_streams", "v:0",
           "-show_entries", "stream=width,height,r_frame_rate,nb_frames,duration",
           "-of", "json"]
    r = subprocess.run(cmd, capture_output=True, text=True,
                       creationflags=0x08000000 if sys.platform=="win32" else 0)
    data = json.loads(r.stdout)
    s = data["streams"][0]
    fps_str = s.get("r_frame_rate", "24/1")
    num, den = fps_str.split("/")
    fps = float(num) / float(den)
    return {
        "width": int(s["width"]),
        "height": int(s["height"]),
        "fps": fps,
    }

def extract_frames(path: str, max_frames: int = 0) -> list:
    """Returns list of (H,W,3) float32 numpy arrays in 0-1."""
    path = os.path.normpath(path)
    info = get_video_info(path)
    w, h = info["width"], info["height"]
    print(f"[extract] video info: {w}x{h}, fps: {info['fps']:.2f}")
    # scale filter fuerza las dimensiones exactas y elimina SAR/DAR del contenedor
    cmd = [_ffmpeg(), "-v", "error", "-i", path,
           "-vf", f"scale={w}:{h},setsar=1",
           "-pix_fmt", "rgb24", "-f", "rawvideo"]
    if max_frames > 0:
        cmd += ["-frames:v", str(max_frames)]
    cmd.append("-")
    r = subprocess.run(cmd, capture_output=True,
                       creationflags=0x08000000 if sys.platform=="win32" else 0)
    raw = r.stdout
    bpp = w * h * 3
    n = len(raw) // bpp
    print(f"[extract] bytes: {len(raw)}, frames decodificados: {n}")
    frames = []
    for i in range(n):
        arr = np.frombuffer(raw[i*bpp:(i+1)*bpp], dtype=np.uint8).reshape(h, w, 3)
        frames.append(arr.astype(np.float32) / 255.0)
    return frames

def save_video_copy(source_path: str, out_path: str, keep_frames: int, fps: float):
    """
    Trim video using stream copy — zero re-encoding, colors preserved 100%.
    Cuts exactly keep_frames from the start.
    """
    duration = keep_frames / fps
    cmd = [_ffmpeg(), "-y", "-v", "error",
           "-i", source_path,
           "-t", f"{duration:.6f}",
           "-c", "copy",          # no re-encode: copy streams as-is
           "-avoid_negative_ts", "make_zero",
           out_path]
    result = subprocess.run(cmd, capture_output=True,
                            creationflags=0x08000000 if sys.platform=="win32" else 0)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg trim error: {result.stderr.decode(errors='replace')}")

def save_video(frames: list, path: str, fps: float,
               pix_fmt: str = "yuv444p", crf: int = 15):
    """Fallback: re-encode from frames (only used if source not available)."""
    if not frames:
        return
    h, w = frames[0].shape[:2]
    cmd = [_ffmpeg(), "-y", "-v", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", pix_fmt, "-crf", str(crf),
           path]
    raw = b"".join((f * 255).clip(0, 255).astype(np.uint8).tobytes() for f in frames)
    result = subprocess.run(cmd, input=raw, capture_output=True,
                            creationflags=0x08000000 if sys.platform=="win32" else 0)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg encode error: {result.stderr.decode(errors='replace')}")


# ─────────────────────────────────────────────────────────────────────────────
# LOOP FINDING
# ─────────────────────────────────────────────────────────────────────────────
def _dist_L1(a, b):
    return float(np.abs(a - b).mean())

def _dist_MSE(a, b):
    return float(((a.astype(np.float64) - b.astype(np.float64)) ** 2).mean())

def _dist_SSIM(a, b):
    mu_a, mu_b = a.mean(), b.mean()
    sig_a, sig_b = a.std(), b.std()
    sig_ab = float(np.mean((a - mu_a) * (b - mu_b)))
    C1, C2 = 0.0001, 0.0009
    ssim = ((2*mu_a*mu_b + C1)*(2*sig_ab + C2)) / \
           ((mu_a**2 + mu_b**2 + C1)*(sig_a**2 + sig_b**2 + C2) + 1e-12)
    return 1.0 - float(ssim)   # distance

_DIST_FN = {"L1": _dist_L1, "MSE": _dist_MSE, "SSIM": _dist_SSIM}

def _similarity_pct(a: np.ndarray, b: np.ndarray) -> float:
    """Returns 0-100 similarity. 100 = identical frames."""
    diff = np.abs(a.astype(np.float32) - b.astype(np.float32)).mean()
    # diff=0 → 100%, diff=1 (max possible) → 0%
    return round(float((1.0 - diff) * 100.0), 2)

def find_loop_point(
    frames: list,
    max_crop: int = 20,
    method: str = "L1",       # unused, kept for UI compat
    seam_window: int = 2,     # unused, kept for UI compat
    ref_frames: int = 8,      # unused, kept for UI compat
    weight_match: float = 0.9,  # min similarity threshold (0-1 → 0-100%)
    weight_smooth: float = 0.3, # unused, kept for UI compat
) -> tuple:
    """
    For each of the last max_crop frames, compare it to frame 0.
    Pick the one with highest similarity to frame 0.
    Only considers frames above the min_similarity threshold.
    Returns (best_keep: int, diagnostics: list[dict])
    """
    B = len(frames)
    if B < 4:
        return B, []

    min_similarity = weight_match * 100.0  # convert 0-1 to percentage
    first = frames[0]

    # Search window: last max_crop frames, keep at least 3 frames
    search_start = max(3, B - max_crop)

    diags = []
    best_sim = -1.0
    best_keep = None

    for keep in range(search_start, B + 1):
        last_idx = keep - 1
        sim = _similarity_pct(frames[last_idx], first)
        crop = B - keep
        diags.append({
            "crop": crop,
            "keep": keep,
            "frame_idx": last_idx,
            "similarity_%": sim,
            "above_threshold": sim >= min_similarity,
        })
        if sim > best_sim:
            best_sim = sim
            best_keep = keep

    # Check if best is above threshold
    best_diag = next((d for d in diags if d["keep"] == best_keep), None)
    if best_diag and best_diag["similarity_%"] < min_similarity:
        # Nothing above threshold — return full clip with warning
        best_keep = B
        for d in diags:
            d["warning"] = f"Best similarity {best_sim:.1f}% is below threshold {min_similarity:.0f}%"

    # Mark best in diags
    for d in diags:
        d["best"] = d["keep"] == best_keep

    return best_keep, diags


# ─────────────────────────────────────────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────────────────────────────────────────
def _b64thumb(frame: np.ndarray) -> str:
    img = Image.fromarray((frame * 255).clip(0, 255).astype(np.uint8))
    img.thumbnail((THUMB_W, THUMB_H), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=72)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

class Session:
    def __init__(self, path: str):
        self.path     = path
        self.sid      = hashlib.md5(f"{path}{time.time()}".encode()).hexdigest()[:8]
        self.name     = Path(path).stem[:28]
        self.info     = get_video_info(path)
        self.fps      = self.info["fps"]
        self.frames: list  = []
        self.thumbs: list  = []
        self.loop_frames: list = []
        self.loop_thumbs: list = []
        self.keep     = 0
        self.diags    = []
        self.out_path: Optional[str] = None
        self.error    = ""

    def load(self, max_frames=0):
        self.frames = extract_frames(self.path, max_frames)
        self.thumbs = [_b64thumb(f) for f in self.frames]

    def process(self, **kw):
        self.keep, self.diags = find_loop_point(self.frames, **kw)
        self.loop_frames = self.frames[:self.keep]
        self.loop_thumbs = self.thumbs[:self.keep]

    def export(self, pix_fmt="yuv444p", crf=15, remove_best_frame=True) -> str:
        out = str(TEMP_DIR / f"{self.sid}_loop.mp4")
        keep = self.keep - (1 if remove_best_frame and self.keep > 3 else 0)
        try:
            save_video_copy(self.path, out, keep, self.fps)
            print(f"[export] stream copy — {keep} frames, no re-encode, remove_best={remove_best_frame}")
        except Exception as e:
            print(f"[export] copy failed ({e}), falling back to re-encode")
            save_video(self.loop_frames[:keep], out, self.fps, pix_fmt, crf)
        self.out_path = out
        return out

    def metadata(self) -> dict:
        return {
            "source": self.path,
            "fps": self.fps,
            "original_frames": len(self.frames),
            "loop_frames": self.keep,
            "cropped": len(self.frames) - self.keep,
            "method": "autocrop",
            "diagnostics": self.diags,
        }

# Global session store
_sessions: dict[str, Session] = {}
_tab_ids: list[str] = []          # ordered list of session IDs
_watch_thread = None
_watch_observer = None


# ─────────────────────────────────────────────────────────────────────────────
# FRAME BROWSER HTML
# ─────────────────────────────────────────────────────────────────────────────
BROWSER_CSS = """
<style>
  #cl-browser { background:#0c0c0c; border:1px solid #222; border-radius:6px;
                padding:10px; user-select:none; outline:none; }
  #cl-browser:focus { border-color:#444; }
  #cl-strip { display:flex; gap:4px; overflow-x:auto; padding:4px 2px 8px;
              scrollbar-width:thin; scrollbar-color:#333 #0c0c0c; }
  #cl-strip::-webkit-scrollbar { height:4px; }
  #cl-strip::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
  .cl-thumb { flex-shrink:0; cursor:pointer; border:2px solid transparent;
              border-radius:3px; overflow:hidden; position:relative; }
  .cl-thumb img { display:block; width:160px; height:90px; object-fit:cover; }
  .cl-thumb.active { border-color:#00c8c8; box-shadow:0 0 8px rgba(0,200,200,.3); }
  .cl-thumb:hover { border-color:#555; }
  .cl-idx { position:absolute; bottom:2px; right:3px; font-size:9px;
            color:rgba(255,255,255,.5); font-family:monospace; }
  #cl-status { font-family:monospace; font-size:11px; color:#666;
               padding:4px 2px; letter-spacing:1px; }
</style>
"""

def make_browser_html(thumbs: list, current: int = 0, label: str = "ORIGINAL") -> str:
    if not thumbs:
        return "<div style='color:#444;padding:20px;font-family:monospace'>No frames loaded</div>"
    items = ""
    for i, b64 in enumerate(thumbs):
        cls = "cl-thumb active" if i == current else "cl-thumb"
        items += f'<div class="{cls}" data-i="{i}" onclick="clSelect({i})" id="cl-t-{i}"><img src="{b64}" loading="lazy"><span class="cl-idx">{i+1}</span></div>'
    total = len(thumbs)
    return f"""
{BROWSER_CSS}
<div id="cl-browser" tabindex="0">
  <div id="cl-status">[ {label} ] &nbsp; frame <span id="cl-cur">{current+1}</span> / {total}</div>
  <div id="cl-strip">{items}</div>
</div>
<script>
(function(){{
  var cur = {current};
  var total = {total};
  function clSelect(i) {{
    if (i < 0) i = 0;
    if (i >= total) i = total-1;
    var prev = document.getElementById('cl-t-' + cur);
    if (prev) prev.classList.remove('active');
    cur = i;
    var el = document.getElementById('cl-t-' + cur);
    if (el) {{ el.classList.add('active'); el.scrollIntoView({{behavior:'smooth',block:'nearest',inline:'nearest'}}); }}
    var c = document.getElementById('cl-cur');
    if (c) c.textContent = cur + 1;
  }}
  window.clSelect = clSelect;
  var b = document.getElementById('cl-browser');
  if (b) {{
    b.addEventListener('keydown', function(e) {{
      if (e.key === 'ArrowRight') {{ e.preventDefault(); clSelect(cur+1); }}
      else if (e.key === 'ArrowLeft') {{ e.preventDefault(); clSelect(cur-1); }}
    }});
    b.focus();
  }}
  // Also attach to document so arrow keys work when strip is hovered
  document.addEventListener('mousemove', function(e) {{
    var el = document.getElementById('cl-strip');
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {{
      if (document.activeElement !== b) b.focus();
    }}
  }});
}})();
</script>
"""


# ─────────────────────────────────────────────────────────────────────────────
# TAB HTML
# ─────────────────────────────────────────────────────────────────────────────
def make_tab_bar_html(tab_ids: list, active: str) -> str:
    if not tab_ids:
        return ""
    tabs_html = ""
    for sid in tab_ids:
        sess = _sessions.get(sid)
        name = sess.name if sess else sid
        active_cls = "cl-tab active" if sid == active else "cl-tab"
        tabs_html += f'<div class="{active_cls}" onclick="selectTab(\'{sid}\')" title="{name}">{name[:18]}</div>'
    return f"""
<style>
  #cl-tabbar {{ display:flex; gap:2px; overflow-x:auto; padding:4px;
               background:#0a0a0a; border-bottom:1px solid #1a1a1a;
               scrollbar-width:thin; scrollbar-color:#333 #0a0a0a; }}
  #cl-tabbar::-webkit-scrollbar {{ height:3px; }}
  .cl-tab {{ padding:5px 12px; font-size:11px; font-family:monospace;
             color:#555; cursor:pointer; border-radius:4px 4px 0 0;
             border:1px solid transparent; border-bottom:none;
             white-space:nowrap; transition:all .15s; letter-spacing:.5px; }}
  .cl-tab:hover {{ color:#ccc; background:#111; }}
  .cl-tab.active {{ color:#ccc; background:#141414; border-color:#222; }}
</style>
<div id="cl-tabbar">{tabs_html}</div>
<script>
function selectTab(sid) {{
  document.querySelectorAll('.cl-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  // Trigger Gradio hidden button
  var btn = document.getElementById('cl-switchtab-' + sid);
  if (btn) btn.click();
}}
</script>
"""


# ─────────────────────────────────────────────────────────────────────────────
# WATCHER
# ─────────────────────────────────────────────────────────────────────────────
_watch_queue: list = []
_watch_lock = threading.Lock()

class VideoHandler(FileSystemEventHandler):
    def __init__(self, extensions=(".mp4", ".webm")):
        self.exts = extensions
        self._seen = set()

    def on_created(self, event):
        if event.is_directory:
            return
        p = Path(event.src_path)
        if p.suffix.lower() in self.exts and p not in self._seen:
            self._seen.add(p)
            time.sleep(1.5)   # wait for file to finish writing
            with _watch_lock:
                _watch_queue.append(str(p))

def start_watcher(folder: str):
    global _watch_observer, _watch_thread
    if _watch_observer:
        _watch_observer.stop()
    handler = VideoHandler()
    obs = Observer()
    obs.schedule(handler, folder, recursive=True)
    obs.start()
    _watch_observer = obs

def stop_watcher():
    global _watch_observer
    if _watch_observer:
        _watch_observer.stop()
        _watch_observer = None


# ─────────────────────────────────────────────────────────────────────────────
# CORE ACTIONS
# ─────────────────────────────────────────────────────────────────────────────
def load_video_file(file_obj, state: dict) -> tuple:
    """Load video, extract frames, return initial browser HTML."""
    if file_obj is None:
        return state, gr.update(visible=False), "", gr.update(), gr.update()

    # With type="filepath", Gradio passes the path string directly
    path = str(file_obj)
    # Normalize Windows paths
    path = os.path.normpath(path)
    try:
        print(f"[load] path received: {repr(path)}")
        print(f"[load] file exists: {os.path.isfile(path)}")
        sess = Session(path)
        sess.load()
        sid = sess.sid
        _sessions[sid] = sess

        if sid not in _tab_ids:
            if len(_tab_ids) >= MAX_TABS:
                old = _tab_ids.pop(0)
                _sessions.pop(old, None)
            _tab_ids.append(sid)

        state["active"] = sid
        state["show_loop"] = False

        info = f"{sess.name} · {len(sess.frames)} frames · {sess.fps:.1f}fps · {sess.info['width']}×{sess.info['height']}"
        choices = [_sessions[s].name for s in _tab_ids if s in _sessions]
        return state, gr.update(visible=False), info, gr.update(choices=choices, value=sess.name), gr.update(value="▷ Process Loop", interactive=True)
    except Exception as e:
        return state, gr.update(visible=False), f"Error: {e}", gr.update(), gr.update()


def process_loop(state: dict,
                 max_crop: int, method: str,
                 seam_window: int, ref_frames: int,
                 w_match: float, w_smooth: float,
                 pix_fmt: str, crf: int,
                 remove_best_frame: bool = True) -> tuple:
    sid = state.get("active")
    if not sid or sid not in _sessions:
        return state, gr.update(value=None, visible=False), ""

    sess = _sessions[sid]
    try:
        sess.process(
            max_crop=max_crop, method=method,
            seam_window=seam_window, ref_frames=ref_frames,
            weight_match=w_match, weight_smooth=w_smooth,
        )
        out = sess.export(pix_fmt=pix_fmt, crf=crf, remove_best_frame=remove_best_frame)
        state["show_loop"] = True

        best_d = next((d for d in sess.diags if d.get("best")), None)
        best_sim = best_d["similarity_%"] if best_d else 0
        warning = best_d.get("warning", "") if best_d else ""
        kept = sess.keep - (1 if remove_best_frame and sess.keep > 3 else 0)
        info = f"Loop: {kept} frames (−{len(sess.frames)-kept})  ·  Best match: {best_sim:.2f}%"
        if warning:
            info += f"\n⚠ {warning}"
        diag_lines = "\n".join(
            f"  frame {d['frame_idx']:3d}  keep={d['keep']:3d}  {d['similarity_%']:6.2f}%  {'✓' if d['above_threshold'] else '✗'}" +
            (" ← BEST" if d.get("best") else "")
            for d in sess.diags
        )
        info += f"\n\n{diag_lines}"
        return state, gr.update(value=out, visible=True), info
    except Exception as e:
        return state, gr.update(value=None, visible=False), f"Error: {e}"


def toggle_frames(state: dict) -> tuple:
    sid = state.get("active")
    if not sid or sid not in _sessions:
        return state, gr.update()
    sess = _sessions[sid]
    show_loop = not state.get("show_loop", False)
    state["show_loop"] = show_loop
    if show_loop and sess.loop_thumbs:
        html = make_browser_html(sess.loop_thumbs, 0, f"LOOP — {sess.keep} frames")
        label = "▶ Show Original"
    else:
        html = make_browser_html(sess.thumbs, 0, "ORIGINAL")
        label = "▶ Show Loop"
    return state, gr.update(value=html), gr.update(value=label)


def switch_tab(sid: str, state: dict) -> tuple:
    if sid not in _sessions:
        return state, gr.update(), gr.update(), gr.update()
    sess = _sessions[sid]
    state["active"] = sid
    state["show_loop"] = False
    info = f"{sess.name} · {len(sess.frames)} frames · {sess.fps:.1f}fps"
    out_update = gr.update(value=sess.out_path, visible=bool(sess.out_path))
    choices = [_sessions[s].name for s in _tab_ids if s in _sessions]
    return state, out_update, gr.update(value=info), gr.update(choices=choices, value=sess.name)


def toggle_watcher(enabled: bool, folder: str) -> str:
    if not HAS_WATCHDOG:
        return "⚠ watchdog not installed: pip install watchdog"
    if enabled:
        if not folder or not Path(folder).exists():
            return f"⚠ Folder not found: {folder}"
        start_watcher(folder)
        return f"✓ Watching: {folder}"
    else:
        stop_watcher()
        return "● Watcher off"


def check_watch_queue(state: dict) -> tuple:
    """Called periodically to pick up auto-watched videos."""
    with _watch_lock:
        if not _watch_queue:
            return state, gr.update(), gr.update(), gr.update()
        path = _watch_queue.pop(0)

    try:
        print(f"[load] path received: {repr(path)}")
        print(f"[load] file exists: {os.path.isfile(path)}")
        sess = Session(path)
        sess.load()
        sid = sess.sid
        _sessions[sid] = sess
        if sid not in _tab_ids:
            if len(_tab_ids) >= MAX_TABS:
                old = _tab_ids.pop(0)
                _sessions.pop(old, None)
            _tab_ids.append(sid)
        state["active"] = sid
        state["show_loop"] = False
        info = f"[AUTO] {sess.name} · {len(sess.frames)} frames"
        choices = [_sessions[s].name for s in _tab_ids if s in _sessions]
        return state, gr.update(), gr.update(value=info), gr.update(choices=choices, value=sess.name)
    except Exception as e:
        return state, gr.update(), gr.update(value=f"Watch error: {e}"), gr.update()


def save_with_metadata(state: dict) -> tuple:
    sid = state.get("active")
    if not sid or sid not in _sessions:
        return None, None
    sess = _sessions[sid]
    if not sess.out_path:
        return None, None
    meta_path = sess.out_path.replace(".mp4", "_meta.json")
    with open(meta_path, "w") as f:
        json.dump(sess.metadata(), f, indent=2)
    return gr.update(value=sess.out_path), gr.update(value=meta_path)


def restore_from_files(video_file, meta_file, state: dict) -> tuple:
    """Restore a session from a saved video + metadata JSON."""
    if video_file is None:
        return state, gr.update(), "", gr.update()
    path = video_file.name if hasattr(video_file, "name") else str(video_file)
    try:
        sess = Session(path)
        sess.load()

        if meta_file:
            mp = meta_file.name if hasattr(meta_file, "name") else str(meta_file)
            with open(mp) as f:
                meta = json.load(f)
            # Restore loop result from metadata
            keep = meta.get("loop_frames", len(sess.frames))
            sess.keep = keep
            sess.loop_frames = sess.frames[:keep]
            sess.loop_thumbs = sess.thumbs[:keep]
            sess.diags = meta.get("diagnostics", [])
            sess.process = lambda **kw: None  # already processed

        sid = sess.sid
        _sessions[sid] = sess
        if sid not in _tab_ids:
            if len(_tab_ids) >= MAX_TABS:
                old = _tab_ids.pop(0)
                _sessions.pop(old, None)
            _tab_ids.append(sid)

        state["active"] = sid
        state["show_loop"] = False
        info = f"[RESTORED] {sess.name} · {len(sess.frames)} frames"
        choices = [_sessions[s].name for s in _tab_ids if s in _sessions]
        out_update = gr.update(value=sess.out_path, visible=bool(sess.out_path))
        return state, out_update, info, gr.update(choices=choices, value=sess.name)
    except Exception as e:
        return state, gr.update(), f"Restore error: {e}", gr.update()


# ─────────────────────────────────────────────────────────────────────────────
# UI
# ─────────────────────────────────────────────────────────────────────────────
CSS = """
* { box-sizing: border-box; }
body, .gradio-container { background: #0e0e0e !important; color: #ccc; font-family: 'Courier New', monospace; }
.gr-button { font-family: 'Courier New', monospace !important; letter-spacing: 1px !important; }
.gr-button-primary { background: #1a1a1a !important; border: 1px solid #333 !important; color: #ccc !important; }
.gr-button-primary:hover { border-color: #888 !important; color: #fff !important; }
.panel-label { font-size: 9px; letter-spacing: 2px; color: #444; text-transform: uppercase; margin-bottom: 6px; }
input[type=range] { accent-color: #00c8c8; }
.gr-accordion { background: #111 !important; border: 1px solid #1e1e1e !important; border-radius: 6px !important; }
h1 { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 4px; color: #aaa; font-weight: normal; }
"""

def build_app():
    cfg = load_config()
    saved_watch_folder = cfg.get("watch_folder", "")

    with gr.Blocks(title="Capitan Loop") as app:
        state = gr.State({"active": None, "show_loop": False})

        gr.HTML("<h1>◈ CAPITAN LOOP</h1>")

        # ── Session bar ──
        with gr.Row():
            tab_selector = gr.Dropdown(choices=[], label="Open sessions",
                                       interactive=True, scale=4, allow_custom_value=False)
            new_session_btn = gr.Button("＋ New", scale=0, min_width=70)
            tab_refresh     = gr.Button("↻",     scale=0, min_width=40)

        with gr.Row():
            # ── Left panel ──────────────────────────────────────────────────
            with gr.Column(scale=1, min_width=280):
                gr.HTML("<div class='panel-label'>Input</div>")
                video_in = gr.File(label="Drop video", file_types=["video"], type="filepath")
                info_box = gr.Textbox(label="", lines=1, interactive=False, show_label=False,
                                      placeholder="No video loaded")

                # Auto-watch — above loop params, collapsed by default
                with gr.Accordion("👁 Auto-watch (ComfyUI output)", open=False):
                    if not HAS_WATCHDOG:
                        gr.HTML("<div style='color:#f55;font-size:11px'>pip install watchdog to enable</div>")
                    watch_folder = gr.Textbox(label="ComfyUI output folder path",
                                              value=saved_watch_folder,
                                              placeholder="C:/ComfyUI/output")
                    watch_enable = gr.Checkbox(label="Enable auto-watch", value=False)
                    auto_process = gr.Checkbox(label="Auto-process loop on new video", value=True)
                    watch_status = gr.Textbox(value="● Watcher off", show_label=False,
                                             interactive=False, lines=1)

                with gr.Accordion("⚙ Loop Parameters", open=True):
                    max_crop   = gr.Slider(1, 120, value=20, step=1,
                                           label="Search range (last N frames to check)")
                    w_match    = gr.Slider(0.5, 1.0, value=0.9, step=0.01,
                                           label="Min similarity threshold (0.9 = 90%)")
                    remove_best_frame = gr.Checkbox(label="Remove best-match frame from output", value=True)
                    # hidden but required for function signature
                    method     = gr.Radio(["L1"], value="L1", visible=False)
                    seam_win   = gr.Slider(1, 6, value=2, visible=False)
                    ref_frames = gr.Slider(2, 20, value=8, visible=False)
                    w_smooth   = gr.Slider(0, 1, value=0.3, visible=False)

                with gr.Accordion("🎬 Export format", open=False):
                    pix_fmt = gr.Radio(["yuv444p", "yuv420p"], value="yuv444p",
                                       label="Pixel format")
                    crf     = gr.Slider(0, 40, value=15, step=1, label="CRF")

                process_btn    = gr.Button("▷ Process Loop", variant="primary", interactive=False)
                auto_proc_hint = gr.Checkbox(label="Auto-process on load", value=True,
                                             info="Process immediately when a video is loaded")

                with gr.Accordion("📊 Diagnostics", open=False):
                    diag_box = gr.Textbox(label="", lines=10, interactive=False,
                                          show_label=False, placeholder="No diagnostics yet")

                dl_video = gr.File(label="⬇ Download loop video", visible=False, interactive=False)

                gr.HTML("<hr style='border-color:#1a1a1a;margin:12px 0'>")
                with gr.Accordion("♻ Restore session", open=False):
                    restore_vid  = gr.File(label="Video file", file_types=["video"], type="filepath")
                    restore_meta = gr.File(label="Metadata JSON (optional)",
                                          file_types=[".json"], type="filepath")
                    restore_btn  = gr.Button("Restore", variant="secondary")

            # ── Right panel: video only ──────────────────────────────────────
            with gr.Column(scale=3):
                video_out = gr.Video(label="Loop preview", visible=False,
                                     autoplay=True, loop=True)

        timer = gr.Timer(value=3.0, active=False)

        # ── Helpers ──────────────────────────────────────────────────────────
        def _get_choices():
            return [_sessions[s].name for s in _tab_ids if s in _sessions]

        def _run_process(state, max_crop, method, seam_win, ref_frames,
                         w_match, w_smooth, pix_fmt, crf, remove_best_frame):
            return process_loop(state, max_crop, method, seam_win, ref_frames,
                                w_match, w_smooth, pix_fmt, crf, remove_best_frame)

        # ── Events ───────────────────────────────────────────────────────────
        def _load_and_maybe_process(file_obj, state, auto, max_crop, method,
                                    seam_win, ref_frames, w_match, w_smooth,
                                    pix_fmt, crf, remove_best_frame):
            s, vid, info, tabs, btn = load_video_file(file_obj, state)
            if auto and s.get("active"):
                s, video_update, diag = process_loop(s, max_crop, method, seam_win,
                                                      ref_frames, w_match, w_smooth,
                                                      pix_fmt, crf, remove_best_frame)
                return s, video_update, info, tabs, btn, diag
            return s, gr.update(visible=False), info, tabs, btn, ""

        video_in.change(
            _load_and_maybe_process,
            inputs=[video_in, state, auto_proc_hint, max_crop, method,
                    seam_win, ref_frames, w_match, w_smooth, pix_fmt, crf, remove_best_frame],
            outputs=[state, video_out, info_box, tab_selector, process_btn, diag_box]
        )

        process_btn.click(
            _run_process,
            inputs=[state, max_crop, method, seam_win, ref_frames,
                    w_match, w_smooth, pix_fmt, crf, remove_best_frame],
            outputs=[state, video_out, diag_box]
        )

        # Download link appears after processing
        video_out.change(
            lambda v: gr.update(value=v, visible=bool(v)),
            inputs=[video_out],
            outputs=[dl_video]
        )

        # New session button
        def new_session(state):
            state["active"] = None
            state["show_loop"] = False
            return state, gr.update(visible=False), "", gr.update(value=None), gr.update(interactive=False)

        new_session_btn.click(
            new_session,
            inputs=[state],
            outputs=[state, video_out, info_box, tab_selector, process_btn]
        )

        # Restore
        restore_btn.click(
            restore_from_files,
            inputs=[restore_vid, restore_meta, state],
            outputs=[state, video_out, info_box, tab_selector]
        ).then(lambda: gr.update(interactive=True), outputs=[process_btn])

        # Watch folder save
        watch_folder.change(
            lambda f: save_config({"watch_folder": f}) or gr.update(),
            inputs=[watch_folder], outputs=[]
        )

        # Auto-watch
        watch_enable.change(
            toggle_watcher,
            inputs=[watch_enable, watch_folder],
            outputs=[watch_status]
        ).then(
            lambda e: gr.update(active=e),
            inputs=[watch_enable],
            outputs=[timer]
        )

        # Timer — auto-pick and optionally auto-process
        def _timer_tick(state, auto, max_crop, method, seam_win, ref_frames,
                        w_match, w_smooth, pix_fmt, crf, remove_best_frame):
            s, browser, info, tabs = check_watch_queue(state)
            # browser is now unused (no strip), but we still update state/tabs
            if auto and s.get("active") != state.get("active"):
                # new video was picked up
                s, video_update, diag = process_loop(s, max_crop, method, seam_win,
                                                      ref_frames, w_match, w_smooth,
                                                      pix_fmt, crf, remove_best_frame)
                return s, video_update, info, tabs, diag
            return s, gr.update(), info, tabs, ""

        timer.tick(
            _timer_tick,
            inputs=[state, auto_process, max_crop, method, seam_win, ref_frames,
                    w_match, w_smooth, pix_fmt, crf, remove_best_frame],
            outputs=[state, video_out, info_box, tab_selector, diag_box]
        )

        # Tab switching
        def switch_tab_dropdown(name, state):
            sid = next((s for s in _tab_ids if _sessions.get(s) and _sessions[s].name == name), None)
            if not sid:
                return state, gr.update(), gr.update(), gr.update()
            return switch_tab(sid, state)

        tab_selector.change(
            switch_tab_dropdown,
            inputs=[tab_selector, state],
            outputs=[state, video_out, info_box, tab_selector]
        )

        def refresh_tabs(state):
            choices = _get_choices()
            active = state.get("active")
            cur = _sessions[active].name if active and active in _sessions else None
            return gr.update(choices=choices, value=cur)

        tab_refresh.click(refresh_tabs, inputs=[state], outputs=[tab_selector])

    return app


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import atexit
    atexit.register(_init_temp)   # clean temp on exit

    print("=" * 50)
    print("  CAPITAN LOOP")
    print("=" * 50)
    print(f"  ffmpeg: {shutil.which('ffmpeg') or 'NOT FOUND'}")
    print(f"  watchdog: {'available' if HAS_WATCHDOG else 'not installed'}")
    print(f"  temp dir: {TEMP_DIR}")
    print("=" * 50)

    app = build_app()
    app.launch(
        server_name="127.0.0.1",
        server_port=7861,
        share=False,
        show_error=True,
        inbrowser=True,
        css=CSS,
    )
