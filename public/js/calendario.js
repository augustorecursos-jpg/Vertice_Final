/*
 * Vértice — calendário de vencimentos (pessoa física e empresa).
 * Recebe itens já prontos de cada app e devolve o HTML; as regras de cada lado
 * (o que é a pagar, quem pode marcar como pago) ficam em app.js e empresa.js.
 * Funciona no navegador (window.VerticeCalendario) e no Node (require) para os testes.
 *
 * Item: { id, iso: 'AAAA-MM-DD', desc, centavos, pago, sit: { cod, dias }, entrada, cat?, tipo?, sub,
 *         podeMarcar, podeEditar, rotPago? }
 */
(function (raiz, fabrica) {
  const api = fabrica(typeof module === 'object' && module.exports ? require('./nucleo') : raiz.Nucleo);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.VerticeCalendario = api;
})(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const SEMANA_LONGA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const VISTAS = [['mes', 'Mês'], ['semana', 'Semana'], ['lista', 'Lista']];
  const MAX_CHIPS = 3;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const deIso = (s) => { const [a, m, d] = String(s).split('-').map(Number); return new Date(a, m - 1, d); };
  const curto = (c) => N.moedaCurta(c).replace(/^R\$\s?/, '');

  /** Semanas (domingo a sábado) que cobrem o mês, com os dias dos meses vizinhos marcados como "fora". */
  function gradeMes(ano, mes) {
    const ini = new Date(ano, mes, 1 - new Date(ano, mes, 1).getDay());
    const fim = N.diasNoMes(ano, mes);
    const total = Math.ceil((new Date(ano, mes, 1).getDay() + fim) / 7) * 7;
    const cel = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      cel.push({ iso: iso(d), ano: d.getFullYear(), mes: d.getMonth(), dia: d.getDate(), dow: d.getDay(), fora: d.getMonth() !== mes });
    }
    return cel;
  }

  /** Os 7 dias (domingo a sábado) da semana que contém a data. */
  function semanaDe(data) {
    const d = deIso(data);
    const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      return { iso: iso(x), ano: x.getFullYear(), mes: x.getMonth(), dia: x.getDate(), dow: x.getDay(), fora: false };
    });
  }

  const ordem = (a, b) => (a.sit.cod === 'atrasado' ? 0 : a.pago ? 2 : 1) - (b.sit.cod === 'atrasado' ? 0 : b.pago ? 2 : 1) || b.centavos - a.centavos;
  /** Itens agrupados por dia: atrasados primeiro, pagos por último, maiores valores antes. */
  function porDia(itens) {
    const m = new Map();
    for (const i of itens) { if (!m.has(i.iso)) m.set(i.iso, []); m.get(i.iso).push(i); }
    for (const l of m.values()) l.sort(ordem);
    return m;
  }

  /** Números do topo. "Em aberto" considera só o que não foi pago; atrasadas valem para qualquer mês. */
  function resumo(itens, ano, mes, hoje = new Date()) {
    const h = iso(hoje), lim = iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7));
    const prefixo = `${ano}-${p2(mes + 1)}-`;
    const soma = (l) => ({ n: l.length, v: l.reduce((a, i) => a + i.centavos, 0) });
    const abertos = itens.filter((i) => !i.pago);
    return {
      hoje: soma(abertos.filter((i) => i.iso === h && !i.entrada)),
      hojeTodos: soma(abertos.filter((i) => i.iso === h)),
      prox7: soma(abertos.filter((i) => i.iso >= h && i.iso <= lim && !i.entrada)),
      atrasadas: soma(abertos.filter((i) => i.sit.cod === 'atrasado')),
      pagarMes: soma(abertos.filter((i) => i.iso.startsWith(prefixo) && !i.entrada)),
      receberMes: soma(abertos.filter((i) => i.iso.startsWith(prefixo) && i.entrada)),
    };
  }

  /** Dia aberto no painel: o escolhido (se for do mês), hoje, ou o primeiro dia com contas. */
  function diaPadrao(escolhido, itens, ano, mes, hoje = new Date()) {
    const prefixo = `${ano}-${p2(mes + 1)}-`;
    if (escolhido && escolhido.startsWith(prefixo)) return escolhido;
    if (hoje.getFullYear() === ano && hoje.getMonth() === mes) return iso(hoje);
    const dias = itens.map((i) => i.iso).filter((d) => d.startsWith(prefixo)).sort();
    return dias[0] || `${prefixo}01`;
  }

  const nomeDia = (data) => { const d = deIso(data); return `${SEMANA_LONGA[d.getDay()]}, ${d.getDate()} de ${N.MESES[d.getMonth()].toLowerCase()}`; };
  const corAttr = (i) => (i.cat ? ` data-cat="${esc(i.cat)}"` : '') + (i.tipo ? ` data-tipo-cal="${esc(i.tipo)}"` : '');
  const classeItem = (i) => (i.pago ? 'pago' : i.sit.cod === 'atrasado' ? 'atrasado' : '');

  /** HTML do calendário. */
  function montar(c) {
    const ic = c.ic || (() => '');
    const hojeIso = iso(c.hoje || new Date());
    const doDia = porDia(c.itens);
    const sel = diaPadrao(c.dia, c.itens, c.ano, c.mes, c.hoje);
    const pj = c.modo === 'pj';

    const chip = (i) => `<span class="chip-c ${classeItem(i)}"${corAttr(i)} title="${esc(`${i.desc} · ${N.moeda(i.centavos)}`)}">${i.pago ? ic('check') : i.sit.cod === 'atrasado' ? ic('alerta') : ''}<span class="t">${esc(i.desc)}</span><span class="v">${pj ? (i.entrada ? '+' : '−') : ''}${esc(N.moedaCurta(i.centavos))}</span></span>`;
    const totais = (l) => {
      const ent = l.filter((i) => i.entrada).reduce((a, i) => a + i.centavos, 0);
      const sai = l.filter((i) => !i.entrada).reduce((a, i) => a + i.centavos, 0);
      if (pj) return `${ent ? `<span class="ent">↑${curto(ent)}</span>` : ''}${sai ? `<span class="sai">↓${curto(sai)}</span>` : ''}`;
      return sai ? `<span>${esc(N.moedaCurta(sai))}</span>` : ent ? `<span class="ent">+${curto(ent)}</span>` : '';
    };
    const celula = (d, limite) => {
      const l = doDia.get(d.iso) || [];
      const cls = ['cal-dia', d.fora ? 'fora' : '', d.dow === 0 || d.dow === 6 ? 'fds' : '', d.iso < hojeIso ? 'passado' : '', d.iso === hojeIso ? 'hoje' : '', d.iso === sel ? 'sel' : '', l.some((i) => !i.pago && i.sit.cod === 'atrasado') ? 'tem-atraso' : ''].filter(Boolean).join(' ');
      const mostra = limite ? l.slice(0, limite) : l;
      const resto = l.length - mostra.length;
      const rotulo = `${nomeDia(d.iso)}${l.length ? `, ${l.length} ${l.length === 1 ? 'conta' : 'contas'}` : ''}${d.iso === hojeIso ? ' (hoje)' : ''}`;
      return `<div class="${cls}" data-cal-dia="${d.iso}">
        <div class="topo-d"><button type="button" class="n" data-cal-dia="${d.iso}" aria-label="${esc(rotulo)}" aria-pressed="${d.iso === sel}">${limite ? d.dia : `${SEMANA[d.dow]} ${d.dia}`}</button>${d.iso === hojeIso ? '<span class="hoje-tag">hoje</span>' : ''}${l.length ? `<span class="tot">${totais(l)}</span>` : ''}</div>
        <div class="chips">${mostra.map(chip).join('')}${resto > 0 ? `<span class="mais-c">+ ${resto} ${resto === 1 ? 'conta' : 'contas'}</span>` : ''}</div>
        ${l.length ? `<span class="pts" aria-hidden="true">${l.slice(0, 6).map((i) => `<i class="${classeItem(i)}"${corAttr(i)}></i>`).join('')}</span>` : ''}</div>`;
    };
    const itemPainel = (i) => `<div class="cal-item ${classeItem(i)}"${corAttr(i)}><span class="barra"></span>
        ${i.podeEditar ? `<button type="button" class="nome" data-cal-editar="${esc(i.id)}" title="Editar">${esc(i.desc)}</button>` : `<b class="nome">${esc(i.desc)}</b>`}
        <span class="val">${pj || i.entrada ? (i.entrada ? '+' : '−') : ''}${N.moeda(i.centavos)}</span>
        <div class="acao"><small>${i.sub}</small>
          ${i.pago ? (i.podeMarcar ? `<button type="button" class="tag ok" data-cal-marcar="${esc(i.id)}" title="Marcar como em aberto">${ic('check')} ${esc(i.rotPago || 'Pago')}</button>` : `<span class="tag ok">${ic('check')} ${esc(i.rotPago || 'Pago')}</span>`)
            : i.podeMarcar ? `<button type="button" class="btn ${i.sit.cod === 'atrasado' ? 'perigo' : 'sec'} peq" data-cal-marcar="${esc(i.id)}">${esc(i.entrada ? 'Marcar recebido' : 'Marcar pago')}</button>`
            : i.sit.cod === 'atrasado' ? '<span class="tag erro">Atrasado</span>' : ''}</div></div>`;
    const totalDia = (l) => {
      const ent = l.filter((i) => i.entrada).reduce((a, i) => a + i.centavos, 0);
      const sai = l.filter((i) => !i.entrada).reduce((a, i) => a + i.centavos, 0);
      return `${sai ? `<div class="cal-tot"><span>${pj ? 'A pagar no dia' : 'Saídas do dia'}</span><span>${N.moeda(sai)}</span></div>` : ''}${ent ? `<div class="cal-tot ent"><span>${pj ? 'A receber no dia' : 'Entradas do dia'}</span><span>${N.moeda(ent)}</span></div>` : ''}`;
    };
    const lancar = (data) => (c.podeLancar ? `<button type="button" class="btn sec cal-lancar" data-cal-novo="${data}">${ic('mais')} Lançar neste dia</button>` : '');

    const lSel = doDia.get(sel) || [];
    const painel = `<aside class="cal-painel" aria-live="polite"><h3>${esc(nomeDia(sel))}</h3>
        <p class="sub">${lSel.length ? `${lSel.length} ${lSel.length === 1 ? 'conta' : 'contas'} neste dia` : 'Nenhuma conta neste dia'}<span class="so-largo"> · escolha outro dia no calendário</span></p>
        ${lSel.map(itemPainel).join('')}${totalDia(lSel)}${lancar(sel)}</aside>`;

    let corpo;
    if (c.vista === 'lista') {
      const prefixo = `${c.ano}-${p2(c.mes + 1)}-`;
      const dias = [...doDia.keys()].filter((d) => d.startsWith(prefixo)).sort();
      corpo = `<div class="cal-lista">${dias.length ? dias.map((d) => `<section class="cal-lista-dia ${d === hojeIso ? 'hoje' : ''}"><h3>${esc(nomeDia(d))}${d === hojeIso ? ' <span class="hoje-tag">hoje</span>' : ''}</h3>
          ${doDia.get(d).map(itemPainel).join('')}${totalDia(doDia.get(d))}</section>`).join('')
        : `<p class="suave">Nenhuma conta em ${esc(N.MESES[c.mes].toLowerCase())}${c.filtro && c.filtro !== 'todos' ? ' com esse filtro' : ''}.</p>`}</div>`;
    } else {
      const semana = c.vista === 'semana';
      const cel = semana ? semanaDe(sel) : gradeMes(c.ano, c.mes);
      corpo = `<div class="cal-corpo"><div>
          <div class="cal-grade ${semana ? 'semana' : ''}"><div class="cal-sem" aria-hidden="true">${SEMANA.map((s) => `<span>${s}<b>${s[0]}</b></span>`).join('')}</div>
            <div class="cal-dias">${cel.map((d) => celula(d, semana ? 0 : MAX_CHIPS)).join('')}</div></div>
          <div class="cal-leg">${c.legenda || ''}</div></div>${painel}</div>`;
    }

    return `<div class="cartao dash-cab cal-cab"><div><h2><span class="bolha ciano">${ic('calendario')}</span> ${esc(c.titulo)}</h2><p>${c.sub || ''}</p></div>
        <div class="alternar" role="group" aria-label="Visualização">${VISTAS.map(([v, n]) => `<button type="button" data-cal-vista="${v}" class="${c.vista === v ? 'ativo' : ''}" aria-pressed="${c.vista === v}">${n}</button>`).join('')}</div>
        <div class="filtro-cats cal-filtros" role="group" aria-label="Mostrar"><span class="rot-filtro">Mostrar</span>${(c.filtros || []).map(([id, nome, n]) => `<button type="button" data-cal-filtro="${id}" class="${c.filtro === id ? 'ativo' : ''} ${id === 'atrasados' ? 'alerta' : ''}" aria-pressed="${c.filtro === id}">${esc(nome)}${n != null ? `<b>${n}</b>` : ''}</button>`).join('')}</div>
        ${c.filtrosExtra || ''}</div>
      <div class="cal-resumo">${(c.resumo || []).map((k) => `<div class="k ${k.classe || ''}"><span class="b">${ic(k.icone)}</span><div><small>${esc(k.rot)}</small><b>${k.val}</b><span class="d">${k.det || ''}</span></div></div>`).join('')}</div>
      ${corpo}`;
  }

  /** Liga os cliques do calendário a uma raiz. on: { dia(iso), vista(v), filtro(f), marcar(id), editar(id), novo(iso) } */
  function ligar(raiz, on) {
    raiz.addEventListener('click', (e) => {
      const t = (s) => e.target.closest(s);
      let b;
      if ((b = t('[data-cal-marcar]'))) return on.marcar(b.dataset.calMarcar);
      if ((b = t('[data-cal-editar]'))) return on.editar(b.dataset.calEditar);
      if ((b = t('[data-cal-novo]'))) return on.novo(b.dataset.calNovo);
      if ((b = t('[data-cal-vista]'))) return on.vista(b.dataset.calVista);
      if ((b = t('[data-cal-filtro]'))) return on.filtro(b.dataset.calFiltro);
      if ((b = t('[data-cal-dia]'))) return on.dia(b.dataset.calDia);
    });
  }

  return { SEMANA, gradeMes, semanaDe, porDia, resumo, diaPadrao, montar, ligar, iso, deIso };
});
