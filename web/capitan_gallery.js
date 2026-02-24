import { app } from "../../../scripts/app.js";

const ICON_DL   = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><line x1="6.5" y1="1" x2="6.5" y2="8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><polyline points="3,6 6.5,9.5 10,6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><line x1="2" y1="12" x2="11" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ICON_SEND = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="4,8 1,8 1,12 12,12 12,8 9,8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="6.5" y1="1" x2="6.5" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><polyline points="4,3.5 6.5,1 9,3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_INFO = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.3"/><line x1="6.5" y1="5.5" x2="6.5" y2="9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="6.5" cy="3.5" r="0.9" fill="currentColor"/></svg>`;
const ICON_H    = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="3.5" height="10" rx="1" fill="currentColor" opacity="0.8"/><rect x="5.25" y="2" width="3.5" height="10" rx="1" fill="currentColor" opacity="0.8"/><rect x="9.5" y="2" width="3.5" height="10" rx="1" fill="currentColor" opacity="0.8"/></svg>`;
const ICON_V    = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="3.5" rx="1" fill="currentColor" opacity="0.8"/><rect x="2" y="5.25" width="10" height="3.5" rx="1" fill="currentColor" opacity="0.8"/><rect x="2" y="9.5" width="10" height="3.5" rx="1" fill="currentColor" opacity="0.8"/></svg>`;
const ICON_G    = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.8"/><rect x="7.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.8"/><rect x="1" y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.8"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" opacity="0.8"/></svg>`;
const ICON_BIG  = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3" opacity="0.5"/><rect x="4.5" y="4.5" width="8.5" height="8.5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>`;

const STYLE = `
  .cg-wrap{width:100%;height:100%;background:#141414;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;font-family:'Courier New',monospace;box-sizing:border-box;}
  .cg-header{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#1a1a1a;border-bottom:1px solid #2a2a2a;flex-shrink:0;}
  .cg-title{color:#888;font-size:10px;letter-spacing:2px;text-transform:uppercase;}
  .cg-hbtns{display:flex;gap:5px;align-items:center;}
  .cg-hbtn{background:none;border:1px solid #2e2e2e;color:#555;width:26px;height:22px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;padding:0;}
  .cg-hbtn:hover{border-color:#888;color:#ccc;}
  .cg-hbtn.on{border-color:#666;color:#ccc;background:#252525;}
  .cg-refresh{background:none;border:1px solid #2e2e2e;color:#555;font-size:13px;padding:2px 7px;border-radius:4px;cursor:pointer;transition:all 0.2s;}
  .cg-refresh:hover{border-color:#888;color:#ccc;}

  .cg-strip{display:flex;flex-direction:row;gap:6px;padding:8px;overflow-x:auto;overflow-y:hidden;flex:1;align-items:flex-start;scrollbar-width:thin;scrollbar-color:#333 #141414;box-sizing:border-box;}
  .cg-strip::-webkit-scrollbar{height:4px;width:4px;}
  .cg-strip::-webkit-scrollbar-track{background:#141414;}
  .cg-strip::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
  .cg-strip.cg-v{flex-direction:column;overflow-x:hidden;overflow-y:auto;align-items:stretch;}
  .cg-strip.cg-v .cg-item{flex-direction:row;align-items:center;gap:10px;width:100%;flex-shrink:0;}
  .cg-strip.cg-v .cg-info-bar{width:auto;min-width:100px;flex-direction:column;align-items:flex-start;gap:6px;}
  .cg-strip.cg-g{display:grid;grid-template-columns:repeat(auto-fill, var(--thumb-sz));gap:6px;padding:8px;overflow-x:hidden;overflow-y:auto;align-content:start;flex:1;}

  .cg-item{flex-shrink:0;display:flex;flex-direction:column;gap:4px;}
  .cg-thumb{border-radius:5px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color 0.2s;position:relative;background:#1e1e1e;flex-shrink:0;}
  .cg-thumb:hover{border-color:#555;}
  .cg-thumb.active{border-color:#00c8c8 !important;box-shadow:0 0 8px rgba(0,200,200,0.25);}
  .cg-thumb img,.cg-thumb video{width:100%;height:100%;object-fit:cover;display:block;}
  .cg-badge{position:absolute;bottom:3px;right:3px;background:rgba(0,0,0,0.7);color:#aaa;font-size:8px;padding:1px 4px;border-radius:3px;letter-spacing:1px;}
  .cg-cmp-btn{position:absolute;top:6px;left:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.32);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;user-select:none;backdrop-filter:blur(3px);}
  .cg-cmp-btn:hover{background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.9);}
  .cg-orig-overlay{position:absolute;inset:0;z-index:9;display:none;pointer-events:none;}
  .cg-orig-overlay img{width:100%;height:100%;object-fit:cover;}
  .cg-info-bar{display:flex;align-items:center;justify-content:space-between;padding:3px 4px;box-sizing:border-box;}
  .cg-time{color:#555;font-size:9px;letter-spacing:1px;white-space:nowrap;}
  .cg-time.on{color:#888;}
  .cg-actions{display:flex;gap:5px;align-items:center;}
  .cg-action-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);width:26px;height:26px;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;text-decoration:none;}
  .cg-action-btn:hover{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.85);border-color:rgba(255,255,255,0.25);}
  .cg-action-btn.info-btn:hover{color:#f7c97e;border-color:#f7c97e;}
  .cg-empty{color:#444;font-size:11px;text-align:center;width:100%;letter-spacing:1px;padding-top:24px;}

  /* LIGHTBOX */
  .cg-lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);}
  .cg-lb-inner{position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;}
  .cg-lb-row{display:flex;align-items:center;gap:16px;}
  .cg-lb-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:visible;border-radius:8px;}
  .cg-lb-media{border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,0.8);display:block;transition:transform 0.15s ease;transform-origin:center center;max-width:75vw;max-height:74vh;}
  .cg-lb-orig{position:absolute;inset:0;display:none;border-radius:8px;overflow:hidden;pointer-events:none;}
  .cg-lb-orig img{width:100%;height:100%;object-fit:contain;}
  .cg-lb-cmp{position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.55);font-size:12px;padding:4px 9px;border-radius:12px;cursor:pointer;z-index:10;user-select:none;backdrop-filter:blur(4px);white-space:nowrap;}
  .cg-lb-cmp:hover{background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.9);}
  .cg-lb-nav{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:#ccc;font-size:22px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cg-lb-nav:hover{background:rgba(255,255,255,0.15);color:#fff;}
  .cg-lb-close{position:absolute;top:-40px;right:0;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);color:#aaa;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;}
  .cg-lb-close:hover{color:#fff;background:rgba(255,255,255,0.15);}
  .cg-lb-zoom-hint{position:absolute;bottom:8px;right:8px;color:rgba(255,255,255,0.25);font-size:9px;letter-spacing:1px;pointer-events:none;}
  .cg-lb-footer{width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 4px 0;box-sizing:border-box;}
  .cg-lb-info,.cg-lb-time{color:#555;font-size:10px;letter-spacing:1px;font-family:'Courier New',monospace;}
  .cg-lb-actions{display:flex;gap:8px;}
  .cg-lb-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.45);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:5px;transition:all 0.15s;text-decoration:none;font-family:'Courier New',monospace;}
  .cg-lb-btn:hover{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);border-color:rgba(255,255,255,0.3);}
  .cg-lb-btn.send:hover{color:#7eb8f7;border-color:#7eb8f7;}
  .cg-lb-btn.info:hover{color:#f7c97e;border-color:#f7c97e;}

  /* INFO MODAL */
  .cg-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);}
  .cg-modal{background:#1a1a1a;border:1px solid #2e2e2e;border-radius:10px;width:580px;max-height:82vh;overflow-y:auto;padding:20px;box-sizing:border-box;font-family:'Courier New',monospace;scrollbar-width:thin;scrollbar-color:#333 #1a1a1a;}
  .cg-modal::-webkit-scrollbar{width:4px;}
  .cg-modal::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
  .cg-modal-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .cg-modal-title{color:#bbb;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
  .cg-modal-x{background:none;border:1px solid #333;color:#666;width:24px;height:24px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;}
  .cg-modal-x:hover{color:#ccc;border-color:#888;}
  .cg-modal-sec{margin-bottom:14px;}
  .cg-modal-lbl{color:#555;font-size:9px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
  .cg-modal-val{color:#ccc;font-size:11px;line-height:1.6;background:#111;border:1px solid #222;border-radius:5px;padding:8px 10px;white-space:pre-wrap;word-break:break-word;max-height:120px;overflow-y:auto;}
  .cg-modal-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
  .cg-modal-chip{background:#111;border:1px solid #2a2a2a;border-radius:4px;color:#888;font-size:10px;padding:4px 8px;}
  .cg-modal-chip span{color:#ccc;}
  .cg-modal-lora{background:#111;border:1px solid #2a2a2a;border-radius:5px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
  .cg-modal-lora-name{color:#bbb;font-size:10px;word-break:break-all;}
  .cg-modal-lora-str{color:#7eb8f7;font-size:10px;flex-shrink:0;margin-left:8px;}
  .cg-modal-model{background:#111;border:1px solid #2a2a2a;border-radius:5px;padding:6px 10px;margin-bottom:4px;color:#bbb;font-size:10px;word-break:break-all;}
  .cg-modal-empty{color:#444;font-size:11px;text-align:center;padding:30px;letter-spacing:1px;}
`;

function injectStyles() {
  if (document.getElementById("cg-style")) return;
  const s = document.createElement("style"); s.id = "cg-style"; s.textContent = STYLE;
  document.head.appendChild(s);
}

// ── Timing + compare map global ───────────────────────────────
const _times = {};
const _compareMap = {}; // filename → inputImageUrl en el momento de generación
let _execStart = null, _pending = null;
const _widgets = new Set();

function refreshAll() { _widgets.forEach(w => w._fetchInput().then(() => w.refresh())); }

function setupListeners() {
  app.api.addEventListener("execution_start", () => { _execStart = performance.now(); });

  app.api.addEventListener("execution_success", () => {
    if (_execStart !== null) {
      _pending = { t: ((performance.now() - _execStart) / 1000).toFixed(1), ts: Date.now() };
      _execStart = null;
    }
    // Capturar el inputUrl actual ANTES del refresh (todavía refleja la imagen usada)
    const snapUrl = _widgets.size ? [..._widgets][0].inputUrl : null;
    refreshAll().then?.(() => {});
    // Asignar al archivo más nuevo después de un tick
    setTimeout(() => {
      _widgets.forEach(w => {
        if (w.files.length) {
          const fname = w.files[0].name;
          if (snapUrl && !_compareMap[fname]) _compareMap[fname] = snapUrl;
        }
      });
    }, 500);
  });

  app.api.addEventListener("executed", (e) => {
    const out = e?.detail?.output;
    if (!out) return;
    const elapsed = _execStart !== null ? ((performance.now() - _execStart) / 1000).toFixed(1) : null;
    if (elapsed) {
      const fname = out?.images?.[0]?.filename || out?.gifs?.[0]?.filename;
      if (fname) {
        _times[fname] = elapsed;
        // Guardar inputUrl vigente para este output
        _widgets.forEach(w => { if (w.inputUrl && !_compareMap[fname]) _compareMap[fname] = w.inputUrl; });
      }
      if (!_pending) _pending = { t: elapsed, ts: Date.now() };
    }
    refreshAll();
  });
}

// ── Layouts ───────────────────────────────────────────────────
const LAYOUTS = ["h","v","g"];
const LAYOUT_ICONS = { h: ICON_H, v: ICON_V, g: ICON_G };
const LAYOUT_TIPS  = { h: "Switch to Vertical", v: "Switch to Grid", g: "Switch to Horizontal" };
const THUMB_STEPS  = [220, 320, 420, 520];

class CG {
  constructor(node) {
    this.node = node;
    this.files = [];
    this.lbIdx = -1;   // -1 = ninguna seleccionada
    this.lbEl = null;
    this.inputUrl = null;
    this._layout = "h";
    this._sz = 320;
    this._lbZoom = 1;
    this._hovered = false;
    injectStyles();
    this._build();
    this.refresh();
    this._fetchInput();
    this._setupKeys();
    _widgets.add(this);
  }

  destroy() { _widgets.delete(this); document.removeEventListener("keydown", this._docKey, true); }

  // ── Teclado nodo seleccionado (scroll strip) ──────────────
  _setupKeys() {
    this._docKey = (e) => {
      if (this.lbEl) return; // lightbox tiene su propio handler
      const sel = app.canvas?.selected_nodes;
      const isSelected = sel && Object.values(sel).some(n => n === this.node);
      if (!this._hovered && !isSelected) return;
      if (!this.files.length) return;

      const horiz = this._layout === "h";
      const step = Math.max(120, this._sz * 0.4);
      let moved = false;

      if (horiz && e.key === "ArrowRight") { this.strip.scrollBy({ left: step, behavior: "smooth" }); moved = true; }
      else if (horiz && e.key === "ArrowLeft") { this.strip.scrollBy({ left: -step, behavior: "smooth" }); moved = true; }
      else if (!horiz && e.key === "ArrowDown") { this.strip.scrollBy({ top: step, behavior: "smooth" }); moved = true; }
      else if (!horiz && e.key === "ArrowUp") { this.strip.scrollBy({ top: -step, behavior: "smooth" }); moved = true; }

      if (moved) { e.preventDefault(); e.stopPropagation(); }
    };
    // capture=true: interceptar antes que LiteGraph para evitar cambio de nodo seleccionado
    document.addEventListener("keydown", this._docKey, true);
  }



  async _fetchInput() {
    try {
      const r = await fetch("/capitan_gallery/input_image");
      this.inputUrl = (await r.json()).url || null;
    } catch { this.inputUrl = null; }
  }

  // ── Construir UI ──────────────────────────────────────────
  _build() {
    const wrap = document.createElement("div"); wrap.className = "cg-wrap";

    // Redirigir wheel al canvas de ComfyUI para zoom
    wrap.addEventListener("mouseenter", () => { this._hovered = true; });
    wrap.addEventListener("mouseleave", () => { this._hovered = false; });
    wrap.addEventListener("wheel", (e) => {
      if (this.lbEl) return; // lightbox maneja su propio zoom
      const canvas = document.querySelector("canvas#graph-canvas") || document.querySelector("canvas");
      if (canvas) {
        const evt = new WheelEvent("wheel", {
          deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ,
          deltaMode: e.deltaMode, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey,
          altKey: e.altKey, metaKey: e.metaKey,
          clientX: e.clientX, clientY: e.clientY,
          bubbles: true, cancelable: true
        });
        canvas.dispatchEvent(evt);
      }
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    // Header
    const hdr = document.createElement("div"); hdr.className = "cg-header";
    const title = document.createElement("span"); title.className = "cg-title"; title.textContent = "Recent Outputs";
    const btns = document.createElement("div"); btns.className = "cg-hbtns";

    this._layoutBtn = document.createElement("button"); this._layoutBtn.className = "cg-hbtn";
    this._layoutBtn.innerHTML = LAYOUT_ICONS[this._layout]; this._layoutBtn.title = LAYOUT_TIPS[this._layout];
    this._layoutBtn.onclick = () => this._cycleLayout(); btns.appendChild(this._layoutBtn);
    // Aplicar estado guardado al botón
    this._layoutBtn.innerHTML = LAYOUT_ICONS[this._layout];
    this._layoutBtn.title = LAYOUT_TIPS[this._layout];
    this._layoutBtn.classList.toggle("on", this._layout !== "h");

    this._sizeBtn = document.createElement("button"); this._sizeBtn.className = "cg-hbtn";
    this._sizeBtn.innerHTML = ICON_BIG; this._sizeBtn.title = `Size: ${this._sz}px (click to cycle)`;
    this._sizeBtn.onclick = () => this._cycleSize(); btns.appendChild(this._sizeBtn);

    const ref = document.createElement("button"); ref.className = "cg-refresh"; ref.textContent = "↻";
    ref.title = "Refresh"; ref.onclick = () => { this.refresh(); this._fetchInput(); }; btns.appendChild(ref);

    hdr.appendChild(title); hdr.appendChild(btns);
    this.strip = document.createElement("div"); this.strip.className = "cg-strip";
    wrap.appendChild(hdr); wrap.appendChild(this.strip);
    this.node.addDOMWidget("gallery_display", "div", wrap, { getValue: () => null, setValue: () => {} });
  }

  _cycleLayout() {
    const next = LAYOUTS[(LAYOUTS.indexOf(this._layout) + 1) % LAYOUTS.length];
    this._layout = next;
    this.strip.className = "cg-strip" + (next === "v" ? " cg-v" : next === "g" ? " cg-g" : "");
    this._layoutBtn.innerHTML = LAYOUT_ICONS[next]; this._layoutBtn.title = LAYOUT_TIPS[next];
    this._layoutBtn.classList.toggle("on", next !== "h");
    this._saveConfig();
    this._applySize();
  }

  _cycleSize() {
    const idx = THUMB_STEPS.indexOf(this._sz);
    this._sz = THUMB_STEPS[(idx + 1) % THUMB_STEPS.length];
    this._sizeBtn.title = `Size: ${this._sz}px`; this._saveConfig(); this._applySize();
  }

  applyConfig(cfg) {
    if (!cfg) return;
    if (cfg.layout && LAYOUTS.includes(cfg.layout)) this._layout = cfg.layout;
    if (cfg.sz && THUMB_STEPS.includes(cfg.sz)) this._sz = cfg.sz;
    // Actualizar botones
    this._layoutBtn.innerHTML = LAYOUT_ICONS[this._layout];
    this._layoutBtn.title = LAYOUT_TIPS[this._layout];
    this._layoutBtn.classList.toggle("on", this._layout !== "h");
    this._sizeBtn.title = `Size: ${this._sz}px (click to cycle)`;
    // Re-render con la config restaurada
    this._render();
  }

  _saveConfig() {
    if (!this.node.properties) this.node.properties = {};
    this.node.properties.cg_config = { layout: this._layout, sz: this._sz };
    // Marcar el grafo como modificado para que lo guarde
    if (app.graph) app.graph._version = (app.graph._version || 0) + 1;
  }

  _applySize() {
    const sz = this._sz;
    this.strip.style.setProperty("--thumb-sz", sz + "px");
    this.strip.querySelectorAll(".cg-thumb").forEach(t => { t.style.width = sz + "px"; t.style.height = sz + "px"; });
    this.strip.querySelectorAll(".cg-info-bar").forEach(b => { b.style.width = this._layout === "v" ? "" : sz + "px"; });
  }

  async refresh() {
    const count = this.node.widgets?.find(w => w.name === "count")?.value || 15;
    try {
      const r = await fetch(`/capitan_gallery/outputs?count=${count}`);
      this.files = await r.json();
      if (_pending && this.files.length) {
        const newest = this.files[0];
        if (!_times[newest.name] && Date.now() - _pending.ts < 20000) _times[newest.name] = _pending.t;
        _pending = null;
      }
      this._render();
    } catch { this.strip.innerHTML = `<span class="cg-empty">ERROR LOADING</span>`; }
  }

  _render() {
    this.strip.innerHTML = "";
    if (!this.files.length) { this.strip.innerHTML = `<span class="cg-empty">NO OUTPUTS YET</span>`; return; }
    this.strip.className = "cg-strip" + (this._layout === "v" ? " cg-v" : this._layout === "g" ? " cg-g" : "");
    this.strip.style.setProperty("--thumb-sz", this._sz + "px");
    const sz = this._sz;

    this.files.forEach((f, i) => {
      const item = document.createElement("div"); item.className = "cg-item";
      const thumb = document.createElement("div"); thumb.className = "cg-thumb";
      thumb.style.width = sz + "px"; thumb.style.height = sz + "px";
      thumb.title = f.subfolder ? `${f.subfolder}/${f.name}` : f.name;

      // Marcar la última abierta con borde aqua
      if (i === this.lbIdx) thumb.classList.add("active");

      if (f.type === "video") {
        const vid = document.createElement("video");
        vid.src = f.url; vid.muted = true; vid.loop = true; vid.autoplay = true; vid.playsInline = true;
        thumb.appendChild(vid);
        const badge = document.createElement("span"); badge.className = "cg-badge";
        badge.textContent = f.subfolder ? f.subfolder.toUpperCase() : "VID"; thumb.appendChild(badge);
      } else {
        const img = document.createElement("img"); img.src = f.url; img.loading = "lazy"; thumb.appendChild(img);
        // Usar la imagen guardada para este output específico, o la actual como fallback
        const compareUrl = _compareMap[f.name] || this.inputUrl;
        const ovl = document.createElement("div"); ovl.className = "cg-orig-overlay";
        const oi = document.createElement("img"); oi.src = compareUrl || ""; ovl.appendChild(oi); thumb.appendChild(ovl);
        if (compareUrl) {
          const cb = document.createElement("div"); cb.className = "cg-cmp-btn"; cb.innerHTML = "⇄"; cb.title = "Hold to compare";
          cb.addEventListener("mousedown", e => { e.stopPropagation(); e.preventDefault(); ovl.style.display = "block"; });
          const hide = e => { if (e) { e.stopPropagation(); e.preventDefault(); } ovl.style.display = "none"; };
          cb.addEventListener("mouseup", hide); cb.addEventListener("mouseleave", hide);
          cb.addEventListener("click", e => { e.stopPropagation(); e.preventDefault(); }); thumb.appendChild(cb);
        }
      }
      thumb.onclick = () => this._openLB(i);
      item.appendChild(thumb);

      const bar = document.createElement("div"); bar.className = "cg-info-bar";
      bar.style.width = this._layout === "v" ? "" : sz + "px";
      const tl = document.createElement("span"); tl.className = "cg-time";
      const t = _times[f.name];
      if (t) { tl.textContent = `⏱ ${t}s`; tl.classList.add("on"); } else tl.textContent = "⏱ —";
      const acts = document.createElement("div"); acts.className = "cg-actions";
      const dl = document.createElement("a"); dl.className = "cg-action-btn"; dl.href = f.url; dl.download = f.name;
      dl.title = "Download"; dl.innerHTML = ICON_DL; dl.onclick = e => e.stopPropagation(); acts.appendChild(dl);

      const ib = document.createElement("button"); ib.className = "cg-action-btn info-btn";
      ib.title = "Info"; ib.innerHTML = ICON_INFO;
      ib.onclick = e => { e.stopPropagation(); this._info(f); }; acts.appendChild(ib);
      bar.appendChild(tl); bar.appendChild(acts); item.appendChild(bar);
      this.strip.appendChild(item);
    });
  }

  async _send(f) {
    let loadNode = null;
    if (this.node.inputs) {
      const sl = this.node.inputs.find(i => i.name === "input_image");
      if (sl?.link != null) { const lk = app.graph.links[sl.link]; if (lk) loadNode = app.graph.getNodeById(lk.origin_id); }
    }
    if (!loadNode) loadNode = app.graph._nodes.find(n => n.type === "LoadImage");
    if (!loadNode) { alert("No Load Image found."); return; }
    const imgWidget = loadNode.widgets?.find(w => w.name === "image"); if (!imgWidget) return;
    try {
      const r = await fetch("/capitan_gallery/send_to_input", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: f.name, subfolder: f.subfolder || "" })
      });
      const d = await r.json();
      if (d.success) {
        imgWidget.value = d.input_filename;
        // Forzar refresh visual del nodo Load Image
        if (loadNode.imgs) loadNode.imgs = null;
        if (typeof loadNode.setSizeForImage === "function") loadNode.setSizeForImage();
        // Disparar callback del widget si existe
        if (typeof imgWidget.callback === "function") imgWidget.callback(d.input_filename);
        loadNode.setDirtyCanvas(true, true);
        app.graph.setDirtyCanvas(true, true);
        // Pedir al servidor que actualice el nodo (fuerza preview)
        try {
          await fetch(`/view?filename=${encodeURIComponent(d.input_filename)}&type=input&t=${Date.now()}`);
        } catch {}
        // Segundo intento: simular cambio de widget para que ComfyUI recargue
        setTimeout(() => {
          if (loadNode.onWidgetChanged) loadNode.onWidgetChanged("image", d.input_filename, imgWidget.value, imgWidget);
          loadNode.setDirtyCanvas(true, true);
        }, 200);
      } else alert(`Error: ${d.error}`);
    } catch (e) { alert(`Error: ${e}`); }
  }

  async _info(f) {
    const p = new URLSearchParams({ filename: f.name }); if (f.subfolder) p.set("subfolder", f.subfolder);
    let info = null;
    try { const r = await fetch(`/capitan_gallery/image_info?${p}`); info = await r.json(); }
    catch (e) { info = { error: String(e) }; }
    const ovl = document.createElement("div"); ovl.className = "cg-modal-overlay";
    ovl.onclick = e => { if (e.target === ovl) ovl.remove(); };
    const modal = document.createElement("div"); modal.className = "cg-modal";
    const hdr2 = document.createElement("div"); hdr2.className = "cg-modal-hdr";
    const ttl = document.createElement("span"); ttl.className = "cg-modal-title"; ttl.textContent = "Image Info";
    const x = document.createElement("button"); x.className = "cg-modal-x"; x.innerHTML = "✕"; x.onclick = () => ovl.remove();
    hdr2.appendChild(ttl); hdr2.appendChild(x); modal.appendChild(hdr2);
    if (!info || info.error || !info.found) {
      const nd = document.createElement("div"); nd.className = "cg-modal-empty";
      nd.textContent = info?.error || "No metadata found."; modal.appendChild(nd);
    } else {
      const addSec = (lbl, val) => {
        if (!val && val !== 0) return;
        const s = document.createElement("div"); s.className = "cg-modal-sec";
        const l = document.createElement("div"); l.className = "cg-modal-lbl"; l.textContent = lbl;
        const v = document.createElement("div"); v.className = "cg-modal-val"; v.textContent = val;
        s.appendChild(l); s.appendChild(v); modal.appendChild(s);
      };
      addSec("File", f.subfolder ? `${f.subfolder}/${f.name}` : f.name);
      const chips = document.createElement("div"); chips.className = "cg-modal-chips";
      [["Seed",info.seed],["Steps",info.steps],["CFG",info.cfg],["Sampler",info.sampler],["Scheduler",info.scheduler]]
        .forEach(([l,v]) => { if (v == null) return; const c = document.createElement("div"); c.className = "cg-modal-chip"; c.innerHTML = `${l}: <span>${v}</span>`; chips.appendChild(c); });
      if (chips.children.length) modal.appendChild(chips);
      addSec("Positive Prompt", info.positive); addSec("Negative Prompt", info.negative);
      if (info.models?.length) {
        const s = document.createElement("div"); s.className = "cg-modal-sec";
        const l = document.createElement("div"); l.className = "cg-modal-lbl"; l.textContent = "Models"; s.appendChild(l);
        info.models.forEach(m => { const r = document.createElement("div"); r.className = "cg-modal-model"; r.textContent = m.name; s.appendChild(r); }); modal.appendChild(s);
      }
      if (info.loras?.length) {
        const s = document.createElement("div"); s.className = "cg-modal-sec";
        const l = document.createElement("div"); l.className = "cg-modal-lbl"; l.textContent = "LoRAs"; s.appendChild(l);
        info.loras.forEach(lr => {
          const r = document.createElement("div"); r.className = "cg-modal-lora";
          const n = document.createElement("span"); n.className = "cg-modal-lora-name"; n.textContent = lr.name;
          const st = document.createElement("span"); st.className = "cg-modal-lora-str"; st.textContent = lr.strength;
          r.appendChild(n); r.appendChild(st); s.appendChild(r);
        }); modal.appendChild(s);
      }
    }
    ovl.appendChild(modal); document.body.appendChild(ovl);
  }

  // ── Lightbox ──────────────────────────────────────────────
  _openLB(idx) {
    this.lbIdx = idx; if (this.lbEl) this.lbEl.remove();
    this._lbZoom = 1;
    const f = this.files[idx];
    const lb = document.createElement("div"); lb.className = "cg-lightbox";
    lb.onclick = e => { if (e.target === lb) this._closeLB(); };
    const inner = document.createElement("div"); inner.className = "cg-lb-inner";
    const cl = document.createElement("button"); cl.className = "cg-lb-close"; cl.innerHTML = "✕"; cl.onclick = () => this._closeLB(); inner.appendChild(cl);

    const row = document.createElement("div"); row.className = "cg-lb-row";
    const bL = document.createElement("button"); bL.className = "cg-lb-nav"; bL.innerHTML = "&#8592;"; bL.onclick = () => this._nav(-1);
    this.lbWrap = document.createElement("div"); this.lbWrap.className = "cg-lb-wrap";
    this.lbMedia = this._mkMedia(f); this.lbMedia.className = "cg-lb-media"; this.lbWrap.appendChild(this.lbMedia);

    this.lbOrig = document.createElement("div"); this.lbOrig.className = "cg-lb-orig";
    const oi = document.createElement("img");
    oi.src = _compareMap[f.name] || this.inputUrl || ""; // usar imagen guardada para este output
    this.lbOrig.appendChild(oi); this.lbWrap.appendChild(this.lbOrig);

    this.lbCmp = null;
    const cmpUrl = _compareMap[f.name] || this.inputUrl;
    if (f.type === "image" && cmpUrl) {
      this.lbCmp = document.createElement("button"); this.lbCmp.className = "cg-lb-cmp"; this.lbCmp.textContent = "⇄ Hold to compare";
      this.lbCmp.addEventListener("mousedown", () => { this.lbOrig.style.display = "block"; });
      const h = () => { this.lbOrig.style.display = "none"; };
      this.lbCmp.addEventListener("mouseup", h); this.lbCmp.addEventListener("mouseleave", h); this.lbWrap.appendChild(this.lbCmp);
    }

    // Zoom hint
    const zh = document.createElement("span"); zh.className = "cg-lb-zoom-hint"; zh.textContent = "scroll to zoom";
    this.lbWrap.appendChild(zh);

    // Zoom centrado en cursor — aplicado al wrap completo (imagen + overlay juntos)
    this.lbWrap.addEventListener("wheel", (e) => {
      e.preventDefault(); e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this._lbZoom = Math.min(Math.max(this._lbZoom * factor, 0.5), 8);
      const rect = this.lbWrap.getBoundingClientRect();
      const ox = ((e.clientX - rect.left) / rect.width)  * 100;
      const oy = ((e.clientY - rect.top)  / rect.height) * 100;
      this.lbWrap.style.transformOrigin = `${ox}% ${oy}%`;
      this.lbWrap.style.transform = `scale(${this._lbZoom})`;
    }, { passive: false });

    this.lbWrap.addEventListener("dblclick", () => {
      this._lbZoom = 1;
      this.lbWrap.style.transform = "scale(1)";
      this.lbWrap.style.transformOrigin = "center center";
    });

    const bR = document.createElement("button"); bR.className = "cg-lb-nav"; bR.innerHTML = "&#8594;"; bR.onclick = () => this._nav(1);
    row.appendChild(bL); row.appendChild(this.lbWrap); row.appendChild(bR); inner.appendChild(row);

    const foot = document.createElement("div"); foot.className = "cg-lb-footer";
    this.lbInfo = document.createElement("div"); this.lbInfo.className = "cg-lb-info";
    this.lbTime = document.createElement("div"); this.lbTime.className = "cg-lb-time";
    const acts = document.createElement("div"); acts.className = "cg-lb-actions";
    this._lbDl = document.createElement("a"); this._lbDl.className = "cg-lb-btn"; this._lbDl.innerHTML = `${ICON_DL} Download`; this._lbDl.href = f.url; this._lbDl.download = f.name;

    this.lbInfoBtn = document.createElement("button"); this.lbInfoBtn.className = "cg-lb-btn info"; this.lbInfoBtn.innerHTML = `${ICON_INFO} Info`; this.lbInfoBtn.onclick = () => this._info(this.files[this.lbIdx]);
    acts.appendChild(this._lbDl); acts.appendChild(this.lbInfoBtn);
    foot.appendChild(this.lbInfo); foot.appendChild(this.lbTime); foot.appendChild(acts);
    inner.appendChild(foot); lb.appendChild(inner); document.body.appendChild(lb); this.lbEl = lb;
    this._updLB();

    this._kh = (e) => {
      // Bloquear siempre que el lightbox esté abierto — no propagar al canvas
      if (e.key === "ArrowLeft")  { e.preventDefault(); e.stopPropagation(); this._nav(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); this._nav(1); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this._closeLB(); }
    };
    document.addEventListener("keydown", this._kh, true); // capture=true para bloquear antes que LiteGraph
    this._mark(idx);
  }

  _nav(d) {
    this.lbIdx = (this.lbIdx + d + this.files.length) % this.files.length;
    this._lbZoom = 1;
    const f = this.files[this.lbIdx];
    const m = this._mkMedia(f); m.className = "cg-lb-media"; this.lbMedia.replaceWith(m); this.lbMedia = m;
    this.lbWrap.style.transform = "scale(1)"; this.lbWrap.style.transformOrigin = "center center";

    // Actualizar imagen de compare para este output específico
    const cmpUrl = _compareMap[f.name] || this.inputUrl;
    if (this.lbOrig) { const oi = this.lbOrig.querySelector("img"); if (oi) oi.src = cmpUrl || ""; }
    if (this.lbCmp) this.lbCmp.style.display = (f.type === "image" && cmpUrl) ? "" : "none";
    this.lbOrig.style.display = "none";


    if (this._lbDl) { this._lbDl.href = f.url; this._lbDl.download = f.name; }
    this._updLB(); this._mark(this.lbIdx);

    // Reaplicar zoom listener

  }

  _updLB() {
    const f = this.files[this.lbIdx];
    const name = f.subfolder ? `${f.subfolder}/${f.name}` : f.name;
    this.lbInfo.textContent = `${this.lbIdx+1} / ${this.files.length}  ·  ${name}`;
    this.lbTime.textContent = _times[f.name] ? `⏱ ${_times[f.name]}s` : "";
  }

  // Borde aqua solo en la última abierta, persiste al cerrar
  _mark(i) {
    this.lbIdx = i;
    this.strip.querySelectorAll(".cg-thumb").forEach((t, j) => t.classList.toggle("active", j === i));
  }

  _mkMedia(f) {
    if (f.type === "video") { const v = document.createElement("video"); v.src = f.url; v.controls = true; v.autoplay = true; v.loop = true; return v; }
    const img = document.createElement("img"); img.src = f.url; return img;
  }

  _closeLB() {
    if (this.lbEl) { this.lbEl.remove(); this.lbEl = null; }
    if (this._kh) document.removeEventListener("keydown", this._kh, true);
    // NO limpiar el active — mantener borde aqua en la última vista
  }
}

let _setup = false;
app.registerExtension({
  name: "capitan.Gallery",
  async setup() { if (!_setup) { setupListeners(); _setup = true; } },
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "CapitanGallery") return;
    const onCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function() {
      onCreated?.apply(this, arguments);
      this.setSize([1400, 420]);
      this._cg = new CG(this);
    };
    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function(info) {
      onConfigure?.apply(this, arguments);
      // properties ya están cargadas aquí — aplicar config guardada
      const cfg = this.properties?.cg_config;
      if (cfg && this._cg) this._cg.applyConfig(cfg);
    };

    const onRemoved = nodeType.prototype.onRemoved;
    nodeType.prototype.onRemoved = function() {
      onRemoved?.apply(this, arguments);
      this._cg?.destroy();
    };
  }
});
