"""Fase 5 - el comportamiento de la guia. Sin librerias, sin CDN, sin build.

Siete piezas:
  1. pestanas y estado guardado
  2. EL VISOR: reproduce los frames de un referente a su duracion REAL. Es la pieza
     central, porque el ritmo no se explica, se siente.
  3. la tira de tiempo: cada plano ocupa lo que dura, asi que la estructura se VE
  4. lightbox con teclado
  5. el tour animado del pipeline
  6. el grafico de ritmo, enlazado a los frames
  7. acordeon, copiar, formulario en vivo y calculadora de coste
"""

JS = r"""
(function () {
  'use strict';
  var CLAVE = 'b79-video-ia-v2';
  var DATOS = window.__PLANOS__ || {};
  var lento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ guardado
  // localStorage lanza en modo privado y con las cookies bloqueadas: todo va envuelto,
  // porque la pagina tiene que funcionar igual sin el.
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); }
                    catch (e) { return {}; } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
                       catch (e) {} }
  var estado = leer();

  function $(s, r) { return (r || document).querySelector(s); }
  // En la version de un solo archivo las imagenes viven en window.__IMG__ como data URI,
  // puestas una sola vez aunque cada frame se use en tres sitios. Con la carpeta al lado,
  // el mapa no existe y se cae a la ruta normal.
  function rutaImg(clave) { return (window.__IMG__ || {})[clave] || 'img/' + clave + '.png'; }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ------------------------------------------------------------ 1. pestanas
  var botones = $$('nav.tabs button'), vistas = $$('main > section');
  function mostrar(id, recordar) {
    if (!document.getElementById(id)) id = 'visor';
    vistas.forEach(function (s) {
      var activa = s.id === id;
      s.hidden = !activa;
      if (activa) { s.classList.remove('vista'); void s.offsetWidth; s.classList.add('vista'); }
    });
    botones.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.vista === id));
    });
    if (recordar !== false) {
      estado.vista = id; guardar();
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }
    if (id !== 'visor') pausar();
    window.scrollTo(0, 0);
  }
  botones.forEach(function (b) {
    b.addEventListener('click', function () { mostrar(b.dataset.vista); });
  });

  // ------------------------------------------------------------ 2. EL VISOR
  // Reproduce los frames de un referente durante su duracion real. Es la unica forma
  // de entender que on_the_road acelera sin parar y que black_sand alterna planos de
  // 5 segundos con rafagas de un frame.
  var visor = $('#el-visor');
  var peli = estado.peli || 'on_the_road';
  var idx = 0, tocando = false, temporizador = null, vel = estado.vel || 1;

  function planos() { return (DATOS[peli] || {}).planos || []; }
  function marco(n) { return $('#el-visor .pantalla img[data-n="' + n + '"]'); }

  function pintar() {
    var ps = planos(), p = ps[idx];
    if (!p) return;
    $$('#el-visor .pantalla img').forEach(function (im) {
      im.classList.toggle('on', im.dataset.peli === peli && +im.dataset.n === p.n);
    });
    $('#el-visor .accion').textContent = p.accion;
    $('#el-visor .tc').textContent =
      formatoTC(p['in']) + '  ·  ' + p.dur.toFixed(2) + ' s  ·  ' + p.frames + ' f';
    $('#el-visor .contador').innerHTML =
      'PLANO <b>' + pad(p.n) + '</b>/' + ps.length + '  ' + p.tipo.toUpperCase();
    $$('#el-visor .tira .blk').forEach(function (b) {
      b.setAttribute('aria-current', String(+b.dataset.i === idx));
    });
    // Solo se arrastra la vista mientras reproduce. Hacerlo tambien al pasar el raton
    // mueve el bloque justo antes de que el clic aterrice, y acabas en otro plano.
    if (tocando) {
      var blk = $('#el-visor .tira .blk[aria-current="true"]');
      if (blk && blk.scrollIntoView) blk.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatoTC(s) {
    var m = Math.floor(s / 60), r = s - m * 60;
    return pad(m) + ':' + (r < 10 ? '0' : '') + r.toFixed(2);
  }

  function paso() {
    var ps = planos(), p = ps[idx];
    if (!p) return;
    pintar();
    // el plano dura lo que dura de verdad; un plano de 1 frame son 33 ms y se nota
    temporizador = setTimeout(function () {
      idx = (idx + 1) % ps.length;
      if (idx === 0) { pausar(); return; }   // al terminar la pelicula, para
      paso();
    }, Math.max(28, (p.dur * 1000) / vel));
  }
  function reproducir() {
    if (tocando) return;
    tocando = true;
    visor.classList.add('play');
    $('#play').setAttribute('aria-label', 'Pausar');
    $('#play').innerHTML = ICONO.pausa;
    paso();
  }
  function pausar() {
    tocando = false;
    clearTimeout(temporizador);
    if (!visor) return;
    visor.classList.remove('play');
    var b = $('#play');
    if (b) { b.setAttribute('aria-label', 'Reproducir'); b.innerHTML = ICONO.play; }
  }
  var ICONO = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.2v11.6l9.5-5.8z"/></svg>',
    pausa: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3.2v11H3.5zm5.8 0h3.2v11H9.3z"/></svg>',
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 2.5v11L5 8zM4 2.5h1.6v11H4z"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5v11L11 8zm8.9 0H14v11h-1.6z"/></svg>'
  };

  function ir(n, seguir) {
    var ps = planos();
    idx = ((n % ps.length) + ps.length) % ps.length;
    if (!seguir) { pausar(); }
    pintar();
  }

  if (visor) {
    $('#play').innerHTML = ICONO.play;
    $('#prev').innerHTML = ICONO.prev;
    $('#next').innerHTML = ICONO.next;
    $('#play').addEventListener('click', function () { tocando ? pausar() : reproducir(); });
    $('#prev').addEventListener('click', function () { ir(idx - 1); });
    $('#next').addEventListener('click', function () { ir(idx + 1); });

    $$('#el-visor .velocidad button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(+b.dataset.vel === vel));
      b.addEventListener('click', function () {
        vel = +b.dataset.vel; estado.vel = vel; guardar();
        $$('#el-visor .velocidad button').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
      });
    });
    $$('#el-visor .selpeli button').forEach(function (b) {
      b.addEventListener('click', function () {
        pausar();
        peli = b.dataset.peli; estado.peli = peli; guardar(); idx = 0;
        $$('#el-visor .selpeli button').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        $$('#el-visor .tira').forEach(function (t) { t.hidden = t.dataset.peli !== peli; });
        pintar();
      });
    });
    $$('#el-visor .selpeli button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.peli === peli));
    });
    $$('#el-visor .tira').forEach(function (t) { t.hidden = t.dataset.peli !== peli; });

    $$('#el-visor .tira .blk').forEach(function (b) {
      b.addEventListener('click', function () { ir(+b.dataset.i); });
      b.addEventListener('mouseenter', function () { if (!tocando) ir(+b.dataset.i, true); });
    });

    // teclado: espacio reproduce, flechas mueven plano a plano
    document.addEventListener('keydown', function (ev) {
      if ($('#lightbox') && !$('#lightbox').hidden) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
      if ($('#visor').hidden) return;
      if (ev.key === ' ') { ev.preventDefault(); tocando ? pausar() : reproducir(); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); ir(idx + 1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); ir(idx - 1); }
    });
    pintar();
  }

  // ------------------------------------------------------------ 4. lightbox
  var lb = $('#lightbox'), lbLista = [], lbIdx = 0;

  function abrirLB(lista, i) {
    lbLista = lista; lbIdx = i;
    pintarLB();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lightbox .cerrar').focus();
  }
  function pintarLB() {
    var d = lbLista[lbIdx];
    if (!d) return;
    var im = $('#lightbox img');
    im.src = d.src; im.alt = d.alt;
    $('#lightbox .tit').textContent = 'Plano ' + pad(d.n) + ' · ' + d.tipo;
    $('#lightbox .dat').textContent =
      formatoTC(d['in']) + '  ·  ' + d.dur.toFixed(2) + ' s  ·  ' + d.frames + ' f  ·  ' + d.camara;
    $('#lightbox .desc').textContent = d.funcion;
    $('#lightbox .pista').textContent =
      (lbIdx + 1) + ' de ' + lbLista.length + '  ·  flechas para moverte  ·  Esc para salir';
  }
  function cerrarLB() {
    if (!lb) return;
    lb.hidden = true; document.body.style.overflow = '';
  }
  if (lb) {
    $('#lightbox .cerrar').addEventListener('click', cerrarLB);
    lb.addEventListener('click', function (e) { if (e.target === lb) cerrarLB(); });
    $('#lightbox .prev').addEventListener('click', function () {
      lbIdx = (lbIdx - 1 + lbLista.length) % lbLista.length; pintarLB();
    });
    $('#lightbox .next').addEventListener('click', function () {
      lbIdx = (lbIdx + 1) % lbLista.length; pintarLB();
    });
    document.addEventListener('keydown', function (ev) {
      if (lb.hidden) return;
      if (ev.key === 'Escape') cerrarLB();
      if (ev.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbLista.length; pintarLB(); }
      if (ev.key === 'ArrowLeft') {
        lbIdx = (lbIdx - 1 + lbLista.length) % lbLista.length; pintarLB();
      }
    });
  }

  $$('.planos').forEach(function (rejilla) {
    var v = rejilla.dataset.peli;
    var lista = ((DATOS[v] || {}).planos || []).map(function (p) {
      return {
        n: p.n, tipo: p.tipo, 'in': p['in'], dur: p.dur, frames: p.frames,
        camara: p.camara, funcion: p.funcion, alt: p.accion,
        src: rutaImg(v + '_' + pad(p.n))
      };
    });
    $$('.plano', rejilla).forEach(function (b, i) {
      b.addEventListener('click', function () { abrirLB(lista, i); });
    });
  });

  // ------------------------------------------------------------ 5. tour animado
  var tour = $('#tour');
  if (tour) {
    var etapas = $$('#tour .et'), esc = $('#tour .escena'), t = 0, andando = false, reloj = null;
    var GUION = window.__TOUR__ || [];

    function pintarTour() {
      etapas.forEach(function (e, i) {
        e.classList.toggle('viva', i === t);
        e.classList.toggle('pasada', i < t);
      });
      var g = GUION[t] || {};
      var fichas = (g.entra || []).map(function (x) {
        return '<span class="ficha">' + x + '</span>';
      }).concat((g.sale || []).map(function (x) {
        return '<span class="ficha nueva">' + x + '</span>';
      })).join('');
      esc.innerHTML =
        '<p class="que">' + (g.que || '') + '</p>' +
        (fichas ? '<div class="salida">' + fichas + '</div>' : '');
      $$('#tour .ficha').forEach(function (f, i) {
        f.style.animationDelay = (i * 55) + 'ms';
      });
      etapas[t].scrollIntoView({block: 'nearest', inline: 'nearest'});
      var paso = document.getElementById('paso-' + (g.paso || ''));
      $$('.paso').forEach(function (p) { p.classList.remove('destacado'); });
      if (paso) paso.classList.add('destacado');
    }
    function avanzaTour() {
      t = (t + 1) % GUION.length;
      pintarTour();
      if (t === GUION.length - 1) { setTimeout(pararTour, 2600); }
    }
    function andarTour() {
      andando = true;
      $('#tour-play').textContent = 'Pausar';
      reloj = setInterval(avanzaTour, 2800);
    }
    function pararTour() {
      andando = false; clearInterval(reloj);
      $('#tour-play').textContent = 'Ver el recorrido';
    }
    $('#tour-play').addEventListener('click', function () {
      andando ? pararTour() : andarTour();
    });
    $('#tour-next').addEventListener('click', function () { pararTour(); avanzaTour(); });
    $('#tour-prev').addEventListener('click', function () {
      pararTour(); t = (t - 1 + GUION.length) % GUION.length; pintarTour();
    });
    etapas.forEach(function (e, i) {
      e.addEventListener('click', function () { pararTour(); t = i; pintarTour(); });
    });
    pintarTour();
  }

  // ------------------------------------------------------------ 6. grafico de ritmo
  $$('.ritmo').forEach(function (g) {
    var v = g.dataset.peli, ps = (DATOS[v] || {}).planos || [];
    var lectura = $('.lectura', g);
    var base = lectura.textContent;
    $$('.b', g).forEach(function (b, i) {
      var p = ps[i];
      function ver() {
        $$('.b', g).forEach(function (o) { o.classList.toggle('activa', o === b); });
        lectura.innerHTML = '<b>Plano ' + pad(p.n) + '</b> · ' + p.tipo + ' · ' +
          p.dur.toFixed(2) + ' s (' + p.frames + ' frames) — ' + p.accion;
      }
      b.addEventListener('mouseenter', ver);
      b.addEventListener('focus', ver);
      b.addEventListener('click', function () {
        if (!visor) return;
        peli = v; estado.peli = v; guardar();
        $$('#el-visor .selpeli button').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o.dataset.peli === v));
        });
        $$('#el-visor .tira').forEach(function (tt) { tt.hidden = tt.dataset.peli !== v; });
        ir(i); mostrar('visor');
      });
    });
    g.addEventListener('mouseleave', function () {
      $$('.b', g).forEach(function (o) { o.classList.remove('activa'); });
      lectura.textContent = base;
    });
  });

  // ------------------------------------------------------------ 7a. acordeon
  $$('.paso').forEach(function (paso) {
    var cab = $('.cab', paso), cont = $('.contenido', paso);
    var abierto = !!estado['abierto:' + paso.id];
    cont.hidden = !abierto;
    paso.classList.toggle('abierto', abierto);
    cab.setAttribute('aria-expanded', String(abierto));
    cab.addEventListener('click', function () {
      var ahora = cont.hidden;
      cont.hidden = !ahora;
      paso.classList.toggle('abierto', ahora);
      cab.setAttribute('aria-expanded', String(ahora));
      estado['abierto:' + paso.id] = ahora; guardar();
    });
  });

  // ------------------------------------------------------------ 7b. checkboxes
  var checks = $$('input[data-paso]');
  var pista = $('.barra .relleno'), cuenta = $('.barra .cuenta');
  function progreso() {
    var n = checks.filter(function (c) { return c.checked; }).length;
    if (pista) pista.style.width = (checks.length ? 100 * n / checks.length : 0) + '%';
    if (cuenta) cuenta.textContent = n + '/' + checks.length + ' pasos';
  }
  checks.forEach(function (c) {
    var k = 'hecho:' + c.dataset.paso, paso = document.getElementById(c.dataset.paso);
    c.checked = !!estado[k];
    if (paso) paso.classList.toggle('hecho', c.checked);
    c.addEventListener('change', function () {
      estado[k] = c.checked; guardar();
      if (paso) paso.classList.toggle('hecho', c.checked);
      progreso();
    });
  });
  progreso();
  var reiniciar = $('.barra button');
  if (reiniciar) reiniciar.addEventListener('click', function () {
    if (!confirm('¿Desmarcar los ' + checks.length + ' pasos?')) return;
    checks.forEach(function (c) {
      c.checked = false; estado['hecho:' + c.dataset.paso] = false;
      var p = document.getElementById(c.dataset.paso);
      if (p) p.classList.remove('hecho');
    });
    guardar(); progreso();
  });

  // ------------------------------------------------------------ 7c. copiar
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('.copiar');
    if (b) {
      var pre = $('pre', b.closest('.prompt'));
      if (pre) copiar(pre.innerText, b, 'copiar');
      return;
    }
    var sw = ev.target.closest && ev.target.closest('.swatch');
    if (sw) {
      var hex = $('span', sw).textContent;
      copiarTexto(hex);
      sw.classList.add('copiado');
      setTimeout(function () { sw.classList.remove('copiado'); }, 1100);
    }
  });
  function copiarTexto(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t);
    }
    return Promise.reject();
  }
  function copiar(texto, boton, etiqueta) {
    function ok() {
      boton.textContent = 'copiado'; boton.classList.add('ok');
      setTimeout(function () {
        boton.textContent = etiqueta; boton.classList.remove('ok');
      }, 1400);
    }
    function seleccionar() {
      // sin permiso de portapapeles al menos se lo dejamos seleccionado
      var pre = $('pre', boton.closest('.prompt'));
      var r = document.createRange(); r.selectNodeContents(pre);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      boton.textContent = 'selecciona y copia';
      setTimeout(function () { boton.textContent = etiqueta; }, 2400);
    }
    copiarTexto(texto).then(ok, seleccionar);
  }

  // ------------------------------------------------------------ 7d. filtros
  $$('.filtros').forEach(function (grupo) {
    var lista = document.getElementById(grupo.dataset.destino);
    $$('button', grupo).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', grupo).forEach(function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        $$('.plano', lista).forEach(function (p) {
          p.hidden = !(b.dataset.tipo === 'todos' || p.dataset.tipo === b.dataset.tipo);
        });
      });
    });
  });

  // ------------------------------------------------------------ 7e. formulario
  var form = $('#form-replicar');
  if (form) {
    var campos = $$('[name]', form), salidas = $$('#replicar pre[data-plantilla]');
    var capas = $$('#replicar .capa');
    function valores() {
      var v = {};
      campos.forEach(function (c) {
        v[c.name] = (c.value || '').trim();
        estado['form:' + c.name] = c.value;
      });
      guardar();
      return v;
    }
    function rellena(t, v) {
      return t.replace(/\{\{(\w+)\}\}/g, function (m, k) {
        return v[k] || '[' + k.toUpperCase().replace(/_/g, ' ') + ']';
      });
    }
    function pintarForm() {
      var v = valores();
      salidas.forEach(function (pre) {
        pre.textContent = rellena(pre.dataset.plantilla, v);
      });
      capas.forEach(function (c) {
        var pre = $('pre', c);
        if (pre && pre.dataset.plantilla) pre.textContent = rellena(pre.dataset.plantilla, v);
        c.classList.toggle('on', !!v[c.dataset.requiere]);
      });
      // el medidor de palabras del bloque de identidad: 70 a 110 es la ventana util
      var bloque = $('#replicar .capa[data-requiere="cara"] pre');
      var med = $('#medidor');
      if (bloque && med) {
        var n = bloque.textContent.replace(/\[[^\]]+\]/g, '').split(/\s+/)
                 .filter(function (w) { return w.length; }).length;
        var bien = n >= 70 && n <= 110;
        med.classList.toggle('bien', bien);
        $('.relleno', med).style.width = Math.min(100, 100 * n / 110) + '%';
        $('.texto', med).textContent = n + ' palabras' +
          (bien ? ' — en la ventana buena' : n < 70 ? ' — corto, no fija la cara'
                                                    : ' — largo, el final se diluye');
      }
    }
    campos.forEach(function (c) {
      var g = estado['form:' + c.name];
      if (g) c.value = g;
      c.addEventListener('input', pintarForm);
      c.addEventListener('change', pintarForm);
    });
    pintarForm();
  }

  // ------------------------------------------------------------ 7f. calculadora
  var calc = $('#calc');
  if (calc) {
    var PRECIO_IMG = {nano_banana_pro: 0.06, seedream_v5_pro: 0.05, flux_2_pro: 0.07};
    var PRECIO_VID = {
      '480p': 0.036, '720p': 0.072, '1080p': 0.150, '4k': 0.480
    };
    function calcula() {
      var n = +$('#c-planos').value, seg = +$('#c-seg').value;
      var intentos = +$('#c-intentos').value / 10;
      var res = $('#c-res').value, modelo = $('#c-modelo').value;
      var fijas = Math.round(n * (+$('#c-fijas').value) / 100);
      var animados = n - fijas;
      var img = PRECIO_IMG[modelo] * n;
      var vid = PRECIO_VID[res] * Math.max(4, seg) * animados;
      var teoria = img + vid, real = teoria * intentos;
      $('#c-planos-v').textContent = n;
      $('#c-seg-v').textContent = seg.toFixed(1) + ' s';
      $('#c-intentos-v').textContent = intentos.toFixed(1) + '×';
      $('#c-fijas-v').textContent = fijas + ' de ' + n;
      $('#c-teoria').textContent = teoria.toFixed(2) + ' USD';
      $('#c-real').textContent = real.toFixed(2) + ' USD';
      $('#c-dur').textContent = (n * seg).toFixed(0) + ' s de video';
      var aviso = '';
      if (res === '4k') {
        aviso = 'Solo Seedance 2.0 da 4K de verdad. En 2.5, el 4K es un reescalado del ' +
                'proveedor y te lo cobran igual.';
      } else if (animados && vid > img * 4) {
        aviso = 'Animar te cuesta ' + (vid / img).toFixed(1) + ' veces mas que las ' +
                'imagenes. Por eso el sistema entero existe: para no animar hasta estar seguro.';
      }
      if (fijas > 0) {
        aviso += (aviso ? ' ' : '') + 'Los ' + fijas + ' planos de menos de 5 frames van como ' +
                 'imagen fija y no cuestan video: ahi te ahorras ' +
                 (PRECIO_VID[res] * Math.max(4, seg) * fijas * intentos).toFixed(2) + ' USD.';
      }
      $('#c-nota').textContent = aviso;
    }
    $$('#calc input,#calc select').forEach(function (c) {
      c.addEventListener('input', calcula);
      c.addEventListener('change', calcula);
    });
    calcula();
  }

  // ------------------------------------------------------------ arranque
  var inicial = (location.hash || '').replace('#', '') || estado.vista || 'visor';
  mostrar(inicial, false);
  // sin autoplay: arranca solo si el visitante lo pide, y nunca con reduced-motion
  if (visor && !lento && estado.autoplay) reproducir();
})();
"""
