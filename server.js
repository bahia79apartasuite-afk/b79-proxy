const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || '';
const LOBBY_TOKEN = process.env.LOBBY_TOKEN;
const PORT = process.env.PORT || 3000;
const LOBBY_BASE = 'https://api.lobbypms.com/api/v1';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

function log(level, msg, extra) {
    const ts = new Date().toISOString();
    const out = { ts, level, msg };
    if (extra !== undefined) out.extra = extra;
    console.log(JSON.stringify(out));
}

// Build auth header: Bearer token if configured, otherwise Basic auth
function getAuthHeader() {
    if (LOBBY_TOKEN) return 'Bearer ' + LOBBY_TOKEN;
    if (LOBBY_USER && LOBBY_PASS) {
          const cred = Buffer.from(LOBBY_USER + ':' + LOBBY_PASS).toString('base64');
          return 'Basic ' + cred;
    }
    return '';
}

function lobbyFetch(path) {
    return new Promise((resolve, reject) => {
          const url = new URL(LOBBY_BASE + path);
          const options = {
                  hostname: url.hostname,
                  path: url.pathname + url.search,
                  method: 'GET',
                  headers: {
                            'Authorization': getAuthHeader(),
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                  },
          };
          const req = https.request(options, (res) => {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                        try { resolve(JSON.parse(data)); }
                                        catch(e) { reject(new Error('ParseError: ' + data.slice(0, 200))); }
                            } else {
                                        reject(new Error('HTTP_' + res.statusCode + ': ' + data.slice(0, 400)));
                            }
                  });
          });
          req.on('error', reject);
          req.end();
    });
}

// Estrategia doble: checkin_from primero, si falla usa creation_date_from
async function fetchBookingsDual(dateFrom, dateTo) {
    const errors = [];

  try {
        const r = await lobbyFetch('/bookings?checkin_from=' + dateFrom + '&checkin_to=' + dateTo);
        const arr = r.data || r || [];
        if (Array.isArray(arr)) {
                log('info', 'OK via checkin_from', { count: arr.length });
                return { data: arr, strategy: 'checkin_from' };
        }
  } catch(e) {
        errors.push('checkin_from: ' + e.message);
        log('warn', 'checkin_from fallo, intentando creation_date_from', e.message);
  }

  try {
        const r2 = await lobbyFetch('/bookings?creation_date_from=' + dateFrom + '&creation_date_to=' + dateTo);
        const arr2 = r2.data || r2 || [];
        if (Array.isArray(arr2)) {
                log('info', 'OK via creation_date_from', { count: arr2.length });
                return { data: arr2, strategy: 'creation_date_from' };
        }
  } catch(e2) {
        errors.push('creation_date_from: ' + e2.message);
  }

  throw new Error('LobbyPMS no respondio: ' + errors.join(' | '));
}

function normalizeBooking(b, today) {
    const guestName = ((b.holder?.name || '') + ' ' + (b.holder?.surname || '')).trim();
    const roomNumber = b.assigned_room?.name || b.room_number || '';
    const checkIn = b.start_date || b.checkin_date || null;
    const checkOut = b.end_date || b.checkout_date || null;
    const status = b.checked_out ? 'checked_out' : b.checked_in ? 'checked_in' : 'reserved';

  const warnings = [];
    if (!guestName) warnings.push('sin_nombre');
    if (!roomNumber) warnings.push('sin_habitacion');
    if (!checkIn) warnings.push('sin_checkin');
    if (!checkOut) warnings.push('sin_checkout');
    if (!b.checked_in && checkIn && checkIn <= today) warnings.push('check_in_pendiente');

  return {
        booking_id: b.booking_id || b.id || null,
        room_number: roomNumber,
        category_name: b.category?.name || b.room_type?.name || '',
        category_id: b.category?.category_id || b.category?.id || null,
        status,
        guest: {
                name: guestName || 'DATO INCOMPLETO',
                phone: (b.holder?.phone || b.holder?.mobile || b.holder?.telephone || '').replace(/[^+0-9]/g, ''),
                email: b.holder?.email || '',
                document: b.holder?.document || b.holder?.id_number || '',
        },
        checkin: checkIn,
        checkout: checkOut,
        channel: b.channel?.name || b.source || '',
        checked_in: !!b.checked_in,
        checked_out: !!b.checked_out,
        total: b.total_to_pay_accommodation || b.total || b.amount || 0,
        paid: b.paid_out || b.paid || 0,
        note: b.note || b.comments || '',
        warnings: warnings.length ? warnings : null,
        incomplete: warnings.length > 0,
  };
}

