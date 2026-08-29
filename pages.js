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
.acceso.jacuzzi{border-left-color:var(--encasa)}
.acceso.cajamenor{border-left-color:var(--ok)}
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

/* formularios */
.formclave{display:flex;gap:8px;margin-top:14px}
.formclave input{flex:1}
input[type=password],input[type=text],input[type=time],input[type=number],select{
  font:inherit;font-size:16px;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  padding:10px 12px;min-height:44px;width:100%;
}
.forma{
  background:var(--surface);border:1px solid var(--line);border-radius:12px;
  padding:14px;margin-bottom:20px;box-shadow:var(--shadow);
}
.forma h3{margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.campos{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:10px}
.campo label{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}
.ancho{grid-column:1/-1}
.forma button[type=submit]{width:100%;background:var(--ok);border-color:var(--ok);color:#fff}

/* chips de estado */
.chip{
  border:1px solid var(--line);border-radius:99px;padding:5px 12px;
  font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  background:var(--surface);cursor:pointer;min-height:34px;
}
.chip[data-estado="reservado"]{color:var(--muted)}
.chip[data-estado="en uso"]{color:var(--encasa);border-color:var(--encasa)}
.chip[data-estado="aseado"]{color:var(--ok);border-color:var(--ok)}
.borrar{
  flex-shrink:0;background:none;border:none;color:var(--muted);
  font-size:22px;line-height:1;padding:6px 10px;min-height:38px;cursor:pointer;
}
.borrar:hover{color:var(--salida)}
.acciones{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.acciones button{flex:1;min-width:130px}
.gasto .concepto{font-size:16px;font-weight:600}
.saldo-bajo{color:var(--salida)}
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

  // ---- clave compartida, guardada en este dispositivo ----
  var CLAVE_KEY = 'b79-clave';
  function leerClave(){ try { return localStorage.getItem(CLAVE_KEY) || ''; } catch(e){ return ''; } }
  function guardarClave(v){ try { localStorage.setItem(CLAVE_KEY, v); } catch(e){} }
  function olvidarClave(){ try { localStorage.removeItem(CLAVE_KEY); } catch(e){} }

  function pedirClave(destino, alEntrar){
    destino.innerHTML =
      '<div class="aviso"><strong>Esta página necesita clave</strong>' +
      'Pídesela a administración. Se guarda en este dispositivo y no vuelve a pedirse.' +
      '<form id="fclave" class="formclave">' +
      '<input type="password" id="iclave" placeholder="Clave" autocomplete="current-password" required>' +
      '<button type="submit">Entrar</button></form></div>';
    var f = destino.querySelector('#fclave');
    f.addEventListener('submit', function(ev){
      ev.preventDefault();
      var v = destino.querySelector('#iclave').value.trim();
      if(!v) return;
      guardarClave(v);
      alEntrar();
    });
    destino.querySelector('#iclave').focus();
  }

  function traer(accion, fecha){
    var cab = {};
    var c = leerClave();
    if(c) cab['X-B79-Token'] = c;
    return fetch(API + '/?action=' + accion + '&date=' + encodeURIComponent(fecha),
                 { cache:'no-store', headers:cab })
      .then(function(r){
        if(r.status === 401){ var e = new Error('clave'); e.clave = true; throw e; }
        return r.json();
      })
      .then(function(j){
        if(!j || !j.ok) throw new Error((j && j.error) || 'respuesta inesperada');
        return j.huespedes || [];
      });
  }

  // ---- guardado local, para las páginas que no tienen datos en el PMS ----
  function almacen(clave){
    return {
      leer: function(){ try { return JSON.parse(localStorage.getItem(clave) || '[]'); } catch(e){ return []; } },
      guardar: function(v){ try { localStorage.setItem(clave, JSON.stringify(v)); return true; } catch(e){ return false; } }
    };
  }

  function csv(filas){
    return filas.map(function(f){
      return f.map(function(c){
        var s = String(c == null ? '' : c);
        return /[";\\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
      }).join(';');
    }).join('\\n');
  }

  function descargarCsv(nombre, texto){
    try {
      // el BOM hace que Excel abra bien los acentos
      var b = new Blob(['\ufeff' + texto], { type:'text/csv;charset=utf-8' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u; a.download = nombre;
      document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 1000);
      return true;
    } catch(e){ return false; }
  }

  function copiar(texto, boton){
    var previo = boton.textContent;
    function listo(){ boton.textContent = 'Copiado'; setTimeout(function(){ boton.textContent = previo; }, 1500); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(texto).then(listo, function(){});
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = texto; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); listo(); } catch(e){}
    ta.remove();
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
  <a class="acceso jacuzzi" data-page="jacuzzi" href="?action=html&amp;page=jacuzzi">
    <span class="ico">&#128704;</span>
    <span class="txt"><span class="t">Jacuzzi</span><span class="d">Turnos de uso y aseo del d&iacute;a</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
  <a class="acceso cajamenor" data-page="cajamenor" href="?action=html&amp;page=cajamenor">
    <span class="ico">&#128176;</span>
    <span class="txt"><span class="t">Caja menor</span><span class="d">Gastos del mes, base y saldo</span></span>
    <span class="flecha">&rsaquo;</span>
  </a>
</div>

<footer>Aseo y facturaci&oacute;n leen de LobbyPMS. Jacuzzi y caja menor se guardan en este dispositivo.</footer>`;
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
        $barra.style.width = '0%';
        $cuenta.textContent = '';
        if(e.clave){
          $sub.textContent = 'Clave requerida';
          olvidarClave();
          pedirClave($cont, cargar);
          return;
        }
        $sub.textContent = 'Sin conexión con el sistema';
        $cont.innerHTML = '<div class="aviso"><strong>No se pudieron cargar las habitaciones</strong>' +
          'Revisa la conexión y vuelve a intentar. Si sigue fallando, avísale a administración. (' +
          esc(e.message) + ')</div>';
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
        $resumen.innerHTML = '';
        if(e.clave){
          $sub.textContent = 'Clave requerida';
          olvidarClave();
          pedirClave($cont, cargar);
          return;
        }
        $sub.textContent = 'Sin conexión con el sistema';
        $cont.innerHTML = '<div class="aviso"><strong>No se pudo cargar la facturación</strong>' +
          'Revisa la conexión y vuelve a intentar. (' + esc(e.message) + ')</div>';
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
// Jacuzzi — turnos de uso del día
// ---------------------------------------------------------------------------

function paginaJacuzzi() {
  const cuerpo = `
<header>
  <a class="volver" data-page="inicio" href="?action=html&amp;page=inicio">&lsaquo; Inicio</a>
  <div class="fila">
    <div style="flex:1;min-width:150px">
      <h1>Jacuzzi</h1>
      <div class="sub" id="sub">Turnos del d&iacute;a</div>
    </div>
    <input type="date" id="fecha" aria-label="Fecha">
  </div>
</header>

<form class="forma" id="alta">
  <h3>Anotar turno</h3>
  <div class="campos">
    <div class="campo"><label for="hora">Hora</label><input type="time" id="hora" required></div>
    <div class="campo"><label for="hab">Habitaci&oacute;n</label><input type="text" id="hab" list="habs" placeholder="201" required><datalist id="habs"></datalist></div>
    <div class="campo"><label for="pers">Personas</label><input type="number" id="pers" min="1" max="20" value="2"></div>
    <div class="campo ancho"><label for="nota">Nota</label><input type="text" id="nota" placeholder="Opcional"></div>
  </div>
  <button type="submit">A&ntilde;adir turno</button>
</form>

<div class="acciones">
  <button id="csv">Descargar CSV</button>
  <button id="copiar">Copiar</button>
</div>

<div id="contenido"></div>

<footer>Los turnos se guardan en este dispositivo, no en LobbyPMS.</footer>

<script>
(function(){
  "use strict";
${JS_COMUN}

  var ESTADOS = ['reservado','en uso','aseado'];
  var $fecha = document.getElementById('fecha');
  var $cont = document.getElementById('contenido');
  var $sub = document.getElementById('sub');
  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;

  var caja = almacen('b79-jacuzzi');

  function delDia(){
    return caja.leer().filter(function(t){ return t.fecha === fecha; })
      .sort(function(a,b){ return a.hora < b.hora ? -1 : 1; });
  }

  function pintar(){
    var lista = delDia();
    if(!lista.length){
      $cont.innerHTML = '<div class="vacio">Sin turnos anotados para esta fecha.</div>';
      $sub.textContent = 'Sin turnos';
      return;
    }
    var aseados = lista.filter(function(t){ return t.estado === 'aseado'; }).length;
    $sub.textContent = lista.length + (lista.length === 1 ? ' turno' : ' turnos') + ' · ' + aseados + ' aseados';
    $cont.innerHTML = lista.map(function(t){
      var meta = [];
      if(t.personas) meta.push(t.personas + (Number(t.personas) === 1 ? ' persona' : ' personas'));
      var h = '<article class="card" data-id="' + esc(t.id) + '">';
      h += '<div class="info">';
      h += '<div class="hab">' + esc(t.hora) + ' &middot; ' + esc(t.habitacion) + '</div>';
      if(meta.length) h += '<div class="meta">' + esc(meta.join(" · ")) + '</div>';
      if(t.nota) h += '<div class="notas">' + esc(t.nota) + '</div>';
      h += '</div>';
      h += '<button class="chip" data-estado="' + esc(t.estado) + '" data-accion="estado">' + esc(t.estado) + '</button>';
      h += '<button class="borrar" data-accion="borrar" aria-label="Borrar">&times;</button>';
      h += '</article>';
      return h;
    }).join('');
  }

  document.getElementById('alta').addEventListener('submit', function(ev){
    ev.preventDefault();
    var todos = caja.leer();
    todos.push({
      id: 'j' + Date.now(),
      fecha: fecha,
      hora: document.getElementById('hora').value,
      habitacion: document.getElementById('hab').value.trim(),
      personas: document.getElementById('pers').value,
      nota: document.getElementById('nota').value.trim(),
      estado: 'reservado'
    });
    caja.guardar(todos);
    // se limpia lo que cambia turno a turno; personas suele repetirse
    document.getElementById('hora').value = '';
    document.getElementById('hab').value = '';
    document.getElementById('nota').value = '';
    document.getElementById('hora').focus();
    pintar();
  });

  $cont.addEventListener('click', function(ev){
    var boton = ev.target.closest ? ev.target.closest('[data-accion]') : null;
    if(!boton) return;
    var id = boton.closest('.card').getAttribute('data-id');
    var todos = caja.leer();
    var i = todos.findIndex(function(t){ return t.id === id; });
    if(i === -1) return;
    if(boton.getAttribute('data-accion') === 'borrar'){
      todos.splice(i,1);
    } else {
      var siguiente = (ESTADOS.indexOf(todos[i].estado) + 1) % ESTADOS.length;
      todos[i].estado = ESTADOS[siguiente];
    }
    caja.guardar(todos);
    pintar();
  });

  function filas(){
    var f = [['Fecha','Hora','Habitación','Personas','Estado','Nota']];
    delDia().forEach(function(t){ f.push([t.fecha,t.hora,t.habitacion,t.personas,t.estado,t.nota]); });
    return f;
  }
  document.getElementById('csv').addEventListener('click', function(){
    descargarCsv('jacuzzi-' + fecha + '.csv', csv(filas()));
  });
  document.getElementById('copiar').addEventListener('click', function(){
    copiar(csv(filas()), this);
  });

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); pintar(); sugerirHabitaciones(); });

  // Las habitaciones ocupadas salen del PMS, para no escribirlas a mano.
  // Si no hay clave o no hay conexión, el campo sigue siendo texto libre.
  function sugerirHabitaciones(){
    traer('aseo', fecha).then(function(lista){
      document.getElementById('habs').innerHTML = lista.map(function(h){
        return '<option value="' + esc(h.habitacion) + '">';
      }).join('');
    }).catch(function(){});
  }

  pintar();
  sugerirHabitaciones();
})();
<\/script>`;

  return layout('Jacuzzi · Bahía 79', cuerpo);
}

// ---------------------------------------------------------------------------
// Caja menor — gastos del mes
// ---------------------------------------------------------------------------

function paginaCajaMenor() {
  const cuerpo = `
<header>
  <a class="volver" data-page="inicio" href="?action=html&amp;page=inicio">&lsaquo; Inicio</a>
  <div class="fila">
    <div style="flex:1;min-width:150px">
      <h1>Caja menor</h1>
      <div class="sub" id="sub">&nbsp;</div>
    </div>
    <input type="month" id="mes" aria-label="Mes">
  </div>
</header>

<div class="resumen" id="resumen"></div>

<form class="forma" id="alta">
  <h3>Anotar gasto</h3>
  <div class="campos">
    <div class="campo"><label for="fecha">Fecha</label><input type="date" id="fecha" required></div>
    <div class="campo"><label for="monto">Monto</label><input type="number" id="monto" min="0" step="100" placeholder="0" required></div>
    <div class="campo"><label for="cat">Categor&iacute;a</label><select id="cat">
      <option>Aseo</option><option>Mantenimiento</option><option>Insumos</option>
      <option>Transporte</option><option>Alimentaci&oacute;n</option><option>Otro</option>
    </select></div>
    <div class="campo"><label for="quien">Qui&eacute;n</label><input type="text" id="quien" placeholder="Nombre"></div>
    <div class="campo ancho"><label for="concepto">Concepto</label><input type="text" id="concepto" placeholder="En qu&eacute; se gast&oacute;" required></div>
  </div>
  <button type="submit">A&ntilde;adir gasto</button>
</form>

<div class="acciones">
  <button id="base">Fijar base de caja</button>
  <button id="csv">Descargar CSV</button>
  <button id="copiar">Copiar</button>
</div>

<div id="contenido"></div>

<footer>Los gastos se guardan en este dispositivo. Desc&aacute;rgalos para respaldarlos.</footer>

<script>
(function(){
  "use strict";
${JS_COMUN}

  var $mes = document.getElementById('mes');
  var $cont = document.getElementById('contenido');
  var $resumen = document.getElementById('resumen');
  var $sub = document.getElementById('sub');

  var caja = almacen('b79-caja-gastos');
  var mes = params.get('mes') || hoy().slice(0,7);
  $mes.value = mes;
  document.getElementById('fecha').value = hoy();

  var moneda = new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 });
  function plata(n){ return moneda.format(Number(n)||0); }

  function leerBase(){
    try { return Number(localStorage.getItem('b79-caja-base')) || 0; } catch(e){ return 0; }
  }
  function guardarBase(v){ try { localStorage.setItem('b79-caja-base', String(v)); } catch(e){} }

  function delMes(){
    return caja.leer().filter(function(g){ return String(g.fecha).slice(0,7) === mes; })
      .sort(function(a,b){ return a.fecha < b.fecha ? 1 : -1; });
  }

  function cifra(k,v,clase){
    return '<div class="cifra"><div class="k">' + k + '</div><div class="v' +
           (clase ? ' ' + clase : '') + '">' + v + '</div></div>';
  }

  function pintar(){
    var lista = delMes();
    var gastado = lista.reduce(function(s,g){ return s + (Number(g.monto)||0); }, 0);
    var base = leerBase();
    var saldo = base - gastado;

    $resumen.innerHTML =
      cifra('Base', plata(base)) +
      cifra('Gastado', plata(gastado)) +
      cifra('Saldo', plata(saldo), saldo < 0 ? 'saldo-bajo' : '');
    $sub.textContent = lista.length + (lista.length === 1 ? ' gasto' : ' gastos') + ' este mes';

    if(!lista.length){
      $cont.innerHTML = '<div class="vacio">Sin gastos anotados este mes.</div>';
      return;
    }
    $cont.innerHTML = lista.map(function(g){
      var meta = [g.categoria];
      if(g.quien) meta.push(g.quien);
      meta.push(fechaCorta(g.fecha));
      var h = '<article class="card gasto" data-id="' + esc(g.id) + '">';
      h += '<div class="info">';
      h += '<div class="concepto">' + esc(g.concepto) + '</div>';
      h += '<div class="meta">' + esc(meta.join(" · ")) + '</div>';
      h += '</div>';
      h += '<div class="plata"><div class="total">' + plata(g.monto) + '</div></div>';
      h += '<button class="borrar" data-accion="borrar" aria-label="Borrar">&times;</button>';
      h += '</article>';
      return h;
    }).join('');
  }

  document.getElementById('alta').addEventListener('submit', function(ev){
    ev.preventDefault();
    var todos = caja.leer();
    todos.push({
      id: 'g' + Date.now(),
      fecha: document.getElementById('fecha').value,
      monto: Number(document.getElementById('monto').value) || 0,
      categoria: document.getElementById('cat').value,
      quien: document.getElementById('quien').value.trim(),
      concepto: document.getElementById('concepto').value.trim()
    });
    caja.guardar(todos);
    document.getElementById('monto').value = '';
    document.getElementById('concepto').value = '';
    pintar();
  });

  $cont.addEventListener('click', function(ev){
    var boton = ev.target.closest ? ev.target.closest('[data-accion="borrar"]') : null;
    if(!boton) return;
    var id = boton.closest('.card').getAttribute('data-id');
    var todos = caja.leer().filter(function(g){ return g.id !== id; });
    caja.guardar(todos);
    pintar();
  });

  document.getElementById('base').addEventListener('click', function(){
    var v = prompt('Base de caja menor, en pesos:', String(leerBase()));
    if(v === null) return;
    guardarBase(Number(v) || 0);
    pintar();
  });

  function filas(){
    var f = [['Fecha','Concepto','Categoría','Quién','Monto']];
    delMes().forEach(function(g){ f.push([g.fecha,g.concepto,g.categoria,g.quien,g.monto]); });
    return f;
  }
  document.getElementById('csv').addEventListener('click', function(){
    descargarCsv('caja-menor-' + mes + '.csv', csv(filas()));
  });
  document.getElementById('copiar').addEventListener('click', function(){
    copiar(csv(filas()), this);
  });

  $mes.addEventListener('change', function(){ mes = $mes.value || hoy().slice(0,7); pintar(); });

  pintar();
})();
<\/script>`;

  return layout('Caja menor · Bahía 79', cuerpo);
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
  jacuzzi: paginaJacuzzi,
  cajamenor: paginaCajaMenor,
};

function renderPage(page) {
  const clave = String(page || 'inicio').toLowerCase();
  const fn = PAGINAS[clave];
  return fn ? fn() : paginaPendiente('Página desconocida',
    'No hay ninguna p&aacute;gina con ese nombre. Vuelve al inicio para ver las disponibles.');
}

module.exports = { renderPage };
