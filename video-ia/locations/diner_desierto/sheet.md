# DINER DEL DESIERTO

**Video:** `on_the_road` · **Planos:** 1, 2, 3, 4 (y la salida del 4 hacia la explanada)
**Hora:** media manana, luz alta y dura
**Paleta del acto:** `#000001` `#3E1D11` `#7F6F64` `#96B0C9` `#693D25` `#B3A69D`
Es el unico acto con azul (`#96B0C9`, cielo y gorra). A partir de aqui todo se calienta.

## Descripcion inmutable

```
LOCATION — DESERT DINER: a single-storey roadside diner in the high desert. Cream
enamel panels below a band of deep red #8E2B1E, a flat aluminium awning running the
full front, six chrome-and-red stools bolted to the concrete under it, one wide
window with horizontal blinds half-drawn. Cracked pale concrete apron in front,
two white parking lines. Flat scrub desert behind, rust-red mesas on the horizon,
one leaning telegraph pole camera-left. High hard sun from upper-left, short hard
shadows, no clouds.
```

## Planchas

### Amplio
```
[ESTILO]
[UBICACION]
Wide establishing shot, camera at chest height across the parking apron, the whole
diner front in frame with the mesas behind it, empty. 16:9.
```

### Medio
```
[ESTILO]
[UBICACION]
Medium shot of the awning and the row of stools, seen from three-quarters, the window
and blinds behind, concrete apron in the lower third. No people. 16:9.
```

### Detalle
```
[ESTILO]
[UBICACION]
Macro detail: cracked pale concrete with a white painted parking line running through
it, grit and a bottle cap, hard sunlight raking across from upper-left. 16:9.
```

## Variantes de hora

Se generan **editando la plancha amplia**, no de cero.

| Variante | Que cambiar en el prompt |
|---|---|
| Amanecer | `low warm sun from camera-left, long shadows across the apron, sky graded from #E8B978 at the horizon to #96B0C9 above` |
| Mediodia (la del video) | `high hard sun from upper-left, short shadows, bleached sky` |
| Atardecer | `low orange sun behind the diner, the building in half silhouette, rim light on the awning edge, sky #EABB7B` |
| Noche | `no sun, a single sodium lamp on the awning, warm pool of light on the concrete, everything outside the pool at #0A0A0C` |

## Notas de produccion

- El plano 4 dura 5.77 s y **recorre la ubicacion entera**. Es el que hay que generar primero
  y con mas cuidado: si ese plano queda bien, los otros tres se cuelgan de el.
- Los planos 1 y 2 son macros de comida que ocurren **dentro**, pero el fondo esta tan
  desenfocado que no hace falta generar el interior. Ahorrate una ubicacion entera.
