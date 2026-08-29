#!/usr/bin/env python3
"""Fase 5 - genera guia/index.html.

Un solo archivo, autocontenido, sin CDN y sin fuentes externas. Las imagenes van en
guia/img/ (las prepara tools/preparar_imagenes_guia.py), asi que la guia abre sin internet.

Todo el contenido de datos sale del analisis, no de escribirlo a mano:
  analysis/<video>/shots.json       tiempos y duraciones (ffmpeg)
  analysis/<video>/anotaciones.json tipo de plano y funcion narrativa
  analysis/<video>/paleta.json      paletas medidas por acto
  analysis/<video>/STYLE.md         el bloque de estilo
Asi la guia no se puede desincronizar de la shotlist.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

from guia_css import CSS
from guia_js import JS
from guia_contenido import PASOS, ERRORES, GLOSARIO, HERRAMIENTAS, PLANTILLAS_FORM, MAPA_SVG

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "guia" / "index.html"


# ---------------------------------------------------------------- utilidades
def e(t) -> str:
    return html.escape(str(t), quote=True)


def datos(video: str) -> dict:
    d = RAIZ / "analysis" / video
    return {
        "shots": json.loads((d / "shots.json").read_text()),
        "anot": json.loads((d / "anotaciones.json").read_text()),
        "paleta": json.loads((d / "paleta.json").read_text()),
        "estilo": bloque_estilo(video),
    }


def bloque_estilo(video: str) -> str:
    texto = (RAIZ / "analysis" / video / "STYLE.md").read_text()
    seccion = texto.split("## 8. Bloque de estilo")[1]
    return re.search(r"```\n(.*?)\n```", seccion, re.S).group(1).strip()


def prompt(texto: str, rotulo: str = "", plantilla: str = "") -> str:
    attr = f' data-plantilla="{e(plantilla)}"' if plantilla else ""
    cuerpo = e(texto) if not plantilla else ""
    return (f'<div class="prompt">'
            + (f'<p class="rotulo">{e(rotulo)}</p>' if rotulo else "")
            + f'<pre{attr}>{cuerpo}</pre>'
            f'<button class="copiar" type="button">copiar</button></div>')


def swatches(colores: list[dict]) -> str:
    s = "".join(
        f'<div class="swatch"><i style="background:{e(c["hex"])}"></i>'
        f'<span>{e(c["hex"])}</span></div>' for c in colores)
    return f'<div class="paleta">{s}</div>'


def tabla(cabeceras: list[str], filas: list[list[str]]) -> str:
    th = "".join(f"<th>{e(c)}</th>" for c in cabeceras)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in f) + "</tr>" for f in filas)
    return f'<div class="tabla"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


# ---------------------------------------------------------------- 1. inicio
def vista_inicio(d: dict) -> str:
    otr, bs = d["on_the_road"]["shots"], d["black_sand"]["shots"]
    herr = tabla(["Para que", "Herramienta", "Alternativa", "Nota"], [
        [f"<b>{e(h[0])}</b>", f"<code>{e(h[1])}</code>", f"<code>{e(h[2])}</code>", e(h[3])]
        for h in HERRAMIENTAS])

    coste = tabla(["Concepto", "Cantidad", "A la primera", "Realista (2,5 intentos)"], [
        ["Start frames (imagen)", "28", "1,68 USD", "4,20 USD"],
        ["Planos animados 4-6 s", "28", "8,21 USD", "20,53 USD"],
        ["Vinetas y negros", "0 en este video", "0,00 USD", "0,00 USD"],
        ["<b>Total</b>", "<b>39 s de video</b>", "<b>9,89 USD</b>", "<b>24,73 USD</b>"],
    ])

    return f"""
