/* Vértice — interface. Regras de negócio ficam em nucleo.js (window.Nucleo). */
(function () {
  'use strict';
  const N = window.Nucleo;
  const { CAT, CATEGORIAS, MESES, MESES_CURTOS, moeda, moedaCurta } = N;

  // ---------- utilidades de DOM ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONES = {
    maleta: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    pasta: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    impressora: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    grafico: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    ajustes: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    esq: '<path d="m15 18-6-6 6-6"/>',
    dir: '<path d="m9 18 6-6-6-6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    tabela: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    planilha: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h2M14 13h2M8 17h2M14 17h2"/>',
    usuario: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    enviar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    repetir: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    teclado: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M8 16h8"/>',
    lixo: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    editar: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    carteira: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3"/><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M21 12h-4a2 2 0 0 0 0 4h4z"/>',
    sobe: '<path d="M7 17 17 7M7 7h10v10"/>',
    desce: '<path d="M17 7 7 17M17 17H7V7"/>',
    cofre: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
    parcela: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    mensagem: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    livro: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    dinheiro: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M11 15h3"/>',
    pizza: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    desce2: '<path d="m6 9 6 6 6-6"/>',
    alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    brilho: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    nota: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    destravar: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    chave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    copiar: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  };
  const ic = (nome, extra = '') => `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ''}</svg>`;
  const hidratar = (raiz = document) => $$('i[data-ic]', raiz).forEach((el) => { el.outerHTML = ic(el.dataset.ic); });

  const ILUSTRA = `<svg class="ilustra" viewBox="0 0 160 130" fill="none" aria-hidden="true"><ellipse cx="80" cy="118" rx="58" ry="7" fill="#e8f3fa"/>
    <rect x="30" y="22" width="100" height="88" rx="14" fill="#fff" stroke="#b3d8eb" stroke-width="3"/>
    <path d="M30 36a14 14 0 0 1 14-14h72a14 14 0 0 1 14 14v10H30z" fill="#20b8d5"/>
    <rect x="52" y="12" width="6" height="20" rx="3" fill="#17397d"/><rect x="102" y="12" width="6" height="20" rx="3" fill="#17397d"/>
    <g fill="#e8f3fa"><rect x="44" y="58" width="14" height="12" rx="3"/><rect x="64" y="58" width="14" height="12" rx="3"/><rect x="104" y="58" width="14" height="12" rx="3"/><rect x="44" y="78" width="14" height="12" rx="3"/><rect x="84" y="78" width="14" height="12" rx="3"/><rect x="104" y="78" width="14" height="12" rx="3"/></g>
    <path d="m84 70 6 6 10-12" stroke="#005ea4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="136" cy="26" r="5" fill="#dcf4f9"/><path d="M136 21v10M131 26h10" stroke="#005ea4" stroke-width="2.5" stroke-linecap="round"/></svg>`;

  // ---------- preferências locais (só de interface) ----------
  const CHAVE_PREFS = 'vertice:prefs';
  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  let prefs = { categoria: 'fixa', ordem: 'venc', ...ler(CHAVE_PREFS, {}) };
  const salvarPrefs = () => gravar(CHAVE_PREFS, prefs);

  // ---------- servidor ----------
  let eu = null;                     // usuário logado
  let modoEmpresa = false;           // usuário de empresa: a tela é do Vértice Empresas (empresa.js)
  let dados = { lancamentos: [], planos: [], provisoes: [], cenarios: [] };   // lançamentos, planejamentos, provisões e cenários do simulador
  let rev = 0;                       // revisão dos dados no servidor

  async function api(metodo, url, corpo) {
    const r = await fetch(url, {
      method: metodo, credentials: 'same-origin',
      headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    if (r.status === 401 && url !== '/api/eu/senha') { location.replace('/entrar'); throw new Error('Sessão expirada.'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.erro || 'Erro no servidor. Tente novamente.'), { status: r.status, dados: d });
    return d;
  }

  // Cada alteração é enviada ao servidor; alterações feitas durante um envio seguem no envio seguinte.
  const sinc = { ocupado: false, pendente: false, estado: 'ok', tentativa: null };
  function marcarSinc(estado) {
    sinc.estado = estado;
    const el = $('#sinc');
    if (!el) return;
    el.className = 'sinc ' + estado;
    el.textContent = { ok: 'Salvo na nuvem', salvando: 'Salvando…', erro: 'Sem conexão · tentando de novo' }[estado];
  }
  async function sincronizar() {
    if (sinc.ocupado) { sinc.pendente = true; return; }
    sinc.ocupado = true;
    clearTimeout(sinc.tentativa);
    marcarSinc('salvando');
    try {
      do {
        sinc.pendente = false;
        try {
          rev = (await api('PUT', '/api/dados', { rev, lancamentos: dados.lancamentos, planos: dados.planos, provisoes: dados.provisoes, cenarios: dados.cenarios })).rev;
          marcarSinc('ok');
        } catch (e) {
          if (e.status === 409) {
            rev = e.dados.rev; dados.lancamentos = e.dados.lancamentos; dados.planos = e.dados.planos || []; dados.provisoes = e.dados.provisoes || []; dados.cenarios = e.dados.cenarios || [];
            sinc.pendente = false; marcarSinc('ok'); render();
            toast('Seus dados mudaram em outro dispositivo. Carreguei a versão mais recente; confira a última alteração.', { erro: true, tempo: 9000 });
          } else if (e.status >= 400 && e.status < 500) {
            marcarSinc('erro'); toast(e.message, { erro: true });
          } else {
            marcarSinc('erro');
            sinc.tentativa = setTimeout(sincronizar, 10000);
          }
          break;
        }
      } while (sinc.pendente);
    } finally { sinc.ocupado = false; }
  }
  /** Traz alterações feitas em outro dispositivo (ao voltar para a aba). */
  async function atualizarDoServidor() {
    if (modoEmpresa || sinc.ocupado || sinc.estado !== 'ok' || $('.fundo-modal') || document.activeElement?.closest('#planos')) return;
    try {
      const d = await api('GET', '/api/dados');
      if (d.rev !== rev && !sinc.ocupado) { rev = d.rev; dados.lancamentos = d.lancamentos; dados.planos = d.planos || []; dados.provisoes = d.provisoes || []; dados.cenarios = d.cenarios || []; render(); }
    } catch { /* tenta de novo na próxima vez */ }
  }

  function salvar() {
    render();
    sincronizar();
  }

  // ---------- estado da tela ----------
  const agora = new Date();
  const est = {
    secao: 'mes', ano: agora.getFullYear(), mes: agora.getMonth(),
    filtro: 'todos', filtroProvisao: null, filtroCartao: null, painelAno: false, painelCats: new Set(), painelAbertas: new Set(), painelAba: 'resumo', gastosAbertos: new Set(), comprasAbertas: new Set(), sim: { base: 'mes', ativo: null, cen: { valores: {}, tipos: {} } }, simTiposAberto: false, empresaSel: null, busca: '', ordem: prefs.ordem, abertas: new Set(),
  };

  // ---------- toast ----------
  function toast(msg, { erro = false, acao, rotulo = 'Desfazer', tempo = 4500 } = {}) {
    const d = document.createElement('div');
    if (erro) d.className = 'erro';
    d.innerHTML = `${ic(erro ? 'alerta' : 'check')}<span>${esc(msg)}</span>`;
    if (acao) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = rotulo;
      b.onclick = () => { acao(); d.remove(); };
      d.append(b);
    }
    const pilha = $('#toast');
    pilha.append(d);
    while (pilha.children.length > 2) pilha.firstElementChild.remove();
    setTimeout(() => d.remove(), acao ? tempo + 2000 : tempo);
  }

  // ---------- modais ----------
  function abrirModal(html, { estreito = false, fixo = false } = {}) {
    const anterior = document.activeElement;
    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';
    fundo.innerHTML = html;
    const modal = fundo.firstElementChild;
    if (estreito) modal.classList.add('estreito');
    document.body.append(fundo);
    hidratar(fundo);
    const fechar = () => { fundo.remove(); document.removeEventListener('keydown', teclas); anterior?.focus?.(); };
    function teclas(e) { if (!fixo && e.key === 'Escape' && $$('.fundo-modal').at(-1) === fundo) { e.stopPropagation(); fechar(); fundo.dispatchEvent(new Event('cancelado')); } }
    document.addEventListener('keydown', teclas);
    fundo.addEventListener('mousedown', (e) => { if (!fixo && e.target === fundo) { fechar(); fundo.dispatchEvent(new Event('cancelado')); } });
    $$('[data-fechar]', fundo).forEach((b) => b.addEventListener('click', () => { fechar(); fundo.dispatchEvent(new Event('cancelado')); }));
    setTimeout(() => (fundo.querySelector('[autofocus]') || fundo.querySelector('input, button:not([data-fechar])'))?.focus(), 30);
    return { fundo, modal, fechar };
  }

  /** Pergunta em quais itens de uma série a ação vale. Resolve 'este' | 'proximos' | 'todos' | null. */
  function escolherEscopo(l, verbo) {
    if (!l.grupo) return Promise.resolve('este');
    const qtd = dados.lancamentos.filter((x) => x.grupo === l.grupo).length;
    const tipo = l.parcela ? 'parcelamento' : 'recorrência';
    return new Promise((ok) => {
      const { fundo, fechar } = abrirModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-escopo">
          <div class="cab-modal"><h2 id="t-escopo">${esc(verbo)} ${tipo}</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <p class="suave" style="margin-top:0">“${esc(l.desc)}” faz parte de uma série com ${qtd} lançamentos.</p>
          <div class="opcoes-escopo">
            <button type="button" class="btn sec" data-esc="este"><span>Só este<small>${esc(MESES[l.mes])} de ${l.ano}</small></span></button>
            <button type="button" class="btn sec" data-esc="proximos"><span>Este e os próximos<small>A partir de ${esc(MESES[l.mes].toLowerCase())} de ${l.ano}</small></span></button>
            <button type="button" class="btn sec" data-esc="todos"><span>Toda a série<small>Os ${qtd} lançamentos</small></span></button>
          </div>
        </div>`, { estreito: true });
      fundo.addEventListener('cancelado', () => ok(null));
      $$('[data-esc]', fundo).forEach((b) => b.addEventListener('click', () => { fechar(); ok(b.dataset.esc); }));
    });
  }

  function confirmar({ titulo, texto, botao = 'Confirmar', perigo = false, palavra = null }) {
    return new Promise((ok) => {
      const { fundo, modal, fechar } = abrirModal(`
        <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-conf" novalidate autocomplete="off">
          <div class="cab-modal"><h2 id="t-conf">${esc(titulo)}</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <p style="margin-top:0">${texto}</p>
          ${palavra ? `<label class="rotulo" for="c-palavra">Digite <b>${esc(palavra)}</b> para confirmar</label><input type="text" id="c-palavra" autocomplete="off" autofocus>` : ''}
          <div class="rodape-modal">
            <button type="button" class="btn sec" data-fechar>Cancelar</button>
            <button class="btn ${perigo ? 'perigo cheio' : ''}" id="c-ok" ${palavra ? 'disabled' : ''}>${esc(botao)}</button>
          </div>
        </form>`, { estreito: true });
      fundo.addEventListener('cancelado', () => ok(false));
      if (palavra) $('#c-palavra', modal).addEventListener('input', (e) => { $('#c-ok', modal).disabled = e.target.value.trim().toLowerCase() !== palavra.toLowerCase(); });
      modal.addEventListener('submit', (e) => { e.preventDefault(); if ($('#c-ok', modal).disabled) return; fechar(); ok(true); });
    });
  }

  // ---------- formulário de lançamento ----------
  function abrirFormulario(existente = null) {
    const tpl = $('#tpl-lancamento').content.firstElementChild.cloneNode(true);
    const { fundo, modal, fechar } = abrirModal(tpl.innerHTML);
    const f = (id) => $('#' + id, modal);

    f('f-categorias').insertAdjacentHTML('beforeend', CATEGORIAS.map((c) =>
      `<label data-cat="${c.id}"><input type="radio" name="cat" value="${c.id}"><span><i></i>${esc(c.nome)}</span></label>`).join(''));
    const descs = [...new Set(dados.lancamentos.slice().sort((a, b) => b.criadoEm - a.criadoEm).map((l) => l.desc))].slice(0, 60);
    f('sugestoes').innerHTML = descs.map((d) => `<option value="${esc(d)}">`).join('');

    const hoje = new Date();
    const diaPadrao = est.ano === hoje.getFullYear() && est.mes === hoje.getMonth() ? hoje.getDate() : Math.min(10, N.diasNoMes(est.ano, est.mes));
    const l = existente || { desc: '', centavos: null, categoria: prefs.categoria, ano: est.ano, mes: est.mes, dia: diaPadrao };
    $(`input[name=cat][value="${CAT[l.categoria] ? l.categoria : 'fixa'}"]`, modal).checked = true;
    f('f-desc').value = l.desc;
    f('f-valor').value = l.centavos != null ? N.valorParaCampo(l.centavos) : '';
    f('f-data').value = N.isoDe(l);
    f('f-obs').value = l.obs || '';
    f('f-cartao-campo').innerHTML = seletorCartao('f-cartao', l.cartao || (existente ? '' : prefs.cartao || ''), 'Selecione o cartão');
    const cartaoSel = ligarSeletorCartao(modal, 'f-cartao', () => { mostrarCartao(); opcoesProvisao(); });
    const recentes = cartoesConhecidos().usados.slice(0, 5);
    const lista = recentes.length ? recentes : N.CARTOES_SUGERIDOS.slice(0, 5);
    f('atalhos-cartao').innerHTML = lista.map((n) => `<button type="button" data-cartao="${esc(n)}">${esc(n)}</button>`).join('');
    f('atalhos-cartao').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cartao]');
      if (!b) return;
      cartaoSel.definir(b.dataset.cartao);
    });
    // Tipo de gasto: sugerido pela descrição até a pessoa escolher um.
    f('f-tipos').innerHTML = `<label><input type="radio" name="tg" value=""><span>Sem tipo</span></label>${N.TIPOS_GASTO.map((t) => `<label><input type="radio" name="tg" value="${t.id}"><span>${t.emoji} ${esc(t.nome)}</span></label>`).join('')}`;
    let tipoManual = !!l.tipoGasto;
    const marcarTipo = (id) => { const r = $(`input[name=tg][value="${id || ''}"]`, modal); if (r) r.checked = true; };
    marcarTipo(l.tipoGasto || '');
    function sugerirTipo() {
      if (tipoManual) return;
      const sug = N.sugerirTipoGasto(f('f-desc').value, dados.lancamentos);
      marcarTipo(sug || '');
      f('dica-tipo').textContent = sug ? `Sugerido pela descrição: ${N.TIPO[sug].nome}. Toque em outro para trocar.` : '';
    }
    f('f-tipos').addEventListener('change', () => { tipoManual = true; f('dica-tipo').textContent = ''; });
    f('f-desc').addEventListener('input', sugerirTipo);
    function mostrarTipo() { f('bloco-tipo').hidden = CAT[$('input[name=cat]:checked', modal)?.value]?.tipo !== 'saida' || detalhando(); }
    const val = (nome) => $(`input[name=${nome}]:checked`, modal)?.value;
    // ---------- compras da fatura (só cartão): cada compra com valor e tipo; o valor da fatura é a soma ----------
    let compras = (l.compras || []).map((c) => ({ ...c, tipoManual: true }));
    let detalhar = compras.length > 0;
    let valorManual = !!existente && detalhar && l.centavos > N.somaCompras(l);
    let notaFixas = '';
    const opcoesTipo = (sel) => `<option value="">Sem tipo</option>${N.TIPOS_GASTO.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${t.emoji} ${esc(t.nome)}</option>`).join('')}`;
    const somaCompras = () => compras.reduce((a, c) => a + (c.centavos > 0 ? c.centavos : 0), 0);
    const podeDetalhar = () => $('input[name=cat]:checked', modal)?.value === 'cartao' && (existente || val('rec') !== 'parcelada');
    const detalhando = () => detalhar && podeDetalhar();
    function desenharCompras(focar = null) {
      const bloco = f('bloco-compras');
      bloco.hidden = !podeDetalhar();
      if (bloco.hidden) { f('dica-valor').textContent = ''; return; }
      const lidas = N.lerComprasDoTexto(f('f-obs').value).compras;
      bloco.innerHTML = `<label class="fat-tog"><span><b>Detalhar as compras da fatura</b><small>Cada compra tem valor e tipo de gasto. O valor da fatura é a soma.</small></span>
          <input type="checkbox" class="chave-sw" id="fat-detalhar" ${detalhar ? 'checked' : ''}></label>
        ${detalhar ? `${lidas.length ? `<div class="fat-import">${ic('info')}<span>${lidas.length === 1 ? 'Encontramos 1 compra escrita' : `Encontramos ${lidas.length} compras escritas`} nas observações.</span><button type="button" class="btn sec peq" data-fat="importar">Transformar em compras</button></div>` : ''}
          ${notaFixas ? `<p class="dica">${ic('repetir')} ${esc(notaFixas)}</p>` : ''}
          <div class="fat-wrap"><table class="fat-tab"><thead><tr><th scope="col">Compra</th><th scope="col">Valor</th><th scope="col">Tipo de gasto</th><th scope="col">Repete</th><th scope="col"><span class="sr">Remover</span></th></tr></thead><tbody>
          ${compras.map((c, i) => `<tr data-i="${i}"><td><input type="text" maxlength="80" data-fc="desc" value="${esc(c.desc)}" placeholder="Ex.: iFood" aria-label="Compra ${i + 1}"></td>
            <td><div class="campo-valor"><span>R$</span><input type="text" inputmode="decimal" data-fc="valor" value="${c.centavos > 0 ? N.valorParaCampo(c.centavos) : ''}" placeholder="0,00" aria-label="Valor da compra ${i + 1}"></div></td>
            <td><select data-fc="tipo" aria-label="Tipo de gasto da compra ${i + 1}">${opcoesTipo(c.tipoGasto)}</select></td>
            <td><label class="fat-fixo" title="Volta sozinha na próxima fatura deste cartão"><input type="checkbox" data-fc="fixa" ${c.fixa ? 'checked' : ''}> todo mês</label></td>
            <td><button type="button" class="btn fantasma icone peq" data-fat="remover" aria-label="Remover compra ${i + 1}" title="Remover">${ic('x')}</button></td></tr>`).join('')}
          </tbody></table></div>
          <div class="fat-rod"><button type="button" class="btn fantasma peq" data-fat="adicionar">${ic('mais')} Adicionar compra</button><span id="fat-total" aria-live="polite"></span></div>` : ''}`;
      atualizarTotais();
      if (focar != null) $(`tr[data-i="${focar}"] [data-fc=desc]`, bloco)?.focus();
    }
    function atualizarTotais() {
      if (!detalhando()) { f('dica-valor').textContent = ''; return; }
      const soma = somaCompras();
      if (!valorManual) f('f-valor').value = soma ? N.valorParaCampo(soma) : '';
      const v = N.lerValor(f('f-valor').value);
      const resto = v > 0 ? v - soma : 0;
      const n = compras.filter((c) => c.desc.trim() || c.centavos > 0).length;
      const tot = $('#fat-total', modal);
      if (tot) tot.innerHTML = `${n} ${n === 1 ? 'compra' : 'compras'} · <b>${moeda(soma)}</b>${resto > 0 ? ` · não detalhado <b>${moeda(resto)}</b>` : ''}`;
      f('dica-valor').innerHTML = resto < 0 ? '<span class="txt-erro">Menor que a soma das compras</span>'
        : resto > 0 ? `Valor da fatura · ${moeda(resto)} não detalhado` : soma ? `${ic('check')} Soma das compras` : '';
    }
    function ligarDetalhe(ligar) {
      detalhar = ligar;
      if (ligar && !compras.length) {
        const d = N.lerIso(f('f-data').value) || { ano: est.ano, mes: est.mes };
        const fixas = N.comprasFixasAnteriores(dados.lancamentos, cartaoSel.ler(), d.ano, d.mes, existente?.id);
        compras = fixas.compras.map((c) => ({ ...c, tipoManual: true }));
        notaFixas = fixas.compras.length ? `${fixas.compras.length} ${fixas.compras.length === 1 ? 'compra fixa trazida' : 'compras fixas trazidas'} da fatura de ${MESES[fixas.de.mes].toLowerCase()}.` : '';
        valorManual = N.lerValor(f('f-valor').value) > 0;
        compras.push({ desc: '', centavos: 0, tipoGasto: null, fixa: false });
      }
      mostrarTipo();
      desenharCompras(ligar ? compras.findIndex((c) => !c.desc) : null);
    }
    f('bloco-compras').addEventListener('change', (e) => {
      if (e.target.id === 'fat-detalhar') return ligarDetalhe(e.target.checked);
      const tr = e.target.closest('tr[data-i]');
      if (!tr) return;
      const c = compras[+tr.dataset.i];
      if (e.target.dataset.fc === 'tipo') { c.tipoGasto = e.target.value || null; c.tipoManual = true; }
      if (e.target.dataset.fc === 'fixa') c.fixa = e.target.checked;
      if (e.target.dataset.fc === 'valor' && c.centavos > 0) e.target.value = N.valorParaCampo(c.centavos);
    });
    f('bloco-compras').addEventListener('input', (e) => {
      const tr = e.target.closest('tr[data-i]');
      if (!tr) return;
      const c = compras[+tr.dataset.i];
      if (e.target.dataset.fc === 'desc') {
        c.desc = e.target.value;
        if (!c.tipoManual) { c.tipoGasto = N.sugerirTipoGasto(c.desc, dados.lancamentos); $('[data-fc=tipo]', tr).value = c.tipoGasto || ''; }
      }
      if (e.target.dataset.fc === 'valor') { const v = N.lerValor(e.target.value); c.centavos = v > 0 ? v : 0; atualizarTotais(); }
    });
    f('bloco-compras').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.closest('tr[data-i]') || e.target.tagName === 'SELECT') return;
      e.preventDefault(); // Enter vai para a próxima compra (ou cria uma)
      const i = +e.target.closest('tr').dataset.i;
      if (i === compras.length - 1) { compras.push({ desc: '', centavos: 0, tipoGasto: null, fixa: false }); desenharCompras(i + 1); }
      else $(`tr[data-i="${i + 1}"] [data-fc=desc]`, modal)?.focus();
    });
    f('bloco-compras').addEventListener('click', (e) => {
      const b = e.target.closest('[data-fat]');
      if (!b) return;
      if (b.dataset.fat === 'adicionar') { compras.push({ desc: '', centavos: 0, tipoGasto: null, fixa: false }); return desenharCompras(compras.length - 1); }
      if (b.dataset.fat === 'remover') { compras.splice(+b.closest('tr').dataset.i, 1); if (!compras.length) compras.push({ desc: '', centavos: 0, tipoGasto: null, fixa: false }); return desenharCompras(); }
      if (b.dataset.fat === 'importar') {
        const { compras: lidas, sobra } = N.lerComprasDoTexto(f('f-obs').value);
        compras = [...compras.filter((c) => c.desc.trim() || c.centavos > 0),
          ...lidas.map((c) => ({ ...c, tipoGasto: N.sugerirTipoGasto(c.desc, dados.lancamentos), tipoManual: false }))];
        f('f-obs').value = sobra; contarObs();
        desenharCompras();
        toast(`${lidas.length} ${lidas.length === 1 ? 'compra trazida' : 'compras trazidas'} das observações. Confira os tipos.`);
      }
    });
    f('f-valor').addEventListener('input', () => { if (detalhando()) { valorManual = !!f('f-valor').value.trim(); atualizarTotais(); } });
    f('f-obs').addEventListener('change', () => { if (detalhando()) desenharCompras(); });

    function mostrarCartao() {
      mostrarTipo();
      const ehCartao = $('input[name=cat]:checked', modal)?.value === 'cartao';
      f('bloco-cartao').hidden = !ehCartao;
      $$('[data-cartao]', modal).forEach((b) => b.classList.toggle('ativo', N.mesmoCartao(b.dataset.cartao, cartaoSel.ler())));
    }
    let provEscolhida = l.provisao || '';
    function opcoesProvisao() {
      const d = N.lerIso(f('f-data').value);
      const categoria = $('input[name=cat]:checked', modal)?.value;
      const tipo = CAT[categoria]?.tipo;
      const cartao = categoria === 'cartao' ? cartaoSel.ler() : '';
      const atual = provEscolhida;
      // Provisões de outro cartão não aparecem para um gasto com cartão definido.
      const doMes = d ? dados.provisoes.filter((p) => p.ano === d.ano && p.mes === d.mes
        && !(p.cartao && cartao && !N.mesmoCartao(p.cartao, cartao))) : [];
      const grupos = new Map(doMes.map((p) => [p.grupo, p]));
      if (atual && !grupos.has(atual) && nomeProvisao(atual)) grupos.set(atual, { nome: `${nomeProvisao(atual)} (outro mês)` });
      f('f-prov').innerHTML = `<option value="">Nenhuma</option>${[...grupos].map(([g, p]) => `<option value="${esc(g)}">${esc(p.nome)}</option>`).join('')}`;
      f('f-prov').value = grupos.has(atual) ? atual : '';
      f('bloco-prov').hidden = tipo === 'entrada' || (!grupos.size);
    }
    f('f-prov').addEventListener('change', () => { provEscolhida = f('f-prov').value; });
    modal.addEventListener('change', (e) => {
      if (e.target.name === 'cat' || e.target.id === 'f-data') { mostrarCartao(); opcoesProvisao(); }
      if (e.target.name === 'cat' || e.target.name === 'rec') { desenharCompras(); mostrarTipo(); }
    });
    mostrarCartao();
    opcoesProvisao();
    function contarObs() {
      const n = f('f-obs').value.length;
      f('c-obs').textContent = n > N.MAX_OBS * 0.8 ? `${n}/${N.MAX_OBS}` : '';
    }
    f('f-obs').addEventListener('input', contarObs);
    contarObs();
    desenharCompras();
    mostrarTipo();

    if (existente) {
      f('titulo-modal').textContent = 'Editar lançamento';
      f('f-recorrencia').hidden = true;
      if (existente.grupo) {
        const r = f('resumo-serie');
        r.hidden = false;
        r.innerHTML = `${ic(existente.parcela ? 'parcela' : 'repetir')} ${existente.parcela
          ? `Parcela ${existente.parcela.n} de ${existente.parcela.total}.` : 'Lançamento recorrente.'} Ao salvar, você escolhe se a alteração vale só para este mês ou para a série.`;
      }
    }

    function atualizarSerie() {
      if (existente) return;
      const rec = val('rec');
      f('bloco-qtd').hidden = rec === 'unica';
      f('bloco-modo').hidden = rec !== 'parcelada';
      f('rotulo-qtd').textContent = rec === 'parcelada' ? 'Número de parcelas' : 'Repetir por quantos meses?';
      if (rec === 'parcelada' && !f('f-qtd').dataset.mexido) f('f-qtd').value = f('f-qtd').value === '12' ? 2 : f('f-qtd').value;
      if (rec === 'mensal' && !f('f-qtd').dataset.mexido) f('f-qtd').value = 12;
      f('rotulo-valor').textContent = rec === 'mensal' ? 'Valor por mês' : rec === 'parcelada' ? (val('modo') === 'total' ? 'Valor total' : 'Valor da parcela') : 'Valor';

      const r = f('resumo-serie');
      const centavos = N.lerValor(f('f-valor').value);
      const d = N.lerIso(f('f-data').value);
      const n = Math.floor(+f('f-qtd').value);
      if (rec === 'unica' || !(centavos > 0) || !d || !(n >= 2 && n <= 120)) { r.hidden = true; return; }
      const fim = N.somarMeses(d.ano, d.mes, n - 1);
      const periodo = `${MESES_CURTOS[d.mes].toLowerCase()}/${d.ano} a ${MESES_CURTOS[fim.mes].toLowerCase()}/${fim.ano}`;
      let txt;
      if (rec === 'mensal') txt = `${n}× de <b>${moeda(centavos)}</b> · ${periodo} · total ${moeda(centavos * n)}`;
      else if (val('modo') === 'parcela') txt = `${n} parcelas de <b>${moeda(centavos)}</b> · ${periodo} · total ${moeda(centavos * n)}`;
      else {
        const p = N.dividir(centavos, n);
        txt = `${n} parcelas de <b>${moeda(p[0])}</b>${p[n - 1] !== p[0] ? ` (última ${moeda(p[n - 1])})` : ''} · ${periodo} · total ${moeda(centavos)}`;
      }
      r.hidden = false;
      r.innerHTML = `${ic('repetir')} ${txt}`;
    }
    f('f-qtd').addEventListener('input', (e) => { e.target.dataset.mexido = '1'; atualizarSerie(); });
    modal.addEventListener('change', atualizarSerie);
    f('f-valor').addEventListener('input', atualizarSerie);
    f('f-data').addEventListener('input', atualizarSerie);
    atualizarSerie();
    f('f-desc').focus();

    function erro(campo, msg) {
      f('e-' + campo).textContent = msg;
      f('f-' + campo).setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    modal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const desc = f('f-desc').value.trim();
      const obs = f('f-obs').value.trim();
      const provisao = f('bloco-prov').hidden ? null : (f('f-prov').value || null);
      const cartao = f('bloco-cartao').hidden ? '' : cartaoSel.ler();
      const tipoGasto = f('bloco-tipo').hidden ? null : ($('input[name=tg]:checked', modal)?.value || null);
      if (!f('bloco-cartao').hidden && f('f-cartao').value === OUTRO && !cartao) {
        f('f-cartao-outro').focus();
        return toast('Digite o nome do banco ou escolha um da lista.', { erro: true });
      }
      const centavos = N.lerValor(f('f-valor').value);
      const data = N.lerIso(f('f-data').value);
      // Compras da fatura: linhas vazias são ignoradas; linhas pela metade precisam ser completadas.
      let comprasFinal = [];
      if (detalhando()) {
        const linhas = compras.filter((c) => c.desc.trim() || c.centavos > 0);
        const ruim = linhas.findIndex((c) => !c.desc.trim() || !(c.centavos > 0));
        if (ruim >= 0) {
          $(`tr[data-i="${compras.indexOf(linhas[ruim])}"] [data-fc=${linhas[ruim].desc.trim() ? 'valor' : 'desc'}]`, modal)?.focus();
          return toast(`Complete a compra ${ruim + 1} (descrição e valor) ou remova.`, { erro: true });
        }
        comprasFinal = linhas.map((c) => ({ id: c.id, desc: c.desc.trim(), centavos: c.centavos, tipoGasto: c.tipoGasto || null, fixa: !!c.fixa }));
        if (comprasFinal.length && centavos > 0 && centavos < comprasFinal.reduce((a, c) => a + c.centavos, 0)) {
          return erro('valor', 'O valor da fatura não pode ser menor que a soma das compras.') || f('f-valor').focus();
        }
      }
      const okDesc = erro('desc', desc ? '' : 'Informe uma descrição.');
      const okValor = erro('valor', centavos > 0 ? '' : 'Informe um valor maior que zero, como 1.250,90.');
      const okData = erro('data', data ? '' : 'Escolha a data de vencimento.');
      if (!okDesc || !okValor || !okData) { modal.querySelector('[aria-invalid=true]')?.focus(); return; }
      const categoria = val('cat');
      prefs.categoria = categoria;
      if (cartao) prefs.cartao = cartao;
      salvarPrefs();

      if (existente) {
        const escopo = await escolherEscopo(existente, 'Editar');
        if (!escopo) return;
        dados.lancamentos = N.editar(dados.lancamentos, existente.id, { desc, obs: f('f-obs').value.trim(), provisao, cartao, tipoGasto, centavos, categoria, compras: comprasFinal, ...data }, escopo);
        fechar(); salvar();
        toast('Lançamento atualizado.');
        return;
      }

      const rec = val('rec');
      const qtd = Math.floor(+f('f-qtd').value);
      if (rec !== 'unica' && !(qtd >= 2 && qtd <= 120)) { f('f-qtd').focus(); return toast('A quantidade deve ficar entre 2 e 120.', { erro: true }); }
      const novos = N.gerar({ desc, obs: f('f-obs').value.trim(), provisao, cartao, tipoGasto, centavos, categoria, compras: comprasFinal, ...data, recorrencia: rec, quantidade: qtd, modoValor: val('modo') });
      dados.lancamentos.push(...novos);
      fechar(); salvar();
      const msg = novos.length > 1 ? `${novos.length} lançamentos criados.` : 'Lançamento criado.';
      if (data.ano !== est.ano || data.mes !== est.mes) {
        toast(`${msg} Primeiro vencimento em ${MESES[data.mes].toLowerCase()}/${data.ano}.`, {
          rotulo: 'Ver', acao: () => irPara(data.ano, data.mes),
        });
      } else toast(msg);
    });
  }

  // ---------- ações da lista ----------
  async function excluir(id) {
    const l = dados.lancamentos.find((x) => x.id === id);
    if (!l) return;
    const escopo = await escolherEscopo(l, 'Excluir');
    if (!escopo) return;
    const antes = dados.lancamentos;
    const r = N.excluir(antes, id, escopo);
    dados.lancamentos = r.lista;
    salvar();
    toast(r.removidos.length > 1 ? `${r.removidos.length} lançamentos excluídos.` : 'Lançamento excluído.', {
      acao: () => { dados.lancamentos = antes; salvar(); },
    });
  }

  function alternarPago(id) {
    const l = dados.lancamentos.find((x) => x.id === id);
    if (!l) return;
    l.pago = !l.pago;
    salvar();
  }

  // ---------- navegação ----------
  function irPara(ano, mes) {
    est.ano = ano; est.mes = mes;
    if (est.filtro === 'atrasados') est.filtro = 'todos';
    if (est.secao !== 'mes') location.hash = '#mes'; else render();
  }
  function mover(delta) {
    if (anual()) { est.ano += delta; return render(); }
    // Troca o mês sem sair da tela atual (Mês ou Dashboard).
    const r = N.somarMeses(est.ano, est.mes, delta);
    est.ano = r.ano; est.mes = r.mes;
    if (est.filtro === 'atrasados') est.filtro = 'todos';
    render();
  }
  function lerHash() {
    if (modoEmpresa) return;
    const [s, sub] = location.hash.replace('#', '').split('/');
    est.secao = ['mes', 'dashboard', 'ano', 'planos', 'sim', 'ajustes'].includes(s) || (['usuarios', 'empresas'].includes(s) && eu?.perfil === 'admin') ? s : 'mes';
    est.plano = s === 'planos' && sub ? decodeURIComponent(sub) : null;
    render();
    window.scrollTo({ top: 0 });
  }

  // ---------- render ----------
  function render() {
    if (modoEmpresa) return;
    $$('main > section').forEach((s) => { s.hidden = s.dataset.secao !== est.secao; });
    $$('#menu a').forEach((a) => a.classList.toggle('ativo', a.dataset.secao === est.secao));
    $$('#menu a').forEach((a) => { if (a.dataset.secao === est.secao) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    renderTopo();
    if (est.secao === 'mes') renderMes();
    if (est.secao === 'ano') renderAno();
    if (est.secao === 'dashboard') renderDashboard();
    if (est.secao === 'ajustes') renderAjustes();
    if (est.secao === 'usuarios') renderUsuarios();
    if (est.secao === 'planos') renderPlanos();
    if (est.secao === 'sim') renderSimulador();
    if (est.secao === 'empresas') renderEmpresas();
  }

  function atrasados() {
    const hoje = new Date();
    return dados.lancamentos.filter((l) => N.situacao(l, hoje).cod === 'atrasado');
  }

  function renderTopo() {
    const nome = (eu?.nome || '').trim();
    const h = new Date().getHours();
    $('#saudacao').textContent = `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nome ? ', ' + nome.split(' ')[0] : ''}`;
    $('#hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#nome-usuario').textContent = nome || 'Você';
    $('#av-usuario').textContent = (nome || 'V').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const ano = anual();
    const comPeriodo = ['mes', 'dashboard', 'ano', 'sim'].includes(est.secao);
    $('.topo .mes').hidden = !comPeriodo;
    $('#btn-hoje').hidden = !comPeriodo;
    $('.topo').classList.toggle('sem-periodo', !comPeriodo);
    $('#rotulo-periodo').textContent = ano ? 'Ano de referência' : est.secao === 'sim' ? 'Base da simulação' : 'Mês de referência';
    $('#nome-mes').textContent = ano ? est.ano : `${MESES[est.mes]} ${est.ano}`;
    $('#competencia').value = `${est.ano}-${String(est.mes + 1).padStart(2, '0')}`;
    $('#mes-ant').setAttribute('aria-label', ano ? 'Ano anterior' : 'Mês anterior');
    $('#mes-prox').setAttribute('aria-label', ano ? 'Próximo ano' : 'Próximo mês');
    const n = atrasados().length;
    const c = $('#cont-atrasados');
    c.hidden = !n; c.textContent = n; c.title = `${n} atrasado(s)`;
  }

  function kpi({ classe = '', icone, rotulo, valor, det = '', barra = null }) {
    return `<div class="kpi ${classe}">
      <div class="topo-kpi"><span class="rot">${esc(rotulo)}</span><span class="bolha ${classe.includes('destaque') ? '' : classe}">${ic(icone)}</span></div>
      <div class="val">${valor}</div>
      ${det ? `<div class="det">${det}</div>` : ''}
      ${barra != null ? `<div class="barra" role="progressbar" aria-valuenow="${barra}" aria-valuemin="0" aria-valuemax="100" aria-label="Percentual pago"><span style="width:${barra}%"></span></div>` : ''}
    </div>`;
  }

  function renderMes() {
    const r = N.resumoMes(dados.lancamentos, est.ano, est.mes);
    const reservado = N.reservadoProvisoes(dados.lancamentos, dados.provisoes, est.ano, est.mes);
    $('#cards-mes').innerHTML = [
      kpi({ classe: 'destaque' + (r.saldoPrevisto < 0 ? ' negativo' : ''), icone: 'carteira', rotulo: 'Saldo previsto do mês', valor: moeda(r.saldoPrevisto),
        det: `Realizado até agora: <b>${moeda(r.saldoRealizado)}</b>${reservado ? `<br>Após provisões: <b>${moeda(r.saldoPrevisto - reservado)}</b>` : ''}` }),
      kpi({ classe: 'vermelho', icone: 'relogio', rotulo: 'Falta pagar', valor: moeda(r.faltaPagar),
        det: r.saidas ? `${moeda(r.pago)} pagos de ${moeda(r.saidas)} · ${r.pctPago}%` : 'Nenhuma despesa no mês', barra: r.saidas ? r.pctPago : null }),
      kpi({ classe: 'verde', icone: 'sobe', rotulo: 'Receitas', valor: moeda(r.entradas),
        det: r.faltaReceber ? `Falta receber ${moeda(r.faltaReceber)}` : r.entradas ? 'Tudo recebido' : 'Nenhuma receita no mês' }),
      kpi({ classe: 'indigo', icone: 'cofre', rotulo: 'Investido e poupado', valor: moeda(r.reservas),
        det: r.reservas ? `Aplicado ${moeda(r.aplicado)}` : 'Nada reservado no mês' }),
    ].join('');

    // avisos
    const atr = atrasados();
    const avisos = [];
    if (atr.length && est.filtro !== 'atrasados') {
      const soma = atr.reduce((a, l) => a + l.centavos, 0);
      avisos.push(`<div class="aviso-box alerta">${ic('alerta')}<div><b>${atr.length} ${atr.length > 1 ? 'lançamentos atrasados' : 'lançamento atrasado'}</b> somando ${moeda(soma)}.</div>
        <button type="button" class="btn perigo peq" data-filtro="atrasados">Ver atrasados</button></div>`);
    }
    $('#aviso-atrasados').innerHTML = avisos.join('');
    renderProvisoes();

    // filtros
    const doMes = dados.lancamentos.filter((l) => l.ano === est.ano && l.mes === est.mes);
    const tipo = (l) => CAT[l.categoria].tipo;
    const FILTROS = [
      ['todos', 'Todos', () => true],
      ['pendentes', 'Em aberto', (l) => !l.pago],
      ['feitos', 'Concluídos', (l) => l.pago],
      ['entrada', 'Receitas', (l) => tipo(l) === 'entrada'],
      ['saida', 'Despesas', (l) => tipo(l) === 'saida'],
      ['reserva', 'Investimentos', (l) => tipo(l) === 'reserva'],
    ];
    const filtroAtual = FILTROS.find((x) => x[0] === est.filtro);
    $('#filtros').innerHTML = FILTROS.map(([id, nome, fn]) =>
      `<button type="button" data-filtro="${id}" class="${est.filtro === id ? 'ativo' : ''}" aria-pressed="${est.filtro === id}">${nome}<b>${doMes.filter(fn).length}</b></button>`).join('')
      + (atr.length ? `<button type="button" data-filtro="atrasados" class="alerta ${est.filtro === 'atrasados' ? 'ativo' : ''}" aria-pressed="${est.filtro === 'atrasados'}">Atrasados (todos os meses)<b>${atr.length}</b></button>` : '')
      + (est.filtroProvisao && est.filtro !== 'atrasados' && nomeProvisao(est.filtroProvisao) ? `<button type="button" class="ativo filtro-prov" data-prov-limpar title="Parar de filtrar pela provisão">${ic('alvo')} Provisão: ${esc(nomeProvisao(est.filtroProvisao))} ✕</button>` : '');

    let itens = est.filtro === 'atrasados' ? atr : doMes.filter(filtroAtual ? filtroAtual[2] : () => true);
    const consumoFiltro = est.filtroProvisao && est.filtro !== 'atrasados'
      ? N.consumoProvisoes(dados.lancamentos, dados.provisoes, est.ano, est.mes).find((c) => c.provisao.grupo === est.filtroProvisao) : null;
    if (est.filtroProvisao && !consumoFiltro) est.filtroProvisao = null;
    if (consumoFiltro) { const ids = new Set(consumoFiltro.itens.map((l) => l.id)); itens = itens.filter((l) => ids.has(l.id)); }
    // Cartões do mês, com o total de cada um (a "fatura" do mês).
    const cartoesMes = new Map();
    for (const l of doMes) {
      if (l.categoria !== 'cartao') continue;
      const nome = l.cartao || 'Sem cartão definido';
      const k = N.normalizar(nome);
      const c = cartoesMes.get(k) || { nome, total: 0 };
      c.total += l.centavos; cartoesMes.set(k, c);
    }
    if (est.filtroCartao && !cartoesMes.has(est.filtroCartao)) est.filtroCartao = null;
    $('#filtros-cartao').innerHTML = cartoesMes.size && est.filtro !== 'atrasados' ? `<span class="rot-cartoes">${ic('cartao')} Cartões</span>${[...cartoesMes].sort((a, b) => b[1].total - a[1].total).map(([k, c]) =>
      `<button type="button" data-filtro-cartao="${esc(k)}" class="${est.filtroCartao === k ? 'ativo' : ''}" aria-pressed="${est.filtroCartao === k}">${esc(c.nome)} <b>${moeda(c.total)}</b></button>`).join('')}` : '';
    if (est.filtroCartao && est.filtro !== 'atrasados') itens = itens.filter((l) => l.categoria === 'cartao' && N.normalizar(l.cartao || 'Sem cartão definido') === est.filtroCartao);
    const q = N.normalizar(est.busca.trim());
    if (q) itens = itens.filter((l) => N.normalizar(`${l.desc} ${l.obs || ''} ${CAT[l.categoria].nome} ${l.cartao || ''} ${nomeProvisao(l.provisao) || ''} ${N.TIPO[l.tipoGasto]?.nome || ''} ${(l.compras || []).map((c) => `${c.desc} ${N.TIPO[c.tipoGasto]?.nome || ''}`).join(' ')}`).includes(q));
    // Na busca, faturas que casam por uma compra já aparecem abertas.
    if (q) for (const l of itens) if ((l.compras || []).some((c) => N.normalizar(c.desc).includes(q))) est.comprasAbertas.add(l.id);
    const ord = {
      venc: (a, b) => N.dataDe(a) - N.dataDe(b) || a.pago - b.pago || b.centavos - a.centavos,
      maior: (a, b) => b.centavos - a.centavos,
      menor: (a, b) => a.centavos - b.centavos,
      recentes: (a, b) => b.criadoEm - a.criadoEm,
    }[est.ordem];
    itens.sort(ord);

    $('#titulo-lista').textContent = est.filtro === 'atrasados' ? 'Atrasados' : `Lançamentos de ${MESES[est.mes].toLowerCase()}`;

    const lista = $('#lista');
    if (!doMes.length && est.filtro !== 'atrasados' && !q) {
      lista.innerHTML = `<div class="vazio">${ILUSTRA}<h3>Nenhum lançamento em ${esc(MESES[est.mes].toLowerCase())}</h3>
        <p>Comece pelas receitas e contas fixas. Use “Todo mês” para o que se repete e “Parcelado” para compras divididas.</p>
        <div class="linha"><button type="button" class="btn" data-novo>${ic('mais')} Novo lançamento</button></div></div>`;
      $('#rodape-lista').innerHTML = '';
      return;
    }
    if (!itens.length) {
      lista.innerHTML = `<div class="vazio"><h3>Nada encontrado</h3><p>Nenhum lançamento com esse filtro${q ? ' e busca' : ''}.</p>
        <div class="linha"><button type="button" class="btn sec" data-limpar-filtro>Limpar filtros</button></div></div>`;
      $('#rodape-lista').innerHTML = '';
      return;
    }

    const hoje = new Date();
    lista.innerHTML = itens.map((l) => {
      const c = CAT[l.categoria];
      const s = N.situacao(l, hoje);
      const d = N.dataDe(l);
      const situ = {
        pago: `<span class="tag ok">${ic('check')} ${c.feito}</span>`,
        atrasado: `<span class="tag erro">${ic('alerta')} Atrasado há ${-s.dias} ${s.dias === -1 ? 'dia' : 'dias'}</span>`,
        hoje: `<span class="tag aviso">${ic('relogio')} Vence hoje</span>`,
        breve: `<span class="tag aviso">${ic('relogio')} Vence em ${s.dias} ${s.dias === 1 ? 'dia' : 'dias'}</span>`,
        pendente: '',
      }[s.cod];
      const serie = l.parcela ? `<span class="tag info">${ic('parcela')} ${l.parcela.n}/${l.parcela.total}</span>`
        : l.grupo ? `<span class="tag info" title="Recorrente">${ic('repetir')} Mensal</span>` : '';
      const outroMes = est.filtro === 'atrasados' || l.ano !== est.ano || l.mes !== est.mes;
      return `<div class="item ${s.cod} ${l.pago ? 'feito' : ''}" data-tipo="${c.tipo}">
        <button type="button" class="marcar" data-acao="marcar" data-id="${esc(l.id)}" aria-pressed="${l.pago}"
          aria-label="${l.pago ? 'Desmarcar' : 'Marcar como ' + c.feito.toLowerCase()}: ${esc(l.desc)}" title="${l.pago ? 'Desmarcar' : 'Marcar como ' + c.feito.toLowerCase()}">${ic('check')}</button>
        <div class="data" aria-hidden="true"><b>${d.getDate()}</b><small>${MESES_CURTOS[d.getMonth()]}${outroMes ? ' ' + String(d.getFullYear()).slice(2) : ''}</small></div>
        <div class="desc"><b title="${esc(N.titulo(l))}">${esc(l.desc)}</b>
          <div class="tags"><span class="tag quando neutra">${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span><span class="tag cat" data-cat="${l.categoria}">${esc(nomeCategoria(l.categoria, l.cartao))}</span>${l.tipoGasto && N.TIPO[l.tipoGasto] ? `<span class="tag neutra">${esc(nomeTipo(l.tipoGasto))}</span>` : ''}${l.compras?.length ? `<button type="button" class="tag info tag-compras" data-acao="compras" data-id="${esc(l.id)}" aria-expanded="${est.comprasAbertas.has(l.id)}">🧾 ${l.compras.length} ${l.compras.length === 1 ? 'compra' : 'compras'} ${ic(est.comprasAbertas.has(l.id) ? 'desce2' : 'dir')}</button>` : ''}${serie}${l.provisao && nomeProvisao(l.provisao) ? `<span class="tag prov-tag" title="Provisão">${ic('alvo')} ${esc(nomeProvisao(l.provisao))}</span>` : ''}${situ}</div>${l.obs ? `<div class="obs"><button type="button" data-acao="obs" aria-expanded="false" title="${esc(l.obs)}">${ic('nota')}<span>${esc(l.obs)}</span></button></div>` : ''}</div>
        <div class="valor">${c.tipo === 'entrada' ? '+ ' : ''}${moeda(l.centavos)}</div>
        <div class="acoes">
          <button type="button" class="btn fantasma icone peq" data-acao="editar" data-id="${esc(l.id)}" aria-label="Editar ${esc(l.desc)}" title="Editar">${ic('editar')}</button>
          <button type="button" class="btn fantasma icone peq apagar" data-acao="excluir" data-id="${esc(l.id)}" aria-label="Excluir ${esc(l.desc)}" title="Excluir">${ic('lixo')}</button>
        </div>
      </div>${l.compras?.length && est.comprasAbertas.has(l.id) ? htmlComprasFatura(l) : ''}`;
    }).join('');

    const ent = itens.filter((l) => tipo(l) === 'entrada').reduce((a, l) => a + l.centavos, 0);
    const sai = itens.filter((l) => tipo(l) !== 'entrada').reduce((a, l) => a + l.centavos, 0);
    $('#rodape-lista').innerHTML = `<span>${itens.length} ${itens.length === 1 ? 'lançamento' : 'lançamentos'}</span>
      <span>Entradas <b>${moeda(ent)}</b> · Saídas <b>${moeda(sai)}</b></span>`;
  }

  function renderAno() {
    const a = N.resumoAno(dados.lancamentos, est.ano);
    const soma = (tipo) => a.cats.filter((c) => c.tipo === tipo).reduce((s, c) => s + c.total, 0);
    const ent = soma('entrada'), sai = soma('saida'), res = soma('reserva');
    const melhor = a.saldo.some((v) => v) ? a.saldo.indexOf(Math.max(...a.saldo)) : -1;
    $('#cards-ano').innerHTML = [
      kpi({ classe: 'destaque' + (a.total < 0 ? ' negativo' : ''), icone: 'carteira', rotulo: `Saldo de ${est.ano}`, valor: moeda(a.total),
        det: melhor >= 0 ? `Melhor mês: <b>${MESES[melhor]}</b> (${moeda(a.saldo[melhor])})` : 'Sem lançamentos no ano' }),
      kpi({ classe: 'verde', icone: 'sobe', rotulo: 'Receitas no ano', valor: moeda(ent), det: `Média de ${moeda(Math.round(ent / 12))} por mês` }),
      kpi({ classe: 'vermelho', icone: 'desce', rotulo: 'Despesas no ano', valor: moeda(sai), det: ent ? `${Math.round((sai / ent) * 100)}% das receitas` : '' }),
      kpi({ classe: 'indigo', icone: 'cofre', rotulo: 'Investido e poupado', valor: moeda(res), det: ent ? `${Math.round((res / ent) * 100)}% das receitas` : '' }),
    ].join('');

    const max = Math.max(1, ...a.entradas, ...a.saidas);
    const hoje = new Date();
    $('#grafico').innerHTML = MESES_CURTOS.map((m, i) => {
      const atual = est.ano === hoje.getFullYear() && i === hoje.getMonth();
      return `<button type="button" class="col-graf ${atual ? 'atual' : ''} ${a.saldo[i] < 0 ? 'negativo' : ''}" data-mes="${i}"
        aria-label="${MESES[i]}: receitas ${moeda(a.entradas[i])}, saídas ${moeda(a.saidas[i])}" title="${MESES[i]}: saldo ${moeda(a.saldo[i])}">
        <span class="barras"><span class="rec" style="height:${(a.entradas[i] / max) * 100}%"></span><span class="desp" style="height:${(a.saidas[i] / max) * 100}%"></span></span>
        <small>${m}</small></button>`;
    }).join('');

    const cel = (v, extra = '') => `<td class="${v ? '' : 'zero'} ${extra}">${v ? moedaCurta(v) : '–'}</td>`;
    const celSaldo = (v, extra = '') => `<td class="${v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero'} ${extra}">${v ? moedaCurta(v) : '–'}</td>`;
    let html = `<thead><tr><th scope="col">Categoria</th>${MESES_CURTOS.map((m, i) =>
      `<th scope="col" class="${est.ano === hoje.getFullYear() && i === hoje.getMonth() ? 'atual' : ''}"><button type="button" data-mes="${i}" title="Abrir ${MESES[i]}">${m}</button></th>`).join('')}<th scope="col">Total</th></tr></thead><tbody>`;
    for (const c of a.cats) {
      const aberta = est.abertas.has(c.id);
      html += `<tr class="cat" data-cat="${c.id}"><td><button type="button" data-abrir="${c.id}" aria-expanded="${aberta}" ${c.detalhes.length ? '' : 'disabled'}>${ic('dir')}<i></i>${esc(c.nome)}</button></td>
        ${c.meses.map((v) => cel(v)).join('')}${cel(c.total, 'total')}</tr>`;
      if (aberta) {
        for (const d of c.detalhes) {
          html += `<tr class="det"><td title="${esc(d.desc)}">${esc(d.desc)}</td>${d.meses.map((v) => cel(v)).join('')}${cel(d.total, 'total')}</tr>`;
        }
      }
    }
    html += `<tr class="saldo"><td>Saldo do mês</td>${a.saldo.map((v) => celSaldo(v)).join('')}${celSaldo(a.total, 'total')}</tr>`;
    html += `<tr class="acum"><td>Saldo acumulado</td>${a.acumulado.map((v) => celSaldo(v)).join('')}<td class="total"></td></tr></tbody>`;
    $('#tabela-ano').innerHTML = html;
  }

  // ---------- backup ----------
  function baixar(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportar() {
    const d = new Date();
    const carimbo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    baixar(`vertice-backup-${carimbo}.json`, JSON.stringify({ versao: N.VERSAO_DADOS, lancamentos: dados.lancamentos, exportadoEm: d.toISOString() }, null, 2), 'application/json');
    toast('Cópia dos dados baixada.');
  }
  async function importar(arquivo) {
    let lido;
    try { lido = N.lerBackup(JSON.parse(await arquivo.text())); }
    catch (e) { return toast(e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : e.message, { erro: true }); }
    if (!lido.lancamentos.length) return toast('Nenhum lançamento válido no arquivo.', { erro: true });
    const temDados = dados.lancamentos.length > 0;
    const escolha = await new Promise((ok) => {
      const { fundo, fechar } = abrirModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-imp">
          <div class="cab-modal"><h2 id="t-imp">Restaurar backup</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <p style="margin-top:0">O arquivo tem <b>${lido.lancamentos.length} lançamentos</b>${lido.origem === 'antigo' ? ' no formato do Vértice antigo (o vencimento fica no dia 10)' : ''}.
          ${temDados ? `Você já tem ${dados.lancamentos.length} lançamentos aqui.` : ''}</p>
          <div class="opcoes-escopo">
            ${temDados ? `<button type="button" class="btn sec" data-imp="mesclar"><span>Juntar com os atuais<small>Lançamentos com o mesmo identificador são substituídos pelos do arquivo</small></span></button>` : ''}
            <button type="button" class="btn ${temDados ? 'sec' : ''}" data-imp="substituir"><span>${temDados ? 'Substituir tudo<small>Apaga os lançamentos atuais e usa só os do arquivo</small>' : 'Restaurar'}</span></button>
          </div>
        </div>`, { estreito: true });
      fundo.addEventListener('cancelado', () => ok(null));
      $$('[data-imp]', fundo).forEach((b) => b.addEventListener('click', () => { fechar(); ok(b.dataset.imp); }));
    });
    if (!escolha) return;
    const antes = dados.lancamentos;
    if (escolha === 'substituir') dados.lancamentos = lido.lancamentos;
    else {
      const ids = new Set(lido.lancamentos.map((l) => l.id));
      dados.lancamentos = [...antes.filter((l) => !ids.has(l.id)), ...lido.lancamentos];
    }
    salvar();
    toast(`${lido.lancamentos.length} lançamentos restaurados.`, { acao: () => { dados.lancamentos = antes; salvar(); } });
  }

  function renderAjustes() {
    $('#perfil-nome').value = eu.nome || '';
    $('#perfil-login').textContent = eu.login;
    const n = dados.lancamentos.length;
    $('#info-backup').textContent = `${n} ${n === 1 ? 'lançamento salvo' : 'lançamentos salvos'} na sua conta. Baixe uma cópia quando quiser guardar ou levar para uma planilha.`;
  }

  function htmlComprasFatura(l) {
    const resto = l.centavos - N.somaCompras(l);
    return `<div class="itens-fat" aria-label="Compras da fatura ${esc(l.desc)}">${l.compras.map((c) => `<div><span>${esc(c.desc)}${c.fixa ? ' <small class="suave">· todo mês</small>' : ''}</span>
      <span class="tg">${c.tipoGasto ? esc(nomeTipo(c.tipoGasto)) : 'Sem tipo'}</span><span class="n">${moeda(c.centavos)}</span></div>`).join('')}
      ${resto > 0 ? `<div class="resto"><span>Não detalhado</span><span class="tg"></span><span class="n">${moeda(resto)}</span></div>` : ''}</div>`;
  }

  // ---------- onde estou gastando ----------
  const nomeTipo = (id) => (N.TIPO[id] ? `${N.TIPO[id].emoji} ${N.TIPO[id].nome}` : '');
  function htmlGastos(mes, filtroCats) {
    const g = N.gastos(dados.lancamentos, est.ano, mes, { categorias: filtroCats });
    if (!g.qtd) return `<div class="cartao"><div class="vazio">${ILUSTRA}<h3>Nenhuma despesa neste período</h3><p>Lance despesas ou gastos no cartão e escolha o tipo de gasto (Alimentação, Mercado, Transporte…) para ver aqui onde o dinheiro está indo.</p></div></div>`;
    const mesNome = (a, m) => `${MESES[m].toLowerCase()}/${a}`;
    const tiles = [
      `<div class="kpi dash-kpi"><span class="rot">Maior tipo de gasto</span><div class="val">${g.maior ? esc(nomeTipo(g.maior.id)) : '–'}</div>
        <div class="det">${g.maior ? `${moeda(g.maior.total)} · ${g.maior.pct}% das despesas` : 'Classifique os lançamentos para ver'}</div></div>`,
      `<div class="kpi ${g.semTipo.qtd ? 'vermelho' : 'verde'} dash-kpi"><span class="rot">Gastos sem tipo</span><div class="val">${g.semTipo.qtd}</div>
        <div class="det">${g.semTipo.qtd ? `${moeda(g.semTipo.total)}${g.semTipo.ids.length ? ` · <button type="button" class="link-acao" data-classificar>classificar agora</button>` : ''}${g.semTipo.qtd > g.semTipo.ids.length ? ` · ${g.semTipo.qtd - g.semTipo.ids.length} dentro de faturas de cartão (edite a fatura)` : ''}` : 'Tudo classificado'}</div></div>`,
      `<div class="kpi indigo dash-kpi"><span class="rot">Parcelas já comprometidas</span><div class="val">${moeda(g.parcelas.proximoMes)}</div>
        <div class="det">${g.parcelas.ate ? `no próximo mês · última parcela em ${mesNome(g.parcelas.ate.ano, g.parcelas.ate.mes)}` : 'Nenhuma parcela futura'}</div></div>`,
    ];
    const max = Math.max(1, ...g.tipos.map((t) => t.total));
    const barras = g.tipos.length ? g.tipos.map((t) => {
      const aberto = est.gastosAbertos.has(t.id);
      const sub = aberto ? `<div class="sub-tipo">${t.descricoes.slice(0, 8).map((d) => `<div><b>${esc(d.desc)}${d.faturas?.length ? ` <small class="suave">· compra da fatura ${esc(d.faturas.join(', '))}</small>` : ''}</b><span>${d.qtd}×</span><span>${moeda(d.total)}</span></div>`).join('')}
        ${t.descricoes.length > 8 ? `<div><b>+ ${t.descricoes.length - 8} outras descrições</b><span></span><span>${moeda(t.descricoes.slice(8).reduce((a, d) => a + d.total, 0))}</span></div>` : ''}</div>` : '';
      return `<div class="barra-tipo ${aberto ? 'aberta' : ''}">
        <button type="button" class="nome" data-gtipo="${t.id}" aria-expanded="${aberto}">${ic(aberto ? 'desce2' : 'dir')}<span class="emoji">${t.emoji}</span> <b>${esc(t.nome)}</b></button>
        <span class="trilho"><span data-tip="${esc(`${t.nome}|${moeda(t.total)}|${t.qtd} ${t.qtd === 1 ? 'lançamento' : 'lançamentos'} · ${t.pct}% das despesas`)}" tabindex="0" style="width:${Math.max(1.5, (t.total / max) * 100)}%"></span></span>
        <span class="v">${moeda(t.total)}</span><span class="p">${t.pct}%</span></div>${sub}`;
    }).join('') : '<p class="suave">Nenhuma despesa com tipo de gasto ainda. Escolha o tipo ao lançar, ou use “classificar agora”.</p>';

    const alertas = g.alertas.map((a) => {
      if (a.cod === 'subiu') return `<li class="at">${ic('sobe')}<span><b>${esc(a.tipo.nome)} subiu ${a.pct}%</b> em relação ao período anterior (${moeda(a.de)} → ${moeda(a.para)}).</span></li>`;
      if (a.cod === 'assinaturas') return `<li>${ic('relogio')}<span><b>${a.qtd} ${a.qtd === 1 ? 'assinatura' : 'assinaturas'}</b> ${a.qtd === 1 ? 'soma' : 'somam'} ${moeda(a.total)}: ${esc(a.nomes.slice(0, 5).join(', '))}.</span></li>`;
      return `<li class="at">${ic('cartao')}<span><b>Parcelas</b> já comprometem ${moeda(a.total)} no próximo mês${a.ate ? `, até ${mesNome(a.ate.ano, a.ate.mes)}` : ''}.</span></li>`;
    }).join('') || '<li>' + ic('check') + '<span>Nada fora do comum neste período.</span></li>';

    const ev = g.evolucao;
    const evolucao = ev ? (() => {
      const mx = Math.max(1, ...ev.meses.flatMap((m) => [m.alvo, m.media]));
      return `<div class="grafico-ovr seis">${ev.meses.map((m) => `<div class="col-ovr"><div class="barras">
          <span class="o" style="height:${(m.media / mx) * 100}%" data-tip="${esc(`Média dos demais tipos|${moeda(m.media)}|${MESES[m.mes]} de ${m.ano}`)}" tabindex="0"></span>
          <span class="r" style="height:${(m.alvo / mx) * 100}%" data-tip="${esc(`${ev.tipo.nome}|${moeda(m.alvo)}|${MESES[m.mes]} de ${m.ano}`)}" tabindex="0"></span></div><small>${MESES_CURTOS[m.mes].toLowerCase()}</small></div>`).join('')}</div>
        <div class="legenda-ovr"><span><i style="background:var(--primaria)"></i>${esc(ev.tipo.nome)}</span><span><i style="background:#c3cfdc"></i>Média dos demais tipos</span></div>`;
    })() : '<p class="suave">A evolução mensal aparece no período Mês.</p>';

    const somaCartao = (id) => g.cartoes.reduce((a, c) => a + (c.porTipo[id] || 0), 0);
    const tiposCartao = g.tipos.filter((t) => somaCartao(t.id) > 0).sort((a, b) => somaCartao(b.id) - somaCartao(a.id)).slice(0, 3);
    const cartoes = g.cartoes.length ? `<table class="tab-dash rolavel"><thead><tr><th scope="col">Cartão</th>${tiposCartao.map((t) => `<th scope="col" class="num">${esc(t.nome)}</th>`).join('')}<th scope="col" class="num">Outros</th><th scope="col" class="num">Total</th></tr></thead><tbody>
      ${g.cartoes.map((c) => {
        const principais = tiposCartao.reduce((a, t) => a + (c.porTipo[t.id] || 0), 0);
        return `<tr><th scope="row">${esc(c.nome)}</th>${tiposCartao.map((t) => `<td class="num">${c.porTipo[t.id] ? moeda(c.porTipo[t.id]) : '–'}</td>`).join('')}<td class="num">${c.total - principais ? moeda(c.total - principais) : '–'}</td><td class="num"><b>${moeda(c.total)}</b></td></tr>`;
      }).join('')}</tbody></table>` : '<p class="suave">Nenhum gasto no cartão neste período.</p>';

    const maiores = `<ol class="estabs">${g.maioresDescricoes.map((d) => `<li><span>${esc(d.desc)}${d.tipoGasto ? ` <small>· ${esc(N.TIPO[d.tipoGasto].nome)}</small>` : ''}</span><small>${d.qtd}×</small><b>${moeda(d.total)}</b></li>`).join('')}</ol>`;

    return `<div class="cards dash-cards" style="--n:3;grid-template-columns:repeat(3,1fr)">${tiles.join('')}</div>
      <div class="dash-grade">
        <div class="cartao"><div class="cartao-cab"><div><h2>Onde você mais gastou</h2><p>Toque em um tipo para ver as descrições lançadas</p></div></div><div class="barras-tipo">${barras}</div></div>
        <div class="dash-coluna">
          <div class="cartao"><div class="cartao-cab"><div><h2>Alertas do período</h2></div></div><ul class="alertas-lista">${alertas}</ul></div>
          <div class="cartao"><div class="cartao-cab"><div><h2>Evolução por tipo (6 meses)</h2><p>${ev ? `${esc(ev.tipo.nome)} em destaque, a média dos demais em cinza` : ''}</p></div></div>${evolucao}</div>
        </div>
        <div class="cartao"><div class="cartao-cab"><div><h2>Tipo de gasto por cartão</h2><p>Quanto de cada cartão foi para cada tipo</p></div></div>${cartoes}</div>
        <div class="cartao"><div class="cartao-cab"><div><h2>Maiores gastos por descrição</h2><p>Somando todas as vezes no período</p></div></div>${maiores}</div>
      </div>`;
  }

  /** Classificar de uma vez os lançamentos sem tipo de gasto do período. */
  function classificarSemTipo() {
    const mes = est.painelAno ? null : est.mes;
    const filtroCats = [...est.painelCats];
    const ids = new Set(N.gastos(dados.lancamentos, est.ano, mes, { categorias: filtroCats }).semTipo.ids);
    const itens = dados.lancamentos.filter((l) => ids.has(l.id)).sort((a, b) => N.dataDe(a) - N.dataDe(b));
    if (!itens.length) return;
    const opcoes = (sel) => `<option value="">Sem tipo</option>${N.TIPOS_GASTO.map((t) => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${t.emoji} ${esc(t.nome)}</option>`).join('')}`;
    const { modal, fechar } = abrirModal(`
      <form class="modal largo" role="dialog" aria-modal="true" aria-labelledby="t-class" novalidate>
        <div class="cab-modal"><h2 id="t-class">Classificar gastos sem tipo</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <p style="margin-top:0" class="suave">Os tipos sugeridos vêm da descrição e das suas escolhas anteriores. Ajuste o que precisar e salve.</p>
        <div class="tabela-wrap" style="max-height:55vh;overflow:auto"><table class="t simples classificar"><thead><tr><th>Data</th><th>Descrição</th><th class="num">Valor</th><th>Tipo de gasto</th></tr></thead><tbody>
        ${itens.map((l) => `<tr><td>${N.dataDe(l).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td><td><b>${esc(N.titulo(l))}</b><small class="suave" style="display:block">${esc(nomeCategoria(l.categoria, l.cartao))}</small></td>
          <td class="num">${moeda(l.centavos)}</td><td><select data-classif="${esc(l.id)}" aria-label="Tipo de gasto de ${esc(l.desc)}">${opcoes(N.sugerirTipoGasto(l.desc, dados.lancamentos))}</select></td></tr>`).join('')}
        </tbody></table></div>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} Salvar classificação</button></div>
      </form>`);
    modal.addEventListener('submit', (e) => {
      e.preventDefault();
      const escolhas = new Map($$('[data-classif]', modal).filter((s) => s.value).map((s) => [s.dataset.classif, s.value]));
      if (!escolhas.size) return toast('Escolha o tipo de pelo menos um lançamento.', { erro: true });
      const antes = dados.lancamentos;
      dados.lancamentos = dados.lancamentos.map((l) => (escolhas.has(l.id) ? { ...l, tipoGasto: escolhas.get(l.id) } : l));
      fechar(); salvar();
      toast(`${escolhas.size} ${escolhas.size === 1 ? 'lançamento classificado' : 'lançamentos classificados'}.`, { acao: () => { dados.lancamentos = antes; salvar(); } });
    });
  }

  // ---------- dashboard ----------
  const anual = () => est.secao === 'ano' || (est.secao === 'dashboard' && est.painelAno);
  const pctTxt = (v) => (v == null ? '–' : `${v}%`);

  function renderDashboard() {
    const raiz = $('#dashboard');
    const mes = est.painelAno ? null : est.mes;
    const filtroCats = [...est.painelCats];
    const visivel = (c) => !filtroCats.length || est.painelCats.has(c.id);
    const p = N.painel(dados.lancamentos, est.ano, mes, { categorias: filtroCats });
    const ant = N.periodoAnterior(est.ano, mes);
    const pa = N.painel(dados.lancamentos, ant.ano, ant.mes, { categorias: filtroCats });
    const nomePeriodo = mes == null ? String(est.ano) : `${MESES[mes].toLowerCase()} de ${est.ano}`;
    const nomeAnterior = ant.mes == null ? String(ant.ano) : MESES_CURTOS[ant.mes].toLowerCase();

    // Variação colorida pelo que é bom: subir é bom para receitas/reservas/saldo, ruim para despesas.
    const delta = (atual, anterior, subirEhBom = true) => {
      const v = N.variacao(atual, anterior);
      if (v == null || !anterior) return `<span class="delta neutro">sem base em ${esc(nomeAnterior)}</span>`;
      if (v === 0) return `<span class="delta neutro">= ${esc(nomeAnterior)}</span>`;
      const bom = (v > 0) === subirEhBom;
      return `<span class="delta ${bom ? 'bom' : 'ruim'}">${ic(v > 0 ? 'sobe' : 'desce')} ${v > 0 ? '+' : ''}${v}% vs ${esc(nomeAnterior)}</span>`;
    };
    const tile = ({ classe = '', rotulo, valor, det = '' }) =>
      `<div class="kpi dash-kpi ${classe}"><span class="rot">${esc(rotulo)}</span><div class="val">${valor}</div><div class="det">${det}</div></div>`;

    const vazio = !p.qtd;
    const max = Math.max(1, ...CATEGORIAS.map((c) => p.porCategoria[c.id]));
    const linhaCat = (c) => {
      const v = p.porCategoria[c.id];
      const pr = p.receitas ? Math.round((v / p.receitas) * 100) : null;
      const tip = `${c.nome}|${moeda(v)}|${p.qtdCategoria[c.id]} ${p.qtdCategoria[c.id] === 1 ? 'lançamento' : 'lançamentos'}${pr != null && c.tipo !== 'entrada' ? ` · ${pr}% das receitas` : ''}`;
      const aberta = v > 0 && est.painelAbertas.has(c.id);
      const nome = v ? `<button type="button" class="abrir-cat" data-expandir="${c.id}" aria-expanded="${aberta}" title="${aberta ? 'Fechar' : 'Ver'} detalhes">${ic('dir')}<span class="chave"></span>${esc(c.nome)}</button>`
        : `<span class="sem-seta"></span><span class="chave"></span>${esc(c.nome)}`;
      return `<tr data-cat="${c.id}" class="${aberta ? 'aberta' : ''}">
        <th scope="row">${nome}</th>
        <td class="col-barra"><span class="trilho"><span class="barra-cat" style="width:${v ? Math.max(1.5, (v / max) * 100) : 0}%" data-tip="${esc(tip)}" tabindex="${v ? 0 : -1}"></span></span></td>
        <td class="num">${v ? moeda(v) : '<span class="suave">–</span>'}</td>
        <td class="num pct">${c.tipo === 'entrada' || pr == null || !v ? '' : `${pr}%`}</td>
      </tr>${aberta ? detalhes(c, v) : ''}`;
    };
    // Linhas de detalhe: descrições da categoria, com barra proporcional ao total da categoria.
    const LIMITE_DET = 15;
    function detalhes(c, totalCat) {
      const ds = N.detalhesCategoria(dados.lancamentos, est.ano, mes, c.id);
      const mostrar = ds.slice(0, LIMITE_DET);
      const resto = ds.slice(LIMITE_DET);
      const linha = (d) => {
        const pc = Math.round((d.total / totalCat) * 100);
        const extra = [`${d.qtd} ${d.qtd === 1 ? 'lançamento' : 'lançamentos'}`, d.cartoes.length ? d.cartoes.join(', ') : '',
          c.tipo !== 'entrada' && d.pago && d.pago < d.total ? `pago ${moeda(d.pago)}` : ''].filter(Boolean).join(' · ');
        const pr = p.receitas && c.tipo !== 'entrada' ? `${Math.round((d.total / p.receitas) * 100)}%` : '';
        return `<tr class="det-cat" data-cat="${c.id}">
          <th scope="row"><span class="det-desc">${esc(d.desc)}</span><small>${esc(extra)}</small></th>
          <td class="col-barra"><span class="trilho fino"><span class="barra-cat" style="width:${Math.max(1.5, pc)}%" data-tip="${esc(`${d.desc}|${moeda(d.total)}|${pc}% de ${c.nome}`)}" tabindex="0"></span></span></td>
          <td class="num">${moeda(d.total)}</td><td class="num pct">${pr}</td></tr>`;
      };
      const somaResto = resto.reduce((a, d) => a + d.total, 0);
      return mostrar.map(linha).join('') + (resto.length ? `<tr class="det-cat det-resto" data-cat="${c.id}"><th scope="row"><span class="det-desc">+ ${resto.length} outras descrições</span></th><td class="col-barra"></td><td class="num">${moeda(somaResto)}</td><td class="num pct"></td></tr>` : '');
    }
    const grupo = (titulo, tipo, total) => `<tr class="grupo-cat"><th scope="rowgroup">${esc(titulo)}</th><td class="col-barra"></td><td class="num">${moeda(total)}</td><td class="num pct">${tipo !== 'entrada' && p.receitas ? pctTxt(Math.round((total / p.receitas) * 100)) : ''}</td></tr>
      ${CATEGORIAS.filter((c) => c.tipo === tipo && visivel(c)).map(linhaCat).join('')}`;
    const comValor = CATEGORIAS.filter((c) => visivel(c) && p.porCategoria[c.id]);
    const todasAbertas = comValor.length > 0 && comValor.every((c) => est.painelAbertas.has(c.id));
    const grupoSe = (titulo, tipo, total) => (CATEGORIAS.some((c) => c.tipo === tipo && visivel(c)) ? grupo(titulo, tipo, total) : '');

    const despCats = CATEGORIAS.filter((c) => c.tipo === 'saida' && visivel(c));
    const composicao = p.despesas ? `<div class="pilha" role="img" aria-label="Composição das despesas">${despCats.filter((c) => p.porCategoria[c.id]).map((c) => {
      const v = p.porCategoria[c.id];
      return `<span data-cat="${c.id}" style="flex:${v} 1 0" data-tip="${esc(`${c.nome}|${moeda(v)}|${Math.round((v / p.despesas) * 100)}% das despesas`)}" tabindex="0"></span>`;
    }).join('')}</div>
      <ul class="legenda-dash">${despCats.map((c) => `<li data-cat="${c.id}"><span class="chave"></span>${esc(c.nome)} <b>${moeda(p.porCategoria[c.id])}</b> <span class="suave">${Math.round((p.porCategoria[c.id] / p.despesas) * 100)}%</span></li>`).join('')}</ul>`
      : '<p class="suave">Nenhuma despesa no período.</p>';

    const maxCartao = Math.max(1, ...p.cartoes.map((c) => c.total));
    const cartoes = p.cartoes.length ? `<table class="tab-dash"><tbody>${p.cartoes.map((c) => `<tr data-cat="cartao">
        <th scope="row">${esc(c.nome)}</th>
        <td class="col-barra"><span class="trilho"><span class="barra-cat" style="width:${Math.max(1.5, (c.total / maxCartao) * 100)}%" data-tip="${esc(`${c.nome}|${moeda(c.total)}|${c.qtd} ${c.qtd === 1 ? 'lançamento' : 'lançamentos'}`)}" tabindex="0"></span></span></td>
        <td class="num">${moeda(c.total)}</td></tr>`).join('')}</tbody></table>`
      : '<p class="suave">Nenhum gasto no cartão no período.</p>';

    const pctPago = p.despesas ? Math.round((p.pagoDespesas / p.despesas) * 100) : 0;
    const maiores = p.maiores.length ? `<ol class="maiores">${p.maiores.map((l) => `<li><span class="desc"><b>${esc(N.titulo(l))}</b>
        <small><span class="tag cat" data-cat="${l.categoria}">${esc(nomeCategoria(l.categoria, l.cartao))}</span>${mes == null ? ` ${N.dataDe(l).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` : ''}</small></span>
        <b class="num">${moeda(l.centavos)}</b></li>`).join('')}</ol>`
      : '<p class="suave">Nenhuma despesa no período.</p>';

    // Indicadores conforme o filtro: sem receitas no filtro, o destaque vira o total filtrado.
    const tem = (tipo) => CATEGORIAS.some((c) => c.tipo === tipo && visivel(c));
    const tiles = [];
    if (tem('entrada')) tiles.push(tile({ classe: 'destaque' + (p.saldo < 0 ? ' negativo' : ''), rotulo: filtroCats.length ? 'Saldo das categorias filtradas' : 'Saldo do período', valor: moeda(p.saldo), det: delta(p.saldo, pa.saldo) }));
    else tiles.push(tile({ classe: 'destaque', rotulo: 'Total das categorias filtradas', valor: moeda(p.despesas + p.reservas), det: delta(p.despesas + p.reservas, pa.despesas + pa.reservas, false) }));
    if (tem('entrada')) tiles.push(tile({ classe: 'verde', rotulo: 'Receitas', valor: moeda(p.receitas), det: delta(p.receitas, pa.receitas) }));
    if (tem('saida')) tiles.push(tile({ classe: 'vermelho', rotulo: 'Despesas', valor: moeda(p.despesas), det: `${p.comprometido != null ? `${p.comprometido}% das receitas · ` : ''}${delta(p.despesas, pa.despesas, false)}` }));
    if (tem('reserva')) tiles.push(tile({ classe: 'indigo', rotulo: 'Investido e poupado', valor: moeda(p.reservas), det: delta(p.reservas, pa.reservas) }));
    if (tem('entrada') && tem('reserva')) tiles.push(tile({ classe: 'ciano', rotulo: 'Taxa de poupança', valor: pctTxt(p.taxaPoupanca), det: 'do que entrou foi investido ou poupado' }));

    raiz.innerHTML = `
      <div class="cartao dash-cab">
        <div><h2><span class="bolha"><i data-ic="painel"></i></span> Dashboard de ${esc(nomePeriodo)}</h2>
          <p>${filtroCats.length ? `<b>Filtrando:</b> ${esc(CATEGORIAS.filter(visivel).map((c) => c.nome).join(', '))} · ` : ''}${vazio ? 'Nenhum lançamento neste período.' : `${p.qtd} ${p.qtd === 1 ? 'lançamento' : 'lançamentos'} · comparação com ${esc(ant.mes == null ? String(ant.ano) : `${MESES[ant.mes].toLowerCase()}`)}`}</p></div>
        <div class="filtro-cats" role="group" aria-label="Filtrar por categoria">
          <span class="rot-filtro">Categorias</span>
          <button type="button" data-pcat="" class="${filtroCats.length ? '' : 'ativo'}" aria-pressed="${!filtroCats.length}">Todas</button>
          ${CATEGORIAS.map((c) => `<button type="button" data-pcat="${c.id}" data-cat="${c.id}" class="${est.painelCats.has(c.id) ? 'ativo' : ''}" aria-pressed="${est.painelCats.has(c.id)}"><span class="chave"></span>${esc(c.nome)}</button>`).join('')}
        </div>
        <div class="abas-dash" role="tablist" aria-label="Visão do dashboard">
          <button type="button" role="tab" data-aba="resumo" aria-selected="${est.painelAba === 'resumo'}" class="${est.painelAba === 'resumo' ? 'ativo' : ''}">Resumo</button>
          <button type="button" role="tab" data-aba="gastos" aria-selected="${est.painelAba === 'gastos'}" class="${est.painelAba === 'gastos' ? 'ativo' : ''}">Onde estou gastando</button>
        </div>
        <div class="alternar" role="group" aria-label="Período">
          <button type="button" data-periodo="mes" aria-pressed="${!est.painelAno}" class="${est.painelAno ? '' : 'ativo'}">Mês</button>
          <button type="button" data-periodo="ano" aria-pressed="${!!est.painelAno}" class="${est.painelAno ? 'ativo' : ''}">Ano</button>
        </div>
      </div>
      ${est.painelAba === 'gastos' ? htmlGastos(mes, filtroCats) : `<div class="cards dash-cards" style="--n:${tiles.length}">${tiles.join('')}</div>
      <div class="dash-grade">
        <div class="cartao dash-categorias">
          <div class="cartao-cab"><div><h2>Total por categoria</h2><p>Toque em uma categoria para ver as descrições.</p></div>
            ${comValor.length ? `<button type="button" class="btn fantasma peq" data-expandir-todas="${todasAbertas ? 'fechar' : 'abrir'}">${todasAbertas ? 'Fechar todas' : 'Abrir todas'}</button>` : ''}</div>
          <table class="tab-dash">
            <thead><tr><th scope="col">Categoria</th><th scope="col"><span class="sr">Proporção</span></th><th scope="col" class="num">Total</th><th scope="col" class="num">% receitas</th></tr></thead>
            <tbody>${grupoSe('Entradas', 'entrada', p.receitas)}${grupoSe('Despesas', 'saida', p.despesas)}${grupoSe('Investimentos e poupança', 'reserva', p.reservas)}</tbody>
            <tfoot><tr>${tem('entrada')
              ? `<th scope="row">Saldo (receitas − despesas − reservas)</th><td class="col-barra"></td><td class="num ${p.saldo < 0 ? 'txt-erro' : ''}">${moeda(p.saldo)}</td>`
              : `<th scope="row">Total das categorias filtradas</th><td class="col-barra"></td><td class="num">${moeda(p.despesas + p.reservas)}</td>`}<td></td></tr></tfoot>
          </table>
        </div>
        <div class="dash-coluna">
          <div class="cartao">
            <div class="cartao-cab"><div><h2>Composição das despesas</h2><p>${p.despesas ? `${moeda(p.despesas)} no período` : ''}</p></div></div>
            ${composicao}
          </div>
          <div class="cartao">
            <div class="cartao-cab"><div><h2>Pago × em aberto</h2><p>Despesas do período</p></div></div>
            ${p.despesas ? `<div class="medidor" role="meter" aria-valuenow="${pctPago}" aria-valuemin="0" aria-valuemax="100" aria-label="Despesas pagas"><span style="width:${pctPago}%"></span></div>
              <div class="medidor-leg"><span><b>${moeda(p.pagoDespesas)}</b> pagos · ${pctPago}%</span><span><b>${moeda(p.abertoDespesas)}</b> em aberto</span></div>` : '<p class="suave">Nenhuma despesa no período.</p>'}
          </div>
        </div>
        <div class="cartao">
          <div class="cartao-cab"><div><h2>Gastos por cartão</h2><p>Total lançado em cada cartão de crédito</p></div></div>
          ${cartoes}
        </div>
        <div class="cartao">
          <div class="cartao-cab"><div><h2>Maiores despesas</h2><p>Os 5 maiores lançamentos do período</p></div></div>
          ${maiores}
        </div>
      </div>`}`;
    hidratar(raiz);
  }

  // ---------- simulador (e se…?) ----------
  // Só calcula: nenhum lançamento é alterado. Cenários salvos ficam em dados.cenarios.
  const novoCenarioSim = () => ({ valores: {}, tipos: {} });
  const BOM_SUBIR = { entrada: true, reserva: true, saida: false };
  const mesAno = (m) => (m ? `${MESES_CURTOS[m.mes].toLowerCase()}/${m.ano}` : '');
  const duracao = (n) => {
    const a = Math.floor(n / 12), m = n % 12;
    return [a ? `${a} ${a === 1 ? 'ano' : 'anos'}` : '', m ? `${m} ${m === 1 ? 'mês' : 'meses'}` : ''].filter(Boolean).join(' e ') || '0 meses';
  };

  function calcSim() {
    const s = est.sim;
    const base = N.baseSimulacao(dados.lancamentos, est.ano, est.mes, s.base);
    return { base, res: N.simular(base, s.cen) };
  }
  const simAlterado = () => {
    const s = est.sim, salvo = dados.cenarios.find((c) => c.id === s.ativo);
    const norm = (c) => JSON.stringify({ base: c.base, valores: Object.entries(c.valores).sort(), tipos: Object.entries(c.tipos).sort() });
    return salvo ? norm(salvo) !== norm({ base: s.base, ...s.cen }) : Object.keys(s.cen.valores).length + Object.keys(s.cen.tipos).length > 0;
  };

  function chipDelta(d, subirEhBom) {
    if (!d) return '<span class="dchip zero">sem mudança</span>';
    const bom = (d > 0) === subirEhBom;
    return `<span class="dchip ${bom ? 'bom' : 'ruim'}">${d > 0 ? '+' : '−'}${moeda(Math.abs(d))}</span>`;
  }
  const maxSlider = (hoje) => Math.max(100000, Math.ceil((hoje * 2) / 10000) * 10000);

  function htmlLinhaSim(c, base, res) {
    const hoje = base.valores[c.id], manual = est.sim.cen.valores[c.id];
    const valor = Number.isInteger(manual) ? manual : hoje;
    const max = Math.max(maxSlider(hoje), valor);
    const red = res.reducao[c.id] || 0;
    return `<div class="aj" data-cat="${c.id}" data-simcat="${c.id}">
      <div class="aj-topo"><label class="nome" for="sim-v-${c.id}"><span class="chave"></span>${esc(c.nome)}</label><span class="hoje">hoje ${moeda(hoje)}</span></div>
      <div class="aj-linha">
        <span class="slider"><span class="marca-hoje" style="left:calc(${(hoje / max) * 100}% + ${8 - (hoje / max) * 16}px)" title="Valor de hoje"></span>
          <input type="range" min="0" max="${max}" step="1000" value="${valor}" style="--p:${(valor / max) * 100}%" data-simrange="${c.id}" aria-label="${esc(c.nome)}: valor simulado"></span>
        <span class="campo-valor sim"><span>R$</span><input type="text" inputmode="decimal" id="sim-v-${c.id}" data-simval="${c.id}" value="${N.valorParaCampo(valor)}"></span>
        <span data-simchip="${c.id}">${chipDelta(res.valores[c.id] - hoje, BOM_SUBIR[c.tipo])}</span>
      </div>
      <small class="aj-red" data-simred="${c.id}" ${red ? '' : 'hidden'}>${red ? `inclui −${moeda(red)} dos cortes por tipo de gasto` : ''}</small>
    </div>`;
  }

  function htmlTiposSim(base, res) {
    if (!base.tipos.length) return '<p class="dica">Classifique suas despesas por <b>tipo de gasto</b> para simular cortes como “gastar 20% menos com alimentação”.</p>';
    const linhas = base.tipos.slice(0, 8).map((t) => {
      const pct = est.sim.cen.tipos[t.id] || 0;
      return `<div><span>${t.emoji} ${esc(t.nome)} <small>hoje ${moeda(t.total)}</small></span>
        <span class="pct" role="group" aria-label="Corte em ${esc(t.nome)}">${N.PCTS_TIPO.map((p) => `<button type="button" data-simtipo="${t.id}" data-pct="${p}" class="${p === pct ? 'sel' : ''}" aria-pressed="${p === pct}">${p ? `−${p}%` : '0%'}</button>`).join('')}</span>
        ${chipDelta(-Math.round((t.total * pct) / 100), false)}</div>`;
    }).join('');
    const reds = CATEGORIAS.filter((c) => res.reducao[c.id]).map((c) => `−${moeda(res.reducao[c.id])} em ${c.nome}`);
    return `<div class="tipos-aj">${linhas}</div><p class="dica">${reds.length ? `Os cortes já entram nas categorias acima: ${esc(reds.join(', '))}.` : 'Os cortes entram nas categorias onde esses gastos foram lançados.'}</p>`;
  }

  function graficoSim(res) {
    const pts = res.projecao;
    const W = 640, H = 230, PL = 66, PR = 104, PT = 14, PB = 30;
    const vals = pts.flatMap((p) => [p.hoje, p.simulado]);
    let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    if (hi === lo) hi = lo + 100000;
    const passo = (() => { const bruto = (hi - lo) / 4; const e = 10 ** Math.floor(Math.log10(bruto)); return [1, 2, 2.5, 5, 10].map((k) => k * e).find((k) => k >= bruto); })();
    lo = Math.floor(lo / passo) * passo; hi = Math.ceil(hi / passo) * passo;
    const x = (i) => PL + (i * (W - PL - PR)) / (pts.length - 1);
    const y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
    const grade = [];
    for (let v = lo; v <= hi + 1; v += passo) grade.push(`<line x1="${PL}" x2="${W - PR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="${v === 0 ? '#c3cfdc' : '#e1e9f1'}"/><text x="${PL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(moedaCurta(v))}</text>`);
    const linha = (k) => pts.map((p, i) => `${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
    const fimH = pts.at(-1).hoje, fimS = pts.at(-1).simulado;
    let yH = y(fimH) + 4, yS = y(fimS) + 4;
    if (Math.abs(yH - yS) < 30) { if (fimS >= fimH) { yS = Math.min(yS, yH) - 15; yH = yS + 30; } else { yH = Math.min(yS, yH) - 15; yS = yH + 30; } }
    const rot = (yy, v, nome) => `<text x="${W - PR + 10}" y="${yy.toFixed(1)}" class="v">${esc(moedaCurta(v))}</text><text x="${W - PR + 10}" y="${(yy + 15).toFixed(1)}">${nome}</text>`;
    const faixa = (W - PL - PR) / (pts.length - 1);
    const alvos = pts.map((p, i) => `<rect x="${(x(i) - faixa / 2).toFixed(1)}" y="${PT}" width="${faixa.toFixed(1)}" height="${H - PT - PB}" fill="transparent" tabindex="0"
      data-tip="${esc(`${MESES[p.mes]} de ${p.ano}|${moeda(p.simulado)} simulado|hoje ${moeda(p.hoje)} · ${p.simulado - p.hoje >= 0 ? '+' : '−'}${moeda(Math.abs(p.simulado - p.hoje))}`)}"></rect>`).join('');
    const meses = pts.map((p, i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${MESES_CURTOS[p.mes].toLowerCase()}</text>`).join('');
    return `<svg class="graf-sim" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Quanto terá guardado em 12 meses: como está hoje ${esc(moeda(fimH))}, simulado ${esc(moeda(fimS))}">
      ${grade.join('')}${meses}
      <polyline points="${linha('hoje')}" fill="none" stroke="#9aaabd" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="${linha('simulado')}" fill="none" stroke="#005ea4" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(11).toFixed(1)}" cy="${y(fimH).toFixed(1)}" r="4.5" fill="#9aaabd" stroke="#fff" stroke-width="2"/>
      <circle cx="${x(11).toFixed(1)}" cy="${y(fimS).toFixed(1)}" r="4.5" fill="#005ea4" stroke="#fff" stroke-width="2"/>
      ${fimS === fimH ? rot(y(fimS) + 4, fimS, 'hoje = simulado') : rot(yS, fimS, 'simulado') + rot(yH, fimH, 'hoje')}${alvos}</svg>`;
  }

  function htmlResultadoSim(base, res) {
    const h = res.hoje, s = res.simulado;
    const comp = ({ rotulo, antes, depois, dif, subirEhBom = true, pontos = false, dest = false }) => {
      const mudou = antes !== depois;
      const fmt = (v) => (v == null ? '—' : pontos ? `${v}%` : moeda(v));
      const d = antes == null || depois == null ? 0 : depois - antes;
      const bom = (d > 0) === subirEhBom;
      return `<div class="comp-card ${dest ? 'dest' : ''}"><span class="rot">${rotulo}</span><div class="lado">
        ${mudou ? `<span class="antes">${fmt(antes)}</span>` : ''}<span class="depois ${!dest && depois < 0 ? 'txt-erro' : ''}">${fmt(depois)}</span>
        ${mudou && d ? `<span class="ganho ${bom ? '' : 'ruim'}">${ic(d > 0 ? 'sobe' : 'desce')} ${d > 0 ? '+' : '−'}${pontos ? `${Math.abs(d)} ${Math.abs(d) === 1 ? 'ponto' : 'pontos'}` : moeda(Math.abs(d))}</span>` : ''}
        ${dif && !mudou ? `<span class="igual">sem mudança</span>` : ''}</div></div>`;
    };
    const metas = N.impactoMetas(dados.planos, res, est.ano, est.mes);
    const textoMeta = (m) => {
      if (m.falta === 0) return 'O planejado já cobre a meta.';
      const q = (x) => (x.meses == null ? '<b>não atinge</b> (nada sobra no mês)' : `atinge em <b>${mesAno(x.quando)}</b> (${duracao(x.meses)})`);
      if (m.antes == null || m.antes === 0) return `Hoje: ${q(m.hoje)}${m.antes === 0 ? ' · o cenário não muda o prazo' : ` · Simulado: ${q(m.simulado)}`}`;
      return `Hoje: ${q(m.hoje)} · Simulado: ${q(m.simulado)}, <b class="${m.antes > 0 ? 'txt-ok' : 'txt-erro'}">${duracao(Math.abs(m.antes))} ${m.antes > 0 ? 'antes' : 'depois'}</b>`;
    };
    return `<div class="cartao"><div class="cartao-cab"><div><h2>Hoje × simulado</h2><p>Por mês${base.modo === 'media3' ? ', pela média de 3 meses' : ''}</p></div></div>
        <div class="comp">
          ${comp({ rotulo: 'Saldo que sobra no mês', antes: h.saldo, depois: s.saldo, dest: true, dif: true })}
          ${comp({ rotulo: 'Taxa de poupança', antes: h.taxa, depois: s.taxa, pontos: true })}
          ${comp({ rotulo: 'Despesas', antes: h.despesas, depois: s.despesas, subirEhBom: false })}
          ${comp({ rotulo: 'Investido e poupado', antes: h.reservas, depois: s.reservas })}
          ${comp({ rotulo: '% das receitas em despesas', antes: h.pctDespesas, depois: s.pctDespesas, pontos: true, subirEhBom: false })}
        </div></div>
      <div class="cartao"><div class="cartao-cab"><div><h2>Quanto você terá guardado em 12 meses</h2><p>Sobra do mês + investimentos + poupança, acumulados</p></div></div>
        ${graficoSim(res)}
        <div class="legenda-linhas"><span><i style="background:#005ea4"></i>Simulado</span><span><i style="background:#9aaabd"></i>Como está hoje</span></div></div>
      <div class="cartao"><div class="cartao-cab"><div><h2>Impacto nas suas metas</h2><p>${metas.length ? 'Se todo o valor guardado no mês for para a meta' : 'Planejamentos com meta'}</p></div></div>
        ${metas.length ? `<ul class="metas">${metas.map((m) => `<li><b>${esc(m.titulo)}</b><span>meta ${moeda(m.meta)}</span>
          <span class="b" role="meter" aria-valuenow="${m.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Planejado de ${esc(m.titulo)}"><span style="width:${m.pct}%"></span></span>
          <small>${m.pct}% planejado · falta ${moeda(m.falta)}. ${textoMeta(m)}</small></li>`).join('')}</ul>`
        : `<p class="suave">Crie um planejamento com meta em <a href="#planos">Planejamentos</a> para ver em quanto tempo você chega lá.</p>`}</div>`;
  }

  function renderSimulador() {
    const raiz = $('#simulador');
    const s = est.sim;
    const { base, res } = calcSim();
    const alterado = simAlterado();
    const ativo = dados.cenarios.find((c) => c.id === s.ativo);
    const resumoCen = (c) => {
      const partes = Object.keys(c.valores).length + Object.keys(c.tipos).length;
      return `${partes} ${partes === 1 ? 'ajuste' : 'ajustes'}${c.base === 'media3' ? ' · média 3 meses' : ''}`;
    };
    raiz.innerHTML = `
      <div class="cartao dash-cab sim-cab">
        <div><h2><span class="bolha ciano"><i data-ic="brilho"></i></span> Simulador · e se…?</h2>
          <p>Mude os valores e veja na hora como ficaria. <b>Nada é alterado nos seus lançamentos.</b></p></div>
        <div class="alternar" role="group" aria-label="Base da simulação">
          <button type="button" data-simbase="mes" aria-pressed="${s.base === 'mes'}" class="${s.base === 'mes' ? 'ativo' : ''}">${esc(MESES[est.mes])} ${est.ano}</button>
          <button type="button" data-simbase="media3" aria-pressed="${s.base === 'media3'}" class="${s.base === 'media3' ? 'ativo' : ''}">Média dos últimos 3 meses</button>
        </div>
        <div class="linha sim-acoes">
          <button type="button" class="btn sec" data-sim="restaurar" ${Object.keys(s.cen.valores).length + Object.keys(s.cen.tipos).length ? '' : 'disabled'}>Restaurar valores de hoje</button>
          <button type="button" class="btn" data-sim="salvar">${ic('check')} ${ativo ? (alterado ? 'Salvar alterações' : 'Salvo') : 'Salvar cenário'}</button>
        </div>
        <div class="filtro-cats sim-cenarios"><span class="rot-filtro">Cenários salvos</span>
          ${dados.cenarios.map((c) => `<button type="button" class="cenario ${c.id === s.ativo ? 'ativo' : ''}" data-simcen="${esc(c.id)}" aria-pressed="${c.id === s.ativo}"><b>${esc(c.nome)}</b><small>${c.id === s.ativo ? (alterado ? 'editando · não salvo' : 'aberto') : esc(resumoCen(c))}</small></button>`).join('') || '<span class="suave">Nenhum ainda. Ajuste os valores e toque em “Salvar cenário”.</span>'}
          ${ativo ? `<button type="button" class="btn fantasma peq" data-sim="novo">${ic('mais')} Novo cenário</button><button type="button" class="btn fantasma peq apagar" data-sim="excluir">${ic('lixo')} Excluir “${esc(ativo.nome)}”</button>` : ''}
        </div>
      </div>
      <div class="sim-grade">
        <div class="cartao"><div class="cartao-cab"><div><h2>Ajuste os valores do mês</h2><p>Arraste ou digite. A marca cinza é o valor de hoje.</p></div></div>
          ${CATEGORIAS.map((c) => htmlLinhaSim(c, base, res)).join('')}
          <details class="sim-tipos" ${est.simTiposAberto ? 'open' : ''}><summary>Ajustar por tipo de gasto</summary><div id="sim-tipos">${htmlTiposSim(base, res)}</div></details>
        </div>
        <div class="sim-coluna" id="sim-res">${htmlResultadoSim(base, res)}</div>
      </div>`;
    hidratar(raiz);
  }

  /** Atualiza resultados sem redesenhar os controles (mantém o foco e o arraste do slider). */
  function atualizarSim(exceto) {
    const raiz = $('#simulador');
    const { base, res } = calcSim();
    for (const c of CATEGORIAS) {
      const manual = est.sim.cen.valores[c.id];
      const valor = Number.isInteger(manual) ? manual : base.valores[c.id];
      const r = $(`[data-simrange="${c.id}"]`, raiz), v = $(`[data-simval="${c.id}"]`, raiz);
      if (r !== exceto) { if (valor > +r.max) r.max = valor; r.value = valor; }
      r.style.setProperty('--p', `${(valor / +r.max) * 100}%`);
      if (v !== exceto) v.value = N.valorParaCampo(valor);
      $(`[data-simchip="${c.id}"]`, raiz).innerHTML = chipDelta(res.valores[c.id] - base.valores[c.id], BOM_SUBIR[c.tipo]);
      const red = res.reducao[c.id] || 0, rr = $(`[data-simred="${c.id}"]`, raiz);
      rr.hidden = !red; rr.textContent = red ? `inclui −${moeda(red)} dos cortes por tipo de gasto` : '';
    }
    $('#sim-tipos', raiz).innerHTML = htmlTiposSim(base, res);
    $('#sim-res', raiz).innerHTML = htmlResultadoSim(base, res);
    hidratar($('#sim-res', raiz));
    const alterado = simAlterado(), ativo = dados.cenarios.find((c) => c.id === est.sim.ativo);
    const bs = $('[data-sim="salvar"]', raiz);
    bs.innerHTML = `${ic('check')} ${ativo ? (alterado ? 'Salvar alterações' : 'Salvo') : 'Salvar cenário'}`;
    $('[data-sim="restaurar"]', raiz).disabled = !(Object.keys(est.sim.cen.valores).length + Object.keys(est.sim.cen.tipos).length);
    const chip = ativo && $(`[data-simcen="${CSS.escape(ativo.id)}"] small`, raiz);
    if (chip) chip.textContent = alterado ? 'editando · não salvo' : 'aberto';
  }

  function definirValorSim(cat, centavos) {
    const base = N.baseSimulacao(dados.lancamentos, est.ano, est.mes, est.sim.base);
    if (centavos === base.valores[cat]) delete est.sim.cen.valores[cat];
    else est.sim.cen.valores[cat] = centavos;
  }

  function salvarCenario() {
    const s = est.sim, ativo = dados.cenarios.find((c) => c.id === s.ativo);
    if (ativo) {
      const antes = dados.cenarios;
      dados.cenarios = dados.cenarios.map((c) => (c.id === ativo.id ? N.limparCenario({ ...c, base: s.base, ...structuredClone(s.cen) }) : c));
      salvar(); toast(`Cenário “${ativo.nome}” atualizado.`, { acao: () => { dados.cenarios = antes; salvar(); } });
      return;
    }
    if (dados.cenarios.length >= N.MAX_CENARIOS) return toast(`Limite de ${N.MAX_CENARIOS} cenários. Exclua um para salvar outro.`, { erro: true });
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-cen" novalidate>
        <div class="cab-modal"><h2 id="t-cen">Salvar cenário</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <label class="rotulo" for="cen-nome">Nome do cenário</label>
        <input type="text" id="cen-nome" maxlength="60" placeholder="Ex.: Aumento de salário + cortar delivery" autofocus required>
        <p class="dica">Fica guardado só para você. Os lançamentos não mudam.</p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} Salvar</button></div>
      </form>`, { estreito: true });
    modal.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = $('#cen-nome', modal).value.trim();
      if (!nome) { $('#cen-nome', modal).focus(); return; }
      const c = N.limparCenario({ nome, base: s.base, ...structuredClone(s.cen) });
      dados.cenarios = [...dados.cenarios, c];
      s.ativo = c.id;
      fechar(); salvar(); toast(`Cenário “${nome}” salvo.`);
    });
  }

  function ligarSimulador() {
    const raiz = $('#simulador');
    raiz.addEventListener('input', (e) => {
      const r = e.target.closest('[data-simrange]');
      if (r) { definirValorSim(r.dataset.simrange, +r.value); atualizarSim(r); return; }
      const v = e.target.closest('[data-simval]');
      if (v) { const c = N.lerValor(v.value); if (Number.isInteger(c) && c >= 0 && c <= 1e11) { definirValorSim(v.dataset.simval, c); atualizarSim(v); } }
    });
    raiz.addEventListener('change', (e) => {
      const v = e.target.closest('[data-simval]');
      if (v) atualizarSim();
    });
    raiz.addEventListener('toggle', (e) => { if (e.target.matches('.sim-tipos')) est.simTiposAberto = e.target.open; }, true);
    raiz.addEventListener('click', (e) => {
      const b = e.target.closest('[data-simbase]');
      if (b) { est.sim.base = b.dataset.simbase; render(); return; }
      const t = e.target.closest('[data-simtipo]');
      if (t) {
        const pct = +t.dataset.pct;
        if (pct) est.sim.cen.tipos[t.dataset.simtipo] = pct; else delete est.sim.cen.tipos[t.dataset.simtipo];
        atualizarSim(); $(`#simulador [data-simtipo="${t.dataset.simtipo}"][data-pct="${pct}"]`)?.focus(); return;
      }
      const c = e.target.closest('[data-simcen]');
      if (c) {
        const cen = dados.cenarios.find((x) => x.id === c.dataset.simcen);
        if (cen) Object.assign(est.sim, { ativo: cen.id, base: cen.base, cen: structuredClone({ valores: cen.valores, tipos: cen.tipos }) });
        render(); return;
      }
      const a = e.target.closest('[data-sim]')?.dataset.sim;
      if (a === 'restaurar') { est.sim.cen = novoCenarioSim(); render(); }
      if (a === 'novo') { Object.assign(est.sim, { ativo: null, cen: novoCenarioSim() }); render(); }
      if (a === 'salvar') salvarCenario();
      if (a === 'excluir') {
        const cen = dados.cenarios.find((x) => x.id === est.sim.ativo);
        if (!cen) return;
        const antes = dados.cenarios;
        dados.cenarios = dados.cenarios.filter((x) => x.id !== cen.id);
        est.sim.ativo = null;
        salvar(); toast(`Cenário “${cen.nome}” excluído.`, { acao: () => { dados.cenarios = antes; est.sim.ativo = cen.id; salvar(); } });
      }
    });
  }

  let ligarTip = () => {};
  // Tooltip único para as barras do dashboard (valor em destaque, rótulo depois).
  function ligarTooltipDashboard() {
    const tip = document.createElement('div');
    tip.className = 'tip-graf'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
    document.body.append(tip);
    const mostrar = (alvo, x, y) => {
      const [rotulo, valor, det] = alvo.dataset.tip.split('|');
      tip.replaceChildren();
      const v = document.createElement('b'); v.textContent = valor;
      const r = document.createElement('span'); r.textContent = rotulo;
      tip.append(v, r);
      if (det) { const d = document.createElement('small'); d.textContent = det; tip.append(d); }
      tip.hidden = false;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = `${Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2))}px`;
      tip.style.top = `${Math.max(8, y - h - 12)}px`;
    };
    ligarTip = (area) => {
      area.addEventListener('pointermove', (e) => { const a = e.target.closest('[data-tip]'); if (a) mostrar(a, e.clientX, e.clientY); else tip.hidden = true; });
      area.addEventListener('pointerleave', () => { tip.hidden = true; });
      area.addEventListener('focusin', (e) => { const a = e.target.closest('[data-tip]'); if (a) { const r = a.getBoundingClientRect(); mostrar(a, r.left + r.width / 2, r.top); } });
      area.addEventListener('focusout', () => { tip.hidden = true; });
    };
    ligarTip($('#simulador'));
    const raiz = $('#dashboard');
    raiz.addEventListener('pointermove', (e) => { const a = e.target.closest('[data-tip]'); if (a) mostrar(a, e.clientX, e.clientY); else tip.hidden = true; });
    raiz.addEventListener('pointerleave', () => { tip.hidden = true; });
    raiz.addEventListener('focusin', (e) => { const a = e.target.closest('[data-tip]'); if (a) { const r = a.getBoundingClientRect(); mostrar(a, r.left + r.width / 2, r.top); } });
    raiz.addEventListener('focusout', () => { tip.hidden = true; });
    raiz.addEventListener('click', (e) => {
      const b = e.target.closest('[data-periodo]');
      if (b) { est.painelAno = b.dataset.periodo === 'ano'; render(); return; }
      const aba = e.target.closest('[data-aba]');
      if (aba) { est.painelAba = aba.dataset.aba; render(); return; }
      const gt = e.target.closest('[data-gtipo]');
      if (gt) {
        const id = gt.dataset.gtipo;
        if (est.gastosAbertos.has(id)) est.gastosAbertos.delete(id); else est.gastosAbertos.add(id);
        render(); $(`#dashboard [data-gtipo="${id}"]`)?.focus(); return;
      }
      if (e.target.closest('[data-classificar]')) { classificarSemTipo(); return; }
      const fc = e.target.closest('[data-pcat]');
      if (fc) {
        const id = fc.dataset.pcat;
        if (!id) est.painelCats.clear();
        else if (est.painelCats.has(id)) est.painelCats.delete(id);
        else est.painelCats.add(id);
        if (est.painelCats.size === CATEGORIAS.length) est.painelCats.clear();
        render(); return;
      }
      const ex = e.target.closest('[data-expandir]');
      if (ex) {
        const id = ex.dataset.expandir;
        if (est.painelAbertas.has(id)) est.painelAbertas.delete(id); else est.painelAbertas.add(id);
        render();
        $(`#dashboard [data-expandir="${id}"]`)?.focus();
        return;
      }
      const todas = e.target.closest('[data-expandir-todas]');
      if (todas) {
        if (todas.dataset.expandirTodas === 'abrir') CATEGORIAS.forEach((c) => est.painelAbertas.add(c.id)); else est.painelAbertas.clear();
        render();
      }
    });
    window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
  }

  // ---------- provisões ----------
  const nomeProvisao = (grupo) => dados.provisoes.find((p) => p.grupo === grupo)?.nome;
  const nomeCategoria = (categoria, cartao) => (categoria === 'cartao' && cartao ? `Cartão · ${cartao}` : CAT[categoria].nome);
  /** Cartões já usados (mais recentes primeiro) seguidos das sugestões. */
  function cartoesConhecidos() {
    const usados = [];
    const vistos = new Set();
    for (const x of [...dados.lancamentos].sort((a, b) => b.criadoEm - a.criadoEm).concat(dados.provisoes)) {
      const n = (x.cartao || '').trim();
      if (n && !vistos.has(N.normalizar(n))) { vistos.add(N.normalizar(n)); usados.push(n); }
    }
    const sugeridos = N.CARTOES_SUGERIDOS.filter((n) => !vistos.has(N.normalizar(n)));
    return { usados, todos: [...usados, ...sugeridos] };
  }
  /** Usa a grafia já conhecida do cartão ("picpay" → "PicPay"). */
  function grafiaCartao(nome) {
    const n = String(nome || '').trim();
    if (!n) return '';
    return N.CARTOES_SUGERIDOS.find((c) => N.mesmoCartao(c, n))
      || dados.provisoes.map((x) => x.cartao).find((c) => c && N.mesmoCartao(c, n))
      || dados.lancamentos.map((x) => x.cartao).find((c) => c && N.mesmoCartao(c, n))
      || n;
  }
  const OUTRO = '__outro';
  /** Lista suspensa de bancos + "Outros" (abre um campo para digitar). */
  function seletorCartao(id, valor, rotuloVazio) {
    const bancos = N.CARTOES_SUGERIDOS;
    const ehBanco = (n) => bancos.some((b) => N.mesmoCartao(b, n));
    const proprios = cartoesConhecidos().usados.filter((n) => !ehBanco(n)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const atual = grafiaCartao(valor);
    const conhecido = !atual || ehBanco(atual) || proprios.some((n) => N.mesmoCartao(n, atual));
    const opt = (n) => `<option value="${esc(n)}" ${atual && N.mesmoCartao(n, atual) ? 'selected' : ''}>${esc(n)}</option>`;
    return `<select id="${id}" class="sel-cartao">
        <option value="">${esc(rotuloVazio)}</option>
        <optgroup label="Bancos">${bancos.map(opt).join('')}</optgroup>
        ${proprios.length ? `<optgroup label="Outros que você já usou">${proprios.map(opt).join('')}</optgroup>` : ''}
        <option value="${OUTRO}" ${conhecido ? '' : 'selected'}>Outros (digitar o nome)</option>
      </select>
      <input type="text" id="${id}-outro" class="cartao-outro" maxlength="40" placeholder="Nome do banco ou cartão" autocomplete="off"
        value="${conhecido ? '' : esc(atual)}" ${conhecido ? 'hidden' : ''} aria-label="Nome do banco ou cartão">`;
  }
  /** Liga o seletor: mostra o campo "Outros" quando escolhido. Devolve { ler, definir }. */
  function ligarSeletorCartao(raiz, id, aoMudar = () => {}) {
    const sel = $('#' + id, raiz), outro = $('#' + id + '-outro', raiz);
    const ajustar = () => { outro.hidden = sel.value !== OUTRO; };
    sel.addEventListener('change', () => { ajustar(); if (!outro.hidden) outro.focus(); aoMudar(); });
    outro.addEventListener('input', aoMudar);
    ajustar();
    return {
      ler: () => (sel.value === OUTRO ? grafiaCartao(outro.value) : sel.value),
      definir(nome) {
        const opcao = [...sel.options].find((o) => o.value !== OUTRO && o.value && N.mesmoCartao(o.value, nome));
        if (opcao) sel.value = opcao.value; else { sel.value = OUTRO; outro.value = nome; }
        ajustar(); aoMudar();
      },
    };
  }

  function renderProvisoes() {
    const raiz = $('#provisoes');
    const consumo = N.consumoProvisoes(dados.lancamentos, dados.provisoes, est.ano, est.mes);
    const cab = `<div class="cartao-cab">
        <div><h2><span class="bolha ciano"><i data-ic="alvo"></i></span> Provisões de ${esc(MESES[est.mes].toLowerCase())}</h2>
        <p>Previsões de gasto e quanto delas já foi consumido. Ligue lançamentos e parcelas a uma provisão ao lançar.</p></div>
        <button type="button" class="btn sec" data-prov="nova"><i data-ic="mais"></i> Nova provisão</button></div>`;
    if (!consumo.length) {
      raiz.innerHTML = `<div class="cartao provisoes vazia">${cab}
        <p class="dica" style="margin:0">Exemplos: “Mercado” R$ 1.200 por mês, “Cartão de crédito” R$ 2.000 (contando tudo que for lançado no cartão) ou “Compras parceladas” R$ 800.</p></div>`;
      hidratar(raiz);
      return;
    }
    const total = consumo.reduce((a, c) => a + c.provisao.centavos, 0);
    const usado = consumo.reduce((a, c) => a + c.consumido, 0);
    const reservado = consumo.reduce((a, c) => a + c.restante, 0);
    raiz.innerHTML = `<div class="cartao provisoes">${cab}
      <div class="resumo-prov"><span>Previsto <b>${moeda(total)}</b></span><span>Consumido <b>${moeda(usado)}</b></span><span>Ainda reservado <b>${moeda(reservado)}</b></span></div>
      <div class="lista-prov">${consumo.map((c) => {
        const p = c.provisao;
        const estado = c.excedente ? 'estourou' : c.pct >= 80 ? 'quase' : 'ok';
        const serie = dados.provisoes.filter((x) => x.grupo === p.grupo).length > 1;
        const filtrando = est.filtroProvisao === p.grupo;
        return `<div class="prov ${estado}">
          <div class="prov-topo">
            <div class="prov-nome"><b>${esc(p.nome)}</b>
              <span class="tags">${p.categoria ? `<span class="tag cat" data-cat="${p.categoria}">${esc(nomeCategoria(p.categoria, p.cartao))}</span>` : ''}
              ${p.auto ? `<span class="tag info" title="Conta automaticamente os lançamentos desta categoria">${ic('brilho')} automática</span>` : ''}
              ${serie ? `<span class="tag info">${ic('repetir')} mensal</span>` : ''}</span></div>
            <div class="prov-valores"><b>${moeda(c.consumido)}</b> <span class="suave">de ${moeda(p.centavos)}</span></div>
          </div>
          <div class="barra prov-barra" role="progressbar" aria-valuenow="${c.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Consumo de ${esc(p.nome)}"><span style="width:${Math.min(100, c.pct)}%"></span></div>
          <div class="prov-rodape">
            <span>${c.excedente ? `<b class="txt-erro">Estourou ${moeda(c.excedente)}</b>` : `Restam <b>${moeda(c.restante)}</b>`} · ${c.pct}% · ${c.itens.length} ${c.itens.length === 1 ? 'lançamento' : 'lançamentos'}${c.pago ? ` · pago ${moeda(c.pago)}` : ''}</span>
            <span class="prov-acoes">
              <button type="button" class="btn fantasma peq ${filtrando ? 'ativo' : ''}" data-prov="ver" data-id="${esc(p.id)}" aria-pressed="${filtrando}">${ic('lista')} ${filtrando ? 'Mostrando' : 'Ver'}</button>
              <button type="button" class="btn fantasma icone peq" data-prov="editar" data-id="${esc(p.id)}" title="Editar provisão" aria-label="Editar provisão ${esc(p.nome)}">${ic('editar')}</button>
              <button type="button" class="btn fantasma icone peq apagar" data-prov="excluir" data-id="${esc(p.id)}" title="Excluir provisão" aria-label="Excluir provisão ${esc(p.nome)}">${ic('lixo')}</button>
            </span>
          </div>
          ${p.obs ? `<p class="prov-obs">${ic('nota')} ${esc(p.obs)}</p>` : ''}
        </div>`;
      }).join('')}</div></div>`;
    hidratar(raiz);
  }

  /** Pergunta o escopo numa provisão repetida. */
  function escopoProvisao(p, verbo) {
    const qtd = dados.provisoes.filter((x) => x.grupo === p.grupo).length;
    if (qtd < 2) return Promise.resolve('este');
    return new Promise((ok) => {
      const { fundo, fechar } = abrirModal(`
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-escp">
          <div class="cab-modal"><h2 id="t-escp">${esc(verbo)} provisão mensal</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <p class="suave" style="margin-top:0">“${esc(p.nome)}” se repete em ${qtd} meses.</p>
          <div class="opcoes-escopo">
            <button type="button" class="btn sec" data-esc="este"><span>Só este mês<small>${esc(MESES[p.mes])} de ${p.ano}</small></span></button>
            <button type="button" class="btn sec" data-esc="proximos"><span>Este e os próximos<small>A partir de ${esc(MESES[p.mes].toLowerCase())} de ${p.ano}</small></span></button>
            <button type="button" class="btn sec" data-esc="todos"><span>Todos os meses<small>As ${qtd} provisões</small></span></button>
          </div>
        </div>`, { estreito: true });
      fundo.addEventListener('cancelado', () => ok(null));
      $$('[data-esc]', fundo).forEach((b) => b.addEventListener('click', () => { fechar(); ok(b.dataset.esc); }));
    });
  }

  function formProvisao(existente = null) {
    const p = existente || { nome: '', centavos: null, categoria: null, auto: false, obs: '', ano: est.ano, mes: est.mes };
    const saidas = CATEGORIAS.filter((c) => c.tipo === 'saida');
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-prov" novalidate autocomplete="off">
        <div class="cab-modal"><h2 id="t-prov">${existente ? 'Editar provisão' : 'Nova provisão'}</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="grade-form">
          <div class="inteiro"><label class="rotulo" for="p-nome">Nome</label>
            <input type="text" id="p-nome" maxlength="80" placeholder="Ex.: Mercado, Cartão de crédito, Compras parceladas" value="${esc(p.nome)}"></div>
          <div><label class="rotulo" for="p-valor">Valor previsto</label>
            <div class="campo-valor"><span>R$</span><input type="text" id="p-valor" inputmode="decimal" placeholder="0,00" value="${p.centavos ? esc(N.valorParaCampo(p.centavos)) : ''}"></div></div>
          <div><label class="rotulo" for="p-mes">Mês</label>
            <input type="month" id="p-mes" value="${p.ano}-${String(p.mes + 1).padStart(2, '0')}" ${existente && dados.provisoes.filter((x) => x.grupo === p.grupo).length > 1 ? 'disabled title="Em provisões mensais o mês não muda"' : ''}></div>
          <div class="inteiro"><label class="rotulo" for="p-cat">Categoria <small>(opcional)</small></label>
            <select id="p-cat"><option value="">Qualquer despesa</option>${saidas.map((c) => `<option value="${c.id}" ${p.categoria === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
          <div class="inteiro" id="p-cartao-bloco"><label class="rotulo" for="p-cartao">Qual cartão?</label>
            ${seletorCartao('p-cartao', p.cartao || '', 'Todos os cartões')}</div>
          <label class="inteiro check-linha" id="p-auto-linha"><input type="checkbox" id="p-auto" ${p.auto ? 'checked' : ''}>
            <span><b>Contar automaticamente</b> todos os lançamentos desta categoria no mês (e deste cartão, se informado)<small>Os que você ligar a outra provisão não entram.</small></span></label>
          ${existente ? '' : `<fieldset class="inteiro pilulas"><legend class="rotulo" style="padding:0;margin-bottom:.45em">Repetição</legend>
            <label><input type="radio" name="p-rep" value="nao" checked><span>Só este mês</span></label>
            <label><input type="radio" name="p-rep" value="sim"><span>Todo mês</span></label></fieldset>
          <div id="p-qtd-bloco" hidden><label class="rotulo" for="p-qtd">Por quantos meses?</label><input type="number" id="p-qtd" min="2" max="60" value="12"></div>`}
          <div class="inteiro"><label class="rotulo" for="p-obs">Observações <small>(opcional)</small></label>
            <textarea id="p-obs" rows="2" maxlength="1000" placeholder="Ex.: inclui feira e padaria">${esc(p.obs || '')}</textarea></div>
        </div>
        <p class="erro-campo" id="p-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button>
          <button class="btn">${ic('check')} ${existente ? 'Salvar' : 'Criar provisão'}</button></div>
      </form>`, { estreito: true });
    const f = (id) => $('#' + id, modal);
    const cartaoProv = ligarSeletorCartao(modal, 'p-cartao');
    const atualizar = () => {
      f('p-auto-linha').hidden = !f('p-cat').value;
      f('p-cartao-bloco').hidden = f('p-cat').value !== 'cartao';
      if (f('p-qtd-bloco')) f('p-qtd-bloco').hidden = $('input[name=p-rep]:checked', modal).value !== 'sim';
    };
    modal.addEventListener('change', atualizar);
    atualizar();
    f('p-nome').focus();
    modal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = f('p-nome').value.trim();
      const centavos = N.lerValor(f('p-valor').value);
      const [a, m] = f('p-mes').value.split('-').map(Number);
      const erro = (t) => { f('p-erro').textContent = t; };
      if (!nome) return erro('Dê um nome para a provisão.');
      if (!(centavos > 0)) return erro('Informe o valor previsto, por exemplo 1.200,00.');
      if (!a || !m) return erro('Escolha o mês.');
      const categoria = f('p-cat').value || null;
      const auto = !!categoria && f('p-auto').checked;
      const cartao = categoria === 'cartao' ? cartaoProv.ler() : '';
      if (categoria === 'cartao' && f('p-cartao').value === OUTRO && !cartao) return erro('Digite o nome do banco ou escolha um da lista.');
      const obs = f('p-obs').value.trim();
      const antes = dados.provisoes;
      if (existente) {
        const escopo = await escopoProvisao(existente, 'Editar');
        if (!escopo) return;
        const k = N.chaveMes(existente.ano, existente.mes);
        dados.provisoes = dados.provisoes.map((x) => {
          const alvo = x.id === existente.id || (x.grupo === existente.grupo && (escopo === 'todos' || (escopo === 'proximos' && N.chaveMes(x.ano, x.mes) >= k)));
          if (!alvo) return x;
          const novo = { ...x, nome, centavos, categoria, auto, obs, cartao };
          if (x.id === existente.id && escopo === 'este' && !f('p-mes').disabled) { novo.ano = a; novo.mes = m - 1; }
          return novo;
        });
      } else {
        const repetir = $('input[name=p-rep]:checked', modal).value === 'sim';
        const quantidade = Math.floor(+f('p-qtd').value);
        if (repetir && !(quantidade >= 2 && quantidade <= 60)) return erro('Escolha entre 2 e 60 meses.');
        dados.provisoes = [...dados.provisoes, ...N.gerarProvisoes({ nome, centavos, categoria, auto, obs, cartao, ano: a, mes: m - 1, repetir, quantidade })];
      }
      fechar(); salvar();
      toast(existente ? 'Provisão atualizada.' : 'Provisão criada.', { acao: () => { dados.provisoes = antes; salvar(); } });
      if (!existente && (a !== est.ano || m - 1 !== est.mes)) toast(`A provisão começa em ${MESES[m - 1].toLowerCase()}/${a}.`, { rotulo: 'Ver', acao: () => irPara(a, m - 1) });
    });
  }

  async function acaoProvisao(acao, id) {
    if (acao === 'nova') return formProvisao();
    const p = dados.provisoes.find((x) => x.id === id);
    if (!p) return;
    if (acao === 'editar') return formProvisao(p);
    if (acao === 'ver') {
      est.filtroProvisao = est.filtroProvisao === p.grupo ? null : p.grupo;
      if (est.filtro === 'atrasados') est.filtro = 'todos';
      render();
      if (est.filtroProvisao) $('#lista').closest('.cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (acao === 'excluir') {
      const escopo = await escopoProvisao(p, 'Excluir');
      if (!escopo) return;
      const k = N.chaveMes(p.ano, p.mes);
      const antes = { provisoes: dados.provisoes, lancamentos: dados.lancamentos };
      dados.provisoes = dados.provisoes.filter((x) => !(x.id === p.id || (x.grupo === p.grupo && (escopo === 'todos' || (escopo === 'proximos' && N.chaveMes(x.ano, x.mes) >= k)))));
      // Sem nenhuma provisão do grupo, os lançamentos deixam de apontar para ela.
      if (!dados.provisoes.some((x) => x.grupo === p.grupo)) {
        dados.lancamentos = dados.lancamentos.map((l) => (l.provisao === p.grupo ? { ...l, provisao: null } : l));
        if (est.filtroProvisao === p.grupo) est.filtroProvisao = null;
      }
      salvar();
      toast('Provisão excluída. Os lançamentos continuam.', { acao: () => { dados.provisoes = antes.provisoes; dados.lancamentos = antes.lancamentos; salvar(); } });
    }
  }

  // ---------- planejamentos ----------
  const planoAtual = () => dados.planos.find((p) => p.id === est.plano);
  const campoValor = (c) => (Number.isInteger(c) ? N.valorParaCampo(c) : '');

  function renderPlanos() {
    const raiz = $('#planos');
    const p = planoAtual();
    if (est.plano && !p) { location.hash = '#planos'; return; }
    if (p) return renderEditorPlano(raiz, p);

    const cab = `<div class="cartao-cab">
        <div><h2><span class="bolha indigo"><i data-ic="alvo"></i></span> Planejamentos</h2>
        <p>Monte tabelas para planejar uma compra, uma viagem ou um investimento. Os totais são calculados sozinhos.</p></div>
        <div class="linha"><button type="button" class="btn sec" data-p="exemplo"><i data-ic="brilho"></i> Usar exemplo</button>
        <button type="button" class="btn" data-p="novo"><i data-ic="mais"></i> Novo planejamento</button></div></div>`;
    if (!dados.planos.length) {
      raiz.innerHTML = `<div class="cartao">${cab}<div class="vazio">${ILUSTRA}<h3>Nenhum planejamento ainda</h3>
        <p>Exemplo: “Plano apartamento”, com uma coluna por ano e uma linha para cada fonte (poupança, PLR, 13º).</p>
        <div class="linha"><button type="button" class="btn" data-p="exemplo">Começar pelo exemplo</button></div></div></div>`;
    } else {
      const cards = dados.planos.slice().sort((a, b) => b.atualizadoEm - a.atualizadoEm).map((pl) => {
        const t = N.totaisPlano(pl);
        return `<a class="cartao-plano" href="#planos/${encodeURIComponent(pl.id)}">
          <span class="tipo">${pl.linhas.length} ${pl.linhas.length === 1 ? 'item' : 'itens'} · ${pl.colunas.length} ${pl.colunas.length === 1 ? 'coluna' : 'colunas'}</span>
          <b class="titulo">${esc(pl.titulo)}</b>
          <span class="total">${moeda(t.total)}</span>
          ${t.pctMeta != null ? `<span class="meta-linha"><span class="barra"><span style="width:${Math.min(100, t.pctMeta)}%"></span></span><small>${t.pctMeta}% da meta de ${moeda(pl.meta)}</small></span>` : '<small class="suave">Sem meta definida</small>'}
        </a>`;
      }).join('');
      raiz.innerHTML = `<div class="cartao">${cab}<div class="grade-planos">${cards}</div></div>`;
    }
    hidratar(raiz);
  }

  function resumoMeta(p, t) {
    if (!(p.meta > 0)) return '<span class="suave">Defina uma meta para acompanhar quanto falta.</span>';
    return `<span class="barra"><span style="width:${Math.min(100, t.pctMeta)}%"></span></span>
      <span><b>${t.pctMeta}%</b> da meta · ${t.falta ? `faltam <b>${moeda(t.falta)}</b>` : '<b>meta atingida</b>'}</span>`;
  }

  function renderEditorPlano(raiz, p) {
    const t = N.totaisPlano(p);
    const nCol = p.colunas.length;
    raiz.innerHTML = `<div class="cartao editor-plano">
      <div class="plano-topo">
        <a href="#planos" class="btn fantasma peq"><i data-ic="esq"></i> Planejamentos</a>
        <div class="linha">
          <button type="button" class="btn sec peq" data-p="csv"><i data-ic="planilha"></i> CSV</button>
          <button type="button" class="btn sec peq" data-p="duplicar"><i data-ic="copiar"></i> Duplicar</button>
          <button type="button" class="btn perigo peq" data-p="excluir"><i data-ic="lixo"></i> Excluir</button>
        </div>
      </div>
      <input type="text" class="titulo-plano" data-campo="titulo" maxlength="120" value="${esc(p.titulo)}" aria-label="Nome do planejamento" placeholder="Nome do planejamento">
      <div class="meta-plano">
        <div><label class="rotulo" for="plano-meta">Meta <small>(opcional)</small></label>
          <div class="campo-valor"><span>R$</span><input type="text" id="plano-meta" data-campo="meta" inputmode="decimal" placeholder="0,00" value="${esc(campoValor(p.meta))}"></div></div>
        <div class="resumo-meta" data-meta-resumo>${resumoMeta(p, t)}</div>
      </div>
      <div class="tabela-wrap"><table class="t plano">
        <thead><tr>
          <th scope="col">Item</th>
          ${p.colunas.map((c, j) => `<th scope="col"><div class="cel-col"><input type="text" data-col-nome="${esc(c.id)}" data-r="-1" data-c="${j}" value="${esc(c.nome)}" maxlength="80" placeholder="Coluna" aria-label="Nome da coluna ${j + 1}">
            ${nCol > 1 ? `<button type="button" class="rem" tabindex="-1" data-p="rem-col" data-id="${esc(c.id)}" title="Remover coluna" aria-label="Remover coluna ${esc(c.nome || j + 1)}">${ic('x')}</button>` : ''}</div></th>`).join('')}
          <th scope="col" class="col-total">Total</th>
          <th class="col-add">${nCol < N.LIMITES_PLANO.colunas ? `<button type="button" class="btn fantasma peq" data-p="add-col" title="Adicionar coluna">${ic('mais')} Coluna</button>` : ''}</th>
        </tr></thead>
        <tbody>${p.linhas.map((l, i) => `<tr>
          <td><div class="cel-nome"><input type="text" data-lin-nome="${esc(l.id)}" data-r="${i}" data-c="-1" value="${esc(l.nome)}" maxlength="80" placeholder="Ex.: Poupança" aria-label="Nome da linha ${i + 1}">
            <button type="button" class="rem" tabindex="-1" data-p="rem-lin" data-id="${esc(l.id)}" title="Remover linha" aria-label="Remover linha ${esc(l.nome || i + 1)}">${ic('x')}</button></div></td>
          ${p.colunas.map((c, j) => `<td><input type="text" class="valor" inputmode="decimal" data-lin="${esc(l.id)}" data-col="${esc(c.id)}" data-r="${i}" data-c="${j}"
            value="${esc(campoValor(l.valores[c.id]))}" placeholder="–" aria-label="${esc(l.nome || 'Linha ' + (i + 1))}, ${esc(c.nome || 'coluna ' + (j + 1))}"></td>`).join('')}
          <td class="col-total" data-tot-l="${esc(l.id)}">${moeda(t.porLinha[l.id])}</td><td></td>
        </tr>`).join('')}</tbody>
        <tfoot>
          <tr class="soma"><th scope="row">Total</th>${p.colunas.map((c) => `<td data-tot-c="${esc(c.id)}">${moeda(t.porColuna[c.id])}</td>`).join('')}<td class="col-total" data-tot-geral>${moeda(t.total)}</td><td></td></tr>
          <tr class="final"><th scope="row">Total final</th><td colspan="${nCol + 1}" data-tot-final>${moeda(t.total)}</td><td></td></tr>
        </tfoot>
      </table></div>
      ${p.linhas.length < N.LIMITES_PLANO.linhas ? `<button type="button" class="btn sec peq" data-p="add-lin" style="margin-top:.8em">${ic('mais')} Adicionar linha</button>` : ''}
      <div style="margin-top:1.2em"><label class="rotulo" for="plano-obs">Observações <small>(opcional)</small></label>
        <textarea id="plano-obs" data-campo="obs" rows="3" maxlength="1000" placeholder="Premissas, prazos, de onde vem cada valor…">${esc(p.obs || '')}</textarea></div>
      <p class="dica">Valores aceitam o formato brasileiro (18.000,00). <kbd>Enter</kbd> desce para a linha de baixo. Salvo automaticamente.</p>
    </div>`;
    hidratar(raiz);
  }

  function atualizarTotaisPlano(p) {
    const t = N.totaisPlano(p);
    const raiz = $('#planos');
    for (const l of p.linhas) { const el = $(`[data-tot-l="${CSS.escape(l.id)}"]`, raiz); if (el) el.textContent = moeda(t.porLinha[l.id]); }
    for (const c of p.colunas) { const el = $(`[data-tot-c="${CSS.escape(c.id)}"]`, raiz); if (el) el.textContent = moeda(t.porColuna[c.id]); }
    $('[data-tot-geral]', raiz).textContent = moeda(t.total);
    $('[data-tot-final]', raiz).textContent = moeda(t.total);
    $('[data-meta-resumo]', raiz).innerHTML = resumoMeta(p, t);
  }

  /** estrutural: redesenha a tabela (linhas/colunas mudaram); senão só atualiza os totais, mantendo o foco. */
  function salvarPlano(p, estrutural = false) {
    p.atualizadoEm = Date.now();
    if (estrutural) render(); else atualizarTotaisPlano(p);
    sincronizar();
  }

  function focarCelula(r, c) {
    const el = $(`#planos input[data-r="${r}"][data-c="${c}"]`);
    if (el) { el.focus(); el.select(); }
    return !!el;
  }

  function acaoPlano(acao, id) {
    if (acao === 'novo' || acao === 'exemplo') {
      const p = N.novoPlano({ exemplo: acao === 'exemplo' });
      dados.planos.push(p);
      sincronizar();
      location.hash = '#planos/' + encodeURIComponent(p.id);
      if (acao === 'novo') setTimeout(() => $('#planos .titulo-plano')?.select(), 50);
      return;
    }
    const p = planoAtual();
    if (!p) return;
    const antes = structuredClone(p);
    const desfazer = () => { Object.assign(p, antes); salvarPlano(p, true); };
    const temValores = (fn) => p.linhas.some((l) => Object.entries(l.valores).some(([k, v]) => fn(l, k) && v));
    if (acao === 'add-lin') {
      p.linhas.push({ id: N.novoId(), nome: '', valores: {} });
      salvarPlano(p, true);
      return focarCelula(p.linhas.length - 1, -1);
    }
    if (acao === 'add-col') {
      p.colunas.push({ id: N.novoId(), nome: `${p.colunas.length + 1}º ano` });
      salvarPlano(p, true);
      return focarCelula(-1, p.colunas.length - 1);
    }
    if (acao === 'rem-lin') {
      const l = p.linhas.find((x) => x.id === id);
      p.linhas = p.linhas.filter((x) => x.id !== id);
      if (!p.linhas.length) p.linhas.push({ id: N.novoId(), nome: '', valores: {} });
      salvarPlano(p, true);
      if (l && (l.nome || Object.keys(l.valores).length)) toast('Linha removida.', { acao: desfazer });
      return;
    }
    if (acao === 'rem-col') {
      const tinha = temValores((l, k) => k === id);
      p.colunas = p.colunas.filter((c) => c.id !== id);
      p.linhas.forEach((l) => { delete l.valores[id]; });
      salvarPlano(p, true);
      if (tinha) toast('Coluna removida.', { acao: desfazer });
      return;
    }
    if (acao === 'csv') return baixar(`${p.titulo.replace(/[\\/:*?"<>|]+/g, '-') || 'planejamento'}.csv`, N.csvPlano(p), 'text/csv;charset=utf-8');
    if (acao === 'duplicar') {
      const copia = N.limparPlano({ ...structuredClone(p), id: N.novoId(), titulo: `${p.titulo} (cópia)`, criadoEm: Date.now(), atualizadoEm: Date.now() });
      dados.planos.push(copia);
      sincronizar();
      location.hash = '#planos/' + encodeURIComponent(copia.id);
      return toast('Planejamento duplicado.');
    }
    if (acao === 'excluir') {
      const lista = dados.planos;
      dados.planos = lista.filter((x) => x.id !== p.id);
      sincronizar();
      location.hash = '#planos';
      toast(`“${p.titulo}” excluído.`, { acao: () => { dados.planos = lista; sincronizar(); location.hash = '#planos/' + encodeURIComponent(p.id); } });
    }
  }

  function ligarPlanos() {
    const raiz = $('#planos');
    raiz.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]');
      if (b) acaoPlano(b.dataset.p, b.dataset.id);
    });
    raiz.addEventListener('focusin', (e) => { if (e.target.matches('input.valor, #plano-meta')) e.target.select(); });
    raiz.addEventListener('change', (e) => {
      const p = planoAtual();
      const el = e.target;
      if (!p) return;
      if (el.dataset.campo === 'titulo') { p.titulo = el.value.trim().slice(0, 120) || 'Planejamento'; el.value = p.titulo; return salvarPlano(p); }
      if (el.dataset.campo === 'obs') { p.obs = el.value.trim().slice(0, 1000); return salvarPlano(p); }
      if (el.dataset.colNome) { const c = p.colunas.find((x) => x.id === el.dataset.colNome); if (c) c.nome = el.value.trim().slice(0, 80); return salvarPlano(p); }
      if (el.dataset.linNome) { const l = p.linhas.find((x) => x.id === el.dataset.linNome); if (l) l.nome = el.value.trim().slice(0, 80); return salvarPlano(p); }
      const txt = el.value.trim();
      const centavos = txt ? N.lerValor(txt) : null;
      if (txt && Number.isNaN(centavos)) {
        toast(`“${txt}” não é um valor. Use, por exemplo, 18.000,00.`, { erro: true });
        el.setAttribute('aria-invalid', 'true');
        return;
      }
      el.removeAttribute('aria-invalid');
      if (el.dataset.campo === 'meta') {
        p.meta = centavos > 0 ? centavos : null;
        el.value = campoValor(p.meta);
        return salvarPlano(p);
      }
      if (el.dataset.lin) {
        const l = p.linhas.find((x) => x.id === el.dataset.lin);
        if (!l) return;
        if (centavos == null || centavos === 0) delete l.valores[el.dataset.col]; else l.valores[el.dataset.col] = centavos;
        el.value = campoValor(l.valores[el.dataset.col]);
        salvarPlano(p);
      }
    });
    // Enter desce para a mesma coluna na linha de baixo (como numa planilha); na última linha, cria uma nova.
    raiz.addEventListener('keydown', (e) => {
      const el = e.target;
      if (e.key !== 'Enter' || !el.matches('input[data-r]')) return;
      e.preventDefault();
      el.dispatchEvent(new Event('change', { bubbles: true }));
      const r = Number(el.dataset.r) + (e.shiftKey ? -1 : 1), c = Number(el.dataset.c);
      if (!focarCelula(r, c) && !e.shiftKey && r >= 0) {
        const p = planoAtual();
        if (p && p.linhas.length < N.LIMITES_PLANO.linhas) { acaoPlano('add-lin'); focarCelula(r, c); }
      }
    });
  }

  // ---------- conta ----------
  function trocarSenha({ obrigatoria = false } = {}) {
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-senha" novalidate>
        <div class="cab-modal"><h2 id="t-senha">${obrigatoria ? 'Crie a sua senha' : 'Trocar senha'}</h2>
          ${obrigatoria ? '' : '<button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button>'}</div>
        ${obrigatoria ? '<p style="margin-top:0">Você entrou com uma senha temporária. Defina uma senha só sua para continuar.</p>' : ''}
        <input type="text" autocomplete="username" value="${esc(eu.login)}" hidden>
        <div class="grade-form">
          <div class="inteiro"><label class="rotulo" for="s-atual">${obrigatoria ? 'Senha temporária' : 'Senha atual'}</label>
            <input type="password" id="s-atual" autocomplete="current-password" required></div>
          <div><label class="rotulo" for="s-nova">Nova senha <small>(mínimo 8 caracteres)</small></label>
            <input type="password" id="s-nova" autocomplete="new-password" minlength="8" required></div>
          <div><label class="rotulo" for="s-conf">Repita a nova senha</label>
            <input type="password" id="s-conf" autocomplete="new-password" required></div>
        </div>
        <p class="erro-campo" id="s-erro" role="alert"></p>
        <div class="rodape-modal">
          ${obrigatoria ? '<button type="button" class="btn fantasma" data-sair>Sair</button>' : '<button type="button" class="btn sec" data-fechar>Cancelar</button>'}
          <button class="btn">${ic('check')} Salvar senha</button>
        </div>
      </form>`, { estreito: true, fixo: obrigatoria });
    modal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const atual = $('#s-atual', modal).value, nova = $('#s-nova', modal).value;
      const erro = (m) => { $('#s-erro', modal).textContent = m; };
      if (nova.length < 8) return erro('A nova senha precisa ter pelo menos 8 caracteres.');
      if (nova !== $('#s-conf', modal).value) return erro('As duas senhas novas não são iguais.');
      try {
        await api('POST', '/api/eu/senha', { atual, nova });
        eu.trocarSenha = false;
        fechar();
        toast('Senha atualizada.');
      } catch (er) { erro(er.message); }
    });
  }

  async function sair() {
    if (sinc.ocupado || sinc.estado === 'erro') {
      const ok = await confirmar({ titulo: 'Sair agora?', texto: 'A última alteração ainda não foi salva no servidor e pode se perder.', botao: 'Sair mesmo assim', perigo: true });
      if (!ok) return;
    }
    try { await api('POST', '/api/logout', {}); } catch { /* sai de qualquer forma */ }
    location.replace('/entrar');
  }

  // ---------- administração de usuários (só admin) ----------
  const dataHora = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
  const iniciais = (nome) => String(nome || '?').trim().split(/\s+/).filter((p) => !/^(da|de|do|das|dos|e)$/i.test(p)).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  let usuarios = [];

  let configAssin = { mensalidade: 1199, precos: N.PRECOS_PADRAO, diasAviso: 5, mensagem: '', mensagemPadrao: '' };
  const planoDe = (u) => (N.PLANO_ASSINATURA[u.plano] ? u.plano : 'pf');
  const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
  const precisaAtencao = (u) => u.ativo && ['aviso', 'hoje', 'vencida'].includes(u.assinatura?.cod);

  function tagAssinatura(u) {
    const a = u.assinatura || {};
    if (a.cod === 'isento') return '<span class="suave">—</span>';
    if (a.cod === 'pendente') return `<span class="tag neutra" title="Os 30 dias começam no primeiro acesso">${ic('relogio')} Começa no 1º acesso</span>`;
    const ate = `<small class="venc-data">até ${dataBR(u.assinaturaVence)}</small>`;
    if (a.cod === 'vencida') return `<span class="tag erro">${ic('alerta')} Vencida há ${-a.dias} ${a.dias === -1 ? 'dia' : 'dias'}</span>${ate}`;
    if (a.cod === 'hoje') return `<span class="tag erro">${ic('alerta')} Vence hoje</span>${ate}`;
    if (a.cod === 'aviso') return `<span class="tag aviso">${ic('relogio')} Vence em ${a.dias} ${a.dias === 1 ? 'dia' : 'dias'}</span>${ate}`;
    return `<span class="tag ok">${ic('check')} Em dia</span>${ate}`;
  }

  function seloAssinaturas(lista) {
    const n = lista.filter(precisaAtencao).length;
    const c = $('#cont-assinaturas');
    c.hidden = !n; c.textContent = n; c.title = `${n} assinatura(s) vencendo ou vencida(s)`;
  }

  async function renderUsuarios() {
    const corpo = $('#tabela-usuarios');
    if (!usuarios.length) corpo.innerHTML = '<tbody><tr><td>Carregando…</td></tr></tbody>';
    try {
      const [lista, aud, cfg] = await Promise.all([api('GET', '/api/admin/usuarios'), api('GET', '/api/admin/auditoria?limite=100'), api('GET', '/api/admin/config')]);
      usuarios = lista; configAssin = cfg;
      seloAssinaturas(lista);
      const ativos = lista.filter((u) => u.ativo).length;
      $('#resumo-usuarios').textContent = `${lista.length} ${lista.length === 1 ? 'conta' : 'contas'} · ${ativos} ${ativos === 1 ? 'ativa' : 'ativas'}${lista.length - ativos ? ` · ${lista.length - ativos} bloqueada(s)` : ''}`;

      const atencao = lista.filter(precisaAtencao).sort((a, b) => a.assinatura.dias - b.assinatura.dias);
      $('#aviso-assinaturas').innerHTML = atencao.length ? `<div class="aviso-box ${atencao.some((u) => u.assinatura.cod !== 'aviso') ? 'alerta' : 'cuidado'}">${ic('alerta')}
        <div><b>${atencao.length} ${atencao.length === 1 ? 'assinatura precisa' : 'assinaturas precisam'} de atenção.</b>
        Confirme se renovaram; se não, envie o aviso ou bloqueie o acesso.
        <ul class="lista-atencao">${atencao.map((u) => `<li><b>${esc(u.nome)}</b> · ${u.assinatura.cod === 'vencida' ? `venceu em ${dataBR(u.assinaturaVence)}` : u.assinatura.cod === 'hoje' ? 'vence hoje' : `vence em ${dataBR(u.assinaturaVence)}`}
          <span class="acoes-atencao"><button type="button" class="btn sec peq" data-usr="aviso" data-uid="${u.id}">${ic('mensagem')} Enviar aviso</button>
          <button type="button" class="btn sec peq" data-usr="renovar" data-uid="${u.id}">${ic('repetir')} Renovou</button></span></li>`).join('')}</ul></div></div>` : '';

      corpo.innerHTML = `<thead><tr><th>Usuário</th><th>Situação</th><th>Plano e período</th><th>Assinatura</th><th class="esconder-cel">Último acesso</th><th></th></tr></thead><tbody>${lista.map((u) => {
        const souEu = u.id === eu.id;
        const assinante = u.perfil !== 'admin';
        return `<tr class="${u.ativo ? '' : 'inativo'} ${precisaAtencao(u) ? 'atencao' : ''}">
          <td><div class="pessoa"><span class="av">${esc(iniciais(u.nome))}</span><div><b>${esc(u.nome)}${souEu ? ' <span class="tag info">você</span>' : ''}</b><small>${esc(u.login)}${u.perfil === 'admin' ? ' · <span class="txt-admin">administrador</span>' : ''}</small></div></div></td>
          <td>${!u.ativo ? `<span class="tag erro">${ic('cadeado')} Bloqueado</span>`
            : u.trocarSenha ? `<span class="tag aviso">${ic('relogio')} ${u.ultimoAcesso ? 'Senha temporária' : 'Aguardando 1º acesso'}</span>`
            : `<span class="tag ok">${ic('check')} Ativo</span>`}</td>
          <td>${tagPlano(u)}</td>
          <td class="cel-assin">${tagAssinatura(u)}</td>
          <td class="esconder-cel">${u.ultimoAcesso ? esc(dataHora(u.ultimoAcesso)) : '<span class="suave">Nunca entrou</span>'}</td>
          <td class="acoes">
            ${assinante && u.assinaturaVence ? `<button type="button" class="btn fantasma icone peq aviso-msg" data-usr="aviso" data-uid="${u.id}" title="Enviar aviso de vencimento" aria-label="Enviar aviso de vencimento para ${esc(u.nome)}">${ic('mensagem')}</button>` : ''}
            ${assinante ? `<button type="button" class="btn fantasma icone peq" data-usr="renovar" data-uid="${u.id}" title="Renovou" aria-label="Registrar renovação de ${esc(u.nome)}">${ic('repetir')}</button>` : ''}
            <button type="button" class="btn fantasma icone peq" data-usr="editar" data-uid="${u.id}" title="Editar" aria-label="Editar ${esc(u.nome)}">${ic('editar')}</button>
            ${souEu ? '' : `
            <button type="button" class="btn fantasma icone peq" data-usr="senha" data-uid="${u.id}" title="Redefinir senha" aria-label="Redefinir senha de ${esc(u.nome)}">${ic('chave')}</button>
            <button type="button" class="btn fantasma icone peq" data-usr="${u.ativo ? 'bloquear' : 'desbloquear'}" data-uid="${u.id}" title="${u.ativo ? 'Bloquear' : 'Desbloquear'}" aria-label="${u.ativo ? 'Bloquear' : 'Desbloquear'} ${esc(u.nome)}">${ic(u.ativo ? 'cadeado' : 'destravar')}</button>
            <button type="button" class="btn fantasma icone peq apagar" data-usr="excluir" data-uid="${u.id}" title="Excluir" aria-label="Excluir ${esc(u.nome)}">${ic('lixo')}</button>`}
          </td></tr>`;
      }).join('')}</tbody>`;

      if (!$('#cfg-assin').contains(document.activeElement)) {
        desenharPrecos(cfg.precos);
        $('#cfg-whats').value = formatarTelefone(cfg.whatsappAR);
        $('#cfg-dias').value = cfg.diasAviso;
        $('#cfg-msg').value = cfg.mensagem;
      }
      $('#auditoria').innerHTML = aud.length
        ? aud.map((a) => `<li><time>${esc(dataHora(a.criado_em))}</time><span><b>${esc(a.usuario)}</b> ${esc(a.acao)}${a.detalhe ? ` · <span class="suave">${esc(a.detalhe)}</span>` : ''}</span></li>`).join('')
        : '<li><span class="suave">Nenhuma atividade ainda.</span></li>';
    } catch (e) {
      corpo.innerHTML = `<tbody><tr><td class="txt-erro">${esc(e.message)}</td></tr></tbody>`;
    }
  }

  function tagPlano(u) {
    if (u.perfil === 'admin') return '<span class="suave">—</span>';
    const pl = N.PLANO_ASSINATURA[planoDe(u)], pe = N.PERIODO[u.periodo] || N.PERIODO.mensal;
    const valor = u.ultimoValor != null ? u.ultimoValor : N.precoPeriodo(configAssin.precos, pl.id, pe.id).total;
    return `<span class="tag ${pl.empresa ? 'indigo' : 'info'}">${pl.empresa ? `${esc(pl.nome)} · ` : ''}${esc(pe.nome)} · ${moeda(valor)}</span>${u.ultimaRenovacao ? `<small class="venc-data">renovou em ${dataBR(u.ultimaRenovacao)}</small>` : ''}`;
  }

  // Tabela editável de preços (planos × períodos), com valor por mês e desconto calculados na hora.
  function desenharPrecos(precos) {
    const celula = (pl, pe) => `<td><span class="campo-valor peq"><span>R$</span><input type="text" inputmode="decimal" data-preco="${pl.id}|${pe.id}" value="${N.valorParaCampo(precos[pl.id][pe.id])}" aria-label="${esc(pl.nome)} ${esc(pe.nome)}"></span><small data-preco-info="${pl.id}|${pe.id}"></small></td>`;
    $('#cfg-precos').innerHTML = `<thead><tr><th scope="col">Plano</th>${N.PERIODOS.map((pe) => `<th scope="col">${esc(pe.nome)}<small>${pe.dias} dias</small></th>`).join('')}</tr></thead>
      <tbody>${N.PLANOS_ASSINATURA.map((pl) => `<tr><th scope="row"><b>${pl.empresa ? `Empresas · ${esc(pl.nome)}` : esc(pl.nome)}</b><small>${esc(pl.det)}</small></th>${N.PERIODOS.map((pe) => celula(pl, pe)).join('')}</tr>`).join('')}</tbody>`;
    infoPrecos();
  }
  function lerPrecos() {
    const r = {};
    for (const i of $$('#cfg-precos [data-preco]')) {
      const [pl, pe] = i.dataset.preco.split('|');
      (r[pl] ||= {})[pe] = N.lerValor(i.value);
    }
    return r;
  }
  function infoPrecos() {
    const precos = lerPrecos();
    for (const el of $$('#cfg-precos [data-preco-info]')) {
      const [pl, pe] = el.dataset.precoInfo.split('|');
      const ok = Object.values(precos[pl]).every((v) => v > 0);
      if (!ok) { el.innerHTML = precos[pl][pe] > 0 ? '' : '<span class="txt-erro">valor inválido</span>'; continue; }
      const p = N.precoPeriodo(precos, pl, pe);
      el.innerHTML = pe === 'mensal' ? 'por mês' : `${moeda(p.porMes)}/mês${p.desconto ? ` · <span class="eco">−${p.desconto}%</span>` : ''}`;
    }
  }

  /** Preenche a mensagem padrão com os dados do usuário. */
  function montarMensagem(u, modelo = configAssin.mensagem, precos = configAssin.precos) {
    const a = u.assinatura || {};
    const prazo = a.cod === 'vencida' ? `venceu há ${-a.dias} ${a.dias === -1 ? 'dia' : 'dias'}`
      : a.cod === 'hoje' ? 'hoje' : a.dias === 1 ? 'amanhã' : `daqui a ${a.dias} dias`;
    const plano = planoDe(u);
    const valores = {
      nome: String(u.nome || '').trim().split(/\s+/)[0], vencimento: dataBR(u.assinaturaVence), prazo, valor: moeda(precos[plano].mensal),
      opcoes: N.opcoesAssinatura(precos, plano), periodo: (N.PERIODO[u.periodo] || N.PERIODO.mensal).nome.toLowerCase(),
    };
    return modelo.replace(/\{(nome|vencimento|prazo|valor|opcoes|periodo)\}/g, (_, k) => valores[k]);
  }

  function enviarAviso(u) {
    const tel = String(u.telefone || '').replace(/\D/g, '');
    const telIntl = tel && (tel.length <= 11 ? '55' + tel : tel);
    const email = /@/.test(u.login) ? u.login : '';
    const { modal } = abrirModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-aviso">
        <div class="cab-modal"><h2 id="t-aviso">Aviso de vencimento</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <p style="margin-top:0">Para <b>${esc(u.nome)}</b> · assinatura ${u.assinatura.cod === 'vencida' ? 'venceu' : 'vence'} em <b>${dataBR(u.assinaturaVence)}</b> · plano atual ${tagPlano(u)}</p>
        <label class="rotulo" for="aviso-texto">Mensagem <small>(pode ajustar antes de enviar)</small></label>
        <textarea id="aviso-texto" rows="12">${esc(montarMensagem(u))}</textarea>
        <div class="canais">
          <button type="button" class="btn whats" data-canal="whatsapp">${ic('mensagem')} WhatsApp${tel ? '' : ' (escolher contato)'}</button>
          ${email ? `<button type="button" class="btn sec" data-canal="email">${ic('email')} E-mail</button>` : ''}
          <button type="button" class="btn sec" data-canal="copiar">${ic('copiar')} Copiar texto</button>
        </div>
        <p class="dica">${tel ? `WhatsApp abre a conversa com ${esc(formatarTelefone(tel))}.` : 'Sem telefone cadastrado: o WhatsApp abre para você escolher o contato. Cadastre o telefone em “Editar”.'}</p>
      </div>`, { estreito: true });
    modal.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-canal]');
      if (!b) return;
      const texto = $('#aviso-texto', modal).value.trim();
      if (b.dataset.canal === 'whatsapp') window.open(`https://wa.me/${telIntl || ''}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
      if (b.dataset.canal === 'email') location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Sua assinatura do Vértice')}&body=${encodeURIComponent(texto)}`;
      if (b.dataset.canal === 'copiar') {
        try { await navigator.clipboard.writeText(texto); toast('Mensagem copiada.'); } catch { toast('Não foi possível copiar. Selecione o texto e copie.', { erro: true }); }
      }
    });
  }

  function formatarTelefone(t) {
    const d = String(t || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
  }

  function ligarConfigAssinaturas() {
    const form = $('#cfg-assin');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const precos = lerPrecos();
      const ruim = $$('#cfg-precos [data-preco]').find((i) => !(N.lerValor(i.value) > 0));
      if (ruim) { ruim.focus(); return toast('Confira os preços: todos precisam ser maiores que zero, por exemplo 11,99.', { erro: true }); }
      try {
        configAssin = { ...configAssin, ...(await api('PUT', '/api/admin/config', {
          precos, diasAviso: Math.floor(+$('#cfg-dias').value), mensagem: $('#cfg-msg').value, whatsappAR: $('#cfg-whats').value.trim(),
        })) };
        toast('Configurações de assinatura salvas.');
        renderUsuarios();
      } catch (er) { toast(er.message, { erro: true }); }
    });
    $('#cfg-precos').addEventListener('input', infoPrecos);
    $('#cfg-precos').addEventListener('change', (e) => { const i = e.target.closest('[data-preco]'); const v = i && N.lerValor(i.value); if (v > 0) i.value = N.valorParaCampo(v); });
    $('#cfg-padrao').addEventListener('click', () => { $('#cfg-msg').value = configAssin.mensagemPadrao; $('#cfg-msg').focus(); });
    $('#cfg-previa').addEventListener('click', () => {
      const exemplo = { nome: 'Maria Clara', plano: 'pf', periodo: 'mensal', assinaturaVence: new Date(Date.now() + 3 * 864e5).toLocaleDateString('sv-SE'), assinatura: { cod: 'aviso', dias: 3 } };
      const precos = N.limparPrecos(lerPrecos()) || configAssin.precos;
      const txt = montarMensagem(exemplo, $('#cfg-msg').value, precos);
      abrirModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-previa"><div class="cab-modal"><h2 id="t-previa">Prévia da mensagem</h2>
        <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="previa-msg">${esc(txt)}</div><div class="rodape-modal"><button type="button" class="btn" data-fechar>Fechar</button></div></div>`, { estreito: true });
    });
  }

  function mostrarSenha(titulo, u, senha) {
    const { modal } = abrirModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-tmp">
        <div class="cab-modal"><h2 id="t-tmp">${esc(titulo)}</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <p style="margin-top:0">Envie estes dados para <b>${esc(u.nome)}</b>. A senha é temporária: no primeiro acesso, o sistema pede uma senha nova.</p>
        <p style="margin:.3em 0 0"><span class="suave">Endereço:</span> <b>${esc(location.origin)}</b><br><span class="suave">Login:</span> <b>${esc(u.login)}</b></p>
        <div class="senha-gerada"><code>${esc(senha)}</code><button type="button" class="btn sec peq" data-copiar>${ic('copiar')} Copiar acesso</button></div>
        <p class="dica">Por segurança, esta senha não aparece de novo. Se perder, use “Redefinir senha”.</p>
        <div class="rodape-modal"><button type="button" class="btn" data-fechar>Pronto</button></div>
      </div>`, { estreito: true });
    $('[data-copiar]', modal).addEventListener('click', async () => {
      const txt = `Seu acesso ao Vértice\nEndereço: ${location.origin}\nLogin: ${u.login}\nSenha temporária: ${senha}`;
      try { await navigator.clipboard.writeText(txt); toast('Acesso copiado.'); } catch { toast('Não foi possível copiar. Selecione e copie a senha.', { erro: true }); }
    });
  }

  function renovarAssinatura(u, { url = `/api/admin/usuarios/${u.id}/renovar`, depois = renderUsuarios } = {}) {
    const plano = planoDe(u), pl = N.PLANO_ASSINATURA[plano];
    const hoje = new Date().toLocaleDateString('sv-SE');
    const base = u.assinaturaVence && u.assinaturaVence > hoje ? u.assinaturaVence : hoje;
    const somar = (iso, dias) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); };
    const inicial = N.PERIODO[u.periodo] ? u.periodo : 'mensal';
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-renov" novalidate>
        <div class="cab-modal"><h2 id="t-renov">Renovar assinatura</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <p class="suave" style="margin-top:0"><b>${esc(u.nome)}</b> · ${esc(pl.empresa ? `Empresas · ${pl.nome}` : pl.nome)} · ${u.assinaturaVence ? `${u.assinatura?.cod === 'vencida' ? 'venceu' : 'vence'} em ${dataBR(u.assinaturaVence)}` : 'ainda não começou'}</p>
        <fieldset class="periodos"><legend class="rotulo">Período pago</legend>
          ${N.PERIODOS.map((pe) => {
            const p = N.precoPeriodo(configAssin.precos, plano, pe.id);
            return `<label class="periodo">${p.desconto ? `<span class="eco-tag">−${p.desconto}%</span>` : ''}<input type="radio" name="periodo" value="${pe.id}" ${pe.id === inicial ? 'checked' : ''}>
              <b>${esc(pe.nome)}</b><span class="v">${moeda(p.total)}</span><small>${pe.meses > 1 ? `${moeda(p.porMes)}/mês` : `+${pe.dias} dias`}</small></label>`;
          }).join('')}
        </fieldset>
        <div class="grade-form" style="margin-top:.9em"><div><label class="rotulo" for="renov-valor">Valor recebido</label>
          <div class="campo-valor"><span>R$</span><input type="text" id="renov-valor" inputmode="decimal"></div></div></div>
        <div class="resumo-renov" id="renov-resumo"></div>
        <p class="erro-campo" id="renov-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} Confirmar renovação</button></div>
      </form>`);
    const periodo = () => $('input[name=periodo]:checked', modal).value;
    const atualizar = (trocouPeriodo) => {
      const pe = N.PERIODO[periodo()];
      if (trocouPeriodo) $('#renov-valor', modal).value = N.valorParaCampo(N.precoPeriodo(configAssin.precos, plano, pe.id).total);
      const v = N.lerValor($('#renov-valor', modal).value);
      $('#renov-resumo', modal).innerHTML = `${ic('calendario')} Nova validade: <b>${dataBR(base)} → ${dataBR(somar(base, pe.dias))}</b> (${pe.dias} dias contados ${base === hoje ? 'a partir de hoje' : 'a partir do vencimento atual'}) · valor registrado <b>${Number.isInteger(v) && v >= 0 ? moeda(v) : '—'}</b>`;
    };
    atualizar(true);
    modal.addEventListener('change', (e) => { if (e.target.name === 'periodo') atualizar(true); });
    $('#renov-valor', modal).addEventListener('input', () => atualizar(false));
    modal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const valor = N.lerValor($('#renov-valor', modal).value);
      if (!(Number.isInteger(valor) && valor >= 0)) { $('#renov-erro', modal).textContent = 'Informe o valor recebido, por exemplo 59,94.'; return; }
      try {
        const r = await api('POST', url, { periodo: periodo(), valor });
        fechar();
        const pe = N.PERIODO[r.periodo].nome.toLowerCase();
        if (!u.ativo) toast(`Renovada (${pe}) até ${dataBR(r.assinaturaVence)}. O acesso continua bloqueado: use “Desbloquear”.`, { tempo: 8000 });
        else toast(`Assinatura ${pe} renovada até ${dataBR(r.assinaturaVence)}.`);
        depois();
      } catch (er) { $('#renov-erro', modal).textContent = er.message; }
    });
  }

  function formUsuario(u = null) {
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-usr" novalidate autocomplete="off">
        <div class="cab-modal"><h2 id="t-usr">${u ? 'Editar usuário' : 'Novo usuário'}</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="grade-form">
          <div class="inteiro"><label class="rotulo" for="u-nome">Nome</label><input type="text" id="u-nome" maxlength="120" value="${esc(u?.nome || '')}" required></div>
          <div class="inteiro"><label class="rotulo" for="u-login">Login <small>(pode ser o e-mail)</small></label>
            <input type="text" id="u-login" maxlength="80" autocapitalize="none" spellcheck="false" value="${esc(u?.login || '')}" ${u ? 'disabled' : 'required'}></div>
          <div class="${u && u.perfil !== 'admin' ? '' : 'inteiro'}"><label class="rotulo" for="u-tel">Telefone / WhatsApp <small>(opcional)</small></label>
            <input type="text" id="u-tel" inputmode="tel" maxlength="20" placeholder="(11) 98765-4321" value="${esc(formatarTelefone(u?.telefone))}"></div>
          ${u && u.perfil !== 'admin' ? `<div><label class="rotulo" for="u-venc">Assinatura vence em</label>
            <input type="date" id="u-venc" value="${esc(u.assinaturaVence || '')}"></div>` : ''}
          <fieldset class="inteiro pilulas"${u && u.id === eu.id ? ' disabled' : ''}>
            <legend class="rotulo" style="padding:0;margin-bottom:.45em">Perfil</legend>
            <label><input type="radio" name="perfil" value="usuario" ${u?.perfil === 'admin' ? '' : 'checked'}><span>Usuário</span></label>
            <label><input type="radio" name="perfil" value="admin" ${u?.perfil === 'admin' ? 'checked' : ''}><span>Administrador</span></label>
          </fieldset>
          <p class="inteiro dica" style="margin:0">${u ? '' : 'A assinatura de 30 dias começa no primeiro acesso. '}Administradores não têm assinatura e não veem os lançamentos de ninguém.</p>
        </div>
        <p class="erro-campo" id="u-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button>
          <button class="btn">${ic('check')} ${u ? 'Salvar' : 'Criar usuário'}</button></div>
      </form>`, { estreito: true });
    modal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = $('#u-nome', modal).value.trim();
      const perfil = $('input[name=perfil]:checked', modal).value;
      const telefone = $('#u-tel', modal).value.trim();
      try {
        if (u) {
          const dados = { nome, perfil, telefone };
          if ($('#u-venc', modal)) dados.assinaturaVence = $('#u-venc', modal).value || null;
          await api('PUT', `/api/admin/usuarios/${u.id}`, dados);
          renderUsuarios();
          if (u.id === eu.id) eu.nome = nome;
          fechar(); toast('Usuário atualizado.'); render();
        } else {
          const login = $('#u-login', modal).value.trim();
          const r = await api('POST', '/api/admin/usuarios', { nome, login, perfil, telefone });
          fechar(); renderUsuarios();
          mostrarSenha('Usuário criado', { nome, login: r.login }, r.senhaTemporaria);
        }
      } catch (er) { $('#u-erro', modal).textContent = er.message; }
    });
  }

  async function acaoUsuario(acao, id) {
    const u = usuarios.find((x) => x.id === id) || usuariosEmpresa.find((x) => x.id === id);
    const daEmpresa = !usuarios.includes(u);
    const atualizarAdmin = () => (daEmpresa ? renderEmpresas() : renderUsuarios());
    if (!u) return;
    try {
      if (acao === 'editar') return daEmpresa ? formUsuarioEmpresa(empSel(), u) : formUsuario(u);
      if (acao === 'aviso') return enviarAviso(u);
      if (acao === 'renovar') return renovarAssinatura(u);
      if (acao === 'senha') {
        const ok = await confirmar({ titulo: 'Redefinir senha?', botao: 'Gerar senha temporária',
          texto: `<b>${esc(u.nome)}</b> sai de todos os dispositivos e só entra de novo com a senha temporária que vamos gerar agora.` });
        if (!ok) return;
        const r = await api('POST', `/api/admin/usuarios/${id}/senha`, {});
        atualizarAdmin();
        return mostrarSenha('Senha redefinida', u, r.senhaTemporaria);
      }
      if (acao === 'bloquear' || acao === 'desbloquear') {
        const bloquear = acao === 'bloquear';
        const ok = await confirmar({ titulo: bloquear ? 'Bloquear acesso?' : 'Desbloquear acesso?', perigo: bloquear,
          botao: bloquear ? 'Bloquear' : 'Desbloquear',
          texto: bloquear ? `<b>${esc(u.nome)}</b> sai imediatamente e não consegue mais entrar. Os dados dele ficam guardados e voltam se você desbloquear.`
            : `<b>${esc(u.nome)}</b> volta a entrar com a senha que já tinha.` });
        if (!ok) return;
        await api('PUT', `/api/admin/usuarios/${id}`, { ativo: !bloquear });
        toast(bloquear ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
        return atualizarAdmin();
      }
      if (acao === 'excluir') {
        const ok = await confirmar({ titulo: 'Excluir usuário?', perigo: true, botao: 'Excluir definitivamente', palavra: u.login,
          texto: daEmpresa ? `A conta de <b>${esc(u.nome)}</b> será apagada. Os lançamentos da empresa continuam.` : `A conta de <b>${esc(u.nome)}</b> e <b>todos os lançamentos dela</b> serão apagados. Isso não pode ser desfeito. Se quiser só impedir o acesso, use “Bloquear”.` });
        if (!ok) return;
        await api('DELETE', `/api/admin/usuarios/${id}`, { confirmar: u.login });
        toast('Usuário excluído.');
        return atualizarAdmin();
      }
    } catch (e) { toast(e.message, { erro: true }); }
  }

  // ---------- administração de empresas (só admin AR) ----------
  // A AR controla tudo: empresas, planos, assinaturas, usuários, papéis e centros de custo.
  const E = window.NucleoEmpresa;
  let empresas = [], usuariosEmpresa = [], solicitacoes = [];
  const empSel = () => empresas.find((x) => x.id === est.empresaSel);
  const cnpjBR = (c) => (c && c.length === 14 ? `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}` : c || '');
  const mensalEquivalente = (e) => {
    const pe = N.PERIODO[e.periodo] || N.PERIODO.mensal;
    const valor = e.ultimoValor != null ? e.ultimoValor : N.precoPeriodo(configAssin.precos, e.plano, pe.id).total;
    return Math.round(valor / pe.meses);
  };

  function seloEmpresas() {
    const n = empresas.filter((e) => e.ativo && ['aviso', 'hoje', 'vencida'].includes(e.assinatura?.cod)).length + solicitacoes.length;
    const c = $('#cont-empresas');
    c.hidden = !n; c.textContent = n; c.title = `${n} item(ns) precisando de atenção`;
  }

  async function renderEmpresas() {
    const raiz = $('#adm-empresas');
    if (!empresas.length) raiz.innerHTML = '<div class="cartao"><p class="suave">Carregando…</p></div>';
    try {
      const [lista, sol, cfg] = await Promise.all([api('GET', '/api/admin/empresas'), api('GET', '/api/admin/solicitacoes'), api('GET', '/api/admin/config')]);
      empresas = lista; solicitacoes = sol; configAssin = cfg;
      if (est.empresaSel && !empSel()) est.empresaSel = null;
      if (!est.empresaSel && empresas.length) est.empresaSel = empresas[0].id;
      usuariosEmpresa = est.empresaSel ? await api('GET', `/api/admin/empresas/${est.empresaSel}/usuarios`) : [];
    } catch (e) { raiz.innerHTML = `<div class="cartao"><p class="txt-erro">${esc(e.message)}</p></div>`; return; }
    seloEmpresas();
    const ativas = empresas.filter((e) => e.ativo);
    const atencao = ativas.filter((e) => ['aviso', 'hoje', 'vencida'].includes(e.assinatura?.cod));
    const totUsuarios = empresas.reduce((a, e) => a + e.usuarios, 0);
    const receita = ativas.reduce((a, e) => a + mensalEquivalente(e), 0);
    const e = empSel();

    const linhas = empresas.map((x) => {
      const pl = N.PLANO_ASSINATURA[x.plano], pe = N.PERIODO[x.periodo];
      const valor = x.ultimoValor != null ? x.ultimoValor : N.precoPeriodo(configAssin.precos, x.plano, x.periodo).total;
      return `<tr class="${x.id === est.empresaSel ? 'sel-linha' : ''} ${x.ativo ? '' : 'inativo'}" data-emp="${x.id}">
        <td><div class="pessoa"><span class="av">${esc(iniciais(x.nome))}</span><div><b>${esc(x.nome)}</b><small>${x.cnpj ? `CNPJ ${esc(cnpjBR(x.cnpj))}` : 'sem CNPJ'}</small></div></div></td>
        <td><span class="tag indigo">${esc(pl.nome)} · ${esc(pe.nome)} · ${moeda(valor)}</span></td>
        <td>${x.usuariosPagos} de ${x.limiteUsuarios}${x.usuarios - x.usuariosPagos ? ` <small class="suave">+ ${x.usuarios - x.usuariosPagos} leitura/bloq.</small>` : ''}</td>
        <td class="cel-assin">${tagAssinatura(x)}</td>
        <td>${x.ativo ? `<span class="tag ok">${ic('check')} Ativa</span>` : `<span class="tag erro">${ic('cadeado')} Bloqueada</span>`}${x.solicitacoes ? ` <span class="tag aviso" title="Solicitações abertas">${x.solicitacoes} pedido${x.solicitacoes > 1 ? 's' : ''}</span>` : ''}</td>
        <td class="acoes"><button type="button" class="btn fantasma icone peq" data-emp-abrir="${x.id}" title="Abrir" aria-label="Abrir ${esc(x.nome)}">${ic('dir')}</button></td></tr>`;
    }).join('');

    const nomeCentros = (u) => (u.papel !== 'gestor' ? 'Todos' : u.centros.map((id) => e?.centros.find((c) => c.id === id)?.nome || '?').join(', '));
    const usuariosHtml = usuariosEmpresa.map((u) => `<tr class="${u.ativo ? '' : 'inativo'}">
        <td><div class="pessoa"><span class="av">${esc(iniciais(u.nome))}</span><div><b>${esc(u.nome)}</b><small>${esc(u.login)}</small></div></div></td>
        <td><span class="tag ${u.papel === 'dono' ? 'indigo' : u.papel === 'leitura' ? 'neutra' : 'info'}">${esc(E.PAPEL[u.papel].nome)}</span></td>
        <td>${esc(nomeCentros(u))}</td>
        <td>${!u.ativo ? `<span class="tag erro">${ic('cadeado')} Bloqueado</span>` : u.trocarSenha ? `<span class="tag aviso">${ic('relogio')} ${u.ultimoAcesso ? 'Senha temporária' : 'Aguardando 1º acesso'}</span>` : `<span class="tag ok">${ic('check')} Ativo</span>`}</td>
        <td class="esconder-cel">${u.ultimoAcesso ? esc(dataHora(u.ultimoAcesso)) : '<span class="suave">Nunca entrou</span>'}</td>
        <td class="acoes">
          <button type="button" class="btn fantasma icone peq" data-usr="editar" data-uid="${u.id}" title="Editar papel e acesso" aria-label="Editar ${esc(u.nome)}">${ic('editar')}</button>
          <button type="button" class="btn fantasma icone peq" data-usr="senha" data-uid="${u.id}" title="Redefinir senha" aria-label="Redefinir senha de ${esc(u.nome)}">${ic('chave')}</button>
          <button type="button" class="btn fantasma icone peq" data-usr="${u.ativo ? 'bloquear' : 'desbloquear'}" data-uid="${u.id}" title="${u.ativo ? 'Bloquear' : 'Desbloquear'}" aria-label="${u.ativo ? 'Bloquear' : 'Desbloquear'} ${esc(u.nome)}">${ic(u.ativo ? 'cadeado' : 'destravar')}</button>
          <button type="button" class="btn fantasma icone peq apagar" data-usr="excluir" data-uid="${u.id}" title="Excluir" aria-label="Excluir ${esc(u.nome)}">${ic('lixo')}</button>
        </td></tr>`).join('');

    const det = (s) => [s.detalhes.nome, s.detalhes.email, s.detalhes.papel && E.PAPEL[s.detalhes.papel]?.nome, s.detalhes.centro].filter(Boolean).map(esc).join(' · ');
    raiz.innerHTML = `
      ${solicitacoes.length ? `<div class="aviso-box cuidado">${ic('mensagem')}<div><b>${solicitacoes.length} ${solicitacoes.length === 1 ? 'solicitação aberta' : 'solicitações abertas'} de empresas.</b>
        <ul class="lista-atencao">${solicitacoes.map((s) => `<li><b>${esc(s.empresa)}</b> · ${esc(s.tipoNome)}${det(s) ? ` · ${det(s)}` : ''}${s.detalhes.mensagem ? ` · “${esc(s.detalhes.mensagem)}”` : ''}
          <small class="suave"> · ${esc(s.autor || '')}, ${esc(dataHora(s.criadoEm))}</small>
          <span class="acoes-atencao"><button type="button" class="btn sec peq" data-emp-abrir="${s.empresaId}">Abrir empresa</button>
          <button type="button" class="btn sec peq" data-sol-resolver="${s.id}">${ic('check')} Resolvida</button></span></li>`).join('')}</ul></div></div>` : ''}
      <div class="cards dash-cards" style="--n:4">
        <div class="kpi destaque dash-kpi"><span class="rot">Empresas clientes</span><div class="val">${empresas.length}</div><div class="det">${ativas.length} ${ativas.length === 1 ? 'ativa' : 'ativas'}${empresas.length - ativas.length ? ` · ${empresas.length - ativas.length} bloqueada(s)` : ''}</div></div>
        <div class="kpi dash-kpi"><span class="rot">Usuários de empresas</span><div class="val">${totUsuarios}</div><div class="det">em ${empresas.length} ${empresas.length === 1 ? 'empresa' : 'empresas'}</div></div>
        <div class="kpi verde dash-kpi"><span class="rot">Receita mensal Empresas</span><div class="val">${moeda(receita)}</div><div class="det">equivalente mensal das ativas</div></div>
        <div class="kpi ${atencao.length + solicitacoes.length ? 'vermelho' : ''} dash-kpi"><span class="rot">Atenção</span><div class="val">${atencao.length + solicitacoes.length}</div><div class="det">${atencao.length} vencendo ou vencida(s) · ${solicitacoes.length} pedido(s)</div></div>
      </div>
      <div class="cartao">
        <div class="cartao-cab"><div><h2><span class="bolha"><i data-ic="maleta"></i></span> Empresas</h2><p>Cada empresa tem plano, assinatura e usuários. Só a AR cria e altera.</p></div>
          <button type="button" class="btn" data-emp-nova>${ic('mais')} Nova empresa</button></div>
        ${empresas.length ? `<div class="tabela-wrap"><table class="t simples tab-empresas"><thead><tr><th>Empresa</th><th>Plano</th><th>Usuários</th><th>Assinatura</th><th>Situação</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>`
          : '<p class="suave">Nenhuma empresa ainda. Crie a primeira em “Nova empresa”.</p>'}
      </div>
      ${e ? `<div class="cartao emp-detalhe">
        <div class="cartao-cab"><div><h2><span class="bolha ciano"><i data-ic="usuarios"></i></span> ${esc(e.nome)} · usuários</h2>
          <p>Plano ${esc(N.PLANO_ASSINATURA[e.plano].nome)} · ${e.usuariosPagos} de ${e.limiteUsuarios} usuários · <b>papéis e acessos definidos só por você</b></p></div>
          <div class="linha">
            <button type="button" class="btn sec" data-emp-acao="editar">${ic('editar')} Empresa e plano</button>
            <button type="button" class="btn sec" data-emp-acao="renovar">${ic('repetir')} Renovou</button>
            ${e.assinaturaVence ? `<button type="button" class="btn sec" data-emp-acao="aviso">${ic('mensagem')} Aviso</button>` : ''}
            <button type="button" class="btn sec" data-emp-acao="${e.ativo ? 'bloquear' : 'desbloquear'}">${ic(e.ativo ? 'cadeado' : 'destravar')} ${e.ativo ? 'Bloquear empresa' : 'Desbloquear empresa'}</button>
            <button type="button" class="btn" data-emp-acao="usuario">${ic('mais')} Novo usuário</button>
          </div></div>
        ${usuariosEmpresa.length ? `<div class="tabela-wrap"><table class="t simples"><thead><tr><th>Usuário</th><th>Papel</th><th>Centros de custo</th><th>Situação</th><th class="esconder-cel">Último acesso</th><th></th></tr></thead><tbody>${usuariosHtml}</tbody></table></div>`
          : '<p class="suave">Nenhum usuário ainda. Comece pelo Dono da empresa.</p>'}
        <div class="aviso-box info" style="margin:1em 0 0">${ic('escudo')}<div>Toda criação, troca de papel, bloqueio, redefinição de senha e exclusão fica registrada na <b>atividade recente</b>. Bloquear a empresa tira o acesso de todos os usuários dela de uma vez. Usuários de leitura não contam no limite do plano.</div></div>
        <div class="linha fim" style="margin-top:.8em"><button type="button" class="btn fantasma peq apagar" data-emp-acao="excluir">${ic('lixo')} Excluir empresa</button></div>
      </div>` : ''}`;
    hidratar(raiz);
  }

  function formEmpresa(e = null) {
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-emp" novalidate autocomplete="off">
        <div class="cab-modal"><h2 id="t-emp">${e ? 'Empresa e plano' : 'Nova empresa'}</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="grade-form">
          <div class="inteiro"><label class="rotulo" for="e-nome">Razão social ou nome</label><input type="text" id="e-nome" maxlength="120" value="${esc(e?.nome || '')}" required></div>
          <div><label class="rotulo" for="e-cnpj">CNPJ <small>(opcional)</small></label><input type="text" id="e-cnpj" inputmode="numeric" maxlength="18" placeholder="00.000.000/0000-00" value="${esc(cnpjBR(e?.cnpj))}"></div>
          <div><label class="rotulo" for="e-tel">WhatsApp da empresa <small>(opcional)</small></label><input type="text" id="e-tel" inputmode="tel" maxlength="20" placeholder="(11) 98765-4321" value="${esc(formatarTelefone(e?.telefone))}"></div>
          <fieldset class="inteiro periodos planos-emp"><legend class="rotulo">Plano</legend>
            ${N.PLANOS_ASSINATURA.filter((p) => p.empresa).map((p) => `<label class="periodo"><input type="radio" name="e-plano" value="${p.id}" ${(e?.plano || 'essencial') === p.id ? 'checked' : ''}>
              <b>${esc(p.nome)}</b><span class="v">${moeda(configAssin.precos[p.id].mensal)}<small style="display:inline"> /mês</small></span><small>${esc(p.det)}</small></label>`).join('')}
          </fieldset>
          ${e ? `<div><label class="rotulo" for="e-venc">Assinatura vence em</label><input type="date" id="e-venc" value="${esc(e.assinaturaVence || '')}"></div>` : ''}
          <p class="inteiro dica" style="margin:0">${e ? 'Para mudar o período pago, use “Renovou”.' : 'A empresa já começa com um plano de contas padrão e três centros de custo, que o Dono e o Financeiro podem ajustar. A assinatura de 30 dias começa no primeiro acesso de qualquer usuário dela.'}</p>
        </div>
        <p class="erro-campo" id="e-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} ${e ? 'Salvar' : 'Criar empresa'}</button></div>
      </form>`);
    modal.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const corpo = { nome: $('#e-nome', modal).value.trim(), cnpj: $('#e-cnpj', modal).value, telefone: $('#e-tel', modal).value.trim(), plano: $('input[name=e-plano]:checked', modal).value };
      if (e) corpo.assinaturaVence = $('#e-venc', modal).value || null;
      try {
        if (e) await api('PUT', `/api/admin/empresas/${e.id}`, corpo);
        else est.empresaSel = (await api('POST', '/api/admin/empresas', corpo)).id;
        fechar(); toast(e ? 'Empresa atualizada.' : 'Empresa criada. Agora cadastre o Dono.'); renderEmpresas();
      } catch (er) { $('#e-erro', modal).textContent = er.message; }
    });
  }

  function formUsuarioEmpresa(e, u = null) {
    const papelAtual = u?.papel || (usuariosEmpresa.some((x) => x.papel === 'dono') ? 'financeiro' : 'dono');
    const centrosAtivos = e.centros.filter((c) => c.ativo || u?.centros.includes(c.id));
    const { modal, fechar } = abrirModal(`
      <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-ue" novalidate autocomplete="off">
        <div class="cab-modal"><h2 id="t-ue">${u ? 'Editar usuário' : 'Novo usuário'} · ${esc(e.nome)}</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="grade-form">
          <div class="inteiro"><label class="rotulo" for="ue-nome">Nome</label><input type="text" id="ue-nome" maxlength="120" value="${esc(u?.nome || '')}" required></div>
          <div><label class="rotulo" for="ue-login">Login <small>(pode ser o e-mail)</small></label><input type="text" id="ue-login" maxlength="80" autocapitalize="none" spellcheck="false" value="${esc(u?.login || '')}" ${u ? 'disabled' : 'required'}></div>
          <div><label class="rotulo" for="ue-tel">Telefone <small>(opcional)</small></label><input type="text" id="ue-tel" inputmode="tel" maxlength="20" value="${esc(formatarTelefone(u?.telefone))}"></div>
          <fieldset class="inteiro papeis-sel"><legend class="rotulo">Papel</legend>
            ${E.PAPEIS.map((p) => `<label class="papel-op"><input type="radio" name="ue-papel" value="${p.id}" ${p.id === papelAtual ? 'checked' : ''}><span><b>${esc(p.nome)}</b><small>${esc(p.desc)}</small></span></label>`).join('')}
          </fieldset>
          <fieldset class="inteiro" id="ue-centros-campo"><legend class="rotulo">Centros de custo do gestor</legend>
            ${centrosAtivos.length ? `<div class="pilulas multi">${centrosAtivos.map((c) => `<label><input type="checkbox" value="${esc(c.id)}" ${u?.centros.includes(c.id) ? 'checked' : ''}><span>${esc(c.nome)}</span></label>`).join('')}</div>` : '<p class="suave">A empresa ainda não tem centros de custo ativos.</p>'}
          </fieldset>
        </div>
        <p class="dica">Plano ${esc(N.PLANO_ASSINATURA[e.plano].nome)}: ${e.usuariosPagos} de ${e.limiteUsuarios} usuários pagos em uso.</p>
        <p class="erro-campo" id="ue-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} ${u ? 'Salvar' : 'Criar usuário'}</button></div>
      </form>`);
    const papel = () => $('input[name=ue-papel]:checked', modal).value;
    const mostrar = () => { $('#ue-centros-campo', modal).hidden = papel() !== 'gestor'; };
    mostrar();
    modal.addEventListener('change', (ev) => { if (ev.target.name === 'ue-papel') mostrar(); });
    modal.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const corpo = { nome: $('#ue-nome', modal).value.trim(), telefone: $('#ue-tel', modal).value.trim(), papel: papel(),
        centros: $$('#ue-centros-campo input:checked', modal).map((i) => i.value) };
      try {
        if (u) { await api('PUT', `/api/admin/usuarios/${u.id}`, corpo); fechar(); toast('Usuário atualizado.'); renderEmpresas(); }
        else {
          const r = await api('POST', '/api/admin/usuarios', { ...corpo, login: $('#ue-login', modal).value.trim(), empresaId: e.id });
          fechar(); renderEmpresas();
          mostrarSenha('Usuário criado', { nome: corpo.nome, login: r.login }, r.senhaTemporaria);
        }
      } catch (er) { $('#ue-erro', modal).textContent = er.message; }
    });
  }

  async function acaoEmpresa(acao) {
    const e = empSel();
    if (!e) return;
    try {
      if (acao === 'editar') return formEmpresa(e);
      if (acao === 'usuario') return formUsuarioEmpresa(e);
      if (acao === 'renovar') {
        return renovarAssinatura({ ...e, plano: e.plano }, { url: `/api/admin/empresas/${e.id}/renovar`, depois: renderEmpresas, tipo: 'empresa' });
      }
      if (acao === 'aviso') {
        const dono = usuariosEmpresa.find((u) => u.papel === 'dono' && u.ativo);
        return enviarAviso({ ...e, nome: dono?.nome || e.nome, telefone: e.telefone || dono?.telefone || '', login: dono?.login || '' }, `${e.nome}`);
      }
      if (acao === 'bloquear' || acao === 'desbloquear') {
        const bloquear = acao === 'bloquear';
        const ok = await confirmar({ titulo: bloquear ? 'Bloquear a empresa?' : 'Desbloquear a empresa?', perigo: bloquear, botao: bloquear ? 'Bloquear todos' : 'Desbloquear',
          texto: bloquear ? `Os <b>${e.usuarios} usuários</b> de <b>${esc(e.nome)}</b> saem na hora e não conseguem entrar. Os dados ficam guardados.` : `Os usuários ativos de <b>${esc(e.nome)}</b> voltam a entrar.` });
        if (!ok) return;
        await api('PUT', `/api/admin/empresas/${e.id}`, { ativo: !bloquear });
        toast(bloquear ? 'Empresa bloqueada.' : 'Empresa desbloqueada.');
        return renderEmpresas();
      }
      if (acao === 'excluir') {
        const ok = await confirmar({ titulo: 'Excluir empresa?', perigo: true, botao: 'Excluir definitivamente', palavra: e.nome,
          texto: `A empresa <b>${esc(e.nome)}</b>, os <b>${e.usuarios} usuários</b> dela e <b>todos os lançamentos, orçamentos e cadastros</b> serão apagados. Isso não pode ser desfeito. Para só impedir o acesso, use “Bloquear empresa”.` });
        if (!ok) return;
        await api('DELETE', `/api/admin/empresas/${e.id}`, { confirmacao: e.nome });
        est.empresaSel = null;
        toast('Empresa excluída.');
        return renderEmpresas();
      }
    } catch (er) { toast(er.message, { erro: true }); }
  }

  function ligarAdminEmpresas() {
    $('#adm-empresas').addEventListener('click', async (ev) => {
      const ab = ev.target.closest('[data-emp-abrir]');
      if (ab) { est.empresaSel = Number(ab.dataset.empAbrir); await renderEmpresas(); $('.emp-detalhe')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (ev.target.closest('[data-emp-nova]')) return formEmpresa();
      const a = ev.target.closest('[data-emp-acao]');
      if (a) return acaoEmpresa(a.dataset.empAcao);
      const s = ev.target.closest('[data-sol-resolver]');
      if (s) {
        try { await api('PUT', `/api/admin/solicitacoes/${s.dataset.solResolver}`, { status: 'resolvida' }); toast('Solicitação marcada como resolvida.'); renderEmpresas(); }
        catch (er) { toast(er.message, { erro: true }); }
        return;
      }
      const tr = ev.target.closest('tr[data-emp]');
      if (tr && !ev.target.closest('button')) { est.empresaSel = Number(tr.dataset.emp); renderEmpresas(); }
    });
  }

  // ---------- eventos ----------
  hidratar();

  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('button, a');
    if (!alvo) return;
    if (alvo.matches('[data-novo]')) return abrirFormulario();
    if (alvo.matches('[data-exportar]')) return exportar();
    if (alvo.matches('[data-sair]')) return sair();
    if (alvo.matches('[data-trocar-senha]')) return trocarSenha();
    if (alvo.matches('[data-novo-usuario]')) return formUsuario();
    if (alvo.dataset.usr) return acaoUsuario(alvo.dataset.usr, Number(alvo.dataset.uid));
    if (alvo.matches('[data-limpar-filtro]')) { est.filtro = 'todos'; est.filtroProvisao = null; est.filtroCartao = null; est.busca = ''; $('#busca').value = ''; return render(); }
    if (alvo.matches('[data-prov-limpar]')) { est.filtroProvisao = null; return render(); }
    if (alvo.dataset.filtroCartao) { est.filtroCartao = est.filtroCartao === alvo.dataset.filtroCartao ? null : alvo.dataset.filtroCartao; return render(); }
    if (alvo.dataset.prov) return acaoProvisao(alvo.dataset.prov, alvo.dataset.id);
    if (alvo.dataset.filtro) { est.filtro = est.filtro === alvo.dataset.filtro && alvo.dataset.filtro !== 'todos' ? 'todos' : alvo.dataset.filtro; return render(); }
    if (alvo.dataset.abrir) {
      const id = alvo.dataset.abrir;
      est.abertas.has(id) ? est.abertas.delete(id) : est.abertas.add(id);
      renderAno();
      return $(`[data-abrir="${id}"]`)?.focus();
    }
    if (alvo.dataset.mes != null && est.secao === 'ano') return irPara(est.ano, +alvo.dataset.mes);
    const { acao, id } = alvo.dataset;
    if (acao === 'obs') { const o = alvo.closest('.obs'); alvo.setAttribute('aria-expanded', String(o.classList.toggle('aberta'))); return; }
    if (acao === 'marcar') return alternarPago(id);
    if (acao === 'compras') { est.comprasAbertas.has(id) ? est.comprasAbertas.delete(id) : est.comprasAbertas.add(id); renderMes(); return $(`[data-acao="compras"][data-id="${CSS.escape(id)}"]`)?.focus(); }
    if (acao === 'editar') { const l = dados.lancamentos.find((x) => x.id === id); return l && abrirFormulario(l); }
    if (acao === 'excluir') return excluir(id);
  });

  $('#mes-ant').addEventListener('click', () => mover(-1));
  $('#mes-prox').addEventListener('click', () => mover(1));
  $('#btn-hoje').addEventListener('click', () => { const h = new Date(); est.ano = h.getFullYear(); est.mes = h.getMonth(); render(); });
  $('#competencia').addEventListener('change', (e) => {
    const [a, m] = e.target.value.split('-').map(Number);
    if (a && m) { est.ano = a; est.mes = m - 1; render(); }
  });
  $('#busca').addEventListener('input', (e) => { est.busca = e.target.value; renderMes(); });
  const ordem = $('#ordem');
  ordem.value = est.ordem;
  ordem.addEventListener('change', () => { est.ordem = prefs.ordem = ordem.value; salvarPrefs(); renderMes(); });

  $('#exportar').addEventListener('click', exportar);
  $('#arquivo-importar').addEventListener('change', (e) => { const a = e.target.files[0]; e.target.value = ''; if (a) importar(a); });
  $('#csv-ano').addEventListener('click', () => baixar(`vertice-${est.ano}.csv`, N.csv(dados.lancamentos, est.ano), 'text/csv;charset=utf-8'));
  $('#form-perfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = $('#perfil-nome').value.trim().slice(0, 120);
    if (!nome) return toast('Informe seu nome.', { erro: true });
    try { await api('PUT', '/api/eu', { nome }); eu.nome = nome; render(); toast('Nome atualizado.'); }
    catch (er) { toast(er.message, { erro: true }); }
  });
  $('#apagar-tudo').addEventListener('click', async () => {
    const ok = await confirmar({
      titulo: 'Apagar todos os dados?', perigo: true, botao: 'Apagar tudo', palavra: 'APAGAR',
      texto: `Isso remove os <b>${dados.lancamentos.length} lançamentos</b> de todos os anos deste navegador. Não dá para desfazer depois de sair da página.`,
    });
    if (!ok) return;
    const antes = dados.lancamentos;
    dados.lancamentos = [];
    salvar();
    toast('Todos os lançamentos foram apagados.', { acao: () => { dados.lancamentos = antes; salvar(); }, tempo: 8000 });
  });

  document.addEventListener('keydown', (e) => {
    if (!eu || modoEmpresa || e.ctrlKey || e.metaKey || e.altKey || $('.fundo-modal')) return;
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); abrirFormulario(); }
    else if (e.key === 'ArrowLeft' && ['mes', 'dashboard', 'ano'].includes(est.secao)) mover(-1);
    else if (e.key === 'ArrowRight' && ['mes', 'dashboard', 'ano'].includes(est.secao)) mover(1);
    else if (e.key === '/' && est.secao === 'mes') { e.preventDefault(); $('#busca').focus(); }
  });

  window.addEventListener('hashchange', lerHash);
  window.addEventListener('online', () => { if (sinc.estado === 'erro') sincronizar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') atualizarDoServidor(); });
  window.addEventListener('beforeunload', (e) => { if (sinc.ocupado || sinc.estado === 'erro') e.preventDefault(); });

  (async function iniciar() {
    try {
      const [usuario, d] = await Promise.all([api('GET', '/api/eu'), api('GET', '/api/dados')]);
      eu = usuario; rev = d.rev; dados.lancamentos = d.lancamentos; dados.planos = d.planos || []; dados.provisoes = d.provisoes || []; dados.cenarios = d.cenarios || [];
    } catch (e) {
      $('#carregando').innerHTML = `<div>${ic('alerta')}<h3>Não foi possível carregar seus dados</h3><p>${esc(e.message)}</p>
        <button type="button" class="btn" id="tentar">Tentar de novo</button></div>`;
      $('#tentar').addEventListener('click', () => location.reload());
      return;
    }
    $('#carregando').remove();
    ligarTooltipDashboard();
    if (eu.empresa) {
      modoEmpresa = true;
      try {
        await window.VerticeEmpresa.iniciar({ $, $$, esc, ic, hidratar, api, toast, abrirModal, confirmar, baixar, ligarTip, formatarTelefone, dataHora, iniciais }, eu);
      } catch (e) { toast(e.message, { erro: true, tempo: 10000 }); }
      if (eu.trocarSenha) trocarSenha({ obrigatoria: true });
      return;
    }
    ligarPlanos();
    ligarSimulador();
    if (eu.perfil === 'admin') {
      ligarConfigAssinaturas();
      ligarAdminEmpresas();
      api('GET', '/api/admin/usuarios').then(seloAssinaturas).catch(() => {});
      Promise.all([api('GET', '/api/admin/empresas'), api('GET', '/api/admin/solicitacoes')]).then(([e, s]) => { empresas = e; solicitacoes = s; seloEmpresas(); }).catch(() => {});
    }
    $('#link-admin').hidden = eu.perfil !== 'admin';
    $('#link-empresas').hidden = eu.perfil !== 'admin';
    $('#grupo-admin').hidden = eu.perfil !== 'admin';
    marcarSinc('ok');
    lerHash();
    if (eu.trocarSenha) trocarSenha({ obrigatoria: true });
  })();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
