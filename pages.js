// pages.js — HTML de las páginas del sistema interno del Hotel Bahía 79.
//
// Este archivo NO toca LobbyPMS: no contiene credenciales, ni el flujo de login
// contra el PMS, ni llamadas a él. Sólo genera HTML. Las páginas piden sus datos
// al propio proxy por HTTP, igual que cualquier cliente externo.
//
// Editar el diseño de una página nunca debe requerir abrir server.js.

const PROXY_URL_POR_DEFECTO = 'https://b79-proxy.onrender.com';

// Las páginas del menú, en orden. `admin: true` la esconde del personal.
const MENU = [
  { clave: 'panel',       titulo: 'Panel',       icono: 'panel' },
  { clave: 'aseo',        titulo: 'Aseo',        icono: 'aseo' },
  { clave: 'facturacion', titulo: 'Facturación', icono: 'factura' },
  { clave: 'jacuzzi',     titulo: 'Jacuzzi',     icono: 'jacuzzi' },
  { clave: 'cajamenor',   titulo: 'Caja menor',  icono: 'caja' },
  { clave: 'historial',   titulo: 'Historial',   icono: 'historial', admin: true },
  { clave: 'usuarios',    titulo: 'Usuarios',    icono: 'usuarios',  admin: true },
];

// Iconos dibujados a mano, en trazo. Sin librerías ni fuentes externas: pesan
// unos bytes y se pintan del color del texto.
const ICONOS = {
  panel:     '<path d="M3 12h5l2-7 4 14 2-7h5"/>',
  aseo:      '<path d="M9 3v6M15 3v6M6 9h12l-1.2 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8Z"/>',
  factura:   '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
  jacuzzi:   '<path d="M4 11h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M7 11V5a2 2 0 0 1 4 0"/>',
  caja:      '<path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 8l3-5h12l3 5"/><path d="M12 13v3"/>',
  historial: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  usuarios:  '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 8.2a3 3 0 0 1 0 5.6M18.5 20a6 6 0 0 0-2.2-4.6"/>',
  salir:     '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 15l3-3-3-3M19 12H9"/>',
  menu:      '<path d="M4 7h16M4 12h16M4 17h16"/>',
};

function icono(nombre, tam) {
  return '<svg class="ico" width="' + (tam || 20) + '" height="' + (tam || 20) +
         '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         (ICONOS[nombre] || '') + '</svg>';
}

// ---------------------------------------------------------------------------
// Sistema visual
// ---------------------------------------------------------------------------
//
// Los tres colores de categoría (salidas, llegadas, en casa) están validados
// para daltonismo con el script de la guía de visualización: la pareja peor
// separada queda en ΔE 20.6 en protanopia, muy por encima del mínimo de 8.
// La combinación anterior (rojo vs verde) daba ΔE 3.2: indistinguibles.
// Si cambias alguno, vuelve a pasar el validador antes de subirlo.

const ESTILOS = `
:root{
  --ground:#F1F3EF; --surface:#FFFFFF; --surface-2:#E9EDE7; --barra:#122629;
  --ink:#122629; --muted:#586A67; --tenue:#8A9995; --line:#D8DED4;
  --salida:#D55E00; --llegada:#0072B2; --encasa:#8E63A8;
  --ok:#1E6B54; --peligro:#B3261E; --aviso:#8A5A00;
  --sombra:0 1px 2px rgba(18,38,41,.06), 0 8px 24px -18px rgba(18,38,41,.35);
  --radio:12px;
}
@media (prefers-color-scheme:dark){
  :root{
    --ground:#0D1A1D; --surface:#15272B; --surface-2:#1C3237; --barra:#0A1417;
    --ink:#E7EDE8; --muted:#9BABA7; --tenue:#71847F; --line:#264046;
    --salida:#D9762E; --llegada:#3E93CC; --encasa:#9E6FB5;
    --ok:#4FA98C; --peligro:#E8918A; --aviso:#D2A05A;
    --sombra:0 1px 2px rgba(0,0,0,.4), 0 10px 28px -20px rgba(0,0,0,.9);
  }
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--ground); color:var(--ink);
  font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit}
.ico{flex-shrink:0}

/* ---------------------------------------------------- armazón: lateral + main */
.app{display:flex;min-height:100vh}
.lateral{
  width:236px;flex-shrink:0;background:var(--barra);color:#E7EDE8;
  display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;
}
.marca{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.09)}
.marca .n{font-size:15px;font-weight:700;letter-spacing:-.01em}
.marca .s{font-size:12px;color:#8FA3A0;margin-top:1px}
.nav{padding:10px 10px;flex:1;overflow-y:auto}
.nav a{
  display:flex;align-items:center;gap:11px;
  padding:10px 12px;border-radius:9px;margin-bottom:2px;
  color:#B9C8C5;text-decoration:none;font-size:14.5px;font-weight:500;
  min-height:42px;
}
.nav a:hover{background:rgba(255,255,255,.06);color:#fff}
.nav a.activo{background:rgba(255,255,255,.11);color:#fff;font-weight:600}
.nav .grupo{
  font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:#6E817E;padding:16px 12px 6px;
}
.pie-lateral{padding:10px;border-top:1px solid rgba(255,255,255,.09)}
.quien{padding:8px 12px 10px}
.quien .n{font-size:14px;font-weight:600;color:#E7EDE8}
.quien .r{font-size:12px;color:#8FA3A0;text-transform:capitalize}
.pie-lateral a{
  display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:9px;
  color:#B9C8C5;text-decoration:none;font-size:14px;min-height:40px;cursor:pointer;
}
.pie-lateral a:hover{background:rgba(255,255,255,.06);color:#fff}

.principal{flex:1;min-width:0;display:flex;flex-direction:column}
.superior{
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  padding:16px 24px;border-bottom:1px solid var(--line);
  background:var(--ground);position:sticky;top:0;z-index:20;
}
.superior h1{margin:0;font-size:20px;font-weight:700;letter-spacing:-.015em}
.superior .sub{color:var(--muted);font-size:13px;margin-top:1px}
.crece{flex:1;min-width:120px}
.contenido{padding:24px;max-width:1180px;width:100%}
.hamburguesa{display:none;background:none;border:none;color:var(--ink);padding:6px;cursor:pointer}

@media (max-width:860px){
  .hamburguesa{display:block}
  .lateral{
    position:fixed;left:0;top:0;z-index:50;transform:translateX(-100%);
    transition:transform .22s ease;box-shadow:0 0 40px rgba(0,0,0,.4);
  }
  body.menu-abierto .lateral{transform:translateX(0)}
  body.menu-abierto .velo{
    position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:40;
  }
  .contenido{padding:16px}
  .superior{padding:12px 16px}
}

/* ------------------------------------------------------------------ controles */
input,select,button,textarea{font:inherit}
input[type=date],input[type=month],input[type=time],input[type=search],
input[type=text],input[type=password],input[type=number],select{
  font-size:16px;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  padding:9px 12px;min-height:44px;width:100%;
}
.superior input{width:auto}
button{
  font-weight:600;color:var(--ink);
  background:var(--surface);border:1px solid var(--line);border-radius:10px;
  padding:9px 14px;min-height:44px;cursor:pointer;
}
button:active{transform:translateY(1px)}
button.principal-btn{background:var(--ok);border-color:var(--ok);color:#fff}
button.peligro{color:var(--peligro);border-color:var(--line)}

/* --------------------------------------------------------------- superficies */
.tarjeta{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radio);
  box-shadow:var(--sombra);
}
.rejilla{display:grid;gap:14px}
.cifras{grid-template-columns:repeat(auto-fit,minmax(158px,1fr))}
.cifra{padding:16px 18px}
.cifra .k{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.cifra .v{font-size:27px;font-weight:700;margin-top:5px;letter-spacing:-.025em;font-variant-numeric:tabular-nums}
.cifra .d{font-size:12.5px;color:var(--tenue);margin-top:3px}
.cifra .v.negativo{color:var(--peligro)}
h2.seccion{
  font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--muted);margin:30px 0 12px;
}
h2.seccion:first-child{margin-top:0}

/* --------------------------------------------------------------- gráfica */
.gr{padding:18px 20px 14px}
.gr h3{margin:0 0 2px;font-size:15.5px;font-weight:700;letter-spacing:-.01em}
.gr .nota{margin:0 0 16px;font-size:12.5px;color:var(--tenue)}
.barras{display:grid;gap:11px}
.barra-fila{display:grid;grid-template-columns:minmax(84px,132px) 1fr auto;gap:12px;align-items:center}
.barra-fila .et{font-size:13.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.barra-fila .pista{height:11px;background:var(--surface-2);border-radius:0 4px 4px 0;overflow:hidden}
.barra-fila .val{font-size:13.5px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.barra-fila i{display:block;height:100%;border-radius:0 4px 4px 0;background:var(--llegada);transition:width .35s ease}
.barra-fila:hover .et{color:var(--ink)}

/* ------------------------------------------------------------------ tablas */
.tabla-marco{overflow-x:auto;border-radius:var(--radio)}
table{width:100%;border-collapse:collapse;font-size:14px;background:var(--surface)}
th{
  text-align:left;font-size:11px;font-weight:700;letter-spacing:.07em;
  text-transform:uppercase;color:var(--muted);
  padding:11px 14px;border-bottom:1px solid var(--line);white-space:nowrap;
}
td{padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:none}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.etiqueta{
  display:inline-block;font-size:11px;font-weight:700;letter-spacing:.05em;
  text-transform:uppercase;padding:3px 9px;border-radius:99px;
  border:1px solid var(--line);color:var(--muted);
}
.etiqueta.admin{color:var(--encasa);border-color:var(--encasa)}
.etiqueta.si{color:var(--ok);border-color:var(--ok)}
.etiqueta.no{color:var(--tenue)}
.momento{color:var(--tenue);font-variant-numeric:tabular-nums;white-space:nowrap}

/* ------------------------------------------------------------------ estados */
.aviso{padding:22px;text-align:center;color:var(--muted);
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radio);}
.aviso strong{display:block;color:var(--ink);margin-bottom:6px;font-size:16px}
.vacio{color:var(--muted);font-size:14px;padding:18px;text-align:center}
.skel{height:76px;background:var(--surface-2);border-radius:var(--radio);margin-bottom:11px;
  animation:pulso 1.4s ease-in-out infinite}
@keyframes pulso{0%,100%{opacity:1}50%{opacity:.45}}
.error-linea{color:var(--peligro);font-size:13.5px;margin-top:10px;min-height:20px}
footer{color:var(--tenue);font-size:12px;text-align:center;padding:26px 0 8px}
`;

