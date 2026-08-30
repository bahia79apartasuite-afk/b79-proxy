"""Fase 5 - el sistema visual de la guia.

CONCEPTO: la sala de montaje. La pagina es una mesa de edicion — visor arriba, linea de
tiempo debajo — y la teoria se lee como un ensayo de cine. La maquinaria (controles,
etiquetas, cifras) va en Archivo; la prosa va en Newsreader. Los timecodes y los hex van
en la monoespaciada del sistema, que es lo que hace un panel de edicion.

COLOR: no inventado. Sale de analysis/*/paleta.json, medido sobre los frames reales.
  ambar  #F2BB34  el amarillo de la carroceria de on_the_road
  rojo   #E03D26  el rojo de vineta de black_sand
  cian   #74DFEF  la franja del panel KRACK!!, que aparece 18 frames en 76 segundos.
                  Por eso aqui se reserva para lo mas raro de la interfaz: reproducir.

Se disena a 390 px primero. Un solo mundo visual, oscuro, elegido a proposito: es una
sala de montaje, y las salas de montaje estan a oscuras. Por eso no hay tema claro, pero
todos los colores se pintan explicitamente y nada hereda del fondo del navegador.
"""

CSS = """
:root{
  /* --- ground: casi negro con un sesgo azul minimo, el gris de una sala de grado --- */
  --fondo:#0A0A0C;
  --panel:#121216;
  --panel2:#191920;
  --alto:#20202a;
  --linea:#26262f;
  --linea2:#34343f;

  /* --- tinta: blanco roto y calido, como luz proyectada, no blanco puro --- */
  --tinta:#EDEBE6;
  --tinta2:#9C9AA4;
  --tinta3:#6B6974;

  /* --- acentos medidos sobre los referentes --- */
  --ambar:#F2BB34;
  --ambar-h:#3a2c10;
  --rojo:#E03D26;
  --rojo-h:#3a1512;
  --cian:#74DFEF;
  --cian-h:#123038;
  --verde:#7FB069;

  /* --- tipos de plano: la misma escala en la tira, las tarjetas y el grafico --- */
  --t-macro:#F2BB34;
  --t-busto:#7FC4F5;
  --t-amplio:#8FD9A8;
  --t-POV:#D69CF0;
  --t-impacto:#F58273;
  --t-titulo:#C9C7D2;

  --r:10px; --r2:16px;
  --ancho:960px;
  --maquina:"Archivo","Archivo Fallback",system-ui,-apple-system,"Segoe UI",sans-serif;
  --prosa:"Newsreader","Newsreader Fallback",Georgia,"Times New Roman",serif;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
                       transition-duration:.001ms!important;scroll-behavior:auto!important}
}

*{box-sizing:border-box}
/* [hidden] lo pone la UA con especificidad 0, asi que cualquier .clase{display:flex}
   se lo come. Sin esta linea las dos tiras de tiempo se dibujan a la vez. */
[hidden]{display:none!important}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{
  margin:0;background:var(--fondo);color:var(--tinta);
  font-family:var(--maquina);font-size:15px;line-height:1.6;
  font-variant-numeric:tabular-nums;overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
:focus-visible{outline:2px solid var(--ambar);outline-offset:2px;border-radius:4px}
a{color:var(--ambar);text-underline-offset:3px}
code,kbd,.mono{font-family:var(--mono);font-size:.87em;font-variant-numeric:tabular-nums}

/* ---------------------------------------------------------------- tipografia */
h1,h2,h3,h4{margin:0 0 .45em;text-wrap:balance;font-weight:800;letter-spacing:-.022em;
            line-height:1.1}
h1{font-size:clamp(1.75rem,1.1rem + 2.6vw,2.9rem)}
h2{font-size:clamp(1.3rem,1.05rem + 1.05vw,1.75rem);margin-top:2.4rem}
h3{font-size:1.06rem;font-weight:700;letter-spacing:-.012em}
h4{font-size:.76rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
   color:var(--tinta3);margin-top:1.8rem}
p{margin:0 0 1.05em}
hr{border:0;border-top:1px solid var(--linea);margin:2.6rem 0}
ul,ol{margin:0 0 1.1em;padding-left:1.25rem}
li{margin-bottom:.4em}
strong,b{font-weight:700;color:var(--tinta)}

/* la prosa larga en serif: el ensayo se lee como cine, los controles son maquinaria */
.prosa,.prosa p,.prosa li,.entrada,.aviso p{font-family:var(--prosa);font-size:1.03rem;
  line-height:1.62;font-weight:400}
.prosa code,.aviso code{font-family:var(--mono)}
.entrada{color:var(--tinta2);font-size:1.13rem;line-height:1.55;max-width:62ch;
         margin-bottom:1.8rem}
.rotulo{font-size:.68rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;
        color:var(--tinta3)}

/* ---------------------------------------------------------------- cabecera */
.top{position:sticky;top:0;z-index:60;background:rgba(10,10,12,.92);
     backdrop-filter:saturate(160%) blur(12px);border-bottom:1px solid var(--linea)}
.top .fila{max-width:var(--ancho);margin:0 auto;padding:.65rem 1.1rem 0;
           display:flex;align-items:center;gap:.6rem}
.marca{font-weight:800;font-size:.7rem;letter-spacing:.19em;text-transform:uppercase;
       color:var(--tinta3);display:flex;align-items:center;gap:.45rem}
.marca .punto{width:7px;height:7px;border-radius:50%;background:var(--ambar);
              box-shadow:0 0 0 3px rgba(242,187,52,.16)}
nav.tabs{display:flex;gap:.1rem;overflow-x:auto;scrollbar-width:none;
         padding:.45rem 1.1rem 0;max-width:var(--ancho);margin:0 auto}
nav.tabs::-webkit-scrollbar{display:none}
nav.tabs button{
  flex:0 0 auto;background:none;border:0;border-bottom:2px solid transparent;
  color:var(--tinta2);font:inherit;font-size:.84rem;font-weight:600;letter-spacing:-.005em;
  padding:.5rem .68rem .58rem;cursor:pointer;white-space:nowrap;transition:color .18s}
nav.tabs button:hover{color:var(--tinta)}
nav.tabs button[aria-selected="true"]{color:var(--ambar);border-bottom-color:var(--ambar)}

main{max-width:var(--ancho);margin:0 auto;padding:1.8rem 1.1rem 6rem}
section[hidden]{display:none!important}
.vista{animation:entra .34s cubic-bezier(.22,.9,.3,1)}
@keyframes entra{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}

/* ================================================================ VISOR */
/* Se topa el panel entero, no solo la pantalla: capando solo la pantalla quedan dos
   franjas oscuras a los lados que parecen un fallo. El tope busca que quepan pantalla,
   transporte, tira y leyenda sin bajar en un portatil. */
.visor{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
       overflow:hidden;margin:0 auto 1rem;
       max-width:max(340px,calc(46vh * 16 / 9))}
.pantalla{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden;
          display:grid;place-items:center}
.pantalla img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
              opacity:0;transition:opacity .09s linear}
.pantalla img.on{opacity:1}
.pantalla .vacio{color:var(--tinta3);font-size:.82rem;letter-spacing:.1em;
                 text-transform:uppercase}
/* barrido de escaneo mientras reproduce: sutil, y solo cuando esta en marcha */
.visor.play .pantalla::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,transparent 0%,rgba(116,223,239,.05) 50%,transparent 100%);
  animation:escanea 3.4s linear infinite}
@keyframes escanea{from{transform:translateY(-100%)}to{transform:translateY(100%)}}

.sobre{position:absolute;left:0;right:0;bottom:0;padding:2.6rem .9rem .75rem;
  background:linear-gradient(transparent,rgba(0,0,0,.86));pointer-events:none;
  display:flex;flex-wrap:wrap;align-items:flex-end;gap:.5rem .8rem}
.sobre .accion{font-family:var(--prosa);font-size:.98rem;line-height:1.35;flex:1 1 14rem;
               min-width:0;color:#fff}
.sobre .tc{font-family:var(--mono);font-size:.74rem;color:var(--cian);
           letter-spacing:.04em;white-space:nowrap}
.esquina{position:absolute;top:.7rem;left:.75rem;display:flex;gap:.4rem;align-items:center}
.esquina .grabando{width:8px;height:8px;border-radius:50%;background:var(--tinta3)}
.visor.play .esquina .grabando{background:var(--cian);animation:late 1.1s ease-in-out infinite}
@keyframes late{0%,100%{opacity:1}50%{opacity:.25}}

/* --- transporte --- */
.transporte{display:flex;align-items:center;gap:.5rem;padding:.6rem .7rem;
            border-top:1px solid var(--linea);flex-wrap:wrap}
.tbtn{background:var(--panel2);border:1px solid var(--linea2);color:var(--tinta2);
  width:36px;height:36px;border-radius:9px;display:grid;place-items:center;cursor:pointer;
  transition:all .16s;flex:0 0 auto;padding:0}
.tbtn:hover{color:var(--tinta);border-color:var(--tinta3);background:var(--alto)}
.tbtn svg{width:15px;height:15px;fill:currentColor}
.tbtn.grande{width:46px;height:46px;background:var(--cian);border-color:var(--cian);
             color:#08181c}
.tbtn.grande:hover{background:#8ee9f7;border-color:#8ee9f7}
.tbtn.grande svg{width:17px;height:17px}
.contador{font-family:var(--mono);font-size:.75rem;color:var(--tinta2);
          letter-spacing:.02em;margin-left:.15rem;white-space:nowrap}
.contador b{color:var(--ambar);font-weight:700}
.transporte .sep{flex:1}
.velocidad{display:flex;gap:2px;background:var(--panel2);border:1px solid var(--linea2);
           border-radius:9px;padding:2px}
.velocidad button{background:none;border:0;color:var(--tinta3);font:inherit;
  font-size:.71rem;font-weight:700;padding:.24rem .44rem;border-radius:6px;cursor:pointer;
  font-variant-numeric:tabular-nums}
.velocidad button[aria-pressed="true"]{background:var(--alto);color:var(--tinta)}
.selpeli{display:flex;gap:2px;background:var(--panel2);border:1px solid var(--linea2);
         border-radius:9px;padding:2px}
.selpeli button{background:none;border:0;color:var(--tinta3);font:inherit;font-size:.71rem;
  font-weight:700;padding:.24rem .5rem;border-radius:6px;cursor:pointer;
  font-family:var(--mono)}
.selpeli button[aria-pressed="true"]{background:var(--ambar);color:#17150c}
.selpeli button[aria-pressed="true"].bs{background:var(--rojo);color:#fff}

/* --- tira de tiempo: cada plano ocupa lo que dura --- */
.tira{display:flex;height:52px;gap:1px;background:var(--linea);border-top:1px solid var(--linea);
      cursor:pointer;overflow:hidden}
.tira .blk{position:relative;flex:0 0 auto;min-width:2px;background:var(--panel2);
           border:0;padding:0;transition:filter .15s;overflow:hidden}
.tira .blk::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;
                  background:var(--c,var(--tinta3));opacity:.85}
.tira .blk img{width:100%;height:100%;object-fit:cover;opacity:.42;transition:opacity .15s;
               display:block}
.tira .blk:hover img{opacity:.85}
.tira .blk[aria-current="true"] img{opacity:1}
.tira .blk[aria-current="true"]{outline:2px solid var(--cian);outline-offset:-2px;z-index:2}
.leyenda{display:flex;flex-wrap:wrap;gap:.15rem .9rem;padding:.5rem .75rem;
         border-top:1px solid var(--linea);font-size:.68rem;color:var(--tinta3);
         letter-spacing:.06em;text-transform:uppercase;font-weight:700}
.leyenda span{display:flex;align-items:center;gap:.32rem}
.leyenda i{width:9px;height:3px;border-radius:2px;background:var(--c)}

/* ================================================================ tarjetas */
.rejilla{display:grid;gap:.85rem;grid-template-columns:1fr}
@media(min-width:620px){.rejilla.dos{grid-template-columns:1fr 1fr}
                        .rejilla.tres{grid-template-columns:repeat(3,1fr)}}
.tarjeta{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
         padding:1.05rem 1.15rem}
.tarjeta h3{margin-top:0}
.cifra{font-size:2.6rem;font-weight:800;color:var(--ambar);line-height:.92;display:block;
       letter-spacing:-.045em;margin-bottom:.3rem}
.cifra.roja{color:var(--rojo)}
.cifra + span{color:var(--tinta2);font-size:.87rem;font-family:var(--prosa);
              display:block;line-height:1.45}
.aviso{border-left:2px solid var(--ambar);background:var(--panel);padding:.9rem 1.05rem;
       border-radius:0 var(--r) var(--r) 0;margin:0 0 1.15rem}
.aviso.rojo{border-left-color:var(--rojo)}
.aviso.verde{border-left-color:var(--verde)}
.aviso.cian{border-left-color:var(--cian)}
.aviso p:last-child{margin-bottom:0}

/* ---------------------------------------------------------------- tablas */
.tabla{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1.15rem;
       border:1px solid var(--linea);border-radius:var(--r2)}
table{border-collapse:collapse;width:100%;font-size:.85rem;min-width:440px}
th,td{text-align:left;padding:.58rem .7rem;border-bottom:1px solid var(--linea);
      vertical-align:top}
th{color:var(--tinta3);font-size:.67rem;text-transform:uppercase;letter-spacing:.11em;
   font-weight:800;background:var(--panel2)}
tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--panel)}

/* ---------------------------------------------------------------- paleta */
.paleta{display:flex;flex-wrap:wrap;gap:.3rem}
.swatch{width:56px;border-radius:7px;overflow:hidden;border:1px solid var(--linea2);
        font-size:.6rem;text-align:center;cursor:pointer;transition:transform .15s}
.swatch:hover{transform:translateY(-2px)}
.swatch i{display:block;height:30px}
.swatch span{display:block;padding:.16rem 0;color:var(--tinta3);font-family:var(--mono)}
.swatch.copiado span{background:var(--verde);color:#0b1a0e;font-weight:700}

/* ================================================================ planos */
.planos{display:grid;gap:.85rem;grid-template-columns:1fr}
@media(min-width:560px){.planos{grid-template-columns:1fr 1fr}}
@media(min-width:860px){.planos{grid-template-columns:1fr 1fr 1fr}}
.plano{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
       overflow:hidden;display:flex;flex-direction:column;text-align:left;padding:0;
       color:inherit;font:inherit;cursor:zoom-in;transition:transform .2s,border-color .2s}
.plano:hover{transform:translateY(-3px);border-color:var(--linea2)}
.plano .marco{position:relative;overflow:hidden;background:#000}
.plano img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;
           transition:transform .45s cubic-bezier(.22,.9,.3,1)}
.plano:hover img{transform:scale(1.045)}
.plano .barra{position:absolute;left:0;bottom:0;height:3px;background:var(--c);
              width:var(--w,10%)}
.plano .cuerpo{padding:.65rem .8rem .8rem;flex:1}
.plano .n{font-family:var(--mono);font-weight:700;color:var(--ambar);font-size:.8rem}
.plano .meta{color:var(--tinta3);font-size:.68rem;letter-spacing:.07em;
             text-transform:uppercase;font-weight:700;margin:.2rem 0 .45rem;
             font-family:var(--mono)}
.plano .acc{font-family:var(--prosa);font-size:.92rem;margin:0 0 .5rem;line-height:1.42}
.plano .fun{font-size:.79rem;color:var(--tinta2);margin:0;border-top:1px solid var(--linea);
            padding-top:.5rem;font-family:var(--prosa);line-height:1.45}
.etq{display:inline-block;font-size:.63rem;font-weight:800;text-transform:uppercase;
     letter-spacing:.09em;padding:.13rem .42rem;border-radius:5px;margin-right:.35rem;
     background:var(--c);color:#0b0b0e}
.filtros{display:flex;flex-wrap:wrap;gap:.28rem;margin:0 0 1.1rem}
.filtros button{background:var(--panel2);border:1px solid var(--linea2);color:var(--tinta2);
  font:inherit;font-size:.75rem;font-weight:700;padding:.3rem .68rem;border-radius:999px;
  cursor:pointer;transition:all .16s;letter-spacing:.02em}
.filtros button:hover{color:var(--tinta)}
.filtros button[aria-pressed="true"]{background:var(--tinta);color:#0b0b0e;
  border-color:var(--tinta)}

/* ================================================================ lightbox */
.lb{position:fixed;inset:0;z-index:100;background:rgba(6,6,8,.94);
    backdrop-filter:blur(6px);display:grid;place-items:center;padding:1rem;
    animation:aparece .2s ease}
.lb[hidden]{display:none}
@keyframes aparece{from{opacity:0}to{opacity:1}}
.lb figure{margin:0;max-width:min(1100px,100%);width:100%;
           animation:sube .28s cubic-bezier(.22,.9,.3,1)}
@keyframes sube{from{opacity:0;transform:scale(.975) translateY(10px)}to{opacity:1;transform:none}}
.lb img{width:100%;border-radius:var(--r2);display:block;background:#000;
        border:1px solid var(--linea2)}
.lb figcaption{margin-top:.85rem;display:flex;flex-wrap:wrap;gap:.5rem 1rem;
               align-items:baseline}
.lb .tit{font-weight:800;font-size:1.05rem}
.lb .dat{font-family:var(--mono);font-size:.76rem;color:var(--cian)}
.lb .desc{font-family:var(--prosa);color:var(--tinta2);flex:1 1 100%;font-size:.95rem;
          line-height:1.5;margin:0}
.lb .cerrar{position:fixed;top:1rem;right:1rem;width:40px;height:40px;border-radius:50%;
  background:var(--panel2);border:1px solid var(--linea2);color:var(--tinta);cursor:pointer;
  display:grid;place-items:center;font-size:1.1rem;line-height:1}
.lb .nav{position:fixed;top:50%;transform:translateY(-50%);width:44px;height:44px;
  border-radius:50%;background:var(--panel2);border:1px solid var(--linea2);
  color:var(--tinta);cursor:pointer;display:grid;place-items:center}
.lb .nav.prev{left:.7rem}.lb .nav.next{right:.7rem}
.lb .pista{font-size:.7rem;color:var(--tinta3);text-align:center;margin-top:.7rem;
           letter-spacing:.08em;text-transform:uppercase;font-weight:700}

/* ================================================================ grafico de ritmo */
.ritmo{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
       padding:1rem .9rem .75rem;margin:0 0 1.15rem}
.barras{display:flex;align-items:flex-end;gap:2px;height:130px;margin:.7rem 0 .35rem;
         position:relative}
/* la media de cada acto, dibujada encima: es lo que hace visible la aceleracion */
.medias{position:absolute;inset:0;pointer-events:none}
.medias .media{position:absolute;height:0;border-top:1.5px dashed var(--tinta2);opacity:.75}
.medias .media b{position:absolute;right:2px;bottom:2px;font-size:.62rem;font-weight:800;
  color:var(--tinta2);font-family:var(--mono);letter-spacing:-.02em;
  background:rgba(18,18,22,.85);padding:0 .2rem;border-radius:3px}
.barras .b{flex:1 1 0;min-width:3px;background:var(--c);border-radius:2px 2px 0 0;
  opacity:.62;transition:opacity .14s,transform .14s;cursor:pointer;transform-origin:bottom;
  position:relative}
.barras .b:hover,.barras .b.activa{opacity:1;transform:scaleY(1.04)}
.ejes{display:flex;justify-content:space-between;font-size:.66rem;color:var(--tinta3);
      font-family:var(--mono);border-top:1px solid var(--linea);padding-top:.35rem}
.ritmo .lectura{font-family:var(--prosa);color:var(--tinta2);font-size:.92rem;margin:.5rem 0 0;
                min-height:2.6em;line-height:1.45}
.ritmo .lectura b{font-family:var(--maquina);color:var(--tinta)}

/* ================================================================ acordeon */
.paso{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
      margin:0 0 .6rem;overflow:hidden;transition:border-color .2s}
.paso.destacado{border-color:var(--cian);box-shadow:0 0 0 3px rgba(116,223,239,.1)}
.paso > .cab{display:flex;align-items:center;gap:.8rem;padding:.9rem 1.05rem;cursor:pointer;
  background:none;border:0;width:100%;text-align:left;color:inherit;font:inherit;
  transition:background .16s}
.paso > .cab:hover{background:var(--panel2)}
.paso .orden{flex:0 0 auto;width:29px;height:29px;border-radius:9px;background:var(--panel2);
  border:1px solid var(--linea2);color:var(--tinta3);display:grid;place-items:center;
  font-size:.76rem;font-weight:800;font-family:var(--mono);transition:all .25s}
.paso.hecho .orden{background:var(--verde);border-color:var(--verde);color:#0b1a0e}
.paso.destacado .orden{background:var(--cian);border-color:var(--cian);color:#08181c}
.paso .titulo{flex:1;min-width:0}
.paso .titulo b{display:block;font-size:1rem;font-weight:700;letter-spacing:-.012em}
.paso .titulo small{color:var(--tinta3);font-size:.79rem;font-family:var(--prosa)}
.paso .flecha{flex:0 0 auto;color:var(--tinta3);transition:transform .22s;font-size:.7rem}
.paso.abierto .flecha{transform:rotate(90deg)}
.paso .contenido{padding:0 1.05rem 1.15rem;border-top:1px solid var(--linea)}
.paso .contenido > :first-child{margin-top:1.05rem}
.donde{display:inline-flex;align-items:center;gap:.3rem;font-size:.68rem;font-weight:800;
  letter-spacing:.09em;text-transform:uppercase;background:var(--panel2);
  border:1px solid var(--linea2);color:var(--tinta2);padding:.2rem .55rem;border-radius:6px;
  margin:0 .3rem .6rem 0}
label.check{display:flex;gap:.6rem;align-items:center;background:var(--panel2);
  border:1px solid var(--linea2);border-radius:var(--r);padding:.6rem .8rem;margin:1.2rem 0 0;
  cursor:pointer;font-size:.86rem;font-weight:700;transition:all .18s}
label.check:hover{border-color:var(--verde)}
label.check input{width:18px;height:18px;accent-color:var(--verde);flex:0 0 auto}
ul.revisar{list-style:none;padding:0;margin:.5rem 0 1.1rem}
ul.revisar li{position:relative;padding-left:1.55rem;margin:0 0 .5em;font-size:.93rem;
              font-family:var(--prosa);line-height:1.5}
ul.revisar li::before{content:"";position:absolute;left:0;top:.45em;width:12px;height:12px;
  border:1.5px solid var(--linea2);border-radius:3px}

/* ================================================================ tour */
.tour{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
      padding:1rem;margin:0 0 1.2rem}
.tour .via{display:flex;gap:.35rem;margin:.85rem 0 .9rem;overflow-x:auto;
           scrollbar-width:none;padding-bottom:.2rem}
.tour .via::-webkit-scrollbar{display:none}
.tour .et{flex:0 0 auto;background:var(--panel2);border:1px solid var(--linea2);
  border-radius:var(--r);padding:.5rem .65rem;min-width:104px;position:relative;
  transition:all .35s cubic-bezier(.22,.9,.3,1);opacity:.45}
.tour .et .num{font-family:var(--mono);font-size:.66rem;color:var(--tinta3);font-weight:700}
.tour .et .nom{font-size:.79rem;font-weight:700;line-height:1.2;margin-top:.1rem}
.tour .et.viva{opacity:1;border-color:var(--cian);background:var(--cian-h);
               transform:translateY(-3px)}
.tour .et.viva .num{color:var(--cian)}
.tour .et.pasada{opacity:.9;border-color:var(--verde)}
.tour .et.pasada .num{color:var(--verde)}
.tour .escena{background:#08080a;border:1px solid var(--linea);border-radius:var(--r);
  padding:1rem;min-height:150px;display:flex;flex-direction:column;justify-content:center;
  gap:.55rem}
.tour .escena .que{font-family:var(--prosa);font-size:1.02rem;line-height:1.5;
                   animation:entra .4s cubic-bezier(.22,.9,.3,1)}
.tour .escena .salida{display:flex;flex-wrap:wrap;gap:.4rem}
.tour .ficha{background:var(--panel2);border:1px solid var(--linea2);border-radius:8px;
  padding:.35rem .6rem;font-size:.72rem;font-family:var(--mono);color:var(--tinta2);
  animation:pop .42s cubic-bezier(.22,1.2,.35,1) backwards}
.tour .ficha.nueva{border-color:var(--cian);color:var(--cian)}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}
.tour .mandos{display:flex;align-items:center;gap:.5rem;margin-top:.85rem;flex-wrap:wrap}
/* el mismo cian que el play del visor: es la misma idea, reproducir algo */
#tour-play{background:var(--cian);border-color:var(--cian);color:#08181c;
  font-size:.72rem;padding:.45rem .95rem;letter-spacing:.09em}
#tour-play:hover{background:#8ee9f7;border-color:#8ee9f7;color:#08181c}

/* ================================================================ prompt */
.prompt{position:relative;margin:0 0 1.15rem}
.prompt pre{background:#08080a;border:1px solid var(--linea);border-radius:var(--r2);
  padding:.95rem 1.05rem;overflow-x:auto;margin:0;font-family:var(--mono);font-size:.775rem;
  line-height:1.62;white-space:pre-wrap;word-break:break-word;color:#c8ccd4}
.prompt .cabecera{display:flex;align-items:center;justify-content:space-between;gap:.5rem;
                  margin:0 0 .38rem}
.prompt .copiar{background:var(--panel2);border:1px solid var(--linea2);color:var(--tinta2);
  font:inherit;font-size:.68rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
  padding:.26rem .6rem;border-radius:6px;cursor:pointer;transition:all .16s;flex:0 0 auto}
.prompt .copiar:hover{color:var(--tinta);border-color:var(--tinta3)}
.prompt .copiar.ok{background:var(--verde);border-color:var(--verde);color:#0b1a0e}
/* capas del constructor de prompt */
.capas{display:flex;flex-direction:column;gap:.35rem;margin:0 0 1.15rem}
.capa{border:1px solid var(--linea);border-left:3px solid var(--c);border-radius:var(--r);
  background:#08080a;padding:.6rem .8rem;opacity:.28;transition:opacity .4s,transform .4s}
.capa.on{opacity:1;transform:none}
.capa .cap{font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
           color:var(--c);margin-bottom:.25rem}
.capa pre{margin:0;font-family:var(--mono);font-size:.735rem;line-height:1.55;
  white-space:pre-wrap;word-break:break-word;color:#c8ccd4;max-height:8.5em;overflow:hidden}
.capa.on pre{max-height:none}

/* ================================================================ formulario */
.form{display:grid;gap:.75rem;grid-template-columns:1fr;margin:0 0 1.3rem}
@media(min-width:620px){.form{grid-template-columns:1fr 1fr}.form .ancho{grid-column:1/-1}}
.campo label{display:block;font-size:.67rem;text-transform:uppercase;letter-spacing:.12em;
  color:var(--tinta3);font-weight:800;margin:0 0 .3rem}
.campo input,.campo textarea,.campo select{width:100%;background:#08080a;
  border:1px solid var(--linea2);border-radius:var(--r);color:var(--tinta);font:inherit;
  font-size:.87rem;padding:.55rem .7rem;resize:vertical;transition:border-color .16s}
.campo textarea{font-family:var(--mono);font-size:.79rem;line-height:1.55}
.campo input:focus,.campo textarea:focus,.campo select:focus{border-color:var(--ambar);
  outline:none;box-shadow:0 0 0 3px rgba(242,187,52,.12)}
.campo small{display:block;color:var(--tinta3);font-size:.73rem;margin-top:.25rem;
             font-family:var(--prosa)}
.medidor{display:flex;align-items:center;gap:.5rem;font-size:.72rem;color:var(--tinta3);
         margin-top:.3rem;font-weight:700}
.medidor .pista{flex:1;height:4px;background:var(--panel2);border-radius:99px;overflow:hidden}
.medidor .relleno{height:100%;background:var(--rojo);transition:width .3s,background .3s}
.medidor.bien .relleno{background:var(--verde)}
.medidor.bien{color:var(--verde)}

/* ================================================================ calculadora */
.calc{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
      padding:1.1rem;margin:0 0 1.2rem}
.calc .mandos{display:grid;gap:.9rem;grid-template-columns:1fr}
@media(min-width:620px){.calc .mandos{grid-template-columns:1fr 1fr}}
.calc .slider label{display:flex;justify-content:space-between;font-size:.72rem;
  text-transform:uppercase;letter-spacing:.1em;font-weight:800;color:var(--tinta3);
  margin-bottom:.35rem}
.calc .slider label b{color:var(--ambar);font-family:var(--mono);font-size:.85rem;
                      text-transform:none;letter-spacing:0}
.calc input[type=range]{width:100%;accent-color:var(--ambar);background:transparent}
.calc .total{display:flex;flex-wrap:wrap;align-items:baseline;gap:.4rem 1.4rem;
  margin-top:1.1rem;padding-top:1rem;border-top:1px solid var(--linea)}
.calc .total .caja span{display:block;font-size:.66rem;text-transform:uppercase;
  letter-spacing:.12em;color:var(--tinta3);font-weight:800;margin-bottom:.1rem}
.calc .total .caja b{font-size:1.75rem;font-weight:800;letter-spacing:-.04em;
                     font-variant-numeric:tabular-nums}
.calc .total .caja.real b{color:var(--ambar)}
.calc .total .caja.teoria b{color:var(--tinta2)}
.calc .nota{font-family:var(--prosa);color:var(--tinta2);font-size:.9rem;margin:.9rem 0 0;
            line-height:1.5}

/* ================================================================ mapa */
.mapa{background:var(--panel);border:1px solid var(--linea);border-radius:var(--r2);
      padding:.9rem;margin:0 0 1.2rem;overflow-x:auto}
.mapa svg{display:block;width:100%;min-width:560px;height:auto}

/* ================================================================ pie / barra */
footer{border-top:1px solid var(--linea);margin-top:3.5rem;padding:1.6rem 1.1rem 3rem;
  color:var(--tinta3);font-size:.79rem;text-align:center;font-family:var(--prosa)}
.barra{position:fixed;left:0;right:0;bottom:0;z-index:70;background:rgba(10,10,12,.95);
  backdrop-filter:blur(10px);border-top:1px solid var(--linea);padding:.5rem 1.1rem;
  display:flex;align-items:center;gap:.75rem;font-size:.73rem;color:var(--tinta2);
  font-weight:700;letter-spacing:.03em}
.barra .cuenta{white-space:nowrap;font-family:var(--mono)}
.barra .pista{flex:1;height:4px;background:var(--panel2);border-radius:99px;overflow:hidden;
              min-width:40px}
.barra .relleno{height:100%;width:0;background:var(--verde);transition:width .3s
  cubic-bezier(.22,.9,.3,1)}
.barra button{background:none;border:1px solid var(--linea2);color:var(--tinta3);font:inherit;
  font-size:.67rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  padding:.24rem .55rem;border-radius:6px;cursor:pointer;white-space:nowrap}
.barra button:hover{color:var(--tinta);border-color:var(--tinta3)}

/* la ultima linea util nunca queda debajo de la barra */
main{padding-bottom:5.5rem}
"""
