const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || 'LobbyPMS$84*!';
const LOBBY_TOKEN = process.env.LOBBY_TOKEN || '';
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

function fetchURL(urlStr, maxRedirects) {
      if (maxRedirects === undefined) maxRedirects = 5;
      return new Promise((resolve, reject) => {
              function doRequest(currentUrl, remaining) {
                        const parsed = new URL(currentUrl);
                        const opts = {
                                    hostname: parsed.hostname,
                                    path: parsed.pathname + parsed.search,
                                    method: 'GET',
                                    headers: { 'User-Agent': 'B79-Proxy/4.1', 'Accept': '*/*' }
                        };
                        const r = https.request(opts, res => {
                                    if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location && remaining > 0) {
                                                  const next = res.headers.location.startsWith('http') ? res.headers.location : parsed.origin + res.headers.location;
                                                  res.resume();
                                                  return doRequest(next, remaining - 1);
                                    }
                                    let data = '';
                                    res.on('data', c => data += c);
                                    res.on('end', () => resolve({ status: res.statusCode, body: data }));
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
                                    'User-Agent': 'B79-Proxy/4.1'
                        }
              };
              const r = https.request(opts, res => {
                        let data = '';
                        res.on('data', c => data += c);
                        res.on('end', () => {
                                    const ct = res.headers['content-type'] || '';
                                    if (ct.indexOf('application/json') >= 0) {
                                                  try { return resolve({ status: res.statusCode, body: JSON.parse(data), isJson: true }); }
                                                  catch(e) { return resolve({ status: res.statusCode, body: data, isJson: false }); }
                                    }
                                    resolve({ status: res.statusCode, body: data, isJson: false });
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
      if (body && Array.isArray(body.results)) return body.results;
      return [];
}

async function tryLobbyPaths(paths) {
      let lastErr = null;
      for (const p of paths) {
              try {
                        const r = await fetchLobby(p);
                        if (r.isJson) {
                                    const arr = extractBookings(r.body);
                                    if (arr.length > 0 || (Array.isArray(r.body) || (r.body && (r.body.data || r.body.bookings || r.body.reservations)))) {
                                                  return { path: p, result: r, bookings: arr };
                                    }
                                    lastErr = { path: p, status: r.status, msg: 'json but empty' };
                        } else {
                                    lastErr = { path: p, status: r.status, msg: 'non-json (likely auth redirect)' };
                        }
              } catch(e) {
                        lastErr = { path: p, msg: e.message };
              }
      }
      return { path: null, result: null, bookings: [], lastErr };
}

function normalizeForBilling(b) {
      const checkin = b.checkin || b.check_in || b.arrival_date || b.from || '';
      const checkout = b.checkout || b.check_out || b.departure_date || b.to || '';
      const nights = Number(b.nights || b.number_of_nights || 0);
      const rate = Number(b.rate || b.room_rate || b.daily_rate || 0);
      const subtotal = Number((rate * nights) || b.total || b.amount || b.subtotal || 0);
      const iva = Math.round(subtotal * 0.19);
      return {
              id: b.booking_id || b.reservation_id || b.id || '',
              guest: (b.guest && b.guest.name) || b.guest_name || b.client || '',
              document: (b.guest && (b.guest.document || b.guest.id_number)) || b.document || '',
              email: (b.guest && b.guest.email) || b.email || '',
              phone: (b.guest && b.guest.phone) || b.phone || b.telephone || '',
              room_number: String((b.room && b.room.name) || b.room_number || b.room || '').replace(/[^0-9]/g,''),
              category: (b.room && b.room.room_type && b.room.room_type.name) || b.room_type || b.category || '',
              checkin, checkout, nights, rate, subtotal, iva,
              total: subtotal + iva,
              status: b.status || '',
              channel: b.channel || b.source || '',
              notes: b.notes || b.observations || ''
      };
}

function normalizeForAseo(b) {
      const rn = String((b.room && b.room.name) || b.room_number || b.room || '').replace(/[^0-9]/g,'');
      const guest = {
              name: (b.guest && b.guest.name) || b.guest_name || '',
              phone: (b.guest && b.guest.phone) || b.phone || ''
      };
      const warnings = [];
      if (!guest.name) warnings.push('sin_nombre');
      if (!guest.phone) warnings.push('sin_telefono');
      return {
              booking_id: b.booking_id || b.id || '',
              room_number: rn,
              guest: guest,
              checkin: b.checkin || b.check_in || b.arrival_date || '',
              checkout: b.checkout || b.check_out || b.departure_date || '',
              status: b.status || 'inhouse',
              channel: b.channel || b.source || '',
              warnings: warnings.length ? warnings : null,
              incomplete: warnings.length > 0,
              notes: b.notes || b.observations || ''
      };
}

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

                                   log('info', 'request', { method: req.method, url: req.url, action });

                                   if (!action || action === 'health') {
                                           res.writeHead(200, CORS_HEADERS);
                                           return res.end(JSON.stringify({
                                                     ok: true,
                                                     service: 'B79 LobbyPMS Proxy',
                                                     status: 'running',
                                                     version: '4.1',
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
                                                     res.writeHead(200, HTML_CORS_HEADERS);
                                                     return res.end(result.body);
                                           } catch(e) {
                                                     res.writeHead(500, HTML_CORS_HEADERS);
                                                     return res.end('<html><body><h2>Error</h2><p>' + e.message + '</p></body></html>');
                                           }
                                   }

                                   if (action === 'debug') {
                                           try {
                                                     const authHeader = getAuthHeader();
                                                     const candidatePaths = [
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/bookings?limit=5',
                                                                 '/bookings?limit=5',
                                                                 '/reservations?limit=5',
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/reservations?limit=5',
                                                                 '/inhouse',
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/inhouse'
                                                               ];
                                                     const results = [];
                                                     for (const p of candidatePaths) {
                                                                 try {
                                                                               const r = await fetchLobby(p);
                                                                               results.push({ path: p, status: r.status, isJson: r.isJson, preview: (typeof r.body === 'string' ? r.body : JSON.stringify(r.body)).substring(0, 200) });
                                                                 } catch(e) {
                                                                               results.push({ path: p, error: e.message });
                                                                 }
                                                     }
                                                     res.writeHead(200, CORS_HEADERS);
                                                     return res.end(JSON.stringify({
                                                                 ok: true,
                                                                 auth_header_type: authHeader.split(' ')[0],
                                                                 property_id: LOBBY_PROPERTY_ID,
                                                                 token_present: !!LOBBY_TOKEN,
                                                                 results
                                                     }));
                                           } catch(e) {
                                                     res.writeHead(500, CORS_HEADERS);
                                                     return res.end(JSON.stringify({ error: e.message }));
                                           }
                                   }

                                   if (action === 'inhouse' || action === 'rooms' || action === 'aseo') {
                                           try {
                                                     const today = new Date().toISOString().split('T')[0];
                                                     const past = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
                                                     const paths = [
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/bookings?status=inhouse',
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/bookings?checkin_from=' + past + '&checkin_to=' + today,
                                                                 '/bookings?property_id=' + LOBBY_PROPERTY_ID + '&status=inhouse',
                                                                 '/reservations?property_id=' + LOBBY_PROPERTY_ID + '&status=inhouse',
                                                                 '/inhouse?property_id=' + LOBBY_PROPERTY_ID
                                                               ];
                                                     const tried = await tryLobbyPaths(paths);
                                                     const rooms = tried.bookings.map(normalizeForAseo);
                                                     const summary = {
                                                                 total: rooms.length,
                                                                 ocupadas: rooms.filter(r => r.status === 'inhouse' || r.status === 'in_house' || r.status === 'ocupado').length,
                                                                 incompletas: rooms.filter(r => r.incomplete).length
                                                     };
                                                     res.writeHead(200, CORS_HEADERS);
                                                     return res.end(JSON.stringify({
                                                                 ok: true,
                                                                 data: rooms,
                                                                 count: rooms.length,
                                                                 summary,
                                                                 strategy: tried.path || 'none',
                                                                 source: 'lobbypms',
                                                                 diagnostic: tried.lastErr || null
                                                     }));
                                           } catch(e) {
                                                     log('error', 'inhouse error', e.message);
                                                     res.writeHead(500, CORS_HEADERS);
                                                     return res.end(JSON.stringify({ ok: false, error: e.message }));
                                           }
                                   }

                                   if (action === 'facturacion' || action === 'billing') {
                                           try {
                                                     const today = new Date().toISOString().split('T')[0];
                                                     const past = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
                                                     const paths = [
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/bookings?checkin_from=' + past + '&checkin_to=' + today,
                                                                 '/properties/' + LOBBY_PROPERTY_ID + '/bookings?creation_date_from=' + past,
                                                                 '/bookings?property_id=' + LOBBY_PROPERTY_ID + '&from=' + past + '&to=' + today,
                                                                 '/reservations?property_id=' + LOBBY_PROPERTY_ID + '&from=' + past + '&to=' + today
                                                               ];
                                                     const tried = await tryLobbyPaths(paths);
                                                     const billing = tried.bookings.map(normalizeForBilling);
                                                     const summary = {
                                                                 total: billing.length,
                                                                 subtotal: billing.reduce((s,b)=>s+b.subtotal,0),
                                                                 iva: billing.reduce((s,b)=>s+b.iva,0),
                                                                 total_amount: billing.reduce((s,b)=>s+b.total,0)
                                                     };
                                                     res.writeHead(200, CORS_HEADERS);
                                                     return res.end(JSON.stringify({
                                                                 ok: true,
                                                                 data: billing,
                                                                 count: billing.length,
                                                                 summary,
                                                                 strategy: tried.path || 'none',
                                                                 source: 'lobbypms',
                                                                 diagnostic: tried.lastErr || null
                                                     }));
                                           } catch(e) {
                                                     log('error', 'facturacion error', e.message);
                                                     res.writeHead(500, CORS_HEADERS);
                                                     return res.end(JSON.stringify({ ok: false, error: e.message }));
                                           }
                                   }

                                   res.writeHead(400, CORS_HEADERS);
      res.end(JSON.stringify({ error: 'Unknown action', action, validActions: ['health','inhouse','aseo','facturacion','debug','html'] }));
});

server.listen(PORT, () => log('info', 'B79 Proxy v4.1 running on port ' + PORT));
