# STYLE — `on_the_road`

Todos los hex de este archivo salen de `tools/paleta.py` sobre los frames reales de
`analysis/on_the_road/frames/`, no de mirar a ojo. Se regeneran con `python3 tools/paleta.py`.

## 1. Paleta

### Global

| Rol | Hex | Donde aparece |
|---|---|---|
| Negro de sombra | `#000000` | sombras sin relleno, interior del coche, ruedas |
| Marron tostado | `#6E4832` | roca, tierra, piel en sombra |
| Beige polvo | `#90745D` | polvo en suspension, asfalto lejano |
| Sombra calida | `#482716` | el lado oscuro de todo |
| Ambar medio | `#CC8944` | carroceria a media luz |
| Crema de sol | `#EABB7B` | cielo bajo, reflejos, arena iluminada |
| Terracota | `#A65C27` | mesetas, tierra roja |
| Azul frio | `#9CB4CA` | cielo alto, gorra, cristales — **el unico frio** |

### Acentos (los colores firma, medidos en los planos donde el coche llena el cuadro)

| Hex | Sat | Que es |
|---|---|---|
| `#F2BB34` | 88 | **Amarillo cadmio de la carroceria.** El color de la pelicula. |
| `#DEA228` | 73 | Amarillo a media luz |
| `#B36D01` | 99 | Amarillo en sombra, casi ambar puro |
| `#8A4F06` | 92 | Amarillo en sombra profunda |
| `#74DFEF`-equivalente | — | no existe aqui; el unico frio es el azul del cielo y la llamarada del escape |

### Por acto

| Acto | Duracion | Planos | s/plano | Base | Acento |
|---|---|---|---|---|---|
| 1. Diner del desierto | 10.5 s | 4 | 2.62 | `#000001` `#3E1D11` `#7F6F64` `#96B0C9` `#693D25` `#B3A69D` | `#3E2013` `#914D2B` |
| 2. Quemada y donuts | 13.2 s | 9 | 1.46 | `#43352E` `#6F431A` `#000000` `#EDB46B` `#BE7232` `#8B5D36` | `#F2BE78` `#D98738` `#6D3F15` `#AB5E26` |
| 3. Carretera y velocidad | 15.4 s | 15 | 1.03 | `#5C493F` `#C5C1B6` `#1A1517` `#000000` `#DE9A5B` `#793E12` | `#DE9A5B` `#793E12` `#B76D27` `#E1CDAD` |

**Lo que hay que leer en esta tabla:** el acto 1 es el mas frio (aparece `#96B0C9`, cielo y gorra),
y a partir del acto 2 el naranja se come el cuadro. La pelicula se calienta segun acelera.
No hay verde en ninguna parte. No hay morado. Son ocho colores para 39 segundos.

## 2. Textura de pincel

Oleo digital con la pincelada a la vista, sobre todo en zonas planas: cielo, asfalto, polvo.
Las pinceladas son **grandes y pocas** — un cielo entero se resuelve con seis o siete trazos
horizontales que no se molestan en fundirse entre si. La piel esta mas trabajada que el fondo:
en los bustos hay degradado real en la mejilla y el pomulo, mientras el fondo detras queda
en manchas. Ese desequilibrio deliberado (personaje pintado fino, fondo pintado grueso)
es lo que hace que la cara salte del plano sin necesidad de desenfoque.

En los macros de metal (rueda, escape, cuadro de mandos) la pincelada desaparece y aparece
render casi fotografico con especulares duros. **La textura cambia segun la escala del plano.**

## 3. Grosor de linea

No hay contorno de tinta uniforme. La linea aparece solo donde hace falta separar dos masas:

- Ceja, parpado y nariz del personaje: linea negra gruesa, de 2 a 3 px a 720 p, con el trazo
  que se afila en los extremos (linea de pincel, no de vector).
- Silueta del coche contra el cielo: sin linea; se separa por contraste de valor.
- Interiores del coche: linea fina o inexistente, todo por valor.

Regla practica: **linea solo en la cara, y solo en los rasgos que expresan.** Si pides
"bold outlines" a un modelo de imagen te devuelve contorno en todo y pierdes este look.

