const http = require('http');
const https = require('https');

const LOBBY_USER = process.env.LOBBY_USER || 'developers';
const LOBBY_PASS = process.env.LOBBY_PASS || '';
const LOBBY_TOKEN = process.env.LOBBY_TOKEN;
const PORT = process.env.PORT || 3000;
const LOBBY_BASE = 'https://app.lobbypms.com/api/v1';
const NETLIFY_BASE = 'https://b79systemcleaning.netlify.app';

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
  if (auth === 'Bearer b79secure2024') return true;
  if (xtoken === 'b79secure2024') return true;
  return false;
}

function fetchLobby(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(LOBBY_BASE + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function fetchNetlify(path) {
  return new Promise((resolve, reject) => {
    https.get(NETLIFY_BASE + path, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const PORTAL_URL = 'https://b79systemcleaning.netlify.app/';

const PORTAL_CSS = `<style id="portal-nav-styles">
.portal-btn{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:8px 16px!important;background:linear-gradient(135deg,#1a237e 0%,#283593 100%)!important;color:#fff!important;border:none!important;border-radius:8px!important;font-size:13px!important;font-weight:600!important;text-decoration:none!important;cursor:pointer!important;box-shadow:0 2px 8px rgba(26,35,126,0.3)!important;transition:all 0.2s ease!important;white-space:nowrap!important}
.portal-btn:hover{background:linear-gradient(135deg,#283593 0%,#3949ab 100%)!important;box-shadow:0 4px 12px rgba(26,35,126,0.4)!important;transform:translateY(-1px)!important;color:#fff!important;text-decoration:none!important}
</style>`;

const PORTAL_BTN = `<a href="${PORTAL_URL}" class="portal-btn" title="Regresar al Portal B79">&#127968; Regresar al portal</a>`;

const SYNC_UI = `<div id="lobby-sync-bar" style="background:#E3F2FD;border-bottom:1px solid #90CAF9;padding:8px 24px;display:flex;align-items:center;gap:12px;font-size:13px;flex-wrap:wrap;">
  <span style="font-weight:600;color:#1565C0;">&#127968; Lobby PMS:</span>
  <span id="lobby-sync-status" style="color:#555;">Conectando&hellip;</span>
  <button onclick="sincronizarLobbyFact()" style="margin-left:auto;padding:6px 14px;background:#1565C0;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">&#8635; Sincronizar ahora</button>
</div>`;

const LOBBY_SYNC_JS = `
// ============ LOBBY PMS INTEGRATION v2 ============
const PROXY_BASE_FACT = 'https://b79-proxy.onrender.com';
async function sincronizarLobbyFact() {
  const statusEl = document.getElementById('lobby-sync-status');
  if(statusEl){statusEl.textContent='Sincronizando con Lobby PMS…';statusEl.style.color='#1565C0';}
  try {
    const res = await fetch(PROXY_BASE_FACT+'/?action=facturacion',{headers:{'X-B79-Token':'b79secure2024'}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(data.error)throw new Error(data.error);
    const reservas = data.data||[];
    window._lobbyReservas = reservas;
    if(statusEl){statusEl.textContent=reservas.length+' reservas de Lobby PMS';statusEl.style.color='#2E7D32';}
    const tb = document.querySelector('#reservas-table tbody,#facturas-body,.reservas-body');
    if(tb){
      tb.innerHTML='';
      reservas.slice(0,50).forEach(r=>{
        const tr=document.createElement('tr');
        tr.innerHTML='<td>'+(r.id||'')+'</td><td>'+(r.guest||'')+'</td><td>'+(r.room||'')+'</td><td>'+(r.checkin||'')+'</td><td>'+(r.checkout||'')+'</td><td>'+(r.nights||0)+'</td><td>$'+((r.subtotal||0).toLocaleString())+'</td><td>'+(r.status||'')+'</td>';
        tb.appendChild(tr);
      });
    }
  }catch(e){
    if(statusEl){statusEl.textContent='Error: '+e.message;statusEl.style.color='#C62828';}
    console.error('LobbyPMS:',e);
  }
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(sincronizarLobbyFact,1500));
// ============ END LOBBY PMS INTEGRATION ============`;

function modifyGenericHTML(html, isFacturacion) {
  html = html.replace('</head>', PORTAL_CSS + '\n</head>');
  html = html.replace(
    'class="brand"><div class="brand-logo">B7</div>',
    `class="brand" style="cursor:pointer;" onclick="window.location='${PORTAL_URL}'"><div class="brand-logo">B7</div>`
  );
  html = html.replace('<div class="topbar-right">', `<div class="topbar-right">\n${PORTAL_BTN}`);
  if (isFacturacion) {
    html = html.replace(/(<\/script>\s*<\/body>)/, '\n' + LOBBY_SYNC_JS + '\n</script>\n</body>');
    html = html.replace('<body>', '<body>\n' + SYNC_UI);
  }
  return html;
}

function modifyAseoHTML(html) {
  html = html.replace('</head>', PORTAL_CSS + '\n</head>');
  html = html.replace(/class="tb-logo" href="[^"]*"/, `class="tb-logo" href="${PORTAL_URL}"`);
  html = html.replace('class="tb-right">', `class="tb-right">\n    ${PORTAL_BTN}`);
  return html;
}

function normalizeForBilling(b) {
  const checkin = b.checkin || b.check_in || b.arrival_date || b.from || '';
  const checkout = b.checkout || b.check_out || b.departure_date || b.to || '';
  const nights = b.nights || b.number_of_nights || 0;
  const rate = b.rate || b.room_rate || b.daily_rate || 0;
  const subtotal = rate * nights || b.total || b.amount || 0;
  const iva = Math.round(subtotal * 0.19);
  return {
    id: b.booking_id || b.reservation_id || b.id || '',
    guest: b.guest?.name || b.guest_name || b.client || '',
    document: b.guest?.document || b.guest?.id_number || '',
    room: b.room?.name || b.room_number || b.room || '',
    category: b.room?.room_type?.name || b.room_type || b.category || '',
    checkin, checkout, nights,
    rate, subtotal, iva, total: subtotal + iva,
    status: b.status || '',
    notes: b.notes || b.observations || ''
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const action = url.searchParams.get('action') || '';
  const page = url.searchParams.get('page') || '';

  log('info', 'request', { method: req.method, url: req.url, action });

  // ============ STATIC HTML SERVING (proxy-modified pages) ============
  if (action === 'html') {
    const pageMap = {
      'aseo': '/b79-aseo.html',
      'facturacion': '/b79-facturacion.html',
      'jacuzzi': '/b79-jacuzzi.html',
      'cajamenor': '/b79-caja-menor.html',
      'index': '/',
    };
    const netPath = pageMap[page];
    if (!netPath) {
      res.writeHead(404, HTML_CORS_HEADERS);
      return res.end('<html><body>Page not found. Use ?action=html&page=aseo|facturacion|jacuzzi|cajamenor</body></html>');
    }
    try {
      let html = await fetchNetlify(netPath);
      if (page === 'aseo') html = modifyAseoHTML(html);
      else if (page === 'facturacion') html = modifyGenericHTML(html, true);
      else html = modifyGenericHTML(html, false);
      res.writeHead(200, HTML_CORS_HEADERS);
      return res.end(html);
    } catch(e) {
      res.writeHead(500, HTML_CORS_HEADERS);
      return res.end('<html><body>Error fetching page: ' + e.message + '</body></html>');
    }
  }

  // ============ HEALTH CHECK ============
  if (action === 'health' || req.url === '/health' || req.url === '/') {
    if (action === '' && req.url === '/') {
      res.writeHead(200, CORS_HEADERS);
      return res.end(JSON.stringify({ ok: true, service: 'B79 LobbyPMS Proxy', status: 'running', version: '3.2', auth_mode: LOBBY_TOKEN ? 'bearer_token' : 'basic_auth', token_configured: !!(LOBBY_TOKEN || LOBBY_PASS) }));
    }
  }

  if (!verifyToken(req)) {
    res.writeHead(401, CORS_HEADERS);
    return res.end(JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid X-B79-Token header' }));
  }

  if (action === 'health') {
    res.writeHead(200, CORS_HEADERS);
    return res.end(JSON.stringify({ ok: true, service: 'B79 LobbyPMS Proxy', status: 'running', version: '3.2', auth_mode: LOBBY_TOKEN ? 'bearer_token' : 'basic_auth', token_configured: !!(LOBBY_TOKEN || LOBBY_PASS) }));
  }

  if (action === 'inhouse' || action === 'rooms') {
    try {
      const today = new Date().toISOString().split('T')[0];
      let result = await fetchLobby(`/bookings?checkin_from=${today}&checkin_to=${today}&status=inhouse`);
      if (!result.body || result.status !== 200 || result.body.error) {
        result = await fetchLobby(`/bookings?creation_date_from=${today}&status=inhouse`);
      }
      const bookings = Array.isArray(result.body) ? result.body : (result.body?.data || result.body?.bookings || []);
      const rooms = bookings.map(b => ({
        room: b.room?.name || b.room_number || b.room || 'Sin número',
        guest: b.guest?.name || b.guest_name || 'Sin nombre',
        checkin: b.checkin || b.check_in || b.arrival_date || '',
        checkout: b.checkout || b.check_out || b.departure_date || '',
        status: b.status || 'inhouse',
        notes: b.notes || b.observations || '',
        booking_id: b.booking_id || b.id || ''
      }));
      res.writeHead(200, CORS_HEADERS);
      return res.end(JSON.stringify({ ok: true, data: rooms, count: rooms.length, total_bookings: bookings.length }));
    } catch(e) {
      log('error', 'inhouse error', e.message);
      res.writeHead(500, CORS_HEADERS);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (action === 'facturacion' || action === 'billing') {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      let result = await fetchLobby(`/bookings?checkin_from=${thirtyDaysAgo}&checkin_to=${today}`);
      if (!result.body || result.status !== 200 || result.body.error) {
        result = await fetchLobby(`/bookings?creation_date_from=${thirtyDaysAgo}`);
      }
      const bookings = Array.isArray(result.body) ? result.body : (result.body?.data || result.body?.bookings || []);
      const billing = bookings.map(normalizeForBilling);
      res.writeHead(200, CORS_HEADERS);
      return res.end(JSON.stringify({ ok: true, data: billing, count: billing.length }));
    } catch(e) {
      log('error', 'facturacion error', e.message);
      res.writeHead(500, CORS_HEADERS);
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  res.writeHead(400, CORS_HEADERS);
  res.end(JSON.stringify({ error: 'Unknown action', action, validActions: ['inhouse', 'facturacion', 'html', 'health'] }));
});

server.listen(PORT, () => log('info', `B79 Proxy v3.2 running on port ${PORT}`));
