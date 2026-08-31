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
const salida = path.join(aquí, 'embudo.html');
fs.writeFileSync(salida, html);
console.log('embudo.html — ' + (fs.statSync(salida).size / 1048576).toFixed(2) + ' MB');
