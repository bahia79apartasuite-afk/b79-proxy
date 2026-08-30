#!/usr/bin/env python3
"""Fase 5 - descarga e incrusta las tipografias de la guia.

La guia tiene que abrir sin internet, asi que las fuentes van dentro del HTML como
data URI. Se descargan una sola vez y quedan cacheadas en guia/_fuentes.json, que si
entra en git: asi regenerar la guia no necesita red.

Dos familias, y la division dice algo:
  Archivo    la maquinaria — interfaz, etiquetas, datos, cifras
  Newsreader la prosa — el ensayo se lee como cine, los controles se ven como una isla
Para timecodes y hex se usa la monoespaciada del sistema, que en Mac, Windows y Linux
ya es buena y ahorra 100 KB.
"""
from __future__ import annotations

import base64
import json
import re
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "guia" / "_fuentes.json"

# Un User-Agent de Chrome moderno para que Google sirva woff2 (4 veces mas pequeno que ttf)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

FAMILIAS = {
    # variable: un archivo por estilo cubre todo el rango de peso
    "Archivo": "Archivo:wght@400..800",
    "Newsreader": "Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400",
}


def _pedir(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=40).read()


def _css_de(familia: str) -> str:
    return _pedir(f"https://fonts.googleapis.com/css2?family={familia}"
                  f"&display=swap").decode()


def descargar() -> str:
    """Devuelve el CSS de @font-face con las fuentes ya incrustadas en base64."""
    partes: list[str] = []
    for nombre, consulta in FAMILIAS.items():
        css = _css_de(consulta)
        # solo el subconjunto latino basico: el resto (cirilico, griego, vietnamita,
        # y hasta latin-ext) son 200 KB que ningun texto en espanol necesita
        bloques = re.findall(r"/\* ([a-z-]+) \*/\s*(@font-face \{.*?\})", css, re.S)
        for subconjunto, bloque in bloques:
            # 'latin' ya cubre el espanol entero (tildes, ñ, ¿, ¡). latin-ext sobra.
            if subconjunto != "latin":
                continue
            m = re.search(r"src: url\((https://[^)]+\.woff2)\)", bloque)
            if not m:
                continue
            datos = base64.b64encode(_pedir(m.group(1))).decode()
            bloque = bloque.replace(
                m.group(0), f"src: url(data:font/woff2;base64,{datos}) format('woff2')")
            partes.append(re.sub(r"\s+", " ", bloque).strip())
            print(f"  {nombre} {subconjunto}: {len(datos)//1024} KB en base64")
    return "\n".join(partes)


def css() -> str:
    """El CSS de fuentes, de la cache si existe. Nunca vuelve a la red sin necesidad."""
    if CACHE.exists():
        return json.loads(CACHE.read_text())["css"]
    print("descargando tipografias (una sola vez)…")
    hoja = descargar()
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps({"css": hoja}, ensure_ascii=False))
    return hoja


if __name__ == "__main__":
    hoja = css()
    print(f"\n{len(hoja)//1024} KB de CSS de fuentes en {CACHE}")
