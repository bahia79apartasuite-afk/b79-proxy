#!/usr/bin/env python3
"""Fase 0 - paleta dominante por acto y ritmo de corte, a partir de los frames extraidos."""
import json, colorsys
from pathlib import Path
from collections import Counter
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent

# Los actos se marcan a mano tras mirar la hoja de contacto de planos.
ACTOS = {
    "on_the_road": [
        ("1. Diner del desierto", 0.0, 10.47),
        ("2. Quemada de rueda y donuts", 10.47, 23.63),
        ("3. Carretera y velocidad", 23.63, 39.01),
    ],
    "black_sand": [
        ("1. Persecucion en el callejon", 0.0, 9.50),
        ("2. Impacto comic y trato", 9.50, 25.53),
        ("3. Calle, KRAK! y la banda", 25.53, 48.17),
        ("4. Pelea nocturna, KRACK!!", 48.17, 67.57),
        ("5. Titulos BLACK SAND / OZ", 67.57, 75.58),
    ],
}


def hexa(rgb) -> str:
    return "#%02X%02X%02X" % rgb


def muestra(imagenes: list[Path]) -> Image.Image:
    """Junta los frames del acto en una sola tira para cuantizarla de una vez."""
    minis = [Image.open(r).convert("RGB").resize((64, 36), Image.LANCZOS) for r in imagenes]
    tira = Image.new("RGB", (64, 36 * len(minis)))
    for i, m in enumerate(minis):
        tira.paste(m, (0, 36 * i))
    return tira


def _describir(rgb, peso) -> dict:
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in rgb])
    return {"rgb": list(rgb), "hex": hexa(rgb), "peso": round(peso, 1),
            "tono": round(h * 360), "luz": round(l * 100), "sat": round(s * 100)}


def dominantes(imagenes: list[Path], n: int = 6, solo_croma: bool = False) -> list[dict]:
    """Paleta por median-cut. Con solo_croma descarta negros, blancos y grises:
    lo que queda es la identidad de color del acto, no su exposicion."""
    if not imagenes:
        return []
    tira = muestra(imagenes)
    q = tira.quantize(colors=48, method=Image.MEDIANCUT)
    pal = q.getpalette()
    total = tira.size[0] * tira.size[1]
    entradas = []
    for cuenta, idx in sorted(q.getcolors(1 << 20) or [], reverse=True):
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        d = _describir(rgb, 100 * cuenta / total)
        if solo_croma and (d["sat"] < 22 or d["luz"] < 10 or d["luz"] > 92):
            continue
        # descarta un color demasiado parecido a otro ya elegido
        if any(sum(abs(a - b) for a, b in zip(rgb, o["rgb"])) < 70 for o in entradas):
            continue
        entradas.append(d)
        if len(entradas) >= n:
            break
    return entradas


def acentos(imagenes: list[Path], n: int = 4) -> list[dict]:
    """Los colores firma: alta saturacion aunque ocupen poca superficie.
    Son los que la vista lee como 'el color de la peli' (el amarillo del coche,
    el rojo del comic) y los que hay que nombrar en el prompt."""
    if not imagenes:
        return []
    tira = muestra(imagenes)
    q = tira.quantize(colors=64, method=Image.MEDIANCUT)
    pal = q.getpalette()
    total = tira.size[0] * tira.size[1]
    cand = []
    for cuenta, idx in (q.getcolors(1 << 20) or []):
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        d = _describir(rgb, 100 * cuenta / total)
        if d["sat"] >= 45 and d["peso"] >= 0.25 and 15 <= d["luz"] <= 88:
            cand.append(d)
    cand.sort(key=lambda d: -(d["sat"] * (d["peso"] ** 0.5)))
    salida = []
    for d in cand:
        if any(sum(abs(a - b) for a, b in zip(d["rgb"], o["rgb"])) < 80 for o in salida):
            continue
        salida.append(d)
        if len(salida) >= n:
            break
    return salida


def analizar(video: str) -> dict:
    dir_an = RAIZ / "analysis" / video
    datos = json.loads((dir_an / "shots.json").read_text())
    frames = sorted((dir_an / "frames").glob("t_*.png"))
    res = {"video": video, "actos": []}
    for nombre, ini, fin in ACTOS[video]:
        del_acto = [f for f in frames if ini <= float(f.stem[2:]) < fin]
        planos = [p for p in datos["planos"] if ini <= p["in"] < fin]
        dur = fin - ini
        res["actos"].append({
            "acto": nombre, "in": ini, "out": fin, "dur": round(dur, 2),
            "planos": len(planos),
            "cortes_por_segundo": round(len(planos) / dur, 2),
            "plano_medio": round(dur / max(1, len(planos)), 2),
            "paleta": dominantes(del_acto),
            "croma": dominantes(del_acto, n=5, solo_croma=True),
            "acentos": acentos(del_acto),
        })
    res["paleta_global"] = dominantes(frames, n=8)
    res["croma_global"] = dominantes(frames, n=6, solo_croma=True)
    res["acentos_global"] = acentos(frames, n=5)
    (dir_an / "paleta.json").write_text(json.dumps(res, indent=2, ensure_ascii=False))
    return res


if __name__ == "__main__":
    for v in ("on_the_road", "black_sand"):
        r = analizar(v)
        print(f"\n### {v}")
        for a in r["actos"]:
            cols = "  ".join(f"{c['hex']}({c['peso']}%)" for c in a["paleta"])
            cro = "  ".join(f"{c['hex']}" for c in a["croma"])
            ace = "  ".join(f"{c['hex']}(s{c['sat']})" for c in a["acentos"])
            print(f"  {a['acto']:<34} {a['dur']:>5.1f}s {a['planos']:>3}pl "
                  f"{a['plano_medio']:.2f}s/pl\n      base   {cols}\n      croma  {cro}"
                  f"\n      acento {ace}")
        print("  GLOBAL base  " + "  ".join(c["hex"] for c in r["paleta_global"]))
        print("  GLOBAL croma " + "  ".join(c["hex"] for c in r["croma_global"]))
        print("  GLOBAL acento " + "  ".join(c["hex"] for c in r["acentos_global"]))
