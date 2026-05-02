const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || '';
const LOBBY_TOKEN = process.env.LOBBY_TOKEN || '';
const PORT = process.env.PORT || 3000;
const LOBBY_BASE = process.env.LOBBY_BASE || 'https://app.lobbypms.com/api/v1';
const LOBBY_PROPERTY_ID = process.env.LOBBY_PROPERTY_ID || '14965';
const NETLIFY_BASE = 'https://b79systemcleaning.netlify.app';
const B79_TOKEN = process.env.B79_TOKEN || 'b79secure2024';

const CORS_HEADERS = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-B79-Token',
                'Content-Type': 'application/json',
};

function fetchJSON(url, options) {
                return new Promise((resolve, reject) => {
                                        const u = new URL(url);
                                        const lib = u.protocol === 'https:' ? https : http;
                                        const req = lib.request({
                                                                        hostname: u.hostname,
                                                                        port: u.port || (u.protocol === 'https:' ? 443 : 80),
                                                                        path: u.pathname + u.search,
                                                                        method: (options && options.method) || 'GET',
                                                                        headers: (options && options.headers) || {},
                                        }, (res) => {
                                                                        let chunks = [];
                                                                        res.on('data', (c) => chunks.push(c));
                                                                        res.on('end', () => {
                                                                                                                const body = Buffer.concat(chunks).toString('utf8');
                                                                                                                resolve({ status: res.statusCode, headers: res.headers, body });
                                                                                });
                                        });
                                        req.on('error', reject);
                                        if (options && options.body) req.write(options.body);
                                        req.end();
                });
}

async function getOutboundIP() {
                try {
                                        const r = await fetchJSON('https://api.ipify.org?format=json', { method: 'GET' });
                                        try { return JSON.parse(r.body).ip; } catch (e) { return r.body; }
                } catch (e) {
                                        return 'unknown:' + e.message;
                }
}

function buildAuthVariants(path) {
                const variants = [];
                const basicAuth = 'Basic ' + Buffer.from(LOBBY_USER + ':' + LOBBY_PASS).toString('base64');
                const sep = path.includes('?') ? '&' : '?';
                variants.push({ name: 'basic', url: LOBBY_BASE + path, headers: { 'Authorization': basicAuth, 'Accept': 'application/json' } });
                if (LOBBY_TOKEN) {
                                        variants.push({ name: 'bearer', url: LOBBY_BASE + path, headers: { 'Authorization': 'Bearer ' + LOBBY_TOKEN, 'Accept': 'application/json' } });
                                        variants.push({ name: 'token-header', url: LOBBY_BASE + path, headers: { 'Token': LOBBY_TOKEN, 'Accept': 'application/json' } });
                                        variants.push({ name: 'x-api-token', url: LOBBY_BASE + path, headers: { 'X-API-TOKEN': LOBBY_TOKEN, 'Accept': 'application/json' } });
                                        variants.push({ name: 'api-token-query', url: LOBBY_BASE + path + sep + 'api_token=' + encodeURIComponent(LOBBY_TOKEN), headers: { 'Accept': 'application/json' } });
                                        variants.push({ name: 'token-query', url: LOBBY_BASE + path + sep + 'token=' + encodeURIComponent(LOBBY_TOKEN), headers: { 'Accept': 'application/json' } });
                                        variants.push({ name: 'apikey-query', url: LOBBY_BASE + path + sep + 'apikey=' + encodeURIComponent(LOBBY_TOKEN), headers: { 'Accept': 'application/json' } });
                }
                return variants;
}

async function tryStrategies(path) {
                const variants = buildAuthVariants(path);
                const attempts = [];
                for (const v of variants) {
                                        try {
                                                                        const r = await fetchJSON(v.url, { method: 'GET', headers: v.headers });
                                                                        const ct = (r.headers['content-type'] || '').toLowerCase();
                                                                        const isJson = ct.includes('application/json') || (r.body && r.body.trim().startsWith('{')) || (r.body && r.body.trim().startsWith('['));
                                                                        attempts.push({ strategy: v.name, status: r.status, isJson, ct: r.headers['content-type'] });
                                                                        if (r.status >= 200 && r.status < 300 && isJson) {
                                                                                                                try { return { ok: true, strategy: v.name, data: JSON.parse(r.body), attempts }; }
                                                                                                                catch (e) { /* keep trying */ }
                                                                                }
                                        } catch (e) {
                                                                        attempts.push({ strategy: v.name, error: e.message });
                                        }
                }
                return { ok: false, strategy: null, attempts };
}

async function fetchLobby(paths) {
                const results = [];
                for (const path of paths) {
                                        const r = await tryStrategies(path);
                                        results.push({ path, ok: r.ok, strategy: r.strategy, attempts: r.attempts, data: r.data || null });
                                        if (r.ok) return { ok: true, strategy: r.strategy, data: r.data, tried: results };
                }
                return { ok: false, tried: results };
}

