#!/usr/bin/env python3
"""Fase 5 - verifica guia/index.html con un navegador de verdad.

Comprueba lo que un test de humo no ve:
  - que carga sin errores de consola
  - que TODAS las imagenes cargan (naturalWidth > 0), o sea que funciona sin internet
  - que no hay ningun recurso externo (ni CDN, ni fuentes de Google)
  - que los checkboxes persisten al recargar
  - que no hay scroll horizontal a 390 px
  - captura cada vista a 390 px y a 1280 px
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
import os
# se puede verificar la version normal o la de un solo archivo: la segunda es la que
# de verdad importa que funcione, porque es la que acaba en un telefono
GUIA = RAIZ / "guia" / (os.environ.get("GUIA") or "index.html")
CAPTURAS = RAIZ / "guia" / "_capturas"
VISTAS = ["visor", "anatomia", "sistema", "replicar", "coste", "errores", "automatico",
          "glosario"]
# El entorno trae Chromium preinstalado con un numero de build que no tiene por que
# coincidir con el que espera la version de playwright que haya. Se busca.
def _buscar_navegador() -> str | None:
    for patron in ("chromium-*/chrome-linux/chrome",
                   "chromium_headless_shell-*/chrome-linux/headless_shell"):
        for c in sorted(Path("/opt/pw-browsers").glob(patron), reverse=True):
            if c.exists():
                return str(c)
    return None


def main() -> int:
    CAPTURAS.mkdir(parents=True, exist_ok=True)
    fallos: list[str] = []
    errores_consola: list[str] = []
    externos: list[str] = []

    with sync_playwright() as pw:
        exe = _buscar_navegador()
        print(f"navegador: {exe or 'el que traiga playwright'}")
        nav = pw.chromium.launch(executable_path=exe)

        for ancho, alto, etiqueta in ((390, 844, "movil"), (1280, 900, "escritorio")):
            ctx = nav.new_context(viewport={"width": ancho, "height": alto},
                                  device_scale_factor=2 if ancho == 390 else 1)
            pag = ctx.new_page()
            pag.on("console", lambda m: errores_consola.append(f"{m.type}: {m.text}")
                   if m.type == "error" else None)
            pag.on("pageerror", lambda e: errores_consola.append(f"pageerror: {e}"))
            # cualquier peticion fuera de file:// es una dependencia externa
            pag.on("request", lambda r: externos.append(r.url)
                   if not r.url.startswith("file://") else None)

            pag.goto(GUIA.as_uri(), wait_until="load")
            pag.wait_for_timeout(600)

            for vista in VISTAS:
                pag.click(f'nav.tabs button[data-vista="{vista}"]')
                pag.wait_for_timeout(250)
                if vista == "sistema":
                    # con el acordeon cerrado la captura no prueba nada del contenido
                    if pag.evaluate("() => document.querySelector('#paso-personajes .contenido').hidden"):
                        pag.click("#paso-personajes .cab")
                    pag.wait_for_timeout(300)
                # las imagenes son lazy: hay que bajar para que carguen antes de capturar
                pag.evaluate("""() => new Promise(r => {
                    let y = 0; const paso = () => {
                        window.scrollTo(0, y); y += window.innerHeight;
                        if (y < document.body.scrollHeight + window.innerHeight) setTimeout(paso, 60);
                        else { window.scrollTo(0,0); setTimeout(r, 250); }
                    }; paso();
                })""")
                pag.screenshot(path=str(CAPTURAS / f"{etiqueta}_{vista}.png"), full_page=True)

            # --- imagenes ---
            # una <img> sin src todavia no es una imagen rota: es el hueco del lightbox
            rotas = pag.evaluate("""() => Array.from(document.images)
                .filter(i => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0))
                .map(i => i.getAttribute('src'))""")
            total_img = pag.evaluate(
                "() => Array.from(document.images).filter(i => i.getAttribute('src')).length")
            if rotas:
                fallos.append(f"[{etiqueta}] {len(rotas)} imagenes rotas: {rotas[:5]}")
            print(f"[{etiqueta}] {total_img} imagenes, {len(rotas)} rotas")

            # --- scroll horizontal ---
            desborda = pag.evaluate(
                "() => document.documentElement.scrollWidth > window.innerWidth + 1")
            if desborda:
                ancho_doc = pag.evaluate("() => document.documentElement.scrollWidth")
                fallos.append(f"[{etiqueta}] scroll horizontal: documento {ancho_doc} px "
                              f"en un viewport de {ancho} px")
            print(f"[{etiqueta}] scroll horizontal: {'SI (mal)' if desborda else 'no'}")

            # --- persistencia de los checkboxes ---
            pag.click('nav.tabs button[data-vista="sistema"]')
            pag.wait_for_timeout(200)
            n_checks = pag.evaluate("() => document.querySelectorAll('input[data-paso]').length")
            pag.evaluate("""() => {
                const c = document.querySelectorAll('input[data-paso]');
                [c[0], c[2]].forEach(x => { x.checked = true;
                    x.dispatchEvent(new Event('change', {bubbles:true})); });
            }""")
            pag.wait_for_timeout(200)
            guardado = pag.evaluate("() => localStorage.getItem('b79-video-ia-v2')")
            pag.reload(wait_until="load")
            pag.wait_for_timeout(500)
            marcados = pag.evaluate("""() => Array.from(
                document.querySelectorAll('input[data-paso]'))
                .filter(c => c.checked).map(c => c.dataset.paso)""")
            vista_recordada = pag.evaluate(
                "() => JSON.parse(localStorage.getItem('b79-video-ia-v2')||'{}').vista")
            if len(marcados) != 2:
                fallos.append(f"[{etiqueta}] los checkboxes no persisten: {marcados}")
            print(f"[{etiqueta}] {n_checks} checkboxes; tras recargar siguen marcados "
                  f"{len(marcados)}; vista recordada: {vista_recordada}")

            # --- el formulario rellena las plantillas ---
            pag.click('nav.tabs button[data-vista="replicar"]')
            pag.wait_for_timeout(200)
            pag.fill('#form-replicar [name="nombre"]', "EL MENSAJERO")
            pag.fill('#form-replicar [name="accion"]', "she sets the crate down")
            pag.wait_for_timeout(250)
            texto = pag.inner_text('#replicar .prompt pre')
            if "EL MENSAJERO" not in texto:
                fallos.append(f"[{etiqueta}] el formulario no rellena la plantilla")
            hueco = pag.evaluate("""() => Array.from(
                document.querySelectorAll('#replicar pre')).some(p => p.textContent.includes('{{'))""")
            if hueco:
                fallos.append(f"[{etiqueta}] han quedado marcadores {{{{...}}}} sin sustituir")
            print(f"[{etiqueta}] formulario en vivo: "
                  f"{'OK' if 'EL MENSAJERO' in texto and not hueco else 'MAL'}")

            # --- el visor reproduce a la duracion real ---
            pag.click('nav.tabs button[data-vista="visor"]')
            pag.wait_for_timeout(300)
            primero = pag.inner_text("#el-visor .contador")
            pag.click("#play")
            pag.wait_for_timeout(2600)          # 2.23 + 0.83 s = dos planos ya pasados
            durante = pag.inner_text("#el-visor .contador")
            reproduciendo = pag.evaluate(
                "() => document.getElementById('el-visor').classList.contains('play')")
            pag.click("#play")
            pag.wait_for_timeout(200)
            parado = pag.evaluate(
                "() => !document.getElementById('el-visor').classList.contains('play')")
            visible = pag.evaluate(
                "() => document.querySelectorAll('#el-visor .pantalla img.on').length")
            if primero == durante or not reproduciendo or not parado or visible != 1:
                fallos.append(f"[{etiqueta}] el visor no reproduce: {primero!r} -> {durante!r}, "
                              f"play={reproduciendo} pausa={parado} frames visibles={visible}")
            print(f"[{etiqueta}] visor: {primero.strip()} -> {durante.strip()}, "
                  f"1 frame visible: {visible == 1}")

            # --- la tira de tiempo es proporcional a la duracion ---
            anchos = pag.evaluate("""() => {
                const t = document.querySelector('#el-visor .tira:not([hidden])');
                return Array.from(t.querySelectorAll('.blk'))
                    .map(b => Math.round(b.getBoundingClientRect().width * 10) / 10);
            }""")
            if len(anchos) < 20 or max(anchos) <= min(anchos):
                fallos.append(f"[{etiqueta}] la tira no es proporcional: {anchos[:6]}")
            print(f"[{etiqueta}] tira: {len(anchos)} bloques, de {min(anchos)} a {max(anchos)} px")

            # --- saltar a un plano por la tira ---
            pag.click('#el-visor .tira:not([hidden]) .blk[data-n="9"]')
            pag.wait_for_timeout(250)
            saltado = pag.inner_text("#el-visor .contador")
            if "09" not in saltado:
                fallos.append(f"[{etiqueta}] la tira no salta de plano: {saltado!r}")
            print(f"[{etiqueta}] salto por la tira: {saltado.strip()}")

            # --- lightbox ---
            pag.click('nav.tabs button[data-vista="anatomia"]')
            pag.wait_for_timeout(250)
            pag.click("#planos-on_the_road .plano:nth-child(3)")
            pag.wait_for_timeout(350)
            abierto = pag.evaluate("() => !document.getElementById('lightbox').hidden")
            tit = pag.inner_text("#lightbox .tit") if abierto else ""
            pag.keyboard.press("ArrowRight")
            pag.wait_for_timeout(250)
            tit2 = pag.inner_text("#lightbox .tit") if abierto else ""
            src = pag.get_attribute("#lightbox img", "src") or ""
            pag.keyboard.press("Escape")
            pag.wait_for_timeout(250)
            cerrado = pag.evaluate("() => document.getElementById('lightbox').hidden")
            if not abierto or not cerrado or tit == tit2 or not src:
                fallos.append(f"[{etiqueta}] lightbox mal: abre={abierto} cierra={cerrado} "
                              f"{tit!r}->{tit2!r} src={src!r}")
            print(f"[{etiqueta}] lightbox: {tit.strip()} -> {tit2.strip()}, cierra con Esc")

            # --- tour animado ---
            pag.click('nav.tabs button[data-vista="sistema"]')
            pag.wait_for_timeout(250)
            e0 = pag.inner_text("#tour .escena")
            pag.click("#tour-next")
            pag.wait_for_timeout(350)
            e1 = pag.inner_text("#tour .escena")
            vivas = pag.evaluate("() => document.querySelectorAll('#tour .et.viva').length")
            destacado = pag.evaluate("() => document.querySelectorAll('.paso.destacado').length")
            if e0 == e1 or vivas != 1:
                fallos.append(f"[{etiqueta}] el tour no avanza: vivas={vivas}")
            print(f"[{etiqueta}] tour: avanza={e0 != e1}, 1 etapa viva={vivas == 1}, "
                  f"paso destacado={destacado}")

            # --- calculadora de coste ---
            pag.click('nav.tabs button[data-vista="coste"]')
            pag.wait_for_timeout(250)
            antes = pag.inner_text("#c-real")
            pag.evaluate("""() => { const s = document.getElementById('c-planos');
                s.value = 60; s.dispatchEvent(new Event('input', {bubbles:true})); }""")
            pag.wait_for_timeout(200)
            despues = pag.inner_text("#c-real")
            if antes == despues or "USD" not in despues:
                fallos.append(f"[{etiqueta}] la calculadora no responde: {antes!r} -> {despues!r}")
            print(f"[{etiqueta}] calculadora: {antes.strip()} -> {despues.strip()}")

            # --- las capas del prompt se encienden al rellenar ---
            pag.click('nav.tabs button[data-vista="replicar"]')
            pag.wait_for_timeout(250)
            encendidas0 = pag.evaluate("() => document.querySelectorAll('#replicar .capa.on').length")
            pag.fill("#f-cara", "square jaw, thin eyebrows, grey eyes")
            pag.fill("#f-ubicacion", "LOCATION — DOCK: concrete, four lamps, wet floor")
            pag.wait_for_timeout(300)
            encendidas1 = pag.evaluate("() => document.querySelectorAll('#replicar .capa.on').length")
            if encendidas1 <= encendidas0:
                fallos.append(f"[{etiqueta}] las capas no se encienden: "
                              f"{encendidas0} -> {encendidas1}")
            print(f"[{etiqueta}] capas del prompt: {encendidas0} -> {encendidas1} encendidas")

            ctx.close()
        nav.close()

    if externos:
        fallos.append(f"la guia pide {len(externos)} recursos externos: {externos[:5]}")
    print(f"\nrecursos externos: {len(externos)}")
    print(f"errores de consola: {len(errores_consola)}")
    for x in errores_consola[:10]:
        print("  ", x)
    if errores_consola:
        fallos.append(f"{len(errores_consola)} errores de consola")

    print(f"\ncapturas en {CAPTURAS}")
    if fallos:
        print("\nFALLOS:")
        for f in fallos:
            print("  -", f)
        return 1
    print("\nTodo correcto.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
