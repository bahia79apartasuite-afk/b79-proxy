# Banco de camara

Vocabulario de movimiento para los prompts de video. Se escribe **en ingles y en una sola
linea**, en el campo `CAMERA:` del prompt.

Higgsfield mantiene un Prompt Bank de camara en su Academy (`higgsfield.ai/academy`). Este
banco cubre lo mismo con los terminos que los modelos de video entienden mejor, y esta ordenado
por lo que hace cada movimiento **al espectador**, que es lo que hay que decidir primero.

## La regla que hay que entender antes de usar el banco

**Un prompt de video describe UNA toma continua.** Nunca describe cortes.

Si escribes "the car drives, then we cut to the wheel", el modelo intenta hacer las dos cosas
en el mismo clip y te devuelve una transformacion rara en medio. Los cortes se hacen en el
montaje, con `scripts/montage.sh`, no dentro del prompt.

Un movimiento por plano. Dos como mucho, y solo si son compatibles (`slow dolly in` +
`slight handheld drift` si). Tres, nunca.

## Camara quieta

| Termino | Que hace | Cuando |
|---|---|---|
| `static shot, locked off` | nada se mueve | insertos macro, vinetas, titulos |
| `static shot with a slight handheld drift` | respira | bustos de dialogo; da vida sin distraer |
| `slow push in` | acerca 10-15 % en todo el plano | revelacion de personaje; el plano 3 de `on_the_road` |
| `slow pull out` | aleja | final de secuencia, abandonar a alguien |

## Camara que avanza

| Termino | Que hace | Cuando |
|---|---|---|
| `dolly in` | avanza sobre el eje | entrar en una emocion |
| `dolly out` | retrocede | soltar, cerrar |
| `crash zoom in` | zoom brutal en menos de medio segundo | impacto, comedia, sorpresa; **gastalo una vez** |
| `snap zoom out` | lo contrario | revelar contexto de golpe |
| `push through` | la camara atraviesa un objeto o un hueco | transicion dentro del plano |

## Camara que acompana

| Termino | Que hace | Cuando |
|---|---|---|
| `tracking shot alongside the subject` | va a la par, en paralelo | velocidad; planos 16 y 23 |
| `tracking shot from behind` | sigue por detras | persecucion, avance |
| `leading tracking shot` | va delante, de espaldas al recorrido | acompanar a alguien que camina |
| `low tracking shot at ground level` | pegada al suelo | ruedas, pies, botas |
| `whip pan to the [left|right]` | barrido rapido que borra la imagen | **hace de corte**; planos 3 y 18 de `black_sand` |

## Camara que rodea

| Termino | Que hace | Cuando |
|---|---|---|
| `slow orbit around the subject` | gira alrededor | presentar un objeto heroe |
| `arc shot from left to right` | media orbita | mas contenido que la orbita completa |
| `pan left` / `pan right` | gira sobre su eje | seguir una accion sin moverse |
| `tilt up` / `tilt down` | gira en vertical | revelar altura, o pasar del suelo a la cara |

## Camara por posicion

| Termino | Que hace | Cuando |
|---|---|---|
| `low angle looking up` | el sujeto domina | poder; el plano 15 de `black_sand` |
| `high angle looking down` | el sujeto es vulnerable | derrota; el plano 9 de `black_sand` |
| `top-down aerial view` | grafico, abstracto | cambio de eje que resetea la vista |
| `over-the-shoulder` | conversacion | dos personajes |
| `POV, camera as the character's eyes` | inmersion | anclar; el plano 21 de `on_the_road` |
| `macro lens, extreme close-up` | textura | los insertos, que son un tercio del video |

## Efectos de tiempo

| Termino | Que hace | Cuando |
|---|---|---|
| `slow motion throughout` | todo lento | contemplacion |
| `speed ramp: real time then abrupt slow motion on impact` | acelera y frena | el golpe |
| `frozen moment, everything static except [X]` | congelado parcial | el momento antes del golpe |

> **Los speed ramps se hacen mejor en el montaje que en el prompt.** Seedance los interpreta,
> pero de forma poco predecible. Genera a velocidad real y haz la rampa en `montage.sh`, donde
> controlas el frame exacto. Ver la Fase 4.

## Errores del banco

- **No pidas un movimiento que la escena no permite.** Una orbita alrededor de alguien apoyado
  en una pared atraviesa la pared.
- **No pidas `handheld` en un macro.** Un macro tembloroso se lee como un fallo.
- **`crash zoom` una vez por video.** Dos veces y deja de significar nada.
- **Si el plano dura menos de un segundo, la camara casi no se mueve.** En 15 frames no da
  tiempo a leer una orbita. Usa `static` o `slight drift` y ahorrate el reintento.