function normalizeRoom(s) {
                if (!s) return '';
                return String(s).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

function send(res, status, obj) {
                res.writeHead(status, CORS_HEADERS);
                res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
                const u = new URL(req.url, 'http://x');
                const action = u.searchParams.get('action') || 'health';

                                         if (req.method === 'OPTIONS') {
                                                                 res.writeHead(204, CORS_HEADERS);
                                                                 return res.end();
                                         }

                                         try {
                                                                 if (action === 'health') {
                                                                                                 return send(res, 200, {
                                                                                                                                         ok: true, service: 'B79 LobbyPMS Proxy', version: '6.0',
                                                                                                                                         strategies: ['basic','bearer','token-header','x-api-token','api-token-query','token-query','apikey-query'],
                                                                                                                                         property_id: LOBBY_PROPERTY_ID, base: LOBBY_BASE,
                                                                                                                                         hint: 'use ?action=ip to discover outbound IP for whitelist'
                                                                                                         });
                                                                 }
                                                                 if (action === 'ip') {
                                                                                                 const ip = await getOutboundIP();
                                                                                                 return send(res, 200, { ok: true, outbound_ip: ip, note: 'Add this IP to LobbyPMS API whitelist (Configuraciones > API > Restricciones)' });
                                                                 }
                                                                 if (action === 'debug') {
                                                                                                 const path = u.searchParams.get('path') || 'reservations';
                                                                                                 const ip = await getOutboundIP();
                                                                                                 const candidatePaths = [
                                                                                                                                         '/properties/' + LOBBY_PROPERTY_ID + '/bookings?limit=5',
                                                                                                                                         '/bookings?limit=5',
                                                                                                                                         '/reservations?limit=5',
                                                                                                                                         '/properties/' + LOBBY_PROPERTY_ID + '/reservations?limit=5',
                                                                                                                                         '/inhouse',
                                                                                                                                         '/rooms',
                                                                                                                                         '/properties/' + LOBBY_PROPERTY_ID,
                                                                                                                                         '/me', '/user', ''
                                                                                                                                 ];
                                                                                                 const out = [];
                                                                                                 for (const p of candidatePaths) {
                                                                                                                                         const r = await tryStrategies(p);
                                                                                                                                         out.push({ path: p, ok: r.ok, strategy: r.strategy, attempts: r.attempts, preview: r.data ? JSON.stringify(r.data).slice(0, 200) : null });
                                                                                                         }
                                                                                                 return send(res, 200, { ok: true, outbound_ip: ip, base: LOBBY_BASE, strategies: ['basic','bearer','token-header','x-api-token','api-token-query','token-query','apikey-query'], results: out });
                                                                 }
                                                                 if (action === 'aseo' || action === 'inhouse') {
                                                                                                 const r = await fetchLobby([
                                                                                                                                         '/properties/' + LOBBY_PROPERTY_ID + '/bookings?status=in_house&limit=200',
                                                                                                                                         '/bookings?property_id=' + LOBBY_PROPERTY_ID + '&status=in_house&limit=200',
                                                                                                                                         '/inhouse?property_id=' + LOBBY_PROPERTY_ID,
                                                                                                                                         '/reservations?property_id=' + LOBBY_PROPERTY_ID + '&status=in_house'
                                                                                                                                 ]);
                                                                                                 if (!r.ok) return send(res, 502, { ok: false, error: 'lobby_api_unreachable', tried: r.tried });
                                                                                                 const items = (r.data && (r.data.data || r.data.items || r.data.bookings || r.data)) || [];
                                                                                                 const out = (Array.isArray(items) ? items : []).map(b => ({
                                                                                                                                         id: b.id || b.booking_id,
                                                                                                                                         room_number: normalizeRoom(b.room_number || b.room || (b.unit && b.unit.name) || ''),
                                                                                                                                         guest: b.guest_name || (b.guest && b.guest.name) || '',
                                                                                                                                         check_in: b.check_in || b.start_date || b.arrival,
                                                                                                                                         check_out: b.check_out || b.end_date || b.departure,
                                                                                                                                         status: b.status || 'in_house',
                                                                                                         }));
                                                                                                 return send(res, 200, { ok: true, count: out.length, items: out });
                                                                 }
                                                                 if (action === 'facturacion') {
                                                                                                 const r = await fetchLobby([
                                                                                                                                         '/properties/' + LOBBY_PROPERTY_ID + '/invoices?limit=100',
                                                                                                                                         '/invoices?property_id=' + LOBBY_PROPERTY_ID + '&limit=100',
                                                                                                                                         '/billing?property_id=' + LOBBY_PROPERTY_ID
                                                                                                                                 ]);
                                                                                                 if (!r.ok) return send(res, 502, { ok: false, error: 'lobby_api_unreachable', tried: r.tried });
                                                                                                 return send(res, 200, { ok: true, data: r.data });
                                                                 }
                                                                 if (action === 'html') {
                                                                                                 res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                                                                                                 return res.end('<html><body><h1>B79 Proxy v6.0</h1><p>OK</p></body></html>');
                                                                 }
                                                                 return send(res, 400, { error: 'Unknown action', action, validActions: ['health','ip','inhouse','aseo','facturacion','debug','html'] });
                                         } catch (e) {
                                                                 return send(res, 500, { error: 'internal', message: e.message });
                                         }
});

server.listen(PORT, () => {
                console.log('B79 Proxy v6.0 listening on ' + PORT);
});
