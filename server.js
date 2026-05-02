const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || '';
const LOBBY_HOST = process.env.LOBBY_HOST || 'app.lobbypms.com';
const PORT = process.env.PORT || 3000;
const LOBBY_PROPERTY_ID = process.env.LOBBY_PROPERTY_ID || '14965';
const B79_TOKEN = process.env.B79_TOKEN || 'b79secure2024';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-B79-Token',
    'Content-Type': 'application/json',
};

let SESSION_COOKIES = '';
let SESSION_EXPIRES = 0;

function rawRequest(opts) {
    return new Promise((resolve, reject) => {
          const lib = opts.protocol === 'http:' ? http : https;
          const req = lib.request(opts, (res) => {
                  const chunks = [];
                  res.on('data', c => chunks.push(c));
                  res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
          });
          req.on('error', reject);
          if (opts.body) req.write(opts.body);
          req.end();
    });
}

function parseSetCookie(scs) {
    if (!scs) return {};
    const arr = Array.isArray(scs) ? scs : [scs];
    const jar = {};
    for (const c of arr) {
          const f = c.split(';')[0];
          const eq = f.indexOf('=');
          if (eq > 0) jar[f.slice(0,eq).trim()] = f.slice(eq+1).trim();
    }
    return jar;
}

function mergeCookies(existing, fresh) {
    const out = {};
    if (existing) existing.split(';').forEach(p => { const [k,v] = p.split('=').map(s=>(s||'').trim()); if (k) out[k] = v||''; });
    Object.keys(fresh||{}).forEach(k => out[k] = fresh[k]);
    return Object.keys(out).map(k => k+'='+out[k]).join('; ');
}

async function lobbyGET(path, cookies) {
    return rawRequest({
          protocol: 'https:', hostname: LOBBY_HOST, port: 443, path, method: 'GET',
          headers: { 'Accept':'text/html,application/json', 'User-Agent':'Mozilla/5.0 B79-Proxy/7.0', 'Cookie': cookies||'' }
    });
}

async function lobbyPOST(path, body, cookies, extra) {
    const h = Object.assign({
          'Accept':'application/json,text/html',
          'Content-Type':'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent':'Mozilla/5.0 B79-Proxy/7.0',
          'X-Requested-With':'XMLHttpRequest',
          'Cookie': cookies||'',
          'Origin':'https://'+LOBBY_HOST,
          'Referer':'https://'+LOBBY_HOST+'/login'
    }, extra||{});
    return rawRequest({ protocol:'https:', hostname:LOBBY_HOST, port:443, path, method:'POST', headers:h, body });
}

function extractCsrf(html) {
    const m1 = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/i);
    if (m1) return m1[1];
    const m2 = html.match(/name="_token"\s+value="([^"]+)"/i);
    if (m2) return m2[1];
    return '';
}

async function ensureLogin() {
    if (SESSION_COOKIES && Date.now() < SESSION_EXPIRES) return true;
    const r1 = await lobbyGET('/login', '');
    const c1 = parseSetCookie(r1.headers['set-cookie']);
    const cookies1 = mergeCookies('', c1);
    const csrf = extractCsrf(r1.body);
    const xsrf = c1['XSRF-TOKEN'] ? decodeURIComponent(c1['XSRF-TOKEN']) : '';
    const tries = [
      { email: LOBBY_USER, password: LOBBY_PASS, _token: csrf, remember: 'on' },
      { username: LOBBY_USER, password: LOBBY_PASS, _token: csrf, remember: 'on' },
      { user: LOBBY_USER, password: LOBBY_PASS, _token: csrf, remember: 'on' },
      { login: LOBBY_USER, password: LOBBY_PASS, _token: csrf, remember: 'on' }
        ];
    for (const fields of tries) {
          const body = Object.keys(fields).map(k => encodeURIComponent(k)+'='+encodeURIComponent(fields[k])).join('&');
          const r2 = await lobbyPOST('/login', body, cookies1, csrf ? { 'X-CSRF-TOKEN': csrf, 'X-XSRF-TOKEN': xsrf } : {});
          const c2 = parseSetCookie(r2.headers['set-cookie']);
          const cookies2 = mergeCookies(cookies1, c2);
          const verify = await lobbyGET('/dashboard', cookies2);
          const looksDashboard = verify.body && verify.body.indexOf('Panel de control') >= 0;
          if (looksDashboard) {
                  SESSION_COOKIES = cookies2;
                  SESSION_EXPIRES = Date.now() + 25 * 60 * 1000;
                  return true;
          }
    }
    return false;
}

