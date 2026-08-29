# Plano 13 — amplio donuts lejos

**Video** `on_the_road` · **In** 19.33 s · **Out** 23.63 s · **Duracion** 4.30 s (129 frames)  
**Tipo** amplio · **Camara** fija larga · **Sujeto** COCHE + UBICACION explanada  
**Frame de referencia del original:** `analysis/on_the_road/frames/t_21.05.png`

> **Por que existe este plano:** Cierra el acto dejando el coche lejos: el ojo descansa 4.3 s antes de la carretera.

---

## 0. Antes de lanzar este plano

Nada de esto es opcional. Un plano lanzado sin sus dependencias se regenera entero.

- [ ] **COCHE AMARILLO** aprobado — prop, en `props/coche_amarillo/sheet.md`
- [ ] **EXPLANADA ASFALTO** aprobado — ubicacion, en `locations/explanada_asfalto/sheet.md`
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

HERO PROP — THE YELLOW CAR: a late-sixties American fastback coupe, long bonnet,
short deck, roofline falling in one straight line to the tail. Body in saturated
cadmium yellow #F2BB34 with two matte black stripes running the full length over
the centre. Wide riveted steel arch extensions over all four wheels. Deep-dish
polished alloy wheels with five spokes, low-profile tyres. Twin chromed exhaust
tips under a black rear valance. Yellow rear plate, no readable characters. Chrome
bumperettes, black grille with two round headlamps. Dusty, stone-chipped, used.
NEVER: manufacturer badges, brand names, spoilers, decals with readable text,
a clean showroom finish.

LOCATION — ASPHALT LOT: a wide empty concrete lot behind a truck stop, the slab
divided by expansion joints into a grid, surface bleached grey-brown #7A6A5A and
scored with old black tyre marks. Four tall steel light poles, two upright and one
leaning. A low corrugated canopy along the far edge. Flat desert and distant mesas
beyond. Late afternoon sun low from camera-right, long shadows, dust hanging in the
air and catching the light.

Wide shot from the far corner of the lot at chest height, the yellow car small in the middle distance still circling inside a huge cloud of white smoke, light poles breaking the horizon, mesas beyond, dust hanging in the low sun.
```

**Que lleva y en que orden:** bloque de estilo → bloque de COCHE AMARILLO → bloque de EXPLANADA ASFALTO → encuadre y accion congelada. El orden importa: los modelos pesan mas el principio del prompt, y el estilo es lo que no puede fallar.

**Si usas Elements de Higgsfield:** en vez de pegar los bloques enteros, escribe `<<<id_de_coche_amarillo>>>`, `<<<id_de_explanada_asfalto>>>` dentro del prompt y deja solo el bloque de estilo y el encuadre. Los ids estan en `props/coche_amarillo/element.txt`.

---

## 2. Prompt de video (Seedance 2.0)

```
SPECS: 16:9, 5s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Character/location sheets attached as image_references: COCHE AMARILLO, EXPLANADA ASFALTO.
ACTION: The car keeps circling inside the smoke, appearing and disappearing. The cloud drifts slowly right across the frame. Nothing else moves.
CAMERA: static shot, locked off.
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. Face and identity unchanged from the reference. Palette, brushwork and lighting unchanged from the start frame. No text, no watermark, no logo, no subtitles.
SFX: engine distant and echoing off the canopy, wind.
```

**Parametros:**

| Parametro | Valor | Por que |
|---|---|---|
| `duration` | 5 | El plano dura 4.30 s. |
| `resolution` | `720p` | Es la resolucion nativa. Sube a 1080p solo en el pase final. |
| `mode` | `std` | `fast` solo llega a 720p y pierde detalle en la pincelada. |
| `generate_audio` | `false` | El audio se monta aparte. El nativo no encaja con la musica. |
| `genre` | `action` | Sesga hacia contraste y movimiento, que es lo que pide este estilo. |

> **Duracion:** El plano dura 4.30 s. Se generan 5 s y en el montaje se corta a 4.30 s, para tener margen por los dos lados.

> **`GUARDRAIL` no es decoracion.** `single continuous shot, no cuts` es lo que evita que el modelo invente un corte a mitad del clip, que es el fallo mas comun al animar una accion con dos partes. Y `face and identity unchanged` es lo unico que sostiene la cara a lo largo del video.

---

## 3. Que revisar antes de aprobar

### El start frame

- [ ] ¿La paleta cae dentro de la del acto? Comparala con los hex de `STYLE.md`, no de memoria.
- [ ] ¿La luz viene del mismo lado que en el plano anterior y el siguiente?
- [ ] ¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.
- [ ] ¿El encuadre deja aire para el movimiento que vas a pedir en el video?

- [ ] Si sale el personaje: ¿la **silueta** y la ropa coinciden? La cara a esta escala no se sostiene y no pasa nada.

### El video

- [ ] ¿Hay algun corte dentro del clip? Si lo hay, el prompt describia dos acciones. Reescribe la linea `ACTION` como **una sola cosa que pasa**.
- [ ] ¿La cara se mantiene de principio a fin del clip, o deriva en el ultimo segundo?
- [ ] ¿El movimiento de camara es el que pediste, o el modelo ha anadido un zoom?
- [ ] ¿Hay al menos 4.30 s utiles seguidos, sin el titubeo del arranque?
- [ ] ¿La pincelada se mantiene, o el clip ha derivado hacia fotorrealismo? Es la deriva mas frecuente y no se arregla en el montaje.

---

**Anterior:** plano 12 · **Siguiente:** plano 14  
**Shotlist:** `analysis/on_the_road/shotlist.md`
