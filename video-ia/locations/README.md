# Ubicaciones — el mundo se hace antes que el personaje

## Por que van primero

Es el orden que ensena Higgsfield Academy y no es arbitrario: **primero el mundo, luego el
personaje, luego los frames, luego el video.**

La razon practica es la luz. Una ubicacion define hora del dia, direccion de la luz, temperatura
de color y paleta. Si generas al personaje antes, lo generas con una luz inventada y luego no
encaja en ningun sitio: tendras un personaje bien iluminado en un mundo iluminado de otra manera,
y el corte entre plano y plano se vera falso aunque cada plano por separado este bien.

Al reves funciona: con la ubicacion aprobada, el bloque de luz de la ubicacion se pega en los
prompts del personaje, y todo cae en el mismo mundo.

## Una carpeta por ubicacion

```
locations/<ubicacion>/
  sheet.md      descripcion inmutable + prompts de establecimiento + variantes de hora
  ref/          las imagenes aprobadas
  element.txt   el element_id, si la guardas como Element
```

**Las ubicaciones tambien pueden ser Elements.** `show_reference_elements` acepta
`category: "environment"`. Es la forma mas fiable de que la pared del callejon sea la misma
pared en los ocho planos que pasan ahi.

## Tres planchas por ubicacion, siempre en este orden

1. **Amplio (establecimiento).** El sitio entero, con horizonte o con las cuatro paredes.
   Es la plancha que define geometria y luz.
2. **Medio.** Una zona concreta a la altura de una persona. Es la que usaras de fondo en la
   mayoria de los planos.
3. **Detalle.** Una textura de ese sitio: el asfalto agrietado, la pintura descascarillada, el
   grafiti. Sirve para los insertos macro y para que el mundo parezca real.

Cada plancha lleva **el mismo bloque de descripcion inmutable**, igual que los personajes.

## Variantes de hora del dia

Se generan **desde la plancha amplia aprobada**, editando, no generando de cero. En Higgsfield:
`seedream_v5_pro` con `is_inpaint: true`, o `gpt_image_2`, que es el que mejor conserva la
geometria mientras cambia la luz. En Midjourney a mano, `--sref` con la plancha aprobada.

Si generas cada hora del dia por separado, te salen **tres sitios distintos**, no el mismo sitio
a tres horas. Es un fallo silencioso: cada imagen esta bien, y el conjunto no cuadra.

## Que revisar antes de aprobar

- [ ] ¿La luz viene **del mismo lado** en las tres planchas?
- [ ] ¿La paleta cae dentro de la de tu `STYLE.md`? Comparala contra los hex, no de memoria.
- [ ] ¿Hay texto legible (carteles, senales)? Si lo hay y no lo controlas, quitalo.
- [ ] ¿La geometria es coherente entre la amplia y la media? Cuenta ventanas, postes, puertas.
- [ ] ¿Se puede poner una persona ahi? Si no hay suelo claro ni escala humana, el personaje
      flotara en todos los planos que uses ese fondo.