<section id="inicio">
  <h1>Hacer un video de IA que no parezca un video de IA</h1>
  <p class="intro">Esta guia sale de diseccionar dos videos reales, plano a plano, con
  <code>ffmpeg</code>. No es teoria: los tiempos, las paletas y el ritmo que vas a leer estan
  medidos sobre los archivos. Si sigues el orden, sale. Si te lo saltas, no.</p>

  <div class="rejilla tres">
    <div class="tarjeta"><span class="dato">{otr['n_planos']}</span>
      <span>planos en 39 s de <code>on_the_road</code>, uno cada {otr['plano_medio']} s</span></div>
    <div class="tarjeta"><span class="dato">{bs['n_planos']}</span>
      <span>planos en 76 s de <code>black_sand</code>, el mas corto de 1 frame</span></div>
    <div class="tarjeta"><span class="dato">31 %</span>
      <span>del metraje son insertos macro de objetos. Ahi esta el truco</span></div>
  </div>

  <h2>Que es este estilo</h2>
  <p>Animacion pintada. Se reconoce por cinco cosas concretas, y las cinco se pueden pedir:</p>
  <ul>
    <li><b>Pincelada a la vista.</b> El fondo se resuelve en manchas grandes que no se funden
      entre si. La cara, en cambio, va modelada. Ese desequilibrio es lo que hace que el
      personaje salte del plano.</li>
    <li><b>Linea solo donde hace falta.</b> Contorno grueso en ceja, parpado y nariz; el resto
      se separa por contraste de valor. Si pides <i>bold outlines</i> a secas, te lo pone en
      todo y pierdes el look.</li>
    <li><b>Una sola fuente de luz, dura y de color.</b> Sombras sin relleno. En
      <code>black_sand</code> no hay una sola luz blanca en 76 segundos.</li>
    <li><b>Paleta corta.</b> Ocho colores para un video entero.</li>
    <li><b>Corte rapido y desigual.</b> No es que vaya rapido: es que <b>alterna</b> planos de
      4 segundos con rafagas de cuatro planos en 0,3 segundos.</li>
  </ul>

  <h2>El mapa</h2>
  <p>Este es el orden y no es negociable. Cada paso da por hecho que el anterior esta
  <b>aprobado</b>, no solo hecho.</p>
  <div class="mapa">{MAPA_SVG}</div>
  <div class="aviso">
    <p><b>Primero el mundo, luego el personaje, luego los frames, luego el video.</b>
    La razon es la luz: una ubicacion define hora del dia, direccion y temperatura de color.
    Si generas al personaje antes, lo generas con una luz inventada y despues no encaja en
    ningun sitio. Tendras planos correctos por separado que no cortan entre si.</p>
  </div>

  <h2>Que necesitas</h2>
  {herr}

  <h2>Cuanto cuesta</h2>
  <p>Para un video de unos 40 segundos como <code>on_the_road</code>, con
  <code>nano_banana_pro</code> a 2k para las imagenes y <code>seedance_2_0</code> a 720p para
  el video:</p>
  {coste}
  <div class="aviso rojo">
    <p><b>La columna que importa es la de la derecha.</b> Nadie aprueba un plano a la primera.
    Dos o tres intentos por plano es lo normal, y en los bustos son mas. Presupuesta el doble
    y medio de lo que suma la teoria.</p>
    <p>Las tarifas cambian: comprueba las tuyas en el panel de tu proveedor. Lo que no cambia
    es la proporcion: <b>animar cuesta unas cinco veces mas que generar la imagen</b>. Por eso
    el sistema entero se organiza alrededor de no animar hasta estar seguro.</p>
  </div>

  <h2>Como se ahorra de verdad</h2>
  <ul>
    <li><b>Los planos de 5 frames o menos no se animan.</b> Son imagenes fijas. En
      <code>black_sand</code> son 19 de 53 planos: gastar 4 segundos de video para usar
      2 frames es tirar el dinero.</li>
    <li><b>Prueba a 6 s y 720p antes de la version larga.</b> Un plano largo que sale mal
      cuesta lo mismo que tres pruebas cortas.</li>
    <li><b>Genera a 720p y sube a 1080p solo el pase final.</b> Seedance 2.5 renderiza nativo
      a 720p: lo que llama 1080p es un reescalado, no detalle nuevo.</li>
  </ul>
</section>"""


# ---------------------------------------------------------------- 2. anatomia
def ficha_plano(video: str, p: dict, a: dict) -> str:
    return f"""
<article class="plano" data-tipo="{e(a['tipo'])}">
  <img src="img/{video}_{p['n']:02d}.png" width="460" height="259" loading="lazy"
       alt="Plano {p['n']} de {video}: {e(a['accion'])}">
  <div class="cuerpo">
    <span class="etq {e(a['tipo'])}">{e(a['tipo'])}</span>
    <span class="n">{p['n']:02d}</span>
    <p class="meta">{p['in']:.2f}s · {p['dur']:.2f}s · {p['frames']} frames · {e(a['camara'])}</p>
    <p class="acc">{e(a['accion'])}</p>
    <p class="fun">{e(a['funcion'])}</p>
  </div>
