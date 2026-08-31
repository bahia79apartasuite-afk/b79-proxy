/* Arma movibes/embudo.html: mete la geometría del lettering y el
   material de video como data URI dentro de embudo.src.html.
   No hay dependencias: node construir.js y listo.  */
const fs = require('fs');
const path = require('path');
const aquí = __dirname;

const uri = (f, tipo) =>
  JSON.stringify(`data:${tipo};base64,` +
    fs.readFileSync(path.join(aquí, 'media', f)).toString('base64'));

let html = fs.readFileSync(path.join(aquí, 'embudo.src.html'), 'utf8');
const piezas = {
  __FIGTREE__: fs.readFileSync(path.join(aquí, 'figtree.css'), 'utf8'),
  __ASSETS__: fs.readFileSync(path.join(aquí, 'marca-assets.json'), 'utf8'),
  __CLIP1__: uri('c1.mp4', 'video/mp4'), __CLIP2__: uri('c2.mp4', 'video/mp4'),
  __CLIP3__: uri('c3.mp4', 'video/mp4'), __CLIP4__: uri('c4.mp4', 'video/mp4'),
  __POS1__: uri('p1.jpg', 'image/jpeg'), __POS2__: uri('p2.jpg', 'image/jpeg'),
  __POS3__: uri('p3.jpg', 'image/jpeg'), __POS4__: uri('p4.jpg', 'image/jpeg')
};
for (const [k, v] of Object.entries(piezas)) {
  if (!html.includes(k)) throw new Error('falta el hueco ' + k);
  html = html.split(k).join(v);   // sin regex: los data URI traen $ y &
}
/* 1 · embudo.html — el fragmento que publica el Artifact, que ya pone
      su propio doctype/head/body alrededor. */
const frag = path.join(aquí, 'embudo.html');
fs.writeFileSync(frag, html);

/* 2 · index.html — el documento completo y autónomo, para soltar en
      cualquier hosting. Se parte el fragmento donde empieza el cuerpo:
      lo de arriba (título y estilos) es cabecera válida tal cual. */
const corte = html.indexOf('<div id="carga">');
if (corte < 0) throw new Error('no se encontró el arranque del cuerpo');
const cabeza = html.slice(0, corte).trim();
const cuerpo = html.slice(corte).trim();

/* el monograma como icono de pestaña, del mismo lettering */
const marca = JSON.parse(fs.readFileSync(path.join(aquí, 'marca-assets.json'), 'utf8'));
const m = marca.letras.M.b, r = 10;
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m[0]-r} ${m[1]-r} ${m[2]-m[0]+r*2} ${m[3]-m[1]+r*2}"><path fill="#0D0D0D" d="${marca.letras.M.d}"/></svg>`;

const doc = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#FFFFFF">
<meta name="description" content="Previsualización navegable de las cinco landings del embudo de venta del plugin de edición de MOVIBES.">
<meta property="og:title" content="Embudo MOVIBES">
<meta property="og:description" content="Cinco landings, un solo embudo. Maqueta navegable.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icono)}">
${cabeza}
<style>
/* el mismo suelo mínimo que pone el visor de Artifacts, para que el
   archivo suelto se vea idéntico a lo que ya se probó */
html{-webkit-text-size-adjust:100%}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
${cuerpo}
</body>
</html>
`;
const salida = path.join(aquí, 'index.html');
fs.writeFileSync(salida, doc);

const mb = f => (fs.statSync(f).size / 1048576).toFixed(2) + ' MB';
console.log('embudo.html (fragmento para el Artifact) — ' + mb(frag));
console.log('index.html  (documento suelto, autónomo)  — ' + mb(salida));
