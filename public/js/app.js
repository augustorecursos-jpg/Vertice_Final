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
    dinheiro: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
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
  let dados = { lancamentos: [], planos: [] };   // lançamentos e planejamentos do usuário
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
          rev = (await api('PUT', '/api/dados', { rev, lancamentos: dados.lancamentos, planos: dados.planos })).rev;
          marcarSinc('ok');
        } catch (e) {
          if (e.status === 409) {
            rev = e.dados.rev; dados.lancamentos = e.dados.lancamentos; dados.planos = e.dados.planos || [];
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
    if (sinc.ocupado || sinc.estado !== 'ok' || $('.fundo-modal') || document.activeElement?.closest('#planos')) return;
    try {
      const d = await api('GET', '/api/dados');
      if (d.rev !== rev && !sinc.ocupado) { rev = d.rev; dados.lancamentos = d.lancamentos; dados.planos = d.planos || []; render(); }
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
    filtro: 'todos', busca: '', ordem: prefs.ordem, abertas: new Set(),
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
    const contarObs = () => {
      const n = f('f-obs').value.length;
      f('c-obs').textContent = n > N.MAX_OBS * 0.8 ? `${n}/${N.MAX_OBS}` : '';
    };
    f('f-obs').addEventListener('input', contarObs);
    contarObs();

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

    const val = (nome) => $(`input[name=${nome}]:checked`, modal)?.value;
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
      const centavos = N.lerValor(f('f-valor').value);
      const data = N.lerIso(f('f-data').value);
      const okDesc = erro('desc', desc ? '' : 'Informe uma descrição.');
      const okValor = erro('valor', centavos > 0 ? '' : 'Informe um valor maior que zero, como 1.250,90.');
      const okData = erro('data', data ? '' : 'Escolha a data de vencimento.');
      if (!okDesc || !okValor || !okData) { modal.querySelector('[aria-invalid=true]')?.focus(); return; }
      const categoria = val('cat');
      prefs.categoria = categoria; salvarPrefs();

      if (existente) {
        const escopo = await escolherEscopo(existente, 'Editar');
        if (!escopo) return;
        dados.lancamentos = N.editar(dados.lancamentos, existente.id, { desc, obs, centavos, categoria, ...data }, escopo);
        fechar(); salvar();
        toast('Lançamento atualizado.');
        return;
      }

      const rec = val('rec');
      const qtd = Math.floor(+f('f-qtd').value);
      if (rec !== 'unica' && !(qtd >= 2 && qtd <= 120)) { f('f-qtd').focus(); return toast('A quantidade deve ficar entre 2 e 120.', { erro: true }); }
      const novos = N.gerar({ desc, obs, centavos, categoria, ...data, recorrencia: rec, quantidade: qtd, modoValor: val('modo') });
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
    if (est.secao === 'ano') { est.ano += delta; return render(); }
    const r = N.somarMeses(est.ano, est.mes, delta);
    irPara(r.ano, r.mes);
  }
  function lerHash() {
    const [s, sub] = location.hash.replace('#', '').split('/');
    est.secao = ['mes', 'ano', 'planos', 'ajustes'].includes(s) || (s === 'usuarios' && eu?.perfil === 'admin') ? s : 'mes';
    est.plano = s === 'planos' && sub ? decodeURIComponent(sub) : null;
    render();
    window.scrollTo({ top: 0 });
  }

  // ---------- render ----------
  function render() {
    $$('main > section').forEach((s) => { s.hidden = s.dataset.secao !== est.secao; });
    $$('#menu a').forEach((a) => a.classList.toggle('ativo', a.dataset.secao === est.secao));
    $$('#menu a').forEach((a) => { if (a.dataset.secao === est.secao) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    renderTopo();
    if (est.secao === 'mes') renderMes();
    if (est.secao === 'ano') renderAno();
    if (est.secao === 'ajustes') renderAjustes();
    if (est.secao === 'usuarios') renderUsuarios();
    if (est.secao === 'planos') renderPlanos();
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
    const ano = est.secao === 'ano';
    const comPeriodo = ['mes', 'ano'].includes(est.secao);
    $('.topo .mes').hidden = !comPeriodo;
    $('#btn-hoje').hidden = !comPeriodo;
    $('.topo').classList.toggle('sem-periodo', !comPeriodo);
    $('#rotulo-periodo').textContent = ano ? 'Ano de referência' : 'Mês de referência';
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
    $('#cards-mes').innerHTML = [
      kpi({ classe: 'destaque' + (r.saldoPrevisto < 0 ? ' negativo' : ''), icone: 'carteira', rotulo: 'Saldo previsto do mês', valor: moeda(r.saldoPrevisto),
        det: `Realizado até agora: <b>${moeda(r.saldoRealizado)}</b>` }),
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
      + (atr.length ? `<button type="button" data-filtro="atrasados" class="alerta ${est.filtro === 'atrasados' ? 'ativo' : ''}" aria-pressed="${est.filtro === 'atrasados'}">Atrasados (todos os meses)<b>${atr.length}</b></button>` : '');

    let itens = est.filtro === 'atrasados' ? atr : doMes.filter(filtroAtual ? filtroAtual[2] : () => true);
    const q = N.normalizar(est.busca.trim());
    if (q) itens = itens.filter((l) => N.normalizar(`${l.desc} ${l.obs || ''} ${CAT[l.categoria].nome}`).includes(q));
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
          <div class="tags"><span class="tag quando neutra">${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span><span class="tag cat" data-cat="${l.categoria}">${esc(c.nome)}</span>${serie}${situ}</div>${l.obs ? `<div class="obs"><button type="button" data-acao="obs" aria-expanded="false" title="${esc(l.obs)}">${ic('nota')}<span>${esc(l.obs)}</span></button></div>` : ''}</div>
        <div class="valor">${c.tipo === 'entrada' ? '+ ' : ''}${moeda(l.centavos)}</div>
        <div class="acoes">
          <button type="button" class="btn fantasma icone peq" data-acao="editar" data-id="${esc(l.id)}" aria-label="Editar ${esc(l.desc)}" title="Editar">${ic('editar')}</button>
          <button type="button" class="btn fantasma icone peq apagar" data-acao="excluir" data-id="${esc(l.id)}" aria-label="Excluir ${esc(l.desc)}" title="Excluir">${ic('lixo')}</button>
        </div>
      </div>`;
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

  let configAssin = { mensalidade: 1199, diasAviso: 5, mensagem: '', mensagemPadrao: '' };
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

      corpo.innerHTML = `<thead><tr><th>Usuário</th><th>Situação</th><th>Assinatura</th><th class="esconder-cel">Último acesso</th><th></th></tr></thead><tbody>${lista.map((u) => {
        const souEu = u.id === eu.id;
        const assinante = u.perfil !== 'admin';
        return `<tr class="${u.ativo ? '' : 'inativo'} ${precisaAtencao(u) ? 'atencao' : ''}">
          <td><div class="pessoa"><span class="av">${esc(iniciais(u.nome))}</span><div><b>${esc(u.nome)}${souEu ? ' <span class="tag info">você</span>' : ''}</b><small>${esc(u.login)}${u.perfil === 'admin' ? ' · <span class="txt-admin">administrador</span>' : ''}</small></div></div></td>
          <td>${!u.ativo ? `<span class="tag erro">${ic('cadeado')} Bloqueado</span>`
            : u.trocarSenha ? `<span class="tag aviso">${ic('relogio')} ${u.ultimoAcesso ? 'Senha temporária' : 'Aguardando 1º acesso'}</span>`
            : `<span class="tag ok">${ic('check')} Ativo</span>`}</td>
          <td class="cel-assin">${tagAssinatura(u)}</td>
          <td class="esconder-cel">${u.ultimoAcesso ? esc(dataHora(u.ultimoAcesso)) : '<span class="suave">Nunca entrou</span>'}</td>
          <td class="acoes">
            ${assinante && u.assinaturaVence ? `<button type="button" class="btn fantasma icone peq aviso-msg" data-usr="aviso" data-uid="${u.id}" title="Enviar aviso de vencimento" aria-label="Enviar aviso de vencimento para ${esc(u.nome)}">${ic('mensagem')}</button>` : ''}
            ${assinante ? `<button type="button" class="btn fantasma icone peq" data-usr="renovar" data-uid="${u.id}" title="Renovar +30 dias" aria-label="Renovar assinatura de ${esc(u.nome)} por 30 dias">${ic('repetir')}</button>` : ''}
            <button type="button" class="btn fantasma icone peq" data-usr="editar" data-uid="${u.id}" title="Editar" aria-label="Editar ${esc(u.nome)}">${ic('editar')}</button>
            ${souEu ? '' : `
            <button type="button" class="btn fantasma icone peq" data-usr="senha" data-uid="${u.id}" title="Redefinir senha" aria-label="Redefinir senha de ${esc(u.nome)}">${ic('chave')}</button>
            <button type="button" class="btn fantasma icone peq" data-usr="${u.ativo ? 'bloquear' : 'desbloquear'}" data-uid="${u.id}" title="${u.ativo ? 'Bloquear' : 'Desbloquear'}" aria-label="${u.ativo ? 'Bloquear' : 'Desbloquear'} ${esc(u.nome)}">${ic(u.ativo ? 'cadeado' : 'destravar')}</button>
            <button type="button" class="btn fantasma icone peq apagar" data-usr="excluir" data-uid="${u.id}" title="Excluir" aria-label="Excluir ${esc(u.nome)}">${ic('lixo')}</button>`}
          </td></tr>`;
      }).join('')}</tbody>`;

      if (!$('#cfg-assin').contains(document.activeElement)) {
        $('#cfg-valor').value = N.valorParaCampo(cfg.mensalidade);
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

  /** Preenche a mensagem padrão com os dados do usuário. */
  function montarMensagem(u, modelo = configAssin.mensagem) {
    const a = u.assinatura || {};
    const prazo = a.cod === 'vencida' ? `venceu há ${-a.dias} ${a.dias === -1 ? 'dia' : 'dias'}`
      : a.cod === 'hoje' ? 'hoje' : a.dias === 1 ? 'amanhã' : `daqui a ${a.dias} dias`;
    const valores = {
      nome: String(u.nome || '').trim().split(/\s+/)[0], vencimento: dataBR(u.assinaturaVence), prazo, valor: moeda(configAssin.mensalidade),
    };
    return modelo.replace(/\{(nome|vencimento|prazo|valor)\}/g, (_, k) => valores[k]);
  }

  function enviarAviso(u) {
    const tel = String(u.telefone || '').replace(/\D/g, '');
    const telIntl = tel && (tel.length <= 11 ? '55' + tel : tel);
    const email = /@/.test(u.login) ? u.login : '';
    const { modal } = abrirModal(`
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-aviso">
        <div class="cab-modal"><h2 id="t-aviso">Aviso de vencimento</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <p style="margin-top:0">Para <b>${esc(u.nome)}</b> · assinatura ${u.assinatura.cod === 'vencida' ? 'venceu' : 'vence'} em <b>${dataBR(u.assinaturaVence)}</b> · mensalidade <b>${moeda(configAssin.mensalidade)}</b></p>
        <label class="rotulo" for="aviso-texto">Mensagem <small>(pode ajustar antes de enviar)</small></label>
        <textarea id="aviso-texto" rows="9">${esc(montarMensagem(u))}</textarea>
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
      const mensalidade = N.lerValor($('#cfg-valor').value);
      if (!(mensalidade > 0)) return toast('Informe o valor da mensalidade, por exemplo 11,99.', { erro: true });
      try {
        configAssin = { ...configAssin, ...(await api('PUT', '/api/admin/config', {
          mensalidade, diasAviso: Math.floor(+$('#cfg-dias').value), mensagem: $('#cfg-msg').value,
        })) };
        toast('Configurações de assinatura salvas.');
        renderUsuarios();
      } catch (er) { toast(er.message, { erro: true }); }
    });
    $('#cfg-padrao').addEventListener('click', () => { $('#cfg-msg').value = configAssin.mensagemPadrao; $('#cfg-msg').focus(); });
    $('#cfg-previa').addEventListener('click', () => {
      const exemplo = { nome: 'Maria Clara', assinaturaVence: new Date(Date.now() + 3 * 864e5).toLocaleDateString('sv-SE'), assinatura: { cod: 'aviso', dias: 3 } };
      const mensalidade = N.lerValor($('#cfg-valor').value);
      const antes = configAssin.mensalidade;
      if (mensalidade > 0) configAssin.mensalidade = mensalidade;
      const txt = montarMensagem(exemplo, $('#cfg-msg').value);
      configAssin.mensalidade = antes;
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
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;
    try {
      if (acao === 'editar') return formUsuario(u);
      if (acao === 'aviso') return enviarAviso(u);
      if (acao === 'renovar') {
        const hoje = new Date().toLocaleDateString('sv-SE');
        const base = u.assinaturaVence && u.assinaturaVence > hoje ? u.assinaturaVence : hoje;
        const ok = await confirmar({ titulo: 'Confirmar renovação?', botao: 'Renovar +30 dias',
          texto: `Registrar que <b>${esc(u.nome)}</b> pagou a mensalidade de <b>${moeda(configAssin.mensalidade)}</b>. A assinatura passa a valer 30 dias a partir de ${base === hoje ? 'hoje' : dataBR(base)}.` });
        if (!ok) return;
        const r = await api('POST', `/api/admin/usuarios/${id}/renovar`, {});
        if (!u.ativo) toast(`Renovada até ${dataBR(r.assinaturaVence)}. O acesso continua bloqueado: use “Desbloquear”.`, { tempo: 8000 });
        else toast(`Assinatura renovada até ${dataBR(r.assinaturaVence)}.`);
        return renderUsuarios();
      }
      if (acao === 'senha') {
        const ok = await confirmar({ titulo: 'Redefinir senha?', botao: 'Gerar senha temporária',
          texto: `<b>${esc(u.nome)}</b> sai de todos os dispositivos e só entra de novo com a senha temporária que vamos gerar agora.` });
        if (!ok) return;
        const r = await api('POST', `/api/admin/usuarios/${id}/senha`, {});
        renderUsuarios();
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
        return renderUsuarios();
      }
      if (acao === 'excluir') {
        const ok = await confirmar({ titulo: 'Excluir usuário?', perigo: true, botao: 'Excluir definitivamente', palavra: u.login,
          texto: `A conta de <b>${esc(u.nome)}</b> e <b>todos os lançamentos dela</b> serão apagados. Isso não pode ser desfeito. Se quiser só impedir o acesso, use “Bloquear”.` });
        if (!ok) return;
        await api('DELETE', `/api/admin/usuarios/${id}`, { confirmar: u.login });
        toast('Usuário excluído.');
        return renderUsuarios();
      }
    } catch (e) { toast(e.message, { erro: true }); }
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
    if (alvo.matches('[data-limpar-filtro]')) { est.filtro = 'todos'; est.busca = ''; $('#busca').value = ''; return render(); }
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
    if (!eu || e.ctrlKey || e.metaKey || e.altKey || $('.fundo-modal')) return;
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); abrirFormulario(); }
    else if (e.key === 'ArrowLeft' && ['mes', 'ano'].includes(est.secao)) mover(-1);
    else if (e.key === 'ArrowRight' && ['mes', 'ano'].includes(est.secao)) mover(1);
    else if (e.key === '/' && est.secao === 'mes') { e.preventDefault(); $('#busca').focus(); }
  });

  window.addEventListener('hashchange', lerHash);
  window.addEventListener('online', () => { if (sinc.estado === 'erro') sincronizar(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') atualizarDoServidor(); });
  window.addEventListener('beforeunload', (e) => { if (sinc.ocupado || sinc.estado === 'erro') e.preventDefault(); });

  (async function iniciar() {
    try {
      const [usuario, d] = await Promise.all([api('GET', '/api/eu'), api('GET', '/api/dados')]);
      eu = usuario; rev = d.rev; dados.lancamentos = d.lancamentos; dados.planos = d.planos || [];
    } catch (e) {
      $('#carregando').innerHTML = `<div>${ic('alerta')}<h3>Não foi possível carregar seus dados</h3><p>${esc(e.message)}</p>
        <button type="button" class="btn" id="tentar">Tentar de novo</button></div>`;
      $('#tentar').addEventListener('click', () => location.reload());
      return;
    }
    $('#carregando').remove();
    ligarPlanos();
    if (eu.perfil === 'admin') {
      ligarConfigAssinaturas();
      api('GET', '/api/admin/usuarios').then(seloAssinaturas).catch(() => {});
    }
    $('#link-admin').hidden = eu.perfil !== 'admin';
    $('#grupo-admin').hidden = eu.perfil !== 'admin';
    marcarSinc('ok');
    lerHash();
    if (eu.trocarSenha) trocarSenha({ obrigatoria: true });
  })();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
