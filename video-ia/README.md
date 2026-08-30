# video-ia — sistema para hacer videos de IA de calidad cinematografica

Sale de diseccionar dos videos de referencia plano a plano con `ffmpeg` y convertir lo que se
ve en un procedimiento repetible: guia, plantillas de prompt, scripts de montaje y un pipeline.

**Empieza por aqui:** abre `guia/index.html` en el navegador y dale al play. Es la guia
completa, funciona sin internet y no necesita nada instalado.

Lo primero que ves es un **visor que reproduce los planos de un referente a su duracion
real**. El ritmo no se explica, se siente: veras que `on_the_road` acelera sin parar y que
`black_sand` mete rafagas de un frame que se acaban antes de que las registres. Debajo, una
tira donde cada plano ocupa lo que dura, asi que la estructura se ve de un vistazo.

```
open guia/index.html          # macOS
xdg-open guia/index.html      # Linux
```

## Que hay

```
video-ia/
  guia/index.html      LA GUIA. Ocho vistas, autocontenida, para principiante
  analysis/            la diseccion de los dos referentes (shotlist, paleta, estilo)
  characters/          hojas de personaje: identidad inmutable + 6 planchas
  locations/           ubicaciones: descripcion inmutable + planchas + horas del dia
  props/               props heroe y de inserto
  prompts/             los 28 planos de on_the_road resueltos + plantillas
  scripts/montage.sh   el montaje con ffmpeg (probado)
  pipeline/            ejecutar todo desde la terminal (arquitectura, sin claves)
  tools/               los generadores. Nada se escribe a mano dos veces
  montaje/             los manifiestos de montaje, generados desde la shotlist
  ref/                 los dos mp4 de referencia (fuera de git)
```

## El orden del sistema

```
guion → nombres → UBICACIONES → PERSONAJES → props → start frames → video → montaje
```

Primero el mundo, luego el personaje, luego los frames, luego el video. La razon es la luz:
una ubicacion define hora del dia, direccion y temperatura de color, y si generas al personaje
antes lo generas con una luz inventada que despues no encaja en ningun sitio.

**Nunca se anima sin un start frame aprobado, y nunca se hace un start frame sin la hoja de
personaje y la ubicacion aprobadas.** Es la regla dura, y `pipeline/` la impone en codigo.

## Las dos reglas de arquitectura de este repo

1. **La shotlist es la fuente de verdad.** `analysis/<video>/shotlist.md` manda. Los prompts,
   la lista de montaje y la guia se generan desde ella. Si cambia un plano, se cambia en
   `analysis/<video>/anotaciones.json` y se vuelven a correr los generadores. Nunca se edita
   un archivo generado.
2. **Nada de este repo llama a una API de IA.** Produce prompts, orden y guia. Generar es tuyo.
   `pipeline/` puede hacerlo cuando le des claves, y sin `.env` funciona en simulacion.

## Los datos de los referentes

| | `on_the_road` | `black_sand` |
|---|---|---|
| Duracion | 39,01 s | 75,58 s |
| Planos | 28 | 53 |
| Plano medio | 1,39 s | 1,43 s |
| Plano mas corto | 10 frames | **1 frame** |
| Plano mas largo | 173 frames | 157 frames |
| Negros de puntuacion | 0 | 5 |
| Estructura | acelera sin parar | alterna largo y rafaga |

Los dos son 1276x718 a 30 fps.

## Las herramientas

Todas son Python de biblioteca estandar mas Pillow, y `ffmpeg` por `imageio-ffmpeg`:

```bash
pip install Pillow imageio-ffmpeg          # lo unico que hace falta
python3 tools/extraer_frames.py            # detecta cortes y saca frames
python3 tools/paleta.py                    # paleta base, cromatica y de acento por acto
python3 tools/hoja_contacto.py             # hojas de contacto
python3 tools/shotlist.py                  # genera los shotlist.md
python3 tools/generar_prompts.py           # genera las fichas de prompt por plano
python3 tools/generar_lista_montaje.py     # genera el manifiesto de montaje
python3 tools/preparar_imagenes_guia.py    # reduce los frames para la guia
cd tools && python3 generar_guia.py        # genera guia/index.html
python3 tools/verificar_guia.py            # la abre en Chromium y comprueba que funciona
```

`tools/verificar_guia.py` necesita ademas `pip install playwright`. Abre la guia en un
Chromium de verdad y comprueba lo que un test de humo no ve: que el visor reproduce, que la
tira es proporcional a las duraciones, que el lightbox navega con el teclado, que el tour
avanza, que la calculadora responde, que las capas del prompt se encienden, que no hay ni un
recurso externo y que los checkboxes sobreviven a una recarga.

Las tipografias (`Archivo` para la interfaz, `Newsreader` para la prosa) se descargan una vez
con `tools/guia_fuentes.py` y quedan cacheadas en `guia/_fuentes.json`, que si entra en git:
regenerar la guia no necesita red.

## Montar

```bash
python3 tools/generar_lista_montaje.py mi_video
./scripts/montage.sh --lista montaje/lista_mi_video.tsv --musica musica.mp3 --dry-run
```

Sin terminal: `scripts/MONTAJE_SIN_TERMINAL.md` lo explica en CapCut y Premiere.

## Pipeline

```bash
python3 -m pipeline coste on_the_road      # estima sin lanzar nada
```

Sin `video-ia/.env` todo es simulacion. Ver `pipeline/README.md`.

## Regenerar el analisis desde cero

Los `.mp4` de `ref/` y el grid de frames de 0,5 s estan fuera de git. Con los dos mp4 en
`ref/on_the_road.mp4` y `ref/black_sand.mp4`:

```bash
python3 tools/extraer_frames.py && python3 tools/paleta.py && python3 tools/hoja_contacto.py
python3 tools/shotlist.py && python3 tools/generar_prompts.py
python3 tools/preparar_imagenes_guia.py && (cd tools && python3 generar_guia.py)
```

## Sobre los personajes de ejemplo

`el_conductor`, `el_arenero` y `el_jefe` **no son** los personajes de los videos de referencia:
son arquetipos reconstruidos a partir del analisis, con los rasgos identificativos cambiados a
proposito. Sirven para ensenar el metodo con un ejemplo completo. Los disenos originales son de
sus autores. Lo que te sirve a ti es el metodo, no copiar un diseno.
