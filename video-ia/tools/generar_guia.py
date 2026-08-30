#!/usr/bin/env python3
"""Fase 5 - genera guia/index.html.

Un solo archivo autocontenido: fuentes incrustadas en base64, cero CDN, cero red. Las
imagenes van en guia/img/, asi que la guia abre sin internet.

Todo el dato sale del analisis y no de escribirlo a mano:
  analysis/<video>/shots.json       tiempos y duraciones (ffmpeg)
  analysis/<video>/anotaciones.json tipo de plano, camara, accion y funcion narrativa
  analysis/<video>/paleta.json      paletas medidas por acto
  analysis/<video>/STYLE.md         el bloque de estilo
Asi la guia no se puede desincronizar de la shotlist.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

from guia_contenido import (ERRORES, GLOSARIO, HERRAMIENTAS, MAPA_SVG, PASOS,
                            PLANTILLAS_FORM, TOUR, CAPAS_PROMPT)
from guia_css import CSS
from guia_fuentes import css as css_fuentes
from guia_js import JS

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "guia" / "index.html"
VIDEOS = ("on_the_road", "black_sand")
TIPOS = ("macro", "busto", "amplio", "POV", "impacto", "titulo")


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
    return re.search(r"```\n(.*?)\n```", texto.split("## 8. Bloque de estilo")[1],
                     re.S).group(1).strip()


def planos_json(d: dict) -> dict:
    """El paquete de datos que consume el JavaScript. Sale de la shotlist, no del HTML."""
    salida = {}
    for v in VIDEOS:
        s, a = d[v]["shots"], d[v]["anot"]["planos"]
        salida[v] = {
            "duracion": s["duracion"], "n": s["n_planos"],
            "planos": [{
                "n": p["n"], "in": p["in"], "out": p["out"], "dur": p["dur"],
                "frames": p["frames"], "tipo": a[str(p["n"])]["tipo"],
                "camara": a[str(p["n"])]["camara"], "accion": a[str(p["n"])]["accion"],
                "funcion": a[str(p["n"])]["funcion"],
            } for p in s["planos"]],
        }
    return salida


def prompt(texto: str = "", rotulo: str = "", plantilla: str = "") -> str:
    attr = f' data-plantilla="{e(plantilla)}"' if plantilla else ""
    return (
        '<div class="prompt">'
        '<div class="cabecera">'
        + (f'<span class="rotulo">{e(rotulo)}</span>' if rotulo else "<span></span>")
        + '<button class="copiar" type="button">copiar</button></div>'
        f'<pre{attr}>{e(texto) if not plantilla else ""}</pre></div>')


def swatches(colores: list[dict]) -> str:
    s = "".join(f'<button class="swatch" type="button" title="Copiar {e(c["hex"])}">'
                f'<i style="background:{e(c["hex"])}"></i><span>{e(c["hex"])}</span></button>'
                for c in colores)
    return f'<div class="paleta">{s}</div>'


def tabla(cab: list[str], filas: list[list[str]]) -> str:
    th = "".join(f"<th>{e(c)}</th>" for c in cab)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in f) + "</tr>" for f in filas)
    return (f'<div class="tabla"><table><thead><tr>{th}</tr></thead>'
            f"<tbody>{tr}</tbody></table></div>")


# ================================================================ 1. EL VISOR
def vista_visor(d: dict) -> str:
    """La pieza central: reproduce cada plano durante su duracion real."""
    imgs, tiras = [], []
    for v in VIDEOS:
        s, a = d[v]["shots"], d[v]["anot"]["planos"]
        for p in s["planos"]:
            imgs.append(
                f'<img data-peli="{v}" data-n="{p["n"]}" src="img/{v}_{p["n"]:02d}.png" '
                f'alt="Plano {p["n"]} de {v}: {e(a[str(p["n"])]["accion"])}" '
                f'{"" if p["n"] <= 3 else "loading=lazy"}>')
        total = s["duracion"]
        blks = "".join(
            f'<button class="blk" type="button" data-i="{i}" data-n="{p["n"]}" '
            # porcentaje explicito y no flex-grow: con 53 bloques en 390 px el reparto
            # por grow se cae y todos acaban del mismo ancho, que es justo lo contrario
            # de lo que este grafico tiene que ensenar
            f'style="width:{100 * p["dur"] / total:.4f}%;'
            f'--c:var(--t-{a[str(p["n"])]["tipo"]})" '
            f'title="Plano {p["n"]:02d} · {p["dur"]:.2f} s · {a[str(p["n"])]["tipo"]}" '
            f'aria-label="Ir al plano {p["n"]}">'
            f'<img src="img/{v}_{p["n"]:02d}.png" alt="" loading="lazy"></button>'
            for i, p in enumerate(s["planos"]))
        tiras.append(f'<div class="tira" data-peli="{v}" role="group" '
                     f'aria-label="Linea de tiempo de {v}">{blks}</div>')

    leyenda = "".join(f'<span style="--c:var(--t-{t})"><i></i>{e(t)}</span>' for t in TIPOS)
    otr, bs = d["on_the_road"]["shots"], d["black_sand"]["shots"]

    return f"""
