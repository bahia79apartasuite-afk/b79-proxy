"""CLI del pipeline.

    python -m pipeline frames  analysis/on_the_road/shotlist.md   genera los start frames
    python -m pipeline video   analysis/on_the_road/shotlist.md   anima los aprobados
    python -m pipeline montage analysis/on_the_road/shotlist.md   llama a scripts/montage.sh
    python -m pipeline coste   analysis/on_the_road/shotlist.md   estima sin lanzar nada

Con --dry-run no se llama a ninguna API: se imprime lo que se lanzaria y lo que costaria.
Sin .env, todo es --dry-run aunque no lo pidas.
"""
from __future__ import annotations

import argparse, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import __version__, costes, reglas, shotlist
from .config import RAIZ, FaltaClave, cargar
from .registro import Anotacion, PresupuestoAgotado, Registro
from .providers import Fal


def _aviso_sin_claves(cfg) -> bool:
    if cfg.hay_claves:
        return False
    print("Sin claves en video-ia/.env: modo simulacion. No se llamara a ninguna API.\n"
          f"  cp pipeline/.env.ejemplo {RAIZ}/.env  y rellena FAL_KEY.\n", file=sys.stderr)
    return True


def cmd_coste(planos, cfg, args) -> int:
    n_img = len(planos)
    img = costes.coste_imagen(args.modelo_imagen, args.resolucion_imagen, n_img)
    vid = sum(costes.coste_video(args.modelo_video, max(4, p.duracion), args.resolucion)
              for p in planos if not p.es_fija)
    fijas = sum(1 for p in planos if p.es_fija)
    pruebas = sum(costes.coste_video(args.modelo_video, cfg.prueba_duracion, "720p")
                  for p in planos if not p.es_fija and p.duracion > 6)
    print(f"\n{planos[0].video} — {len(planos)} planos\n")
    print(f"  start frames     {n_img:>3} x {args.modelo_imagen} {args.resolucion_imagen}"
          f"{'':>6} {img:>7.2f} USD")
    print(f"  planos animados  {n_img - fijas:>3} x {args.modelo_video} {args.resolucion}"
          f"{'':>10} {vid:>7.2f} USD")
    if pruebas:
        print(f"  pases de prueba  {'':>3}   {cfg.prueba_duracion} s a 720p"
              f"{'':>16} {pruebas:>7.2f} USD")
    print(f"  vinetas y negros {fijas:>3}   son imagenes fijas{'':>13} {0.0:>7.2f} USD")
    print(f"  {'-'*54}")
    base = img + vid + pruebas
    print(f"  a la primera{'':>34} {base:>7.2f} USD")
    print(f"  con 2.5 intentos de media (lo realista){'':>8} {base * 2.5:>7.2f} USD\n")
    aviso = costes.avisar_upscale(args.modelo_video, args.resolucion)
    if aviso:
        print(f"  Aviso: {aviso}\n")
    return 0


