#!/usr/bin/env python3
"""Fase 0 - hojas de contacto (6 columnas) de los frames extraidos."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
COLS, CELDA, PAD = 6, 300, 4


def hoja(imagenes: list[tuple[Path, str]], destino: Path, cols: int = COLS) -> None:
    if not imagenes:
        return
    w = CELDA
    h = int(CELDA * 9 / 16)
    filas = (len(imagenes) + cols - 1) // cols
    lienzo = Image.new("RGB", (cols * (w + PAD) + PAD, filas * (h + PAD + 16) + PAD), (12, 12, 14))
    d = ImageDraw.Draw(lienzo)
    for i, (ruta, etiqueta) in enumerate(imagenes):
        im = Image.open(ruta).convert("RGB").resize((w, h), Image.LANCZOS)
        x = PAD + (i % cols) * (w + PAD)
        y = PAD + (i // cols) * (h + PAD + 16)
        lienzo.paste(im, (x, y))
        d.text((x + 2, y + h + 2), etiqueta, fill=(190, 190, 200))
    lienzo.save(destino, optimize=True)
    print(f"{destino}  {len(imagenes)} celdas  {lienzo.size[0]}x{lienzo.size[1]}")


def por_planos(video: str) -> None:
    dir_an = RAIZ / "analysis" / video
    datos = json.loads((dir_an / "shots.json").read_text())
    ims = [(dir_an / "frames" / p["frame"],
            f"{p['n']:02d}  {p['in']:.2f}s  {p['frames']}f") for p in datos["planos"]]
    hoja(ims, dir_an / "hoja_contacto_planos.png")


def por_tiempo(video: str) -> None:
    dir_an = RAIZ / "analysis" / video
    datos = json.loads((dir_an / "shots.json").read_text())
    reps = {p["frame"] for p in datos["planos"]}
    ims = [(f, f.stem.replace("t_", "") + "s")
           for f in sorted((dir_an / "frames").glob("t_*.png")) if f.name not in reps]
    hoja(ims, dir_an / "hoja_contacto_tiempo.png")


if __name__ == "__main__":
    for v in ("on_the_road", "black_sand"):
        por_planos(v)
        por_tiempo(v)