<section id="visor">
  <h1>El ritmo no se explica. Se siente.</h1>
  <p class="entrada">Esto reproduce los planos de un referente durante <b>su duracion
  real</b>, medida con <code>ffmpeg</code>. Dale al play y mira el contador: veras que
  <code>on_the_road</code> acelera sin parar hasta que los planos duran diez frames, y que
  <code>black_sand</code> mete rafagas que se acaban antes de que las registres.</p>

  <div class="visor" id="el-visor">
    <div class="pantalla">
      {''.join(imgs)}
      <div class="esquina"><i class="grabando"></i>
        <span class="rotulo" style="color:var(--tinta3)">referencia</span></div>
      <div class="sobre"><span class="accion"></span><span class="tc"></span></div>
    </div>
    <div class="transporte">
      <button class="tbtn" id="prev" type="button" aria-label="Plano anterior"></button>
      <button class="tbtn grande" id="play" type="button" aria-label="Reproducir"></button>
      <button class="tbtn" id="next" type="button" aria-label="Plano siguiente"></button>
      <span class="contador"></span>
      <span class="sep"></span>
      <div class="selpeli" role="group" aria-label="Elegir referente">
        <button type="button" data-peli="on_the_road">on_the_road</button>
        <button type="button" data-peli="black_sand" class="bs">black_sand</button>
      </div>
      <div class="velocidad" role="group" aria-label="Velocidad">
        <button type="button" data-vel="0.25">0,25×</button>
        <button type="button" data-vel="0.5">0,5×</button>
        <button type="button" data-vel="1">1×</button>
      </div>
    </div>
    {''.join(tiras)}
    <div class="leyenda">{leyenda}</div>
  </div>
  <p class="rotulo" style="margin:0 0 2rem">Cada bloque de la tira ocupa lo que dura el
  plano · pulsa espacio para reproducir · flechas para ir plano a plano</p>

  <div class="rejilla tres">
    <div class="tarjeta"><span class="cifra">{otr['n_planos']}</span>
      <span>planos en {otr['duracion']:.0f} s. El mas largo dura
      {otr['plano_mas_largo']} frames; el mas corto, {otr['plano_mas_corto']}</span></div>
    <div class="tarjeta"><span class="cifra roja">{bs['n_planos']}</span>
      <span>planos en {bs['duracion']:.0f} s, y ocho de ellos duran
      <b>un solo frame</b> — 33 milesimas</span></div>
    <div class="tarjeta"><span class="cifra">31 %</span>
      <span>del metraje son insertos macro de objetos. Ahi esta el truco entero</span></div>
  </div>

  <h2>Lo que estas viendo</h2>
  <div class="prosa">
  <p>Los dos videos duran lo mismo por plano de media — 1,39 y 1,43 segundos — y no se
  parecen en nada. La media miente, y por eso hay que verlo en movimiento.</p>
  <p><b>on_the_road acelera de forma monotona:</b> 2,62 segundos por plano en el primer
  acto, 1,46 en el segundo, 1,03 en el tercero. No hay ni un solo tramo que vaya mas lento
  que el anterior. Esa curva es toda la estructura del video.</p>
  <p><b>black_sand alterna.</b> Planos de cuatro y cinco segundos donde pasa la historia,
  y entre medias tres rafagas de vinetas de comic de uno a tres frames que duran menos de
  cuatro decimas cada una. Ademas usa cinco negros de puntuacion, que
  <code>on_the_road</code> no tiene ni uno.</p>
  </div>
  {grafico("on_the_road", d, "La curva de aceleracion")}
  {grafico("black_sand", d, "El patron de alternancia")}
  <div class="aviso cian">
    <p>Pasa el raton por las barras y baja hasta la lectura: te dice que plano es y que
    pasa en el. Pulsa una y el visor salta a ese plano.</p>
  </div>
