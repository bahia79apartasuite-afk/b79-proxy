const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || 'LobbyPMS$84*!';
const LOBBY_TOKEN = process.env.LOBBY_TOKEN;
const PORT = process.env.PORT || 3000;
const LOBBY_BASE = 'https://app.lobbypms.com/api/v1';
const LOBBY_PROPERTY_ID = process.env.LOBBY_PROPERTY_ID || '14965';
const NETLIFY_BASE = 'https://b79systemcleaning.netlify.app';
const B79_TOKEN = process.env.B79_TOKEN || 'b79secure2024';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-B79-Token',
    'Content-Type': 'application/json',
};

const HTML_CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/html; charset=utf-8',
};

function log(level, msg, extra) {
    const ts = new Date().toISOString();
    const out = { ts, level, msg };
    if (extra !== undefined) out.extra = extra;
    console.log(JSON.stringify(out));
}

function getAuthHeader() {
    if (LOBBY_TOKEN) return 'Bearer ' + LOBBY_TOKEN;
    if (LOBBY_USER && LOBBY_PASS) {
          const cred = Buffer.from(LOBBY_USER + ':' + LOBBY_PASS).toString('base64');
          return 'Basic ' + cred;
    }
    return '';
}

function verifyToken(req) {
    const auth = req.headers['authorization'] || '';
    const xtoken = req.headers['x-b79-token'] || '';
    if (auth === 'Bearer ' + B79_TOKEN) return true;
    if (xtoken === B79_TOKEN) return true;
    return false;
}

function fetchURL(urlStr, maxRedirects) {
    if (maxRedirects === undefined) maxRedirects = 5;
    return new Promise((resolve, reject) => {
          function doRequest(currentUrl, remaining) {
                  const parsed = new URL(currentUrl);
                  const opts = {
                            hostname: parsed.hostname,
                            path: parsed.pathname + parsed.search,
                            method: 'GET',
                            headers: { 'User-Agent': 'B79-Proxy/4.0', 'Accept': '*/*' }
                  };
                  const r = https.request(opts, res => {
                            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && remaining > 0) {
                                        const next = res.headers.location.startsWith('http') ? res.headers.location : parsed.origin + res.headers.location;
                                        res.resume();
                                        return doRequest(next, remaining - 1);
                            }
                            let data = '';
                            res.on('data', c => data += c);
                            res.on('end', () => resolve({ status: res.statusCode, body: data, contentType: res.headers['content-type'] || '' }));
                  });
                  r.on('error', reject);
                  r.setTimeout(15000, () => { r.abort(); reject(new Error('Timeout')); });
                  r.end();
          }
          doRequest(urlStr, maxRedirects);
    });
}

function fetchLobby(path) {
    return new Promise((resolve, reject) => {
          const url = new URL(LOBBY_BASE + path);
          const opts = {
                  hostname: url.hostname,
                  path: url.pathname + url.search,
                  method: 'GET',
                  headers: {
                            'Authorization': getAuthHeader(),
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'User-Agent': 'B79-Proxy/4.0'
                  }
          };
          const r = https.request(opts, res => {
                  let data = '';
                  res.on('data', c => data += c);
                  res.on('end', () => {
                            try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                            catch(e) { resolve({ status: res.statusCode, body: data }); }
                  });
          });
          r.on('error', reject);
          r.setTimeout(20000, () => { r.abort(); reject(new Error('Lobby timeout')); });
          r.end();
    });
}

function extractBookings(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && Array.isArray(body.bookings)) return body.bookings;
    if (body && Array.isArray(body.reservations)) return body.reservations;
    return [];
}

function normalizeForBilling(b) {
    const checkin = b.checkin || b.check_in || b.arrival_date || b.from || '';
    const checkout = b.checkout || b.check_out || b.departure_date || b.to || '';
    const nights = b.nights || b.number_of_nights || 0;
    const rate = Number(b.rate || b.room_rate || b.daily_rate || 0);
    const subtotal = Number((rate * nights) || b.total || b.amount || b.subtotal || 0);
    const iva = Math.round(subtotal * 0.19);
    return {
          id: b.booking_id || b.reservation_id || b.id || '',
          guest: (b.guest && b.guest.name) || b.guest_name || b.client || '',
          document: (b.guest && (b.guest.document || b.guest.id_number)) || b.document || '',
          email: (b.guest && b.guest.email) || b.email || '',
          phone: (b.guest && b.guest.phone) || b.phone || b.telephone || '',
          room: (b.room && b.room.name) || b.room_number || b.room || '',
          category: (b.room && b.room.room_type && b.room.room_type.name) || b.room_type || b.category || '',
          checkin: checkin,
          checkout: checkout,
          nights: nights,
          rate: rate,
          subtotal: subtotal,
          iva: iva,
          total: subtotal + iva,
          status: b.status || '',
          notes: b.notes || b.observations || ''
    };
}

function normalizeForAseo(b) {
    return {
          booking_id: b.booking_id || b.id || '',
          room: (b.room && b.room.name) || b.room_number || b.room || 'Sin numero',
          guest: (b.guest && b.guest.name) || b.guest_name || 'Sin nombre',
          phone: (b.guest && b.guest.phone) || b.phone || '',
          checkin: b.checkin || b.check_in || b.arrival_date || '',
          checkout: b.checkout || b.check_out || b.departure_date || '',
          status: b.status || 'inhouse',
          notes: b.notes || b.observations || ''
    };
}

