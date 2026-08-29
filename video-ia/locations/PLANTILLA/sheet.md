# [NOMBRE_UBICACION]

**Video:** `[NOMBRE_VIDEO]` · **Planos:** [lista, desde la shotlist]
**Hora:** [momento del dia]
**Paleta:** [los hex del acto, desde tu STYLE.md]

Copia esta carpeta: `cp -r locations/PLANTILLA locations/mi_ubicacion`

## Descripcion inmutable

Se pega entera en todos los prompts que ocurran aqui. **En ingles.** 70 a 110 palabras.

```
LOCATION — [NOMBRE EN MAYUSCULAS]: [que tipo de sitio es en una frase].
[Material y color de la superficie principal, con hex].
[Tres a cinco elementos concretos que se puedan contar: puertas, postes, ventanas,
escalones. Numeralos: "six stools", "two dumpsters". Un numero fija la geometria
mucho mejor que un adjetivo].
[Que hay en el suelo].
[Que se ve al fondo o mas alla].
[LA LUZ, y esta es la frase que importa: cuantas fuentes hay, de que color, desde
donde entran, y que hacen con las superficies. Termina con lo que la luz le hace a
la piel de una persona que este ahi].
```

**Las tres reglas:**

1. **Cuenta las cosas.** "six stools" es geometria; "several stools" es ruido.
2. **La luz va al final y es la mitad del bloque.** Es lo que hace que el personaje encaje.
3. **Di cuantas fuentes hay y que no hay mas.** "Two light sources and no others" evita
   que el modelo anada un relleno suave que te destroza el contraste.

## Planchas

### Amplio
```
[ESTILO]
[UBICACION]
Wide establishing shot [desde donde y a que altura], [que tiene que entrar en cuadro],
empty. 16:9.
```

### Medio
```
[ESTILO]
[UBICACION]
Medium shot of [la zona concreta que usaras de fondo], [que hay detras]. 16:9.
```

### Detalle
```
[ESTILO]
[UBICACION]
Macro detail: [la textura del sitio], [dos o tres objetos pequenos], [la luz otra vez]. 16:9.
```

### [Plancha extra, si tu shotlist la pide]
Cenital, contrapicado o POV. Mira la shotlist: **si hay un plano con un eje raro, genera esa
plancha.** Es mas barato que arreglarlo despues.

## Variantes de hora

Se generan **editando la plancha amplia aprobada**, no de cero.
`seedream_v5_pro` con `is_inpaint: true`, o `gpt_image_2`.

| Variante | Que cambiar en el prompt |
|---|---|
| Amanecer | `[direccion y color de la luz, largo de las sombras, color del cielo con hex]` |
| Mediodia | `[...]` |
| Atardecer | `[...]` |
| Noche | `[...]` |

## Notas de produccion

- ¿En cuantos planos sale? Si son mas de cinco, **guardala como Element**
  (`category: "environment"`). Si son uno o dos, no compensa.
- ¿Hay planos donde el fondo es un borron de velocidad o un fondo grafico plano?
  **No adjuntes la ubicacion en esos.**
