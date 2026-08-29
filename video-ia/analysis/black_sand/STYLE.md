# STYLE — `black_sand`

Todos los hex salen de `tools/paleta.py` sobre `analysis/black_sand/frames/`.
Se regeneran con `python3 tools/paleta.py`.

## 1. Paleta

### Global

| Rol | Hex | Donde aparece |
|---|---|---|
| Negro puro | `#000001` | negros de puntuacion, sombras, fondo de titulos |
| Marron tierra | `#5A2B19` | piel en sombra, ladrillo, madera |
| Verde oliva | `#627B4F` | **la pared del callejon: el color del primer acto** |
| Verde musgo | `#475D35` | sombra del callejon |
| Rojo senal | `#E03D26` | neon, luz roja, sangre grafica |
| Rojo profundo | `#B02512` | titulos, panel de comic |
| Blanco papel | `#F1EAE8` | onomatopeyas, fondo de vineta |
| Azul petroleo | `#295C70` | noche urbana, el unico frio |

### Acentos (medidos en los planos donde el color llena el cuadro)

| Hex | Sat | Que es |
|---|---|---|
| `#F20D0A` | 92 | **Rojo puro de vineta.** Solo aparece en los planos de comic. |
| `#EA0E0B` | 91 | Variante del rojo de vineta |
| `#74DFEF` | 79 | **Cian de la franja del panel KRACK!!** Aparece 18 frames en todo el video |
| `#EE432C` | 85 | Rojo de neon, ya mezclado con la escena |
| `#8FA24A` | — | Verde acido de la pared del callejon |

### Por acto

| Acto | Duracion | Planos | s/plano | Base | Acento |
|---|---|---|---|---|---|
| 1. Persecucion en el callejon | 9.5 s | 12 | 0.79 | `#010002` `#3A7C91` `#4A2712` `#E30F08` `#335633` `#667A4A` | `#F40F07` `#B13018` `#573218` `#4495CA` |
| 2. El trato | 16.0 s | 11 | 1.46 | `#623A26` `#6C8545` `#438298` `#1A0F06` `#375031` `#EA1611` | `#EA1611` `#562615` `#4798CD` `#765127` |
| 3. La calle y el poder | 22.6 s | 13 | 1.74 | `#000001` `#A02811` `#74391B` `#215E91` `#141C19` `#DF3A1C` | `#DF3A1C` `#733418` `#216098` `#AC602C` |
| 4. Pelea nocturna | 19.4 s | 11 | 1.76 | `#000001` `#3F6057` `#421E14` `#7A3E20` `#293A3C` `#D43C29` | `#F03D2B` `#99221B` `#3D1911` `#653C1F` |
| 5. Titulos | 8.0 s | 6 | 1.34 | `#000001` (26 % del cuadro) `#545F7B` `#AA2014` `#F4EFEE` | `#AA2014` `#5D1B18` `#953C37` |

**Lo que hay que leer:** el video cambia de paleta **entera** tres veces, y el corte de color
hace de corte de acto. Acto 1–2 son verde oliva y acido. Acto 3–4 son naranja y azul de noche.
Acto 5 es negro y rojo. Un espectador sabe que ha cambiado la escena antes de entender por que.

El rojo es la constante: esta en los cinco actos, y solo el rojo. Todo lo demas rota.

## 2. Textura de pincel

Mas suelta que en `on_the_road`. El fondo se resuelve en **manchas grandes sin dibujo**: la
pared del callejon del plano 1 son cuatro tonos de verde puestos con espatula, sin un solo
detalle arquitectonico. La cara, en cambio, esta modelada con volumen casi escultorico —
pomulos, ceja, labio superior — y con especular duro.

Hay salpicadura y goteo deliberados sobre la imagen (plano 27, plano 39), que no representan
nada del mundo: son pintura encima. Ese recurso es el que hace que el conjunto se lea como
ilustracion y no como render.

Los planos de arena usan **grano seco y polvo en particulas** con bordes duros, no humo suave.

## 3. Grosor de linea

Contorno de tinta rasgado, mucho mas presente que en `on_the_road`:

- Silueta del personaje contra el fondo: linea negra de 3 a 5 px a 720 p, irregular, con el
  trazo roto (como pincel seco).
- Rasgos faciales: linea gruesa en ceja y parpado; **la ceja es casi un bloque negro**.
- Vinetas de impacto: la linea es el dibujo entero — no hay color, solo negro sobre blanco
  o negro sobre rojo, con rayas radiales que salen del centro.

## 4. Luz

Una sola fuente, siempre dura, y **de color**. No hay luz blanca en todo el video.

- Acto 1–2: luz de dia rebotada en pared verde. La piel coge verde en las zonas medias, y el
  unico rojo es la puerta EXIT y su reflejo en el charco.
- Acto 3–4: rojo de neon en la cara, azul de ciudad en el fondo. Complementarios puros,
  con el sujeto en rojo y el fondo en azul. Sin transicion entre uno y otro.