</article>"""


def bloque_video(video: str, d: dict, titulo: str, resumen: str) -> str:
    s, anot, pal = d["shots"], d["anot"], d["paleta"]
    tipos = sorted({v["tipo"] for v in anot["planos"].values()})
    filtros = ('<div class="filtros" data-destino="planos-' + video + '">'
               '<button data-tipo="todos" aria-pressed="true">todos</button>'
               + "".join(f'<button data-tipo="{e(t)}" aria-pressed="false">{e(t)}</button>'
                         for t in tipos) + "</div>")

    actos = tabla(["Acto", "Duracion", "Planos", "s / plano", "Paleta"], [
        [f"<b>{e(a['acto'])}</b>", f"{a['dur']:.1f} s", str(a["planos"]),
         f"{a['plano_medio']:.2f}", swatches(a["paleta"][:5])]
        for a in pal["actos"]])

    planos = "".join(ficha_plano(video, p, anot["planos"][str(p["n"])]) for p in s["planos"])

    return f"""
  <h2>{e(titulo)}</h2>
  <p>{resumen}</p>
  {tabla(["Duracion", "Planos", "Plano medio", "Cortes / s", "Mas corto", "Mas largo"],
         [[f"{s['duracion']} s", str(s['n_planos']), f"{s['plano_medio']} s",
           str(s['corte_por_segundo']), f"{s['plano_mas_corto']} frames",
           f"{s['plano_mas_largo']} frames"]])}
  <h3>Los actos y su paleta</h3>
  {actos}
  <h3>Plano a plano</h3>
  {filtros}
  <div class="planos" id="planos-{video}">{planos}</div>"""


def vista_anatomia(d: dict) -> str:
    otr = bloque_video(
        "on_the_road", d["on_the_road"], "on_the_road — 39 s, 28 planos",
        "Un hombre come en un diner del desierto, se sube a su coche y se va. No hay trama. "
        "Lo que sostiene el video es el <b>ritmo</b>: 2,62 s por plano en el primer acto, "
        "1,46 en el segundo, 1,03 en el tercero. Acelera sin parar y no hay un solo tramo que "
        "vaya mas lento que el anterior. Esa curva <b>es</b> la estructura.")
    bs = bloque_video(
        "black_sand", d["black_sand"], "black_sand — 76 s, 53 planos",
        "Aqui si hay historia, y el montaje funciona al reves: no acelera, <b>alterna</b>. "
        "Planos de 4 y 5 segundos donde pasa todo, y entre medias tres rafagas de vinetas de "
        "comic de 1 a 3 frames que duran menos de 0,4 segundos cada una. Ocho planos duran "
        "<b>un solo frame</b>. Ademas usa cinco negros de puntuacion, que "
        "<code>on_the_road</code> no tiene ni uno.")

    return f"""
<section id="anatomia" hidden>
  <h1>Anatomia de los dos referentes</h1>
  <p class="intro">Cada tarjeta es un frame real del video, extraido con <code>ffmpeg</code>.
  Debajo, que pasa en el plano y — lo que de verdad importa — <b>por que esta ahi</b>.
  Filtra por tipo de plano para ver el patron.</p>
  <div class="aviso">
    <p>Fijate en una cosa mientras miras: <b>casi nunca hay dos planos seguidos del mismo
    tipo</b>, salvo los macros, que van en pareja. Ese es el motor de todo. Un amplio detras
    de otro amplio aburre; un macro detras de un macro construye un objeto.</p>
  </div>
  {otr}
  <hr>
  {bs}
</section>"""


# ---------------------------------------------------------------- 3. sistema
def vista_sistema(d: dict) -> str:
    partes = []
    for i, p in enumerate(PASOS, 1):
        pid = f"paso-{p['id']}"
        cuerpo = p["cuerpo"].format(
            estilo_otr=prompt(d["on_the_road"]["estilo"], "Bloque de estilo de on_the_road"),
            estilo_bs=prompt(d["black_sand"]["estilo"], "Bloque de estilo de black_sand"),
        ) if "{estilo" in p["cuerpo"] else p["cuerpo"]

        donde = "".join(f'<span class="donde">{e(x)}</span>' for x in p["donde"])
        revisar = "".join(f"<li>{x}</li>" for x in p["revisar"])
        partes.append(f"""
