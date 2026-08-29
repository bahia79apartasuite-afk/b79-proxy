# EL ARENERO — hoja de personaje

**Video:** `black_sand` (segundo ejemplo) · **Rol:** protagonista
**Aparece en los planos:** 8, 15, 16, 17, 25, 27, 34, 36, 39, 40, 46, 47 (+ manos en 32)

> Arquetipo reconstruido, rasgos identificativos cambiados. Ver `characters/README.md`.

---

## 1. Bloque de identidad inmutable

```
CHARACTER — THE SAND HANDLER: androgynous young adult, early twenties, wiry build,
mid-brown skin with warm undertone. Narrow face, very high cheekbones, thick straight
black eyebrows, heavy-lidded amber eyes, small straight nose, wide mouth held flat.
Head shaved at the sides, the top gathered into a short black topknot, two loose
strands falling across the right temple. Small steel ball through the left eyebrow.
Three thin gold hoops in the right ear. Faded teal #2E5F63 sleeveless ribbed tank,
sand-brown #B49468 cargo trousers, tan leather work boots. Two plain gold bands on
the right hand.
NEVER: facial tattoos, chains, sunglasses, visible text on clothing, wide smile,
raised eyebrows.
```

**105 palabras.** El personaje se define por **quietud**: en todo el video no cambia de
expresion. Por eso `mouth held flat` y `NEVER: wide smile, raised eyebrows` van en el bloque,
no en el prompt de cada plano — es identidad, no accion.

## 2. Prompts de la hoja de referencia

Mismo esquema de seis planchas: frontal, 3/4, perfil, cuerpo entero, dos expresiones.
Todas con el bloque de estilo de `analysis/black_sand/STYLE.md` seccion 8, fondo neutro
`#6B6B6B` y luz plana. **Fondo neutro aunque el video sea verde acido**: si la referencia
lleva la luz de la escena, el Element arrastra ese color a todos los planos.

### 2.1 Busto frontal
```
[ESTILO]
[IDENTIDAD]
Front-facing bust portrait, head and shoulders, eyes level with the lens, flat neutral
expression, looking straight into camera. Even soft key from front-left, flat mid-grey
#6B6B6B seamless background, no props. Character reference sheet plate. 4:3.
```

### 2.2 Tres cuartos
```
[ESTILO]
[IDENTIDAD]
Three-quarter bust portrait, head turned 45 degrees to camera-left, eyes to camera,
flat neutral expression. The shaved side of the head and the topknot both readable.
Same lighting, same flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

### 2.3 Perfil
```
[ESTILO]
[IDENTIDAD]
Full profile bust portrait, head at exactly 90 degrees to camera-left. The eyebrow
piercing and the three ear hoops clearly visible on the camera side. Same lighting,
same flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

> El perfil es la plancha clave de este personaje: sale de perfil en los planos 16, 17, 27 y 39,
> que son los cuatro mas largos donde aparece. Si el perfil no queda bien, no sigas.
> Ojo con el lado: el piercing va en la ceja **izquierda** y los aros en la oreja **derecha**.
> En un perfil a camara-izquierda solo se ve uno de los dos. Genera **los dos perfiles** si
> el guion los pide.

### 2.4 Cuerpo entero
```
[ESTILO]
[IDENTIDAD]
Full body standing, front view, arms loose at the sides, weight on the left leg, boots
fully visible. Same flat mid-grey #6B6B6B background, same even lighting, full figure
inside frame with headroom. Character reference sheet plate. 3:4.
```

### 2.5 Expresion A — indiferencia
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, completely neutral, eyes slightly lowered, mouth flat,
no tension anywhere in the face. Same lighting, same flat mid-grey #6B6B6B background.
Character reference sheet plate. 4:3.
```

### 2.6 Expresion B — el momento antes del golpe
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, chin dropped a few degrees, eyes raised to camera from
under the brow, jaw tight, mouth still closed. Same lighting, same flat mid-grey
#6B6B6B background. Character reference sheet plate. 4:3.
```

## 3. Element

Igual que en `el_conductor`: sube las planchas, `show_reference_elements` con
`action: "create"` y `name: "el-arenero"`, guarda el id en `element.txt`.

**Este personaje comparte plano con otro en los planos 16, 17, 39, 46 y 47.** Ahi van
**dos Elements en el mismo prompt**:

```
<<<ID_ARENERO>>> in profile on the left, <<<ID_JEFE>>> shouting on the right, ...
```

Esto solo lo hace Elements. Soul no puede: entrena un sujeto y genera solo salidas
individuales. Es la razon principal para elegir Elements en este proyecto.

## 4. Consistencia plano a plano

| Plano | Encuadre | Element | Riesgo |
|---|---|---|---|
| 08 | busto | si | bajo |
| 15, 25, 40 | amplio de botas | **no**, o solo como referencia de ropa | la cara no sale; adjuntarla la invita a aparecer |
| 16, 17 | dos perfiles | si, junto con el otro personaje | alto: dos caras en un cuadro derivan mas |
| 27 | busto en accion | si | medio: el smear de arena tapa parte de la cara |
| 34, 36 | amplio nocturno | solo silueta | la cara no se lee a esa escala |
| 39 | dos perfiles | si, dos Elements | alto |
| 46, 47 | busto compartido | si, dos Elements | alto |
| 32 | macro de manos | **no** | los anillos si estan en el bloque de identidad; la cara no hace falta |