</section>"""


def grafico(video: str, d: dict, titulo: str) -> str:
    """Barras de duracion por plano, con la media de cada acto encima.

    Las barras solas no ensenan la aceleracion: hay planos largos sueltos en medio que
    despistan. La media por acto es la que hace visible lo que afirma el texto —
    2,62 -> 1,46 -> 1,03 segundos por plano en on_the_road.
    """
    s, a, actos = d[video]["shots"], d[video]["anot"]["planos"], d[video]["paleta"]["actos"]
    ps = s["planos"]
    tope = max(p["dur"] for p in ps)
    barras = "".join(
        f'<button class="b" type="button" style="height:{max(4, 100 * p["dur"] / tope):.1f}%;'
        f'--c:var(--t-{a[str(p["n"])]["tipo"]})" '
        f'aria-label="Plano {p["n"]}, {p["dur"]:.2f} segundos"></button>' for p in ps)

    medias = []
    for ac in actos:
        dentro = [i for i, p in enumerate(ps) if ac["in"] <= p["in"] < ac["out"]]
        if not dentro:
            continue
        izq, ancho = 100 * dentro[0] / len(ps), 100 * len(dentro) / len(ps)
        alto = 100 * ac["plano_medio"] / tope
        medias.append(
            f'<span class="media" style="left:{izq:.2f}%;width:{ancho:.2f}%;'
            f'bottom:{alto:.2f}%" aria-hidden="true">'
            f'<b>{ac["plano_medio"]:.2f} s</b></span>')

    return f"""
<div class="ritmo" data-peli="{video}">
  <span class="rotulo">{e(titulo)} · {e(video)}</span>
  <div class="barras">{barras}<span class="medias">{''.join(medias)}</span></div>
  <div class="ejes"><span>plano 01</span>
    <span>altura = duracion · la linea es la media del acto · maximo {tope:.2f} s</span>
    <span>plano {s['n_planos']}</span></div>
  <p class="lectura">Pasa el raton por una barra para ver que plano es.</p>
</div>"""


# ================================================================ 2. anatomia
def tarjeta_plano(video: str, p: dict, a: dict, tope: float) -> str:
    return f"""
<button class="plano" type="button" data-tipo="{e(a['tipo'])}"
        style="--c:var(--t-{e(a['tipo'])})" aria-label="Ampliar plano {p['n']}">
  <span class="marco">
    <img src="img/{video}_{p['n']:02d}.png" width="640" height="360" loading="lazy"
         alt="Plano {p['n']} de {video}: {e(a['accion'])}">
    <span class="barra" style="--w:{max(4, 100 * p['dur'] / tope):.1f}%"></span>
  </span>
  <span class="cuerpo">
    <span class="etq">{e(a['tipo'])}</span><span class="n">{p['n']:02d}</span>
    <span class="meta">{p['in']:.2f}s · {p['dur']:.2f}s · {p['frames']}f</span>
    <span class="acc">{e(a['accion'])}</span>
    <span class="fun">{e(a['funcion'])}</span>
  </span>
</button>"""


def bloque_video(video: str, d: dict, titulo: str, resumen: str) -> str:
    s, anot, pal = d[video]["shots"], d[video]["anot"], d[video]["paleta"]
    tope = max(p["dur"] for p in s["planos"])
    tipos = [t for t in TIPOS if any(v["tipo"] == t for v in anot["planos"].values())]
    filtros = (f'<div class="filtros" data-destino="planos-{video}">'
               '<button type="button" data-tipo="todos" aria-pressed="true">todos</button>'
               + "".join(f'<button type="button" data-tipo="{e(t)}" aria-pressed="false">'
                         f"{e(t)}</button>" for t in tipos) + "</div>")
    actos = tabla(["Acto", "Duracion", "Planos", "s / plano", "Paleta medida"], [
        [f"<b>{e(a['acto'])}</b>", f"{a['dur']:.1f} s", str(a["planos"]),
         f"{a['plano_medio']:.2f}", swatches(a["paleta"][:5])] for a in pal["actos"]])
    planos = "".join(tarjeta_plano(video, p, anot["planos"][str(p["n"])], tope)
                     for p in s["planos"])
    return f"""
  <h2>{e(titulo)}</h2>
  <div class="prosa"><p>{resumen}</p></div>
  {tabla(["Duracion", "Planos", "Plano medio", "Cortes / s", "Mas corto", "Mas largo"],
         [[f"{s['duracion']} s", str(s['n_planos']), f"{s['plano_medio']} s",
           str(s['corte_por_segundo']), f"{s['plano_mas_corto']} frames",
           f"{s['plano_mas_largo']} frames"]])}
  <h3>Los actos y su paleta</h3>
  <p class="rotulo" style="margin:-.2rem 0 .6rem">Pulsa un color para copiar el hex</p>
  {actos}
  <h3>Plano a plano</h3>
  {filtros}
  <div class="planos" id="planos-{video}" data-peli="{video}">{planos}</div>"""


def vista_anatomia(d: dict) -> str:
    return f"""
