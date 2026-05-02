// b79-proxy server.js v8.1 - Two-step session-cookie auth (multipart) for LobbyPMS
const http = require('http');
const https = require('https');

const LOBBY_USER_NAME = (process.env.LOBBY_USER || 'Hotel Bahia 79 Apartasuite').trim();
const LOBBY_PASS = (process.env.LOBBY_PASS || '').trim();
const LOBBY_HOST = process.env.LOBBY_HOST || 'app.lobbypms.com';
const LOBBY_PROPERTY_ID = (process.env.LOBBY_PROPERTY_ID || '14965').trim();
const PORT = process.env.PORT || 3000;

const CORS_HEADERS = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-B79-Token',
            'Content-Type': 'application/json',
};

let SESSION_COOKIES = '';
let SESSION_EXPIRES = 0;
let LAST_LOGIN_DETAIL = null;

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
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2, 18);
            const parts = [];
            for (const [k, v] of Object.entries(fields)) {
                            parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
            }
            parts.push(Buffer.from(`--${boundary}--\r\n`));
            const body = Buffer.concat(parts);
            return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

function mergeCookies(existing, setCookieHeader) {
            const jar = {};
            if (existing) existing.split(/;\s*/).forEach(p => { const idx = p.indexOf('='); if (idx > 0) jar[p.slice(0, idx)] = p.slice(idx + 1); });
            if (setCookieHeader) {
                            const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                            arr.forEach(c => { const first = c.split(';')[0]; const idx = first.indexOf('='); if (idx > 0) jar[first.slice(0, idx).trim()] = first.slice(idx + 1); });
            }
            return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

const COMMON_HEADERS = () => ({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-ES,es;q=0.9',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://' + LOBBY_HOST,
});

async function loginLobby() {
            let cookies = '';
            LAST_LOGIN_DETAIL = { steps: [] };

    // Step 0: GET login page to obtain initial PHPSESSID
    const r0 = await rawRequest({
                    host: LOBBY_HOST, port: 443, method: 'GET',
                    path: '/entrar',
                    headers: { ...COMMON_HEADERS(), 'Accept': 'text/html' }
    });
            cookies = mergeCookies(cookies, r0.headers['set-cookie']);
            LAST_LOGIN_DETAIL.steps.push({ step: 'GET /entrar', status: r0.statusCode, cookies_len: cookies.length });

    // Step 1: validarhotel
    const mp1 = buildMultipart({ codigoHotel: LOBBY_PROPERTY_ID, lg: 'es' });
            const r1 = await rawRequest({
                            host: LOBBY_HOST, port: 443, method: 'POST',
                            path: '/entrar/validarhotel?view=web',
                            headers: {
                                                ...COMMON_HEADERS(),
                                                'Content-Type': mp1.contentType,
                                                'Content-Length': mp1.body.length,
                                                'Cookie': cookies,
                                                'Referer': 'https://' + LOBBY_HOST + '/entrar'
                            }
            }, mp1.body);
            cookies = mergeCookies(cookies, r1.headers['set-cookie']);
            LAST_LOGIN_DETAIL.steps.push({ step: 'validarhotel', status: r1.statusCode });
            if (r1.statusCode !== 200) return { ok: false, step: 'validarhotel', status: r1.statusCode, body: r1.body.slice(0, 200) };

    // Step 2: getPropertyUsers
    const mp2 = buildMultipart({ codigoHotel: LOBBY_PROPERTY_ID });
            const r2 = await rawRequest({
                            host: LOBBY_HOST, port: 443, method: 'POST',
                            path: '/entrar/getPropertyUsers',
                            headers: {
                                                ...COMMON_HEADERS(),
                                                'Content-Type': mp2.contentType,
                                                'Content-Length': mp2.body.length,
                                                'Cookie': cookies,
                                                'Referer': 'https://' + LOBBY_HOST + '/login/hotel-bah-a-79-apartasuite?lg=es'
                            }
            }, mp2.body);
            cookies = mergeCookies(cookies, r2.headers['set-cookie']);
            let users;
            try { users = JSON.parse(r2.body); } catch (e) { return { ok: false, step: 'users_parse', body: r2.body.slice(0, 200) }; }
            LAST_LOGIN_DETAIL.steps.push({ step: 'getPropertyUsers', status: r2.statusCode, users_count: users.length });
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
                                                ...COMMON_HEADERS(),
                                                'Content-Type': mp3.contentType,
                                                'Content-Length': mp3.body.length,
                                                'Cookie': cookies,
                                                'Referer': 'https://' + LOBBY_HOST + '/login/hotel-bah-a-79-apartasuite?lg=es'
                            }
            }, mp3.body);
            cookies = mergeCookies(cookies, r3.headers['set-cookie']);
            LAST_LOGIN_DETAIL.steps.push({ step: 'validarDatos', status: r3.statusCode, body: r3.body.slice(0, 200), pwd_len: LOBBY_PASS.length });

    if (r3.statusCode !== 200) return { ok: false, step: 'validarDatos', status: r3.statusCode, body: r3.body.slice(0, 200), pwd_len: LOBBY_PASS.length };

    SESSION_COOKIES = cookies;
            SESSION_EXPIRES = Date.now() + 30 * 60 * 1000;
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
                                                ...COMMON_HEADERS(),
                                                'Cookie': SESSION_COOKIES,
                                                'Referer': 'https://' + LOBBY_HOST + '/dashboard'
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
                            return { ok: true, version: '8.1', login: !!SESSION_COOKIES, expires_in: SESSION_EXPIRES > Date.now() ? Math.floor((SESSION_EXPIRES - Date.now()) / 1000) : 0, last_login_detail: LAST_LOGIN_DETAIL };
            }
            if (action === 'pwd_check') {
                            return { ok: true, user_name: LOBBY_USER_NAME, user_len: LOBBY_USER_NAME.length, pwd_len: LOBBY_PASS.length, pwd_chars: LOBBY_PASS.split('').map(c=>c.charCodeAt(0)), property: LOBBY_PROPERTY_ID };
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
                            const out = dedupGuests(all);
                            return { ok: true, date, total: out.length, huespedes: out };
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

server.listen(PORT, () => console.log('b79-proxy v8.1 listening on', PORT));