## 4. Luz

Una sola fuente dura y baja, de sol de tarde, casi siempre entrando por un lateral o de frente.
Consecuencias visibles:

- Sombras **sin relleno**: el lado oscuro de la cara cae a `#3E1D11` y no se recupera.
- Especular en la frente, el pomulo y el puente de la nariz. Tres puntos, no mas.
- Contraluz frecuente: en los planos 27 y 28 el sujeto es casi una silueta.
- Bloom calido alrededor del sol y de los faros; halo de un par de pixeles, no un filtro.
- Polvo en el aire iluminado por detras: es lo que da profundidad, no la niebla atmosferica.

## 5. Tipografia

**No hay onomatopeyas.** Este video no usa recursos de comic en ningun plano. El unico texto
que aparece esta pintado dentro del mundo: el bordado en cursiva dorada de la gorra, el logo
de la aleta del coche y la matricula amarilla. Todo es texto **diegetico**, corto, y en varios
planos ilegible a proposito.

Eso es una decision de estilo que conviene copiar: si un texto no se puede leer entero en
menos de un segundo, mejor que sea ilegible del todo que medio legible. Un modelo de imagen
escribe mal casi siempre; pedirle letras pequenas y borrosas es pedirle algo que si sabe hacer.

## 6. Ritmo

| Metrica | Valor |
|---|---|
| Duracion | 39.01 s |
| Planos | 28 |
| Plano medio | 1.39 s |
| Cortes por segundo | 0.69 |
| Plano mas corto | 10 frames (0.33 s) |
| Plano mas largo | 173 frames (5.77 s) |

El ritmo **acelera de forma monotona**: 2.62 s por plano en el acto 1, 1.46 en el acto 2,
1.03 en el acto 3. No hay un solo tramo que vaya mas lento que el anterior. Esa curva es
toda la estructura del video. Sin la excepcion del plano 25 (cenital de 1.2 s en mitad de la
rafaga final) la ultima parte seria ilegible.

No hay negros de puntuacion ni congelados. Todos los cortes son secos.

## 7. Patron de secuencia

Reparto: **macro 11 planos (31 % del metraje) · amplio 11 (55 %) · busto 5 (11 %) · POV 1 (3 %)**.

Los encadenados que mas se repiten:

- `macro → macro` (5 veces) — los insertos van **en pareja**, nunca sueltos.
- `macro → amplio` (5) — el inserto respira devolviendo el espacio.
- `amplio → amplio` (4) — dos amplios seguidos solo si cambia el eje (lateral → cenital).
- `amplio → busto` (3) — la cara vuelve para recordar de quien es la historia.

La celula base del video es:

```
busto (quien)  →  macro (que toca)  →  amplio (donde)  →  macro (textura)
```

Se repite tres veces con distinto contenido. Los planos 5-6-7-8 y los 20-21-22-23 son la
misma figura con otro decorado.

## 8. Bloque de estilo

Esto se pega **al principio de cualquier prompt de imagen** para obtener este look. En ingles,
porque los modelos de imagen responden mejor: la guia se explica en espanol, los prompts van
en ingles.

```
Painted 2D animation still, graphic-novel finish: visible oil-brush strokes, thick
confident contour lines only on facial features, flat colour blocking chosen over
photographic detail. Golden-hour desert light — hard warm key from a low sun, deep
unlit shadows, almost no ambient fill. Limited palette: cadmium yellow #F2BB34,
burnt sienna #B36D27, warm sand #E4CCA6, dust cream #D7C29E, deep navy #2C3550,
near-black #0A0A0C. Airborne dust, bloom on highlights, subtle chromatic aberration,
fine film grain. Cinematic 16:9, shallow depth of field, no text, no watermark, no logo.
```

79 palabras. **No nombra ninguna pelicula ni ninguna serie**: describe la tecnica.
Nombrar una obra concreta funciona a veces, pero te ata a material con derechos y varios
modelos lo rechazan. Describir la tecnica funciona siempre y es tuyo.