<section id="anatomia" hidden>
  <h1>Anatomia de los dos referentes</h1>
  <p class="entrada">Cada tarjeta es un frame real del video. Debajo, que pasa en el plano
  y — lo que de verdad importa — <b>por que esta ahi</b>. Pulsa cualquiera para verla
  grande y moverte con las flechas.</p>
  <div class="aviso">
    <p>Fijate en una cosa mientras miras: <b>casi nunca hay dos planos seguidos del mismo
    tipo</b>, salvo los macros, que van en pareja. Ese es el motor de todo. Un amplio
    detras de otro amplio aburre; un macro detras de un macro construye un objeto.</p>
  </div>
  {bloque_video("on_the_road", d, "on_the_road — 39 s, 28 planos",
    "Un hombre come en un diner del desierto, se sube a su coche y se va. No hay trama. "
    "Lo que sostiene el video es el <b>ritmo</b>, y el ritmo se decide en la shotlist.")}
  <hr>
  {bloque_video("black_sand", d, "black_sand — 76 s, 53 planos",
    "Aqui si hay historia, y el montaje funciona al reves: no acelera, <b>alterna</b>. "
    "Y hay una rima que lo cuenta todo — el plano 39 repite exactamente el encuadre del "
    "plano 16, dos perfiles enfrentados, misma distancia. Cambian los personajes y la luz. "
    "Es la frase visual que cuenta el ascenso del protagonista sin una linea de dialogo.")}
</section>"""


# ================================================================ 3. sistema
def vista_sistema(d: dict) -> str:
    etapas = "".join(
        f'<button class="et" type="button" data-i="{i}">'
        f'<span class="num">{i + 1:02d}</span>'
        f'<span class="nom">{e(g["nom"])}</span></button>'
        for i, g in enumerate(TOUR))

    partes = []
    for i, p in enumerate(PASOS, 1):
        pid = f"paso-{p['id']}"
        cuerpo = p["cuerpo"]
        if "{estilo" in cuerpo:
            cuerpo = cuerpo.format(
                estilo_otr=prompt(d["on_the_road"]["estilo"], "Bloque de estilo · on_the_road"),
                estilo_bs=prompt(d["black_sand"]["estilo"], "Bloque de estilo · black_sand"))
        donde = "".join(f'<span class="donde">{e(x)}</span>' for x in p["donde"])
        revisar = "".join(f"<li>{x}</li>" for x in p["revisar"])
        partes.append(f"""
<div class="paso" id="{pid}">
  <button class="cab" type="button" aria-expanded="false" aria-controls="{pid}-c">
    <span class="orden">{i}</span>
    <span class="titulo"><b>{e(p['titulo'])}</b><small>{e(p['resumen'])}</small></span>
    <span class="flecha">&#9654;</span>
  </button>
  <div class="contenido" id="{pid}-c" hidden>
    {donde}
    <div class="prosa">{cuerpo}</div>
    <h4>Que revisar antes de seguir</h4>
    <ul class="revisar">{revisar}</ul>
    <label class="check"><input type="checkbox" data-paso="{pid}">
      Hecho <b>y aprobado</b>: {e(p['titulo'])}</label>
  </div>
</div>""")

    return f"""
<section id="sistema" hidden>
  <h1>El sistema, paso a paso</h1>
  <p class="entrada">Ocho pasos en orden fijo. Marca cada uno cuando lo tengas
  <b>aprobado</b>, no cuando lo tengas hecho. Lo que marques se guarda en este
  dispositivo.</p>

  <div class="tour" id="tour">
    <span class="rotulo">El recorrido, de la idea al montaje</span>
    <div class="via">{etapas}</div>
    <div class="escena"></div>
    <div class="mandos">
      <button class="tbtn" id="tour-prev" type="button" aria-label="Etapa anterior">&#8249;</button>
      <button class="copiar" id="tour-play" type="button"
              style="font-size:.72rem;padding:.4rem .8rem">Ver el recorrido</button>
      <button class="tbtn" id="tour-next" type="button" aria-label="Etapa siguiente">&#8250;</button>
    </div>
  </div>

  <div class="aviso rojo">
    <p><b>La regla dura:</b> nunca se anima sin un start frame aprobado, y nunca se hace un
    start frame sin la hoja de personaje y la ubicacion aprobadas. Saltarse esto es la causa
    numero uno de tirar el presupuesto.</p>
  </div>
  {''.join(partes)}
  <h2>El mapa completo</h2>
  <div class="mapa">{MAPA_SVG}</div>
