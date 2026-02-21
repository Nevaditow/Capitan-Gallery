import { app } from "../../../scripts/app.js";

const STYLE = `
  .cg-wrap {
    width: 100%; height: 100%;
    background: #141414;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'Courier New', monospace;
    box-sizing: border-box;
  }
  .cg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: #1a1a1a;
    border-bottom: 1px solid #2a2a2a;
  }
  .cg-title { color: #888; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
  .cg-refresh {
    background: none; border: 1px solid #333; color: #666;
    font-size: 11px; padding: 2px 8px; border-radius: 4px;
    cursor: pointer; transition: all 0.2s;
  }
  .cg-refresh:hover { border-color: #888; color: #ccc; }
  .cg-strip {
    display: flex; flex-direction: row; gap: 6px; padding: 8px;
    overflow-x: auto; overflow-y: hidden; flex: 1; align-items: center;
    scrollbar-width: thin; scrollbar-color: #333 #141414;
  }
  .cg-strip::-webkit-scrollbar { height: 4px; }
  .cg-strip::-webkit-scrollbar-track { background: #141414; }
  .cg-strip::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  .cg-thumb {
    flex-shrink: 0; width: 320px; height: 320px;
    border-radius: 5px; overflow: hidden; cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.15s;
    position: relative; background: #1e1e1e;
  }
  .cg-thumb:hover { border-color: #555; transform: scale(1.05); }
  .cg-thumb.active { border-color: #aaa; }
  .cg-thumb img, .cg-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cg-badge {
    position: absolute; bottom: 3px; right: 3px;
    background: rgba(0,0,0,0.7); color: #aaa;
    font-size: 8px; padding: 1px 4px; border-radius: 3px; letter-spacing: 1px;
  }
  /* Botón comparar — esquina superior izquierda */
  .cg-cmp-btn {
    position: absolute; top: 6px; left: 6px;
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(0,0,0,0.32);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.5);
    font-size: 12px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; user-select: none;
    backdrop-filter: blur(3px);
    transition: background 0.15s, color 0.15s;
  }
  .cg-cmp-btn:hover { background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.9); }
  /* Overlay original sobre la miniatura */
  .cg-orig-overlay {
    position: absolute; inset: 0; z-index: 9;
    display: none; pointer-events: none;
  }
  .cg-orig-overlay img { width: 100%; height: 100%; object-fit: cover; }
  .cg-empty { color: #444; font-size: 11px; text-align: center; width: 100%; letter-spacing: 1px; }

  /* LIGHTBOX */
  .cg-lightbox {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.88);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999; backdrop-filter: blur(6px);
  }
  .cg-lb-inner {
    position: relative; max-width: 80vw; max-height: 80vh;
    display: flex; align-items: center; gap: 16px;
  }
  /* Wrapper de media con overlay de comparación */
  .cg-lb-media-wrap {
    position: relative; display: inline-flex;
    align-items: center; justify-content: center;
  }
  .cg-lb-media {
    max-width: 75vw; max-height: 78vh;
    border-radius: 8px;
    box-shadow: 0 0 60px rgba(0,0,0,0.8);
    display: block;
  }
  /* Overlay original en lightbox */
  .cg-lb-orig {
    position: absolute; inset: 0;
    display: none; border-radius: 8px; overflow: hidden;
    pointer-events: none;
  }
  .cg-lb-orig img { width: 100%; height: 100%; object-fit: contain; }
  /* Botón comparar en lightbox — esquina superior izquierda */
  .cg-lb-cmp-btn {
    position: absolute; top: 8px; left: 8px;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.55);
    font-size: 12px; padding: 4px 9px; border-radius: 12px;
    cursor: pointer; z-index: 10; user-select: none;
    backdrop-filter: blur(4px);
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .cg-lb-cmp-btn:hover { background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.9); }
  .cg-lb-btn {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
    color: #ccc; font-size: 22px; width: 44px; height: 44px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
  }
  .cg-lb-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .cg-lb-close {
    position: absolute; top: -44px; right: 0;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15);
    color: #aaa; font-size: 16px; width: 32px; height: 32px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .cg-lb-close:hover { color: #fff; background: rgba(255,255,255,0.15); }
  .cg-lb-info {
    position: absolute; bottom: -32px; left: 0; right: 0;
    text-align: center; color: #555; font-size: 10px; letter-spacing: 1px;
  }
`;

