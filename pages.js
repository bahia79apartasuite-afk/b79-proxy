// pages.js — HTML de las páginas operativas del Hotel Bahía 79.
//
// Este archivo NO toca LobbyPMS: no contiene credenciales, ni el flujo de login,
// ni llamadas al PMS. Sólo genera HTML. Las páginas leen los datos del propio
// proxy por HTTP (?action=aseo|llegadas|salidas|facturacion), igual que lo haría
// cualquier cliente externo. Editar el diseño de una página nunca debe requerir
// abrir server.js.

const PROXY_URL_POR_DEFECTO = 'https://b79-proxy.onrender.com';

// ---------------------------------------------------------------------------
// Estilos y esqueleto comunes
// ---------------------------------------------------------------------------

const ESTILOS = `
:root{
  --ground:#F1F3EF; --surface:#FFFFFF; --surface-2:#E9EDE7;
  --ink:#122629; --muted:#586A67; --line:#D8DED4;
  --salida:#A22F58; --llegada:#256E64; --encasa:#9E5F14;
  --ok:#256E64;
  --shadow:0 1px 2px rgba(18,38,41,.06), 0 8px 24px -18px rgba(18,38,41,.35);
}
@media (prefers-color-scheme:dark){
  :root{
    --ground:#0D1A1D; --surface:#15272B; --surface-2:#1C3237;
    --ink:#E7EDE8; --muted:#9BABA7; --line:#264046;
    --salida:#EE86A9; --llegada:#63BBAA; --encasa:#DFA55E;
    --ok:#63BBAA;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 10px 28px -20px rgba(0,0,0,.9);
  }
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--ground); color:var(--ink);
  font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
  padding:0 0 env(safe-area-inset-bottom);
}
.wrap{max-width:720px;margin:0 auto;padding:16px 16px 64px}
a{color:inherit}

/* cabecera */
header{
  position:sticky;top:0;z-index:10;
  background:var(--ground);
  border-bottom:1px solid var(--line);
  padding:12px 16px;
  margin:0 -16px 20px;
}
.fila{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
h1{margin:0;font-size:19px;font-weight:700;letter-spacing:-.01em}
.sub{color:var(--muted);font-size:13px;margin-top:2px}
.volver{
  display:inline-flex;align-items:center;gap:6px;
  font-size:13px;color:var(--muted);text-decoration:none;
  margin-bottom:6px;min-height:32px;
}
.volver:hover{color:var(--ink)}
input[type=date],input[type=search]{
  font:inherit;font-size:15px;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  padding:9px 11px;min-height:44px;
}
input[type=search]{width:100%;margin-top:10px}
button{
  font:inherit;font-weight:600;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  padding:9px 14px;min-height:44px;cursor:pointer;
}
button:active{transform:translateY(1px)}

/* progreso */
.progreso{margin-top:12px}
.barra{height:8px;background:var(--surface-2);border-radius:99px;overflow:hidden}
.barra i{display:block;height:100%;width:0;background:var(--ok);border-radius:99px;transition:width .3s ease}
.progreso .txt{font-size:13px;color:var(--muted);margin-top:6px;font-variant-numeric:tabular-nums}

/* secciones */
section{margin-bottom:28px}
.titulo{display:flex;align-items:baseline;gap:8px;margin:0 0 4px}
.titulo h2{margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.titulo .n{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.tarea{font-size:13px;color:var(--muted);margin:0 0 12px}
section.salidas .titulo h2{color:var(--salida)}
section.llegadas .titulo h2{color:var(--llegada)}
section.encasa .titulo h2{color:var(--encasa)}

/* tarjetas */
.card{
  display:flex;align-items:center;gap:14px;
  background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--line);
  border-radius:12px;padding:14px;margin-bottom:10px;
  box-shadow:var(--shadow);
  -webkit-tap-highlight-color:transparent;
  transition:opacity .2s ease;
}
.card.tocable{cursor:pointer}
section.salidas .card{border-left-color:var(--salida)}
section.llegadas .card{border-left-color:var(--llegada)}
section.encasa .card{border-left-color:var(--encasa)}
.card.lista{opacity:.5}
.card.lista .hab, .card.lista .nombre{text-decoration:line-through}
.info{flex:1;min-width:0}
.hab{font-size:20px;font-weight:700;letter-spacing:-.02em}
.nombre{font-size:14px;color:var(--muted);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta{font-size:12px;color:var(--muted);margin-top:5px;font-variant-numeric:tabular-nums}
.notas{
  font-size:13px;margin-top:8px;padding:8px 10px;
  background:var(--surface-2);border-radius:8px;color:var(--ink);
}
.check{
  flex-shrink:0;width:34px;height:34px;border-radius:50%;
  border:2px solid var(--line);
  display:grid;place-items:center;color:transparent;font-size:17px;font-weight:700;
}
.card.lista .check{background:var(--ok);border-color:var(--ok);color:#fff}
.plata{flex-shrink:0;text-align:right}
.plata .total{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.plata .imp{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;margin-top:2px}

/* resumen de facturación */
.resumen{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:10px;
  margin-bottom:24px;
}
.cifra{
  background:var(--surface);border:1px solid var(--line);border-radius:12px;
  padding:14px;box-shadow:var(--shadow);
}
.cifra .k{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.cifra .v{font-size:20px;font-weight:700;margin-top:4px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}

/* portada */
.menu{display:grid;gap:12px}
.acceso{
  display:flex;align-items:center;gap:16px;text-decoration:none;
  background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--line);
  border-radius:12px;padding:18px;box-shadow:var(--shadow);
}
.acceso .ico{font-size:26px;line-height:1;flex-shrink:0}
.acceso .txt{flex:1;min-width:0}
.acceso .t{display:block;font-size:17px;font-weight:700;line-height:1.3}
.acceso .d{display:block;font-size:13px;color:var(--muted);margin-top:2px;line-height:1.4}
.acceso .flecha{flex-shrink:0;color:var(--muted);font-size:20px}
.acceso.aseo{border-left-color:var(--llegada)}
.acceso.facturacion{border-left-color:var(--salida)}
.acceso.pendiente{opacity:.6}
.tag{
  display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--muted);
  border:1px solid var(--line);border-radius:99px;padding:2px 8px;margin-top:8px;
}

/* estados */
.aviso{
  background:var(--surface);border:1px solid var(--line);border-radius:12px;
  padding:20px;text-align:center;color:var(--muted);
}
.aviso strong{display:block;color:var(--ink);margin-bottom:6px;font-size:16px}
.vacio{color:var(--muted);font-size:14px;padding:4px 0 8px}
.skel{height:74px;background:var(--surface-2);border-radius:12px;margin-bottom:10px;animation:pulso 1.4s ease-in-out infinite}
@keyframes pulso{0%,100%{opacity:1}50%{opacity:.45}}
footer{color:var(--muted);font-size:12px;text-align:center;padding-top:8px}
`;

