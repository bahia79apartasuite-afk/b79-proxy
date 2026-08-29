# Props — los insertos macro son lo que hace que parezca una produccion de verdad

## El dato que lo explica todo

En `on_the_road`, **11 de los 28 planos son insertos macro de objetos**: la hamburguesa, el
vaso, la llave, el cuentarrevoluciones, la rueda (tres veces), el escape, el volante, el
velocimetro. Son el 31 % del metraje.

Ninguno de esos planos hace avanzar la historia. Y sin ellos el video no funciona.

Lo que hacen es otra cosa: **dan a entender que existe un mundo fisico**. Un coche que se ve
solo de lejos es un dibujo de un coche. Un coche del que has visto la llave entrar en el
contacto, la aguja subir y la goma de la rueda es un objeto. El espectador no lo razona, lo
da por hecho.

Es ademas la parte mas barata del video: un macro de un objeto sobre fondo desenfocado es lo
que mejor generan todos los modelos de imagen, y lo que menos reintentos necesita.

## Por que van en carpeta aparte

Un prop macro **no se genera dentro del plano donde aparece**. Se genera como objeto, aislado,
con su propia hoja, y luego se usa. Razones:

1. Si lo generas dentro de la escena, el objeto cambia entre plano y plano. Los tres macros de
   rueda de `on_the_road` (planos 12, 23, 27) tienen que ser **la misma rueda**.
2. Un objeto aislado se puede guardar como Element (`category: "prop"`) y reutilizar.
3. Puedes iterar el objeto barato, sin regenerar la escena entera cada vez.

## Prop heroe y props de inserto

- **Prop heroe:** el objeto que es practicamente un personaje. En `on_the_road` es el coche
  amarillo: sale en 20 de 28 planos y tiene tanta hoja de identidad como una persona.
  En `black_sand` es la arena negra. **Un prop heroe se trata como un personaje**: bloque
  inmutable, hoja de referencia de varias vistas, Element propio.
- **Props de inserto:** la llave, el vaso, los anillos. Bloque corto, una o dos planchas.

## Que revisar antes de aprobar un prop

- [ ] ¿Es **el mismo objeto** en todas las planchas? Mira las marcas de desgaste, no la forma.
- [ ] ¿El material reacciona bien a la luz de la ubicacion donde va a aparecer?
- [ ] ¿Tiene texto? Un logo, una marca, unos numeros. Si no lo controlas, quitalo.
- [ ] ¿La escala se entiende? Un macro sin referencia de tamano puede leerse como otra cosa.
