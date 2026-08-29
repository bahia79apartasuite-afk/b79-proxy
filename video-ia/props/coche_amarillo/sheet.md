# COCHE AMARILLO — prop heroe

**Video:** `on_the_road` · **Planos:** 4, 6–13, 15–19, 21, 23–25, 27, 28 (20 de 28)
**Rol:** segundo personaje del video

> Diseno generico. **No es un modelo de coche real y no debe serlo.** Un modelo de imagen
> reproduce carrocerias de marcas reconocibles con bastante fidelidad; describir el coche por
> geometria y no por marca te da un vehiculo propio, sin marca visible y sin problemas.

## Bloque inmutable

```
HERO PROP — THE YELLOW CAR: a late-sixties American fastback coupe, long bonnet,
short deck, roofline falling in one straight line to the tail. Body in saturated
cadmium yellow #F2BB34 with two matte black stripes running the full length over
the centre. Wide riveted steel arch extensions over all four wheels. Deep-dish
polished alloy wheels with five spokes, low-profile tyres. Twin chromed exhaust
tips under a black rear valance. Yellow rear plate, no readable characters. Chrome
bumperettes, black grille with two round headlamps. Dusty, stone-chipped, used.
NEVER: manufacturer badges, brand names, spoilers, decals with readable text,
a clean showroom finish.
```

**110 palabras.** `Dusty, stone-chipped, used` no es decoracion: un coche limpio se lee como
render de catalogo y rompe el estilo pintado. `no readable characters` en la matricula evita
el problema de siempre.

## Planchas

Un prop heroe necesita **una vuelta completa**, igual que un personaje necesita su hoja.
Fondo neutro `#6B6B6B`, luz plana, las cinco con el mismo encuadre de distancia.

```
[ESTILO] + [PROP] + uno de estos:

1. Front three-quarter view from camera-left, wheels straight, full car in frame,
   flat mid-grey #6B6B6B background, even light. Prop reference plate. 16:9.
2. Direct side profile, camera perpendicular to the car, full length in frame. 16:9.
3. Rear three-quarter view from camera-right, the twin exhausts and the rear valance
   readable. 16:9.
4. Direct front view, both headlamps and the grille square to camera. 16:9.
5. Top-down view from directly above, the two black stripes reading as a graphic. 16:9.
```

La quinta es para el cenital del plano 11. **Genera la vista que tu shotlist necesita**, no las
cinco por costumbre.

## Insertos macro que salen de este prop

Van en `props/insertos_coche/`, pero se generan **desde las planchas del coche aprobadas** para
que el material y el desgaste coincidan. Si generas la rueda por separado sin la referencia del
coche, te sale otra rueda.

## Element

`show_reference_elements`, `action: "create"`, `category: "prop"`, `name: "coche-amarillo"`.
Sube las tres primeras planchas como minimo. En los prompts: `<<<element_id>>>`.

Como este prop sale en 20 planos, el Element **se amortiza en el segundo plano**. Es el primer
Element que deberias crear de todo el proyecto.
