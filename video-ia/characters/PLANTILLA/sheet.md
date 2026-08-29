# [NOMBRE_PERSONAJE] — hoja de personaje

**Video:** `[NOMBRE_VIDEO]` · **Rol:** [protagonista | antagonista | secundario]
**Aparece en los planos:** [lista, se rellena desde la shotlist]

Copia esta carpeta entera:
`cp -r characters/PLANTILLA characters/mi_personaje`

---

## 1. Bloque de identidad inmutable

Rellena los corchetes. **En ingles**, aunque pienses en espanol: los modelos de imagen
responden mejor y las palabras de color y encuadre son mas precisas.
Objetivo: **70 a 110 palabras.** Cuenta las tuyas antes de seguir.

```
CHARACTER — [NOMBRE EN MAYUSCULAS]: [edad] [genero/androgino], [complexion],
[tono de piel con matiz: "deep warm brown skin", "pale skin with olive undertone"].
[Forma de la cara], [cejas], [ojos: color y forma de parpado], [nariz], [boca en reposo].
[Vello facial o su ausencia, con longitud exacta].
[Pelo: corte exacto, largo, como esta recogido. No "pelo corto"].
[Marca distintiva 1: que es y EN QUE LADO].
[Marca distintiva 2, si hace falta. Maximo dos].
[Prenda superior: corte, tejido, color con hex].
[Prenda inferior: corte, color con hex]. [Calzado].
[Prop que lleva siempre encima].
NEVER: [3 a 6 cosas que el modelo anadiria solo y que no quieres: gafas de sol,
cadenas, tatuajes, texto en la ropa, sonrisa, ...].
```

**Las tres reglas del bloque:**

1. **Di el lado.** "scar on the cheek" se voltea entre planos. "scar on the left cheek" no.
2. **Maximo dos marcas distintivas.** El modelo retiene las primeras y se inventa las ultimas.
3. **La lista `NEVER` ahorra mas reintentos que cualquier adjetivo.** Escribela despues de
   generar la primera tanda: lo que el modelo te haya colado sin pedirlo, va en la lista.

## 2. Prompts de la hoja de referencia

Seis planchas. Mismo vestuario, mismo fondo neutro `#6B6B6B`, misma luz plana en las seis.
`[ESTILO]` es el bloque de estilo de tu `STYLE.md`. `[IDENTIDAD]` es el bloque de arriba.

Modelo: `nano_banana_pro` a 2k. Alternativas: `seedream_v5_pro`, `gpt_image_2` si vas a editar
despues.

### 2.1 Busto frontal
```
[ESTILO]
[IDENTIDAD]
Front-facing bust portrait, head and shoulders, eyes level with the lens, [EXPRESION
NEUTRA DEL PERSONAJE], looking straight into camera. Even soft key light from
front-left, flat mid-grey #6B6B6B seamless background, no props, no scenery.
Character reference sheet plate. 4:3.
```

### 2.2 Tres cuartos
```
[ESTILO]
[IDENTIDAD]
Three-quarter bust portrait, head turned 45 degrees to camera-[left|right], eyes to
camera, [EXPRESION NEUTRA]. Same lighting and same flat mid-grey #6B6B6B background
as the front plate. Character reference sheet plate. 4:3.
```

### 2.3 Perfil
```
[ESTILO]
[IDENTIDAD]
Full profile bust portrait, head at exactly 90 degrees to camera-[left|right],
[EXPRESION NEUTRA], [LA MARCA DISTINTIVA] clearly readable on the camera side. Same
lighting and same flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

### 2.4 Cuerpo entero
```
[ESTILO]
[IDENTIDAD]
Full body standing, front view, arms relaxed at the sides, weight on the
[right|left] leg, feet visible. Same flat mid-grey #6B6B6B background, same even
lighting, full figure inside frame with headroom. Character reference sheet plate. 3:4.
```

### 2.5 Expresion A — [NOMBRA EL ESTADO: concentracion / miedo / rabia contenida]
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, [DESCRIBE LA EXPRESION POR MUSCULOS, NO POR EMOCION:
"brow lowered and jaw set", no "angry"]. Same lighting and same flat mid-grey #6B6B6B
background. Character reference sheet plate. 4:3.
```

### 2.6 Expresion B — [NOMBRA EL ESTADO]
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, [DESCRIBE LA EXPRESION POR MUSCULOS]. Same lighting and
same flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

> **Describe la expresion por musculos, no por emocion.** "Angry" le da al modelo permiso para
> cambiar la cara entera. "Brow lowered, jaw set, mouth closed" mueve tres cosas y deja el resto
> igual, que es exactamente lo que necesitas.

## 3. Guardar como Element

1. Aprueba las 6 planchas con la lista de `characters/README.md`. Guardalas en
   `characters/[personaje]/ref/` como `01_frontal.png` … `06_expresion_b.png`.
2. `media_upload` → PUT de los bytes → `media_confirm`.
3. `show_reference_elements` con `action: "create"`, `name: "[nombre-corto]"` (max 32
   caracteres), `category: "auto"` y las medias. Sube al menos frontal, 3/4 y perfil.
4. Guarda el id en `characters/[personaje]/element.txt`.
5. En los prompts: `<<<element_id>>>`.

## 4. Consistencia plano a plano

Rellena una fila por cada plano donde salga, sacada de la shotlist:

| Plano | Encuadre | ¿Adjunto el Element? | Riesgo |
|---|---|---|---|
| [##] | [busto/amplio/macro] | [si / no / solo silueta] | [bajo/medio/alto] |

**Cuando poner `no`:** en insertos macro donde el personaje no sale (manos, objetos, texturas).
Adjuntar la referencia de una cara a un plano sin cara hace que el modelo intente meterla.

**Cuando poner `solo silueta`:** en planos amplios y de cuerpo entero. Ahi la referencia aporta
ropa y proporcion, no cara, y conviene que el encuadre no muestre el rostro de cerca.