// Estilos extra que sólo usan algunas páginas.
const ESTILOS_PAGINA = `
/* tarjetas de aseo */
.card{display:flex;align-items:center;gap:14px;background:var(--surface);
  border:1px solid var(--line);border-left:4px solid var(--line);
  border-radius:var(--radio);padding:14px;margin-bottom:10px;box-shadow:var(--sombra);
  -webkit-tap-highlight-color:transparent;transition:opacity .2s ease}
.card.tocable{cursor:pointer}
section.salidas .card{border-left-color:var(--salida)}
section.llegadas .card{border-left-color:var(--llegada)}
section.encasa .card{border-left-color:var(--encasa)}
.card.lista{opacity:.5}
.card.lista .hab,.card.lista .nombre{text-decoration:line-through}
.info{flex:1;min-width:0}
.hab{font-size:20px;font-weight:700;letter-spacing:-.02em}
.nombre{font-size:14px;color:var(--muted);margin-top:1px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.meta{font-size:12px;color:var(--muted);margin-top:5px;font-variant-numeric:tabular-nums}
.notas{font-size:13px;margin-top:8px;padding:8px 10px;background:var(--surface-2);
  border-radius:8px;color:var(--ink)}
.check{flex-shrink:0;width:34px;height:34px;border-radius:50%;border:2px solid var(--line);
  display:grid;place-items:center;color:transparent;font-size:17px;font-weight:700}
.card.lista .check{background:var(--ok);border-color:var(--ok);color:#fff}
.plata{flex-shrink:0;text-align:right}
.plata .total{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}
.plata .imp{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;margin-top:2px}
section{margin-bottom:28px}
.titulo{display:flex;align-items:baseline;gap:8px;margin:0 0 4px}
.titulo h2{margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.titulo .n{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.tarea{font-size:13px;color:var(--muted);margin:0 0 12px}
section.salidas .titulo h2{color:var(--salida)}
section.llegadas .titulo h2{color:var(--llegada)}
section.encasa .titulo h2{color:var(--encasa)}
.progreso{width:100%;margin-top:10px}
.pista-p{height:8px;background:var(--surface-2);border-radius:99px;overflow:hidden}
.pista-p i{display:block;height:100%;width:0;background:var(--ok);border-radius:99px;transition:width .3s ease}
.progreso .txt{font-size:13px;color:var(--muted);margin-top:6px;font-variant-numeric:tabular-nums}

/* formularios */
.forma{padding:16px;margin-bottom:20px}
.forma h3{margin:0 0 13px;font-size:12px;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--muted)}
.campos{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px;margin-bottom:12px}
.campo label{display:block;font-size:12px;color:var(--muted);margin-bottom:4px}
.ancho{grid-column:1/-1}
.acciones{display:flex;gap:9px;margin-bottom:20px;flex-wrap:wrap}
.acciones button{flex:1;min-width:132px}
.chip{border:1px solid var(--line);border-radius:99px;padding:5px 12px;font-size:12px;
  font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:var(--surface);
  cursor:pointer;min-height:34px}
.chip[data-estado="en uso"]{color:var(--salida);border-color:var(--salida)}
.chip[data-estado="aseado"]{color:var(--ok);border-color:var(--ok)}
.borrar{flex-shrink:0;background:none;border:none;color:var(--tenue);font-size:22px;
  line-height:1;padding:6px 10px;min-height:38px;cursor:pointer}
.borrar:hover{color:var(--peligro)}
.gasto .concepto{font-size:16px;font-weight:600}

/* acceso */
.acceso-pantalla{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--ground)}
.acceso-caja{width:100%;max-width:380px}
.acceso-marca{text-align:center;margin-bottom:26px}
.acceso-marca .n{font-size:22px;font-weight:700;letter-spacing:-.02em}
.acceso-marca .s{font-size:13.5px;color:var(--muted);margin-top:3px}
.acceso-caja form{padding:22px}
.acceso-caja .campo{margin-bottom:13px}
.acceso-caja button{width:100%;margin-top:6px}
`;

function layout(titulo, cuerpo, extra) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#122629">
<title>${titulo}</title>
<style>${ESTILOS}${ESTILOS_PAGINA}</style>
</head>
<body>
${cuerpo}
<script>${JS_NAV}<\/script>
${extra || ''}
</body>
</html>`;
}

// Armazón con barra lateral. `activa` es la clave del menú que se resalta.
function conMenu(activa, titulo, encabezado, cuerpo, script) {
  const enlaces = MENU.map(m => {
    const clase = 'nav-item' + (m.clave === activa ? ' activo' : '') + (m.admin ? ' solo-admin' : '');
    return `<a class="${clase}" data-page="${m.clave}" href="?action=html&amp;page=${m.clave}">` +
           icono(m.icono) + `<span>${m.titulo}</span></a>`;
  }).join('\n      ');

  const cuerpoCompleto = `