const PORTAL_URL = 'https://b79systemcleaning.netlify.app/';
const PORTAL_CSS = '<style id="portal-nav-styles">.portal-btn{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:8px 16px!important;background:linear-gradient(135deg,#1a237e 0%,#283593 100%)!important;color:#fff!important;border:none!important;border-radius:8px!important;font-size:13px!important;font-weight:600!important;text-decoration:none!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(26,35,126,0.3)!important;transition:all 0.2s ease!important;white-space:nowrap!important}.portal-btn:hover{background:linear-gradient(135deg,#283593 0%,#3949ab 100%)!important;box-shadow:0 4px 12px rgba(26,35,126,0.4)!important;transform:translateY(-1px)!important;color:#fff!important;text-decoration:none!important}</style>';
const PORTAL_BTN = '<a href="' + PORTAL_URL + '" class="portal-btn" title="Regresar al Portal B79">&#127968; Regresar al portal</a>';

const PAGE_MAP = {
    'aseo': '/b79-aseo/',
    'facturacion': '/b79-facturacion/',
    'jacuzzi': '/b79-jacuzzi/',
    'cajamenor': '/b79-caja-menor/',
    'index': '/'
};

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
          res.writeHead(200, CORS_HEADERS);
          return res.end();
    }

                                   const url = new URL(req.url, 'http://localhost:' + PORT);
    const action = url.searchParams.get('action') || '';
    const page = url.searchParams.get('page') || '';

                                   log('info', 'request', { method: req.method, url: req.url, action: action });

                                   if (!action || action === 'health') {
                                         res.writeHead(200, CORS_HEADERS);
                                         return res.end(JSON.stringify({
                                                 ok: true,
                                                 service: 'B79 LobbyPMS Proxy',
                                                 status: 'running',
                                                 version: '4.0',
                                                 auth_mode: LOBBY_TOKEN ? 'bearer_token' : 'basic_auth',
                                                 property_id: LOBBY_PROPERTY_ID
                                         }));
                                   }

                                   if (action === 'html') {
                                         const netPath = PAGE_MAP[page];
                                         if (!netPath) {
                                                 res.writeHead(404, HTML_CORS_HEADERS);
                                                 return res.end('<html><body><h2>Page not found</h2></body></html>');
                                         }
                                         try {
                                                 const result = await fetchURL(NETLIFY_BASE + netPath);
                                                 let html = result.body;
                                                 html = html.replace('</head>', PORTAL_CSS + '\n</head>');
                                                 res.writeHead(200, HTML_CORS_HEADERS);
                                                 return res.end(html);
                                         } catch(e) {
                                                 log('error', 'html fetch error', e.message);
                                                 res.writeHead(500, HTML_CORS_HEADERS);
                                                 return res.end('<html><body><h2>Error</h2><p>' + e.message + '</p></body></html>');
                                         }
                                   }

                                   if (!verifyToken(req)) {
                                         res.writeHead(401, CORS_HEADERS);
                                         return res.end(JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid X-B79-Token header' }));
                                   }

                                   if (action === 'debug') {
                                         try {
                                                 const authHeader = getAuthHeader();
                                                 const result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?limit=5');
                                                 res.writeHead(200, CORS_HEADERS);
                                                 return res.end(JSON.stringify({
                                                           ok: true,
                                                           auth_header_type: authHeader.split(' ')[0],
                                                           property_id: LOBBY_PROPERTY_ID,
                                                           result_status: result.status,
                                                           result_body_preview: typeof result.body === 'string' ? result.body.substring(0,500) : JSON.stringify(result.body).substring(0,500)
                                                 }));
                                         } catch(e) {
                                                 res.writeHead(500, CORS_HEADERS);
                                                 return res.end(JSON.stringify({ error: e.message }));
                                         }
                                   }

                                   if (action === 'inhouse' || action === 'rooms' || action === 'aseo') {
                                         try {
                                                 const today = new Date().toISOString().split('T')[0];
                                                 let result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?checkin_from=' + today + '&checkin_to=' + today + '&status=inhouse');
                                                 let bookings = extractBookings(result.body);
                                                 if (bookings.length === 0) {
                                                           result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?status=inhouse');
                                                           bookings = extractBookings(result.body);
                                                 }
                                                 if (bookings.length === 0) {
                                                           const past = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
                                                           result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?creation_date_from=' + past);
                                                           bookings = extractBookings(result.body);
                                                 }
                                                 const rooms = bookings.map(normalizeForAseo);
                                                 res.writeHead(200, CORS_HEADERS);
                                                 return res.end(JSON.stringify({ ok: true, data: rooms, count: rooms.length, source: 'lobbypms' }));
                                         } catch(e) {
                                                 log('error', 'inhouse error', e.message);
                                                 res.writeHead(500, CORS_HEADERS);
                                                 return res.end(JSON.stringify({ error: e.message }));
                                         }
                                   }

                                   if (action === 'facturacion' || action === 'billing') {
                                         try {
                                                 const today = new Date().toISOString().split('T')[0];
                                                 const past = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
                                                 let result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?checkin_from=' + past + '&checkin_to=' + today);
                                                 let bookings = extractBookings(result.body);
                                                 if (bookings.length === 0) {
                                                           result = await fetchLobby('/properties/' + LOBBY_PROPERTY_ID + '/bookings?creation_date_from=' + past);
                                                           bookings = extractBookings(result.body);
                                                 }
                                                 const billing = bookings.map(normalizeForBilling);
                                                 res.writeHead(200, CORS_HEADERS);
                                                 return res.end(JSON.stringify({ ok: true, data: billing, count: billing.length, source: 'lobbypms' }));
                                         } catch(e) {
                                                 log('error', 'facturacion error', e.message);
                                                 res.writeHead(500, CORS_HEADERS);
                                                 return res.end(JSON.stringify({ error: e.message }));
                                         }
                                   }

                                   res.writeHead(400, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Unknown action', action: action, validActions: ['health','inhouse','aseo','facturacion','debug','html'] }));
});

server.listen(PORT, () => log('info', 'B79 Proxy v4.0 running on port ' + PORT));
