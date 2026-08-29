"""Lee la shotlist. Es la fuente de verdad, tambien para el pipeline."""
from __future__ import annotations

import json, re
from dataclasses import dataclass
from pathlib import Path

from .config import RAIZ


@dataclass
class Plano:
    n: int
    video: str
    slug: str
    inicio: float
    fin: float
    duracion: float
    frames: int
    tipo: str

    @property
    def id(self) -> str:
        return f"{self.video}_{self.n:02d}_{self.slug}"

    @property
    def es_fija(self) -> bool:
        """5 frames o menos: es una imagen, no un video. Regla de sentido comun y de dinero."""
        return self.frames <= 5


def leer(ruta: str | Path) -> list[Plano]:
    """Acepta analysis/<video>/shotlist.md o el nombre del video."""
    p = Path(ruta)
    video = p.parent.name if p.suffix == ".md" else str(ruta)
    dir_an = RAIZ / "analysis" / video
    if not (dir_an / "shots.json").exists():
        raise SystemExit(f"no encuentro {dir_an}/shots.json. ¿Has corrido tools/extraer_frames.py?")

    shots = json.loads((dir_an / "shots.json").read_text())
    anots = json.loads((dir_an / "anotaciones.json").read_text())["planos"]
    spec_p = RAIZ / "prompts" / video / "_spec.json"
    slugs = ({k: v["slug"] for k, v in json.loads(spec_p.read_text())["planos"].items()}
             if spec_p.exists() else {})

    return [Plano(n=s["n"], video=video, slug=slugs.get(str(s["n"]), anots[str(s["n"])]["tipo"]),
                  inicio=s["in"], fin=s["out"], duracion=s["dur"], frames=s["frames"],
                  tipo=anots[str(s["n"])]["tipo"])
            for s in shots["planos"]]


def prompt_de(plano: Plano, seccion: str) -> str | None:
    """Saca el prompt de imagen o de video de prompts/<video>/##_<slug>.md."""
    ficha = RAIZ / "prompts" / plano.video / f"{plano.n:02d}_{plano.slug}.md"
    if not ficha.exists():
        return None
    texto = ficha.read_text()
    marca = ("## 1. Prompt de start frame" if seccion == "imagen"
             else "## 2. Prompt de video")
    if marca not in texto:
        return None
    m = re.search(r"```\n(.*?)\n```", texto.split(marca)[1], re.S)
    return m.group(1).strip() if m else None