// Los enlaces entre páginas no pueden ser relativos: servidas desde Netlify en
// /b79-aseo/, una URL como "?action=html&page=inicio" resuelve a
// /b79-aseo/?action=html&page=inicio, que _redirects vuelve a mandar a aseo.
// Por eso cada enlace lleva data-page y este script le pone el href correcto
// según el origen desde el que se esté sirviendo.
const JS_NAV = `
(function(){
  var RUTAS = {
    inicio:'/b79', aseo:'/b79-aseo', facturacion:'/b79-facturacion',
    jacuzzi:'/b79-jacuzzi', cajamenor:'/b79-caja-menor'
  };
  var q = new URLSearchParams(location.search);
  var directo = location.hostname.indexOf('onrender.com') !== -1 ||
                location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var api = q.get('api');
  Array.prototype.forEach.call(document.querySelectorAll('a[data-page]'), function(a){
    var p = a.getAttribute('data-page');
    a.href = directo
      ? '?action=html&page=' + p + (api ? '&api=' + encodeURIComponent(api) : '')
      : (RUTAS[p] || '/b79');
  });
})();
`;

function layout(titulo, cuerpo) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1a1d">
<title>${titulo}</title>
<style>${ESTILOS}</style>
</head>
<body>
<div class="wrap">
${cuerpo}
</div>
<script>${JS_NAV}<\/script>
</body>
</html>`;
}

// Bloque JS común a las páginas que leen datos del proxy.
const JS_COMUN = `
  var params = new URLSearchParams(location.search);
  var esLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var API = params.get('api') || (esLocal ? location.origin : '${PROXY_URL_POR_DEFECTO}');

  function hoy(){
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function fechaCorta(f){
    if(!f) return '';
    var p = String(f).slice(0,10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] : String(f);
  }

  function traer(accion, fecha){
    return fetch(API + '/?action=' + accion + '&date=' + encodeURIComponent(fecha), { cache:'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j || !j.ok) throw new Error((j && j.error) || 'respuesta inesperada');
        return j.huespedes || [];
      });
  }

  function marcaHora(){
    var a = new Date();
    return 'Actualizado ' + String(a.getHours()).padStart(2,'0') + ':' + String(a.getMinutes()).padStart(2,'0');
  }
`;

// ---------------------------------------------------------------------------
// Portada
// ---------------------------------------------------------------------------

function paginaInicio() {
  const cuerpo = `
<header>
  <div class="fila">
    <div>
      <h1>Bah&iacute;a 79 &middot; Operaci&oacute;n</h1>
      <div class="sub">Herramientas del d&iacute;a a d&iacute;a</div>
    </div>
  </div>
</header>

<div class="menu">
  <a class="acceso aseo" data-page="aseo" href="?action=html&amp;page=aseo">
    <span class="ico">&#129529;</span>
    <span class="txt"><span class="t">Aseo</span><span class="d">Salidas, llegadas y habitaciones en casa</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
  <a class="acceso facturacion" data-page="facturacion" href="?action=html&amp;page=facturacion">
    <span class="ico">&#129534;</span>
    <span class="txt"><span class="t">Facturaci&oacute;n</span><span class="d">Reservas del d&iacute;a con totales e impuestos</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
  <a class="acceso pendiente" data-page="jacuzzi" href="?action=html&amp;page=jacuzzi">
    <span class="ico">&#128704;</span>
    <span class="txt"><span class="t">Jacuzzi</span><span class="d">Control de uso</span><span class="tag">Pendiente</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
  <a class="acceso pendiente" data-page="cajamenor" href="?action=html&amp;page=cajamenor">
    <span class="ico">&#128176;</span>
    <span class="txt"><span class="t">Caja menor</span><span class="d">Registro de gastos</span><span class="tag">Pendiente</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
</div>

<footer>Los datos vienen de LobbyPMS en tiempo real.</footer>`;
  return layout('Bahía 79 · Operación', cuerpo);
}

// ---------------------------------------------------------------------------
// Aseo
// ---------------------------------------------------------------------------

function paginaAseo() {
  const cuerpo = `
<header>
  <a class="volver" data-page="inicio" href="?action=html&amp;page=inicio">&lsaquo; Inicio</a>
  <div class="fila">
    <div style="flex:1;min-width:150px">
      <h1>Aseo</h1>
      <div class="sub" id="sub">Cargando&hellip;</div>
    </div>
    <input type="date" id="fecha" aria-label="Fecha">
    <button id="recargar" aria-label="Recargar">&#8635;</button>
  </div>
  <div class="progreso">
    <div class="barra"><i id="barra"></i></div>
    <div class="txt" id="cuenta">&nbsp;</div>
  </div>
</header>

<div id="contenido">
  <div class="skel"></div><div class="skel"></div><div class="skel"></div>
</div>

<footer>Marca cada habitaci&oacute;n al terminarla. Se guarda en este tel&eacute;fono.</footer>

<script>
(function(){
  "use strict";
${JS_COMUN}

  var GRUPOS = [
    { clave:'salidas',  accion:'salidas',  titulo:'Salidas',  tarea:'Limpieza a fondo tras el check-out.' },
    { clave:'llegadas', accion:'llegadas', titulo:'Llegadas', tarea:'Preparar la habitaci\\u00f3n antes del check-in.' },
    { clave:'encasa',   accion:'aseo',     titulo:'En casa',  tarea:'Limpieza diaria con el hu\\u00e9sped alojado.' }
  ];

  var $fecha = document.getElementById('fecha');
  var $sub = document.getElementById('sub');
  var $cont = document.getElementById('contenido');
  var $barra = document.getElementById('barra');
  var $cuenta = document.getElementById('cuenta');

  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;

  // ---- lo hecho se guarda en el propio tel\\u00e9fono, por fecha ----
  function claveDia(){ return 'b79-aseo-' + fecha; }
  function leerHechas(){
    try { return JSON.parse(localStorage.getItem(claveDia()) || '[]'); }
    catch(e){ return []; }
  }
  function guardarHechas(lista){
    try { localStorage.setItem(claveDia(), JSON.stringify(lista)); } catch(e){}
  }
  function idTarea(grupo, h){
    return grupo + ':' + (h.habitacion || '?') + ':' + (h.codigo_reserva || h.nombre || '');
  }

  function personas(h){
    var a = Number(h.adultos)||0, n = Number(h.ninos)||0, t = [];
    if(a) t.push(a + (a===1 ? ' adulto' : ' adultos'));
    if(n) t.push(n + (n===1 ? ' ni\\u00f1o' : ' ni\\u00f1os'));
    return t.join(', ');
  }

  function tarjeta(grupo, h, hechas){
    var id = idTarea(grupo, h);
    var lista = hechas.indexOf(id) !== -1;
    var meta = [];
    var per = personas(h);
    if(per) meta.push(per);
    if(h.fecha_ingreso || h.fecha_salida){
      meta.push(fechaCorta(h.fecha_ingreso) + ' \\u2192 ' + fechaCorta(h.fecha_salida));
    }
    var html = '<article class="card tocable' + (lista ? ' lista' : '') + '" data-id="' + esc(id) + '" role="button" tabindex="0">';
    html += '<div class="info">';
    html += '<div class="hab">' + esc(h.habitacion || 'Sin habitaci\\u00f3n') + '</div>';
    if(h.nombre) html += '<div class="nombre">' + esc(h.nombre) + '</div>';
    if(meta.length) html += '<div class="meta">' + esc(meta.join(' \\u00b7 ')) + '</div>';
    if(h.notas) html += '<div class="notas">' + esc(h.notas) + '</div>';
    html += '</div>';
    html += '<div class="check" aria-hidden="true">\\u2713</div>';
    html += '</article>';
    return html;
  }

  function pintar(datos){
    var hechas = leerHechas();
    var html = '', total = 0, listas = 0;

    GRUPOS.forEach(function(g){
      var lista = datos[g.clave] || [];
      html += '<section class="' + g.clave + '">';
      html += '<div class="titulo"><h2>' + g.titulo + '</h2><span class="n">' + lista.length + '</span></div>';
      html += '<p class="tarea">' + g.tarea + '</p>';
      if(!lista.length){
        html += '<div class="vacio">Nada por hacer aqu\\u00ed hoy.</div>';
      } else {
        lista.forEach(function(h){
          total++;
          if(hechas.indexOf(idTarea(g.clave, h)) !== -1) listas++;
          html += tarjeta(g.clave, h, hechas);
        });
      }
      html += '</section>';
    });

    $cont.innerHTML = html;
    actualizarProgreso(total, listas);
  }

  function actualizarProgreso(total, listas){
    $barra.style.width = (total ? Math.round(listas/total*100) : 0) + '%';
    $cuenta.textContent = total
      ? listas + ' de ' + total + ' habitaciones listas'
      : 'Sin habitaciones para esta fecha';
  }

  function recontar(){
    actualizarProgreso($cont.querySelectorAll('.card').length, $cont.querySelectorAll('.card.lista').length);
  }

  $cont.addEventListener('click', function(ev){
    var card = ev.target.closest ? ev.target.closest('.card') : null;
    if(!card) return;
    var id = card.getAttribute('data-id');
    var hechas = leerHechas();
    var i = hechas.indexOf(id);
    if(i === -1){ hechas.push(id); card.classList.add('lista'); }
    else { hechas.splice(i,1); card.classList.remove('lista'); }
    guardarHechas(hechas);
    recontar();
  });

  $cont.addEventListener('keydown', function(ev){
    if(ev.key !== 'Enter' && ev.key !== ' ') return;
    var card = ev.target.closest ? ev.target.closest('.card') : null;
    if(!card) return;
    ev.preventDefault();
    card.click();
  });

  function cargar(){
    $sub.textContent = 'Cargando\\u2026';
    $cont.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    Promise.all(GRUPOS.map(function(g){ return traer(g.accion, fecha); }))
      .then(function(res){
        var datos = {};
        GRUPOS.forEach(function(g,i){ datos[g.clave] = res[i]; });
        pintar(datos);
        $sub.textContent = marcaHora();
      })
      .catch(function(e){
        $sub.textContent = 'Sin conexi\\u00f3n con el sistema';
        $cont.innerHTML = '<div class="aviso"><strong>No se pudieron cargar las habitaciones</strong>' +
          'Revisa la conexi\\u00f3n y vuelve a intentar. Si sigue fallando, av\\u00edsale a administraci\\u00f3n. (' +
          esc(e.message) + ')</div>';
        $barra.style.width = '0%';
        $cuenta.textContent = '';
      });
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); cargar(); });
  document.getElementById('recargar').addEventListener('click', cargar);
  cargar();
})();
<\/script>`;

  return layout('Aseo · Bahía 79', cuerpo);
}

// ---------------------------------------------------------------------------
// Facturación
// ---------------------------------------------------------------------------

function paginaFacturacion() {
  const cuerpo = `
