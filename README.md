# 🖼️ ComfyUI Capitan Gallery

Horizontal thumbnail gallery node for ComfyUI with lightbox viewer and hold-to-compare

![ComfyUI Capitan Gallery](https://img.shields.io/badge/ComfyUI-Custom%20Node-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Horizontal thumbnail strip** embedded directly in the canvas — no need to open side panels
- **Auto-refreshes** after each generation
- **Click any thumbnail** to open a fullscreen lightbox viewer
- **Arrow navigation** (← →) between images in the lightbox, also supports keyboard arrows
- **Hold ⇄ to compare** — hold the compare button on any image thumbnail or in the lightbox to instantly see your original input image for before/after comparison
- **Video support** — MP4, WebM and GIF thumbnails play inline with autoplay
- **Configurable count** — show last 5 to 50 outputs

---

## Installation

### Via ComfyUI Manager (recommended)
Search for `Capitan-Gallery` in the Manager and install.

### Manual
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Nevaditow/capitan-gallery
```
Restart ComfyUI.

---

## Usage

1. Add the node: **Add Node → Capitan/Utils → 🖼️ Capitan Gallery**
2. Connect any output from your workflow to the **`trigger`** input so the gallery refreshes after each generation
3. *(Optional)* Connect an `IMAGE` to **`input_image`** to enable the hold-to-compare feature
4. Adjust **`count`** to control how many recent outputs are shown (default: 15)

### Example workflow connection
```
[Save Image / Video Combine] → output → trigger → [Capitan Gallery]
[Load Image]                 → IMAGE  → input_image → [Capitan Gallery]
```

---

## Node Inputs

| Input | Type | Required | Description |
|---|---|---|---|
| `trigger` | `*` | Yes | Connect to any node output to trigger auto-refresh |
| `input_image` | `IMAGE` | No | Original input image for hold-to-compare |
| `count` | `INT` | No | Number of recent outputs to show (5–50, default 15) |

---

## Compatibility

- ComfyUI (any recent version)
- Windows / Linux / macOS
- Supports: `.png` `.jpg` `.jpeg` `.webp` `.mp4` `.webm` `.gif`

---

## License

MIT
