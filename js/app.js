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

  // ---------- armazenamento ----------
  const CHAVE = 'vertice:dados';
  const CHAVE_PREFS = 'vertice:prefs';
  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

  const bruto = ler(CHAVE, null);
  let dados = { versao: N.VERSAO_DADOS, perfil: { nome: '' }, lancamentos: [] };
  if (bruto) {
    try { dados = { ...dados, perfil: bruto.perfil || dados.perfil, lancamentos: N.lerBackup(bruto).lancamentos }; } catch { /* mantém vazio */ }
  }
  let prefs = { categoria: 'fixa', ordem: 'venc', ultimoBackup: null, migrado: false, ...ler(CHAVE_PREFS, {}) };

  function salvar() {
    if (!gravar(CHAVE, dados)) toast('Não foi possível salvar neste navegador. Baixe um backup.', { erro: true });
    render();
  }
  const salvarPrefs = () => gravar(CHAVE_PREFS, prefs);

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
  function abrirModal(html, { estreito = false } = {}) {
    const anterior = document.activeElement;
    const fundo = document.createElement('div');
    fundo.className = 'fundo-modal';
    fundo.innerHTML = html;
    const modal = fundo.firstElementChild;
    if (estreito) modal.classList.add('estreito');
    document.body.append(fundo);
    hidratar(fundo);
    const fechar = () => { fundo.remove(); document.removeEventListener('keydown', teclas); anterior?.focus?.(); };
    function teclas(e) { if (e.key === 'Escape' && $$('.fundo-modal').at(-1) === fundo) { e.stopPropagation(); fechar(); fundo.dispatchEvent(new Event('cancelado')); } }
    document.addEventListener('keydown', teclas);
    fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) { fechar(); fundo.dispatchEvent(new Event('cancelado')); } });
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
        <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-conf" novalidate>
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
      if (palavra) $('#c-palavra', modal).addEventListener('input', (e) => { $('#c-ok', modal).disabled = e.target.value.trim().toUpperCase() !== palavra; });
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
        dados.lancamentos = N.editar(dados.lancamentos, existente.id, { desc, centavos, categoria, ...data }, escopo);
        fechar(); salvar();
        toast('Lançamento atualizado.');
        return;
      }

      const rec = val('rec');
      const qtd = Math.floor(+f('f-qtd').value);
      if (rec !== 'unica' && !(qtd >= 2 && qtd <= 120)) { f('f-qtd').focus(); return toast('A quantidade deve ficar entre 2 e 120.', { erro: true }); }
      const novos = N.gerar({ desc, centavos, categoria, ...data, recorrencia: rec, quantidade: qtd, modoValor: val('modo') });
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
    const s = location.hash.replace('#', '');
    est.secao = ['mes', 'ano', 'ajustes'].includes(s) ? s : 'mes';
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
  }

  function atrasados() {
    const hoje = new Date();
    return dados.lancamentos.filter((l) => N.situacao(l, hoje).cod === 'atrasado');
  }

  function renderTopo() {
    const nome = (dados.perfil.nome || '').trim();
    const h = new Date().getHours();
    $('#saudacao').textContent = `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nome ? ', ' + nome.split(' ')[0] : ''}`;
    $('#hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#nome-usuario').textContent = nome || 'Você';
    $('#av-usuario').textContent = (nome || 'V').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const ano = est.secao === 'ano';
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
    const dias = prefs.ultimoBackup ? (Date.now() - prefs.ultimoBackup) / 86400000 : Infinity;
    if (dados.lancamentos.length >= 10 && dias > 30) {
      avisos.push(`<div class="aviso-box cuidado">${ic('escudo')}<div>${prefs.ultimoBackup ? `Seu último backup tem ${Math.floor(dias)} dias.` : 'Você ainda não baixou um backup.'} Os dados ficam só neste navegador.</div>
        <button type="button" class="btn sec peq" data-exportar>Baixar backup</button></div>`);
    }
    if (!dados.lancamentos.length) avisos.push(avisoMigracao());
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
    if (q) itens = itens.filter((l) => N.normalizar(l.desc + ' ' + CAT[l.categoria].nome).includes(q));
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
          <div class="tags"><span class="tag quando neutra">${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span><span class="tag cat" data-cat="${l.categoria}">${esc(c.nome)}</span>${serie}${situ}</div></div>
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

  // ---------- migração do Vértice antigo ----------
  function dadosAntigos() {
    const achados = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('vertice_stable_')) continue;
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(arr) && arr.length) achados.push({ chave: k, email: k.slice('vertice_stable_'.length), arr });
      }
    } catch { /* ignora */ }
    return achados;
  }
  function avisoMigracao() {
    if (prefs.migrado) return '';
    const ant = dadosAntigos();
    if (!ant.length) return '';
    const total = ant.reduce((s, a) => s + a.arr.length, 0);
    return `<div class="aviso-box info">${ic('repetir')}<div><b>Encontramos ${total} lançamentos do Vértice antigo</b> neste navegador (${ant.map((a) => esc(a.email)).join(', ')}).</div>
      <button type="button" class="btn peq" data-migrar>Importar agora</button></div>`;
  }
  function migrar() {
    const novos = dadosAntigos().flatMap((a) => N.migrarAntigo(a.arr));
    dados.lancamentos.push(...novos);
    prefs.migrado = true; salvarPrefs();
    salvar();
    toast(`${novos.length} lançamentos importados. O dia de vencimento ficou como 10; ajuste se precisar.`, { tempo: 7000 });
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
    baixar(`vertice-backup-${carimbo}.json`, JSON.stringify({ ...dados, versao: N.VERSAO_DADOS, exportadoEm: d.toISOString() }, null, 2), 'application/json');
    prefs.ultimoBackup = Date.now(); salvarPrefs();
    render();
    toast('Backup baixado.');
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
    if (lido.perfil?.nome && !dados.perfil.nome) dados.perfil.nome = String(lido.perfil.nome).slice(0, 60);
    salvar();
    toast(`${lido.lancamentos.length} lançamentos restaurados.`, { acao: () => { dados.lancamentos = antes; salvar(); } });
  }

  function renderAjustes() {
    $('#perfil-nome').value = dados.perfil.nome || '';
    const n = dados.lancamentos.length;
    $('#info-backup').textContent = `${n} ${n === 1 ? 'lançamento salvo' : 'lançamentos salvos'} neste navegador. `
      + (prefs.ultimoBackup ? `Último backup em ${new Date(prefs.ultimoBackup).toLocaleDateString('pt-BR')}.` : 'Nenhum backup baixado ainda.');
    $('#aviso-migracao').innerHTML = avisoMigracao();
  }

  // ---------- eventos ----------
  hidratar();

  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('button, a');
    if (!alvo) return;
    if (alvo.matches('[data-novo]')) return abrirFormulario();
    if (alvo.matches('[data-exportar]')) return exportar();
    if (alvo.matches('[data-migrar]')) return migrar();
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
  $('#form-perfil').addEventListener('submit', (e) => {
    e.preventDefault();
    dados.perfil.nome = $('#perfil-nome').value.trim().slice(0, 60);
    salvar(); toast('Perfil salvo.');
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
    if (e.ctrlKey || e.metaKey || e.altKey || $('.fundo-modal')) return;
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); abrirFormulario(); }
    else if (e.key === 'ArrowLeft' && est.secao !== 'ajustes') mover(-1);
    else if (e.key === 'ArrowRight' && est.secao !== 'ajustes') mover(1);
    else if (e.key === '/' && est.secao === 'mes') { e.preventDefault(); $('#busca').focus(); }
  });

  window.addEventListener('hashchange', lerHash);
  window.addEventListener('storage', (e) => { if (e.key === CHAVE) location.reload(); });
  lerHash();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
