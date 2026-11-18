// Refaz as fotos dos guias com as contas de demonstração (nada de dados reais).
// Sobe um servidor temporário, cria a demonstração e tira cada foto no tamanho usado nos guias.
// Uso: npm run guia:imagens   (precisa do Playwright; veja scripts/gerar-guia-pdf.js)
// Dica: rode com LANG=pt_BR.UTF-8 para datas no formato brasileiro.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-guia-'));
process.env.ADMIN_PASSWORD = 'guia-' + Math.random().toString(36).slice(2);
const { app } = require('../server');
const L = require('../public/js/leitor');

const IMG = path.join(__dirname, '..', 'public', 'guia', 'img');
const EMP = path.join(IMG, 'empresas');
const DESKTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 };
const CELULAR = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// ---------- documentos de exemplo para a leitura de arquivos ----------
function linhaBancaria(dias, centavos) {
  const hoje = new Date();
  const venc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias);
  const fator = 1000 + Math.round((venc - Date.UTC(2025, 1, 22)) / 864e5);
  const livre = '1234567890123456789012345';
  const c1 = '0019' + livre.slice(0, 5), c2 = livre.slice(5, 15), c3 = livre.slice(15, 25);
  return `${c1}${L.mod10(c1)}${c2}${L.mod10(c2)}${c3}${L.mod10(c3)}7${fator}${String(centavos).padStart(10, '0')}`;
}
const dataBR = (dias) => { const d = new Date(); d.setDate(d.getDate() + dias); return d.toLocaleDateString('pt-BR'); };
const ddmm = (dias) => dataBR(dias).slice(0, 5);
const doc = (corpo) => `<!doctype html><meta charset="utf-8"><style>body{font:13px Arial,sans-serif;color:#222;margin:36px}h1{font-size:18px;margin:0 0 4px}.cx{border:1px solid #bbb;padding:6px 8px;display:inline-block;margin:4px 6px 4px 0;min-width:200px}.r{font-size:9px;color:#777;text-transform:uppercase;display:block}table{border-collapse:collapse;width:100%;margin-top:10px}td{padding:4px 0;border-bottom:1px solid #eee}td:last-child{text-align:right}.mono{font-family:monospace;font-size:13px}</style>${corpo}`;
const DOCS = {
  boleto: () => doc(`<h1>Companhia de Energia Exemplo</h1><div>Conta de energia elétrica · Instalação 0045.778.21</div>
    <div class="cx"><span class="r">Cliente</span>ANA SOUZA</div><br><div class="cx"><span class="r">Vencimento</span><b>${dataBR(12)}</b></div><div class="cx"><span class="r">Total a pagar</span><b>R$ 287,43</b></div>
    <table><tr><td>Consumo (312 kWh)</td><td>R$ 248,10</td></tr><tr><td>Bandeira amarela</td><td>R$ 18,72</td></tr><tr><td>Contrib. iluminação pública</td><td>R$ 20,61</td></tr></table>
    <p><span class="r">Linha digitável</span><span class="mono">${L.formatarLinha(linhaBancaria(12, 28743))}</span></p>`),
  fatura: () => doc(`<h1>Banco Exemplo · Fatura do cartão de crédito Nubank</h1><div>Cartão final 4821 · Ana Souza</div>
    <div class="cx"><span class="r">Total desta fatura</span><b>R$ 1.326,00</b></div><div class="cx"><span class="r">Vencimento</span><b>${dataBR(20)}</b></div>
    <h3>Lançamentos</h3><table>${[['MERCADO BOM PRECO', '412,90'], ['POSTO AVENIDA', '230,00'], ['STREAMING PLUS', '55,90'], ['RESTAURANTE SABOR', '128,40'],
    ['FARMACIA CENTRAL 2/3', '96,30'], ['LOJA ONLINE ELETRO 4/10', '189,90'], ['CINEMA SHOPPING', '74,00'], ['PET AMIGO', '138,60']]
    .map(([n, v], i) => `<tr><td>${ddmm(-25 + i * 3)} ${n}</td><td>${v}</td></tr>`).join('')}<tr><td><b>Total</b></td><td><b>1.326,00</b></td></tr></table>`),
  nota: () => doc(`<h1>DANFE · Documento auxiliar da nota fiscal eletrônica</h1><div>Nº 004.512 · Série 1</div>
    <p><span class="r">Emitente</span></p><div>DEPÓSITO DE MATERIAIS CONSTRUFORTE LTDA</div><div>CNPJ 98.765.432/0001-10</div>
    <p><span class="r">Destinatário</span>CONSTRUTORA HORIZONTE LTDA</p>
    <table><tr><td>Cimento CP-II 50kg (120 sc)</td><td>4.680,00</td></tr><tr><td>Areia média (12 m³)</td><td>1.560,00</td></tr><tr><td>Vergalhão 10mm (80 br)</td><td>3.360,00</td></tr></table>
    <p>Valor total da nota R$ 9.600,00</p><p><span class="r">Fatura / duplicatas</span></p><div>001 ${dataBR(22)} 4.800,00</div><div>002 ${dataBR(52)} 4.800,00</div>`),
};