</section>"""


# ================================================================ 4. replicar
def vista_replicar() -> str:
    campos = [
        ("nombre", "Nombre del personaje", "text", "EL MENSAJERO",
         "En mayusculas. Es la etiqueta que veras en todos los prompts.", ""),
        ("edad", "Edad y complexion", "text", "a woman in her forties, broad-shouldered",
         "En ingles: los modelos entienden mucho mejor las palabras de color y encuadre.", ""),
        ("piel", "Piel", "text", "pale skin with an olive undertone", "", ""),
        ("cara", "Cara", "textarea",
         "square jaw, thin straight eyebrows, deep-set grey eyes, hooked nose, thin mouth held closed",
         "Mandibula, cejas, ojos, nariz, boca en reposo.", "ancho"),
        ("pelo", "Pelo", "text", "black hair shaved at the sides and swept back on top",
         "El corte exacto, no 'pelo corto'.", ""),
        ("marca", "Marca distintiva", "text", "a vertical scar through the left eyebrow",
         "Una o dos como mucho. Y di el lado: se voltea sola.", ""),
        ("ropa", "Vestuario", "textarea",
         "a heavy oxblood #6B2029 canvas jacket over a grey shirt, dark work trousers, black boots",
         "Con hex en los colores.", "ancho"),
        ("nunca", "Lo que nunca lleva", "text",
         "sunglasses, jewellery, visible text on clothing, a smile",
         "Lo que el modelo anadiria solo. Ahorra mas reintentos que cualquier adjetivo.", ""),
        ("ubicacion", "Ubicacion", "textarea",
         "LOCATION — LOADING BAY: a concrete loading dock at night, four sodium lamps overhead, "
         "wet floor, roller shutters, cold blue city light beyond",
         "Cuenta los elementos. La luz al final, y que ocupe la mitad del bloque.", "ancho"),
        ("accion", "Accion del plano", "text", "she sets the crate down and straightens up",
         "UNA sola cosa que pasa. Si lleva 'y luego', son dos planos.", ""),
        ("camara", "Camara", "select", "", "", ""),
        ("estilo", "Bloque de estilo", "textarea", "",
         "Pegalo desde tu STYLE.md, o copia el de un referente desde el paso 6.", "ancho"),
    ]
    camaras = ["static shot with a slight handheld drift", "slow push in", "dolly in",
               "crash zoom in", "tracking shot alongside the subject",
               "low tracking shot at ground level", "whip pan to the left",
               "slow orbit around the subject", "low angle looking up",
               "high angle looking down", "top-down aerial view",
               "POV, camera as the character's eyes", "macro lens, extreme close-up",
               "static shot, locked off"]

    campos_html = []
    for name, etiqueta, tipo, ph, ayuda, clase in campos:
        if tipo == "textarea":
            control = f'<textarea id="f-{name}" name="{name}" rows="3" placeholder="{e(ph)}"></textarea>'
        elif tipo == "select":
            ops = "".join(f'<option value="{e(c)}">{e(c)}</option>' for c in camaras)
            control = f'<select id="f-{name}" name="{name}">{ops}</select>'
        else:
            control = f'<input id="f-{name}" name="{name}" type="text" placeholder="{e(ph)}">'
        campos_html.append(
            f'<div class="campo {clase}"><label for="f-{name}">{e(etiqueta)}</label>{control}'
            + (f"<small>{e(ayuda)}</small>" if ayuda else "") + "</div>")

    capas = "".join(
        f'<div class="capa" data-requiere="{e(req)}" style="--c:{color}">'
        f'<div class="cap">{e(rot)}</div>'
        f'<pre data-plantilla="{e(txt)}"></pre></div>'
        for rot, req, color, txt in CAPAS_PROMPT)

    salidas = "".join(prompt(rotulo=r, plantilla=t) for r, t in PLANTILLAS_FORM)

    return f"""
<section id="replicar" hidden>
  <h1>Replicar con mi personaje</h1>
  <p class="entrada">Rellena esto y los prompts se montan solos abajo. Lo que escribas se
  guarda en este dispositivo. Escribe <b>en ingles</b>: los modelos de imagen entienden
  mucho mejor las palabras de color, encuadre y luz en ingles, aunque tu pienses en
  espanol.</p>
  <form class="form" id="form-replicar" autocomplete="off"
        onsubmit="return false">{''.join(campos_html)}</form>

  <h2>Como se apila un prompt</h2>
  <p class="prosa">Cada capa se enciende cuando rellenas el campo que le toca. El orden no
  es decorativo: los modelos pesan mas el principio del texto, y el estilo es lo que no se
  puede permitir fallar, asi que va primero.</p>
  <div class="capas">{capas}</div>
  <div class="medidor" id="medidor">
    <span class="pista"><span class="relleno"></span></span>
    <span class="texto">0 palabras</span>
  </div>
  <p class="rotulo" style="margin:.3rem 0 2rem">El bloque de identidad quiere entre 70 y
  110 palabras: mas corto no fija la cara, mas largo se diluye</p>

  <h2>Tus prompts, listos para pegar</h2>
  {salidas}
