// b79-proxy server.js v9.1 - Two-step session-cookie auth (multipart) for LobbyPMS
//                          + action=html sirve las paginas operativas (ver pages.js)
//                          + portada, facturacion, jacuzzi y caja menor
//                          + clave compartida opcional (B79_CLAVE) en los datos
//                          + cuentas de usuario e historial (ver auth.js y db.js)
const http = require('http');
const https = require('https');
const { renderPage } = require('./pages');
const auth = require('./auth');
const db = require('./db');

const LOBBY_USER_NAME = (process.env.LOBBY_USER || 'Hotel Bahia 79 Apartasuite').trim();
const LOBBY_PASS = (process.env.LOBBY_PASS || '').trim();
const LOBBY_HOST = process.env.LOBBY_HOST || 'app.lobbypms.com';
const LOBBY_PROPERTY_ID = (process.env.LOBBY_PROPERTY_ID || '14965').trim();
const PORT = process.env.PORT || 3000;
// Clave compartida para los endpoints con datos de huespedes.
// Si esta vacia, el proxy queda abierto como siempre estuvo: asi, desplegar
// esta version antes de definirla en Render no tumba nada.
const B79_CLAVE = (process.env.B79_CLAVE || '').trim();

// Acciones que exponen datos de huespedes o diagnostico sensible.
// Quedan fuera: html (no lleva datos), debug e ip.
const ACCIONES_PROTEGIDAS = new Set([
            'aseo', 'in_house', 'llegadas', 'salidas', 'facturacion', 'all',
            'pwd_check', 'inspect_auth', 'login_test'
]);

// Acciones que exigen sesión de administrador.
const ACCIONES_ADMIN = new Set(['usuarios', 'crear_usuario', 'estado_usuario', 'historial']);

// Lee el cuerpo de un POST. Se usa para que la contraseña no viaje en la URL,
// donde quedaria escrita en los logs y en el historial del navegador.
function leerCuerpo(req) {
            return new Promise((resolve) => {
                            let datos = '';
                            req.on('data', c => {
                                                datos += c;
                                                if (datos.length > 1e5) { datos = ''; req.destroy(); }
                            });
                            req.on('end', () => {
                                                if (!datos) return resolve({});
                                                try { resolve(JSON.parse(datos)); } catch (e) { resolve({}); }
                            });
                            req.on('error', () => resolve({}));
            });
}

function tokenDe(req, query) {
            return (req.headers['x-b79-token'] || query.clave || '').trim();
}

function sesionDe(req, query) {
            return auth.leerSesion(tokenDe(req, query));
}

function ipDe(req) {
            const reenviada = req.headers['x-forwarded-for'];
            if (reenviada) return String(reenviada).split(',')[0].trim();
            return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : null;
}

