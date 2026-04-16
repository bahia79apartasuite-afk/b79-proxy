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

      case 'rooms':
      case 'inhouse': {
        const roomsRes = await lobbyFetch('/rooms');
        const dateFrom = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
        const dateTo   = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10);
        let bookingsRes;
        try {
          bookingsRes = await lobbyFetch('/bookings?checkin_from=' + dateFrom + '&checkin_to=' + dateTo);
        } catch(e) {
          bookingsRes = { data: [] };
        }
        const rooms = roomsRes.data || roomsRes || [];
        const bookings = bookingsRes.data || bookingsRes || [];
        const activeBookings = bookings.filter(b => {
          const status = (b.status || '').toLowerCase();
          return status === 'check_in' || status === 'checkin' ||
                 status === 'in_house' || status === 'in-house' ||
                 status === 'active' || status === 'confirmed' ||
                 b.checkin === today || b.checkout === today;
        });
        const result = [];
        rooms.forEach(room => {
          const name = room.name || '';
          const numMatch = name.match(/#?(\d+)/);
          const roomNum = numMatch ? numMatch[1] : String(room.category_id || '');
          const booking = activeBookings.find(b =>
            b.category && (
              b.category.category_id === room.category_id ||
              (b.category.name || '').includes(roomNum) ||
              String(b.room_number || '') === roomNum
            )
          );
          result.push({
            room_number: roomNum,
            category_name: name,
            category_id: room.category_id,
            status: booking ? 'in_house' : 'available',
            guest: booking ? {
              name: [booking.holder?.first_name, booking.holder?.last_name].filter(Boolean).join(' ') ||
                    booking.holder?.name || booking.name || '',
              phone: booking.holder?.phone || booking.holder?.mobile || booking.phone || '',
              email: booking.holder?.email || booking.email || '',
            } : null,
            checkin:  booking ? booking.checkin  : null,
            checkout: booking ? booking.checkout : null,
            booking_id: booking ? booking.booking_id : null,
          });
        });
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true, action, data: result, raw_rooms: rooms.length, raw_bookings: bookings.length, active: activeBookings.length }));
        return;
      }

      case 'bookings': {
        const dateFrom2 = url.searchParams.get('from') || new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
        const dateTo2   = url.searchParams.get('to')   || new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10);
        data = await lobbyFetch('/bookings?checkin_from=' + dateFrom2 + '&checkin_to=' + dateTo2);
        break;
      }

      case 'checkout_today':
        data = await lobbyFetch('/bookings?checkout_from=' + today + '&checkout_to=' + today);
        break;

      case 'checkin_today':
        data = await lobbyFetch('/bookings?checkin_from=' + today + '&checkin_to=' + today);
        break;

      case 'raw_rooms':
        data = await lobbyFetch('/rooms');
        break;

      case 'raw_bookings':
        data = await lobbyFetch('/bookings?checkin_from=' + today + '&checkin_to=2026-12-31');
        break;

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