</section>"""


# ================================================================ 5, 6, 7
def vista_errores() -> str:
    bloques = "".join(f"""
<div class="tarjeta">
  <h3>{e(t)}</h3>
  <div class="prosa">
    <p><b>Como se ve.</b> {sintoma}</p>
    <p><b>Por que pasa.</b> {causa}</p>
    <p><b>Que hacer.</b> {arreglo}</p>
  </div>
</div>""" for t, sintoma, causa, arreglo in ERRORES)
    return f"""
<section id="errores" hidden>
  <h1>Los errores que vas a cometer</h1>
  <p class="entrada">Estos siete son los que se repiten. Los tres primeros son los que mas
  presupuesto se llevan, y los tres se evitan con la misma disciplina: aprobar antes de
  seguir.</p>
  {bloques}
</section>"""


def vista_coste() -> str:
    return f"""
<section id="coste" hidden>
  <h1>Cuanto cuesta</h1>
  <p class="entrada">Mueve los mandos con tus numeros. Las tarifas de partida son las de
  <code>nano_banana_pro</code> para imagen y <code>seedance_2_0</code> para video; cambian
  a menudo, asi que comprueba las tuyas en el panel de tu proveedor. Lo que no cambia es la
  proporcion.</p>

  <div class="calc" id="calc">
    <div class="mandos">
      <div class="slider"><label for="c-planos">Planos <b id="c-planos-v">28</b></label>
        <input id="c-planos" type="range" min="6" max="80" value="28"></div>
      <div class="slider"><label for="c-seg">Segundos por plano <b id="c-seg-v">4,0 s</b></label>
        <input id="c-seg" type="range" min="4" max="15" step="0.5" value="4"></div>
      <div class="slider">
        <label for="c-intentos">Intentos por plano <b id="c-intentos-v">2,5×</b></label>
        <input id="c-intentos" type="range" min="10" max="50" step="1" value="25"></div>
      <div class="slider">
        <label for="c-fijas">Planos de 5 frames o menos <b id="c-fijas-v">0 de 28</b></label>
        <input id="c-fijas" type="range" min="0" max="60" value="0"></div>
      <div class="campo"><label for="c-modelo">Modelo de imagen</label>
        <select id="c-modelo">
          <option value="nano_banana_pro">Nano Banana Pro · 2k</option>
          <option value="seedream_v5_pro">Seedream 5 Pro · 2k</option>
          <option value="flux_2_pro">Flux 2 Pro · 2k</option>
        </select></div>
      <div class="campo"><label for="c-res">Resolucion del video</label>
        <select id="c-res">
          <option value="480p">480p</option>
          <option value="720p" selected>720p — la nativa</option>
          <option value="1080p">1080p</option>
          <option value="4k">4K</option>
        </select></div>
    </div>
    <div class="total">
      <div class="caja teoria"><span>A la primera</span><b id="c-teoria">0 USD</b></div>
      <div class="caja real"><span>Realista</span><b id="c-real">0 USD</b></div>
      <div class="caja"><span>Duracion</span><b id="c-dur" style="font-size:1.2rem;
        color:var(--tinta2)">0 s</b></div>
    </div>
    <p class="nota" id="c-nota"></p>
  </div>

  <div class="aviso rojo">
    <p><b>La cifra que importa es la de la derecha.</b> Nadie aprueba un plano a la primera.
    Dos o tres intentos por plano es lo normal, y en los bustos son mas.</p>
  </div>

  <h2>Como se ahorra de verdad</h2>
  <div class="prosa">
  <ul>
    <li><b>Los planos de cinco frames o menos no se animan.</b> Son imagenes fijas. En
      <code>black_sand</code> son 19 de 53: gastar cuatro segundos de video para usar dos
      frames es tirar el dinero. Sube el mando y mira lo que cambia.</li>
    <li><b>Prueba a 6 s y 720p antes de la version larga.</b> Un plano largo que sale mal
      cuesta lo mismo que tres pruebas cortas.</li>
    <li><b>Genera a 720p y sube a 1080p solo el pase final.</b> Seedance 2.5 renderiza
      nativo a 720p: lo que llama 1080p es un reescalado del proveedor, no detalle nuevo.
      Y 4K de verdad solo lo da Seedance 2.0.</li>
  </ul>
  </div>

  <h2>Que necesitas</h2>
  {tabla(["Para que", "Herramienta", "Alternativa", "Nota"],
         [[f"<b>{e(h[0])}</b>", f"<code>{e(h[1])}</code>", f"<code>{e(h[2])}</code>", e(h[3])]
          for h in HERRAMIENTAS])}