<div class="paso" id="{pid}">
  <button class="cab" type="button" aria-expanded="false" aria-controls="{pid}-c">
    <span class="orden">{i}</span>
    <span class="titulo"><b>{e(p['titulo'])}</b><small>{e(p['resumen'])}</small></span>
    <span class="flecha">&#9656;</span>
  </button>
  <div class="contenido" id="{pid}-c" hidden>
    {donde}
    {cuerpo}
    <h4>Que revisar antes de seguir</h4>
    <ul class="revisar">{revisar}</ul>
    <label class="check"><input type="checkbox" data-paso="{pid}">
      Hecho y aprobado: {e(p['titulo'])}</label>
  </div>
</div>""")

    return f"""
<section id="sistema" hidden>
  <h1>El sistema, paso a paso</h1>
  <p class="intro">Ocho pasos en orden fijo. Marca cada uno cuando lo tengas
  <b>aprobado</b>, no cuando lo tengas hecho. Lo que marques se guarda en este dispositivo.</p>
  <div class="aviso rojo">
    <p><b>La regla dura:</b> nunca se anima sin un start frame aprobado, y nunca se hace un
    start frame sin la hoja de personaje y la ubicacion aprobadas. Saltarse esto es la causa
    numero uno de tirar el presupuesto.</p>
  </div>
  {''.join(partes)}
</section>"""


# ---------------------------------------------------------------- 4. replicar
def vista_replicar() -> str:
    campos = [
        ("nombre", "Nombre del personaje", "text", "EL MENSAJERO", "En mayusculas. Es la etiqueta que veras en todos los prompts."),
        ("edad", "Edad y complexion", "text", "a woman in her forties, broad-shouldered", "En ingles. Los modelos responden mejor."),
        ("piel", "Piel", "text", "pale skin with an olive undertone", ""),
        ("cara", "Cara", "textarea", "square jaw, thin straight eyebrows, deep-set grey eyes, hooked nose, thin mouth held closed", "Mandibula, cejas, ojos, nariz, boca en reposo."),
        ("pelo", "Pelo", "text", "black hair shaved at the sides and swept back on top", "El corte exacto, no 'pelo corto'."),
        ("marca", "Marca distintiva", "text", "a vertical scar through the left eyebrow", "Una o dos como mucho. Y di el lado."),
        ("ropa", "Vestuario", "textarea", "a heavy oxblood #6B2029 canvas jacket over a grey shirt, dark work trousers, black boots", "Con hex en los colores."),
        ("nunca", "Lo que nunca lleva", "text", "sunglasses, jewellery, visible text on clothing, a smile", "Lo que el modelo anadiria solo."),
        ("ubicacion", "Ubicacion", "textarea", "LOCATION — LOADING BAY: a concrete loading dock at night, four sodium lamps overhead, wet floor, roller shutters, cold blue city light beyond", "Cuenta los elementos. La luz al final."),
        ("accion", "Accion del plano", "text", "she sets the crate down and straightens up", "UNA sola cosa que pasa. Nada de 'y luego'."),
        ("camara", "Camara", "select", "", ""),
        ("estilo", "Bloque de estilo", "textarea", "", "Pegalo desde tu STYLE.md, o usa el de uno de los referentes."),
    ]
    camaras = ["static shot with a slight handheld drift", "slow push in", "dolly in",
               "crash zoom in", "tracking shot alongside the subject",
               "low tracking shot at ground level", "whip pan to the left",
               "slow orbit around the subject", "low angle looking up",
               "high angle looking down", "top-down aerial view",
               "POV, camera as the character's eyes", "macro lens, extreme close-up",
               "static shot, locked off"]

    html_campos = []
    for name, etiqueta, tipo, ph, ayuda in campos:
        ancho = ' ancho' if tipo == "textarea" else ""
        if tipo == "textarea":
            control = (f'<textarea name="{name}" rows="3" '
                       f'placeholder="{e(ph)}"></textarea>')
        elif tipo == "select":
            ops = "".join(f'<option value="{e(c)}">{e(c)}</option>' for c in camaras)
            control = f'<select name="{name}">{ops}</select>'
        else:
            control = f'<input name="{name}" type="text" placeholder="{e(ph)}">'
        html_campos.append(
            f'<div class="campo{ancho}"><label for="{name}">{e(etiqueta)}</label>{control}'
            + (f"<small>{e(ayuda)}</small>" if ayuda else "") + "</div>")

    salidas = "".join(
        prompt("", rotulo=r, plantilla=t) for r, t in PLANTILLAS_FORM)

    return f"""
