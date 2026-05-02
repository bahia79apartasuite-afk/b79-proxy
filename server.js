// b79-proxy server.js v8.0 - Two-step session-cookie auth for LobbyPMS
// Login flow: validarhotel -> getPropertyUsers -> validarDatos -> /dashboard/get*
const http = require('http');
const https = require('https');

const LOBBY_USER_NAME = process.env.LOBBY_USER || 'Hotel Bahia 79 Apartasuite';
const LOBBY_PASS = process.env.LOBBY_PASS || '';
const LOBBY_HOST = process.env.LOBBY_HOST || 'app.lobbypms.com';
const LOBBY_PROPERTY_ID = process.env.LOBBY_PROPERTY_ID || '14965';
const PORT = process.env.PORT || 3000;
const B79_TOKEN = process.env.B79_TOKEN || 'b79secure2024';

const CORS_HEADERS = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-B79-Token',
        'Content-Type': 'application/json',
};

let SESSION_COOKIES = '';
let SESSION_EXPIRES = 0;

function rawRequest(opts, body) {
        return new Promise((resolve, reject) => {
                    const req = https.request(opts, res => {
                                    const chunks = [];
                                    res.on('data', c => chunks.push(c));
                                    res.on('end', () => {
                                                        const buf = Buffer.concat(chunks);
                                                        resolve({ statusCode: res.statusCode, headers: res.headers, body: buf.toString('utf8') });
                                    });
                    });
                    req.on('error', reject);
                    if (body) req.write(body);
                    req.end();
        });
}

