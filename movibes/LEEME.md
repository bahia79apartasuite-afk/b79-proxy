# MOVIBES — previsualización del embudo

Maqueta navegable de las cinco landings del embudo de venta del plugin de edición.
Es un solo archivo HTML, sin dependencias y sin red: la tipografía, el lettering y
el material de video van dentro.

## Qué hay

| Archivo | Qué es |
|---|---|
| `embudo.src.html` | La fuente. **Aquí se edita.** Lleva huecos `__CLIP1__`, `__FIGTREE__`… |
| `construir.js` | Mete la tipografía, el lettering y los videos en los huecos y escribe `embudo.html` |
| `figtree.css` | Los cinco pesos de Figtree incrustados, sacados del sistema de marca |
| `marca-assets.json` | La geometría del lettering MOVIBES, curva por curva |
| `media/c1..c4.mp4` | Material de MOVIBES recomprimido (sin audio, ~1,5 MB en total) |
| `media/p1..p4.jpg` | El primer fotograma de cada clip, para que no haya hueco negro mientras carga |

## Construir

```
node movibes/construir.js      # escribe movibes/embudo.html (~2,2 MB)
```

Sin dependencias: Node puro, igual que el resto del repo. `embudo.html` no se versiona
porque se regenera con ese comando.

## Las cinco etapas

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
