"""
Capitan Gallery Node v8
- Lee metadata de PNG y MP4 (VHS format)
- Parser recursivo de prompt para cualquier workflow
"""
import os, re, shutil, base64, json, numpy as np
import folder_paths
from server import PromptServer
from aiohttp import web
from PIL import Image
import io

_input_image_url = None

MODEL_EXCLUDE = {"controlnet", "ipadapter", "ip_adapter", "t2i", "instantid",
                 "photomaker", "pulid", "reactor", "insight", "faceid",
                 "clipvision", "style_model", "upscale"}

def _is_model_loader(cls):
    cl = cls.lower()
    if any(ex in cl for ex in MODEL_EXCLUDE):
        return False
    return any(k in cl for k in ["unetloader", "unet_loader", "checkpointloader",
                                   "imageonlycheckpoint", "gguf"])

def _scan_output_dir():
    output_dir = folder_paths.get_output_directory()
    ext_image = {".png", ".jpg", ".jpeg", ".webp"}
    ext_video = {".mp4", ".webm", ".gif"}
    files = []
    for root, dirs, fnames in os.walk(output_dir):
        rel = os.path.relpath(root, output_dir)
        subfolder = "" if rel == "." else rel.replace("\\", "/")
        for fname in fnames:
            ext = os.path.splitext(fname)[1].lower()
            is_video = ext in ext_video
            is_image = ext in ext_image
            if not (is_video or is_image):
                continue
            fpath = os.path.join(root, fname)
            mtime = os.path.getmtime(fpath)
            ftype = "video" if is_video else "image"
            url = f"/view?filename={fname}&type=output" + (f"&subfolder={subfolder}" if subfolder else "")
            files.append({"name": fname, "subfolder": subfolder,
                          "type": ftype, "mtime": mtime, "url": url})
    files.sort(key=lambda x: x["mtime"], reverse=True)
    return files


def _extract_mp4_prompt(filepath):
    """Extrae el JSON de prompt embebido por VHS en un MP4."""
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
        idx = data.find(b'prompt')
        while idx != -1:
            chunk = data[idx:idx+2000000]
            match = re.search(rb'"(\{.{20,}\})"', chunk, re.DOTALL)
            if match:
                try:
                    raw = match.group(1).decode('utf-8')
                    # Desescapar el JSON doblemente escapado
                    unescaped = raw.replace('\\\\"', '"').replace('\\"', '"')
                    parsed = json.loads(unescaped)
                    if isinstance(parsed, dict) and len(parsed) > 2:
                        return parsed
                except Exception:
                    pass
            idx = data.find(b'prompt', idx + 1)
    except Exception as e:
        print(f"[CapitanGallery] MP4 read error: {e}")
    return None