<div class="velo" id="velo"></div>
<div class="app">
  <aside class="lateral" id="lateral">
    <div class="marca">
      <div class="n">Bahía 79</div>
      <div class="s">Apartasuite &middot; Operación</div>
    </div>
    <nav class="nav">
      ${enlaces}
    </nav>
    <div class="pie-lateral">
      <div class="quien"><div class="n" id="mi-nombre">&nbsp;</div><div class="r" id="mi-rol">&nbsp;</div></div>
      <a id="salir">${icono('salir')}<span>Salir</span></a>
    </div>
  </aside>
  <div class="principal">
    <div class="superior">
      <button class="hamburguesa" id="hamburguesa" aria-label="Menú">${icono('menu', 24)}</button>
      ${encabezado}
    </div>
    <div class="contenido">
${cuerpo}
    </div>
  </div>
</div>`;

  return layout(titulo, cuerpoCompleto, script ? `<script>${script}<\/script>` : '');
}

function encabezado(titulo, subId, controles) {
  return `<div class="crece">
        <h1>${titulo}</h1>
        <div class="sub" id="${subId || 'sub'}">&nbsp;</div>
      </div>
      ${controles || ''}`;
}

// ---------------------------------------------------------------------------
// JavaScript compartido por todas las páginas
// ---------------------------------------------------------------------------

// Navegación. Los enlaces entre páginas nunca pueden ser relativos: servida
// desde Netlify en /aseo, una URL como "?action=html&page=panel" resolvería a
// /aseo?action=html&page=panel, que la regla de _redirects vuelve a mandar a
// aseo. Por eso cada enlace lleva data-page y aquí se le pone el href correcto.
const JS_NAV = `
(function(){
  var CORTAS = {
    panel:'/', inicio:'/', aseo:'/aseo', facturacion:'/facturacion',
    jacuzzi:'/jacuzzi', cajamenor:'/caja-menor',
    historial:'/historial', usuarios:'/usuarios', entrar:'/entrar'
  };
  var LARGAS = {
    panel:'/b79', inicio:'/b79', aseo:'/b79-aseo', facturacion:'/b79-facturacion',
    jacuzzi:'/b79-jacuzzi', cajamenor:'/b79-caja-menor',
    historial:'/b79-historial', usuarios:'/b79-usuarios', entrar:'/b79-entrar'
  };
  var RUTAS = location.pathname.indexOf('/b79') === 0 ? LARGAS : CORTAS;
  var q = new URLSearchParams(location.search);
  var directo = location.hostname.indexOf('onrender.com') !== -1 ||
                location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var api = q.get('api');
  window.B79_RUTA = function(p){
    return directo
      ? '?action=html&page=' + p + (api ? '&api=' + encodeURIComponent(api) : '')
      : (RUTAS[p] || RUTAS.panel);
  };
  Array.prototype.forEach.call(document.querySelectorAll('a[data-page]'), function(a){
    a.href = window.B79_RUTA(a.getAttribute('data-page'));
  });
  var h = document.getElementById('hamburguesa');
  var velo = document.getElementById('velo');
  if(h) h.addEventListener('click', function(){ document.body.classList.toggle('menu-abierto'); });
  if(velo) velo.addEventListener('click', function(){ document.body.classList.remove('menu-abierto'); });
})();
`;

const JS_COMUN = `
  var params = new URLSearchParams(location.search);
  var esLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // SISTEMA es el proxy: quien sabe de sesiones, usuarios e historial. Nunca es
  // location.origin en producción, porque las páginas se sirven desde Netlify y
  // el proxy vive en otro dominio.
  var SISTEMA = esLocal ? location.origin : '${PROXY_URL_POR_DEFECTO}';

  // API es de dónde salen los datos de huéspedes. Sólo esto se puede desviar con
  // ?api=, que existe para rediseñar páginas contra datos inventados. Desviar
  // también la sesión rompería el acceso.
  var API = params.get('api') || SISTEMA;

  var LLAVE = 'b79-sesion';
  function leerToken(){ try { return localStorage.getItem(LLAVE) || ''; } catch(e){ return ''; } }
  function guardarToken(v){ try { localStorage.setItem(LLAVE, v); } catch(e){} }
  function olvidarToken(){ try { localStorage.removeItem(LLAVE); } catch(e){} }

  function alAcceso(){ location.href = window.B79_RUTA('entrar'); }

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function hoy(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' +
           String(d.getDate()).padStart(2,'0');
  }

  function fechaCorta(f){
    if(!f) return '';
    var p = String(f).slice(0,10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] : String(f);
  }

  function marcaHora(){
    var a = new Date();
    return 'Actualizado ' + String(a.getHours()).padStart(2,'0') + ':' +
           String(a.getMinutes()).padStart(2,'0');
  }

  var moneda = new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 });
  function plata(n){ return moneda.format(Number(n)||0); }

  // Toda llamada al proxy pasa por aquí: añade la sesión y, si el servidor la
  // rechaza, manda a la pantalla de acceso en vez de dejar la página muerta.
  function pedirA(base, accion, opciones){
    opciones = opciones || {};
    var cab = { 'Content-Type':'application/json' };
    var t = leerToken();
    if(t) cab['X-B79-Token'] = t;
    return fetch(base + '/?action=' + accion + (opciones.cola || ''), {
      method: opciones.metodo || 'GET',
      cache: 'no-store',
      headers: cab,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
    }).then(function(r){
      if(r.status === 401 || r.status === 403){
        var e = new Error(r.status === 403 ? 'sin_permiso' : 'sin_sesion');
        e.sesion = true; e.estado = r.status;
        throw e;
      }
      return r.json().then(function(j){
        if(!j || !j.ok) throw new Error((j && j.error) || 'respuesta inesperada');
        return j;
      });
    });
  }

  function llamar(accion, opciones){ return pedirA(SISTEMA, accion, opciones); }

  function traer(accion, fecha){
    return pedirA(API, accion, { cola: '&date=' + encodeURIComponent(fecha) })
      .then(function(j){ return j.huespedes || []; });
  }

  // Pinta el nombre en la barra lateral y esconde lo que el rol no puede ver.
  function prepararSesion(){
    return llamar('yo').then(function(j){
      var u = j.usuario;
      var n = document.getElementById('mi-nombre');
      var r = document.getElementById('mi-rol');
      if(n) n.textContent = u.nombre;
      if(r) r.textContent = u.rol === 'admin' ? 'Administración' : 'Personal';
      if(u.rol !== 'admin'){
        Array.prototype.forEach.call(document.querySelectorAll('.solo-admin'), function(a){
          a.style.display = 'none';
        });
      }
      var s = document.getElementById('salir');
      if(s) s.addEventListener('click', function(){
        llamar('salir').catch(function(){}).then(function(){ olvidarToken(); alAcceso(); });
      });
      return u;
    });
  }

  function fallo(destino, e, quePasaba){
    if(e && e.sesion){
      if(e.estado === 403){
        destino.innerHTML = '<div class="aviso"><strong>No tienes permiso</strong>' +
          'Esta sección es sólo para administración.</div>';
        return;
      }
      olvidarToken(); alAcceso(); return;
    }
    destino.innerHTML = '<div class="aviso"><strong>' + esc(quePasaba) + '</strong>' +
      'Revisa la conexión y vuelve a intentar. (' + esc(e && e.message) + ')</div>';
  }

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
      var b = new Blob(['\\ufeff' + texto], { type:'text/csv;charset=utf-8' });
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
`;

// ---------------------------------------------------------------------------
// Acceso
// ---------------------------------------------------------------------------

function paginaEntrar() {
  const cuerpo = `
