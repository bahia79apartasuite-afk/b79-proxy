"""BytePlus ModelArk — reservado, sin implementar.

Es la **ruta oficial y mas barata** para Seedance: se factura directamente contra ByteDance
en vez de pasar por un agregador. El modelo es `dreamina-seedance-2-5-260628`.

Por que no esta hecho: requiere abrir cuenta en BytePlus y **pasar una aprobacion** antes de
poder llamar a la API. No es una clave que se saca en dos minutos como la de fal.

Cuando la tengas, este archivo hereda de Proveedor igual que fal.py y el resto del pipeline
no cambia: cambia una linea en pipeline/__main__.py.
"""
from __future__ import annotations

from .base import Proveedor

MODELO = "dreamina-seedance-2-5-260628"
BASE = "https://ark.ap-southeast.bytepluses.com/api/v3"


class BytePlus(Proveedor):
    nombre = "byteplus"

    def _pendiente(self):
        raise NotImplementedError(
            "BytePlus ModelArk no esta implementado todavia.\n"
            "Es la ruta oficial y mas barata, pero necesita cuenta y aprobacion previa.\n"
            f"Modelo cuando lo tengas: {MODELO}")

    def generate_image(self, *a, **kw): self._pendiente()
    def generate_video(self, *a, **kw): self._pendiente()
    def wait(self, *a, **kw):           self._pendiente()