async function lobbyJSON(path) {
    const ok = await ensureLogin();
    if (!ok) return { ok:false, error:'login_failed' };
    let r = await rawRequest({
          protocol:'https:', hostname:LOBBY_HOST, port:443, path, method:'GET',
          headers: { 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest', 'User-Agent':'Mozilla/5.0 B79-Proxy/7.0', 'Cookie': SESSION_COOKIES, 'Referer':'https://'+LOBBY_HOST+'/dashboard' }
    });
    const ct = (r.headers['content-type']||'');
    if (r.status===401 || r.status===419 || ct.includes('text/html')) {
          SESSION_COOKIES=''; SESSION_EXPIRES=0;
          const ok2 = await ensureLogin();
          if (!ok2) return { ok:false, error:'login_failed_retry' };
          r = await rawRequest({
                  protocol:'https:', hostname:LOBBY_HOST, port:443, path, method:'GET',
                  headers: { 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest', 'User-Agent':'Mozilla/5.0 B79-Proxy/7.0', 'Cookie': SESSION_COOKIES, 'Referer':'https://'+LOBBY_HOST+'/dashboard' }
          });
    }
    try { return { ok:true, data: JSON.parse(r.body), status: r.status }; }
    catch(e) { return { ok:false, error:'not_json', status:r.status, ct:r.headers['content-type'] }; }
}

function pad(n) { return String(n).padStart(2,'0'); }
function nowDateStr() { const d = new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); }
function dateStr(only) { return only ? (only+' 12:00:00') : nowDateStr(); }

function shapeGuest(x, source) {
    return {
          id_reserva: x.id_reserva,
          id_cliente: x.id_cliente,
          nombre: x.nombre_completo || ((x.nombre||'')+' '+(x.primer_apellido||'')+' '+(x.segundo_apellido||'')).trim(),
          identificacion: x.identificacion || '',
          email: x.email || '',
          pais: x.nombre_pais || '',
          direccion: x.direccion || '',
          habitacion: x.nombre_cuarto || '',
          categoria: x.nombre_categoria || '',
          fecha_ingreso: x.fecha_ingreso,
          fecha_salida: x.fecha_salida,
          fecha_check_in: x.fecha_check_in,
          fecha_check_out: x.fecha_check_out,
          noches: x.cantidad_noches,
          personas: Number(x.numero_personas)||0,
          menores: Number(x.numero_menores)||0,
          total_a_pagar: Number(x.total_a_pagar)||0,
          impuesto: Number(x.impuesto)||0,
          total_alojamiento: Number(x.total_alojamiento)||0,
          estatus: x.estatus,
          checkin_realizado: !!x.checkin_realizado,
          checkout_realizado: !!x.checkout_realizado,
          numero_factura: x.numero_factura || '',
          agencia: x.agencia || '',
          plan: x.plan || '',
          source
    };
}

function send(res, status, obj) { res.writeHead(status, CORS_HEADERS); res.end(JSON.stringify(obj)); }

const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const action = u.searchParams.get('action') || 'health';
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS_HEADERS); return res.end(); }
    try {
          if (action === 'health') {
                  return send(res, 200, { ok:true, service:'B79 LobbyPMS Proxy', version:'7.0', strategy:'session-cookies', property_id:LOBBY_PROPERTY_ID, host:LOBBY_HOST, logged_in: !!(SESSION_COOKIES && Date.now()<SESSION_EXPIRES) });
          }
          if (action === 'login_test') {
                  SESSION_COOKIES=''; SESSION_EXPIRES=0;
                  const ok = await ensureLogin();
                  return send(res, 200, { ok, has_cookies: !!SESSION_COOKIES });
          }
          if (action === 'aseo' || action === 'inhouse') {
                  const date = dateStr(u.searchParams.get('date'));
                  const r = await lobbyJSON('/dashboard/getInHouse?date='+encodeURIComponent(date)+'&pagina=1');
                  if (!r.ok) return send(res, 502, { ok:false, error:r.error||'unreachable', detail:r });
                  const d = r.data && r.data.data ? r.data.data : r.data;
                  const items = (d && d.in_house) || [];
                  return send(res, 200, { ok:true, count:items.length, totalClientes: d&&d.totalClientes, fecha:date, items: items.map(x=>shapeGuest(x,'in_house')) });
          }
          if (action === 'llegadas') {
                  const date = dateStr(u.searchParams.get('date'));
                  const r = await lobbyJSON('/dashboard/getLlegadas?date='+encodeURIComponent(date)+'&pagina=1');
                  if (!r.ok) return send(res, 502, { ok:false, error:r.error||'unreachable' });
                  const d = r.data && r.data.data ? r.data.data : r.data;
                  const items = (d && d.llegadas) || [];
                  return send(res, 200, { ok:true, count:items.length, fecha:date, items: items.map(x=>shapeGuest(x,'llegada')) });
          }
          if (action === 'salidas') {
                  const date = dateStr(u.searchParams.get('date'));
                  const r = await lobbyJSON('/dashboard/getSalidas?date='+encodeURIComponent(date)+'&pagina=1');
                  if (!r.ok) return send(res, 502, { ok:false, error:r.error||'unreachable' });
                  const d = r.data && r.data.data ? r.data.data : r.data;
                  const items = (d && d.salidas) || [];
                  return send(res, 200, { ok:true, count:items.length, fecha:date, items: items.map(x=>shapeGuest(x,'salida')) });
          }
          if (action === 'facturacion') {
                  const date = dateStr(u.searchParams.get('date'));
                  const [a,b,c] = await Promise.all([
                            lobbyJSON('/dashboard/getInHouse?date='+encodeURIComponent(date)+'&pagina=1'),
                            lobbyJSON('/dashboard/getLlegadas?date='+encodeURIComponent(date)+'&pagina=1'),
                            lobbyJSON('/dashboard/getSalidas?date='+encodeURIComponent(date)+'&pagina=1'),
                          ]);
                  const inh = (a.ok && (a.data.data||a.data).in_house) || [];
                  const lle = (b.ok && (b.data.data||b.data).llegadas) || [];
                  const sal = (c.ok && (c.data.data||c.data).salidas) || [];
                  const all = [].concat(inh.map(x=>shapeGuest(x,'in_house')), lle.map(x=>shapeGuest(x,'llegada')), sal.map(x=>shapeGuest(x,'salida')));
                  const seen={}; const unique=[];
                  for (const it of all) { if (!it.id_reserva || seen[it.id_reserva]) continue; seen[it.id_reserva]=true; unique.push(it); }
                  return send(res, 200, { ok:true, fecha:date, stats:{ in_house:inh.length, llegadas:lle.length, salidas:sal.length, total:unique.length }, items: unique });
          }
          if (action === 'debug') {
                  const ok = await ensureLogin();
                  const date = dateStr(u.searchParams.get('date'));
                  const r = await lobbyJSON('/dashboard/getInHouse?date='+encodeURIComponent(date)+'&pagina=1');
                  return send(res, 200, { ok:true, login:ok, sample_keys: r.ok && r.data ? Object.keys(r.data) : null, status: r.status });
          }
          return send(res, 400, { error:'Unknown action', action, validActions:['health','aseo','inhouse','llegadas','salidas','facturacion','login_test','debug'] });
    } catch (e) {
          return send(res, 500, { error:'internal', message:e.message });
    }
});

server.listen(PORT, () => { console.log('B79 Proxy v7.0 (session-based) listening on '+PORT); });
