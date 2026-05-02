const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || 'LobbyPMS$84*!';
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

function basicAuth() {
        if (!LOBBY_USER || !LOBBY_PASS) return '';
        return 'Basic ' + Buffer.from(LOBBY_USER + ':' + LOBBY_PASS).toString('base64');
}

// Build candidate auth strategies in priority order
function authStrategies() {
        const out = [];
        if (LOBBY_USER && LOBBY_PASS) out.push({ name:'basic', kind:'header', headers:{ Authorization: basicAuth() } });
        if (LOBBY_TOKEN) {
                  out.push({ name:'bearer', kind:'header', headers:{ Authorization: 'Bearer ' + LOBBY_TOKEN } });
                  out.push({ name:'token-header', kind:'header', headers:{ 'Token': LOBBY_TOKEN } });
                  out.push({ name:'x-api-token', kind:'header', headers:{ 'X-API-Token': LOBBY_TOKEN } });
                  out.push({ name:'api-token-query', kind:'query', query:'api_token=' + encodeURIComponent(LOBBY_TOKEN) });
                  out.push({ name:'token-query', kind:'query', query:'token=' + encodeURIComponent(LOBBY_TOKEN) });
                  out.push({ name:'apikey-query', kind:'query', query:'api_key=' + encodeURIComponent(LOBBY_TOKEN) });
        }
        return out;
}

