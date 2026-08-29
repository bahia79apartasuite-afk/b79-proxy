# LA ARENA NEGRA — prop heroe

**Video:** `black_sand` · **Planos:** 14 (la bolsa), 22, 27 (el smear), 32 (las manos),
36 (el circulo), 41–47 (el puno)

Es el prop heroe de `black_sand` y funciona distinto al coche de `on_the_road`: **no es un
objeto solido sino un material**, y aparece en tres estados. Merece un bloque por estado.

## Estado 1 — la bolsa (plano 14)

```
PROP — SAND BAG: a small clear zip-lock bag half full of coarse beige sand, the
grains individually visible against the light, the plastic creased and dull, the
zip strip white.
```
```
[ESTILO CALLEJON] [PROP BOLSA]
Macro close-up, the bag held up between finger and thumb against flat overcast sky,
strongly backlit so the sand reads as a mass of separate grains, the alley walls
green and out of focus behind. Shallow depth of field. 16:9.
```
> A contraluz es lo que hace este plano. Un plano de una bolsa iluminada de frente es una
> bolsa; a contraluz es una textura. **La luz esta haciendo el trabajo del encuadre.**

## Estado 2 — la arena suelta (plano 32)

```
PROP — LOOSE BLACK SAND: a shallow mound of fine matte black sand, grains catching a
hard highlight on one side only, no reflection, no sheen, absorbing the light.
```
```
[ESTILO CALLE NOCTURNA] [PROP ARENA SUELTA]
Macro close-up from directly above, two hands with plain gold bands pressed into the
mound, fingers spread, the sand rising between them. Red neon from camera-right,
everything else falling to black. The face is NOT in frame. 16:9.
```

## Estado 3 — la arena en movimiento (planos 22, 27, 41–47)

Este es el dificil y es donde se decide el video.

```
PROP — SAND IN MOTION: fine black sand thrown into a hard-edged smear, the leading
edge breaking into separate flying grains and the trailing edge dissolving into a
solid black shape. Dry, no smoke, no dust cloud, no soft edges.
```

`no smoke, no dust cloud, no soft edges` es la mitad del prompt. **Todos los modelos de imagen
convierten la arena en movimiento en humo** si les dejas: el humo es lo que han visto mas veces.
Hay que prohibirlo explicitamente.

```
[ESTILO] [PROP ARENA EN MOVIMIENTO]
Close-up of a fist wrapped in a hard-edged mass of flying black sand, the smear
trailing back out of frame, individual grains scattering off the leading edge, red
neon rim light. 16:9.
```

## Element

`category: "prop"`, tres Elements distintos: `arena-bolsa`, `arena-suelta`, `arena-movimiento`.
**No los mezcles en uno.** Un Element con los tres estados devuelve un promedio de los tres, que
no es ninguno de ellos.
