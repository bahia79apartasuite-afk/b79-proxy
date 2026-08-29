"""Fase 5 - el JavaScript de la guia. Sin librerias, sin CDN.

Cuatro cosas: pestanas, acordeon con checkbox guardado en localStorage, botones de copiar
y el formulario que rellena las plantillas en vivo.
"""

JS = r"""
(function () {
  'use strict';
  var CLAVE = 'b79-video-ia-v1';

  // ------------------------------------------------------------ guardado
  // localStorage puede lanzar en modo privado o con las cookies bloqueadas, asi que
  // todo lectura y escritura va envuelto: la pagina tiene que funcionar sin el.
  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); }
    catch (e) { return {}; }
  }
  function escribir(o) {
    try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) { /* sin guardado */ }
  }
  var estado = leer();

  // ------------------------------------------------------------ pestanas
  var botones = Array.prototype.slice.call(document.querySelectorAll('nav.tabs button'));
  var vistas = Array.prototype.slice.call(document.querySelectorAll('main > section'));

  function mostrar(id, guardar) {
    vistas.forEach(function (s) { s.hidden = (s.id !== id); });
    botones.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.vista === id));
    });
    if (guardar !== false) {
      estado.vista = id; escribir(estado);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }
    window.scrollTo(0, 0);
  }
  botones.forEach(function (b) {
    b.addEventListener('click', function () { mostrar(b.dataset.vista); });
  });
  var inicial = (location.hash || '').replace('#', '') || estado.vista || 'inicio';
  if (!document.getElementById(inicial)) inicial = 'inicio';
  mostrar(inicial, false);

  // ------------------------------------------------------------ acordeon
  var pasos = Array.prototype.slice.call(document.querySelectorAll('.paso'));
  pasos.forEach(function (paso) {
    var cab = paso.querySelector('.cab');
    var cont = paso.querySelector('.contenido');
    var abierto = estado['abierto:' + paso.id];
    cont.hidden = !abierto;
    paso.classList.toggle('abierto', !!abierto);
    cab.setAttribute('aria-expanded', String(!!abierto));
    cab.addEventListener('click', function () {
      var ahora = cont.hidden;
      cont.hidden = !ahora;
      paso.classList.toggle('abierto', ahora);
      cab.setAttribute('aria-expanded', String(ahora));
      estado['abierto:' + paso.id] = ahora; escribir(estado);
    });
  });

  // ------------------------------------------------------------ checkboxes
  var checks = Array.prototype.slice.call(document.querySelectorAll('input[data-paso]'));
  var pista = document.querySelector('.barra .relleno');
  var cuenta = document.querySelector('.barra .cuenta');

  function progreso() {
    var hechos = checks.filter(function (c) { return c.checked; }).length;
    if (pista) pista.style.width = (checks.length ? (100 * hechos / checks.length) : 0) + '%';
    if (cuenta) cuenta.textContent = hechos + ' de ' + checks.length + ' pasos';
  }
  checks.forEach(function (c) {
    var k = 'hecho:' + c.dataset.paso;
    c.checked = !!estado[k];
    var paso = document.getElementById(c.dataset.paso);
    if (paso) paso.classList.toggle('hecho', c.checked);
    c.addEventListener('change', function () {
      estado[k] = c.checked; escribir(estado);
      if (paso) paso.classList.toggle('hecho', c.checked);
      progreso();
    });
  });
  progreso();

  var reset = document.querySelector('.barra button');
  if (reset) reset.addEventListener('click', function () {
    if (!confirm('¿Desmarcar los ' + checks.length + ' pasos?')) return;
    checks.forEach(function (c) {
      c.checked = false; estado['hecho:' + c.dataset.paso] = false;
      var p = document.getElementById(c.dataset.paso);
      if (p) p.classList.remove('hecho');
    });
    escribir(estado); progreso();
  });

  // ------------------------------------------------------------ copiar
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest ? ev.target.closest('.copiar') : null;
    if (!b) return;
    var pre = b.parentNode.querySelector('pre');
    if (!pre) return;
    var texto = pre.innerText;
    function ok() {
      var antes = b.textContent;
      b.textContent = 'copiado'; b.classList.add('ok');
      setTimeout(function () { b.textContent = antes; b.classList.remove('ok'); }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, seleccionar);
    } else { seleccionar(); }
    function seleccionar() {
      // sin permiso de portapapeles: al menos se lo dejamos seleccionado
      var r = document.createRange(); r.selectNodeContents(pre);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      b.textContent = 'selecciona y copia';
      setTimeout(function () { b.textContent = 'copiar'; }, 2200);
    }
  });

  // ------------------------------------------------------------ filtros de plano
  var filtros = Array.prototype.slice.call(document.querySelectorAll('.filtros button'));
  filtros.forEach(function (b) {
    b.addEventListener('click', function () {
      var grupo = b.closest('.filtros');
      var lista = document.getElementById(grupo.dataset.destino);
      var tipo = b.dataset.tipo;
      Array.prototype.forEach.call(grupo.querySelectorAll('button'), function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      Array.prototype.forEach.call(lista.querySelectorAll('.plano'), function (p) {
        p.hidden = !(tipo === 'todos' || p.dataset.tipo === tipo);
      });
    });
  });

  // ------------------------------------------------------------ formulario
  var form = document.getElementById('form-replicar');
  if (form) {
    var campos = Array.prototype.slice.call(form.querySelectorAll('[name]'));
    var salidas = Array.prototype.slice.call(
      document.querySelectorAll('#replicar .prompt pre[data-plantilla]'));

    function valores() {
      var v = {};
      campos.forEach(function (c) {
        v[c.name] = (c.value || '').trim();
        estado['form:' + c.name] = c.value;
      });
      escribir(estado);
      return v;
    }
    function pintar() {
      var v = valores();
      salidas.forEach(function (pre) {
        var t = pre.dataset.plantilla;
        pre.textContent = t.replace(/\{\{(\w+)\}\}/g, function (m, k) {
          var val = v[k];
          if (val) return val;
          return '[' + k.toUpperCase().replace(/_/g, ' ') + ']';
        });
      });
    }
    campos.forEach(function (c) {
      var guardado = estado['form:' + c.name];
      if (guardado) c.value = guardado;
      c.addEventListener('input', pintar);
      c.addEventListener('change', pintar);
    });
    pintar();
  }
})();
"""