<header>
  <a class="volver" data-page="inicio" href="?action=html&amp;page=inicio">&lsaquo; Inicio</a>
  <div class="fila">
    <div style="flex:1;min-width:150px">
      <h1>Facturaci&oacute;n</h1>
      <div class="sub" id="sub">Cargando&hellip;</div>
    </div>
    <input type="date" id="fecha" aria-label="Fecha">
    <button id="recargar" aria-label="Recargar">&#8635;</button>
  </div>
  <input type="search" id="buscar" placeholder="Buscar por habitaci&oacute;n, nombre o agencia" aria-label="Buscar">
</header>

<div class="resumen" id="resumen"></div>
<div id="contenido">
  <div class="skel"></div><div class="skel"></div><div class="skel"></div>
</div>

<footer>Datos en vivo de LobbyPMS. No sustituyen la factura oficial.</footer>

<script>
(function(){
  "use strict";
${JS_COMUN}

  var $fecha = document.getElementById('fecha');
  var $sub = document.getElementById('sub');
  var $cont = document.getElementById('contenido');
  var $resumen = document.getElementById('resumen');
  var $buscar = document.getElementById('buscar');

  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;
  var TODAS = [];

  var moneda = new Intl.NumberFormat('es-CO', {
    style:'currency', currency:'COP', maximumFractionDigits:0
  });
  function plata(n){ return moneda.format(Number(n)||0); }

  function cifra(k, v){
    return '<div class="cifra"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>';
  }

  function pintarResumen(lista){
    var total = 0, imp = 0;
    lista.forEach(function(h){ total += Number(h.total)||0; imp += Number(h.impuesto)||0; });
    $resumen.innerHTML =
      cifra('Reservas', lista.length) +
      cifra('Total', plata(total)) +
      cifra('Impuestos', plata(imp));
  }

  function tarjeta(h){
    var meta = [];
    if(h.agencia) meta.push(h.agencia);
    if(h.plan) meta.push(h.plan);
    if(h.estatus) meta.push(h.estatus);
    if(h.fecha_ingreso || h.fecha_salida){
      meta.push(fechaCorta(h.fecha_ingreso) + ' \\u2192 ' + fechaCorta(h.fecha_salida));
    }
    var html = '<article class="card">';
    html += '<div class="info">';
    html += '<div class="hab">' + esc(h.habitacion || 'Sin habitaci\\u00f3n') + '</div>';
    if(h.nombre) html += '<div class="nombre">' + esc(h.nombre) + '</div>';
    if(meta.length) html += '<div class="meta">' + esc(meta.join(' \\u00b7 ')) + '</div>';
    html += '</div>';
    html += '<div class="plata"><div class="total">' + plata(h.total) + '</div>';
    if(Number(h.impuesto)) html += '<div class="imp">imp. ' + plata(h.impuesto) + '</div>';
    html += '</div></article>';
    return html;
  }

  function pintar(lista){
    pintarResumen(lista);
    if(!lista.length){
      $cont.innerHTML = '<div class="vacio">Ninguna reserva coincide.</div>';
      return;
    }
    $cont.innerHTML = lista.map(tarjeta).join('');
  }

  function filtrar(){
    var q = $buscar.value.trim().toLowerCase();
    if(!q){ pintar(TODAS); return; }
    pintar(TODAS.filter(function(h){
      return [h.habitacion, h.nombre, h.agencia, h.plan, h.estatus]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    }));
  }

  function cargar(){
    $sub.textContent = 'Cargando\\u2026';
    $resumen.innerHTML = '';
    $cont.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    traer('facturacion', fecha)
      .then(function(lista){
        TODAS = lista;
        filtrar();
        $sub.textContent = marcaHora();
      })
      .catch(function(e){
        $sub.textContent = 'Sin conexi\\u00f3n con el sistema';
        $resumen.innerHTML = '';
        $cont.innerHTML = '<div class="aviso"><strong>No se pudo cargar la facturaci\\u00f3n</strong>' +
          'Revisa la conexi\\u00f3n y vuelve a intentar. (' + esc(e.message) + ')</div>';
      });
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); cargar(); });
  $buscar.addEventListener('input', filtrar);
  document.getElementById('recargar').addEventListener('click', cargar);
  cargar();
})();
<\/script>`;

  return layout('Facturación · Bahía 79', cuerpo);
}

// ---------------------------------------------------------------------------
// Páginas todavía no construidas
// ---------------------------------------------------------------------------

function paginaPendiente(nombre, explicacion) {
  const cuerpo = `