function buildMultipart(fields) {
        const boundary = '----b79boundary' + Date.now();
        let body = '';
        for (const [k, v] of Object.entries(fields)) {
                    body += `--${boundary}\r\n`;
                    body += `Content-Disposition: form-data; name="${k}"\r\n\r\n`;
                    body += `${v}\r\n`;
        }
        body += `--${boundary}--\r\n`;
        return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

function mergeCookies(existing, setCookieHeader) {
        const jar = {};
        if (existing) existing.split(/;\s*/).forEach(p => { const [k, ...v] = p.split('='); if (k) jar[k] = v.join('='); });
        if (setCookieHeader) {
                    const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                    arr.forEach(c => { const first = c.split(';')[0]; const [k, ...v] = first.split('='); if (k) jar[k.trim()] = v.join('='); });
        }
        return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function loginLobby() {
        let cookies = '';
        // Step 1: validarhotel
    const mp1 = buildMultipart({ codigoHotel: LOBBY_PROPERTY_ID, lg: 'es' });
        const r1 = await rawRequest({
                    host: LOBBY_HOST, port: 443, method: 'POST',
                    path: '/entrar/validarhotel?view=web',
                    headers: {
                                    'Content-Type': mp1.contentType,
                                    'Content-Length': Buffer.byteLength(mp1.body),
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Origin': 'https://' + LOBBY_HOST,
                                    'Referer': 'https://' + LOBBY_HOST + '/entrar',
                                    'User-Agent': 'Mozilla/5.0 b79-proxy/8.0'
                    }
        }, mp1.body);
        cookies = mergeCookies(cookies, r1.headers['set-cookie']);

    // Step 2: getPropertyUsers
    const mp2 = buildMultipart({ codigoHotel: LOBBY_PROPERTY_ID });
        const r2 = await rawRequest({
                    host: LOBBY_HOST, port: 443, method: 'POST',
                    path: '/entrar/getPropertyUsers',
                    headers: {
                                    'Content-Type': mp2.contentType,
                                    'Content-Length': Buffer.byteLength(mp2.body),
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Cookie': cookies,
                                    'Origin': 'https://' + LOBBY_HOST,
                                    'Referer': 'https://' + LOBBY_HOST + '/login/hotel-bah-a-79-apartasuite',
                                    'User-Agent': 'Mozilla/5.0 b79-proxy/8.0'
                    }
        }, mp2.body);
        cookies = mergeCookies(cookies, r2.headers['set-cookie']);
        let users;
        try { users = JSON.parse(r2.body); } catch (e) { return { ok: false, step: 'users_parse', body: r2.body.slice(0, 200) }; }
        const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const target = norm(LOBBY_USER_NAME);
        const user = users.find(u => norm(u.nombre_completo) === target) || users[0];
        if (!user || !user.hashId) return { ok: false, step: 'no_user_match', users_count: users.length };

    // Step 3: validarDatos
    const mp3 = buildMultipart({ hashId: user.hashId, password: LOBBY_PASS });
        const r3 = await rawRequest({
                    host: LOBBY_HOST, port: 443, method: 'POST',
                    path: '/entrar/validarDatos?view=web',
                    headers: {
                                    'Content-Type': mp3.contentType,
                                    'Content-Length': Buffer.byteLength(mp3.body),
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Cookie': cookies,
                                    'Origin': 'https://' + LOBBY_HOST,
                                    'Referer': 'https://' + LOBBY_HOST + '/login/hotel-bah-a-79-apartasuite',
                                    'User-Agent': 'Mozilla/5.0 b79-proxy/8.0'
                    }
        }, mp3.body);
        cookies = mergeCookies(cookies, r3.headers['set-cookie']);

    if (r3.statusCode !== 200) return { ok: false, step: 'validarDatos', status: r3.statusCode, body: r3.body.slice(0, 200) };

    SESSION_COOKIES = cookies;
        SESSION_EXPIRES = Date.now() + 30 * 60 * 1000; // 30 min
    return { ok: true, user: user.nombre_completo };
}

async function ensureSession() {
        if (SESSION_COOKIES && Date.now() < SESSION_EXPIRES) return { ok: true, cached: true };
        return await loginLobby();
}

async function fetchDashboard(action, date) {
        const sess = await ensureSession();
        if (!sess.ok) return { ok: false, error: 'login_failed', detail: sess };
        const path = `/dashboard/${action}?date=${date}&pagina=1`;
        const r = await rawRequest({
                    host: LOBBY_HOST, port: 443, method: 'GET', path,
                    headers: {
                                    'Accept': 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Cookie': SESSION_COOKIES,
                                    'Referer': 'https://' + LOBBY_HOST + '/dashboard',
                                    'User-Agent': 'Mozilla/5.0 b79-proxy/8.0'
                    }
        });
        if (r.statusCode === 401 || r.statusCode === 403) {
                    SESSION_COOKIES = ''; SESSION_EXPIRES = 0;
                    const retry = await ensureSession();
                    if (!retry.ok) return { ok: false, error: 'reauth_failed' };
                    return await fetchDashboard(action, date);
        }
        try { return { ok: true, data: JSON.parse(r.body) }; }
        catch (e) { return { ok: false, error: 'parse', body: r.body.slice(0, 200) }; }
}

function shapeGuest(g) {
        return {
                    nombre: g.nombre_completo || '',
                    habitacion: g.nombre_cuarto || '',
                    identificacion: g.identificacion || '',
                    email: g.email || '',
                    telefono: g.telefono || '',
                    fecha_ingreso: g.fecha_ingreso || '',
                    fecha_salida: g.fecha_salida || '',
                    total: g.total_a_pagar || 0,
                    impuesto: g.impuesto || 0,
                    estatus: g.estatus || '',
                    agencia: g.agencia || '',
                    plan: g.plan || '',
                    adultos: g.adultos || 0,
                    ninos: g.ninos || 0,
                    notas: g.notas || '',
                    codigo_reserva: g.codigo_reserva || g.id || ''
        };
}

function dedupGuests(arr) {
        const seen = new Set();
        const out = [];
        for (const g of arr) {
                    const key = (g.codigo_reserva || g.identificacion || g.nombre + g.habitacion);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push(g);
        }
        return out;
}

async function handleAction(action, query) {
        const date = query.date || new Date().toISOString().slice(0, 10);
        if (action === 'ip') {
                    const r = await rawRequest({ host: 'api.ipify.org', port: 443, method: 'GET', path: '/?format=json' });
                    return { ok: true, ip: r.body };
        }
        if (action === 'debug') {
                    return { ok: true, version: '8.0', login: !!SESSION_COOKIES, expires_in: SESSION_EXPIRES > Date.now() ? Math.floor((SESSION_EXPIRES - Date.now()) / 1000) : 0 };
        }
        if (action === 'login_test') {
                    SESSION_COOKIES = ''; SESSION_EXPIRES = 0;
                    const r = await loginLobby();
                    return { ok: r.ok, has_cookies: !!SESSION_COOKIES, detail: r };
        }
        if (action === 'aseo' || action === 'in_house') {
                    const r = await fetchDashboard('getInHouse', date);
                    if (!r.ok) return r;
                    const list = (r.data?.data?.in_house || []).map(shapeGuest);
                    return { ok: true, date, total: list.length, huespedes: list };
        }
        if (action === 'llegadas') {
                    const r = await fetchDashboard('getLlegadas', date);
                    if (!r.ok) return r;
                    const list = (r.data?.data?.llegadas || []).map(shapeGuest);
                    return { ok: true, date, total: list.length, huespedes: list };
        }
        if (action === 'salidas') {
                    const r = await fetchDashboard('getSalidas', date);
                    if (!r.ok) return r;
                    const list = (r.data?.data?.salidas || []).map(shapeGuest);
                    return { ok: true, date, total: list.length, huespedes: list };
        }
        if (action === 'facturacion' || action === 'all') {
                    const [ih, ll, sl] = await Promise.all([
                                    fetchDashboard('getInHouse', date),
                                    fetchDashboard('getLlegadas', date),
                                    fetchDashboard('getSalidas', date)
                                ]);
                    const all = []
                                    .concat((ih.data?.data?.in_house || []).map(shapeGuest))
                        .concat((ll.data?.data?.llegadas || []).map(shapeGuest))
                        .concat((sl.data?.data?.salidas || []).map(shapeGuest));
                    return { ok: true, date, total: dedupGuests(all).length, huespedes: dedupGuests(all) };
        }
        return { ok: false, error: 'unknown_action', action };
}

const server = http.createServer(async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(204, CORS_HEADERS); res.end(); return; }
        const url = new URL(req.url, 'http://localhost');
        const query = {};
        for (const [k, v] of url.searchParams) query[k] = v;
        const action = query.action || 'debug';
        try {
                    const result = await handleAction(action, query);
                    res.writeHead(result.ok ? 200 : 500, CORS_HEADERS);
                    res.end(JSON.stringify(result));
        } catch (e) {
                    res.writeHead(500, CORS_HEADERS);
                    res.end(JSON.stringify({ ok: false, error: e.message, stack: e.stack?.split('\n').slice(0, 3) }));
        }
});

server.listen(PORT, () => console.log('b79-proxy v8.0 listening on', PORT));
