"""Fase 5 - la hoja de estilo de la guia. Fuentes del sistema, sin CDN, fondo oscuro.

Se disena para 390 px de ancho primero y se ensancha desde ahi. Los colores salen de las
paletas medidas en analysis/*/paleta.json: el amarillo de on_the_road y el rojo de black_sand.
"""

CSS = """
:root{
  --fondo:#0c0d10; --panel:#14161b; --panel2:#1b1e25; --borde:#272b34;
  --texto:#e8e6e1; --suave:#9aa0ab; --tenue:#6d737e;
  --ambar:#F2BB34; --rojo:#E03D26; --verde:#7FB069; --azul:#5B9BD5;
  --radio:12px; --ancho:900px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--fondo); color:var(--texto);
  font:15px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  overflow-x:hidden;
}
a{color:var(--ambar)}
code,kbd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em}
:where(h1,h2,h3,h4){line-height:1.25;margin:0 0 .5em}
h1{font-size:1.6rem;letter-spacing:-.02em}
h2{font-size:1.25rem;letter-spacing:-.01em}
h3{font-size:1.02rem}
p{margin:0 0 1em}
hr{border:0;border-top:1px solid var(--borde);margin:2rem 0}

/* ---------------------------------------------------------------- cabecera */
.top{position:sticky;top:0;z-index:50;background:rgba(12,13,16,.94);
     backdrop-filter:blur(8px);border-bottom:1px solid var(--borde)}
.top .fila{max-width:var(--ancho);margin:0 auto;padding:.7rem 1rem .1rem}
.marca{font-weight:700;font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;
       color:var(--tenue)}
.marca b{color:var(--ambar);font-weight:700}
nav.tabs{display:flex;gap:.15rem;overflow-x:auto;scrollbar-width:none;
         padding:.5rem 1rem 0;max-width:var(--ancho);margin:0 auto}
nav.tabs::-webkit-scrollbar{display:none}
nav.tabs button{
  flex:0 0 auto;background:none;border:0;border-bottom:2px solid transparent;
  color:var(--suave);font:inherit;font-size:.88rem;font-weight:600;
  padding:.55rem .7rem;cursor:pointer;white-space:nowrap;
}
nav.tabs button:hover{color:var(--texto)}
nav.tabs button[aria-selected="true"]{color:var(--ambar);border-bottom-color:var(--ambar)}

main{max-width:var(--ancho);margin:0 auto;padding:1.4rem 1rem 5rem}
section[hidden]{display:none!important}

/* ---------------------------------------------------------------- bloques */
.intro{color:var(--suave);font-size:1.02rem}
.tarjeta{background:var(--panel);border:1px solid var(--borde);border-radius:var(--radio);
         padding:1rem;margin:0 0 1rem}
.tarjeta h3{margin-top:0}
.rejilla{display:grid;gap:.8rem;grid-template-columns:1fr}
@media(min-width:640px){.rejilla.dos{grid-template-columns:1fr 1fr}
                        .rejilla.tres{grid-template-columns:repeat(3,1fr)}}
.aviso{border-left:3px solid var(--ambar);background:var(--panel2);padding:.8rem 1rem;
       border-radius:0 var(--radio) var(--radio) 0;margin:0 0 1rem}
.aviso.rojo{border-left-color:var(--rojo)}
.aviso.verde{border-left-color:var(--verde)}
.aviso p:last-child{margin-bottom:0}
.dato{font-size:1.9rem;font-weight:700;color:var(--ambar);line-height:1;display:block}
.dato + span{color:var(--suave);font-size:.85rem}

/* ---------------------------------------------------------------- tablas */
.tabla{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 1rem;
       border:1px solid var(--borde);border-radius:var(--radio)}
table{border-collapse:collapse;width:100%;font-size:.86rem;min-width:420px}
th,td{text-align:left;padding:.5rem .65rem;border-bottom:1px solid var(--borde);
      vertical-align:top}
th{color:var(--tenue);font-size:.74rem;text-transform:uppercase;letter-spacing:.06em;
   font-weight:700;background:var(--panel2)}
tr:last-child td{border-bottom:0}

/* ---------------------------------------------------------------- paleta */
.paleta{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0 1rem}
.swatch{width:54px;border-radius:8px;overflow:hidden;border:1px solid var(--borde);
        font-size:.62rem;text-align:center}
.swatch i{display:block;height:34px}
.swatch span{display:block;padding:.2rem 0;color:var(--suave);
             font-family:ui-monospace,monospace}

/* ---------------------------------------------------------------- planos */
.planos{display:grid;gap:.9rem;grid-template-columns:1fr}
@media(min-width:560px){.planos{grid-template-columns:1fr 1fr}}
@media(min-width:820px){.planos{grid-template-columns:1fr 1fr 1fr}}
.plano{background:var(--panel);border:1px solid var(--borde);border-radius:var(--radio);
       overflow:hidden;display:flex;flex-direction:column}
.plano img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#000}
.plano .cuerpo{padding:.6rem .7rem .75rem;flex:1}
.plano .n{font-weight:700;color:var(--ambar);font-family:ui-monospace,monospace}
.plano .meta{color:var(--tenue);font-size:.72rem;text-transform:uppercase;
             letter-spacing:.05em;margin:.15rem 0 .4rem}
.plano .acc{font-size:.84rem;margin:0 0 .4rem}
.plano .fun{font-size:.8rem;color:var(--suave);margin:0;border-top:1px dashed var(--borde);
            padding-top:.4rem}
.etq{display:inline-block;font-size:.66rem;font-weight:700;text-transform:uppercase;
     letter-spacing:.05em;padding:.1rem .4rem;border-radius:5px;margin-right:.3rem}
.etq.macro{background:#3a2c10;color:#F2BB34}
.etq.busto{background:#132a3d;color:#7FC4F5}
.etq.amplio{background:#14301f;color:#8FD9A8}
.etq.POV{background:#2b1636;color:#D69CF0}
.etq.impacto{background:#3a1512;color:#F58273}
.etq.titulo{background:#2e2e33;color:#d8d8de}
.filtros{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 1rem}
.filtros button{background:var(--panel2);border:1px solid var(--borde);color:var(--suave);
  font:inherit;font-size:.78rem;font-weight:600;padding:.3rem .6rem;border-radius:999px;
  cursor:pointer}
.filtros button[aria-pressed="true"]{background:var(--ambar);color:#17150c;
  border-color:var(--ambar)}

/* ---------------------------------------------------------------- acordeon */
.paso{background:var(--panel);border:1px solid var(--borde);border-radius:var(--radio);
      margin:0 0 .7rem;overflow:hidden}
.paso > .cab{display:flex;align-items:flex-start;gap:.7rem;padding:.85rem 1rem;
             cursor:pointer;user-select:none;background:none;border:0;width:100%;
             text-align:left;color:inherit;font:inherit}
.paso > .cab:hover{background:var(--panel2)}
.paso .orden{flex:0 0 auto;width:26px;height:26px;border-radius:50%;
  background:var(--panel2);border:1px solid var(--borde);color:var(--suave);
  display:grid;place-items:center;font-size:.78rem;font-weight:700;
  font-family:ui-monospace,monospace}
.paso.hecho .orden{background:var(--verde);border-color:var(--verde);color:#0b1a0e}
.paso .titulo{flex:1}
.paso .titulo b{display:block;font-size:.98rem}
.paso .titulo small{color:var(--tenue);font-size:.78rem}
.paso .flecha{flex:0 0 auto;color:var(--tenue);transition:transform .15s}
.paso[open] .flecha,.paso.abierto .flecha{transform:rotate(90deg)}
.paso .contenido{padding:0 1rem 1rem;border-top:1px solid var(--borde);margin-top:0}
.paso .contenido > :first-child{margin-top:1rem}
.donde{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;background:var(--panel2);border:1px solid var(--borde);
  color:var(--suave);padding:.15rem .5rem;border-radius:6px;margin:0 .3rem .5rem 0}
label.check{display:flex;gap:.5rem;align-items:center;background:var(--panel2);
  border:1px solid var(--borde);border-radius:8px;padding:.5rem .7rem;margin:1rem 0 0;
  cursor:pointer;font-size:.86rem;font-weight:600}
label.check input{width:17px;height:17px;accent-color:var(--verde);flex:0 0 auto}

/* ---------------------------------------------------------------- prompts */
.prompt{position:relative;margin:0 0 1rem}
.prompt pre{background:#08090b;border:1px solid var(--borde);border-radius:var(--radio);
  padding:.85rem 1rem;overflow-x:auto;margin:0;font-size:.79rem;line-height:1.55;
  white-space:pre-wrap;word-break:break-word;color:#cfd3da}
.prompt .copiar{position:absolute;top:.45rem;right:.45rem;background:var(--panel2);
  border:1px solid var(--borde);color:var(--suave);font:inherit;font-size:.72rem;
  font-weight:700;padding:.25rem .55rem;border-radius:6px;cursor:pointer}
.prompt .copiar:hover{color:var(--texto);border-color:var(--suave)}
.prompt .copiar.ok{background:var(--verde);border-color:var(--verde);color:#0b1a0e}
.prompt .rotulo{font-size:.7rem;text-transform:uppercase;letter-spacing:.07em;
  color:var(--tenue);font-weight:700;margin:0 0 .3rem}

/* ---------------------------------------------------------------- checklist */
ul.revisar{list-style:none;padding:0;margin:.4rem 0 1rem}
ul.revisar li{position:relative;padding-left:1.5rem;margin:0 0 .4rem;font-size:.88rem}
ul.revisar li::before{content:"";position:absolute;left:0;top:.42em;width:12px;height:12px;
  border:1.5px solid var(--tenue);border-radius:3px}

/* ---------------------------------------------------------------- formulario */
.form{display:grid;gap:.7rem;grid-template-columns:1fr}
@media(min-width:640px){.form{grid-template-columns:1fr 1fr}
                        .form .ancho{grid-column:1/-1}}
.campo label{display:block;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;
  color:var(--tenue);font-weight:700;margin:0 0 .25rem}
.campo input,.campo textarea,.campo select{
  width:100%;background:#08090b;border:1px solid var(--borde);border-radius:8px;
  color:var(--texto);font:inherit;font-size:.88rem;padding:.5rem .65rem;resize:vertical}
.campo input:focus,.campo textarea:focus,.campo select:focus{
  outline:2px solid var(--ambar);outline-offset:-1px;border-color:var(--ambar)}
.campo small{display:block;color:var(--tenue);font-size:.74rem;margin-top:.2rem}

/* ---------------------------------------------------------------- svg mapa */
.mapa{background:var(--panel);border:1px solid var(--borde);border-radius:var(--radio);
      padding:.8rem;margin:0 0 1rem;overflow-x:auto}
.mapa svg{display:block;width:100%;min-width:520px;height:auto}

/* ---------------------------------------------------------------- pie */
footer{border-top:1px solid var(--borde);margin-top:3rem;padding:1.5rem 1rem 3rem;
  color:var(--tenue);font-size:.8rem;text-align:center}
.barra{position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(12,13,16,.96);
  border-top:1px solid var(--borde);padding:.5rem 1rem;display:flex;align-items:center;
  gap:.7rem;font-size:.78rem;color:var(--suave)}
.barra .pista{flex:1;height:5px;background:var(--panel2);border-radius:99px;overflow:hidden}
.barra .relleno{height:100%;width:0;background:var(--verde);transition:width .25s}
.barra button{background:none;border:1px solid var(--borde);color:var(--tenue);font:inherit;
  font-size:.72rem;padding:.2rem .5rem;border-radius:6px;cursor:pointer}
@media(min-width:640px){main{padding-bottom:4rem}}
"""