- Acto 5: contraluz sobre negro.

Las siluetas estan casi siempre recortadas con **borde de luz de color** (rim light rojo).
Es lo que separa a los personajes del fondo cuando la paleta es tan corta.

## 5. Tipografia de las onomatopeyas

Es la firma del corto. Tres formatos distintos:

**a) `KRAK!` (planos 28–31, 11 frames en total).** Letras dibujadas a mano con pincel seco,
palo seco muy condensado, con los remates rotos y las astas ligeramente inclinadas hacia
adelante. Blanco `#F1EAE8` sobre negro `#000000`, y en dos de los cuatro frames invertido:
negro sobre crema con textura de papel. **Cada frame es un dibujo distinto de la misma
palabra**, no la misma imagen desplazada. Eso es lo que produce la vibracion.

**b) `KRACK!!` (planos 42–44, 18 frames).** Panel de comic completo: la cara del personaje
deformada en estilo mas caricaturesco, una franja diagonal cian `#74DFEF` cruzando el cuadro,
y el texto en rojo `#B02512` con contorno blanco grueso y sombra dura desplazada. Aqui el
texto **no** flota sobre la imagen: esta dentro del mismo dibujo.

**c) Titulo `BLACK SAND` (plano 49).** Letras de pincel muy grueso, casi caligrafia, en negro
con relleno rojo que asoma por detras, encajadas a la fuerza en el ancho del cuadro y
superpuestas entre si. Se lee mal a proposito.

Regla comun a las tres: **la palabra nunca es una fuente, siempre es un dibujo**, y siempre
esta desalineada respecto al centro. Si la generas con una tipografia de sistema centrada
en el cuadro, el efecto se pierde entero.

## 6. Ritmo

| Metrica | Valor |
|---|---|
| Duracion | 75.58 s |
| Planos | 53 |
| Plano medio | 1.43 s |
| Cortes por segundo | 0.69 |
| Plano mas corto | 1 frame (0.03 s) |
| Plano mas largo | 157 frames (5.23 s) |

La media miente. El video **no** tiene un ritmo: alterna dos regimenes.

- **Regimen sostenido:** planos de 2 a 5 s (16, 26, 38, 39, 47). Aqui pasa la historia.
- **Regimen de rafaga:** grupos de 4 a 6 planos de 1 a 3 frames cada uno. Hay tres rafagas
  (segundos 9.3–9.6, 22.5–22.8, 60.9–61.6) y cada una dura menos de 0.4 s en total.

Ocho planos de **un solo frame**. Un frame a 30 fps son 33 ms: no se ve, se siente.

Ademas hay **cinco negros de puntuacion** (planos 5, 33, 35, 37, 52) de entre 1 y 24 frames.
Los cortos golpean; los de 9 a 24 frames separan secuencias y hacen de elipsis temporal.
`on_the_road` no tiene ni uno.

## 7. Patron de secuencia

Reparto: **impacto 15 planos · busto 11 · amplio 10 · titulo 9 · macro 4**.

Estructura de golpe, que se repite tres veces identica:

```
busto de anticipacion  →  [impacto ×4-6 de 1-3 frames]  →  amplio de consecuencia  →  respiro largo
```

- Golpe 1: plano 9 (anticipacion) → 10-13 (vinetas) → 14 (macro de la bolsa, 2.6 s de calma).
- Golpe 2: plano 18 (barrido) → 19-22 (vinetas) → 23 (el cuerpo contra la pared).
- Golpe 3: plano 41 (el puno entra) → 42-45 (panel KRACK!!) → 46-47 (el grito, 4.4 s).

Y una rima de encuadre: el plano **39 repite exactamente el encuadre del plano 16** — dos
perfiles enfrentados, mismo tamano, misma distancia. Cambian los personajes y la luz.
Es la frase visual que cuenta el ascenso del protagonista sin una linea de dialogo.

## 8. Bloque de estilo

Se pega al principio de cualquier prompt de imagen. En ingles a proposito.

```
Painted 2D animation still, street graphic-novel finish: loose visible brushwork,
ragged ink contours, large flat colour fields, detail sacrificed for silhouette.
Hard single-source coloured light — acid green daylight bounced off alley walls, or
red neon against cyan night. Limited palette: signal red #F20D0A, olive green #627B4F,
acid yellow-green #8FA24A, deep teal #295C70, warm brown #5A2B19, paper white #F1EAE8,
pure black #000000. Heavy grain, dry-brush splatter, halation on neon. Cinematic 16:9,
high contrast, no text, no watermark, no logo.
```

76 palabras. Para los planos de vineta se cambia la segunda mitad por:

```
...Comic impact panel: pure black ink on paper white, radial speed lines exploding from
centre, hand-brushed lettering, no gradients, no rendering, flat two-colour graphic,
signal red #F20D0A fill. 16:9.
```
