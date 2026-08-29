#!/usr/bin/env python3
"""Fase 3 - genera prompts/<video>/##_<slug>.md, uno por plano.

Cada archivo se monta juntando cuatro cosas:
  analysis/<video>/shots.json       tiempos y duracion reales (ffmpeg)
  analysis/<video>/anotaciones.json tipo de plano, camara, funcion
  analysis/<video>/STYLE.md         el bloque de estilo, seccion 8
  prompts/<video>/_spec.json        encuadre, accion, camara y SFX de cada plano

La shotlist es la fuente de verdad. Si cambia un plano, se cambia en anotaciones.json o en
_spec.json y se vuelve a correr esto. Aqui no se genera ninguna imagen ni ningun video.
"""
import json, re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DUR_MINIMA_SEEDANCE = 4          # Seedance 2.0 y 2.5 no bajan de 4 s


def bloque_estilo(video: str) -> str:
    """Saca el bloque de estilo del primer ``` de la seccion 8 de STYLE.md."""
    texto = (RAIZ / "analysis" / video / "STYLE.md").read_text()
    seccion = texto.split("## 8. Bloque de estilo")[1]
    return re.search(r"```\n(.*?)\n```", seccion, re.S).group(1).strip()


def nombre_ref(ref: str) -> str:
    """'characters/el_conductor' -> 'EL CONDUCTOR'."""
    return ref.split("/")[1].replace("_", " ").upper()


def bloque_de(ref: str) -> str:
    """Primer bloque ``` del sheet.md de un personaje, ubicacion o prop."""
    sheet = RAIZ / ref / "sheet.md"
    if not sheet.exists():
        return f"[falta {sheet}]"
    m = re.search(r"```\n(.*?)\n```", sheet.read_text(), re.S)
    return m.group(1).strip() if m else f"[sin bloque en {sheet}]"


def duracion_seedance(dur: float) -> tuple[int, str]:
    """Seedance no genera clips de menos de 4 s. Un plano de 1 s se genera a 4 y se corta."""
    d = max(DUR_MINIMA_SEEDANCE, int(dur) + 1)
    if dur >= DUR_MINIMA_SEEDANCE:
        nota = (f"El plano dura {dur:.2f} s. Se generan {d} s y en el montaje se corta a "
                f"{dur:.2f} s, para tener margen por los dos lados.")
    else:
        nota = (f"**El plano dura {dur:.2f} s, pero Seedance no genera clips de menos de 4 s.** "
                f"Se generan {d} s y en el montaje se recortan {dur:.2f} s del centro, que es "
                f"donde el movimiento ya esta asentado. Los primeros frames de un clip generado "
                f"casi siempre arrancan con un titubeo.")
    return d, nota


