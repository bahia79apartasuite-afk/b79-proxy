# Plano 18 — macro escapes

**Video** `on_the_road` · **In** 27.17 s · **Out** 28.03 s · **Duracion** 0.87 s (26 frames)  
**Tipo** macro · **Camara** fija trasera · **Sujeto** PROP escapes  
**Frame de referencia del original:** `analysis/on_the_road/frames/t_27.51.png`

> **Por que existe este plano:** Un color frio en medio de 15 s de naranja. Es el acento que despierta el ojo.

---

## 0. Antes de lanzar este plano

Nada de esto es opcional. Un plano lanzado sin sus dependencias se regenera entero.

- [ ] **INSERTOS COCHE** aprobado — prop, en `props/insertos_coche/sheet.md`
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

HERO PROP — IGNITION KEY: a worn brass key on a plain split ring, no fob, no tag,
inserted into a chromed ignition barrel set into a matte black dash panel.

Close-up from directly behind and low, two chromed exhaust tips heat-blued at the mouth under a matte black rear valance, the yellow rear plate far out of focus above. Everything else in shadow.
```

**Que lleva y en que orden:** bloque de estilo → bloque de INSERTOS COCHE → encuadre y accion congelada. El orden importa: los modelos pesan mas el principio del prompt, y el estilo es lo que no puede fallar.

**Si usas Elements de Higgsfield:** en vez de pegar los bloques enteros, escribe `<<<id_de_insertos_coche>>>` dentro del prompt y deja solo el bloque de estilo y el encuadre. Los ids estan en `props/insertos_coche/element.txt`.

---

## 2. Prompt de video (Seedance 2.0)

```
SPECS: 16:9, 4s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Character/location sheets attached as image_references: INSERTOS COCHE.
ACTION: A short blue flame flares out of the right tip, holds for a moment, and dies back. Heat haze distorts the air behind the tips.
CAMERA: static shot, locked off, macro lens.
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. Face and identity unchanged from the reference. Palette, brushwork and lighting unchanged from the start frame. No text, no watermark, no logo, no subtitles.
SFX: exhaust overrun crackle, a sharp bang.
```

**Parametros:**

| Parametro | Valor | Por que |
|---|---|---|
| `duration` | 4 | El plano dura 0.87 s, pero Seedance no genera clips de menos de 4 s. Se generan 4 s y en el montaje se recortan 0.87 s del centro, que es donde el movimiento ya esta asentado. |
| `resolution` | `720p` | Es la resolucion nativa. Sube a 1080p solo en el pase final. |
| `mode` | `std` | `fast` solo llega a 720p y pierde detalle en la pincelada. |
| `generate_audio` | `false` | El audio se monta aparte. El nativo no encaja con la musica. |
| `genre` | `action` | Sesga hacia contraste y movimiento, que es lo que pide este estilo. |

> **Duracion:** **El plano dura 0.87 s, pero Seedance no genera clips de menos de 4 s.** Se generan 4 s y en el montaje se recortan 0.87 s del centro, que es donde el movimiento ya esta asentado. Los primeros frames de un clip generado casi siempre arrancan con un titubeo.

> **`GUARDRAIL` no es decoracion.** `single continuous shot, no cuts` es lo que evita que el modelo invente un corte a mitad del clip, que es el fallo mas comun al animar una accion con dos partes. Y `face and identity unchanged` es lo unico que sostiene la cara a lo largo del video.

---

## 3. Que revisar antes de aprobar

### El start frame

- [ ] ¿La paleta cae dentro de la del acto? Comparala con los hex de `STYLE.md`, no de memoria.
- [ ] ¿La luz viene del mismo lado que en el plano anterior y el siguiente?
- [ ] ¿Hay texto legible que no hayas pedido? Logos, matriculas, carteles.
- [ ] ¿El encuadre deja aire para el movimiento que vas a pedir en el video?

- [ ] ¿Se cuela media cara en el borde del cuadro? Es el fallo tipico del macro.
- [ ] ¿El desenfoque de fondo se lee como camara y no como fondo pintado?

### El video

- [ ] ¿Hay algun corte dentro del clip? Si lo hay, el prompt describia dos acciones. Reescribe la linea `ACTION` como **una sola cosa que pasa**.
- [ ] ¿La cara se mantiene de principio a fin del clip, o deriva en el ultimo segundo?
- [ ] ¿El movimiento de camara es el que pediste, o el modelo ha anadido un zoom?
- [ ] ¿Hay al menos 0.87 s utiles seguidos, sin el titubeo del arranque?
- [ ] ¿La pincelada se mantiene, o el clip ha derivado hacia fotorrealismo? Es la deriva mas frecuente y no se arregla en el montaje.

---

**Anterior:** plano 17 · **Siguiente:** plano 19  
**Shotlist:** `analysis/on_the_road/shotlist.md`