<header>
  <a class="volver" data-page="inicio" href="?action=html&amp;page=inicio">&lsaquo; Inicio</a>
  <div class="fila"><div><h1>${nombre}</h1><div class="sub">Bah&iacute;a 79</div></div></div>
</header>
<div class="aviso">
  <strong>Esta p&aacute;gina todav&iacute;a no existe</strong>
  ${explicacion}
</div>`;
  return layout(nombre + ' · Bahía 79', cuerpo);
}

const PAGINAS = {
  inicio: paginaInicio,
  aseo: paginaAseo,
  facturacion: paginaFacturacion,
  jacuzzi: () => paginaPendiente('Jacuzzi',
    'La ruta funciona, pero falta definir qu&eacute; debe registrar: turnos de uso, mantenimiento o cobro.'),
  cajamenor: () => paginaPendiente('Caja menor',
    'La ruta funciona, pero falta definir qu&eacute; debe registrar y d&oacute;nde se guardan los gastos.'),
};

function renderPage(page) {
  const clave = String(page || 'inicio').toLowerCase();
  const fn = PAGINAS[clave];
  return fn ? fn() : paginaPendiente('Página desconocida',
    'No hay ninguna p&aacute;gina con ese nombre. Vuelve al inicio para ver las disponibles.');
}

module.exports = { renderPage };
