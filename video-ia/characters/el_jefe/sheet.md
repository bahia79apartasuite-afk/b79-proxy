# EL JEFE — hoja de personaje

**Video:** `black_sand` · **Rol:** antagonista
**Aparece en los planos:** 39, 41, 42–45 (deformado en vineta), 46, 47

> Arquetipo reconstruido, rasgos cambiados. Ver `characters/README.md`.

---

## 1. Bloque de identidad inmutable

```
CHARACTER — THE BOSS: a heavy-set man in his late fifties, thick neck, broad
shoulders, deep brown skin. Shaved head, deep horizontal creases across the forehead,
low heavy brow, small close-set eyes with pale sclera, flat wide nose, thin lips over
a heavy jaw. Clean-shaven. A wide flat gold hoop in each ear. Black shearling collar
on a dark navy #1B2130 coat, collar always turned up around the neck.
NEVER: beard, hair, glasses, visible text on clothing, calm expression.
```

**82 palabras.** Mas corto que los otros dos porque **solo sale enfadado**: no hace falta
describir un rango de expresion que nunca se usa.

## 2. Prompts de la hoja de referencia

Las seis planchas de siempre, con el bloque de estilo de `black_sand`. Diferencia importante:
en las dos expresiones **no** se pide neutralidad, sino los dos estados que el video usa.

### 2.1 Busto frontal
```
[ESTILO]
[IDENTIDAD]
Front-facing bust portrait, head and shoulders, eyes level with the lens, closed
mouth, hard stare. Even soft key from front-left, flat mid-grey #6B6B6B seamless
background. Character reference sheet plate. 4:3.
```

### 2.2 Tres cuartos
```
[ESTILO]
[IDENTIDAD]
Three-quarter bust portrait, head turned 45 degrees to camera-right, eyes to camera,
hard stare. Same lighting, same flat mid-grey #6B6B6B background. Character reference
sheet plate. 4:3.
```

### 2.3 Perfil
```
[ESTILO]
[IDENTIDAD]
Full profile bust portrait, head at exactly 90 degrees to camera-right. Forehead
creases, brow and the flat gold ear hoop clearly readable in silhouette. Same lighting,
same flat mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

### 2.4 Cuerpo entero
```
[ESTILO]
[IDENTIDAD]
Full body standing, front view, hands at the sides, coat closed, collar up. Same flat
mid-grey #6B6B6B background, same even lighting, full figure with headroom.
Character reference sheet plate. 3:4.
```

### 2.5 Expresion A — el grito
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, mouth wide open mid-shout, teeth visible, eyes bulging,
forehead creases deepened, neck tendons showing. Same lighting, same flat mid-grey
#6B6B6B background. Character reference sheet plate. 4:3.
```

### 2.6 Expresion B — la amenaza contenida
```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, mouth closed hard, chin tucked, eyes fixed under the low
brow, absolutely still. Same lighting, same flat mid-grey #6B6B6B background.
Character reference sheet plate. 4:3.
```

## 3. La plancha de caricatura (opcional, pero es lo que hace el estilo)

Los planos 42–44 no usan al personaje realista sino una version **deformada de comic**.
Merece su propia plancha, generada aparte y guardada como **un segundo Element**:

```
[ESTILO DE VINETA]
[IDENTIDAD]
Comic caricature version of the same face: exaggerated proportions, jaw pushed
forward, eyes twice the size with tiny pupils, forehead creases drawn as three thick
ink lines, mouth stretched open. Flat two-colour graphic, black ink on paper white
#F1EAE8, hard-edged, no rendering, no gradients. 16:9.
```

Nombralo `el-jefe-vineta`. **Que sean dos Elements distintos es a proposito**: si mezclas la
version realista y la caricatura en el mismo Element, el modelo promedia las dos y te devuelve
una cara ligeramente deformada en todos los planos.

## 4. Consistencia plano a plano

| Plano | Encuadre | Element | Riesgo |
|---|---|---|---|
| 39 | perfil compartido con el arenero | `el-jefe` + `el-arenero` | alto |
| 41 | busto de perfil | `el-jefe` | bajo |
| 42–44 | panel de comic | `el-jefe-vineta` | medio: el texto de la onomatopeya se hace aparte, no lo pidas aqui |
| 45 | 1 frame realista | `el-jefe` | bajo |
| 46, 47 | busto compartido | `el-jefe` + `el-arenero` | alto |