(async () => {
  const servidor = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const B = `http://localhost:${servidor.address().port}`;
  const navegador = await chromium.launch({ args: ['--lang=pt-BR'] });
  const pastaDocs = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-docs-'));
  const feitas = [];
  try {
    // documentos em PDF
    const g = await navegador.newPage();
    for (const [n, f] of Object.entries(DOCS)) { await g.setContent(f()); await g.pdf({ path: path.join(pastaDocs, n + '.pdf'), format: 'A4' }); }
    await g.close();

    // demonstração
    const req = async (cookie, metodo, url, corpo) => {
      const r = await fetch(B + url, { method: metodo, headers: { 'Content-Type': 'application/json', cookie }, body: corpo && JSON.stringify(corpo) });
      return { cookie: (r.headers.get('set-cookie') || '').split(';')[0] || cookie, dados: await r.json() };
    };
    const adm = await req('', 'POST', '/api/login', { login: 'admin', senha: process.env.ADMIN_PASSWORD });
    const senha = (await req(adm.cookie, 'POST', '/api/admin/demo', {})).dados.senha;
    const novo = (await req(adm.cookie, 'POST', '/api/admin/usuarios', { nome: 'Maria Clara', login: 'maria.clara' })).dados;

    const pagina = async (opcoes) => {
      const p = await (await navegador.newContext({ locale: 'pt-BR', ...opcoes })).newPage();
      p.on('pageerror', (e) => console.error('erro na página:', e.message));
      return p;
    };
    const entrar = async (p, login, s = senha) => {
      await p.goto(B + '/entrar'); await p.fill('#login', login); await p.fill('#senha', s); await p.click('#entrar');
      await p.waitForURL(B + '/'); await p.waitForTimeout(700);
    };
    const ir = async (p, hash, espera) => { await p.goto(B + '/#' + hash); if (espera) await p.waitForSelector(espera); await p.waitForTimeout(500); };
    const salvar = async (alvo, arquivo, opcoes = {}) => {
      await alvo.screenshot({ path: arquivo, type: 'jpeg', quality: 86, ...opcoes });
      feitas.push(path.relative(IMG, arquivo));
    };
    const modal = (p) => p.locator('.fundo-modal .modal').last();
    // Janela inteira, mesmo maior que a tela; as de baixo ficam escondidas.
    const fotoModal = async (p, arquivo) => {
      await p.waitForTimeout(450);
      const vp = p.viewportSize();
      const h = await p.evaluate(() => {
        const fundos = [...document.querySelectorAll('.fundo-modal')];
        fundos.slice(0, -1).forEach((f) => { f.style.visibility = 'hidden'; });
        return fundos.at(-1).querySelector('.modal').scrollHeight + 140;
      });
      await p.setViewportSize({ width: vp.width, height: Math.max(vp.height, h) }); await p.waitForTimeout(350);
      await salvar(modal(p), arquivo);
      await p.setViewportSize(vp);
      await p.evaluate(() => document.querySelectorAll('.fundo-modal').forEach((f) => { f.style.visibility = ''; }));
    };
    const cartao = (p, raiz, texto) => p.locator(`${raiz} .cartao`, { hasText: texto }).first();
    const recorte = async (p, primeiro, ultimo) => {
      const a = await primeiro.boundingBox(), z = await (ultimo || primeiro).boundingBox();
      return { clip: { x: a.x - 2, y: a.y - 2, width: a.width + 4, height: z.y + z.height - a.y + 4 }, fullPage: true };
    };
    const ler = async (p, arquivo) => {
      await p.setInputFiles('[data-arq-input=arquivo]', arquivo);
      await p.waitForSelector('.leit', { timeout: 60000 }); await p.waitForTimeout(400);
    };

    // ---------- login e primeira senha ----------
    const login = await pagina(DESKTOP);
    await login.goto(B + '/entrar'); await login.evaluate(() => document.fonts.ready);
    await salvar(login, path.join(IMG, '01-login.jpg'));
    await entrar(login, 'maria.clara', novo.senhaTemporaria);
    await login.waitForSelector('#t-senha');
    await login.fill('.fundo-modal input[type=password] >> nth=0', 'minha-senha-nova').catch(() => {});
    await fotoModal(login, path.join(IMG, '02-criar-senha.jpg'));

    // ---------- pessoa física ----------
    const pf = await pagina(DESKTOP);
    await entrar(pf, 'demo.pf');
    await ir(pf, 'mes', '#lista .item');
    await salvar(pf, path.join(IMG, '03-mes.jpg'));
    const lista = pf.locator('#lista').locator('xpath=ancestor::div[contains(@class,"cartao")][1]');
    const bl = await lista.boundingBox();
    await salvar(pf, path.join(IMG, '06-lista.jpg'), { clip: { x: bl.x, y: bl.y, width: bl.width, height: Math.min(bl.height, 450) }, fullPage: true });

    // formulário: compra parcelada
    await pf.click('.topo [data-novo]'); await pf.waitForSelector('#f-desc');
    await pf.click('label[data-cat=variavel]');
    await pf.fill('#f-desc', 'Geladeira'); await pf.fill('#f-valor', '3.590,00');
    await pf.fill('#f-obs', 'Compra na loja do bairro, 6x sem juros.');
    await pf.click('#f-recorrencia label:has(input[value=parcelada])'); await pf.fill('#f-qtd', '6'); await pf.dispatchEvent('#f-qtd', 'input');
    await pf.click('label:has(input[name=tg][value=compras])').catch(() => {});
    await pf.waitForTimeout(300);
    await fotoModal(pf, path.join(IMG, '04-novo-lancamento.jpg'));
    await pf.keyboard.press('Escape');

    // leitura de boleto e de fatura
    await pf.click('.topo [data-novo]'); await pf.waitForSelector('[data-zona-arq]');
    await ler(pf, path.join(pastaDocs, 'boleto.pdf'));
    await fotoModal(pf, path.join(IMG, '16-leitura-boleto.jpg'));
    await pf.keyboard.press('Escape');
    await pf.click('.topo [data-novo]'); await pf.waitForSelector('[data-zona-arq]');
    await ler(pf, path.join(pastaDocs, 'fatura.pdf'));
    await fotoModal(pf, path.join(IMG, '17-leitura-fatura.jpg'));
    await pf.keyboard.press('Escape');

    // escolher o escopo ao editar uma parcela
    await ir(pf, 'mes', '#lista .item');
    const idSerie = await pf.evaluate(async () => {
      const d = await (await fetch('/api/dados')).json(); const h = new Date();
      return (d.lancamentos.find((l) => l.parcela && l.ano === h.getFullYear() && l.mes === h.getMonth()) || d.lancamentos.find((l) => l.grupo && l.ano === h.getFullYear() && l.mes === h.getMonth())).id;
    });
    await pf.click(`[data-acao=editar][data-id="${idSerie}"]`); await pf.waitForSelector('#f-salvar');
    await pf.click('#f-salvar'); await pf.waitForSelector('.opcoes-escopo');
    await fotoModal(pf, path.join(IMG, '05-serie.jpg'));
    await pf.keyboard.press('Escape'); await pf.keyboard.press('Escape');

    await ir(pf, 'calendario', '#calendario .cal-dias');
    await salvar(pf, path.join(IMG, '12-calendario.jpg'), { fullPage: true, clip: { x: 0, y: 0, width: 1280, height: 900 } });
    await ir(pf, 'dashboard', '.abas-dash');
    await salvar(pf, path.join(IMG, '13-dashboard.jpg'));
    await pf.click('[data-aba=gastos]'); await pf.waitForTimeout(500);
    await salvar(pf, path.join(IMG, '14-gastos.jpg'));
    await ir(pf, 'sim', '#simulador .cartao');
    await salvar(pf, path.join(IMG, '15-simulador.jpg'));
    await ir(pf, 'ano', '#tabela-ano tr');
    await salvar(pf, path.join(IMG, '07-ano.jpg'), { fullPage: true });
    await ir(pf, 'planos', '#planos');
    const umPlano = pf.locator('#planos a.cartao-plano').first();
    if (await umPlano.count()) { await umPlano.click(); await pf.waitForTimeout(600); }
    await salvar(pf, path.join(IMG, '08-plano.jpg'), { fullPage: true });

    // ---------- celular (pessoa física) ----------
    const cel = await pagina(CELULAR);
    await entrar(cel, 'demo.pf');
    await ir(cel, 'mes', '#lista .item');
    await salvar(cel, path.join(IMG, '10-celular-mes.jpg'));
    await cel.tap('.fab'); await cel.waitForSelector('.folha-inicio'); await cel.waitForTimeout(300);
    await salvar(cel, path.join(IMG, '18-celular-inicio.jpg'));
    await cel.tap('[data-inicio=digitar]'); await cel.waitForSelector('#f-desc');
    await cel.fill('#f-desc', 'Academia'); await cel.fill('#f-valor', '99,90');
    await cel.click('#f-recorrencia label:has(input[value=mensal])'); await cel.waitForTimeout(300);
    await cel.evaluate(() => { document.activeElement?.blur(); document.querySelector('.fundo-modal').scrollTo(0, 0); });
    await salvar(cel, path.join(IMG, '11-celular-form.jpg'));

    // ---------- empresa ----------
    const e = await pagina(DESKTOP);
    await entrar(e, 'demo.empresa');
    await ir(e, 'painel', '#pj .dash-grade');
    await salvar(e, path.join(EMP, 'e01-painel.jpg'));
    await ir(e, 'contas', '#pj .tab-contas');
    await salvar(e, path.join(EMP, 'e02-contas.jpg'));
    await e.click('.topo [data-pj-novo]'); await e.waitForSelector('#pjl-desc');
    await e.fill('#pjl-desc', 'Locação de andaimes'); await e.fill('#pjl-valor', '7.500,00');
    await e.fill('#pjl-parte', 'Andaimes Paulista');
    await e.click('label:has(input[name=pjl-rec][value=parcelada])'); await e.fill('#pjl-qtd', '3');
    await e.waitForTimeout(300);
    await fotoModal(e, path.join(EMP, 'e03-form.jpg'));
    await e.keyboard.press('Escape');
    await e.click('.topo [data-pj-novo]'); await e.waitForSelector('[data-zona-arq]');
    await ler(e, path.join(pastaDocs, 'nota.pdf'));
    await fotoModal(e, path.join(EMP, 'e14-leitura-nota.jpg'));
    await e.keyboard.press('Escape');
    await ir(e, 'calendario', '#pj .cal-dias');
    await salvar(e, path.join(EMP, 'e13-calendario.jpg'), { fullPage: true, clip: { x: 0, y: 0, width: 1280, height: 900 } });
    await ir(e, 'orcamento', '#pj .cartao');
    await salvar(cartao(e, '#pj', 'Orçamento'), path.join(EMP, 'e04-orcamento.jpg'));
    const grade = e.locator('#pj > .cartao').nth(1);
    const bg = await grade.boundingBox();
    await salvar(e, path.join(EMP, 'e04b-grade.jpg'), { fullPage: true, clip: { x: bg.x, y: bg.y, width: bg.width, height: Math.min(bg.height, 620) } });
    await salvar(cartao(e, '#pj', 'Histórico de versões'), path.join(EMP, 'e04c-versoes.jpg'));
    await ir(e, 'ovr', '#pj .dash-cards');
    await salvar(e, path.join(EMP, 'e05-ovr.jpg'), await recorte(e, e.locator('#pj > .dash-cab'), e.locator('#pj > .dash-cards')));
    await salvar(cartao(e, '#pj', 'Despesas em'), path.join(EMP, 'e05c-ovr-grafico.jpg'));
    await ir(e, 'dre', '#pj .cartao');
    await salvar(e.locator('#pj > .cartao').nth(1), path.join(EMP, 'e06-dre.jpg'));
    await ir(e, 'caixa', '#pj .cartao');
    await salvar(e, path.join(EMP, 'e07-caixa.jpg'), await recorte(e, e.locator('#pj > .cartao').nth(1), e.locator('#pj > .cartao').nth(2)));
    await ir(e, 'cadastros', '#pj .cartao');
    await salvar(e, path.join(EMP, 'e08-cadastros.jpg'), { fullPage: true, clip: { x: 0, y: 0, width: 1280, height: 1000 } });
    await ir(e, 'equipe', '#pj [data-pj-solicitar]');
    await e.click('#pj [data-pj-solicitar]'); await e.waitForTimeout(400);
    await fotoModal(e, path.join(EMP, 'e09b-solicitar.jpg'));
    await e.keyboard.press('Escape');
    const ecel = await pagina(CELULAR);
    await entrar(ecel, 'demo.empresa');
    await ir(ecel, 'painel', '#pj .dash-grade');
    await salvar(ecel, path.join(EMP, 'e11-celular-painel.jpg'));
  } finally {
    await navegador.close();
    servidor.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
    fs.rmSync(pastaDocs, { recursive: true, force: true });
  }
  console.log(`${feitas.length} fotos atualizadas:\n  ${feitas.join('\n  ')}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
