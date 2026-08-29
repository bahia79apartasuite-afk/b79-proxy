#!/usr/bin/env python3
"""Fase 0 - deteccion de planos y extraccion de frames de los videos de ref/.

Tres senales se combinan para decidir donde esta cada corte:
  1. cuts_raw.txt   ffmpeg select='gt(scene,0.25)'  -> el corte duro, la senal principal
  2. black.txt      ffmpeg blackdetect              -> los negros son planos en si mismos
  3. cuts_soft.txt  ffmpeg select='gt(scene,0.12)'  -> solo dentro de planos largos, para
                                                       rescatar cortes suaves que 0.25 se salta
Salida por video:
  analysis/<video>/frames/t_SS.ss.png   grid cada 0.5 s + frame representativo de cada plano
  analysis/<video>/shots.json           limites, duracion y frame de cada plano
No consulta ninguna API: solo ffmpeg local sobre los archivos de ref/.
"""
import json, subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

FF = imageio_ffmpeg.get_ffmpeg_exe()
RAIZ = Path(__file__).resolve().parent.parent
ANCHO_GRID = 640          # frames del grid de 0.5 s
ANCHO_PLANO = 960         # frame representativo de cada plano (es el que va a la guia)
COLORES = 160             # cuantizacion del PNG: el estilo pintado tiene paleta corta
FRAME = 1 / 30
PLANO_LARGO = 4.0         # a partir de aqui buscamos cortes suaves dentro del plano
SEPARACION_SOFT = 1.2     # un corte suave tiene que estar a esta distancia de otro limite
UMBRAL_SOFT = 0.18        # por debajo de esto, 'scene' se dispara con el movimiento de camara


def duracion(mp4: Path) -> float:
    err = subprocess.run([FF, "-hide_banner", "-i", str(mp4)],
                         capture_output=True, text=True).stderr
    for linea in err.splitlines():
        if "Duration:" in linea:
            hh, mm, ss = linea.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(hh) * 3600 + int(mm) * 60 + float(ss)
    raise SystemExit(f"no pude leer la duracion de {mp4}")


def leer_tiempos(arch: Path) -> list[float]:
    return [float(x) for x in arch.read_text().split()] if arch.exists() else []


def sacar_frame(mp4: Path, t: float, destino: Path, ancho: int) -> bool:
    """Devuelve False si el instante cae fuera del video y ffmpeg no escribio nada."""
    if destino.exists():
        return True
    subprocess.run(
        [FF, "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(mp4),
         "-frames:v", "1", "-vf", f"scale={ancho}:-2", "-y", str(destino)], check=True)
    if not destino.exists():
        return False
    im = Image.open(destino).convert("RGB")
    im.quantize(colors=COLORES, method=Image.MEDIANCUT).save(destino, optimize=True)
    return True


def limites_de(nombre: str, dur: float) -> list[float]:
    dir_an = RAIZ / "analysis" / nombre
    duros = leer_tiempos(dir_an / "cuts_raw.txt")
    negros = [float(x) for l in (dir_an / "black.txt").read_text().split("\n") if l.strip()
              for x in l.split()] if (dir_an / "black.txt").exists() else []
    # cuts_soft.txt se genero a 0.12; filtramos aqui para no volver a pasar el video
    suaves = leer_tiempos(dir_an / "cuts_soft_score.txt") or leer_tiempos(dir_an / "cuts_soft.txt")

    base = sorted({round(t, 3) for t in [0.0] + duros + negros + [dur]})
    base = [t for i, t in enumerate(base) if i == 0 or t - base[i - 1] > 0.02]

    extra = []
    for i in range(len(base) - 1):
        ini, fin = base[i], base[i + 1]
        if fin - ini <= PLANO_LARGO:
            continue
        ultimo = ini
        for s in suaves:
            if ini + SEPARACION_SOFT < s < fin - SEPARACION_SOFT and s - ultimo >= SEPARACION_SOFT:
                extra.append(round(s, 3))
                ultimo = s
    return sorted(set(base + extra))


def procesar(nombre: str) -> dict:
    mp4 = RAIZ / "ref" / f"{nombre}.mp4"
    dir_an = RAIZ / "analysis" / nombre
    dir_fr = dir_an / "frames"
    dir_fr.mkdir(parents=True, exist_ok=True)

    dur = duracion(mp4)
    lim = limites_de(nombre, dur)
    negros = []
    arch_negros = dir_an / "black.txt"
    if arch_negros.exists():
        for linea in arch_negros.read_text().splitlines():
            if linea.strip():
                a, b = (float(x) for x in linea.split())
                negros.append((a, b))

    planos = []
    for i in range(len(lim) - 1):
        ini, fin = lim[i], lim[i + 1]
        # 40% dentro del plano: esquiva el frame de transicion y el motion blur de entrada
        t_rep = min(ini + (fin - ini) * 0.4, max(ini, fin - FRAME))
        arch = dir_fr / f"t_{t_rep:05.2f}.png"
        # cerca del final del archivo el instante puede caer detras del ultimo frame
        while not sacar_frame(mp4, t_rep, arch, ANCHO_PLANO) and t_rep > ini:
            arch.unlink(missing_ok=True)
            t_rep = max(ini, t_rep - 0.2)
            arch = dir_fr / f"t_{t_rep:05.2f}.png"
        planos.append({
            "n": len(planos) + 1,
            "in": round(ini, 2), "out": round(fin, 2), "dur": round(fin - ini, 2),
            "frames": max(1, round((fin - ini) * 30)),
            "t_rep": round(t_rep, 2), "frame": arch.name,
            "negro": any(a - 0.05 <= ini and fin <= b + 0.05 for a, b in negros),
        })

    t = 0.0
    while t < dur - 0.1:
        sacar_frame(mp4, t, dir_fr / f"t_{t:05.2f}.png", ANCHO_GRID)
        t += 0.5

    datos = {"video": nombre, "duracion": round(dur, 2), "fps": 30, "resolucion": "1276x718",
             "planos": planos, "n_planos": len(planos),
             "corte_por_segundo": round((len(planos) - 1) / dur, 2),
             "plano_medio": round(dur / len(planos), 2),
             "plano_mas_corto": min(p["frames"] for p in planos),
             "plano_mas_largo": max(p["frames"] for p in planos)}
    (dir_an / "shots.json").write_text(json.dumps(datos, indent=2, ensure_ascii=False))
    return datos


if __name__ == "__main__":
    for v in ("on_the_road", "black_sand"):
        d = procesar(v)
        print(f"{v}: {d['duracion']}s  {d['n_planos']} planos  medio {d['plano_medio']}s  "
              f"corto {d['plano_mas_corto']}f  largo {d['plano_mas_largo']}f  "
              f"{d['corte_por_segundo']} cortes/s")