def _lanzar(prov, plano, cfg, reg, args, tipo: str):
    prompt = shotlist.prompt_de(plano, tipo)
    if not prompt:
        return f"{plano.id}: sin prompt en prompts/{plano.video}/, saltado"

    if tipo == "imagen":
        coste = costes.coste_imagen(args.modelo_imagen, args.resolucion_imagen)
        params = {"model": args.modelo_imagen, "resolution": args.resolucion_imagen,
                  "aspect_ratio": "16:9"}
    else:
        reglas.comprobar_resolucion(args.modelo_video, args.resolucion)
        start = reglas.exigir_start_frame(plano.id)          # regla 1
        dur = max(4, int(plano.duracion) + 1)
        reglas.exigir_prueba(plano.id, reg, dur)             # regla 2
        coste = costes.coste_video(args.modelo_video, dur, args.resolucion)
        params = {"model": args.modelo_video, "duration": dur,
                  "resolution": args.resolucion, "start_image": str(start),
                  "generate_audio": False}

    reg.comprobar_presupuesto(coste, cfg.max_usd_run, cfg.max_usd_job)   # regla 6

    if args.dry_run or not cfg.hay_claves:
        return f"{plano.id}: [simulado] {tipo} {params.get('model')} — {coste:.3f} USD"

    a = Anotacion(plano=plano.id, tipo=tipo, modelo=params["model"], proveedor=prov.nombre,
                  prompt=prompt, parametros=params, coste_estimado_usd=coste)
    try:
        if tipo == "imagen":
            t = prov.generate_image(prompt, modelo=args.modelo_imagen,
                                    resolucion=args.resolucion_imagen)
        else:
            t = prov.generate_video(prompt, modelo=args.modelo_video,
                                    start_frame=params["start_image"],
                                    duracion=params["duration"], resolucion=args.resolucion)
        t = prov.wait(t.job_id)
        a.job_id, a.estado, a.archivo = t.job_id, ("ok" if t.estado == "listo" else "error"), t.url
        a.error = t.error
    except Exception as e:                                    # noqa: BLE001
        a.estado, a.error = "error", str(e)[:300]
    reg.anotar(a)
    return f"{plano.id}: {a.estado} {a.error or a.archivo or ''}"


def cmd_generar(planos, cfg, args, tipo: str) -> int:
    reg = Registro()
    prov = Fal(cfg)
    pendientes = [p for p in planos if tipo == "imagen" or not p.es_fija]
    hilos = reglas.limite_simultaneos(len(pendientes), cfg.max_jobs)   # regla 4
    print(f"{len(pendientes)} planos, {hilos} a la vez\n")
    fallos = 0
    with ThreadPoolExecutor(max_workers=hilos) as ex:
        for linea in ex.map(lambda p: _seguro(_lanzar, prov, p, cfg, reg, args, tipo),
                            pendientes):
            print(" ", linea)
            fallos += linea.endswith("ERROR") or ": error" in linea
    print(f"\ngastado hasta ahora: {reg.gastado():.2f} USD de {cfg.max_usd_run:.2f}")
    return 1 if fallos else 0


def _seguro(fn, *a):
    try:
        return fn(*a)
    except (reglas.ReglaRota, PresupuestoAgotado, FaltaClave) as e:
        return f"{str(e).splitlines()[0]}  ERROR"


def cmd_montage(planos, cfg, args) -> int:
    lista = RAIZ / "montaje" / f"lista_{planos[0].video}.tsv"
    if not lista.exists():
        subprocess.run([sys.executable, "tools/generar_lista_montaje.py", planos[0].video],
                       cwd=RAIZ, check=True)
    cmd = ["bash", "scripts/montage.sh", "--lista", str(lista.relative_to(RAIZ))]
    if args.dry_run:
        cmd.append("--dry-run")
    print(" ".join(cmd))
    return subprocess.run(cmd, cwd=RAIZ).returncode


def main(argv=None) -> int:
    p = argparse.ArgumentParser("pipeline", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("comando", choices=["frames", "video", "montage", "coste"])
    p.add_argument("shotlist", help="analysis/<video>/shotlist.md, o el nombre del video")
    p.add_argument("--dry-run", "-n", action="store_true", help="no llama a ninguna API")
    p.add_argument("--modelo-imagen", default="nano_banana_pro")
    p.add_argument("--resolucion-imagen", default="2k")
    p.add_argument("--modelo-video", default="seedance_2_0")
    p.add_argument("--resolucion", default="720p", choices=["480p", "720p", "1080p", "4k"])
    p.add_argument("--version", action="version", version=f"pipeline {__version__}")
    args = p.parse_args(argv)

    cfg = cargar()
    _aviso_sin_claves(cfg)
    planos = shotlist.leer(args.shotlist)

    if args.comando == "coste":
        return cmd_coste(planos, cfg, args)
    if args.comando == "frames":
        return cmd_generar(planos, cfg, args, "imagen")
    if args.comando == "video":
        return cmd_generar(planos, cfg, args, "video")
    return cmd_montage(planos, cfg, args)


if __name__ == "__main__":
    raise SystemExit(main())
