"""
Capitan Gallery Node v2
- Miniaturas horizontales de outputs recientes
- Visor con flechas de navegación
- Botón hold-to-compare con imagen de input
"""

import os
import base64
import numpy as np
import folder_paths
from server import PromptServer
from aiohttp import web
from PIL import Image
import io

# URL global de la imagen de input (se actualiza cada vez que corre el nodo)
_input_image_url = None

@PromptServer.instance.routes.get("/capitan_gallery/outputs")
async def get_outputs(request):
    try:
        output_dir = folder_paths.get_output_directory()
        count = int(request.rel_url.query.get("count", 15))

        extensions_image = {".png", ".jpg", ".jpeg", ".webp"}
        extensions_video = {".mp4", ".webm", ".gif"}
        all_ext = extensions_image | extensions_video

        files = []
        for fname in os.listdir(output_dir):
            ext = os.path.splitext(fname)[1].lower()
            if ext in all_ext:
                fpath = os.path.join(output_dir, fname)
                mtime = os.path.getmtime(fpath)
                ftype = "video" if ext in extensions_video else "image"
                files.append({
                    "name": fname,
                    "type": ftype,
                    "mtime": mtime,
                    "url": f"/view?filename={fname}&type=output"
                })

        files.sort(key=lambda x: x["mtime"], reverse=True)
        return web.json_response(files[:count])

    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.get("/capitan_gallery/input_image")
async def get_input_image(request):
    global _input_image_url
    if _input_image_url is None:
        return web.json_response({"url": None})
    return web.json_response({"url": _input_image_url})


class CapitanGallery:

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "trigger": ("*", {}),
            },
            "optional": {
                "count": ("INT", {"default": 15, "min": 5, "max": 50}),
                "input_image": ("IMAGE",),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "show"
    CATEGORY = "Capitan/Utils"
    OUTPUT_NODE = True

    def show(self, trigger=None, count=15, input_image=None):
        global _input_image_url

        if input_image is not None:
            try:
                # Convertir tensor a imagen PIL y luego a base64
                img_array = input_image[0].cpu().numpy()
                img_array = (img_array * 255).clip(0, 255).astype(np.uint8)
                pil_img = Image.fromarray(img_array)

                # Reducir tamaño para no sobrecargar
                pil_img.thumbnail((1024, 1024), Image.LANCZOS)

                buffer = io.BytesIO()
                pil_img.save(buffer, format="PNG")
                b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
                _input_image_url = f"data:image/png;base64,{b64}"
            except Exception as e:
                print(f"[CapitanGallery] Error procesando input_image: {e}")
                _input_image_url = None
        else:
            _input_image_url = None

        return {"ui": {"gallery_refresh": [count]}}


NODE_CLASS_MAPPINGS = {
    "CapitanGallery": CapitanGallery
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CapitanGallery": "🖼️ Capitan Gallery"
}

WEB_DIRECTORY = "./web"