function autorizado(req, query) {
            // 1. Una sesión de usuario abre la puerta por sí sola.
            if (sesionDe(req, query)) return true;

            // 2. La clave compartida sigue valiendo si está definida. Sirve para
            //    consultas manuales y para no romper nada que ya la use.
            if (B79_CLAVE) {
                            const enviada = tokenDe(req, query);
                            if (enviada.length !== B79_CLAVE.length) return false;
                            // comparacion de tiempo constante, para no filtrar la clave por lo que tarda
                            let diff = 0;
                            for (let i = 0; i < B79_CLAVE.length; i++) diff |= enviada.charCodeAt(i) ^ B79_CLAVE.charCodeAt(i);
                            return diff === 0;
            }

            // 3. Sin clave compartida: si el sistema ya tiene cuentas, los datos de
            //    huéspedes exigen sesión. Sin base de datos no hay forma de tener
            //    cuenta, así que ahí se mantiene el comportamiento antiguo y el
            //    proxy queda abierto, para no dejar el hotel sin herramientas.
            return !db.HAY_BASE;
}

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
            const user = users.find(u => norm(u.nombre_completo).includes('bahia 79')) || users.find(u => norm(u.nombre_completo) === target);
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
            if (action === 'html') {
                            // Sirve HTML, no JSON. No consulta LobbyPMS: la pagina pide
                            // sus datos despues, por su cuenta, a ?action=aseo|llegadas|salidas.
                            return { ok: true, __html: renderPage(query.page) };
            }
            if (action === 'ip') {
                            const r = await rawRequest({ host: 'api.ipify.org', port: 443, method: 'GET', path: '/?format=json' });
                            return { ok: true, ip: r.body };
            }
            if (action === 'debug') {
                            return { ok: true, version: '9.1', login: !!SESSION_COOKIES, clave_activa: !!B79_CLAVE, base_de_datos: db.HAY_BASE, secreto_efimero: auth.SECRETO_EFIMERO, expires_in: SESSION_EXPIRES > Date.now() ? Math.floor((SESSION_EXPIRES - Date.now()) / 1000) : 0, last_login_detail: LAST_LOGIN_DETAIL };
            }
            if (action === 'pwd_check') {
                            return { ok: true, user_name: LOBBY_USER_NAME, user_len: LOBBY_USER_NAME.length, pwd_len: LOBBY_PASS.length, pwd_chars: LOBBY_PASS.split('').map(c=>c.charCodeAt(0)), property: LOBBY_PROPERTY_ID };
            }
            if (action === 'inspect_auth') { const r = await rawRequest({ host: LOBBY_HOST, port: 443, method: 'GET', path: '/public/js/builds/auth/auth.js', headers: { ...COMMON_HEADERS(), 'Accept': '*/*' } }); const t = r.body; const idx = t.indexOf(query.q||'validarDatos'); return { ok: true, len: t.length, snippet: idx>-1 ? t.substring(idx-700, idx+500) : 'not found' }; } if (action === 'login_test') {
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


// --------------------------------------------------------------- identidad
// Estas acciones viven aparte de handleAction porque necesitan el request
// entero: el cuerpo del POST, la IP y la cabecera de sesión.

async function handleIdentidad(action, req, query) {
            const sesion = sesionDe(req, query);

            if (action === 'hay_usuarios') {
                            if (!db.HAY_BASE) return { estado: 200, cuerpo: { ok: true, base: false, hay: false } };
                            const r = await db.contarUsuarios();
                            if (!r.ok) return { estado: 500, cuerpo: { ok: false, error: r.error } };
                            return { estado: 200, cuerpo: { ok: true, base: true, hay: r.hay } };
            }

            if (action === 'yo') {
                            if (!sesion) return { estado: 401, cuerpo: { ok: false, error: 'sin_sesion' } };
                            return { estado: 200, cuerpo: { ok: true, usuario: {
                                                id: sesion.id, usuario: sesion.usuario, nombre: sesion.nombre, rol: sesion.rol,
                                                expira: sesion.exp
                            } } };
            }

            if (action === 'entrar') {
                            if (req.method !== 'POST') return { estado: 405, cuerpo: { ok: false, error: 'usa_post' } };
                            if (!db.HAY_BASE) return { estado: 503, cuerpo: { ok: false, error: 'sin_base_de_datos' } };
                            const cuerpo = await leerCuerpo(req);
                            const nombre = String(cuerpo.usuario || '').toLowerCase().trim();
                            const clave = String(cuerpo.clave || '');
                            if (!nombre || !clave) return { estado: 400, cuerpo: { ok: false, error: 'faltan_datos' } };

                            const r = await db.buscarUsuario(nombre);
                            if (!r.ok) return { estado: 500, cuerpo: { ok: false, error: r.error } };

                            const u = r.usuario;
                            const valida = u && auth.claveCorrecta(clave, u.sal, u.hash);
                            if (!valida) {
                                            await db.anotar({ usuario: nombre, accion: 'entrar_fallido', ip: ipDe(req) });
                                            // el mismo mensaje si el usuario no existe o si la clave está mal:
                                            // así nadie averigua qué cuentas existen probando nombres
                                            return { estado: 401, cuerpo: { ok: false, error: 'usuario_o_clave_incorrectos' } };
                            }

                            await db.anotar({ usuario_id: u.id, usuario: u.usuario, accion: 'entrar', ip: ipDe(req) });
                            return { estado: 200, cuerpo: {
                                            ok: true,
                                            token: auth.crearSesion(u),
                                            usuario: { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol }
                            } };
            }

            if (action === 'salir') {
                            if (sesion) await db.anotar({ usuario_id: sesion.id, usuario: sesion.usuario, accion: 'salir', ip: ipDe(req) });
                            return { estado: 200, cuerpo: { ok: true } };
            }

            if (action === 'cambiar_clave') {
                            if (req.method !== 'POST') return { estado: 405, cuerpo: { ok: false, error: 'usa_post' } };
                            if (!sesion) return { estado: 401, cuerpo: { ok: false, error: 'sin_sesion' } };
                            const cuerpo = await leerCuerpo(req);
                            const actual = String(cuerpo.actual || '');
                            const nueva = String(cuerpo.nueva || '');
                            if (nueva.length < 8) return { estado: 400, cuerpo: { ok: false, error: 'clave_muy_corta' } };
                            const r = await db.buscarUsuario(sesion.usuario);
                            if (!r.ok || !r.usuario) return { estado: 500, cuerpo: { ok: false, error: 'usuario_no_encontrado' } };
                            if (!auth.claveCorrecta(actual, r.usuario.sal, r.usuario.hash)) {
                                            return { estado: 401, cuerpo: { ok: false, error: 'clave_actual_incorrecta' } };
                            }
                            const { sal, hash } = auth.hashearClave(nueva);
                            const g = await db.cambiarClaveUsuario(r.usuario.id, sal, hash);
                            if (!g.ok) return { estado: 500, cuerpo: { ok: false, error: g.error } };
                            await db.anotar({ usuario_id: sesion.id, usuario: sesion.usuario, accion: 'cambiar_clave', ip: ipDe(req) });
                            return { estado: 200, cuerpo: { ok: true } };
            }

            // Alta del primer administrador. Sólo funciona mientras no exista
            // ningún usuario: en cuanto hay uno, esta puerta se cierra sola.
            if (action === 'primer_admin') {
                            if (req.method !== 'POST') return { estado: 405, cuerpo: { ok: false, error: 'usa_post' } };
                            if (!db.HAY_BASE) return { estado: 503, cuerpo: { ok: false, error: 'sin_base_de_datos' } };
                            const hay = await db.contarUsuarios();
                            if (!hay.ok) return { estado: 500, cuerpo: { ok: false, error: hay.error } };
                            if (hay.hay) return { estado: 409, cuerpo: { ok: false, error: 'ya_hay_usuarios' } };
                            const cuerpo = await leerCuerpo(req);
                            return await altaUsuario(cuerpo, 'admin', req, null);
            }

            if (action === 'usuarios') {
                            const r = await db.listarUsuarios();
                            if (!r.ok) return { estado: 500, cuerpo: { ok: false, error: r.error } };
                            return { estado: 200, cuerpo: { ok: true, usuarios: r.usuarios } };
            }

            if (action === 'crear_usuario') {
                            if (req.method !== 'POST') return { estado: 405, cuerpo: { ok: false, error: 'usa_post' } };
                            const cuerpo = await leerCuerpo(req);
                            return await altaUsuario(cuerpo, cuerpo.rol, req, sesion);
            }

            if (action === 'estado_usuario') {
                            if (req.method !== 'POST') return { estado: 405, cuerpo: { ok: false, error: 'usa_post' } };
                            const cuerpo = await leerCuerpo(req);
                            if (!cuerpo.id) return { estado: 400, cuerpo: { ok: false, error: 'falta_id' } };
                            if (sesion && cuerpo.id === sesion.id && cuerpo.activo === false) {
                                            return { estado: 400, cuerpo: { ok: false, error: 'no_puedes_desactivarte' } };
                            }
                            const r = await db.cambiarEstadoUsuario(cuerpo.id, cuerpo.activo);
                            if (!r.ok) return { estado: 500, cuerpo: { ok: false, error: r.error } };
                            await db.anotar({
                                            usuario_id: sesion && sesion.id, usuario: sesion && sesion.usuario,
                                            accion: cuerpo.activo ? 'activar_usuario' : 'desactivar_usuario',
                                            detalle: { id: cuerpo.id }, ip: ipDe(req)
                            });
                            return { estado: 200, cuerpo: { ok: true } };
            }

            if (action === 'historial') {
                            const r = await db.listarEventos({ limite: query.limite, desde: query.desde, usuario: query.usuario });
                            if (!r.ok) return { estado: 500, cuerpo: { ok: false, error: r.error } };
                            return { estado: 200, cuerpo: { ok: true, total: r.eventos.length, eventos: r.eventos } };
            }

            return null;
}

async function altaUsuario(cuerpo, rol, req, sesion) {
            const usuario = String(cuerpo.usuario || '').toLowerCase().trim();
            const nombre = String(cuerpo.nombre || '').trim();
            const clave = String(cuerpo.clave || '');
            if (!usuario || !nombre) return { estado: 400, cuerpo: { ok: false, error: 'faltan_datos' } };
            // Se admite un correo como nombre de acceso: mucha gente prefiere ese.
            // Lo que no se admite son espacios, que causan errores al escribirlo.
            if (!/^[a-z0-9._+@-]{3,64}$/.test(usuario)) return { estado: 400, cuerpo: { ok: false, error: 'usuario_invalido' } };
            if (clave.length < 8) return { estado: 400, cuerpo: { ok: false, error: 'clave_muy_corta' } };

            const { sal, hash } = auth.hashearClave(clave);
            const r = await db.crearUsuario({ usuario, nombre, rol, sal, hash });
            if (!r.ok) {
                            const repetido = String(JSON.stringify(r.detalle || '')).includes('duplicate');
                            return { estado: repetido ? 409 : 500,
                                     cuerpo: { ok: false, error: repetido ? 'usuario_ya_existe' : r.error } };
            }
            await db.anotar({
                            usuario_id: sesion && sesion.id, usuario: (sesion && sesion.usuario) || usuario,
                            accion: 'crear_usuario', detalle: { usuario, rol: rol === 'admin' ? 'admin' : 'personal' },
                            ip: ipDe(req)
            });
            return { estado: 201, cuerpo: { ok: true, usuario: { usuario, nombre, rol } } };
}

const server = http.createServer(async (req, res) => {
            if (req.method === 'OPTIONS') { res.writeHead(204, CORS_HEADERS); res.end(); return; }
            const url = new URL(req.url, 'http://localhost');
            const query = {};
            for (const [k, v] of url.searchParams) query[k] = v;
            const action = query.action || 'debug';

            // 1. Puerta de administración: exige sesión con rol admin.
            if (ACCIONES_ADMIN.has(action)) {
                            const s = sesionDe(req, query);
                            if (!s) { res.writeHead(401, CORS_HEADERS); res.end(JSON.stringify({ ok: false, error: 'sin_sesion' })); return; }
                            if (s.rol !== 'admin') { res.writeHead(403, CORS_HEADERS); res.end(JSON.stringify({ ok: false, error: 'solo_administradores' })); return; }
            }

            // 2. Puerta de datos: sesión de cualquier rol, o la clave compartida.
            if (ACCIONES_PROTEGIDAS.has(action) && !autorizado(req, query)) {
                            res.writeHead(401, CORS_HEADERS);
                            res.end(JSON.stringify({ ok: false, error: 'clave_requerida' }));
                            return;
            }

            try {
                            // 3. Acciones de identidad, que necesitan el request entero.
                            const identidad = await handleIdentidad(action, req, query);
                            if (identidad) {
                                            res.writeHead(identidad.estado, CORS_HEADERS);
                                            res.end(JSON.stringify(identidad.cuerpo));
                                            return;
                            }

                            const result = await handleAction(action, query);

                            // 4. Historial: se anota quién consultó qué, nunca a quién.
                            if (ACCIONES_PROTEGIDAS.has(action) && result.ok) {
                                            const s = sesionDe(req, query);
                                            db.anotar({
                                                                    usuario_id: s && s.id,
                                                                    usuario: (s && s.usuario) || 'clave-compartida',
                                                                    accion: 'consultar_' + action,
                                                                    detalle: { fecha: result.date, resultados: result.total },
                                                                    ip: ipDe(req)
                                            }).catch(() => {});
                            }
                            if (typeof result.__html === 'string') {
                                                res.writeHead(200, {
                                                                        ...CORS_HEADERS,
                                                                        'Content-Type': 'text/html; charset=utf-8',
                                                                        'Cache-Control': 'no-store'
                                                });
                                                res.end(result.__html);
                                                return;
                            }
                            res.writeHead(result.ok ? 200 : 500, CORS_HEADERS);
                            res.end(JSON.stringify(result));
            } catch (e) {
                            res.writeHead(500, CORS_HEADERS);
                            res.end(JSON.stringify({ ok: false, error: e.message, stack: e.stack?.split('\n').slice(0, 3) }));
            }
});

server.listen(PORT, () => console.log('b79-proxy v9.1 listening on', PORT));