function injectStyles() {
  if (document.getElementById("capitan-gallery-style")) return;
  const s = document.createElement("style");
  s.id = "capitan-gallery-style";
  s.textContent = STYLE;
  document.head.appendChild(s);
}

class CapitanGalleryWidget {
  constructor(node) {
    this.node = node;
    this.files = [];
    this.lbIndex = 0;
    this.lbEl = null;
    this.inputImageUrl = null;

    injectStyles();
    this._build();
    this.refresh();
    this._fetchInputImage();
  }

  async _fetchInputImage() {
    try {
      const res = await fetch("/capitan_gallery/input_image");
      const data = await res.json();
      this.inputImageUrl = data.url || null;
    } catch (e) {
      this.inputImageUrl = null;
    }
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "cg-wrap";

    const header = document.createElement("div");
    header.className = "cg-header";
    const title = document.createElement("span");
    title.className = "cg-title";
    title.textContent = "Recent Outputs";
    const btn = document.createElement("button");
    btn.className = "cg-refresh";
    btn.textContent = "↻ refresh";
    btn.onclick = () => { this.refresh(); this._fetchInputImage(); };
    header.appendChild(title);
    header.appendChild(btn);

    this.strip = document.createElement("div");
    this.strip.className = "cg-strip";

    wrap.appendChild(header);
    wrap.appendChild(this.strip);
    this.wrap = wrap;

    this.node.addDOMWidget("gallery_display", "div", wrap, {
      getValue: () => null,
      setValue: () => {},
    });
  }

  async refresh() {
    const count = this.node.widgets?.find(w => w.name === "count")?.value || 15;
    try {
      const res = await fetch(`/capitan_gallery/outputs?count=${count}`);
      this.files = await res.json();
      this._renderStrip();
    } catch (e) {
      this.strip.innerHTML = `<span class="cg-empty">ERROR CARGANDO</span>`;
    }
  }

