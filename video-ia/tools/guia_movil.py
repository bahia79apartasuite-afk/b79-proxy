#!/usr/bin/env python3
"""Fase 5 - la guia en UN SOLO archivo, para abrirla en el movil.

guia/index.html va con la carpeta guia/img/ al lado. Si te mandas solo el HTML al
telefono, se queda sin las 81 imagenes. Esto mete todo dentro:

  guia/sala-de-montaje.html   un archivo. Lo descargas, lo abres, funciona sin internet.
  guia/_pagina.html           el mismo contenido sin la envoltura <html>/<head>/<body>,
                              que es lo que necesita el publicador de paginas.

Las imagenes se recodifican a WebP para que quepan: el PNG a 640 px pesa 5,9 MB entre
las 81, y en base64 se iria a 8 MB. En WebP a 560 px bajan a menos de 2 MB, y en un
estilo pintado de paleta corta la diferencia no se ve.
"""
from __future__ import annotations

import base64
import io
import re
from pathlib import Path

from PIL import Image

import generar_guia

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "analysis"
ARCHIVO = RAIZ / "guia" / "sala-de-montaje.html"
PAGINA = RAIZ / "guia" / "_pagina.html"

ANCHO = 560
CALIDAD = 78


def data_uri(video: str, n: int) -> str:
    """El frame del plano n, en WebP y ya como data URI."""
    frames = sorted((ORIGEN / video / "frames").glob("t_*.png"))
    import json
    shots = json.loads((ORIGEN / video / "shots.json").read_text())
    nombre = next(p["frame"] for p in shots["planos"] if p["n"] == n)
    im = Image.open(ORIGEN / video / "frames" / nombre).convert("RGB")
    im = im.resize((ANCHO, round(ANCHO * im.height / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=CALIDAD, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def incrustar(html: str) -> tuple[str, str, int]:
    """Cambia src="img/<video>_NN.png" por data-img="<video>_NN" y devuelve el mapa.

    Cada frame sale en tres sitios (el visor, la tira y la ficha de anatomia). Repetir
    el data URI las tres veces convertia un archivo de 2,4 MB en uno de 5,9. Con el mapa,
    cada imagen se escribe una sola vez y un bucle le pone el src a cada <img>.
    """
    cache: dict[str, str] = {}

    def cambia(m: re.Match) -> str:
        clave = m.group(1)
        if clave not in cache:
            video, n = clave.rsplit("_", 1)
            cache[clave] = data_uri(video, int(n))
        return f'data-img="{clave}"'

    cuerpo = re.sub(r'src="img/([a-z_]+_\d{2})\.png"', cambia, html)
    mapa = ("window.__IMG__={"
            + ",".join(f'"{k}":"{v}"' for k, v in sorted(cache.items()))
            + "};for(var _i of document.querySelectorAll('img[data-img]'))"
              "_i.src=window.__IMG__[_i.dataset.img];")
    return cuerpo, mapa, sum(len(v) for v in cache.values())


if __name__ == "__main__":
    p = generar_guia.partes()
    cuerpo, mapa, pesado = incrustar(p["cuerpo"])
    print(f"{cuerpo.count('data-img=')} referencias a "
          f"{mapa.count('data:image/webp')} imagenes distintas, "
          f"{pesado / 1e6:.1f} MB en base64")

    cabeza = f'<style>{p["fuentes"]}</style>\n<style>{p["css"]}</style>'
    # el mapa va antes del JS principal, que lo usa para el lightbox
    pie = (f'<script>{mapa}</script>\n<script>{p["datos"]}</script>\n'
           f'<script>{p["js"]}</script>')

    ARCHIVO.write_text(
        f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{p['titulo']}</title>
<meta name="description" content="{p['descripcion']}">
<meta name="color-scheme" content="dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
{cabeza}
</head>
<body>
{cuerpo}
{pie}
</body>
</html>
""", encoding="utf-8")

    # La version publicable va sin <html>/<head>/<body>: la envoltura la pone el
    # publicador. El <title> si tiene que ir, y arriba del todo.
    PAGINA.write_text(f"<title>{p['titulo']}</title>\n{cabeza}\n{cuerpo}\n{pie}\n",
                      encoding="utf-8")

    for f in (ARCHIVO, PAGINA):
        print(f"{f.relative_to(RAIZ)}  {f.stat().st_size / 1e6:.1f} MB")
