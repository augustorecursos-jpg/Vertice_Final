// Gera public/guia/Guia-Vertice.pdf a partir de public/guia.html.
// Uso: npx -y playwright@1 install chromium (uma vez) e depois: node scripts/gerar-guia-pdf.js
// Dica: rode com LANG=pt_BR.UTF-8 para datas no formato brasileiro.
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

(async () => {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto('file://' + path.join(__dirname, '..', 'public', 'guia.html'), { waitUntil: 'networkidle' });
  await pagina.emulateMedia({ media: 'print' });
  await pagina.evaluate(() => document.fonts.ready);
  // O conteúdo de cada .pagina precisa terminar antes do rodapé (A4 = 297 mm; rodapé a ~18 mm da borda).
  const estouros = await pagina.$$eval('.pagina', (ps) => ps.map((p, i) => {
    const topo = p.getBoundingClientRect().top;
    const limite = p.clientHeight - (p.classList.contains('capa') ? 0 : 68);
    const fundo = Math.max(...[...p.children].filter((c) => !c.classList.contains('rodape') && getComputedStyle(c).position !== 'absolute')
      .map((c) => c.getBoundingClientRect().bottom - topo));
    return { i: i + 1, sobra: Math.round(fundo - limite) };
  }).filter((x) => x.sobra > 0));
  if (estouros.length) {
    console.error('Páginas com conteúdo além da folha:', estouros);
    process.exitCode = 1;
  }
  const destino = path.join(__dirname, '..', 'public', 'guia', 'Guia-Vertice.pdf');
  await pagina.pdf({ path: destino, preferCSSPageSize: true, printBackground: true });
  await navegador.close();
  console.log('PDF gerado em', destino);
})();
