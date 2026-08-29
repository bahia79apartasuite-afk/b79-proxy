"""OpenAI — GPT Image 2, para edicion y consistencia de personaje.

En este sistema **GPT Image 2 no se usa para generar de cero**: se usa para editar una
imagen ya aprobada conservando la geometria. Es lo que mejor hace de los tres modelos:

  - variantes de hora del dia de una ubicacion, sin que cambie el sitio
  - corregir un detalle de vestuario en un start frame sin regenerar el plano
  - poner un personaje aprobado en un fondo aprobado

Generar de cero con Nano Banana Pro o Seedream 5, y editar con este.
"""
from __future__ import annotations

import base64
from pathlib import Path

from .base import Proveedor, Trabajo

BASE = "https://api.openai.com/v1"


class OpenAI(Proveedor):
    nombre = "openai"

    def _cabeceras(self) -> dict:
        return {"Authorization": f"Bearer {self.cfg.exigir('openai')}"}

    def generate_image(self, prompt, *, modelo="gpt-image-2", resolucion="2k",
                       aspecto="16:9", referencias=None, **kw) -> Trabajo:
        tam = {"16:9": "1536x864", "9:16": "864x1536", "1:1": "1024x1024",
               "4:3": "1280x960", "3:4": "960x1280"}.get(aspecto, "1536x864")
        cuerpo = {"model": modelo, "prompt": prompt, "size": tam, "n": 1}
        if referencias:
            cuerpo["image"] = [
                base64.b64encode(Path(p).read_bytes()).decode() for p in referencias]
        cuerpo.update(kw)
        r = self._peticion(f"{BASE}/images/generations", cuerpo, cabeceras=self._cabeceras())
        return Trabajo(job_id=r.get("id", "sincrono"), modelo=modelo, proveedor=self.nombre,
                       estado="listo", url=r["data"][0].get("url"))

    def generate_video(self, *a, **kw) -> Trabajo:
        raise NotImplementedError(
            "OpenAI no anima en este pipeline. El video lo hace Seedance por fal.")

    def wait(self, job_id: str, *, timeout: int = 900) -> Trabajo:
        # las imagenes de OpenAI vuelven en la misma peticion
        return Trabajo(job_id, "gpt-image-2", self.nombre, estado="listo")