</section>"""


def vista_automatico() -> str:
    filas = tabla(["Paso manual", "Comando", "Que hace"], [
        ["Extraer los planos de un referente",
         "<code>python3 tools/extraer_frames.py</code>",
         "Detecta cortes con ffmpeg y saca los frames"],
        ["Ver la paleta de cada acto", "<code>python3 tools/paleta.py</code>",
         "Mide los hex dominantes y los de acento"],
        ["Escribir la shotlist", "<code>python3 tools/shotlist.py</code>",
         "Monta <code>shotlist.md</code> desde los datos y las anotaciones"],
        ["Escribir los prompts de los 28 planos",
         "<code>python3 tools/generar_prompts.py</code>",
         "Ensambla estilo + personaje + ubicacion + encuadre, una ficha por plano"],
        ["Saber lo que va a costar", "<code>python3 -m pipeline coste on_the_road</code>",
         "Estima sin lanzar nada"],
        ["Generar los start frames", "<code>python3 -m pipeline frames on_the_road</code>",
         "Uno por plano, cuatro a la vez"],
        ["Aprobar un start frame",
         "<code>echo &quot;on_the_road_07_macro-llave.png&quot; &gt;&gt; "
         "assets/frames/aprobados.txt</code>",
         "<b>Despues de mirarlo.</b> Sin esto, el paso siguiente se niega"],
        ["Animar los aprobados", "<code>python3 -m pipeline video on_the_road</code>",
         "Se salta los planos sin start frame aprobado"],
        ["Preparar la lista de montaje",
         "<code>python3 tools/generar_lista_montaje.py on_the_road</code>",
         "Saca el manifiesto desde la shotlist"],
        ["Montar",
         "<code>./scripts/montage.sh --lista montaje/lista_on_the_road.tsv</code>",
         "Concatena, inserta, rampas, musica, y exporta 16:9 y 9:16"],
        ["Ver que haria sin hacerlo", "<code>… --dry-run</code>",
         "Funciona en el pipeline y en montage.sh"],
    ])
    reglas = tabla(["", "Regla", "Que pasa si la rompes"], [
        ["1", "No se anima sin start frame <b>aprobado</b>",
         "Se salta el plano y te dice cual y por que"],
        ["2", "Primero 6 s a 720p, luego la version larga",
         "No lanza la larga si no hay una prueba aprobada"],
        ["3", "Seedance 2.5 es nativo 720p y no da 4K",
         "Rechaza pedir 4K a un modelo que solo lo reescala"],
        ["4", "Maximo cuatro trabajos a la vez",
         "Encola. Ante un 429 reintenta con espera creciente"],
        ["5", "Todo trabajo se anota en <code>runs/log.jsonl</code>",
         "Puedes reproducir un plano que salio bien con sus parametros exactos"],
        ["6", "Presupuesto por ejecucion y por trabajo",
         "Para en seco y te dice cuanto llevas"],
    ])
    return f"""
<section id="automatico" hidden>
  <h1>Modo automatico</h1>
  <p class="entrada">Todo lo que la guia explica a mano tiene su comando. Es opcional: el
  sistema funciona igual abriendo la web de tu proveedor y pegando prompts. Pero si vas a
  hacer mas de un video, esto te ahorra las tres horas de copiar y pegar.</p>
  <div class="aviso rojo">
    <p><b>Sin <code>video-ia/.env</code> no se llama a ninguna API.</b> El pipeline arranca
    en modo simulacion: te dice que lanzaria y cuanto costaria, y para. Es lo que quieres la
    primera vez.</p>
  </div>
  {filas}
  <h2>Las seis reglas que impone el codigo</h2>
  <p class="prosa">No son consejos de un README: si las rompes, el pipeline se niega a
  seguir. Un pipeline que solo avisa acaba lanzando 28 videos sin start frame la primera
  noche que alguien tiene prisa.</p>
  {reglas}
  <div class="aviso">
    <p><b>&laquo;Aprobado&raquo; no es &laquo;existe el archivo&raquo;.</b> El nombre tiene
    que estar en <code>assets/frames/aprobados.txt</code>. Mirar una imagen y decidir si
    vale es un paso humano, y el pipeline no puede hacerlo por ti. Aprobar sin mirar es lo
    mismo que no tener la regla.</p>
  </div>
  <h2>Por que no hay Midjourney</h2>
  <p class="prosa">Midjourney no tiene API oficial y sus terminos prohiben la
  automatizacion, asi que no hay forma legitima de meterlo aqui. Para el look pintado,
  <code>seedream_v5_pro</code> o <code>nano_banana_pro</code> con el bloque de estilo dan
  un resultado equivalente. Midjourney se usa <b>a mano</b>, y solo para style frames, si
  tu decides hacerlo.</p>