<section id="replicar" hidden>
  <h1>Replicar con mi personaje</h1>
  <p class="intro">Rellena esto y los prompts de abajo se van montando solos. Lo que escribas
  se guarda en este dispositivo. Escribe <b>en ingles</b>: los modelos de imagen entienden
  mucho mejor las palabras de color, encuadre y luz en ingles, aunque tu pienses en espanol.</p>
  <form class="form" id="form-replicar" autocomplete="off"
        onsubmit="return false">{''.join(html_campos)}</form>
  <div class="aviso">
    <p><b>El bloque de identidad debe medir entre 70 y 110 palabras.</b> Mas corto no fija la
    cara; mas largo se diluye y el modelo empieza a ignorar el final.</p>
  </div>
  <h2>Tus prompts</h2>
  {salidas}
  <div class="aviso verde">
    <p><b>El orden dentro del prompt importa.</b> Estilo primero, identidad despues, encuadre
    al final. Los modelos pesan mas el principio del texto, y el estilo es lo que no se puede
    permitir fallar.</p>
  </div>
</section>"""


# ---------------------------------------------------------------- 5, 6, 7
def vista_errores() -> str:
    bloques = "".join(f"""
<div class="tarjeta">
  <h3>{e(t)}</h3>
  <p><b>Como se ve:</b> {sintoma}</p>
  <p><b>Por que pasa:</b> {causa}</p>
  <p><b>Que hacer:</b> {arreglo}</p>
</div>""" for t, sintoma, causa, arreglo in ERRORES)
    return f"""
<section id="errores" hidden>
  <h1>Los errores que vas a cometer</h1>
  <p class="intro">Estos siete son los que se repiten. Los tres primeros son los que mas
  presupuesto se llevan.</p>
  {bloques}
</section>"""


def vista_glosario() -> str:
    grupos = {}
    for termino, grupo, definicion in GLOSARIO:
        grupos.setdefault(grupo, []).append((termino, definicion))
    partes = []
    for grupo, items in grupos.items():
        filas = [[f"<b>{e(t)}</b>", d] for t, d in items]
        partes.append(f"<h2>{e(grupo)}</h2>" + tabla(["Termino", "Que significa"], filas))
    return f"""
<section id="glosario" hidden>
  <h1>Glosario</h1>
  <p class="intro">Sin dar nada por sabido. Si un termino de la guia no esta aqui y no lo
  entiendes, es un fallo de la guia.</p>
  {''.join(partes)}
</section>"""


def vista_automatico() -> str:
    filas = tabla(["Paso manual", "Comando equivalente", "Que hace"], [
        ["Extraer los planos de un video de referencia",
         "<code>python3 tools/extraer_frames.py</code>",
         "Detecta cortes con ffmpeg y saca los frames"],
        ["Ver la paleta de cada acto", "<code>python3 tools/paleta.py</code>",
         "Mide los hex dominantes y los de acento"],
        ["Escribir la shotlist", "<code>python3 tools/shotlist.py</code>",
         "Monta <code>shotlist.md</code> desde los datos y las anotaciones"],
        ["Escribir los prompts de los 28 planos",
         "<code>python3 tools/generar_prompts.py</code>",
         "Ensambla estilo + personaje + ubicacion + encuadre en una ficha por plano"],
        ["Saber lo que va a costar", "<code>python3 -m pipeline coste on_the_road</code>",
         "Estima sin lanzar nada"],
        ["Generar los start frames", "<code>python3 -m pipeline frames on_the_road</code>",
         "Uno por plano, 4 a la vez"],
        ["Aprobar un start frame",
         "<code>echo &quot;on_the_road_07_macro-llave.png&quot; &gt;&gt; assets/frames/aprobados.txt</code>",
         "<b>Despues de mirarlo.</b> Sin esto el paso siguiente se niega"],
        ["Animar los planos aprobados", "<code>python3 -m pipeline video on_the_road</code>",
         "Se salta los planos sin start frame aprobado"],
        ["Preparar la lista de montaje",
         "<code>python3 tools/generar_lista_montaje.py on_the_road</code>",
         "Saca el manifiesto desde la shotlist"],
        ["Montar", "<code>./scripts/montage.sh --lista montaje/lista_on_the_road.tsv</code>",
         "Concatena, inserta, rampas, musica, y exporta 16:9 y 9:16"],
        ["Ver que haria sin hacerlo", "<code>… --dry-run</code>",
         "Funciona en el pipeline y en montage.sh"],
    ])
    return f"""
