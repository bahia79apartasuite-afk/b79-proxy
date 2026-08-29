# EL CONDUCTOR — hoja de personaje

**Video:** `on_the_road` (ejemplo resuelto) · **Rol:** protagonista unico
**Aparece en los planos:** 3, 4, 5, 6, 14, 20 (+ manos en 7, 22)

> Arquetipo reconstruido a partir del analisis, con los rasgos identificativos cambiados.
> Ver `characters/README.md`.

---

## 1. Bloque de identidad inmutable

Se pega **entero y sin cambiar una coma** en todos los prompts donde salga.
Va despues del bloque de estilo y antes del encuadre.

```
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
```

**106 palabras.** Fijate en tres decisiones:

- `left ear only` — si no dices el lado, el pendiente salta de oreja entre planos.
- `no logo and no lettering` — el referente original lleva un bordado en la gorra. Un modelo de
  imagen escribe mal, y un bordado ilegible es el fallo mas visible que existe. Se quita.
- `NEVER: ... smile` — este personaje no sonrie en 39 segundos. Ponerlo en la lista negativa
  ahorra reintentos, porque los modelos sonrien por defecto.

## 2. Prompts de la hoja de referencia

Seis imagenes. Todas con **el mismo vestuario, el mismo fondo neutro y la misma luz**.
Fondo neutro a proposito: la referencia tiene que aportar la cara, no una escena.

Modelo recomendado: `nano_banana_pro` a 2k, 4:3. Alternativa: `seedream_v5_pro`.
El bloque `[ESTILO]` es el de `analysis/on_the_road/STYLE.md` seccion 8.

### 2.1 Busto frontal

```
[ESTILO]
[IDENTIDAD]
Front-facing bust portrait, head and shoulders, eyes level with the lens, neutral
expression, looking straight into camera. Even soft key light from front-left, flat
mid-grey #6B6B6B seamless background, no props, no scenery. Character reference
sheet plate. 4:3.
```

### 2.2 Tres cuartos

```
[ESTILO]
[IDENTIDAD]
Three-quarter bust portrait, head turned 45 degrees to camera-left, eyes to camera,
neutral expression. Same lighting and same flat mid-grey #6B6B6B background as the
front plate. Character reference sheet plate. 4:3.
```

### 2.3 Perfil

```
[ESTILO]
[IDENTIDAD]
Full profile bust portrait, head at exactly 90 degrees to camera-left, neutral
expression, jawline and nose silhouette clearly readable. Same lighting and same flat
mid-grey #6B6B6B background. Character reference sheet plate. 4:3.
```

### 2.4 Cuerpo entero

```
[ESTILO]
[IDENTIDAD]
Full body standing, front view, arms relaxed at the sides, weight on the right leg,
feet visible. Dark trousers, black leather loafers, white socks. Same flat mid-grey
#6B6B6B background, same even lighting, full figure inside frame with headroom.
Character reference sheet plate. 3:4.
```

> El cuerpo entero es la unica plancha en 3:4. Es la que fija **silueta y ropa**, no la cara:
> aqui la cara va a salir distinta y no importa. Ver la regla del rostro en el README.

### 2.5 Expresion A — concentracion

```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, brow lowered and jaw set in cold concentration, eyes
narrowed slightly, mouth closed. Same lighting and same flat mid-grey #6B6B6B
background. Character reference sheet plate. 4:3.
```

### 2.6 Expresion B — mirada de reojo

```
[ESTILO]
[IDENTIDAD]
Bust portrait, front view, head still but eyes cut hard to camera-right, one eyebrow
raised a few millimetres, mouth closed. Same lighting and same flat mid-grey #6B6B6B
background. Character reference sheet plate. 4:3.
```

## 3. Guardar como Element

1. Aprueba las 6 planchas segun la lista del README. Guardalas en `characters/el_conductor/ref/`
   con nombres `01_frontal.png`, `02_tres_cuartos.png`, `03_perfil.png`, `04_cuerpo.png`,
   `05_expresion_a.png`, `06_expresion_b.png`.
2. `media_upload` → PUT de los bytes → `media_confirm` para cada una.
3. `show_reference_elements` con `action: "create"`, `name: "el-conductor"`, `category: "auto"`
   y las medias. **Sube al menos el frontal, el 3/4 y el perfil**; con una sola imagen el Element
   funciona pero pierde el parecido en cuanto giras la cabeza.
4. Guarda el `element_id` que te devuelve en `characters/el_conductor/element.txt`.
5. En los prompts, escribes `<<<element_id>>>` donde quieras que aparezca.

## 4. Consistencia plano a plano

| Plano | Encuadre | Que aporta el Element | Riesgo |
|---|---|---|---|
| 03 | busto | la cara entera | bajo |
| 04 | amplio, pies | solo la silueta y la ropa | la cara no se ve — **por diseno** |
| 05 | busto | la cara entera | bajo |
| 06 | busto en el coche | la cara, con luz distinta | medio: la luz de dentro del coche puede alterar el tono de piel |
| 14 | busto reflejado en el retrovisor | la cara, pequena y enmarcada | bajo, el marco tapa la deriva |
| 20 | busto reflejado | igual | bajo |
| 07, 22 | macro de manos | nada; **no pongas el Element aqui** | poner la referencia de cara en un plano de manos hace que el modelo intente meter la cara |

**La ultima fila es la trampa mas cara del sistema.** En insertos macro donde el personaje no
sale, no adjuntes su referencia. Cada referencia de mas empuja al modelo a usarla.