def ficha(video: str, plano: dict, anot: dict, spec: dict, estilo: str,
          ultimo: int) -> str:
    n = plano["n"]
    s = spec["planos"][str(n)]
    d_gen, nota_dur = duracion_seedance(plano["dur"])
    resumen_dur = nota_dur.split(". ")[0].replace("**", "") + "."
    refs = s["refs"]

    L = [f"# Plano {n:02d} — {s['slug'].replace('-', ' ')}", "",
         f"**Video** `{video}` · **In** {plano['in']:.2f} s · **Out** {plano['out']:.2f} s · "
         f"**Duracion** {plano['dur']:.2f} s ({plano['frames']} frames)  ",
         f"**Tipo** {anot['tipo']} · **Camara** {anot['camara']} · **Sujeto** {anot['sujeto']}  ",
         f"**Frame de referencia del original:** `analysis/{video}/frames/{plano['frame']}`", "",
         f"> **Por que existe este plano:** {anot['funcion']}", "",
         "---", "",
         "## 0. Antes de lanzar este plano", "",
         "Nada de esto es opcional. Un plano lanzado sin sus dependencias se regenera entero.", ""]

    for r in refs:
        tipo = {"characters": "hoja de personaje", "locations": "ubicacion",
                "props": "prop"}[r.split("/")[0]]
        L.append(f"- [ ] **{nombre_ref(r)}** aprobado — {tipo}, en `{r}/sheet.md`")
    L += [f"- [ ] Bloque de estilo de `analysis/{video}/STYLE.md` a mano",
          "- [ ] Start frame de este plano generado y **aprobado** (paso 1 de abajo)",
          "",
          "> Regla dura del sistema: **nunca se anima sin start frame aprobado, y nunca se hace "
          "un start frame sin la hoja de personaje y la ubicacion aprobadas.**", "",
          "---", "",
          "## 1. Prompt de start frame (imagen)", "",
          "Modelo: `nano_banana_pro` a 2k, 16:9. Alternativas: `seedream_v5_pro`, `flux_2` (pro).",
          "", "```"]

    L += [estilo, ""]
    for r in refs:
        L += [bloque_de(r), ""]
    L += [s["encuadre"], "```", "",
          "**Que lleva y en que orden:** bloque de estilo → "
          + " → ".join(f"bloque de {nombre_ref(r)}" for r in refs)
          + " → encuadre y accion congelada. El orden importa: los modelos pesan mas el "
            "principio del prompt, y el estilo es lo que no puede fallar.", ""]

    if refs:
        ids = ", ".join(f"`<<<id_de_{r.split('/')[1]}>>>`" for r in refs)
        L += [f"**Si usas Elements de Higgsfield:** en vez de pegar los bloques enteros, "
              f"escribe {ids} dentro del prompt y deja solo el bloque de estilo y el encuadre. "
              f"Los ids estan en `{refs[0]}/element.txt`.", ""]

    L += ["---", "", "## 2. Prompt de video (Seedance 2.0)", "",
          "```",
          f"SPECS: 16:9, {d_gen}s, 720p, painted 2D animation, one continuous take.",
          "REFERENCES: start frame attached as start_image. "
          + ("Character/location sheets attached as image_references: "
             + ", ".join(nombre_ref(r) for r in refs) + "." if refs else "No other references."),
          f"ACTION: {s['accion']}",
          f"CAMERA: {s['camara']}.",
          "GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. "
          "Face and identity unchanged from the reference. Palette, brushwork and lighting "
          "unchanged from the start frame. No text, no watermark, no logo, no subtitles.",
          f"SFX: {s['sfx']}.",
          "```", "",
          "**Parametros:**", "",
          "| Parametro | Valor | Por que |", "|---|---|---|",
          f"| `duration` | {d_gen} | {resumen_dur} |",
          "| `resolution` | `720p` | Es la resolucion nativa. Sube a 1080p solo en el pase final. |",
          "| `mode` | `std` | `fast` solo llega a 720p y pierde detalle en la pincelada. |",
          "| `generate_audio` | `false` | El audio se monta aparte. El nativo no encaja con la musica. |",
          "| `genre` | `action` | Sesga hacia contraste y movimiento, que es lo que pide este estilo. |",
          "", f"> **Duracion:** {nota_dur}", "",
          "> **`GUARDRAIL` no es decoracion.** `single continuous shot, no cuts` es lo que evita "
          "que el modelo invente un corte a mitad del clip, que es el fallo mas comun al animar "
          "una accion con dos partes. Y `face and identity unchanged` es lo unico que sostiene "
          "la cara a lo largo del video.", "",
          "---", "", "## 3. Que revisar antes de aprobar", "",
          "### El start frame", "",
          "- [ ] ¿La paleta cae dentro de la del acto? Comparala con los hex de `STYLE.md`, "
          "no de memoria.",
          "- [ ] ¿La luz viene del mismo lado que en el plano anterior y el siguiente?",
          "- [ ] ¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.",
          "- [ ] ¿El encuadre deja aire para el movimiento que vas a pedir en el video?", ""]

    if anot["tipo"] == "busto":
        L += ["- [ ] ¿Es **la misma cara** que en la hoja de personaje? Ponlas lado a lado.",
              "- [ ] ¿Las marcas distintivas estan en el mismo lado?", ""]
    if anot["tipo"] == "macro":
        L += ["- [ ] ¿Se cuela media cara en el borde del cuadro? Es el fallo tipico del macro.",
              "- [ ] ¿El desenfoque de fondo se lee como camara y no como fondo pintado?", ""]
    if anot["tipo"] == "amplio":
        L += ["- [ ] Si sale el personaje: ¿la **silueta** y la ropa coinciden? La cara a esta "
              "escala no se sostiene y no pasa nada.", ""]

    L += ["### El video", "",
          "- [ ] ¿Hay algun corte dentro del clip? Si lo hay, el prompt describia dos acciones. "
          "Reescribe la linea `ACTION` como **una sola cosa que pasa**.",
          "- [ ] ¿La cara se mantiene de principio a fin del clip, o deriva en el ultimo segundo?",
          "- [ ] ¿El movimiento de camara es el que pediste, o el modelo ha anadido un zoom?",
          f"- [ ] ¿Hay al menos {plano['dur']:.2f} s utiles seguidos, sin el titubeo del arranque?",
          "- [ ] ¿La pincelada se mantiene, o el clip ha derivado hacia fotorrealismo? Es la "
          "deriva mas frecuente y no se arregla en el montaje.", "",
          "---", "",
          " · ".join(
              ([f"**Anterior:** plano {n-1:02d}"] if n > 1 else [])
              + ([f"**Siguiente:** plano {n+1:02d}"] if n < ultimo else ["**Ultimo plano.**"])
          ) + "  ",
          f"**Shotlist:** `analysis/{video}/shotlist.md`"]
    return "\n".join(L) + "\n"


def generar(video: str) -> int:
    dir_an = RAIZ / "analysis" / video
    shots = json.loads((dir_an / "shots.json").read_text())
    anots = json.loads((dir_an / "anotaciones.json").read_text())["planos"]
    destino = RAIZ / "prompts" / video
    spec = json.loads((destino / "_spec.json").read_text())
    estilo = bloque_estilo(spec["estilo"])

    ultimo = max(int(k) for k in spec["planos"])
    for p in shots["planos"]:
        s = spec["planos"].get(str(p["n"]))
        if not s:
            continue
        arch = destino / f"{p['n']:02d}_{s['slug']}.md"
        arch.write_text(ficha(video, p, anots[str(p["n"])], spec, estilo, ultimo))
    return len(spec["planos"])


if __name__ == "__main__":
    for v in ("on_the_road",):
        n = generar(v)
        print(f"{v}: {n} fichas de prompt en prompts/{v}/")