<div class="acceso-pantalla">
  <div class="acceso-caja">
    <div class="acceso-marca">
      <div class="n" id="titulo-acceso">Bahía 79 Apartasuite</div>
      <div class="s" id="bajada-acceso">Sistema interno de operación</div>
    </div>
    <form class="tarjeta" id="entrar" autocomplete="on">
      <div class="campo">
        <label for="usuario">Usuario</label>
        <input type="text" id="usuario" autocomplete="username" autocapitalize="none" required>
      </div>
      <div class="campo">
        <label for="clave">Contraseña</label>
        <input type="password" id="clave" autocomplete="current-password" required>
      </div>
      <div class="error-linea" id="error"></div>
      <button type="submit" class="principal-btn" id="boton">Entrar</button>
    </form>
    <footer>Si no tienes cuenta, pídesela a administración.</footer>
  </div>
</div>`;

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $error = document.getElementById('error');
  var $boton = document.getElementById('boton');
  var $forma = document.getElementById('entrar');
  var primeraVez = false;

  // Si ya hay sesión válida, no tiene sentido volver a pedirla.
  if(leerToken()){
    llamar('yo').then(function(){ location.href = window.B79_RUTA('panel'); }).catch(function(){ olvidarToken(); });
  }

  // Sistema recién instalado: en vez de mandar a nadie a una terminal, la
  // primera cuenta se crea aquí. La puerta se cierra sola en cuanto existe.
  llamar('hay_usuarios').then(function(j){
    if(!j.base){
      $error.textContent = 'El sistema todavía no tiene base de datos configurada.';
      $boton.disabled = true;
      return;
    }
    if(j.hay) return;
    primeraVez = true;
    document.getElementById('titulo-acceso').textContent = 'Crea la cuenta de administración';
    document.getElementById('bajada-acceso').textContent =
      'Este sistema todavía no tiene dueño. La cuenta que crees ahora será la primera, y desde ella podrás dar de alta al resto.';
    var extra = document.createElement('div');
    extra.className = 'campo';
    extra.innerHTML = '<label for="nombre">Tu nombre completo</label>' +
      '<input type="text" id="nombre" autocomplete="name" required>';
    $forma.insertBefore(extra, $forma.firstElementChild);
    document.getElementById('clave').setAttribute('autocomplete','new-password');
    document.querySelector('label[for=clave]').textContent = 'Contraseña (mínimo 8 caracteres)';
    $boton.textContent = 'Crear mi cuenta';
  }).catch(function(){});

  var MENSAJES = {
    usuario_o_clave_incorrectos: 'Usuario o contraseña incorrectos.',
    faltan_datos: 'Escribe tu usuario y tu contraseña.',
    sin_base_de_datos: 'El sistema todavía no tiene base de datos configurada.',
    usa_post: 'Error interno al enviar el formulario.',
    ya_hay_usuarios: 'El sistema ya tiene cuentas. Entra con la tuya.',
    usuario_invalido: 'El USUARIO no sirve: usa entre 3 y 64 caracteres, sin espacios. Vale un correo.',
    clave_muy_corta: 'La CONTRASEÑA necesita al menos 8 caracteres.'
  };

  document.getElementById('entrar').addEventListener('submit', function(ev){
    ev.preventDefault();
    $error.textContent = '';
    $boton.disabled = true;
    $boton.textContent = primeraVez ? 'Creando…' : 'Entrando…';

    var usuario = document.getElementById('usuario').value.trim();
    var clave = document.getElementById('clave').value;
    var etiqueta = primeraVez ? 'Crear mi cuenta' : 'Entrar';

    // Se avisa aquí, en español, en vez de dejar que el navegador muestre su
    // propio mensaje en el idioma que tenga configurado.
    if(primeraVez && clave.length < 8){
      $error.textContent = MENSAJES.clave_muy_corta;
      $boton.disabled = false; $boton.textContent = etiqueta;
      return;
    }

    function restaurar(){ $boton.disabled = false; $boton.textContent = etiqueta; }

    function enviar(accion, cuerpo){
      return fetch(SISTEMA + '/?action=' + accion, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(cuerpo)
      }).then(function(r){ return r.json().catch(function(){ return null; }); });
    }

    var paso = primeraVez
      ? enviar('primer_admin', {
          usuario: usuario, clave: clave,
          nombre: document.getElementById('nombre').value.trim()
        }).then(function(j){
          if(!j || !j.ok) throw new Error((j && j.error) || 'fallo');
          // recién creada, se entra con ella
          return enviar('entrar', { usuario: usuario, clave: clave });
        })
      : enviar('entrar', { usuario: usuario, clave: clave });

    paso.then(function(j){
        if(!j || !j.ok){
          $error.textContent = MENSAJES[j && j.error] || 'No se pudo entrar. Intenta de nuevo.';
          restaurar();
          return;
        }
        guardarToken(j.token);
        location.href = window.B79_RUTA('panel');
      })
      .catch(function(e){
        $error.textContent = MENSAJES[e.message] || 'Sin conexión con el sistema.';
        restaurar();
      });
  });
})();
`;
  return layout('Entrar · Bahía 79', cuerpo, `<script>${script}<\/script>`);
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

