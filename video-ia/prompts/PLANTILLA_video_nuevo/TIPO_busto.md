# Plano [##] — [NOMBRE DEL PLANO]

**Video** `[MI_VIDEO]` · **In** [##.##] s · **Out** [##.##] s · **Duracion** [#.##] s ([##] frames)
**Tipo** busto · **Camara** [de BANCO_CAMARA.md] · **Sujeto** [quien o que]

> **Por que existe este plano:** [una frase. Si no sabes contestar, el plano sobra.]

---

## 0. Antes de lanzar este plano

- [ ] **[PERSONAJE]** aprobado — `characters/[tuyo]/sheet.md`
- [ ] **[UBICACION]** aprobada — `locations/[tuya]/sheet.md`
- [ ] **[PROP]** aprobado, si lo hay — `props/[tuyo]/sheet.md`
- [ ] Bloque de estilo `[ESTILO]` a mano
- [ ] Start frame de este plano generado y **aprobado**

> Nunca se anima sin start frame aprobado. Nunca se hace un start frame sin la hoja de
> personaje y la ubicacion aprobadas.

---

## 1. Prompt de start frame (imagen)

Modelo: `nano_banana_pro` a 2k, 16:9.

```
[ESTILO]

[PERSONAJE]

[UBICACION]

[PROP]

[ENCUADRE] Bust portrait of [PERSONAJE] [front view | three-quarter to camera-left |
in profile], [que hace la cara: "eyes to camera", "looking off camera-right"],
[expresion descrita por musculos, no por emocion]. [Que hay detras y como de
desenfocado]. [Luz: de donde viene y de que color].
```

Orden: **estilo → identidad → encuadre**. Los modelos pesan mas el principio del prompt.

Con Elements: sustituye los bloques por `<<<element_id>>>` y deja solo el estilo y el encuadre.

---

## 2. Prompt de video (Seedance 2.0)

```
SPECS: 16:9, [4-15]s, 720p, painted 2D animation, one continuous take.
REFERENCES: start frame attached as start_image. Sheets attached as image_references:
[PERSONAJE], [UBICACION].
ACTION: [ACCION] — una sola cosa que pasa.
CAMERA: [termino de BANCO_CAMARA.md].
GUARDRAIL: single continuous shot, no cuts, no scene changes, no transitions. Face and
identity unchanged from the reference. Palette, brushwork and lighting unchanged from
the start frame. No text, no watermark, no logo, no subtitles.
SFX: [dos o tres sonidos concretos].
```

**Parametros:** `duration` = la duracion del plano redondeada hacia arriba, **minimo 4**
(Seedance no baja de ahi; generas de mas y cortas en el montaje) · `resolution` `720p` ·
`mode` `std` · `generate_audio` `false` · `genre` `action`.

---

## 3. Que revisar antes de aprobar

**Start frame:** paleta dentro de la del acto · luz del mismo lado que el plano anterior ·
sin texto legible que no hayas pedido · aire suficiente para el movimiento que vas a pedir.

**Video:** ningun corte dentro del clip · la cara aguanta hasta el final · la camara hace lo que
pediste y nada mas · hay suficientes segundos utiles seguidos · la pincelada no ha derivado a
fotorrealismo.

**Especifico del busto:**

- [ ] ¿Es **la misma cara** que en la hoja de personaje? Ponlas lado a lado y tapa la ropa.
- [ ] ¿Las marcas distintivas estan en el mismo lado que en la hoja?
- [ ] ¿El busto es lo bastante cerrado? Por debajo de plano medio la cara empieza a derivar.
- [ ] Si hay dos personajes, ¿los dos Elements estan en el prompt?
