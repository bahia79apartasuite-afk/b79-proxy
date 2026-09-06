# RETO COFFEE — Artículos de marca

Página estática, un solo archivo (`index.html`). Sin dependencias, sin empaquetador,
sin paso de build. Se abre con doble clic o se sube tal cual a Netlify.

## Qué trae

| Sección | Contenido |
|---|---|
| Hero «Artículos de marca» | Bodegón con paralaje, titular que sube línea por línea |
| Banda en marcha | Reclamos de marca en bucle, se para al pasar el ratón |
| Panel + carrusel | Panel de marca y tres artículos con flechas y arrastre |
| «Tenemos algo muy especial para todos» | Carrusel de cinco artículos con selector de color |
| «¿Por qué RETO?» | Fondo burdeos, bodegón de bebidas y pastelería |
| «Nuestros productos estrella» | Carrusel de siete bebidas y postres |
| «Café, comida y momentos» | Ocho categorías con icono |
| Cuatro accesos | Bebidas calientes, frías, panadería y artículos |

## Animación

Todo con CSS e `IntersectionObserver`, nada de librerías.

- Bloques que entran con desplazamiento y opacidad, escalonados con `--d`
- Titulares que suben línea por línea desde detrás de una máscara
- Paralaje en los bodegones, calculado sólo cuando están a la vista
- Barra de progreso de lectura y cabecera que se pega al desplazar
- Tarjetas que se elevan, la imagen se acerca y aparece «Ver producto»
- Carruseles con flechas, puntos, teclado, arrastre y ajuste por tarjeta
- Favoritos con rebote, y pastillas de color que cambian el producto de verdad

Con `prefers-reduced-motion: reduce` la página se queda quieta y completa.

## Fotografía

Los productos son **ilustraciones SVG provisionales**, dibujadas a partir de los
mockups. Están en un bloque `<defs>` al principio del archivo, cada una como
`<symbol id="p-...">`.

Para poner una foto real, cambia el bloque

```html
<div class="scene"><svg viewBox="0 0 320 320"><use href="#p-mug" .../></svg></div>
```

por

```html
<img src="fotos/taza-atelier.webp" alt="Taza Cerámica Atelier" width="800" height="800">
```

El contenedor ya es cuadrado y recorta, así que no hace falta tocar el CSS.

## Logo

El logo está reconstruido a partir de los mockups: marco cuadrado, `RE` sobre `TO`,
filete y `COFFEE`. Vive en la clase `.logo` (CSS puro) y en el `<symbol id="mark">`
para estamparlo sobre los productos. La otra versión, el grano con destello, está
en `<symbol id="bean">` y en la clase `.logo-bean`.

**Falta sustituirlos por los archivos oficiales del sistema de logos RETO.**

## Paleta

Leída de los mockups. Está en `:root`.

| Token | Valor | Uso |
|---|---|---|
| `--burgundy` | `#5C1220` | Botones, acentos, «¿Por qué RETO?» |
| `--burgundy-mug` | `#7B1E2B` | Cerámica burgundy |
| `--cream` | `#FBF4EB` | Fondo de las secciones de producto |
| `--sand` | `#E9DCC9` | Lona de la bolsa |
| `--ink` | `#1B1614` | Texto y pie |
| `--gold` | `#F5B301` | Estrellas |

## Probado

Chromium 1194 a 390, 768 y 1440 px. Sin desbordamiento horizontal, sin errores de
consola, y los 23 bloques con animación se revelan al deslizar.
