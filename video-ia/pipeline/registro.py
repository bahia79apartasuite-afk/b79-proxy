"""runs/log.jsonl — una linea por trabajo, y el control de presupuesto.

Cada trabajo deja: prompt, modelo, parametros, coste estimado, coste real y la ruta del
archivo. Es lo que permite saber despues por que un plano quedo bien y reproducirlo.
"""
from __future__ import annotations

import json, time
from dataclasses import dataclass, asdict, field
from pathlib import Path

from .config import RAIZ


@dataclass
class Anotacion:
    plano: str
    tipo: str                      # "imagen" | "video"
    modelo: str
    proveedor: str
    prompt: str
    parametros: dict
    coste_estimado_usd: float
    coste_real_usd: float | None = None
    archivo: str | None = None
    job_id: str | None = None
    estado: str = "lanzado"        # lanzado | ok | error | rechazado
    error: str | None = None
    intentos: int = 1
    t: float = field(default_factory=time.time)


class PresupuestoAgotado(RuntimeError):
    pass


class Registro:
    def __init__(self, ruta: Path | None = None) -> None:
        self.ruta = ruta or RAIZ / "runs" / "log.jsonl"
        self.ruta.parent.mkdir(parents=True, exist_ok=True)

    def anotar(self, a: Anotacion) -> None:
        with self.ruta.open("a") as f:
            f.write(json.dumps(asdict(a), ensure_ascii=False) + "\n")

    def gastado(self) -> float:
        """Lo que ya se ha gastado de verdad; si no hay coste real, cuenta el estimado."""
        total = 0.0
        if not self.ruta.exists():
            return 0.0
        for linea in self.ruta.read_text().splitlines():
            if not linea.strip():
                continue
            d = json.loads(linea)
            if d.get("estado") == "rechazado":
                continue
            total += d.get("coste_real_usd") or d.get("coste_estimado_usd") or 0.0
        return round(total, 4)

    def comprobar_presupuesto(self, siguiente_usd: float, tope_run: float,
                              tope_job: float) -> None:
        """Se llama ANTES de lanzar. Es la regla 6 y la impone el codigo."""
        if siguiente_usd > tope_job:
            raise PresupuestoAgotado(
                f"Un solo trabajo costaria {siguiente_usd:.2f} USD y el tope por trabajo es "
                f"{tope_job:.2f}. Sube MAX_USD_POR_JOB en .env si es lo que quieres.")
        ya = self.gastado()
        if ya + siguiente_usd > tope_run:
            raise PresupuestoAgotado(
                f"Llevas {ya:.2f} USD y este trabajo son {siguiente_usd:.2f} mas: pasarias de "
                f"{tope_run:.2f}, el tope de MAX_USD_PER_RUN. El pipeline para aqui.\n"
                f"Sube el tope en .env, o vacia runs/log.jsonl si empiezas una tanda nueva.")