function paginaPanel() {
  const cuerpo = `
<div class="rejilla cifras" id="cifras">
  <div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>
</div>

<h2 class="seccion">Ventas por canal</h2>
<div class="tarjeta gr" id="canales">
  <div class="skel" style="margin:0"></div>
</div>

<footer>Los datos vienen de LobbyPMS en vivo. No sustituyen los informes oficiales.</footer>`;

  const encab = encabezado('Panel', 'sub',
    '<input type="date" id="fecha" aria-label="Fecha">' +
    '<button id="recargar" aria-label="Recargar">&#8635;</button>');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $cifras = document.getElementById('cifras');
  var $canales = document.getElementById('canales');
  var $sub = document.getElementById('sub');
  var $fecha = document.getElementById('fecha');
  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;

  function cifra(k, v, d, negativo){
    return '<div class="tarjeta cifra"><div class="k">' + esc(k) + '</div>' +
           '<div class="v' + (negativo ? ' negativo' : '') + '">' + esc(v) + '</div>' +
           (d ? '<div class="d">' + esc(d) + '</div>' : '') + '</div>';
  }

  // Barras horizontales ordenadas de mayor a menor. Una sola serie, así que
  // un solo color: pintar cada canal de un tono distinto añadiría color sin
  // añadir información. El valor va escrito al lado de cada barra.
  function barras(filas, formato){
    if(!filas.length) return '<div class="vacio">Sin ventas registradas en esta fecha.</div>';
    var tope = Math.max.apply(null, filas.map(function(f){ return f.valor; })) || 1;
    return '<div class="barras">' + filas.map(function(f){
      var pct = Math.max(2, Math.round(f.valor / tope * 100));
      return '<div class="barra-fila">' +
        '<div class="et" title="' + esc(f.etiqueta) + '">' + esc(f.etiqueta) + '</div>' +
        '<div class="pista"><i style="width:' + pct + '%"></i></div>' +
        '<div class="val">' + esc(formato(f.valor)) + '</div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function pintar(encasa, llegadas, salidas, facturacion){
    var ingresos = facturacion.reduce(function(s,h){ return s + (Number(h.total)||0); }, 0);
    var impuestos = facturacion.reduce(function(s,h){ return s + (Number(h.impuesto)||0); }, 0);
    var personas = encasa.reduce(function(s,h){ return s + (Number(h.adultos)||0) + (Number(h.ninos)||0); }, 0);

    $cifras.innerHTML =
      cifra('En casa', String(encasa.length), personas + (personas === 1 ? ' persona alojada' : ' personas alojadas')) +
      cifra('Llegadas', String(llegadas.length), 'habitaciones por preparar') +
      cifra('Salidas', String(salidas.length), 'limpieza a fondo') +
      cifra('Ingresos', plata(ingresos), 'impuestos ' + plata(impuestos));

    var porCanal = {};
    facturacion.forEach(function(h){
      var c = (h.agencia || 'Sin canal').trim() || 'Sin canal';
      porCanal[c] = (porCanal[c] || 0) + (Number(h.total) || 0);
    });
    var filas = Object.keys(porCanal).map(function(c){ return { etiqueta:c, valor:porCanal[c] }; })
      .filter(function(f){ return f.valor > 0; })
      .sort(function(a,b){ return b.valor - a.valor; });

    $canales.innerHTML =
      '<h3>De dónde vienen las ventas</h3>' +
      '<p class="nota">Total facturado por canal en la fecha elegida.</p>' +
      barras(filas, plata);
  }

  function cargar(){
    $sub.textContent = 'Cargando…';
    Promise.all([traer('aseo',fecha), traer('llegadas',fecha), traer('salidas',fecha), traer('facturacion',fecha)])
      .then(function(r){ pintar(r[0],r[1],r[2],r[3]); $sub.textContent = marcaHora(); })
      .catch(function(e){
        $sub.textContent = 'Sin datos';
        $canales.innerHTML = '';
        fallo($cifras, e, 'No se pudo cargar el panel');
      });
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); cargar(); });
  document.getElementById('recargar').addEventListener('click', cargar);

  prepararSesion().then(cargar).catch(function(e){ fallo($cifras, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('panel', 'Panel · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Usuarios (sólo administración)
// ---------------------------------------------------------------------------

function paginaUsuarios() {
  const cuerpo = `
<form class="tarjeta forma" id="alta">
  <h3>Dar de alta a alguien</h3>
  <div class="campos">
    <div class="campo"><label for="nombre">Nombre completo</label>
      <input type="text" id="nombre" placeholder="María Restrepo" required></div>
    <div class="campo"><label for="usuario">Usuario</label>
      <input type="text" id="usuario" placeholder="maria" autocapitalize="none" required></div>
    <div class="campo"><label for="clave">Contraseña inicial</label>
      <input type="text" id="clave" placeholder="mínimo 8 caracteres" required></div>
    <div class="campo"><label for="rol">Rol</label>
      <select id="rol"><option value="personal">Personal</option><option value="admin">Administración</option></select></div>
  </div>
  <div class="error-linea" id="error"></div>
  <button type="submit" class="principal-btn">Crear cuenta</button>
</form>

<h2 class="seccion">Cuentas</h2>
<div class="tarjeta tabla-marco" id="lista"><div class="skel" style="margin:0"></div></div>

<footer>La contraseña inicial se la das tú en persona. Cada quien puede cambiarla después.</footer>`;

  const encab = encabezado('Usuarios', 'sub');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $lista = document.getElementById('lista');
  var $sub = document.getElementById('sub');
  var $error = document.getElementById('error');
  var yo = null;

  var MENSAJES = {
    usuario_ya_existe: 'Ese usuario ya está tomado.',
    usuario_invalido: 'El USUARIO no sirve: usa entre 3 y 64 caracteres, sin espacios. Vale un correo.',
    clave_muy_corta: 'La contraseña necesita al menos 8 caracteres.',
    faltan_datos: 'Faltan el nombre o el usuario.',
    no_puedes_desactivarte: 'No puedes desactivar tu propia cuenta.'
  };

  function fila(u){
    var esYo = yo && u.id === yo.id;
    return '<tr data-id="' + esc(u.id) + '">' +
      '<td><strong>' + esc(u.nombre) + '</strong><br><span class="momento">' + esc(u.usuario) + '</span></td>' +
      '<td><span class="etiqueta' + (u.rol === 'admin' ? ' admin' : '') + '">' +
        (u.rol === 'admin' ? 'Admin' : 'Personal') + '</span></td>' +
      '<td><span class="etiqueta ' + (u.activo ? 'si' : 'no') + '">' +
        (u.activo ? 'Activa' : 'Inactiva') + '</span></td>' +
      '<td class="momento">' + esc(String(u.creado || '').slice(0,10)) + '</td>' +
      '<td class="num">' + (esYo
        ? '<span class="momento">tu cuenta</span>'
        : '<button class="' + (u.activo ? 'peligro' : '') + '" data-activo="' + (u.activo ? '0' : '1') + '">' +
          (u.activo ? 'Desactivar' : 'Reactivar') + '</button>') +
      '</td></tr>';
  }

  function pintar(usuarios){
    $sub.textContent = usuarios.length + (usuarios.length === 1 ? ' cuenta' : ' cuentas') +
      ' · ' + usuarios.filter(function(u){ return u.activo; }).length + ' activas';
    if(!usuarios.length){ $lista.innerHTML = '<div class="vacio">Todavía no hay cuentas.</div>'; return; }
    $lista.innerHTML = '<table><thead><tr>' +
      '<th>Persona</th><th>Rol</th><th>Estado</th><th>Desde</th><th></th>' +
      '</tr></thead><tbody>' + usuarios.map(fila).join('') + '</tbody></table>';
  }

  function cargar(){
    return llamar('usuarios').then(function(j){ pintar(j.usuarios); })
      .catch(function(e){ fallo($lista, e, 'No se pudo cargar la lista'); });
  }

  document.getElementById('alta').addEventListener('submit', function(ev){
    ev.preventDefault();
    $error.textContent = '';
    llamar('crear_usuario', { metodo:'POST', cuerpo:{
      nombre: document.getElementById('nombre').value.trim(),
      usuario: document.getElementById('usuario').value.trim(),
      clave: document.getElementById('clave').value,
      rol: document.getElementById('rol').value
    }}).then(function(){
      ['nombre','usuario','clave'].forEach(function(id){ document.getElementById(id).value = ''; });
      cargar();
    }).catch(function(e){
      if(e.sesion){ fallo($lista, e, ''); return; }
      $error.textContent = MENSAJES[e.message] || ('No se pudo crear la cuenta (' + e.message + ').');
    });
  });

  $lista.addEventListener('click', function(ev){
    var b = ev.target.closest ? ev.target.closest('button[data-activo]') : null;
    if(!b) return;
    var id = b.closest('tr').getAttribute('data-id');
    var activo = b.getAttribute('data-activo') === '1';
    if(!activo && !confirm('¿Desactivar esta cuenta? La persona dejará de poder entrar.')) return;
    b.disabled = true;
    llamar('estado_usuario', { metodo:'POST', cuerpo:{ id:id, activo:activo } })
      .then(cargar)
      .catch(function(e){ b.disabled = false; $error.textContent = MENSAJES[e.message] || e.message; });
  });

  prepararSesion().then(function(u){ yo = u; return cargar(); })
    .catch(function(e){ fallo($lista, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('usuarios', 'Usuarios · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Historial (sólo administración)
// ---------------------------------------------------------------------------

function paginaHistorial() {
  const cuerpo = `
<div class="tarjeta tabla-marco" id="lista"><div class="skel" style="margin:0"></div></div>
<div class="acciones" style="margin-top:16px">
  <button id="csv">Descargar CSV</button>
  <button id="copiar">Copiar</button>
</div>
<footer>Se registra qué se consultó y quién lo hizo, nunca los datos de los huéspedes.</footer>`;

  const encab = encabezado('Historial', 'sub',
    '<input type="search" id="filtro" placeholder="Filtrar por persona o acción" aria-label="Filtrar">' +
    '<button id="recargar" aria-label="Recargar">&#8635;</button>');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $lista = document.getElementById('lista');
  var $sub = document.getElementById('sub');
  var $filtro = document.getElementById('filtro');
  var TODOS = [];

  // Cada acción del sistema, dicha en español llano.
  var TEXTOS = {
    entrar: 'Entró al sistema',
    entrar_fallido: 'Intento fallido de entrar',
    salir: 'Cerró la sesión',
    crear_usuario: 'Creó una cuenta',
    activar_usuario: 'Reactivó una cuenta',
    desactivar_usuario: 'Desactivó una cuenta',
    cambiar_clave: 'Cambió su contraseña',
    consultar_aseo: 'Consultó el aseo',
    consultar_in_house: 'Consultó el aseo',
    consultar_llegadas: 'Consultó las llegadas',
    consultar_salidas: 'Consultó las salidas',
    consultar_facturacion: 'Consultó la facturación',
    consultar_all: 'Consultó la facturación'
  };

  function texto(a){ return TEXTOS[a] || a; }

  function cuando(iso){
    var d = new Date(iso);
    if(isNaN(d)) return String(iso || '');
    return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') +
           ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  function detalle(e){
    var d = e.detalle;
    if(!d) return '';
    if(d.fecha && d.resultados !== undefined) return 'fecha ' + fechaCorta(d.fecha) + ' · ' + d.resultados + ' resultados';
    if(d.usuario) return d.usuario + (d.rol ? ' (' + d.rol + ')' : '');
    return '';
  }

  function pintar(lista){
    $sub.textContent = lista.length + (lista.length === 1 ? ' movimiento' : ' movimientos');
    if(!lista.length){ $lista.innerHTML = '<div class="vacio">Sin movimientos que mostrar.</div>'; return; }
    $lista.innerHTML = '<table><thead><tr>' +
      '<th>Cuándo</th><th>Quién</th><th>Qué hizo</th><th>Detalle</th>' +
      '</tr></thead><tbody>' + lista.map(function(e){
        var fallido = e.accion === 'entrar_fallido';
        return '<tr>' +
          '<td class="momento">' + esc(cuando(e.momento)) + '</td>' +
          '<td>' + esc(e.usuario || '—') + '</td>' +
          '<td' + (fallido ? ' style="color:var(--peligro)"' : '') + '>' + esc(texto(e.accion)) + '</td>' +
          '<td class="momento">' + esc(detalle(e)) + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table>';
  }

  function filtrar(){
    var q = $filtro.value.trim().toLowerCase();
    if(!q) return pintar(TODOS);
    pintar(TODOS.filter(function(e){
      return (String(e.usuario||'') + ' ' + texto(e.accion)).toLowerCase().indexOf(q) !== -1;
    }));
  }

  function cargar(){
    $sub.textContent = 'Cargando…';
    llamar('historial', { cola:'&limite=300' })
      .then(function(j){ TODOS = j.eventos; filtrar(); })
      .catch(function(e){ $sub.textContent = ''; fallo($lista, e, 'No se pudo cargar el historial'); });
  }

  function filas(){
    var f = [['Cuándo','Quién','Qué hizo','Detalle']];
    TODOS.forEach(function(e){ f.push([e.momento, e.usuario, texto(e.accion), detalle(e)]); });
    return f;
  }
  document.getElementById('csv').addEventListener('click', function(){
    descargarCsv('historial-' + hoy() + '.csv', csv(filas()));
  });
  document.getElementById('copiar').addEventListener('click', function(){ copiar(csv(filas()), this); });
  document.getElementById('recargar').addEventListener('click', cargar);
  $filtro.addEventListener('input', filtrar);

  prepararSesion().then(cargar).catch(function(e){ fallo($lista, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('historial', 'Historial · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Aseo
// ---------------------------------------------------------------------------

function paginaAseo() {
  const cuerpo = `
<div class="progreso"><div class="pista-p"><i id="barra"></i></div>
  <div class="txt" id="cuenta">&nbsp;</div></div>
<div id="contenido" style="margin-top:20px">
  <div class="skel"></div><div class="skel"></div><div class="skel"></div>
</div>
<footer>Marca cada habitación al terminarla. Se guarda en este teléfono.</footer>`;

  const encab = encabezado('Aseo', 'sub',
    '<input type="date" id="fecha" aria-label="Fecha">' +
    '<button id="recargar" aria-label="Recargar">&#8635;</button>');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var GRUPOS = [
    { clave:'salidas',  accion:'salidas',  titulo:'Salidas',  tarea:'Limpieza a fondo tras el check-out.' },
    { clave:'llegadas', accion:'llegadas', titulo:'Llegadas', tarea:'Preparar la habitación antes del check-in.' },
    { clave:'encasa',   accion:'aseo',     titulo:'En casa',  tarea:'Limpieza diaria con el huésped alojado.' }
  ];

  var $sub = document.getElementById('sub');
  var $cont = document.getElementById('contenido');
  var $barra = document.getElementById('barra');
  var $cuenta = document.getElementById('cuenta');
  var $fecha = document.getElementById('fecha');
  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;

  function claveDia(){ return 'b79-aseo-' + fecha; }
  function leerHechas(){ try { return JSON.parse(localStorage.getItem(claveDia()) || '[]'); } catch(e){ return []; } }
  function guardarHechas(l){ try { localStorage.setItem(claveDia(), JSON.stringify(l)); } catch(e){} }
  function idTarea(g,h){ return g + ':' + (h.habitacion || '?') + ':' + (h.codigo_reserva || h.nombre || ''); }

  function personas(h){
    var a = Number(h.adultos)||0, n = Number(h.ninos)||0, t = [];
    if(a) t.push(a + (a===1 ? ' adulto' : ' adultos'));
    if(n) t.push(n + (n===1 ? ' niño' : ' niños'));
    return t.join(', ');
  }

  function tarjeta(grupo, h, hechas){
    var id = idTarea(grupo, h);
    var lista = hechas.indexOf(id) !== -1;
    var meta = [];
    var per = personas(h);
    if(per) meta.push(per);
    if(h.fecha_ingreso || h.fecha_salida) meta.push(fechaCorta(h.fecha_ingreso) + ' → ' + fechaCorta(h.fecha_salida));
    var x = '<article class="card tocable' + (lista ? ' lista' : '') + '" data-id="' + esc(id) + '" role="button" tabindex="0">';
    x += '<div class="info"><div class="hab">' + esc(h.habitacion || 'Sin habitación') + '</div>';
    if(h.nombre) x += '<div class="nombre">' + esc(h.nombre) + '</div>';
    if(meta.length) x += '<div class="meta">' + esc(meta.join(' · ')) + '</div>';
    if(h.notas) x += '<div class="notas">' + esc(h.notas) + '</div>';
    x += '</div><div class="check" aria-hidden="true">✓</div></article>';
    return x;
  }

  function progreso(total, listas){
    $barra.style.width = (total ? Math.round(listas/total*100) : 0) + '%';
    $cuenta.textContent = total ? listas + ' de ' + total + ' habitaciones listas'
                                : 'Sin habitaciones para esta fecha';
  }

  function pintar(datos){
    var hechas = leerHechas(), html = '', total = 0, listas = 0;
    GRUPOS.forEach(function(g){
      var lista = datos[g.clave] || [];
      html += '<section class="' + g.clave + '">';
      html += '<div class="titulo"><h2>' + g.titulo + '</h2><span class="n">' + lista.length + '</span></div>';
      html += '<p class="tarea">' + g.tarea + '</p>';
      if(!lista.length){ html += '<div class="vacio">Nada por hacer aquí hoy.</div>'; }
      else lista.forEach(function(h){
        total++;
        if(hechas.indexOf(idTarea(g.clave,h)) !== -1) listas++;
        html += tarjeta(g.clave, h, hechas);
      });
      html += '</section>';
    });
    $cont.innerHTML = html;
    progreso(total, listas);
  }

  $cont.addEventListener('click', function(ev){
    var card = ev.target.closest ? ev.target.closest('.card') : null;
    if(!card) return;
    var id = card.getAttribute('data-id'), hechas = leerHechas(), i = hechas.indexOf(id);
    if(i === -1){ hechas.push(id); card.classList.add('lista'); }
    else { hechas.splice(i,1); card.classList.remove('lista'); }
    guardarHechas(hechas);
    progreso($cont.querySelectorAll('.card').length, $cont.querySelectorAll('.card.lista').length);
  });
  $cont.addEventListener('keydown', function(ev){
    if(ev.key !== 'Enter' && ev.key !== ' ') return;
    var card = ev.target.closest ? ev.target.closest('.card') : null;
    if(!card) return;
    ev.preventDefault(); card.click();
  });

  function cargar(){
    $sub.textContent = 'Cargando…';
    $cont.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    Promise.all(GRUPOS.map(function(g){ return traer(g.accion, fecha); }))
      .then(function(res){
        var datos = {};
        GRUPOS.forEach(function(g,i){ datos[g.clave] = res[i]; });
        pintar(datos);
        $sub.textContent = marcaHora();
      })
      .catch(function(e){
        $sub.textContent = 'Sin datos'; $barra.style.width = '0%'; $cuenta.textContent = '';
        fallo($cont, e, 'No se pudieron cargar las habitaciones');
      });
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); cargar(); });
  document.getElementById('recargar').addEventListener('click', cargar);
  prepararSesion().then(cargar).catch(function(e){ fallo($cont, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('aseo', 'Aseo · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Facturación
// ---------------------------------------------------------------------------

function paginaFacturacion() {
  const cuerpo = `
<div class="rejilla cifras" id="resumen"></div>
<div id="contenido" style="margin-top:22px">
  <div class="skel"></div><div class="skel"></div><div class="skel"></div>
</div>
<footer>Datos en vivo de LobbyPMS. No sustituyen la factura oficial.</footer>`;

  const encab = encabezado('Facturación', 'sub',
    '<input type="date" id="fecha" aria-label="Fecha">' +
    '<input type="search" id="buscar" placeholder="Habitación, nombre o agencia" aria-label="Buscar">' +
    '<button id="recargar" aria-label="Recargar">&#8635;</button>');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $cont = document.getElementById('contenido');
  var $resumen = document.getElementById('resumen');
  var $sub = document.getElementById('sub');
  var $buscar = document.getElementById('buscar');
  var $fecha = document.getElementById('fecha');
  var fecha = params.get('date') || hoy();
  $fecha.value = fecha;
  var TODAS = [];

  function cifra(k,v){ return '<div class="tarjeta cifra"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  function pintar(lista){
    var total = 0, imp = 0;
    lista.forEach(function(h){ total += Number(h.total)||0; imp += Number(h.impuesto)||0; });
    $resumen.innerHTML = cifra('Reservas', lista.length) + cifra('Total', plata(total)) + cifra('Impuestos', plata(imp));
    if(!lista.length){ $cont.innerHTML = '<div class="vacio">Ninguna reserva coincide.</div>'; return; }
    $cont.innerHTML = lista.map(function(h){
      var meta = [];
      if(h.agencia) meta.push(h.agencia);
      if(h.plan) meta.push(h.plan);
      if(h.estatus) meta.push(h.estatus);
      if(h.fecha_ingreso || h.fecha_salida) meta.push(fechaCorta(h.fecha_ingreso) + ' → ' + fechaCorta(h.fecha_salida));
      var x = '<article class="card"><div class="info">';
      x += '<div class="hab">' + esc(h.habitacion || 'Sin habitación') + '</div>';
      if(h.nombre) x += '<div class="nombre">' + esc(h.nombre) + '</div>';
      if(meta.length) x += '<div class="meta">' + esc(meta.join(' · ')) + '</div>';
      x += '</div><div class="plata"><div class="total">' + plata(h.total) + '</div>';
      if(Number(h.impuesto)) x += '<div class="imp">imp. ' + plata(h.impuesto) + '</div>';
      return x + '</div></article>';
    }).join('');
  }

  function filtrar(){
    var q = $buscar.value.trim().toLowerCase();
    if(!q) return pintar(TODAS);
    pintar(TODAS.filter(function(h){
      return [h.habitacion,h.nombre,h.agencia,h.plan,h.estatus].join(' ').toLowerCase().indexOf(q) !== -1;
    }));
  }

  function cargar(){
    $sub.textContent = 'Cargando…';
    $resumen.innerHTML = '';
    $cont.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    traer('facturacion', fecha)
      .then(function(l){ TODAS = l; filtrar(); $sub.textContent = marcaHora(); })
      .catch(function(e){ $sub.textContent = 'Sin datos'; $resumen.innerHTML = ''; fallo($cont, e, 'No se pudo cargar la facturación'); });
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); cargar(); });
  $buscar.addEventListener('input', filtrar);
  document.getElementById('recargar').addEventListener('click', cargar);
  prepararSesion().then(cargar).catch(function(e){ fallo($cont, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('facturacion', 'Facturación · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Jacuzzi
// ---------------------------------------------------------------------------

function paginaJacuzzi() {
  const cuerpo = `
<form class="tarjeta forma" id="alta">
  <h3>Anotar turno</h3>
  <div class="campos">
    <div class="campo"><label for="hora">Hora</label><input type="time" id="hora" required></div>
    <div class="campo"><label for="hab">Habitación</label>
      <input type="text" id="hab" list="habs" placeholder="201" required><datalist id="habs"></datalist></div>
    <div class="campo"><label for="pers">Personas</label><input type="number" id="pers" min="1" max="20" value="2"></div>
    <div class="campo ancho"><label for="nota">Nota</label><input type="text" id="nota" placeholder="Opcional"></div>
  </div>
  <button type="submit" class="principal-btn">Añadir turno</button>
</form>

<div class="acciones">
  <button id="csv">Descargar CSV</button>
  <button id="copiar">Copiar</button>
</div>

<div id="contenido"></div>
<footer>Los turnos se guardan en este dispositivo, no en LobbyPMS.</footer>`;

  const encab = encabezado('Jacuzzi', 'sub', '<input type="date" id="fecha" aria-label="Fecha">');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var ESTADOS = ['reservado','en uso','aseado'];
  var $cont = document.getElementById('contenido');
  var $sub = document.getElementById('sub');
  var $fecha = document.getElementById('fecha');
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
      var x = '<article class="card" data-id="' + esc(t.id) + '"><div class="info">';
      x += '<div class="hab">' + esc(t.hora) + ' · ' + esc(t.habitacion) + '</div>';
      if(t.personas) x += '<div class="meta">' + esc(t.personas + (Number(t.personas)===1?' persona':' personas')) + '</div>';
      if(t.nota) x += '<div class="notas">' + esc(t.nota) + '</div>';
      x += '</div><button class="chip" data-estado="' + esc(t.estado) + '" data-accion="estado">' + esc(t.estado) + '</button>';
      return x + '<button class="borrar" data-accion="borrar" aria-label="Borrar">×</button></article>';
    }).join('');
  }

  document.getElementById('alta').addEventListener('submit', function(ev){
    ev.preventDefault();
    var todos = caja.leer();
    todos.push({
      id:'j' + Date.now(), fecha:fecha,
      hora: document.getElementById('hora').value,
      habitacion: document.getElementById('hab').value.trim(),
      personas: document.getElementById('pers').value,
      nota: document.getElementById('nota').value.trim(),
      estado:'reservado'
    });
    caja.guardar(todos);
    document.getElementById('hora').value = '';
    document.getElementById('hab').value = '';
    document.getElementById('nota').value = '';
    document.getElementById('hora').focus();
    pintar();
  });

  $cont.addEventListener('click', function(ev){
    var b = ev.target.closest ? ev.target.closest('[data-accion]') : null;
    if(!b) return;
    var id = b.closest('.card').getAttribute('data-id');
    var todos = caja.leer();
    var i = todos.findIndex(function(t){ return t.id === id; });
    if(i === -1) return;
    if(b.getAttribute('data-accion') === 'borrar') todos.splice(i,1);
    else todos[i].estado = ESTADOS[(ESTADOS.indexOf(todos[i].estado) + 1) % ESTADOS.length];
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
  document.getElementById('copiar').addEventListener('click', function(){ copiar(csv(filas()), this); });

  // Las habitaciones ocupadas se sugieren desde el PMS. Si falla, el campo
  // sigue siendo texto libre: nunca bloquea anotar un turno.
  function sugerir(){
    traer('aseo', fecha).then(function(l){
      document.getElementById('habs').innerHTML = l.map(function(h){
        return '<option value="' + esc(h.habitacion) + '">';
      }).join('');
    }).catch(function(){});
  }

  $fecha.addEventListener('change', function(){ fecha = $fecha.value || hoy(); pintar(); sugerir(); });
  prepararSesion().then(function(){ pintar(); sugerir(); })
    .catch(function(e){ fallo($cont, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('jacuzzi', 'Jacuzzi · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------
// Caja menor
// ---------------------------------------------------------------------------

function paginaCajaMenor() {
  const cuerpo = `
<div class="rejilla cifras" id="resumen"></div>

<form class="tarjeta forma" id="alta" style="margin-top:22px">
  <h3>Anotar gasto</h3>
  <div class="campos">
    <div class="campo"><label for="fecha">Fecha</label><input type="date" id="fecha" required></div>
    <div class="campo"><label for="monto">Monto</label><input type="number" id="monto" min="0" step="100" placeholder="0" required></div>
    <div class="campo"><label for="cat">Categoría</label><select id="cat">
      <option>Aseo</option><option>Mantenimiento</option><option>Insumos</option>
      <option>Transporte</option><option>Alimentación</option><option>Otro</option>
    </select></div>
    <div class="campo"><label for="quien">Quién</label><input type="text" id="quien" placeholder="Nombre"></div>
    <div class="campo ancho"><label for="concepto">Concepto</label>
      <input type="text" id="concepto" placeholder="En qué se gastó" required></div>
  </div>
  <button type="submit" class="principal-btn">Añadir gasto</button>
</form>

<div class="acciones">
  <button id="base">Fijar base de caja</button>
  <button id="csv">Descargar CSV</button>
  <button id="copiar">Copiar</button>
</div>

<div id="contenido"></div>
<footer>Los gastos se guardan en este dispositivo. Descárgalos para respaldarlos.</footer>`;

  const encab = encabezado('Caja menor', 'sub', '<input type="month" id="mes" aria-label="Mes">');

  const script = `
(function(){
  "use strict";
${JS_COMUN}

  var $cont = document.getElementById('contenido');
  var $resumen = document.getElementById('resumen');
  var $sub = document.getElementById('sub');
  var $mes = document.getElementById('mes');
  var caja = almacen('b79-caja-gastos');
  var mes = params.get('mes') || hoy().slice(0,7);
  $mes.value = mes;
  document.getElementById('fecha').value = hoy();

  function leerBase(){ try { return Number(localStorage.getItem('b79-caja-base')) || 0; } catch(e){ return 0; } }
  function guardarBase(v){ try { localStorage.setItem('b79-caja-base', String(v)); } catch(e){} }

  function delMes(){
    return caja.leer().filter(function(g){ return String(g.fecha).slice(0,7) === mes; })
      .sort(function(a,b){ return a.fecha < b.fecha ? 1 : -1; });
  }

  function cifra(k,v,neg){
    return '<div class="tarjeta cifra"><div class="k">' + k + '</div>' +
           '<div class="v' + (neg ? ' negativo' : '') + '">' + v + '</div></div>';
  }

  function pintar(){
    var lista = delMes();
    var gastado = lista.reduce(function(s,g){ return s + (Number(g.monto)||0); }, 0);
    var base = leerBase(), saldo = base - gastado;
    $resumen.innerHTML = cifra('Base', plata(base)) + cifra('Gastado', plata(gastado)) +
                         cifra('Saldo', plata(saldo), saldo < 0);
    $sub.textContent = lista.length + (lista.length === 1 ? ' gasto' : ' gastos') + ' este mes';
    if(!lista.length){ $cont.innerHTML = '<div class="vacio">Sin gastos anotados este mes.</div>'; return; }
    $cont.innerHTML = lista.map(function(g){
      var meta = [g.categoria];
      if(g.quien) meta.push(g.quien);
      meta.push(fechaCorta(g.fecha));
      return '<article class="card gasto" data-id="' + esc(g.id) + '"><div class="info">' +
        '<div class="concepto">' + esc(g.concepto) + '</div>' +
        '<div class="meta">' + esc(meta.join(' · ')) + '</div></div>' +
        '<div class="plata"><div class="total">' + plata(g.monto) + '</div></div>' +
        '<button class="borrar" data-accion="borrar" aria-label="Borrar">×</button></article>';
    }).join('');
  }

  document.getElementById('alta').addEventListener('submit', function(ev){
    ev.preventDefault();
    var todos = caja.leer();
    todos.push({
      id:'g' + Date.now(),
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
    var b = ev.target.closest ? ev.target.closest('[data-accion="borrar"]') : null;
    if(!b) return;
    var id = b.closest('.card').getAttribute('data-id');
    caja.guardar(caja.leer().filter(function(g){ return g.id !== id; }));
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
  document.getElementById('copiar').addEventListener('click', function(){ copiar(csv(filas()), this); });
  $mes.addEventListener('change', function(){ mes = $mes.value || hoy().slice(0,7); pintar(); });

  prepararSesion().then(pintar).catch(function(e){ fallo($cont, e, 'No se pudo abrir la sesión'); });
})();
`;
  return conMenu('cajamenor', 'Caja menor · Bahía 79', encab, cuerpo, script);
}

// ---------------------------------------------------------------------------

const PAGINAS = {
  entrar: paginaEntrar,
  panel: paginaPanel,
  inicio: paginaPanel,          // el nombre viejo sigue llevando al panel
  aseo: paginaAseo,
  facturacion: paginaFacturacion,
  jacuzzi: paginaJacuzzi,
  cajamenor: paginaCajaMenor,
  usuarios: paginaUsuarios,
  historial: paginaHistorial,
};

function renderPage(page) {
  const fn = PAGINAS[String(page || 'panel').toLowerCase()];
  return fn ? fn() : paginaPanel();
}

module.exports = { renderPage };
