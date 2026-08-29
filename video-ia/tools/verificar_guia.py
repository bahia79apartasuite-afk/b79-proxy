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
GUIA = RAIZ / "guia" / "index.html"
CAPTURAS = RAIZ / "guia" / "_capturas"
VISTAS = ["inicio", "anatomia", "sistema", "replicar", "errores", "automatico", "glosario"]
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
            rotas = pag.evaluate("""() => Array.from(document.images)
                .filter(i => !i.complete || i.naturalWidth === 0)
                .map(i => i.getAttribute('src'))""")
            total_img = pag.evaluate("() => document.images.length")
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
            guardado = pag.evaluate("() => localStorage.getItem('b79-video-ia-v1')")
            pag.reload(wait_until="load")
            pag.wait_for_timeout(500)
            marcados = pag.evaluate("""() => Array.from(
                document.querySelectorAll('input[data-paso]'))
                .filter(c => c.checked).map(c => c.dataset.paso)""")
            vista_recordada = pag.evaluate(
                "() => JSON.parse(localStorage.getItem('b79-video-ia-v1')||'{}').vista")
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
