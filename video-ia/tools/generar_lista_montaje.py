#!/usr/bin/env python3
"""Fase 4 - genera montaje/lista_<video>.tsv desde la shotlist.

La shotlist es la fuente de verdad tambien para el montaje: el orden y la duracion de cada
plano salen de shots.json, no se escriben a mano. Los planos de 1 a 5 frames se marcan como
'fija' (imagen, no video): generar un clip de 4 s para usar 2 frames es tirar creditos.
"""
import json, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
UMBRAL_FIJA = 5   # frames; por debajo de esto, el plano es una imagen fija


def generar(video: str) -> Path:
    dir_an = RAIZ / "analysis" / video
    shots = json.loads((dir_an / "shots.json").read_text())
    anots = json.loads((dir_an / "anotaciones.json").read_text())["planos"]
    spec_p = RAIZ / "prompts" / video / "_spec.json"
    slugs = {}
    if spec_p.exists():
        slugs = {k: v["slug"] for k, v in json.loads(spec_p.read_text())["planos"].items()}

    L = [f"# Montaje de {video} — generado por tools/generar_lista_montaje.py",
         f"# {shots['n_planos']} planos, {shots['duracion']} s. NO edites esto a mano:",
         f"# edita analysis/{video}/anotaciones.json y vuelve a correr el generador.",
         "#",
         "# tipo\tarchivo\tinicio\tduracion\topciones"]

    for p in shots["planos"]:
        n, a = p["n"], anots[str(p["n"])]
        slug = slugs.get(str(n), a["tipo"])
        nom = f"{n:02d}_{slug}"
        # los negros de puntuacion son los unicos planos sin sujeto. Ojo: NO buscar la
        # palabra "negro" en la accion, porque las vinetas son "blanco/negro/rojo".
        if a["sujeto"] == "-":
            L.append(f"negro\t-\t-\t{p['dur']:.2f}\t"
                     f"\t# {n:02d} {a['funcion'][:60]}")
        elif p["frames"] <= UMBRAL_FIJA:
            L.append(f"fija\tstills/{nom}.png\t-\t{p['dur']:.2f}\t"
                     f"\t# {n:02d} {p['frames']}f — imagen fija, no lo animes")
        else:
            # se genera de mas y se recorta del centro: el arranque de un clip generado titubea
            gen = max(4, int(p["dur"]) + 1)
            ini = round(max(0.3, (gen - p["dur"]) / 2), 2)
            L.append(f"clip\tclips/{nom}.mp4\t{ini:.2f}\t{p['dur']:.2f}\t"
                     f"\t# {n:02d} {a['tipo']} — clip de {gen}s")

    destino = RAIZ / "montaje" / f"lista_{video}.tsv"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text("\n".join(L) + "\n")
    return destino


if __name__ == "__main__":
    for v in sys.argv[1:] or ("on_the_road", "black_sand"):
        d = generar(v)
        filas = sum(1 for l in d.read_text().splitlines() if l and not l.startswith("#"))
        print(f"{d}  {filas} filas")
