"""fal.ai — Seedance 2.5 y 2.0, Nano Banana Pro, Seedream 5, Flux 2 Pro. Una sola clave.

Modelos y sus limites reales:

  bytedance/seedance-2-5   4-30 s · 480p / 720p / 1080p · nativo 720p · SIN 4K
  bytedance/seedance-2-0   4-15 s · 480p / 720p / 1080p / 4K · **el unico con 4K**
  google/nano-banana-pro   imagen · 1k / 2k / 4k · el mejor de los tres con texto
  bytedance/seedream-5     imagen · 1k / 1.5k / 2k · edicion por instrucciones
  black-forest-labs/flux-2 imagen · 1k / 2k · muy fiel al prompt
"""
from __future__ import annotations

from pathlib import Path

from .base import Proveedor, Trabajo

BASE = "https://queue.fal.run"

MODELOS = {
    "seedance_2_5":      "bytedance/seedance-2-5",
    "seedance_2_0":      "bytedance/seedance-2-0",
    "seedance_2_0_mini": "bytedance/seedance-2-0/mini",
    "nano_banana_pro":   "google/nano-banana-pro",
    "seedream_v5_pro":   "bytedance/seedream-5",
    "flux_2_pro":        "black-forest-labs/flux-2/pro",
}


class Fal(Proveedor):
    nombre = "fal"

    def _cabeceras(self) -> dict:
        return {"Authorization": f"Key {self.cfg.exigir('fal')}"}

    def generate_image(self, prompt, *, modelo="nano_banana_pro", resolucion="2k",
                       aspecto="16:9", referencias=None, **kw) -> Trabajo:
        ruta = MODELOS[modelo]
        cuerpo = {"prompt": prompt, "aspect_ratio": aspecto, "resolution": resolucion}
        if referencias:
            cuerpo["image_urls"] = [str(p) for p in referencias]
        cuerpo.update(kw)
        r = self._peticion(f"{BASE}/{ruta}", cuerpo, cabeceras=self._cabeceras())
        return Trabajo(job_id=r["request_id"], modelo=ruta, proveedor=self.nombre)

    def generate_video(self, prompt, *, modelo="seedance_2_0", start_frame, duracion,
                       resolucion="720p", aspecto="16:9", referencias=None, **kw) -> Trabajo:
        ruta = MODELOS[modelo]
        cuerpo = {
            "prompt": prompt,
            "image_url": str(start_frame),      # el start frame, siempre
            "duration": max(4, int(duracion)),  # Seedance no baja de 4 s
            "resolution": resolucion,
            "aspect_ratio": aspecto,
            "generate_audio": False,            # el audio se monta aparte
        }
        if referencias:
            cuerpo["reference_image_urls"] = [str(p) for p in referencias]
        cuerpo.update(kw)
        r = self._peticion(f"{BASE}/{ruta}", cuerpo, cabeceras=self._cabeceras())
        return Trabajo(job_id=r["request_id"], modelo=ruta, proveedor=self.nombre)

    def wait(self, job_id: str, *, timeout: int = 900) -> Trabajo:
        import time
        limite = time.time() + timeout
        while time.time() < limite:
            r = self._peticion(f"{BASE}/requests/{job_id}/status",
                               cabeceras=self._cabeceras(), metodo="GET")
            estado = r.get("status")
            if estado == "COMPLETED":
                res = self._peticion(f"{BASE}/requests/{job_id}",
                                     cabeceras=self._cabeceras(), metodo="GET")
                salida = res.get("video") or res.get("images", [{}])[0]
                return Trabajo(job_id, r.get("model", "?"), self.nombre,
                               estado="listo", url=salida.get("url"))
            if estado in ("FAILED", "ERROR"):
                return Trabajo(job_id, "?", self.nombre, estado="error",
                               error=str(r.get("error"))[:300])
            time.sleep(5)
        return Trabajo(job_id, "?", self.nombre, estado="error",
                       error=f"sin respuesta en {timeout} s")