// Normalize for billing/facturacion
function normalizeForBilling(b, today) {
    const base = normalizeBooking(b, today);
    return {
          ...base,
          nights: (() => {
                  if (base.checkin && base.checkout) {
                            const d1 = new Date(base.checkin);
                            const d2 = new Date(base.checkout);
                            return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
                  }
                  return 1;
          })(),
          subtotal: base.total,
          iva: Math.round((base.total || 0) * 0.19),
          total_with_iva: base.total + Math.round((base.total || 0) * 0.19),
          reservation_id: base.booking_id,
    };
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
          res.writeHead(200, CORS_HEADERS);
          res.end();
          return;
    }

                                   const url = new URL(req.url, 'http://localhost');
    const action = url.searchParams.get('action') || 'health';
    const syncId = Date.now().toString(36);
    const syncStart = Date.now();

                                   log('info', 'request', { action, syncId });

                                   if (action === 'health' || req.url === '/' || req.url === '/health') {
                                         res.writeHead(200, CORS_HEADERS);
                                         res.end(JSON.stringify({
                                                 ok: true, service: 'B79 LobbyPMS Proxy',
                                                 status: 'running', version: '3.1',
                                                 auth_mode: LOBBY_TOKEN ? 'bearer_token' : (LOBBY_USER ? 'basic_auth' : 'none'),
                                                 token_configured: !!(LOBBY_TOKEN || LOBBY_PASS),
                                         }));
                                         return;
                                   }

                                   const hasAuth = !!(LOBBY_TOKEN || LOBBY_PASS);
    if (!hasAuth) {
          res.writeHead(500, CORS_HEADERS);
          res.end(JSON.stringify({ ok: false, error: 'Auth no configurada. Configura LOBBY_TOKEN o LOBBY_PASS en Render' }));
          return;
    }

                                   const today = new Date().toISOString().slice(0, 10);

                                   try {
                                         let responsePayload;

      switch (action) {

        case 'inhouse':
        case 'rooms': {
                  const dateFrom = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const dateTo = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const { data: bookings, strategy } = await fetchBookingsDual(dateFrom, dateTo);

                  const activeBookings = bookings.filter(b => {
                              if (b.checked_out === true) return false;
                              if (b.checked_in === true) return true;
                              const startDate = b.start_date || b.checkin_date || '';
                              if (startDate && startDate <= today) return true;
                              return false;
                  });

                  const normalized = activeBookings
                    .map(b => normalizeBooking(b, today))
                    .filter(r => r.room_number);

                  const incompleteCount = normalized.filter(r => r.incomplete).length;

                  log('info', 'inhouse result', { syncId, strategy, raw: bookings.length, active: activeBookings.length, withRoom: normalized.length });

                  responsePayload = {
                              ok: true, action, syncId, strategy,
                              syncMs: Date.now() - syncStart,
                              data: normalized,
                              summary: {
                                            raw_bookings: bookings.length,
                                            active_bookings: activeBookings.length,
                                            with_room: normalized.length,
                                            incomplete_count: incompleteCount,
                                            synced_at: new Date().toISOString(),
                              },
                  };
                  break;
        }

        case 'facturacion':
        case 'billing': {
                  const dateFrom = url.searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const dateTo = url.searchParams.get('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const { data, strategy } = await fetchBookingsDual(dateFrom, dateTo);
                  const normalized = data
                    .filter(b => !b.checked_out)
                    .map(b => normalizeForBilling(b, today));
                  responsePayload = {
                              ok: true, action, syncId, strategy,
                              syncMs: Date.now() - syncStart,
                              data: normalized,
                              total: normalized.length,
                              summary: {
                                            occupied: normalized.filter(b => b.checked_in).length,
                                            pending_checkout: normalized.filter(b => b.status === 'reserved').length,
                                            synced_at: new Date().toISOString(),
                              }
                  };
                  break;
        }

        case 'bookings': {
                  const dateFrom = url.searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const dateTo = url.searchParams.get('to') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const { data, strategy } = await fetchBookingsDual(dateFrom, dateTo);
                  const normalized = data.map(b => normalizeBooking(b, today));
                  responsePayload = { ok: true, action, syncId, strategy, data: normalized, total: normalized.length };
                  break;
        }

        case 'checkin_today': {
                  const { data, strategy } = await fetchBookingsDual(today, today);
                  const filtered = data.filter(b => (b.start_date || b.checkin_date) === today);
                  const normalized = filtered.map(b => normalizeBooking(b, today));
                  responsePayload = { ok: true, action, syncId, strategy, data: normalized, total: normalized.length };
                  break;
        }

        case 'checkout_today': {
                  let coData = [], coStrategy = '';
                  try {
                              const r = await lobbyFetch('/bookings?checkout_from=' + today + '&checkout_to=' + today);
                              coData = r.data || r || [];
                              coStrategy = 'checkout_from';
                  } catch(e) {
                              log('warn', 'checkout_today: checkout_from fallo, usando dual', e.message);
                              const from60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                              const { data: d2, strategy: s2 } = await fetchBookingsDual(from60, today);
                              coData = d2.filter(b => (b.end_date || b.checkout_date) === today);
                              coStrategy = s2 + '_filtered';
                  }
                  const normalized = coData.map(b => normalizeBooking(b, today));
                  responsePayload = { ok: true, action, syncId, strategy: coStrategy, data: normalized, total: normalized.length };
                  break;
        }

        case 'calendar': {
                  const calFrom = url.searchParams.get('from') || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const calTo = url.searchParams.get('to') || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const { data: d1, strategy: s1 } = await fetchBookingsDual(calFrom, calTo);

                  let d2 = [];
                  try {
                              const longFrom = new Date(new Date(calFrom).getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                              const r2 = await fetchBookingsDual(longFrom, calFrom);
                              d2 = r2.data.filter(b => {
                                            const co = b.end_date || b.checkout_date || '';
                                            return co >= calFrom && b.checked_out !== true;
                              });
                  } catch(e) { log('warn', 'calendar: no se cargaron estancias largas', e.message); }

                  const seen = new Set();
                  const all = [...d1, ...d2].filter(b => {
                              if (seen.has(b.booking_id || b.id)) return false;
                              seen.add(b.booking_id || b.id);
                              return true;
                  });

                  const normalized = all.map(b => normalizeForBilling(b, today));
                  responsePayload = { ok: true, action, syncId, strategy: s1, data: normalized, total: normalized.length };
                  break;
        }

        case 'raw_rooms': {
                  const data = await lobbyFetch('/rooms');
                  responsePayload = { ok: true, action, syncId, data };
                  break;
        }

        case 'raw_bookings': {
                  const { data, strategy } = await fetchBookingsDual(today, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                  responsePayload = { ok: true, action, syncId, strategy, data, total: data.length };
                  break;
        }

        case 'test': {
                  const results = {};
                  try {
                              const r = await lobbyFetch('/rooms');
                              results['/rooms'] = { ok: true, sample: JSON.stringify(r).slice(0, 200) };
                  } catch(e) { results['/rooms'] = { ok: false, error: e.message }; }

                  try {
                              const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                              const dateTo = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                              const { data, strategy } = await fetchBookingsDual(dateFrom, dateTo);
                              results['/bookings'] = { ok: true, strategy, count: data.length, sample: JSON.stringify(data[0] || {}).slice(0, 200) };
                  } catch(e) { results['/bookings'] = { ok: false, error: e.message }; }

                  responsePayload = { ok: true, action: 'test', syncId, version: '3.1', auth_mode: LOBBY_TOKEN ? 'bearer' : 'basic', token_ok: !!(LOBBY_TOKEN || LOBBY_PASS), results };
                  break;
        }

        default: {
                  res.writeHead(400, CORS_HEADERS);
                  res.end(JSON.stringify({ ok: false, error: 'Accion desconocida: ' + action }));
                  return;
        }
      }

      log('info', 'response sent', { action, syncId, ms: Date.now() - syncStart });
                                         res.writeHead(200, CORS_HEADERS);
                                         res.end(JSON.stringify(responsePayload));

                                   } catch (err) {
                                         log('error', 'server error', { action, syncId, error: err.message });
                                         res.writeHead(500, CORS_HEADERS);
                                         res.end(JSON.stringify({
                                                 ok: false, error: err.message, action, syncId,
                                                 hint: 'Verifica LOBBY_TOKEN o LOBBY_PASS en Render. URL API: ' + LOBBY_BASE,
                                         }));
                                   }
});

server.listen(PORT, () => {
    log('info', 'B79 LobbyPMS Proxy v3.1 iniciado', { port: PORT, auth_mode: LOBBY_TOKEN ? 'bearer' : 'basic' });
});

// v3.1 - Basic Auth + Facturacion endpoint
