#!/usr/bin/env python3
"""Fase 0 - genera analysis/<video>/shotlist.md.

La shotlist es la fuente de verdad del sistema. Se construye juntando:
  shots.json       -> in / out / duracion / frame, calculados por ffmpeg
  anotaciones.json -> tipo, camara, sujeto, accion, transicion, funcion (a mano)
Si cambia un plano se cambia en anotaciones.json y se vuelve a correr esto.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def tabla(video: str) -> str:
    dir_an = RAIZ / "analysis" / video
    s = json.loads((dir_an / "shots.json").read_text())
    a = json.loads((dir_an / "anotaciones.json").read_text())
    anot, actos = a["planos"], a["actos"]

    L = [f"# Shotlist — `{video}`", "",
         f"**{s['duracion']} s · {s['fps']} fps · {s['resolucion']} · {s['n_planos']} planos · "
         f"plano medio {s['plano_medio']} s · {s['corte_por_segundo']} cortes/s**  ",
         f"Plano mas corto {s['plano_mas_corto']} frames · mas largo {s['plano_mas_largo']} frames.",
         "",
         "> Generado por `tools/shotlist.py` desde `shots.json` (ffmpeg) + `anotaciones.json` (a mano).",
         "> **Esta tabla es la fuente de verdad.** Si cambia un plano, se cambia aqui primero.", ""]

    L += ["## Actos", "", "| Acto | Planos | Idea |", "|---|---|---|"]
    for ac in actos:
        ini, fin = ac["planos"]
        L.append(f"| {ac['nombre']} | {ini}–{fin} | {ac['idea']} |")
    L += ["", "## Planos", ""]

    por_acto = {}
    for ac in actos:
        por_acto[ac["nombre"]] = range(ac["planos"][0], ac["planos"][1] + 1)

    for ac in actos:
        ini, fin = ac["planos"]
        L += [f"### {ac['nombre']}", ""]
        L += ["| # | In | Out | Dur | Frames | Tipo | Camara | Sujeto | Accion | Transicion | Frame |",
              "|---|---|---|---|---|---|---|---|---|---|---|"]
        for p in s["planos"]:
            if not (ini <= p["n"] <= fin):
                continue
            n = anot[str(p["n"])]
            L.append(
                f"| **{p['n']:02d}** | {p['in']:.2f} | {p['out']:.2f} | {p['dur']:.2f} s | "
                f"{p['frames']} | {n['tipo']} | {n['camara']} | {n['sujeto']} | {n['accion']} | "
                f"{n['transicion']} | ![{p['n']:02d}](frames/{p['frame']}) |")
        L += ["", "**Por que esta cada plano**", ""]
        for p in s["planos"]:
            if ini <= p["n"] <= fin:
                L.append(f"- **{p['n']:02d}** ({p['frames']} f) — {anot[str(p['n'])]['funcion']}")
        L.append("")

    # recuento por tipo
    tipos: dict[str, list] = {}
    for p in s["planos"]:
        tipos.setdefault(anot[str(p["n"])]["tipo"], []).append(p)
    L += ["## Reparto por tipo de plano", "",
          "| Tipo | Planos | % del metraje | Duracion media |", "|---|---|---|---|"]
    for t, ps in sorted(tipos.items(), key=lambda kv: -len(kv[1])):
        seg = sum(p["dur"] for p in ps)
        L.append(f"| {t} | {len(ps)} | {100 * seg / s['duracion']:.0f} % | "
                 f"{seg / len(ps):.2f} s |")

    # cadena de tipos: el patron de secuencia
    cadena = " → ".join(anot[str(p["n"])]["tipo"] for p in s["planos"])
    L += ["", "## Patron de secuencia", "",
          "El orden real en que se encadenan los tipos de plano:", "",
          "```", cadena, "```", ""]
    pares: dict[str, int] = {}
    seq = [anot[str(p["n"])]["tipo"] for p in s["planos"]]
    for i in range(len(seq) - 1):
        pares[f"{seq[i]} → {seq[i+1]}"] = pares.get(f"{seq[i]} → {seq[i+1]}", 0) + 1
    L += ["Los encadenados que mas se repiten:", ""]
    for k, v in sorted(pares.items(), key=lambda kv: -kv[1])[:6]:
        L.append(f"- `{k}` — {v} veces")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    for v in ("on_the_road", "black_sand"):
        destino = RAIZ / "analysis" / v / "shotlist.md"
        destino.write_text(tabla(v))
        print(f"{destino}  {len(destino.read_text().splitlines())} lineas")