def _extract_info(prompt_data):
    if not isinstance(prompt_data, dict):
        return {}

    result = {
        "seed": None, "steps": None, "cfg": None,
        "sampler": None, "scheduler": None,
        "positive": None, "negative": None,
        "loras": [], "models": []
    }

    # Construir mapa de nodos
    node_map = {}
    def collect(obj, depth=0):
        if depth > 6: return
        if isinstance(obj, dict):
            cls = obj.get("class_type", "")
            nid = obj.get("id")
            if cls:
                if nid is not None:
                    node_map[str(nid)] = obj
            for v in obj.values():
                collect(v, depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                collect(item, depth + 1)

    for k, v in prompt_data.items():
        if isinstance(v, dict) and v.get("class_type"):
            node_map[str(k)] = v
        collect(v)

    TEXT_INPUT_NAMES = {"text", "prompt", "caption", "string",
                        "positive_text", "negative_text",
                        "pos_g", "pos_l", "neg_g", "neg_l",
                        "text_g", "text_l", "text_0"}
    PASSTHROUGH = {"googletranslatetextnode", "googletranslatecliptextencode",
                   "showtext|pysssss", "showtext", "primitivenode"}

    def decode_str(s):
        """Decodifica unicode escapes en strings."""
        try:
            return s.encode('utf-8').decode('unicode_escape').encode('latin1').decode('utf-8')
        except Exception:
            try:
                return s.encode().decode('unicode_escape')
            except Exception:
                return s

    def resolve_text(node_id, visited=None):
        if visited is None: visited = set()
        nid = str(node_id)
        if nid in visited: return None
        visited.add(nid)
        node = node_map.get(nid)
        if not node: return None
        cls = node.get("class_type", "").lower().replace("|","").replace("-","").replace("_","")
        inputs = node.get("inputs", {})

        # 1. Buscar texto directo en inputs conocidos
        for inp_name in TEXT_INPUT_NAMES:
            val = inputs.get(inp_name)
            if isinstance(val, str) and len(val.strip()) > 2:
                return decode_str(val.strip())
            elif isinstance(val, list) and len(val) >= 1:
                text = resolve_text(str(val[0]).split(":")[0], visited.copy())
                if text: return text

        # 2. Seguir TODOS los inputs si es passthrough
        if cls in PASSTHROUGH:
            for k, v in inputs.items():
                if isinstance(v, list) and len(v) >= 1:
                    text = resolve_text(str(v[0]).split(":")[0], visited.copy())
                    if text: return text

        # 3. Buscar en widgets_values — coger el último string largo
        for w in reversed(node.get("widgets_values", [])):
            if isinstance(w, str) and len(w.strip()) > 5:
                s = w.strip()
                if not any(s.endswith(ext) for ext in [".safetensors",".gguf",".pt",".ckpt"]):
                    if s not in {"randomize","fixed","increment","gpu (much faster)","cpu","euler","simple"}:
                        return decode_str(s)
        return None

    loras_seen = set()
    models_seen = set()

    for node_id, node in node_map.items():
        cls = node.get("class_type", "")
        cls_low = cls.lower().replace("|","").replace("-","").replace("_","").replace(" ","")
        inputs = node.get("inputs", {})

        # ── KSampler ──
        if "ksampler" in cls_low:
            def gv(k):
                v = inputs.get(k)
                return v if not isinstance(v, list) else None
            if result["seed"] is None and gv("seed") is not None:
                try: result["seed"] = int(gv("seed"))
                except: pass
            if result["steps"] is None: result["steps"] = gv("steps")
            if result["cfg"] is None: result["cfg"] = gv("cfg")
            if result["sampler"] is None: result["sampler"] = gv("sampler_name")
            if result["scheduler"] is None: result["scheduler"] = gv("scheduler")
            for slot in ["positive", "negative"]:
                ref = inputs.get(slot)
                if isinstance(ref, list) and result[slot] is None:
                    text = resolve_text(str(ref[0]).split(":")[0])
                    if text: result[slot] = text

        # ── Conditioning nodes ──
        if any(c in cls_low for c in ["inpaintmodel","inpaintcond","modelsamp","conditioning"]):
            for slot in ["positive", "negative"]:
                ref = inputs.get(slot)
                if isinstance(ref, list) and result[slot] is None:
                    text = resolve_text(str(ref[0]).split(":")[0])
                    if text: result[slot] = text

        # ── WAN / video samplers que usan positive directamente ──
        if any(c in cls_low for c in ["wanvideosample","vidsample","videosample","i2vgen","wansampler"]):
            for slot in ["positive", "negative", "prompt", "negative_prompt"]:
                ref = inputs.get(slot)
                if isinstance(ref, list) and result["positive"] is None:
                    text = resolve_text(str(ref[0]).split(":")[0])
                    if text: result["positive"] = text
                elif isinstance(ref, str) and len(ref.strip()) > 2 and result["positive"] is None:
                    result["positive"] = ref.strip()

        # ── LoRAs ──
        if any(k in cls_low for k in ["loraloader","powerlora","lora loader"]):
            lname = inputs.get("lora_name")
            if isinstance(lname, str):
                basename = os.path.basename(lname.replace("\\\\", "/").replace("\\", "/"))
                if basename not in loras_seen:
                    loras_seen.add(basename)
                    strength = inputs.get("strength_model") or inputs.get("strength", 1.0)
                    if not isinstance(strength, (int, float)): strength = 1.0
                    result["loras"].append({"name": basename, "strength": round(float(strength), 2)})
            else:
                for k, v in inputs.items():
                    if k.startswith("lora_") and isinstance(v, dict):
                        ln = v.get("lora", "")
                        if ln and v.get("on", True):
                            basename = os.path.basename(ln.replace("\\\\", "/").replace("\\", "/"))
                            if basename not in loras_seen:
                                loras_seen.add(basename)
                                result["loras"].append({
                                    "name": basename,
                                    "strength": round(float(v.get("strength", 1.0)), 2)
                                })

        # ── Modelos ──
        if _is_model_loader(cls):
            for val in list(inputs.values()) + node.get("widgets_values", []):
                if isinstance(val, str):
                    for ext in [".safetensors", ".gguf", ".pt", ".ckpt", ".bin"]:
                        if val.lower().endswith(ext):
                            name = os.path.basename(val.replace("\\\\","/").replace("\\","/"))
                            if name not in models_seen:
                                models_seen.add(name)
                                result["models"].append({"name": name, "loader": cls})
                            break

    # Fallback prompt
    if result["positive"] is None:
        candidates = []
        for node in node_map.values():
            cls = node.get("class_type", "").lower()
            if not any(k in cls for k in ["textencode","textnode","cliptextencode"]):
                continue
            if any(ex in cls for ex in ["show","save","load","display","gallery","vae","clip"]):
                continue
            for inp_name in TEXT_INPUT_NAMES:
                val = node.get("inputs", {}).get(inp_name)
                if isinstance(val, str) and len(val.strip()) > 5:
                    candidates.append(val.strip())
            for wv in node.get("widgets_values", []):
                if isinstance(wv, str) and len(wv.strip()) > 5:
                    candidates.append(wv.strip())
        if candidates:
            candidates.sort(key=len, reverse=True)
            result["positive"] = candidates[0]
            if len(candidates) > 1 and result["negative"] is None:
                result["negative"] = candidates[1]

    return result


@PromptServer.instance.routes.get("/capitan_gallery/outputs")
async def get_outputs(request):
    try:
        count = int(request.rel_url.query.get("count", 15))
        return web.json_response(_scan_output_dir()[:count])
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

@PromptServer.instance.routes.get("/capitan_gallery/input_image")
async def get_input_image(request):
    return web.json_response({"url": _input_image_url})

@PromptServer.instance.routes.post("/capitan_gallery/send_to_input")
async def send_to_input(request):
    try:
        data = await request.json()
        filename = data.get("filename", "")
        subfolder = data.get("subfolder", "")
        if not filename:
            return web.json_response({"success": False, "error": "No filename"})
        output_dir = folder_paths.get_output_directory()
        input_dir = folder_paths.get_input_directory()
        src = os.path.join(output_dir, subfolder, filename) if subfolder else os.path.join(output_dir, filename)
        if not os.path.exists(src):
            return web.json_response({"success": False, "error": "File not found"})
        dst_name = "gallery_" + filename
        shutil.copy2(src, os.path.join(input_dir, dst_name))
        return web.json_response({"success": True, "input_filename": dst_name})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)})