</section>"""


def vista_glosario() -> str:
    grupos: dict[str, list] = {}
    for termino, grupo, definicion in GLOSARIO:
        grupos.setdefault(grupo, []).append((termino, definicion))
    partes = [f"<h2>{e(g)}</h2>"
              + tabla(["Termino", "Que significa"], [[f"<b>{e(t)}</b>", d] for t, d in items])
              for g, items in grupos.items()]
    return f"""
<section id="glosario" hidden>
  <h1>Glosario</h1>
  <p class="entrada">Sin dar nada por sabido. Si un termino de la guia no esta aqui y no lo
  entiendes, es un fallo de la guia.</p>
  {''.join(partes)}
</section>"""


# ================================================================ documento
def partes() -> dict:
    """Las piezas sueltas del documento.

    Se separan de construir() para poder montar tambien la version de un solo archivo
    (tools/guia_movil.py), que necesita el mismo cuerpo pero otra envoltura.
    """
    d = {v: datos(v) for v in VIDEOS}
    tabs = [("visor", "El ritmo"), ("anatomia", "Anatomia"), ("sistema", "El sistema"),
            ("replicar", "Mi personaje"), ("coste", "Coste"), ("errores", "Errores"),
            ("automatico", "Modo automatico"), ("glosario", "Glosario")]
    nav = "".join(
        f'<button type="button" data-vista="{i}" role="tab" '
        f'aria-selected="{"true" if i == "visor" else "false"}">{e(t)}</button>'
        for i, t in tabs)

    cuerpo = f"""<header class="top">
  <div class="fila"><div class="marca"><i class="punto"></i>Sala de montaje</div></div>
  <nav class="tabs" role="tablist" aria-label="Secciones">{nav}</nav>
</header>
<main>
{vista_visor(d)}
{vista_anatomia(d)}
{vista_sistema(d)}
{vista_replicar()}
{vista_coste()}
{vista_errores()}
{vista_automatico()}
{vista_glosario()}
</main>
<footer>
  <p>Generado desde el analisis de los dos referentes. Los tiempos, las paletas y el
  ritmo estan medidos sobre los archivos con <code>ffmpeg</code>, no estimados.</p>
</footer>

<div class="lb" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Plano ampliado">
  <button class="cerrar" type="button" aria-label="Cerrar">&#10005;</button>
  <button class="nav prev" type="button" aria-label="Plano anterior">&#8249;</button>
  <button class="nav next" type="button" aria-label="Plano siguiente">&#8250;</button>
  <figure>
    <img alt="" width="1280" height="720">
    <figcaption>
      <span class="tit"></span><span class="dat"></span>
      <p class="desc"></p>
    </figcaption>
  </figure>
  <p class="pista"></p>
</div>

<div class="barra">
  <span class="cuenta">0/{len(PASOS)} pasos</span>
  <span class="pista"><span class="relleno"></span></span>
  <button type="button">reiniciar</button>
</div>"""

    datos_js = (f"window.__PLANOS__="
                f"{json.dumps(planos_json(d), ensure_ascii=False, separators=(',', ':'))};"
                f"window.__TOUR__="
                f"{json.dumps(TOUR, ensure_ascii=False, separators=(',', ':'))};")

    return {"titulo": "Sala de Montaje", "fuentes": css_fuentes(), "css": CSS,
            "cuerpo": cuerpo, "datos": datos_js, "js": JS,
            "descripcion": ("Sistema paso a paso para producir video de animacion pintada "
                            "con IA, sacado de diseccionar dos referentes plano a plano.")}


def construir() -> str:
    p = partes()
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{p['titulo']}</title>
<meta name="description" content="{p['descripcion']}">
<meta name="color-scheme" content="dark">
<style>{p['fuentes']}</style>
<style>{p['css']}</style>
</head>
<body>
{p['cuerpo']}
<script>{p['datos']}</script>
<script>{p['js']}</script>
</body>
</html>
"""


if __name__ == "__main__":
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(construir(), encoding="utf-8")
    print(f"{SALIDA}  {SALIDA.stat().st_size / 1024:.0f} KB")
