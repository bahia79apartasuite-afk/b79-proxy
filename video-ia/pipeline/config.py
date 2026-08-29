"""Configuracion: lee video-ia/.env sin dependencias externas."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / ".env"


def _cargar_env() -> dict[str, str]:
    datos: dict[str, str] = {}
    if ENV.exists():
        for linea in ENV.read_text().splitlines():
            linea = linea.split("#", 1)[0].strip()
            if "=" in linea:
                k, v = linea.split("=", 1)
                datos[k.strip()] = v.strip()
    # una variable del entorno gana sobre el archivo
    for k in list(datos) + ["FAL_KEY", "OPENAI_API_KEY", "HIGGSFIELD_MCP"]:
        if os.environ.get(k):
            datos[k] = os.environ[k]
    return datos


@dataclass(frozen=True)
class Config:
    fal_key: str = ""
    openai_key: str = ""
    higgsfield_mcp: bool = False
    max_usd_run: float = 15.0
    max_usd_job: float = 1.5
    max_jobs: int = 4
    reintentos: int = 4
    prueba_duracion: int = 6
    prueba_resolucion: str = "720p"
    final_resolucion: str = "1080p"

    @property
    def hay_claves(self) -> bool:
        return bool(self.fal_key or self.openai_key or self.higgsfield_mcp)

    def exigir(self, cual: str) -> str:
        """Devuelve la clave o explica exactamente que falta y donde ponerlo."""
        clave = {"fal": self.fal_key, "openai": self.openai_key}.get(cual, "")
        if not clave:
            raise FaltaClave(
                f"Falta la clave de {cual}. El pipeline no lanza nada sin ella.\n"
                f"  1. cp pipeline/.env.ejemplo {ENV}\n"
                f"  2. rellena {'FAL_KEY' if cual == 'fal' else 'OPENAI_API_KEY'}\n"
                f"  .env esta en .gitignore, no se sube nunca.")
        return clave


class FaltaClave(RuntimeError):
    """Se lanza cuando falta una clave. Nunca incluye el valor de ninguna variable."""


def cargar() -> Config:
    e = _cargar_env()
    def num(k, d, tipo=float):
        try:
            return tipo(e.get(k, d))
        except ValueError:
            return tipo(d)
    return Config(
        fal_key=e.get("FAL_KEY", ""),
        openai_key=e.get("OPENAI_API_KEY", ""),
        higgsfield_mcp=e.get("HIGGSFIELD_MCP", "0") == "1",
        max_usd_run=num("MAX_USD_PER_RUN", 15.0),
        max_usd_job=num("MAX_USD_POR_JOB", 1.5),
        max_jobs=num("MAX_JOBS_SIMULTANEOS", 4, int),
        reintentos=num("REINTENTOS", 4, int),
        prueba_duracion=num("PRUEBA_DURACION", 6, int),
        prueba_resolucion=e.get("PRUEBA_RESOLUCION", "720p"),
        final_resolucion=e.get("FINAL_RESOLUCION", "1080p"),
    )