@PromptServer.instance.routes.get("/capitan_gallery/image_info")
async def get_image_info(request):
    try:
        filename = request.rel_url.query.get("filename", "")
        subfolder = request.rel_url.query.get("subfolder", "")
        if not filename:
            return web.json_response({"error": "No filename"}, status=400)
        output_dir = folder_paths.get_output_directory()
        fpath = os.path.join(output_dir, subfolder, filename) if subfolder else os.path.join(output_dir, filename)
        if not os.path.exists(fpath):
            return web.json_response({"error": "File not found"}, status=404)

        ext = os.path.splitext(filename)[1].lower()
        prompt_data = None

        if ext in {".png", ".jpg", ".jpeg", ".webp"}:
            img = Image.open(fpath)
            raw = img.info.get("prompt")
            if raw:
                try: prompt_data = json.loads(raw)
                except: pass
        elif ext in {".mp4", ".webm"}:
            prompt_data = _extract_mp4_prompt(fpath)

        result = {"filename": filename, "found": False}
        if prompt_data:
            try:
                info = _extract_info(prompt_data)
                result.update(info)
                result["found"] = bool(any([
                    info.get("seed"), info.get("positive"),
                    info.get("loras"), info.get("models")
                ]))
            except Exception as e:
                result["parse_error"] = str(e)
        return web.json_response(result)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


class CapitanGallery:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "optional": {
                "count": ("INT", {"default": 15, "min": 5, "max": 50}),
                "input_image": ("IMAGE",),
            }
        }
    RETURN_TYPES = ()
    FUNCTION = "show"
    CATEGORY = "Capitan/Utils"
    OUTPUT_NODE = True

    def show(self, count=15, input_image=None):
        global _input_image_url
        if input_image is not None:
            try:
                arr = (input_image[0].cpu().numpy() * 255).clip(0, 255).astype(np.uint8)
                pil = Image.fromarray(arr)
                pil.thumbnail((1024, 1024), Image.LANCZOS)
                buf = io.BytesIO()
                pil.save(buf, format="PNG")
                _input_image_url = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
            except Exception as e:
                print(f"[CapitanGallery] Error: {e}")
                _input_image_url = None
        else:
            _input_image_url = None
        return {"ui": {"gallery_refresh": [count]}}

NODE_CLASS_MAPPINGS = {"CapitanGallery": CapitanGallery}
NODE_DISPLAY_NAME_MAPPINGS = {"CapitanGallery": "🖼️ Capitan Gallery"}
WEB_DIRECTORY = "./web"