function fetchURL(urlStr, maxRedirects) {
        if (maxRedirects === undefined) maxRedirects = 5;
        return new Promise((resolve, reject) => {
                  function doRequest(currentUrl, remaining) {
                              const parsed = new URL(currentUrl);
                              const opts = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method:'GET', headers:{ 'User-Agent':'B79-Proxy/5.0', 'Accept':'*/*' } };
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

function lobbyRequest(path, strategy) {
        return new Promise((resolve, reject) => {
                  let fullPath = path;
                  if (strategy.kind === 'query') {
                              fullPath += (path.indexOf('?')>=0 ? '&' : '?') + strategy.query;
                  }
                  const url = new URL(LOBBY_BASE + fullPath);
                  const headers = Object.assign({
                              'Content-Type':'application/json',
                              'Accept':'application/json',
                              'User-Agent':'B79-Proxy/5.0'
                  }, strategy.headers || {});
                  const opts = { hostname: url.hostname, path: url.pathname + url.search, method:'GET', headers };
                  const r = https.request(opts, res => {
                              let data = '';
                              res.on('data', c => data += c);
                              res.on('end', () => {
                                            const ct = res.headers['content-type'] || '';
                                            const isJson = ct.indexOf('application/json') >= 0;
                                            let body = data;
                                            if (isJson) { try { body = JSON.parse(data); } catch(e) {} }
                                            resolve({ status: res.statusCode, body, isJson, contentType: ct, raw: data });
                              });
                  });
                  r.on('error', reject);
                  r.setTimeout(20000, () => { r.abort(); reject(new Error('Lobby timeout')); });
                  r.end();
        });
}

async function lobbyTryAll(path) {
        const strategies = authStrategies();
        const tried = [];
        for (const s of strategies) {
                  try {
                              const r = await lobbyRequest(path, s);
                              tried.push({ strategy: s.name, status: r.status, isJson: r.isJson, ct: r.contentType });
                              if (r.isJson) return { ok:true, strategy: s.name, result: r, tried };
                  } catch(e) {
                              tried.push({ strategy: s.name, error: e.message });
                  }
        }
        return { ok:false, strategy:null, result:null, tried };
}

function extractBookings(body) {
        if (Array.isArray(body)) return body;
        if (body && Array.isArray(body.data)) return body.data;
        if (body && Array.isArray(body.bookings)) return body.bookings;
        if (body && Array.isArray(body.reservations)) return body.reservations;
        if (body && Array.isArray(body.results)) return body.results;
        return [];
}

function normalizeForBilling(b) {
        const checkin = b.checkin || b.check_in || b.arrival_date || '';
        const checkout = b.checkout || b.check_out || b.departure_date || '';
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
        const guest = { name:(b.guest&&b.guest.name)||b.guest_name||'', phone:(b.guest&&b.guest.phone)||b.phone||'' };
        const warnings = [];
        if (!guest.name) warnings.push('sin_nombre');
        if (!guest.phone) warnings.push('sin_telefono');
        return {
                  booking_id: b.booking_id || b.id || '',
                  room_number: rn,
                  guest,
                  checkin: b.checkin || b.check_in || b.arrival_date || '',
                  checkout: b.checkout || b.check_out || b.departure_date || '',
                  status: b.status || 'inhouse',
                  channel: b.channel || b.source || '',
                  warnings: warnings.length ? warnings : null,
                  incomplete: warnings.length > 0,
                  notes: b.notes || b.observations || ''
        };
}

const PAGE_MAP = { 'aseo':'/b79-aseo/', 'facturacion':'/b79-facturacion/', 'jacuzzi':'/b79-jacuzzi/', 'cajamenor':'/b79-caja-menor/', 'index':'/' };

const server = http.createServer(async (req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(200, CORS_HEADERS); return res.end(); }

                                   const url = new URL(req.url, 'http://localhost:' + PORT);
        const action = url.searchParams.get('action') || '';
        const page = url.searchParams.get('page') || '';
        log('info','request',{ method:req.method, url:req.url, action });

                                   if (!action || action === 'health') {
                                             res.writeHead(200, CORS_HEADERS);
                                             return res.end(JSON.stringify({
                                                         ok:true, service:'B79 LobbyPMS Proxy', version:'5.0',
                                                         strategies: authStrategies().map(s=>s.name),
                                                         property_id: LOBBY_PROPERTY_ID,
                                                         base: LOBBY_BASE
                                             }));
                                   }

                                   if (action === 'html') {
                                             const netPath = PAGE_MAP[page];
                                             if (!netPath) { res.writeHead(404, HTML_CORS_HEADERS); return res.end('<html><body>Page not found</body></html>'); }
                                             try { const r = await fetchURL(NETLIFY_BASE + netPath); res.writeHead(200, HTML_CORS_HEADERS); return res.end(r.body); }
                                             catch(e) { res.writeHead(500, HTML_CORS_HEADERS); return res.end('<html><body>'+e.message+'</body></html>'); }
                                   }

                                   if (action === 'debug') {
                                             try {
                                                         const candidatePaths = [
                                                                       '/properties/' + LOBBY_PROPERTY_ID + '/bookings?limit=5',
                                                                       '/bookings?limit=5',
                                                                       '/reservations?limit=5',
                                                                       '/properties/' + LOBBY_PROPERTY_ID + '/reservations?limit=5',
                                                                       '/inhouse',
                                                                       '/rooms',
                                                                       '/properties/' + LOBBY_PROPERTY_ID,
                                                                       '/me',
                                                                       '/user',
                                                                       ''
                                                                     ];
                                                         const results = [];
                                                         for (const p of candidatePaths) {
                                                                       const tried = await lobbyTryAll(p);
                                                                       results.push({ path: p, ok: tried.ok, strategy: tried.strategy, attempts: tried.tried, preview: tried.result ? (typeof tried.result.body==='string'?tried.result.raw.substring(0,150):JSON.stringify(tried.result.body).substring(0,150)) : null });
                                                         }
                                                         res.writeHead(200, CORS_HEADERS);
                                                         return res.end(JSON.stringify({ ok:true, base: LOBBY_BASE, strategies: authStrategies().map(s=>s.name), results }));
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
                                                                       '/inhouse?property_id=' + LOBBY_PROPERTY_ID
                                                                     ];
                                                         let bookings = [];
                                                         let usedPath = null, usedStrategy = null, lastTried = null;
                                                         for (const p of paths) {
                                                                       const tried = await lobbyTryAll(p);
                                                                       lastTried = tried.tried;
                                                                       if (tried.ok) {
                                                                                       bookings = extractBookings(tried.result.body);
                                                                                       usedPath = p; usedStrategy = tried.strategy;
                                                                                       if (bookings.length) break;
                                                                       }
                                                         }
                                                         const rooms = bookings.map(normalizeForAseo);
                                                         const summary = {
                                                                       total: rooms.length,
                                                                       ocupadas: rooms.filter(r => /inhouse|in_house|ocupado/i.test(r.status)).length,
                                                                       incompletas: rooms.filter(r => r.incomplete).length
                                                         };
                                                         res.writeHead(200, CORS_HEADERS);
                                                         return res.end(JSON.stringify({ ok:true, data: rooms, count: rooms.length, summary, strategy: usedStrategy, path: usedPath, source:'lobbypms', diagnostic: lastTried }));
                                             } catch(e) {
                                                         log('error','inhouse error', e.message);
                                                         res.writeHead(500, CORS_HEADERS);
                                                         return res.end(JSON.stringify({ ok:false, error: e.message }));
                                             }
                                   }

                                   if (action === 'facturacion' || action === 'billing') {
                                             try {
                                                         const today = new Date().toISOString().split('T')[0];
                                                         const past = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
                                                         const paths = [
                                                                       '/properties/' + LOBBY_PROPERTY_ID + '/bookings?checkin_from=' + past + '&checkin_to=' + today,
                                                                       '/properties/' + LOBBY_PROPERTY_ID + '/bookings?creation_date_from=' + past,
                                                                       '/bookings?property_id=' + LOBBY_PROPERTY_ID + '&from=' + past + '&to=' + today
                                                                     ];
                                                         let bookings = [];
                                                         let usedPath = null, usedStrategy = null, lastTried = null;
                                                         for (const p of paths) {
                                                                       const tried = await lobbyTryAll(p);
                                                                       lastTried = tried.tried;
                                                                       if (tried.ok) {
                                                                                       bookings = extractBookings(tried.result.body);
                                                                                       usedPath = p; usedStrategy = tried.strategy;
                                                                                       if (bookings.length) break;
                                                                       }
                                                         }
                                                         const billing = bookings.map(normalizeForBilling);
                                                         const summary = {
                                                                       total: billing.length,
                                                                       subtotal: billing.reduce((s,b)=>s+b.subtotal,0),
                                                                       iva: billing.reduce((s,b)=>s+b.iva,0),
                                                                       total_amount: billing.reduce((s,b)=>s+b.total,0)
                                                         };
                                                         res.writeHead(200, CORS_HEADERS);
                                                         return res.end(JSON.stringify({ ok:true, data: billing, count: billing.length, summary, strategy: usedStrategy, path: usedPath, source:'lobbypms', diagnostic: lastTried }));
                                             } catch(e) {
                                                         log('error','facturacion error', e.message);
                                                         res.writeHead(500, CORS_HEADERS);
                                                         return res.end(JSON.stringify({ ok:false, error: e.message }));
                                             }
                                   }

                                   res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ error:'Unknown action', action, validActions:['health','inhouse','aseo','facturacion','debug','html'] }));
});

server.listen(PORT, () => log('info','B79 Proxy v5.0 running on port ' + PORT));
