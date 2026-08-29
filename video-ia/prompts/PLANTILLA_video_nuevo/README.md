# Plantilla — un video nuevo con tus personajes

## Como se usa

```bash
cp -r prompts/PLANTILLA_video_nuevo prompts/mi_video
mkdir -p analysis/mi_video
```

Y despues, **en este orden**:

1. **Guion.** Tres o cuatro frases. Que pasa, quien lo hace, donde.
2. **Shotlist.** `analysis/mi_video/anotaciones.json` con un plano por fila: tipo, camara,
   sujeto, accion, funcion. Copia la estructura de `analysis/on_the_road/anotaciones.json`.
   **Este archivo es la fuente de verdad.** Todo lo demas se deriva de aqui.
3. **Ubicaciones.** `cp -r locations/PLANTILLA locations/mi_sitio`, rellena, genera, aprueba.
4. **Personajes.** `cp -r characters/PLANTILLA characters/mi_personaje`, rellena, genera la
   hoja de 6 planchas, aprueba, crea el Element.
5. **Props.** `cp -r props/PLANTILLA props/mi_prop`. Los heroe primero.
6. **Start frames.** Rellena `_spec.json` y corre `python3 tools/generar_prompts.py`.
7. **Video.** Un clip por plano, con su start frame aprobado.
8. **Montaje.** `scripts/montage.sh`.

**No te saltes el orden.** Cada paso da por hecho que el anterior esta aprobado. Si generas
start frames antes de tener la ubicacion, los generas con una luz inventada y luego no cortan
entre si.

## Los tres campos que rellenas

En todas las plantillas de esta carpeta:

- `[PERSONAJE]` — el bloque de identidad inmutable de `characters/<tuyo>/sheet.md`
- `[UBICACION]` — el bloque de `locations/<tuya>/sheet.md`
- `[ACCION]` — **una sola cosa que pasa**, en una frase

Y ademas `[ESTILO]`, que es el bloque de tu `STYLE.md`, y `[PROP]` cuando haga falta.

## La regla de `[ACCION]`

Es la que mas gente rompe. Una accion, un plano.

| Mal | Bien |
|---|---|
| "camina hasta el coche y arranca" | "camina hasta el coche" (y el arranque es otro plano) |
| "mira al frente, luego se gira" | "gira la cabeza hacia camara-izquierda y se queda" |
| "el coche derrapa y luego sale disparado" | "el coche derrapa en circulo" |

Si tu frase lleva "y luego", "despues" o "entonces", **son dos planos**. Metelos en la shotlist
como dos filas. El modelo de video que recibe una accion con dos partes se inventa un corte a
mitad del clip, y ese corte no se puede quitar en el montaje.

## Archivos de esta carpeta

- `_spec.json` — la plantilla del archivo que alimenta `tools/generar_prompts.py`
- `TIPO_busto.md`, `TIPO_macro.md`, `TIPO_amplio.md`, `TIPO_pov.md`,
  `TIPO_impacto.md`, `TIPO_titulo.md` — una plantilla de prompt por tipo de plano

Los `TIPO_*.md` estan para copiar y pegar a mano si prefieres no usar el generador. Si usas el
generador, con rellenar `_spec.json` es suficiente y los `.md` salen solos.
