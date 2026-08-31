# MOVIBES — páginas del plugin

Dos páginas, cada una en un solo archivo HTML sin dependencias y sin red: la
tipografía, el lettering y el material de video van dentro.

| Página | Archivo | Qué es |
|---|---|---|
| **Landing del plugin** | `plugin/index.html` | La página de producto. Explica qué es el plugin, con la animación de cinco segundos y la M que se llena al bajar |
| **Previsualización del embudo** | `index.html` | Las cinco landings del embudo, navegables desde un índice |

## Qué hay

| Archivo | Qué es |
|---|---|
| `plugin.src.html` | Fuente de la landing del plugin. **Aquí se edita.** |
| `embudo.src.html` | Fuente de la previsualización del embudo. **Aquí se edita.** |
| `construir.js` | Mete la tipografía, el lettering y los videos en los huecos y escribe las dos páginas |
| `figtree.css` | Los cinco pesos de Figtree incrustados, sacados del sistema de marca |
| `marca-assets.json` | La geometría del lettering MOVIBES, curva por curva |
| `media/c1..c4.mp4` | Material de MOVIBES recomprimido (sin audio, ~1,5 MB en total) |
| `media/p1..p4.jpg` | El primer fotograma de cada clip, para que no haya hueco negro mientras carga |

## Construir

```
node movibes/construir.js      # escribe las dos páginas (~2,2 MB cada una)
```

Sin dependencias: Node puro, igual que el resto del repo.

`index.html` no pide **nada** a la red: la tipografía, el lettering y los cuatro videos
van incrustados. Funciona con doble clic desde el escritorio, desde un USB o subido a
Netlify, Cloudflare Pages o donde sea. Para publicarlo basta con soltar ese archivo solo;
no hace falta la carpeta `media/`, que es material de origen para reconstruirlo.

## La animación de cinco segundos

Está en el héroe de la landing del plugin y no lleva una sola palabra: material
desordenado → se enciende la M y se llena de rojo → una pasada roja revisa → lo que
no sirve se cae → lo bueno se ordena solo en la línea de tiempo → el audio marca los
cortes → la barra se completa. Cinco segundos, en bucle.

Todas las capas cuelgan de un mismo ciclo de 5 s con porcentajes del mismo reloj, así
que no se desincronizan. Los valores de dispersión de cada trozo son fijos, no
aleatorios: tiene que verse igual en cada carga y en cada grabación de pantalla.

**Para revisarla fotograma a fotograma no sirve `animation-delay` negativo**: se suma
al tiempo ya transcurrido y da resultados corridos. Hay que congelar la línea de tiempo
de verdad:

```js
document.querySelectorAll('.demo .escena, .demo .escena *').forEach(el =>
  el.getAnimations().forEach(a => { a.pause(); a.currentTime = 1500; }));
```

## La M que se llena al bajar

El monograma de la cabecera es el medidor de avance: el rojo sube por dentro del
contorno de la letra según lo leído y toca el borde de arriba justo al final de la
página. La misma pieza, en grande, cierra la página. Es la mecánica del lettering
líquido del sistema de marca, atada al scroll en vez de a un temporizador.

## Las cinco etapas del embudo

1. **Captura** — pantalla partida, un solo campo. Regala las transiciones por el correo.
2. **Carta de ventas** — columna única, el video manda. Mecanismo, prueba, oferta, garantía, dudas.
3. **Sesión en vivo** — la única pantalla oscura del sistema, a propósito. Cuenta atrás real.
4. **Producto** — el antes y el después se arrastra. Qué hace, dónde corre, cuánto cuesta.
5. **Cierre** — pedido con añadido de una sola oferta; el total se recalcula de verdad.

Las cinco tarjetas del inicio, juntas, deletrean MOVIBES.

## Dos cosas que conviene saber antes de tocarlo

1. **El conmutador Escritorio/Móvil no es un truco de ancho.** El lienzo es un
   `container-type: inline-size`, así que todo el reflujo de las landings va por
   `@container`, nunca por `@media`. Si añades una regla responsive con `@media`,
   no se aplicará al estrechar el lienzo. Va con `@container`.
2. **Los textos, precios y cifras son de relleno.** Están puestos para que la maqueta se
   lea completa y hay que reemplazarlos antes de publicar. Los formularios no envían nada:
   responden en el propio navegador.
