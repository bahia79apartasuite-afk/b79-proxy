"""Interfaz comun de todos los proveedores.

Tres metodos y ya. Anadir un proveedor nuevo es escribir un archivo en esta carpeta que
herede de Proveedor; el resto del pipeline no cambia.
"""
from __future__ import annotations

import json, random, time, urllib.error, urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Trabajo:
    job_id: str
    modelo: str
    proveedor: str
    estado: str = "pendiente"      # pendiente | listo | error
    url: str | None = None
    error: str | None = None


class Proveedor(ABC):
    nombre: str = "base"

    def __init__(self, cfg) -> None:
        self.cfg = cfg

    @abstractmethod
    def generate_image(self, prompt: str, *, modelo: str, resolucion: str = "2k",
                       aspecto: str = "16:9", referencias: list[Path] | None = None,
                       **kw) -> Trabajo: ...

    @abstractmethod
    def generate_video(self, prompt: str, *, modelo: str, start_frame: Path,
                       duracion: int, resolucion: str = "720p", aspecto: str = "16:9",
                       referencias: list[Path] | None = None, **kw) -> Trabajo: ...

    @abstractmethod
    def wait(self, job_id: str, *, timeout: int = 900) -> Trabajo: ...

    # ---------------------------------------------------------------- HTTP
    def _peticion(self, url: str, datos: dict | None = None, *,
                  cabeceras: dict | None = None, metodo: str = "POST") -> dict:
        """POST/GET con reintento y espera creciente ante 429 y 5xx. Es la regla 4.

        La espera es exponencial con un poco de ruido: si lanzas cuatro trabajos a la vez y
        los cuatro reciben un 429, sin ruido los cuatro reintentan en el mismo instante y
        vuelven a chocar.
        """
        cuerpo = json.dumps(datos).encode() if datos is not None else None
        ultimo = None
        for intento in range(self.cfg.reintentos):
            req = urllib.request.Request(url, data=cuerpo, method=metodo,
                                         headers={"Content-Type": "application/json",
                                                  **(cabeceras or {})})
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.loads(r.read().decode())
            except urllib.error.HTTPError as e:
                ultimo = e
                if e.code in (429, 500, 502, 503, 504) and intento < self.cfg.reintentos - 1:
                    espera = (2 ** intento) + random.uniform(0, 1)
                    time.sleep(espera)
                    continue
                # el cuerpo del error puede traer la clave: no se registra nunca entero
                raise RuntimeError(f"{self.nombre}: HTTP {e.code} en {url.split('?')[0]}")
            except urllib.error.URLError as e:
                ultimo = e
                if intento < self.cfg.reintentos - 1:
                    time.sleep((2 ** intento) + random.uniform(0, 1))
                    continue
                raise RuntimeError(f"{self.nombre}: sin red — {e.reason}")
        raise RuntimeError(f"{self.nombre}: agotados los reintentos ({ultimo})")
