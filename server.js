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
        console.log('LobbyPMS response:', res.statusCode, data.slice(0,300));
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(new Error('Parse error: ' + data.slice(0,200))); }
        } else {
          reject(new Error('HTTP_' + res.statusCode + ': ' + data.slice(0,300)));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Get server's outbound IP
function getMyIP() {
  return new Promise((resolve) => {
    const req = https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).ip); }
        catch(e) { resolve('unknown'); }
      });
    });
    req.on('error', () => resolve('unknown'));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || 'health';

  // Health + IP check
  if (req.url === '/' || req.url === '/health' || action === 'health') {
    const ip = await getMyIP();
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ ok: true, service: 'B79 LobbyPMS Proxy', status: 'running', outbound_ip: ip }));
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
      // Try multiple endpoint formats for room status
      case 'rooms':
        try { data = await lobbyFetch('/room-status'); }
        catch(e1) {
          try { data = await lobbyFetch('/rooms'); }
          catch(e2) { throw new Error('rooms: ' + e1.message + ' | ' + e2.message); }
        }
        break;
      case 'inhouse':
        try { data = await lobbyFetch('/room-status?filter=in_house'); }
        catch(e1) {
          try { data = await lobbyFetch('/room-status'); }
          catch(e2) { throw new Error(e1.message); }
        }
        break;
      case 'checkin_today':
        data = await lobbyFetch('/room-status?filter=checkin_today');
        break;
      case 'checkout_today':
        data = await lobbyFetch('/room-status?filter=checkout_today');
        break;
      case 'bookings':
        data = await lobbyFetch('/bookings?checkin_from=' + today + '&checkin_to=' + today);
        break;
      case 'occupancy':
        const from = url.searchParams.get('from') || today;
        const to = url.searchParams.get('to') || today;
        data = await lobbyFetch('/daily-occupancy?date_from=' + from + '&date_to=' + to);
        break;
      case 'room_types':
        data = await lobbyFetch('/room-types');
        break;
      // Test endpoint — tries multiple paths to find what works
      case 'test':
        const paths = ['/room-status', '/rooms', '/room-types', '/bookings'];
        const results = {};
        for (const p of paths) {
          try {
            const r = await lobbyFetch(p);
            results[p] = { ok: true, sample: JSON.stringify(r).slice(0,100) };
          } catch(e) {
            results[p] = { ok: false, error: e.message };
          }
        }
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true, action: 'test', results }));
        return;
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
  console.log('B79 LobbyPMS Proxy corriendo en puerto ' + PORT);
});
