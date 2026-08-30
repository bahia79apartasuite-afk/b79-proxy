#!/usr/bin/env python3
"""Fase 5 - copia a guia/img/ los frames que usa la guia, ya reducidos.

La guia tiene que funcionar sin internet, asi que las imagenes van en la propia carpeta.
Se reducen y se cuantizan para que abrirla en el movil no tarde: el estilo pintado tiene
paleta corta, asi que bajar a 128 colores no se nota y pesa un tercio.
"""
import json, shutil
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "guia" / "img"
# 640 px: nitido en las tarjetas (que lo pintan a 300-440) y suficiente en el visor
# grande y en el lightbox. Un solo tamano en vez de dos evita duplicar 6 MB.
ANCHO = 640
COLORES = 128


def copiar(origen: Path, nombre: str) -> int:
    salida = DESTINO / nombre
    im = Image.open(origen).convert("RGB")
    im = im.resize((ANCHO, round(ANCHO * im.height / im.width)), Image.LANCZOS)
    im.quantize(colors=COLORES, method=Image.MEDIANCUT).save(salida, optimize=True)
    return salida.stat().st_size


if __name__ == "__main__":
    DESTINO.mkdir(parents=True, exist_ok=True)
    total = n = 0
    for video in ("on_the_road", "black_sand"):
        dir_an = RAIZ / "analysis" / video
        datos = json.loads((dir_an / "shots.json").read_text())
        for p in datos["planos"]:
            total += copiar(dir_an / "frames" / p["frame"], f"{video}_{p['n']:02d}.png")
            n += 1
    print(f"{n} imagenes, {total/1e6:.1f} MB en {DESTINO}")