<section id="automatico" hidden>
  <h1>Modo automatico</h1>
  <p class="intro">Todo lo que la guia explica a mano tiene su comando. Es opcional: el
  sistema funciona igual abriendo la web de tu proveedor y pegando prompts. Pero si vas a
  hacer mas de un video, esto te ahorra las tres horas de copiar y pegar.</p>
  <div class="aviso rojo">
    <p><b>Sin <code>video-ia/.env</code> no se llama a ninguna API.</b> El pipeline arranca en
    modo simulacion: te dice que lanzaria y cuanto costaria, y para. Es lo que quieres la
    primera vez.</p>
  </div>
  {filas}
  <h2>Las seis reglas que impone el codigo</h2>
  <p>No son consejos de un README: si las rompes, el pipeline se niega a seguir.</p>
  {tabla(["", "Regla", "Que pasa si la rompes"], [
      ["1", "No se anima sin start frame <b>aprobado</b>",
       "Se salta el plano y te dice cual y por que"],
      ["2", "Primero 6 s a 720p, luego la version larga",
       "No lanza la version larga si no hay una prueba aprobada"],
      ["3", "Seedance 2.5 es nativo 720p y no da 4K",
       "Rechaza pedir 4K a un modelo que solo lo reescala"],
      ["4", "Maximo 4 trabajos a la vez",
       "Encola. Ante un 429 reintenta con espera creciente"],
      ["5", "Todo trabajo se anota en <code>runs/log.jsonl</code>",
       "Puedes reproducir un plano que salio bien, con sus parametros exactos"],
      ["6", "Presupuesto por ejecucion y por trabajo",
       "Para en seco y te dice cuanto llevas"],
  ])}
  <div class="aviso">
    <p><b>&laquo;Aprobado&raquo; no es &laquo;existe el archivo&raquo;.</b> El nombre tiene que
    estar en <code>assets/frames/aprobados.txt</code>. Mirar una imagen y decidir si vale es un
    paso humano, y el pipeline no puede hacerlo por ti. Aprobar sin mirar es lo mismo que no
    tener la regla.</p>
  </div>
  <h2>Por que no hay Midjourney</h2>
  <p>Midjourney no tiene API oficial y sus terminos prohiben la automatizacion, asi que no hay
  forma legitima de meterlo aqui. Para el look pintado, <code>seedream_v5_pro</code> o
  <code>nano_banana_pro</code> con el bloque de estilo dan un resultado equivalente. Midjourney
  se usa <b>a mano</b>, y solo para style frames, si tu decides hacerlo.</p>
</section>"""


# ---------------------------------------------------------------- documento
def construir() -> str:
    d = {v: datos(v) for v in ("on_the_road", "black_sand")}
    tabs = [("inicio", "Inicio"), ("anatomia", "Anatomia"), ("sistema", "El sistema"),
            ("replicar", "Mi personaje"), ("errores", "Errores"),
            ("automatico", "Modo automatico"), ("glosario", "Glosario")]
    nav = "".join(
        f'<button data-vista="{i}" aria-selected="{"true" if i=="inicio" else "false"}">'
        f'{e(t)}</button>' for i, t in tabs)
    n_pasos = len(PASOS)

    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sistema para hacer videos de IA de calidad cinematografica</title>
<meta name="description" content="Guia paso a paso para producir videos de animacion
pintada con IA, sacada de diseccionar dos referentes plano a plano.">
<style>{CSS}</style>
</head>
<body>
<header class="top">
  <div class="fila"><div class="marca">Sistema de video con <b>IA</b></div></div>
  <nav class="tabs" aria-label="Secciones">{nav}</nav>
</header>
<main>
{vista_inicio(d)}
{vista_anatomia(d)}
{vista_sistema(d)}
{vista_replicar()}
{vista_errores()}
{vista_automatico()}
{vista_glosario()}
</main>
<footer>
  <p>Generado por <code>tools/generar_guia.py</code> desde el analisis de
  <code>analysis/</code>. Para actualizarla, cambia la shotlist y vuelve a correrlo.</p>
</footer>
<div class="barra">
  <span class="cuenta">0 de {n_pasos} pasos</span>
  <span class="pista"><span class="relleno"></span></span>
  <button type="button">reiniciar</button>
</div>
<script>{JS}</script>
</body>
</html>
"""


if __name__ == "__main__":
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(construir(), encoding="utf-8")
    kb = SALIDA.stat().st_size / 1024
    print(f"{SALIDA}  {kb:.0f} KB")
