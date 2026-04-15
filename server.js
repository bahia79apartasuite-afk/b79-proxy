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
          reject(new Error('LobbyPMS ' + res.statusCode + ': ' + data.slice(0,200)));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // Only GET allowed
  if (req.method !== 'GET') {
    res.writeHead(405, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ ok: true, service: 'B79 LobbyPMS Proxy', status: 'running' }));
    return;
  }

  // Parse action
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action') || 'rooms';

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
        data = await lobbyFetch('/rooms');
        break;
      case 'inhouse':
        data = await lobbyFetch('/rooms?filter=in_house');
        break;
      case 'checkin_today':
        data = await lobbyFetch('/rooms?filter=checkin_today');
        break;
      case 'checkout_today':
        data = await lobbyFetch('/rooms?filter=checkout_today');
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
      default:
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ ok: false, error: 'Accion desconocida: ' + action }));
        return;
    }

    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ ok: true, action, data }));

  } catch(err) {
    res.writeHead(500, CORS_HEADERS);
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log('B79 LobbyPMS Proxy corriendo en puerto ' + PORT);
});
