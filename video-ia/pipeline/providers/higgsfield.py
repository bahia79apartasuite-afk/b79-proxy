"""Higgsfield — opcional, via MCP. Aqui no se llama por HTTP.

El servidor MCP de Higgsfield ya esta expuesto como herramientas del asistente
(`generate_image`, `generate_video`, `show_reference_elements`, `media_upload`...), asi que
este modulo **no reimplementa la API**: documenta el mapeo y deja el hueco.

Para que sirve de verdad en este sistema: **Elements**, que es lo que mantiene la cara.

  crear:      show_reference_elements  action="create"  category="character"|"environment"|"prop"
  usar:       escribir <<<element_id>>> dentro del prompt; el backend inyecta la imagen
  subir:      media_upload -> PUT de los bytes -> media_confirm

Elements funciona con nano_banana_pro, nano_banana_2, gpt_image_2, seedream_v4_5,
seedream_v5_lite y cinematic_studio_2_5 en imagen, y con seedance_2_0, Kling 3.0 y
Cinema Studio Video 2 / 3.0 en video.

Soul ID es otra cosa: entrena con 5 a 20 fotos de una persona real, tarda unos 10 minutos,
solo admite un sujeto y solo funciona con Soul V2 y Cinema. **Para un personaje pintado, y
para cualquier plano con dos personajes, el camino es Elements.**
"""
from __future__ import annotations

from .base import Proveedor, Trabajo

MAPEO_MCP = {
    "generate_image": "mcp__higgsfield__generate_image",
    "generate_video": "mcp__higgsfield__generate_video",
    "crear_element":  "mcp__higgsfield__show_reference_elements(action='create')",
    "subir_media":    "mcp__higgsfield__media_upload -> PUT -> media_confirm",
    "esperar":        "mcp__higgsfield__jobs_wait",
    "ver_resultado":  "mcp__higgsfield__show_generation_by_ids",
}


class Higgsfield(Proveedor):
    nombre = "higgsfield"

    def _no_por_http(self, que: str):
        raise NotImplementedError(
            f"Higgsfield se usa por MCP, no por HTTP desde aqui.\n"
            f"  equivalente de {que}: {MAPEO_MCP.get(que, '(ver MAPEO_MCP)')}\n"
            f"Pon HIGGSFIELD_MCP=1 en .env y pidele al asistente que llame a esa herramienta.")

    def generate_image(self, *a, **kw): self._no_por_http("generate_image")
    def generate_video(self, *a, **kw): self._no_por_http("generate_video")
    def wait(self, *a, **kw):           self._no_por_http("esperar")
