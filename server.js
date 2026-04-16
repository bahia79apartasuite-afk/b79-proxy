const http = require('http');
const https = require('https');

const LOBBY_TOKEN = process.env.LOBBY_TOKEN;
const PORT = process.env.PORT || 3000;
const LOBBY_BASE = 'https://api.lobbypms.com/api/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function lobbyFetch(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(LOBBY_BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + LOBBY_TOKEN,
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
          catch(e) { reject(new Error('Parse error: ' + data.slice(0,100))); }
        } else {
          reject(new Error('HTTP_' + res.statusCode + ': ' + data.slice(0,300)));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS); res.end(); return;
  }

  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || 'health';

  if (action === 'health' || req.url === '/' || req.url === '/health') {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ ok: true, service: 'B79 LobbyPMS Proxy', status: 'running', version: '2.0' }));
    return;
  }

  if (!LOBBY_TOKEN) {
    res.writeHead(500, CORS_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'LOBBY_TOKEN no configurado' }));
    return;
  }

  try {
    let data;
    const today = new Date().toISOString().slice(0, 10);

    switch(action) {

      // ── ROOMS: categories + bookings combined for B79 SISTEM ──
      case 'rooms':
      case 'inhouse': {
        // Busca reservas de los últimos 30 días para capturar todos los huéspedes activos
        const dateFrom = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
        const dateTo   = new Date(Date.now() + 1*24*60*60*1000).toISOString().slice(0,10);
        let bookingsRes;
        try {
          bookingsRes = await lobbyFetch('/bookings?checkin_from=' + dateFrom + '&checkin_to=' + dateTo);
        } catch(e) {
          bookingsRes = { data: [] };
        }

        const bookings = bookingsRes.data || bookingsRes || [];

        // Solo checked_in=true Y checked_out=false = actualmente adentro
        const activeBookings = bookings.filter(b =>
          b.checked_in === true && b.checked_out === false
        );

        const result = activeBookings
          .map(b => ({
            room_number: b.assigned_room?.name || '',
            category_name: b.category?.name || '',
            category_id: b.category?.category_id || null,
            status: 'in_house',
            guest: {
              name: ((b.holder?.name || '') + ' ' + (b.holder?.surname || '')).trim(),
              phone: (b.holder?.phone || b.holder?.mobile || '').replace(/[^+0-9]/g,''),
              email: b.holder?.email || '',
            },
            checkin:    b.start_date || null,
            checkout:   b.end_date   || null,
            booking_id: b.booking_id || null,
          }))
          .filter(r => r.room_number);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true, action, data: result, raw_bookings: bookings.length, active: activeBookings.length }));
        return;
      }

            case 'bookings': {
        const dateFrom2 = url.searchParams.get('from') || new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
        const dateTo2   = url.searchParams.get('to')   || new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10);
        data = await lobbyFetch('/bookings?checkin_from=' + dateFrom2 + '&checkin_to=' + dateTo2);
        break;
      }

      case 'checkout_today': {
        data = await lobbyFetch('/bookings?checkout_from=' + today + '&checkout_to=' + today);
        break;
      }

      case 'checkin_today': {
        data = await lobbyFetch('/bookings?checkin_from=' + today + '&checkin_to=' + today);
        break;
      }

      case 'raw_rooms': {
        data = await lobbyFetch('/rooms');
        break;
      }

      case 'raw_bookings': {
        data = await lobbyFetch('/bookings?checkin_from=' + today + '&checkin_to=2026-12-31');
        break;
      }

      case 'test': {
        const paths = ['/rooms', '/bookings'];
        const results = {};
        for (const p of paths) {
          try {
            const r = await lobbyFetch(p);
            results[p] = { ok: true, sample: JSON.stringify(r).slice(0,150) };
          } catch(e) {
            results[p] = { ok: false, error: e.message };
          }
        }
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true, action: 'test', results }));
        return;
      }

      case 'calendar': {
        // Fetch all bookings for a date range (for calendar view)
        const calFrom = url.searchParams.get('from') || new Date(Date.now() - 5*24*60*60*1000).toISOString().slice(0,10);
        const calTo   = url.searchParams.get('to')   || new Date(Date.now() + 35*24*60*60*1000).toISOString().slice(0,10);
        let calRes;
        try {
          calRes = await lobbyFetch('/bookings?checkin_from=' + calFrom + '&checkin_to=' + calTo);
        } catch(e) {
          calRes = { data: [] };
        }
        // Also get bookings that started before calFrom but end within range (long stays)
        let calRes2;
        try {
          const longFrom = new Date(new Date(calFrom).getTime() - 30*24*60*60*1000).toISOString().slice(0,10);
          calRes2 = await lobbyFetch('/bookings?checkin_from=' + longFrom + '&checkin_to=' + calFrom);
        } catch(e) {
          calRes2 = { data: [] };
        }
        
        const allBookings = [
          ...(calRes.data || []),
          ...(calRes2.data || []).filter(b => b.end_date >= calFrom && !b.checked_out)
        ];

        // Remove duplicates
        const seen = new Set();
        const uniqueBookings = allBookings.filter(b => {
          if (seen.has(b.booking_id)) return false;
          seen.add(b.booking_id);
          return true;
        });

        const result = uniqueBookings.map(b => ({
          booking_id:   b.booking_id,
          room:         b.assigned_room?.name || '',
          category:     b.category?.name || '',
          category_id:  b.category?.category_id,
          guest:        ((b.holder?.name || '') + ' ' + (b.holder?.surname || '')).trim(),
          phone:        (b.holder?.phone || '').replace(/[^+0-9]/g,''),
          checkin:      b.start_date,
          checkout:     b.end_date,
          channel:      b.channel?.name || '',
          channel_id:   b.channel?.channel_id,
          checked_in:   b.checked_in,
          checked_out:  b.checked_out,
          total:        b.total_to_pay_accommodation || 0,
          paid:         b.paid_out || 0,
          nights:       Math.round((new Date(b.end_date) - new Date(b.start_date)) / 86400000),
          note:         b.note || '',
        }));

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true, action: 'calendar', data: result, total: result.length }));
        return;
      }

      default:
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ ok: false, error: 'Accion desconocida: ' + action }));
        return;
    }

    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ ok: true, action, data }));

  } catch(err) {
    console.error('Error:', err.message);
    res.writeHead(500, CORS_HEADERS);
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log('B79 LobbyPMS Proxy v2.0 corriendo en puerto ' + PORT);
});
