// Comprueba que el JavaScript que sale hacia el navegador es sintácticamente
// válido en todas las páginas.
//
//   node pruebas/js-valido.js
//
// Existe por un error real: dentro de un template literal, "\n" se convierte en
// un salto de línea de verdad. Escrito así en una expresión regular, el script
// entero deja de parsear y la página queda muerta sin decir nada. Para que el
// navegador reciba la secuencia \n hay que escribir \\n en pages.js.

const { renderPage } = require('../pages');

const PAGINAS = ['inicio', 'aseo', 'facturacion', 'jacuzzi', 'cajamenor'];
let malos = 0;

for (const pagina of PAGINAS) {
  const html = renderPage(pagina);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) { console.log(`FALLA ${pagina}: no tiene ningún script`); malos++; continue; }
  scripts.forEach((codigo, i) => {
    try {
      new Function(codigo);
      console.log(`  OK   ${pagina} · script ${i + 1}`);
    } catch (e) {
      console.log(`FALLA  ${pagina} · script ${i + 1}: ${e.message}`);
      malos++;
    }
  });
}

console.log(malos ? `\n>>> ${malos} scripts rotos` : '\n>>> Todo el JS emitido es válido');
process.exit(malos ? 1 : 0);
