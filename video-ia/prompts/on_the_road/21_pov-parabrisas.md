# Plano 21 — pov parabrisas

**Video** `on_the_road` · **In** 30.30 s · **Out** 31.47 s · **Duracion** 1.17 s (35 frames)  
**Tipo** POV · **Camara** fija dentro del coche, mirando al parabrisas · **Sujeto** UBICACION carretera  
**Frame de referencia del original:** `analysis/on_the_road/frames/t_30.77.png`

> **Por que existe este plano:** Pone al espectador en el asiento. Un POV cada tanto ancla todo lo demas.

---

## 0. Antes de lanzar este plano

Nada de esto es opcional. Un plano lanzado sin sus dependencias se regenera entero.

- [ ] **CARRETERA MESETAS** aprobado — ubicacion, en `locations/carretera_mesetas/sheet.md`
- [ ] Bloque de estilo de `analysis/on_the_road/STYLE.md` a mano
- [ ] Start frame de este plano generado y **aprobado** (paso 1 de abajo)

> Regla dura del sistema: **nunca se anima sin start frame aprobado, y nunca se hace un start frame sin la hoja de personaje y la ubicacion aprobadas.**

---

## 1. Prompt de start frame (imagen)

Modelo: `nano_banana_pro` a 2k, 16:9. Alternativas: `seedream_v5_pro`, `flux_2` (pro).

```
Painted 2D animation still, graphic-novel finish: visible oil-brush strokes, thick
confident contour lines only on facial features, flat colour blocking chosen over
photographic detail. Golden-hour desert light — hard warm key from a low sun, deep
unlit shadows, almost no ambient fill. Limited palette: cadmium yellow #F2BB34,
burnt sienna #B36D27, warm sand #E4CCA6, dust cream #D7C29E, deep navy #2C3550,
near-black #0A0A0C. Airborne dust, bloom on highlights, subtle chromatic aberration,
fine film grain. Cinematic 16:9, shallow depth of field, no text, no watermark, no logo.

LOCATION — MESA HIGHWAY: a two-lane blacktop running dead straight through high
desert, a single broken yellow centre line, no shoulder, the asphalt bleached to
grey-brown at the edges. Rust-red sandstone mesas #A65C27 standing on both sides at
middle distance, flat scrub and loose red gravel between road and rock. Wooden
telegraph poles at even intervals down the right side, wires sagging between them.
Low sun almost head-on, the air full of fine ochre dust, the horizon dissolving into
cream haze #E4CCA6.

POV from the driver's seat looking out through the windscreen: the two-lane blacktop running to a vanishing point between the mesas, a caravan and a pickup ahead in the distance, telegraph poles going past on the right, low sun almost head-on. The top of the dashboard cuts the bottom of frame.
```

**Que lleva y en que orden:** bloque de estilo → bloque de CARRETERA MESETAS → encuadre y accion congelada. El orden importa: los modelos pesan mas el principio del prompt, y el estilo es lo que no puede fallar.

**Si usas Elements de Higgsfield:** en vez de pegar los bloques enteros, escribe `<<<id_de_carretera_mesetas>>>` dentro del prompt y deja solo el bloque de estilo y el encuadre. Los ids estan en `locations/carretera_mesetas/element.txt`.

---

## 2. Prompt de video (Seedance 2.0)

```
SPECS: 16:9, 4s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Character/location sheets attached as image_references: CARRETERA MESETAS.
ACTION: The road pours in under the car, the poles going past on the right one after another, the vehicles ahead slowly getting closer.
CAMERA: POV, camera as the character's eyes, mounted in the car.
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. Face and identity unchanged from the reference. Palette, brushwork and lighting unchanged from the start frame. No text, no watermark, no logo, no subtitles.
SFX: wind, engine, tyre roar, a pole going past.
```

**Parametros:**

| Parametro | Valor | Por que |
|---|---|---|
| `duration` | 4 | El plano dura 1.17 s, pero Seedance no genera clips de menos de 4 s. Se generan 4 s y en el montaje se recortan 1.17 s del centro, que es donde el movimiento ya esta asentado. |
| `resolution` | `720p` | Es la resolucion nativa. Sube a 1080p solo en el pase final. |
| `mode` | `std` | `fast` solo llega a 720p y pierde detalle en la pincelada. |
| `generate_audio` | `false` | El audio se monta aparte. El nativo no encaja con la musica. |
| `genre` | `action` | Sesga hacia contraste y movimiento, que es lo que pide este estilo. |

> **Duracion:** **El plano dura 1.17 s, pero Seedance no genera clips de menos de 4 s.** Se generan 4 s y en el montaje se recortan 1.17 s del centro, que es donde el movimiento ya esta asentado. Los primeros frames de un clip generado casi siempre arrancan con un titubeo.

> **`GUARDRAIL` no es decoracion.** `single continuous shot, no cuts` es lo que evita que el modelo invente un corte a mitad del clip, que es el fallo mas comun al animar una accion con dos partes. Y `face and identity unchanged` es lo unico que sostiene la cara a lo largo del video.

---

## 3. Que revisar antes de aprobar

### El start frame

- [ ] ¿La paleta cae dentro de la del acto? Comparala con los hex de `STYLE.md`, no de memoria.
- [ ] ¿La luz viene del mismo lado que en el plano anterior y el siguiente?
- [ ] ¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.
- [ ] ¿El encuadre deja aire para el movimiento que vas a pedir en el video?

### El video

- [ ] ¿Hay algun corte dentro del clip? Si lo hay, el prompt describia dos acciones. Reescribe la linea `ACTION` como **una sola cosa que pasa**.
- [ ] ¿La cara se mantiene de principio a fin del clip, o deriva en el ultimo segundo?
- [ ] ¿El movimiento de camara es el que pediste, o el modelo ha anadido un zoom?
- [ ] ¿Hay al menos 1.17 s utiles seguidos, sin el titubeo del arranque?
- [ ] ¿La pincelada se mantiene, o el clip ha derivado hacia fotorrealismo? Es la deriva mas frecuente y no se arregla en el montaje.

---

**Anterior:** plano 20 · **Siguiente:** plano 22  
**Shotlist:** `analysis/on_the_road/shotlist.md`
