# Plano 06 — busto en el coche

**Video** `on_the_road` · **In** 10.80 s · **Out** 11.83 s · **Duracion** 1.03 s (31 frames)  
**Tipo** busto · **Camara** fija desde el asiento del copiloto · **Sujeto** PROTAGONISTA dentro del coche  
**Frame de referencia del original:** `analysis/on_the_road/frames/t_11.21.png`

> **Por que existe este plano:** Cambia el mundo: de fuera a dentro. Mismo rostro, nueva luz.

---

## 0. Antes de lanzar este plano

Nada de esto es opcional. Un plano lanzado sin sus dependencias se regenera entero.

- [ ] **EL CONDUCTOR** aprobado — hoja de personaje, en `characters/el_conductor/sheet.md`
- [ ] **COCHE AMARILLO** aprobado — prop, en `props/coche_amarillo/sheet.md`
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

CHARACTER — THE DRIVER: a Black man in his early thirties, lean build, deep warm
brown skin. Square jaw, heavy straight eyebrows, wide-set dark brown eyes with
tired lower lids, broad nose, full mouth held closed. Full black beard connected
to the moustache, trimmed short and even along the jawline. Hair hidden under a
deep navy #2C3550 six-panel cap, curved brim, worn straight, no logo and no
lettering. Single thick gold hoop earring in the left ear only. Oversized cream
#EFE7DA unlined blazer, sleeves pushed to the forearm, worn over bare chest.
Black leather watch on the left wrist.
NEVER: sunglasses, leather jacket, necklace, tattoos, visible text on clothing,
open mouth, smile.

HERO PROP — THE YELLOW CAR: a late-sixties American fastback coupe, long bonnet,
short deck, roofline falling in one straight line to the tail. Body in saturated
cadmium yellow #F2BB34 with two matte black stripes running the full length over
the centre. Wide riveted steel arch extensions over all four wheels. Deep-dish
polished alloy wheels with five spokes, low-profile tyres. Twin chromed exhaust
tips under a black rear valance. Yellow rear plate, no readable characters. Chrome
bumperettes, black grille with two round headlamps. Dusty, stone-chipped, used.
NEVER: manufacturer badges, brand names, spoilers, decals with readable text,
a clean showroom finish.

Bust of THE DRIVER in the driver's seat seen from the passenger side, the open side window and the desert with palms behind him, the door card and mirror framing the left of the shot. Warm bounced light from the windscreen.
```

**Que lleva y en que orden:** bloque de estilo → bloque de EL CONDUCTOR → bloque de COCHE AMARILLO → encuadre y accion congelada. El orden importa: los modelos pesan mas el principio del prompt, y el estilo es lo que no puede fallar.

**Si usas Elements de Higgsfield:** en vez de pegar los bloques enteros, escribe `<<<id_de_el_conductor>>>`, `<<<id_de_coche_amarillo>>>` dentro del prompt y deja solo el bloque de estilo y el encuadre. Los ids estan en `characters/el_conductor/element.txt`.

---

## 2. Prompt de video (Seedance 2.0)

```
SPECS: 16:9, 4s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Character/location sheets attached as image_references: EL CONDUCTOR, COCHE AMARILLO.
ACTION: He settles back into the seat, shoulders dropping once, and looks forward through the windscreen. His right hand comes up out of the bottom of frame.
CAMERA: static shot with a slight handheld drift.
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. Face and identity unchanged from the reference. Palette, brushwork and lighting unchanged from the start frame. No text, no watermark, no logo, no subtitles.
SFX: seat leather, door card creak, distant wind.
```

**Parametros:**

| Parametro | Valor | Por que |
|---|---|---|
| `duration` | 4 | El plano dura 1.03 s, pero Seedance no genera clips de menos de 4 s. Se generan 4 s y en el montaje se recortan 1.03 s del centro, que es donde el movimiento ya esta asentado. |
| `resolution` | `720p` | Es la resolucion nativa. Sube a 1080p solo en el pase final. |
| `mode` | `std` | `fast` solo llega a 720p y pierde detalle en la pincelada. |
| `generate_audio` | `false` | El audio se monta aparte. El nativo no encaja con la musica. |
| `genre` | `action` | Sesga hacia contraste y movimiento, que es lo que pide este estilo. |

> **Duracion:** **El plano dura 1.03 s, pero Seedance no genera clips de menos de 4 s.** Se generan 4 s y en el montaje se recortan 1.03 s del centro, que es donde el movimiento ya esta asentado. Los primeros frames de un clip generado casi siempre arrancan con un titubeo.

> **`GUARDRAIL` no es decoracion.** `single continuous shot, no cuts` es lo que evita que el modelo invente un corte a mitad del clip, que es el fallo mas comun al animar una accion con dos partes. Y `face and identity unchanged` es lo unico que sostiene la cara a lo largo del video.

---

## 3. Que revisar antes de aprobar

### El start frame

- [ ] ¿La paleta cae dentro de la del acto? Comparala con los hex de `STYLE.md`, no de memoria.
- [ ] ¿La luz viene del mismo lado que en el plano anterior y el siguiente?
- [ ] ¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.
- [ ] ¿El encuadre deja aire para el movimiento que vas a pedir en el video?

- [ ] ¿Es **la misma cara** que en la hoja de personaje? Ponlas lado a lado.
- [ ] ¿Las marcas distintivas estan en el mismo lado?

### El video

- [ ] ¿Hay algun corte dentro del clip? Si lo hay, el prompt describia dos acciones. Reescribe la linea `ACTION` como **una sola cosa que pasa**.
- [ ] ¿La cara se mantiene de principio a fin del clip, o deriva en el ultimo segundo?
- [ ] ¿El movimiento de camara es el que pediste, o el modelo ha anadido un zoom?
- [ ] ¿Hay al menos 1.03 s utiles seguidos, sin el titubeo del arranque?
- [ ] ¿La pincelada se mantiene, o el clip ha derivado hacia fotorrealismo? Es la deriva mas frecuente y no se arregla en el montaje.

---

**Anterior:** plano 05 · **Siguiente:** plano 07  
**Shotlist:** `analysis/on_the_road/shotlist.md`
