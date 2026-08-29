// Supabase falso: imita la parte de la API REST que usa db.js, guardando todo
// en memoria. Sirve para probar cuentas e historial sin credenciales reales y
// sin tocar internet.
//
//   node pruebas/supabase-falso.js                 # escucha en el 4001
//   SUPABASE_URL=http://127.0.0.1:4001 SUPABASE_KEY=x node server.js

const http = require('http');
const PORT = Number(process.env.PORT) || 4001;
const H = { 'Content-Type': 'application/json' };

const tablas = { usuarios: [], eventos: [] };
let siguienteId = 1;

function filtrar(filas, params) {
  let out = filas.slice();
  for (const [campo, valor] of params) {
    if (['select', 'order', 'limit', 'offset'].includes(campo)) continue;
    const [op, ...resto] = String(valor).split('.');
    const v = resto.join('.');
    if (op === 'eq') out = out.filter(f => String(f[campo]) === v || (v === 'true' && f[campo] === true) || (v === 'false' && f[campo] === false));
    if (op === 'gte') out = out.filter(f => String(f[campo]) >= v);
  }
  return out;
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const tabla = u.pathname.replace('/rest/v1/', '');
  if (!tablas[tabla]) { res.writeHead(404, H); res.end('{"message":"tabla desconocida"}'); return; }

  let cuerpo = '';
  req.on('data', c => cuerpo += c);
  req.on('end', () => {
    const params = [...u.searchParams];

    if (req.method === 'GET') {
      let filas = filtrar(tablas[tabla], params);
      const orden = u.searchParams.get('order');
      if (orden) {
        const [campo, dir] = orden.split('.');
        filas.sort((a, b) => (String(a[campo]) < String(b[campo]) ? -1 : 1) * (dir === 'desc' ? -1 : 1));
      }
      const limite = Number(u.searchParams.get('limit'));
      if (limite) filas = filas.slice(0, limite);
      // respetar ?select=, como hace Supabase de verdad
      const select = u.searchParams.get('select');
      if (select && select !== '*') {
        const campos = select.split(',').map(c => c.trim());
        filas = filas.map(f => Object.fromEntries(campos.filter(c => c in f).map(c => [c, f[c]])));
      }
      res.writeHead(200, H); res.end(JSON.stringify(filas)); return;
    }

    if (req.method === 'POST') {
      const nuevas = JSON.parse(cuerpo || '[]');
      const creadas = [];
      for (const fila of nuevas) {
        if (tabla === 'usuarios' && tablas.usuarios.some(x => x.usuario === fila.usuario)) {
          res.writeHead(409, H);
          res.end('{"message":"duplicate key value violates unique constraint"}');
          return;
        }
        const completa = Object.assign(
          { id: tabla === 'usuarios' ? 'u' + (siguienteId++) : siguienteId++ },
          tabla === 'eventos' ? { momento: new Date().toISOString() } : { creado: new Date().toISOString() },
          fila
        );
        tablas[tabla].push(completa);
        creadas.push(completa);
      }
      res.writeHead(201, H); res.end(JSON.stringify(creadas)); return;
    }

    if (req.method === 'PATCH') {
      const cambios = JSON.parse(cuerpo || '{}');
      const objetivo = filtrar(tablas[tabla], params);
      objetivo.forEach(f => Object.assign(f, cambios));
      res.writeHead(200, H); res.end(JSON.stringify(objetivo)); return;
    }

    res.writeHead(405, H); res.end('{}');
  });
}).listen(PORT, () => console.log('Supabase falso en ' + PORT));
