# [NOMBRE_PROP]

**Video:** `[NOMBRE_VIDEO]` · **Planos:** [lista, desde la shotlist]
**Tipo:** [prop heroe | prop de inserto]

Copia esta carpeta: `cp -r props/PLANTILLA props/mi_prop`

## ¿Es prop heroe o de inserto?

- **Heroe** si sale en mas de cinco planos o si es lo que la historia trata. Se trata como un
  personaje: bloque largo, varias vistas, Element propio.
- **De inserto** si sale en uno o dos planos. Bloque corto, una plancha, nada mas.

Mira tu shotlist y cuenta antes de decidir. Hacer una hoja heroe de un objeto que sale una vez
es tiempo tirado; hacer una hoja de inserto de algo que sale en veinte planos te obliga a
regenerarlo veinte veces.

## Bloque inmutable

```
PROP — [NOMBRE EN MAYUSCULAS]: [que es, en una frase corta].
[Material principal y acabado: mate, pulido, oxidado].
[Color con hex].
[Dos o tres detalles constructivos que se puedan contar: "six eyelets",
"five spokes", "three round dials"].
[EL DESGASTE: donde esta rayado, sucio, gastado, descolorido. Esta linea es la que
separa un objeto de un render de catalogo].
NEVER: [logos, marcas, texto legible, acabado de tienda, y lo que el modelo te haya
colado en la primera tanda].
```

## Planchas

Prop de inserto: **una**, la del encuadre que necesitas.
Prop heroe: **tres a cinco vistas** sobre fondo neutro `#6B6B6B` con luz plana.

```
[ESTILO]
[PROP]
[Encuadre: "Extreme close-up" / "Macro close-up" / "Close-up"],
[que hace el objeto o que lo toca],
[que hay detras y como de desenfocado],
[LA LUZ, con direccion],
[shallow depth of field, si es macro].
The face is NOT in frame.   <- si es un plano de manos u objeto y no quieres cara
16:9.
```

## Las cuatro frases que salvan un macro

1. `The face is NOT in frame.` — en planos de manos y objetos. Los modelos meten cara.
2. `no readable characters` / `no brand names` — en cualquier cosa con superficie plana.
3. La linea de desgaste del bloque. Sin ella, todo sale nuevo y de catalogo.
4. `shallow depth of field` + `out of focus behind` — es lo que hace que se lea como macro
   de camara y no como ilustracion de producto.

## Repeticion del mismo objeto en varios planos

Si el objeto sale mas de una vez, **el bloque no cambia entre planos. Solo cambian el encuadre
y la luz.** Escribe las variantes en una tabla:

| Plano | Encuadre | Luz | Que cambia |
|---|---|---|---|
| [##] | [...] | [...] | [...] |

Si te ves cambiando el bloque entre plano y plano, ya no es el mismo objeto.

## Element

Solo si sale en mas de cinco planos:
`show_reference_elements`, `action: "create"`, `category: "prop"`, `name: "[nombre-corto]"`.
Guarda el id en `props/[prop]/element.txt`.