  _renderStrip() {
    this.strip.innerHTML = "";
    if (!this.files.length) {
      this.strip.innerHTML = `<span class="cg-empty">NO HAY OUTPUTS AÚN</span>`;
      return;
    }
    this.files.forEach((f, i) => {
      const thumb = document.createElement("div");
      thumb.className = "cg-thumb";
      thumb.title = f.name;

      if (f.type === "video") {
        const vid = document.createElement("video");
        vid.src = f.url;
        vid.muted = true; vid.loop = true; vid.autoplay = true; vid.playsInline = true;
        thumb.appendChild(vid);
        const badge = document.createElement("span");
        badge.className = "cg-badge";
        badge.textContent = "VID";
        thumb.appendChild(badge);
      } else {
        const img = document.createElement("img");
        img.src = f.url;
        img.loading = "lazy";
        thumb.appendChild(img);

        // Overlay original
        const overlay = document.createElement("div");
        overlay.className = "cg-orig-overlay";
        const overlayImg = document.createElement("img");
        overlayImg.src = this.inputImageUrl || "";
        overlay.appendChild(overlayImg);
        thumb.appendChild(overlay);

        // Botón comparar (solo imágenes)
        if (this.inputImageUrl) {
          const cmpBtn = document.createElement("div");
          cmpBtn.className = "cg-cmp-btn";
          cmpBtn.title = "Mantené presionado para comparar con el original";
          cmpBtn.innerHTML = "⇄";

          cmpBtn.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            overlay.style.display = "block";
          });
          const hideOverlay = (e) => {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            overlay.style.display = "none";
          };
          cmpBtn.addEventListener("mouseup", hideOverlay);
          cmpBtn.addEventListener("mouseleave", hideOverlay);
          cmpBtn.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });

          thumb.appendChild(cmpBtn);
        }
      }

      thumb.onclick = () => this._openLightbox(i);
      this.strip.appendChild(thumb);
    });
  }

  _openLightbox(index) {
    this.lbIndex = index;
    if (this.lbEl) this.lbEl.remove();

    const lb = document.createElement("div");
    lb.className = "cg-lightbox";
    lb.onclick = (e) => { if (e.target === lb) this._closeLightbox(); };

    const inner = document.createElement("div");
    inner.className = "cg-lb-inner";

    const btnL = document.createElement("button");
    btnL.className = "cg-lb-btn";
    btnL.innerHTML = "&#8592;";
    btnL.onclick = () => this._navigate(-1);

    // Media wrap (para overlay de comparación)
    this.lbMediaWrap = document.createElement("div");
    this.lbMediaWrap.className = "cg-lb-media-wrap";

    this.lbMedia = this._makeMedia(this.files[index]);
    this.lbMedia.className = "cg-lb-media";
    this.lbMediaWrap.appendChild(this.lbMedia);

    // Overlay original en lightbox
    this.lbOrigOverlay = document.createElement("div");
    this.lbOrigOverlay.className = "cg-lb-orig";
    const origImg = document.createElement("img");
    origImg.src = this.inputImageUrl || "";
    this.lbOrigOverlay.appendChild(origImg);
    this.lbMediaWrap.appendChild(this.lbOrigOverlay);

    // Botón comparar en lightbox (solo si es imagen y hay input)
    const isImage = this.files[index].type === "image";
    if (isImage && this.inputImageUrl) {
      this.lbCmpBtn = document.createElement("button");
      this.lbCmpBtn.className = "cg-lb-cmp-btn";
      this.lbCmpBtn.textContent = "⇄ Hold to compare";

      this.lbCmpBtn.addEventListener("mousedown", () => {
        this.lbOrigOverlay.style.display = "block";
      });
      const hideLbOrig = () => { this.lbOrigOverlay.style.display = "none"; };
      this.lbCmpBtn.addEventListener("mouseup", hideLbOrig);
      this.lbCmpBtn.addEventListener("mouseleave", hideLbOrig);

      this.lbMediaWrap.appendChild(this.lbCmpBtn);
    }

    const btnR = document.createElement("button");
    btnR.className = "cg-lb-btn";
    btnR.innerHTML = "&#8594;";
    btnR.onclick = () => this._navigate(1);

    const close = document.createElement("button");
    close.className = "cg-lb-close";
    close.innerHTML = "✕";
    close.onclick = () => this._closeLightbox();

    this.lbInfo = document.createElement("div");
    this.lbInfo.className = "cg-lb-info";
    this._updateInfo();

    inner.appendChild(close);
    inner.appendChild(btnL);
    inner.appendChild(this.lbMediaWrap);
    inner.appendChild(btnR);
    inner.appendChild(this.lbInfo);
    lb.appendChild(inner);
    document.body.appendChild(lb);
    this.lbEl = lb;

    this._keyHandler = (e) => {
      if (e.key === "ArrowLeft") this._navigate(-1);
      if (e.key === "ArrowRight") this._navigate(1);
      if (e.key === "Escape") this._closeLightbox();
    };
    document.addEventListener("keydown", this._keyHandler);
    this._markActive(index);
  }

  _navigate(dir) {
    this.lbIndex = (this.lbIndex + dir + this.files.length) % this.files.length;
    const f = this.files[this.lbIndex];

    const newMedia = this._makeMedia(f);
    newMedia.className = "cg-lb-media";
    this.lbMedia.replaceWith(newMedia);
    this.lbMedia = newMedia;

    // Mostrar/ocultar botón comparar según si es imagen
    if (this.lbCmpBtn) {
      this.lbCmpBtn.style.display = (f.type === "image" && this.inputImageUrl) ? "flex" : "none";
    }
    this.lbOrigOverlay.style.display = "none";

    this._updateInfo();
    this._markActive(this.lbIndex);
  }

  _updateInfo() {
    const f = this.files[this.lbIndex];
    this.lbInfo.textContent = `${this.lbIndex + 1} / ${this.files.length}  ·  ${f.name}`;
  }

  _markActive(index) {
    this.strip.querySelectorAll(".cg-thumb").forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
  }

  _makeMedia(f) {
    if (f.type === "video") {
      const v = document.createElement("video");
      v.src = f.url; v.controls = true; v.autoplay = true; v.loop = true;
      return v;
    } else {
      const img = document.createElement("img");
      img.src = f.url;
      return img;
    }
  }

  _closeLightbox() {
    if (this.lbEl) { this.lbEl.remove(); this.lbEl = null; }
    if (this._keyHandler) document.removeEventListener("keydown", this._keyHandler);
    this.strip.querySelectorAll(".cg-thumb").forEach(t => t.classList.remove("active"));
  }
}

app.registerExtension({
  name: "capitan.Gallery",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "CapitanGallery") return;
    const onCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      onCreated?.apply(this, arguments);
      this.setSize([1400, 380]);
      this._galleryWidget = new CapitanGalleryWidget(this);
    };
  },
  async nodeCreated(node) {
    if (node.comfyClass !== "CapitanGallery") return;
    app.api?.addEventListener("executed", () => {
      node._galleryWidget?._fetchInputImage().then(() => {
        node._galleryWidget?.refresh();
      });
    });
  }
});
