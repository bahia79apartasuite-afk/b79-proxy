# Plano [##] — [NOMBRE DEL PLANO]

**Video** `[MI_VIDEO]` · **In** [##.##] s · **Out** [##.##] s · **Duracion** [#.##] s ([##] frames)
**Tipo** POV · **Camara** [de BANCO_CAMARA.md] · **Sujeto** [quien o que]

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

[ENCUADRE] POV from [de quien y desde donde: "the driver's seat looking through the
windscreen"], [lo que se ve, de cerca a lejos], [que cuerpo o objeto del propio personaje
entra en cuadro: manos, el borde del salpicadero, un arma], [luz].
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

**Especifico del POV:**

- [ ] ¿Hay algo del propio personaje en cuadro (manos, hombro, el borde de algo)? Sin eso no
      se lee como POV, se lee como un plano cualquiera.
- [ ] ¿El punto de vista esta a la altura correcta? Un POV a altura equivocada desorienta.
- [ ] **No adjuntes la referencia de la cara.** En un POV la cara no existe.
- [ ] Un POV cada 8-10 planos. Mas y se vuelve un videojuego; ninguno y el espectador nunca
      entra en la escena.
