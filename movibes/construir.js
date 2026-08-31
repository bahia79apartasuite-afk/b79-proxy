/* Arma las páginas de MOVIBES: mete la tipografía, la geometría del
   lettering y el material de video como data URI dentro de los fuentes.
   Sin dependencias: node construir.js y listo.

   De cada fuente salen dos archivos:
     · index.html  — documento completo y autónomo, para subir a un hosting
     · <n>.html    — el mismo contenido sin <html>/<head>/<body>, que es
                     como lo pide el visor de Artifacts                    */
const fs = require('fs');
const path = require('path');
const aquí = __dirname;

const PAGINAS = [
  { fuente: 'embudo.src.html', frag: 'embudo.html', suelto: 'index.html',
    desc: 'Previsualización navegable de las cinco landings del embudo de venta del plugin de MOVIBES.',
    og: 'Cinco landings, un solo embudo. Maqueta navegable.' },
  { fuente: 'plugin.src.html', frag: 'plugin.html', suelto: 'plugin/index.html',
    desc: 'MOVIBES es un plugin para Premiere Pro que arma el primer montaje de tu material en cinco minutos.',
    og: 'Suelta el material. Sal con el montaje.' }
];

const uri = (f, tipo) =>
  JSON.stringify(`data:${tipo};base64,` +
    fs.readFileSync(path.join(aquí, 'media', f)).toString('base64'));

const marca = JSON.parse(fs.readFileSync(path.join(aquí, 'marca-assets.json'), 'utf8'));
const FLECHA = '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4"/></svg>';

const piezas = {
  __FIGTREE__: fs.readFileSync(path.join(aquí, 'figtree.css'), 'utf8'),
  __ASSETS__: JSON.stringify(marca),
  __FLECHA__: FLECHA,
  __CLIP1__: uri('c1.mp4', 'video/mp4'), __CLIP2__: uri('c2.mp4', 'video/mp4'),
  __CLIP3__: uri('c3.mp4', 'video/mp4'), __CLIP4__: uri('c4.mp4', 'video/mp4'),
  __POS1__: uri('p1.jpg', 'image/jpeg'), __POS2__: uri('p2.jpg', 'image/jpeg'),
  __POS3__: uri('p3.jpg', 'image/jpeg'), __POS4__: uri('p4.jpg', 'image/jpeg')
};
/* el comparador necesita el cartel ya resuelto, así que se arma aquí */
const vid = (clip, extra) => `<video data-clip="${clip}" poster="${JSON.parse(piezas['__POS' + (clip+1) + '__'])}" ` +
  `muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true"${extra || ''}></video>`;
piezas.__COMPARADOR__ = `${vid(0)}\n      <div class="crudo">${vid(0)}</div>`;

/* el monograma como icono de pestaña, del mismo lettering */
const m = marca.letras.M.b, r = 10;
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m[0]-r} ${m[1]-r} ${m[2]-m[0]+r*2} ${m[3]-m[1]+r*2}"><path fill="#0D0D0D" d="${marca.letras.M.d}"/></svg>`;

const mb = f => (fs.statSync(f).size / 1048576).toFixed(2) + ' MB';

for (const pág of PAGINAS){
  let html = fs.readFileSync(path.join(aquí, pág.fuente), 'utf8');
  for (const [k, v] of Object.entries(piezas)){
    if (html.includes(k)) html = html.split(k).join(v);   // sin regex: los data URI traen $ y &
  }
  const resto = html.match(/__[A-Z0-9_]+__/);
  if (resto) throw new Error(`${pág.fuente}: quedó sin rellenar ${resto[0]}`);

  const frag = path.join(aquí, pág.frag);
  fs.writeFileSync(frag, html);

  /* el cuerpo empieza en el primer elemento tras los estilos */
  const corte = html.search(/\n<(div|header|main|section)[ >]/);
  if (corte < 0) throw new Error(pág.fuente + ': no se encontró el arranque del cuerpo');
  const titulo = (html.match(/<title>([^<]*)<\/title>/) || [, 'MOVIBES'])[1];

  const doc = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#FFFFFF">
<meta name="description" content="${pág.desc}">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${pág.og}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icono)}">
${html.slice(0, corte).trim()}
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
${html.slice(corte).trim()}
</body>
</html>
`;
  const salida = path.join(aquí, pág.suelto);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, doc);
  console.log(`${pág.suelto.padEnd(18)} ${mb(salida)}   ·   ${pág.frag.padEnd(12)} ${mb(frag)}`);
}
