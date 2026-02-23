# 🖼️ Capitan Gallery

A gallery node for ComfyUI focused on one thing: **quickly reviewing your latest generated outputs and comparing them against the original input**.

Displays images and looping videos.
---

<!-- Add your screenshots here -->
<!-- ![Gallery horizontal view](screenshots/01_horizontal.png) -->
<!-- ![Gallery grid view](screenshots/02_grid.png) -->
<!-- ![Compare mode](screenshots/03_compare.png) -->
<!-- ![Info modal](screenshots/04_info.png) -->
![gallery](https://github.com/user-attachments/assets/ef02d9d5-8ad0-4df2-ad1b-cb1d639d4ecb)
---

## What it does

- Shows the **most recent outputs** from your `output/` folder, including subfolders.
- **Hold-to-compare** any image against the input used to generate it — each thumbnail remembers its own source image, not just the current one
- Three **layout modes**: horizontal strip, vertical list, grid
- Four **thumbnail sizes** cycling with one button
- **Lightbox** with scroll-to-zoom, arrow key navigation, and the same compare feature
- **Metadata panel** for images and videos — reads seed, steps, CFG, sampler, LoRAs and models directly from the file. Works with standard workflows, subgraphs, translation nodes and VHS-encoded MP4s
- Generation **time** shown per image
- **Keyboard scroll** when the node is selected (← →)
- Layout and size preferences **saved with the workflow**
- **Configurable count** — show last 5 to 50 outputs

## Installation

**Via ComfyUI Manager** *(once listed)*  
Search for `Capitan-Gallery` and install.

**Manual**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Nevaditow/Capitan-Gallery
```
Restart ComfyUI.

## Usage

Add the **🖼️ Capitan Gallery** node to any workflow. No connections required.

| Input | Description |
|-------|-------------|
| `input_image` | Optional. Connect a `LoadImage` output to enable the compare feature |
| `count` | How many recent files to show (default 15) |

The node picks up everything in `output/` automatically — images and videos, any subfolder.

## Notes

- Compare memory is session-only and resets on restart
- Metadata works best with `SaveImage` nodes (PNG) and VHS `VideoCombine` with `save_metadata` enabled
- This node shows your recent work, not your entire output history

## License

MIT
