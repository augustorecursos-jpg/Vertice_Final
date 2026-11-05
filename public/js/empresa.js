/* Vértice Empresas — interface da empresa. Regras em nucleo-empresa.js; utilidades de tela vêm de app.js (window.VerticeUI). */
(function () {
  'use strict';
  const N = window.Nucleo, E = window.NucleoEmpresa;
  const { MESES, MESES_CURTOS, moeda, moedaCurta } = N;

  function iniciar(ui, eu) {
    const { $, $$, esc, ic, hidratar, api, toast, abrirModal, confirmar, baixar, ligarTip, formatarTelefone, dataHora, iniciais } = ui;
    const hojeD = new Date();
    const est = {
      secao: 'painel', ano: hojeD.getFullYear(), mes: hojeD.getMonth(),
      modo: 'mes', centro: '', filtro: 'todos', busca: '', abertos: new Set(['receita', 'deducao', 'custo', 'despesa', 'financeiro']),
      orc: null, bucket: '_', estrutura: null,
    };
    let D = null; // resposta de /api/empresa
    const papel = () => D.eu.papel;
    const pode = (acao) => E.pode(papel(), acao);
    const meusCentros = () => (papel() === 'gestor' ? D.eu.centros : null);
    const centroNome = (id) => D.estrutura.centros.find((c) => c.id === id)?.nome || '';
    const contaNome = (id) => D.estrutura.contas.find((c) => c.id === id)?.nome || '';
    const tipoDe = (l) => E.tipoDe(l, D.estrutura);
    const filtroCentros = () => (est.centro ? [est.centro] : meusCentros());
    const orcVigente = (ano = est.ano) => D.orcamentos.find((o) => o.ano === ano && o.status === 'vigente');
    const pct = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${String(v).replace('.', ',')}%`);
    const nomePeriodo = () => (est.modo === 'mes' ? `${MESES[est.mes].toLowerCase()} de ${est.ano}`
      : est.modo === 'trimestre' ? `${Math.floor(est.mes / 3) + 1}º trimestre de ${est.ano}` : `janeiro a ${MESES[est.mes].toLowerCase()} de ${est.ano}`);
    const FAROL = { ok: 'dentro', at: 'atenção', es: 'estourado' };

    // ---------- moldura: menu, topo e seções ----------
    const SECOES = [
      ['grupo', 'Gestão'], ['painel', 'painel', 'Painel', 'Painel'], ['contas', 'lista', 'Contas a pagar e receber', 'Contas'],
      ['orcamento', 'tabela', 'Orçamento', 'Orçamento'], ['ovr', 'alvo', 'Orçado × realizado', 'Orç. × real'], ['dre', 'grafico', 'DRE gerencial', 'DRE'],
      ['caixa', 'dinheiro', 'Fluxo de caixa', 'Caixa'], ['grupo', 'Cadastros'], ['cadastros', 'pasta', 'Plano de contas e centros', 'Cadastros'],
      ['equipe', 'usuarios', 'Equipe e plano', 'Equipe'], ['conta', 'ajustes', 'Minha conta', 'Conta'],
    ];
    document.body.classList.add('modo-pj');
    $('.marca small').textContent = 'Empresas';
    $('.marca small').classList.add('pj');
    $('#menu').innerHTML = SECOES.map((s) => (s[0] === 'grupo' ? `<div class="grupo">${s[1]}</div>`
      : `<a href="#${s[0]}" data-secao="${s[0]}">${ic(s[1])} <span class="rot-longo">${esc(s[2])}</span><span class="rot-curto" aria-hidden="true">${esc(s[3])}</span></a>`)).join('');
    $('#menu').insertAdjacentHTML('beforebegin', `<div class="selo-pj" id="selo-pj">${ic('maleta')} <span></span></div>`);
    $$('.fab').forEach((f) => f.remove());
    $('.topo').innerHTML = `<div class="ola"><b id="pj-ola"></b><small id="pj-sub"></small></div>
      <div class="dir"><div class="mes" id="pj-periodo"><button type="button" data-pj-mover="-1" aria-label="Anterior">${ic('esq')}</button>
        <label>${ic('calendario')}<span><small id="pj-rot-periodo">Mês de referência</small><span id="pj-nome-periodo"></span></span></label>
        <button type="button" data-pj-mover="1" aria-label="Próximo">${ic('dir')}</button></div>
        <button type="button" class="btn sec" data-pj-hoje>Hoje</button>
        <button type="button" class="btn novo" data-pj-novo hidden>${ic('mais')} Novo lançamento</button></div>`;
    $$('main > section').forEach((s) => { s.hidden = true; });
    $('#conteudo').insertAdjacentHTML('beforeend', '<div id="pj" class="pj"></div>');
    document.body.insertAdjacentHTML('beforeend', `<button type="button" class="fab" data-pj-novo hidden aria-label="Novo lançamento">${ic('mais')}</button>`);
    const raiz = $('#pj');
    ligarTip(raiz);

    async function carregar() {
      D = await api('GET', '/api/empresa');
      est.estrutura = null;
      if (est.centro && !D.estrutura.centros.some((c) => c.id === est.centro)) est.centro = '';
    }

    function render() {
      $$('#menu a').forEach((a) => { const at = a.dataset.secao === est.secao; a.classList.toggle('ativo', at); if (at) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      const h = new Date().getHours(), nome = (eu.nome || '').trim().split(/\s+/)[0];
      $('#pj-ola').textContent = `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nome ? ', ' + nome : ''}`;
      $('#pj-sub').textContent = `${D.empresa.nome} · ${E.PAPEL[papel()].nome}`;
      $('#selo-pj span').textContent = D.empresa.nome;
      $('#nome-usuario').textContent = eu.nome || 'Você';
      $('#av-usuario').textContent = iniciais(eu.nome);
      $('#sinc').textContent = `${E.PAPEL[papel()].nome} · ${D.empresa.nome}`;
      $('#sinc').className = 'sinc ok';
      const anual = ['orcamento', 'caixa'].includes(est.secao);
      const comPeriodo = ['painel', 'contas', 'ovr', 'dre', 'orcamento', 'caixa'].includes(est.secao);
      $('#pj-periodo').hidden = !comPeriodo; $('[data-pj-hoje]').hidden = !comPeriodo;
      $('#pj-rot-periodo').textContent = anual ? 'Ano' : 'Mês de referência';
      $('#pj-nome-periodo').textContent = anual ? est.ano : `${MESES[est.mes]} ${est.ano}`;
      $$('[data-pj-novo]').forEach((b) => { b.hidden = !pode('lancar'); });
      $('.topo').classList.toggle('sem-periodo', !comPeriodo && !pode('lancar'));
      const f = { painel: rPainel, contas: rContas, orcamento: rOrcamento, ovr: rOvr, dre: rDre, caixa: rCaixa, cadastros: rCadastros, equipe: rEquipe, conta: rConta }[est.secao];
      raiz.innerHTML = f();
      hidratar(raiz);
    }

    function lerHash() {
      const s = location.hash.replace('#', '');
      est.secao = SECOES.some((x) => x[0] === s && x.length > 2) ? s : 'painel';
      render(); window.scrollTo({ top: 0 });
    }

    // ---------- pedaços comuns ----------
    const tile = ({ classe = '', rotulo, valor, det = '' }) => `<div class="kpi dash-kpi ${classe}"><span class="rot">${esc(rotulo)}</span><div class="val">${valor}</div><div class="det">${det}</div></div>`;
    const farol = (f) => `<span class="farol ${f}">${FAROL[f]}</span>`;
    const filtroCentroHtml = () => {
      const lista = D.estrutura.centros.filter((c) => !meusCentros() || meusCentros().includes(c.id));
      if (lista.length <= 1 && meusCentros()) return '';
      return `<div class="filtro-cats" role="group" aria-label="Centro de custo"><span class="rot-filtro">Centro de custo</span>
        <button type="button" data-pj-centro="" class="${est.centro ? '' : 'ativo'}" aria-pressed="${!est.centro}">${meusCentros() ? 'Meus centros' : 'Todos'}</button>
        ${lista.map((c) => `<button type="button" data-pj-centro="${esc(c.id)}" class="${est.centro === c.id ? 'ativo' : ''}" aria-pressed="${est.centro === c.id}">${esc(c.nome)}${c.ativo ? '' : ' (inativo)'}</button>`).join('')}</div>`;
    };
    const alternarModo = (rotAno = 'Acumulado no ano') => `<div class="alternar" role="group" aria-label="Período">
      ${[['mes', 'Mês'], ['trimestre', 'Trimestre'], ['ano', rotAno]].map(([m, n]) => `<button type="button" data-pj-modo="${m}" aria-pressed="${est.modo === m}" class="${est.modo === m ? 'ativo' : ''}">${n}</button>`).join('')}</div>`;
    const botoesExportar = (qual) => `<div class="linha nao-imprimir"><button type="button" class="btn sec peq" data-pj-csv="${qual}">${ic('baixar')} Excel</button><button type="button" class="btn sec peq" data-pj-imprimir>${ic('impressora')} PDF</button></div>`;
    const avisoGestor = () => (meusCentros() ? `<div class="aviso-box info">${ic('escudo')}<div>Você vê os números dos seus centros de custo: <b>${esc(meusCentros().map(centroNome).join(', '))}</b>.</div></div>` : '');
    const semOrcamento = () => `<div class="aviso-box cuidado">${ic('alerta')}<div><b>Ainda não há orçamento aprovado para ${est.ano}.</b> ${pode('orcamento') ? 'Monte o orçamento em <a href="#orcamento">Orçamento</a>' : 'Peça ao Dono ou ao Financeiro para montar o orçamento'} para comparar com o realizado.</div></div>`;

    // ---------- painel ----------
    function rPainel() {
      const p = E.painel({ estrutura: D.estrutura, lancamentos: D.lancamentos, ano: est.ano, mes: est.mes, centros: meusCentros() });
      const o = orcVigente();
      const r = E.orcadoRealizado({ estrutura: D.estrutura, lancamentos: D.lancamentos, valores: o?.valores, ano: est.ano, meses: [est.mes], centros: meusCentros() });
      const item = (l) => { const s = N.situacao(l); const rec = tipoDe(l) === 'receber';
        return `<li class="${s.cod === 'atrasado' ? 'at' : ''}">${ic(rec ? 'sobe' : 'desce')}<span><b>${esc(l.desc)}</b> · ${moeda(l.centavos)} · ${s.cod === 'atrasado' ? `venceu ${N.dataDe(l).toLocaleDateString('pt-BR')}` : s.dias === 0 ? 'vence hoje' : `vence ${N.dataDe(l).toLocaleDateString('pt-BR')}`}
          <small class="suave">${esc(contaNome(l.conta))}${l.centro ? ` · ${esc(centroNome(l.centro))}` : ''}</small></span>
          ${pode('lancar') ? `<button type="button" class="btn sec peq" data-pj-pagar="${esc(l.id)}">${ic('check')} ${rec ? 'Marcar recebido' : 'Marcar pago'}</button>` : ''}</li>`; };
      return `${avisoGestor()}
        <div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="painel"></i></span> Painel de ${esc(MESES[est.mes].toLowerCase())} de ${est.ano}</h2>
          <p>Contas do mês, vencimentos e resultado contra o orçamento</p></div></div>
        <div class="cards dash-cards" style="--n:4">
          ${tile({ classe: 'destaque', rotulo: 'Saldo previsto do mês', valor: moeda(p.receber - p.pagar), det: 'a receber − a pagar' })}
          ${tile({ classe: 'verde', rotulo: 'A receber no mês', valor: moeda(p.receber), det: `${moeda(p.recebido)} já recebido` })}
          ${tile({ classe: 'vermelho', rotulo: 'A pagar no mês', valor: moeda(p.pagar), det: `${moeda(p.pago)} já pago` })}
          ${tile({ classe: p.atrasados.qtd ? 'vermelho' : '', rotulo: 'Atrasados', valor: String(p.atrasados.qtd), det: p.atrasados.qtd ? `${moeda(p.atrasados.pagar)} a pagar · ${moeda(p.atrasados.receber)} a receber` : 'nada em atraso' })}
        </div>
        <div class="dash-grade g-duas">
          <div class="cartao"><div class="cartao-cab"><div><h2>Resultado do mês × orçado</h2><p>${o ? `Orçamento “${esc(o.nome)}”` : 'Sem orçamento aprovado'}</p></div></div>
            <table class="tab-dash pj-res"><tbody>
              <tr><th scope="row">Receitas</th><td class="num">${moeda(r.receitas.realizado)}<small class="suave">orçado ${moeda(r.receitas.orcado)}</small></td><td>${o ? farol(r.receitas.farol) : ''}</td></tr>
              <tr><th scope="row">Custos e despesas</th><td class="num">${moeda(r.despesas.realizado)}<small class="suave">orçado ${moeda(r.despesas.orcado)}</small></td><td>${o ? farol(r.despesas.farol) : ''}</td></tr>
              <tr class="tot"><th scope="row">Resultado</th><td class="num ${r.resultado.realizado < 0 ? 'txt-erro' : ''}"><b>${moeda(r.resultado.realizado)}</b><small class="suave">orçado ${moeda(r.resultado.orcado)}</small></td><td>${o ? farol(r.resultado.farol) : ''}</td></tr>
            </tbody></table>
            ${o && r.estouradas.length ? `<p class="dica">${r.estouradas.length} ${r.estouradas.length === 1 ? 'conta estourou' : 'contas estouraram'} o orçamento: ${esc(r.estouradas.slice(0, 3).map((c) => c.nome).join(', '))}. <a href="#ovr">Ver orçado × realizado</a></p>` : ''}
          </div>
          <div class="cartao"><div class="cartao-cab"><div><h2>Vencimentos</h2><p>Atrasados e próximos 7 dias</p></div></div>
            ${p.atrasados.qtd + p.proximos.length ? `<ul class="alertas-lista pj-venc">${p.atrasados.lista.slice(0, 6).map(item).join('')}${p.proximos.slice(0, 8).map(item).join('')}</ul>` : '<p class="suave">Nada vencendo nos próximos 7 dias.</p>'}
          </div>
        </div>`;
    }

    // ---------- contas a pagar e receber ----------
    function listaContas() {
      const q = est.busca.trim().toLowerCase();
      return D.lancamentos.filter((l) => l.ano === est.ano && l.mes === est.mes)
        .filter((l) => !est.centro || l.centro === est.centro)
        .filter((l) => {
          const t = tipoDe(l), s = N.situacao(l);
          return est.filtro === 'todos' || (est.filtro === 'receber' && t === 'receber') || (est.filtro === 'pagar' && t === 'pagar')
            || (est.filtro === 'aberto' && !l.pago) || (est.filtro === 'atrasados' && s.cod === 'atrasado');
        })
        .filter((l) => !q || [l.desc, l.parte, contaNome(l.conta), centroNome(l.centro)].some((x) => String(x || '').toLowerCase().includes(q)))
        .sort((a, b) => a.dia - b.dia || a.desc.localeCompare(b.desc, 'pt-BR'));
    }
    function rContas() {
      const lista = listaContas();
      const ent = lista.filter((l) => tipoDe(l) === 'receber').reduce((a, l) => a + l.centavos, 0);
      const sai = lista.filter((l) => tipoDe(l) === 'pagar').reduce((a, l) => a + l.centavos, 0);
      const chip = (id, nome) => `<button type="button" data-pj-filtro="${id}" class="${est.filtro === id ? 'ativo' : ''}" aria-pressed="${est.filtro === id}">${nome}</button>`;
      const SIT = { pago: 'Pago', atrasado: 'Atrasado', hoje: 'Vence hoje', breve: 'Vence em breve', pendente: 'Em aberto' };
      const linhas = lista.map((l) => {
        const s = N.situacao(l), rec = tipoDe(l) === 'receber';
        const meu = pode('lancar') && (!meusCentros() || meusCentros().includes(l.centro));
        return `<tr class="${l.pago ? 'feito' : ''} ${s.cod}">
          <td class="num">${String(Math.min(l.dia, N.diasNoMes(l.ano, l.mes))).padStart(2, '0')}/${String(l.mes + 1).padStart(2, '0')}</td>
          <td><b>${esc(l.desc)}</b>${l.parcela ? ` <span class="tag neutra">${l.parcela.n}/${l.parcela.de}</span>` : ''}${l.grupo && !l.parcela ? ` <span class="tag neutra" title="Repete todo mês">${ic('repetir')}</span>` : ''}
            <small class="suave">${esc(l.parte || '')}${l.parte && l.obs ? ' · ' : ''}${esc(l.obs || '').slice(0, 80)}</small></td>
          <td>${esc(contaNome(l.conta))}<small class="suave">${l.centro ? esc(centroNome(l.centro)) : 'sem centro'}</small></td>
          <td class="num ${rec ? 'txt-ok' : ''}"><b>${rec ? '+' : '−'}${moeda(l.centavos)}</b></td>
          <td>${meu ? `<button type="button" class="sit-btn ${s.cod}" data-pj-pagar="${esc(l.id)}" aria-pressed="${l.pago}" title="${l.pago ? 'Marcar como em aberto' : rec ? 'Marcar como recebido' : 'Marcar como pago'}">${l.pago ? ic('check') + (rec ? ' Recebido' : ' Pago') : SIT[s.cod]}</button>` : `<span class="sit-btn ${s.cod}">${l.pago ? (rec ? 'Recebido' : 'Pago') : SIT[s.cod]}</span>`}</td>
          <td class="acoes">${meu ? `<button type="button" class="btn fantasma icone peq" data-pj-editar="${esc(l.id)}" title="Editar" aria-label="Editar ${esc(l.desc)}">${ic('editar')}</button>
            <button type="button" class="btn fantasma icone peq apagar" data-pj-excluir="${esc(l.id)}" title="Excluir" aria-label="Excluir ${esc(l.desc)}">${ic('lixo')}</button>` : ''}</td></tr>`;
      }).join('');
      return `${avisoGestor()}
        <div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="lista"></i></span> Contas a pagar e receber · ${esc(MESES[est.mes].toLowerCase())} de ${est.ano}</h2>
          <p>${lista.length} ${lista.length === 1 ? 'lançamento' : 'lançamentos'} · entradas <b class="txt-ok">${moeda(ent)}</b> · saídas <b>${moeda(sai)}</b> · saldo <b class="${ent - sai < 0 ? 'txt-erro' : ''}">${moeda(ent - sai)}</b></p></div>
          ${botoesExportar('contas')}
          <div class="filtro-cats" role="group" aria-label="Filtro"><span class="rot-filtro">Mostrar</span>${chip('todos', 'Todos')}${chip('receber', 'A receber')}${chip('pagar', 'A pagar')}${chip('aberto', 'Em aberto')}${chip('atrasados', 'Atrasados')}
            <input type="search" class="busca-pj" id="pj-busca" placeholder="Buscar descrição, cliente, conta…" value="${esc(est.busca)}" aria-label="Buscar"></div>
          ${filtroCentroHtml()}
        </div>
        <div class="cartao">${lista.length ? `<div class="tabela-wrap"><table class="t simples tab-contas"><thead><tr><th>Venc.</th><th>Descrição</th><th>Conta e centro</th><th class="num">Valor</th><th>Situação</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>`
          : `<p class="suave">Nenhum lançamento ${est.filtro !== 'todos' || est.busca || est.centro ? 'com esses filtros' : 'neste mês'}.</p>${pode('lancar') ? `<button type="button" class="btn" data-pj-novo>${ic('mais')} Novo lançamento</button>` : ''}`}</div>`;
    }

    function formLancamento(l = null) {
      if (!pode('lancar')) return;
      const contasAtivas = D.estrutura.contas.filter((c) => c.ativa || c.id === l?.conta);
      const centros = D.estrutura.centros.filter((c) => (c.ativo || c.id === l?.centro) && (!meusCentros() || meusCentros().includes(c.id)));
      const tipo0 = l ? tipoDe(l) : 'pagar';
      const data0 = l ? N.isoDe(l) : `${est.ano}-${String(est.mes + 1).padStart(2, '0')}-${String(est.ano === hojeD.getFullYear() && est.mes === hojeD.getMonth() ? hojeD.getDate() : 10).padStart(2, '0')}`;
      const opcoes = (tipo) => E.GRUPOS.filter((g) => g.tipo === tipo).map((g) => {
        const cs = contasAtivas.filter((c) => c.grupo === g.id);
        return cs.length ? `<optgroup label="${esc(g.nome)}">${cs.map((c) => `<option value="${esc(c.id)}" ${c.id === l?.conta ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</optgroup>` : '';
      }).join('');
      const { modal, fechar } = abrirModal(`
        <form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-pjl" novalidate>
          <div class="cab-modal"><h2 id="t-pjl">${l ? 'Editar lançamento' : 'Novo lançamento'}</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <div class="grade-form">
            <fieldset class="inteiro pilulas" id="pjl-tipo"><legend class="rotulo" style="padding:0;margin-bottom:.45em">Tipo</legend>
              <label><input type="radio" name="pjl-tipo" value="pagar" ${tipo0 === 'pagar' ? 'checked' : ''}><span>${ic('desce')} A pagar</span></label>
              <label><input type="radio" name="pjl-tipo" value="receber" ${tipo0 === 'receber' ? 'checked' : ''}><span>${ic('sobe')} A receber</span></label></fieldset>
            <div class="inteiro"><label class="rotulo" for="pjl-desc">Descrição</label><input type="text" id="pjl-desc" maxlength="120" value="${esc(l?.desc || '')}" placeholder="Ex.: Aluguel do escritório, Nota fiscal 1234" required></div>
            <div><label class="rotulo" for="pjl-valor">${l?.parcela ? 'Valor da parcela' : 'Valor'}</label><div class="campo-valor"><span>R$</span><input type="text" id="pjl-valor" inputmode="decimal" value="${l ? N.valorParaCampo(l.centavos) : ''}" placeholder="0,00" required></div></div>
            <div><label class="rotulo" for="pjl-data">Vencimento</label><input type="date" id="pjl-data" value="${data0}" required></div>
            <div><label class="rotulo" for="pjl-conta">Conta</label><select id="pjl-conta" required></select></div>
            <div><label class="rotulo" for="pjl-centro">Centro de custo</label><select id="pjl-centro">${meusCentros() ? '' : '<option value="">Sem centro</option>'}${centros.map((c) => `<option value="${esc(c.id)}" ${c.id === l?.centro ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
            <div class="inteiro"><label class="rotulo" for="pjl-parte" id="pjl-parte-rot">Fornecedor <small>(opcional)</small></label><input type="text" id="pjl-parte" maxlength="80" value="${esc(l?.parte || '')}"></div>
            ${l ? `<label class="inteiro marcar-linha"><input type="checkbox" id="pjl-pago" ${l.pago ? 'checked' : ''}> <span id="pjl-pago-rot">Já foi pago</span></label>` : `
            <fieldset class="inteiro pilulas" id="pjl-rec"><legend class="rotulo" style="padding:0;margin-bottom:.45em">Repetição</legend>
              <label><input type="radio" name="pjl-rec" value="unica" checked><span>Só uma vez</span></label>
              <label><input type="radio" name="pjl-rec" value="mensal"><span>Todo mês</span></label>
              <label><input type="radio" name="pjl-rec" value="parcelada"><span>Parcelado</span></label></fieldset>
            <div id="pjl-qtd-campo" hidden><label class="rotulo" for="pjl-qtd" id="pjl-qtd-rot">Quantos meses?</label><input type="number" id="pjl-qtd" min="2" max="120" value="12" inputmode="numeric"></div>`}
            <div class="inteiro"><label class="rotulo" for="pjl-obs">Observações <small>(opcional)</small></label><textarea id="pjl-obs" rows="2" maxlength="1000">${esc(l?.obs || '')}</textarea></div>
          </div>
          <p class="erro-campo" id="pjl-erro" role="alert"></p>
          <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} Salvar</button></div>
        </form>`);
      const tipo = () => $('input[name=pjl-tipo]:checked', modal).value;
      const atualizarTipo = () => {
        const atual = $('#pjl-conta', modal).value;
        $('#pjl-conta', modal).innerHTML = opcoes(tipo());
        if ([...$('#pjl-conta', modal).options].some((o) => o.value === atual)) $('#pjl-conta', modal).value = atual;
        $('#pjl-parte-rot', modal).innerHTML = `${tipo() === 'receber' ? 'Cliente' : 'Fornecedor'} <small>(opcional)</small>`;
        if ($('#pjl-pago-rot', modal)) $('#pjl-pago-rot', modal).textContent = tipo() === 'receber' ? 'Já foi recebido' : 'Já foi pago';
      };
      atualizarTipo();
      modal.addEventListener('change', (e) => {
        if (e.target.name === 'pjl-tipo') atualizarTipo();
        if (e.target.name === 'pjl-rec') {
          const v = e.target.value;
          $('#pjl-qtd-campo', modal).hidden = v === 'unica';
          $('#pjl-qtd-rot', modal).textContent = v === 'parcelada' ? 'Quantas parcelas? (o valor é dividido)' : 'Quantos meses?';
        }
      });
      modal.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = (m) => { $('#pjl-erro', modal).textContent = m; };
        const desc = $('#pjl-desc', modal).value.trim(), centavos = N.lerValor($('#pjl-valor', modal).value), data = N.lerIso($('#pjl-data', modal).value);
        if (!desc) return err('Informe a descrição.');
        if (!(centavos > 0)) return err('Informe um valor maior que zero, por exemplo 1.250,00.');
        if (!data) return err('Informe o vencimento.');
        const conta = $('#pjl-conta', modal).value;
        if (!conta) return err('Escolha a conta.');
        const dadosForm = { desc, centavos, conta, centro: $('#pjl-centro', modal).value || null, ano: data.ano, mes: data.mes, dia: data.dia, parte: $('#pjl-parte', modal).value, obs: $('#pjl-obs', modal).value };
        try {
          if (l) await api('PUT', `/api/empresa/lancamentos/${encodeURIComponent(l.id)}`, { ...dadosForm, pago: $('#pjl-pago', modal).checked });
          else {
            const rec = $('input[name=pjl-rec]:checked', modal).value;
            const lista = E.gerarLancamentos({ ...dadosForm, recorrencia: rec, quantidade: +$('#pjl-qtd', modal).value });
            await api('POST', '/api/empresa/lancamentos', { lancamentos: lista });
          }
          fechar(); await carregar();
          // Mostra o que acabou de ser salvo, mesmo que os filtros escondessem.
          if (!l) { est.ano = data.ano; est.mes = data.mes; }
          if (est.filtro !== 'todos' || est.busca || (est.centro && est.centro !== dadosForm.centro)) { est.filtro = 'todos'; est.busca = ''; est.centro = ''; }
          render(); toast(l ? 'Lançamento atualizado.' : 'Lançamento criado.');
        } catch (er) { err(er.message); }
      });
    }

    async function alternarPago(id) {
      const l = D.lancamentos.find((x) => x.id === id);
      if (!l) return;
      try {
        await api('PUT', `/api/empresa/lancamentos/${encodeURIComponent(id)}`, { pago: !l.pago });
        l.pago = !l.pago; render();
        toast(l.pago ? (tipoDe(l) === 'receber' ? 'Marcado como recebido.' : 'Marcado como pago.') : 'Voltou para em aberto.', { acao: () => alternarPago(id) });
      } catch (er) { toast(er.message, { erro: true }); }
    }

    async function excluirLancamento(id) {
      const l = D.lancamentos.find((x) => x.id === id);
      if (!l) return;
      let ids = [id];
      if (l.grupo) {
        const serie = D.lancamentos.filter((x) => x.grupo === l.grupo);
        const proximos = serie.filter((x) => N.chaveMes(x.ano, x.mes) >= N.chaveMes(l.ano, l.mes));
        const esc2 = await new Promise((ok) => {
          const { fundo, modal, fechar } = abrirModal(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-pje"><div class="cab-modal"><h2 id="t-pje">Excluir ${l.parcela ? 'parcelamento' : 'recorrência'}</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
            <p class="suave" style="margin-top:0">“${esc(l.desc)}” faz parte de uma série com ${serie.length} lançamentos.</p>
            <div class="opcoes-escopo"><button type="button" class="btn sec" data-e="este"><span>Só este<small>${esc(MESES[l.mes])} de ${l.ano}</small></span></button>
            <button type="button" class="btn sec" data-e="proximos"><span>Este e os próximos<small>${proximos.length} lançamentos</small></span></button>
            <button type="button" class="btn sec" data-e="todos"><span>Toda a série<small>${serie.length} lançamentos</small></span></button></div></div>`, { estreito: true });
          fundo.addEventListener('cancelado', () => ok(null));
          modal.addEventListener('click', (e) => { const b = e.target.closest('[data-e]'); if (b) { fechar(); ok(b.dataset.e); } });
        });
        if (!esc2) return;
        if (esc2 === 'proximos') ids = proximos.map((x) => x.id);
        if (esc2 === 'todos') ids = serie.map((x) => x.id);
      } else if (!(await confirmar({ titulo: 'Excluir lançamento?', perigo: true, botao: 'Excluir', texto: `“<b>${esc(l.desc)}</b>” de ${moeda(l.centavos)} será excluído.` }))) return;
      try {
        const antes = D.lancamentos.filter((x) => ids.includes(x.id));
        await api('POST', '/api/empresa/lancamentos/excluir', { ids });
        await carregar(); render();
        toast(ids.length > 1 ? `${ids.length} lançamentos excluídos.` : 'Lançamento excluído.', { acao: async () => {
          try { await api('POST', '/api/empresa/lancamentos', { lancamentos: antes }); await carregar(); render(); } catch (er) { toast(er.message, { erro: true }); }
        } });
      } catch (er) { toast(er.message, { erro: true }); }
    }

    // ---------- orçamento ----------
    function prepararOrc() {
      if (est.orc && est.orc.ano === est.ano) return est.orc;
      const versao = orcVigente() || D.orcamentos.find((o) => o.ano === est.ano);
      est.orc = { ano: est.ano, versao: versao?.id || null, valores: structuredClone(versao?.valores || {}), alterado: false };
      return est.orc;
    }
    const valorCelula = (valores, conta, bucket, m) => (bucket === '*'
      ? Object.values(valores[conta] || {}).reduce((a, arr) => a + (arr[m] || 0), 0)
      : valores[conta]?.[bucket]?.[m] || 0);
    const reais = (c) => (c ? Math.round(c / 100).toLocaleString('pt-BR') : '');

    function rOrcamento() {
      const o = prepararOrc();
      const editavel = pode('orcamento') && est.bucket !== '*';
      if (!pode('orcamento') && est.bucket !== '*' && meusCentros() && !meusCentros().includes(est.bucket)) est.bucket = '*';
      const versao = D.orcamentos.find((v) => v.id === o.versao);
      const vigente = orcVigente();
      const buckets = [['*', 'Consolidado'], ['_', 'Geral (sem centro)'], ...D.estrutura.centros.filter((c) => !meusCentros() || meusCentros().includes(c.id)).map((c) => [c.id, c.nome + (c.ativo ? '' : ' (inativo)')])]
        .filter(([b]) => !meusCentros() || b !== '_');
      const contas = D.estrutura.contas.filter((c) => c.ativa || Object.keys(o.valores[c.id] || {}).length);
      const somaMes = (ids, m) => ids.reduce((a, id) => a + valorCelula(o.valores, id, est.bucket, m), 0);
      const linhaTot = (nome, ids, cls, sinal = 1, outros = null) => {
        const ms = Array.from({ length: 12 }, (_, m) => sinal * somaMes(ids, m) - (outros ? somaMes(outros, m) : 0));
        return `<tr class="${cls}"><th scope="row">${esc(nome)}</th>${ms.map((v) => `<td class="num">${v < 0 ? '−' : ''}${reais(Math.abs(v))}</td>`).join('')}<td class="num tot">${E.somaLinha(ms) < 0 ? '−' : ''}${reais(Math.abs(E.somaLinha(ms)))}</td></tr>`;
      };
      let corpo = '';
      for (const g of E.GRUPOS) {
        const cs = contas.filter((c) => c.grupo === g.id);
        if (!cs.length) continue;
        corpo += linhaTot(g.nome, cs.map((c) => c.id), 'grp');
        corpo += cs.map((c) => {
          const ms = Array.from({ length: 12 }, (_, m) => valorCelula(o.valores, c.id, est.bucket, m));
          return `<tr class="sub"><th scope="row">${esc(c.nome)}${c.ativa ? '' : ' <small class="suave">(inativa)</small>'}</th>${ms.map((v, m) => (editavel
            ? `<td><input type="text" inputmode="numeric" class="cel" data-orc-conta="${esc(c.id)}" data-orc-mes="${m}" value="${reais(v)}" aria-label="${esc(c.nome)}, ${MESES[m]}"></td>`
            : `<td class="num">${reais(v)}</td>`)).join('')}<td class="num tot">${reais(E.somaLinha(ms))}</td></tr>`;
        }).join('');
      }
      const rec = contas.filter((c) => c.grupo === 'receita').map((c) => c.id), desp = contas.filter((c) => c.grupo !== 'receita').map((c) => c.id);
      corpo += linhaTot('Resultado orçado', rec, 'res', 1, desp);
      const totAno = (ids) => ids.reduce((a, id) => a + Array.from({ length: 12 }, (_, m) => valorCelula(o.valores, id, '*', m)).reduce((x, y) => x + y, 0), 0);
      const tR = totAno(rec), tD = totAno(desp);
      const versoes = D.orcamentos.filter((v) => v.ano === est.ano);
      const STATUS = { vigente: ['ok', 'vigente'], proposta: ['aviso', 'proposta'], substituida: ['neutra', 'anterior'] };
      return `<div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="tabela"></i></span> Orçamento ${est.ano}</h2>
          <p>${versao ? `Versão <b>${esc(versao.nome)}</b> · ${versao.status === 'vigente' ? `aprovada${versao.aprovadoPor ? ` por ${esc(versao.aprovadoPor)}` : ''}` : versao.status === 'proposta' ? 'proposta aguardando aprovação do Dono' : 'versão anterior'}` : 'Nenhuma versão salva para este ano'}${o.alterado ? ' · <b class="txt-erro">alterações não salvas</b>' : ''}
            · ${pode('orcamento') ? 'cada célula é um mês de uma conta, em R$' : 'somente consulta'}</p></div>
          <div class="linha acoes-orc nao-imprimir">
            ${pode('orcamento') ? `<button type="button" class="btn sec peq" data-orc="copiar">${ic('copiar')} Copiar de ${est.ano - 1} + reajuste</button>
              <button type="button" class="btn sec peq" data-orc="distribuir" ${editavel ? '' : 'disabled title="Escolha Geral ou um centro de custo"'}>Distribuir valor anual</button>` : ''}
            <button type="button" class="btn sec peq" data-pj-csv="orcamento">${ic('baixar')} Excel</button>
            ${pode('orcamento') ? `<button type="button" class="btn peq" data-orc="salvar" ${o.alterado ? '' : 'disabled'}>${ic('check')} ${papel() === 'dono' ? 'Salvar e aprovar' : 'Salvar proposta'}</button>` : ''}
          </div>
          <div class="filtro-cats" role="group" aria-label="Centro de custo"><span class="rot-filtro">Centro de custo</span>
            ${buckets.map(([b, n]) => `<button type="button" data-orc-bucket="${esc(b)}" class="${est.bucket === b ? 'ativo' : ''}" aria-pressed="${est.bucket === b}">${esc(n)}</button>`).join('')}</div>
        </div>
        ${est.bucket === '*' && pode('orcamento') ? `<div class="aviso-box info nao-imprimir">${ic('info')}<div>O consolidado soma tudo e é só leitura. Para digitar, escolha <b>Geral</b> ou um centro de custo.</div></div>` : ''}
        <div class="cartao"><div class="tabela-wrap rolar-orc"><table class="grade-orc"><thead><tr><th scope="col">Conta</th>${MESES_CURTOS.map((m) => `<th scope="col" class="num">${m}</th>`).join('')}<th scope="col" class="num">Total</th></tr></thead><tbody>${corpo}</tbody></table></div>
          ${editavel ? '<p class="dica">Digite como numa planilha: Enter desce, Tab vai para o lado. Valores em reais inteiros. Ao salvar, a versão anterior fica no histórico.</p>' : ''}</div>
        <div class="dash-grade g-duas">
          <div class="cartao"><div class="cartao-cab"><div><h2>Resumo do orçamento</h2><p>Todos os centros</p></div></div><table class="tab-dash"><tbody>
            <tr><th scope="row">Receitas previstas</th><td class="num"><b>${moeda(tR)}</b></td></tr>
            <tr><th scope="row">Custos e despesas previstos</th><td class="num"><b>${moeda(tD)}</b></td></tr>
            <tr><th scope="row">Resultado previsto</th><td class="num"><b class="${tR - tD < 0 ? 'txt-erro' : ''}">${moeda(tR - tD)}</b></td></tr>
            <tr><th scope="row">Margem prevista</th><td class="num"><b>${tR ? String(Math.round(((tR - tD) / tR) * 1000) / 10).replace('.', ',') + '%' : '—'}</b></td></tr></tbody></table></div>
          <div class="cartao"><div class="cartao-cab"><div><h2>Histórico de versões</h2><p>${vigente ? `Vigente: ${esc(vigente.nome)}` : 'Nenhuma versão aprovada'}</p></div></div>
            ${versoes.length ? `<ol class="estabs">${versoes.map((v) => `<li><span>${esc(v.nome)} · ${esc(v.autor || '')} <small>${esc(dataHora(v.criadoEm))}</small></span>
              <span class="tag ${STATUS[v.status][0]}">${STATUS[v.status][1]}</span>
              ${v.id !== o.versao ? `<button type="button" class="btn fantasma peq" data-orc-ver="${v.id}">abrir</button>` : '<small>aberta</small>'}
              ${v.status === 'proposta' && pode('aprovar') ? `<button type="button" class="btn sec peq" data-orc-aprovar="${v.id}">${ic('check')} Aprovar</button>` : ''}</li>`).join('')}</ol>`
              : '<p class="suave">As versões salvas aparecem aqui para comparação.</p>'}</div>
        </div>`;
    }

    function definirCelula(conta, m, centavos) {
      const o = est.orc, b = est.bucket;
      const arr = ((o.valores[conta] ||= {})[b] ||= Array(12).fill(0));
      if (arr[m] === centavos) return false;
      arr[m] = centavos;
      o.alterado = true;
      return true;
    }

    async function acaoOrcamento(a) {
      const o = est.orc;
      if (a === 'salvar') {
        const nome = await new Promise((ok) => {
          const { fundo, modal, fechar } = abrirModal(`<form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-ov" novalidate><div class="cab-modal"><h2 id="t-ov">${papel() === 'dono' ? 'Salvar e aprovar' : 'Salvar proposta'}</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
            <label class="rotulo" for="ov-nome">Nome da versão</label><input type="text" id="ov-nome" maxlength="80" placeholder="Ex.: Revisão de marketing" autofocus>
            <p class="dica">${papel() === 'dono' ? 'Esta versão passa a ser a vigente, usada no orçado × realizado e na DRE.' : 'A versão fica como proposta até o Dono aprovar.'}</p>
            <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">${ic('check')} Salvar</button></div></form>`, { estreito: true });
          fundo.addEventListener('cancelado', () => ok(null));
          modal.addEventListener('submit', (e) => { e.preventDefault(); const v = $('#ov-nome', modal).value.trim(); if (!v) return $('#ov-nome', modal).focus(); fechar(); ok(v); });
        });
        if (!nome) return;
        try {
          const r = await api('POST', '/api/empresa/orcamentos', { ano: o.ano, nome, valores: o.valores });
          await carregar(); est.orc = null; prepararOrc(); est.orc.versao = r.id; est.orc.valores = structuredClone(D.orcamentos.find((v) => v.id === r.id).valores);
          render(); toast(r.status === 'vigente' ? 'Orçamento salvo e aprovado.' : 'Proposta salva. O Dono pode aprovar no histórico de versões.');
        } catch (er) { toast(er.message, { erro: true }); }
      }
      if (a === 'copiar') {
        const fonte = orcVigente(est.ano - 1) || D.orcamentos.find((v) => v.ano === est.ano - 1);
        if (!fonte) return toast(`Não há orçamento de ${est.ano - 1} para copiar.`, { erro: true });
        const pctTxt = await new Promise((ok) => {
          const { fundo, modal, fechar } = abrirModal(`<form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-oc" novalidate><div class="cab-modal"><h2 id="t-oc">Copiar de ${est.ano - 1}</h2>
            <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
            <p style="margin-top:0">Copia a versão <b>${esc(fonte.nome)}</b> de ${est.ano - 1} para ${est.ano}, substituindo o que está na tela.</p>
            <label class="rotulo" for="oc-pct">Reajuste (%)</label><input type="text" id="oc-pct" inputmode="decimal" value="5" autofocus>
            <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">Copiar</button></div></form>`, { estreito: true });
          fundo.addEventListener('cancelado', () => ok(null));
          modal.addEventListener('submit', (e) => { e.preventDefault(); fechar(); ok($('#oc-pct', modal).value); });
        });
        if (pctTxt == null) return;
        o.valores = E.reajustar(fonte.valores, Number(String(pctTxt).replace(',', '.')) || 0);
        o.alterado = true; render(); toast('Orçamento copiado. Revise e salve.');
      }
      if (a === 'distribuir') {
        const contas = D.estrutura.contas.filter((c) => c.ativa);
        const { modal, fechar } = abrirModal(`<form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-od" novalidate><div class="cab-modal"><h2 id="t-od">Distribuir valor anual</h2>
          <button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
          <div class="grade-form"><div class="inteiro"><label class="rotulo" for="od-conta">Conta</label><select id="od-conta">${E.GRUPOS.map((g) => `<optgroup label="${esc(g.nome)}">${contas.filter((c) => c.grupo === g.id).map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('')}</optgroup>`).join('')}</select></div>
          <div class="inteiro"><label class="rotulo" for="od-valor">Valor do ano</label><div class="campo-valor"><span>R$</span><input type="text" id="od-valor" inputmode="decimal" placeholder="120.000,00"></div></div></div>
          <p class="dica">Divide em 12 meses iguais em <b>${esc(est.bucket === '_' ? 'Geral' : centroNome(est.bucket))}</b>, substituindo os meses dessa conta.</p>
          <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button><button class="btn">Distribuir</button></div></form>`, { estreito: true });
        modal.addEventListener('submit', (e) => {
          e.preventDefault();
          const v = N.lerValor($('#od-valor', modal).value);
          if (!(v >= 0)) return $('#od-valor', modal).focus();
          const partes = N.dividir(v, 12), conta = $('#od-conta', modal).value;
          partes.forEach((c, m) => definirCelula(conta, m, c));
          fechar(); render(); toast('Valor distribuído nos 12 meses.');
        });
      }
    }

    // ---------- orçado × realizado ----------
    function rOvr() {
      const o = orcVigente();
      const meses = E.mesesDoPeriodo(est.mes, est.modo);
      const r = E.orcadoRealizado({ estrutura: D.estrutura, lancamentos: D.lancamentos, valores: o?.valores, ano: est.ano, meses, centros: filtroCentros() });
      const serie = E.despesasNoAno({ estrutura: D.estrutura, lancamentos: D.lancamentos, valores: o?.valores, ano: est.ano, centros: filtroCentros() });
      const linha = (c, cls, receita) => {
        const bom = receita ? c.dif >= 0 : c.dif <= 0;
        return `<tr class="${cls}" ${cls === 'grp' ? `data-pj-grupo="${c.id}" tabindex="0" aria-expanded="${est.abertos.has(c.id)}"` : ''}>
          <th scope="row">${cls === 'grp' ? ic(est.abertos.has(c.id) ? 'desce2' : 'dir') + ' ' : ''}${esc(c.nome)}</th><td class="num">${moeda(c.orcado)}</td><td class="num">${moeda(c.realizado)}</td>
          <td class="num ${c.dif ? (bom ? 'pos' : 'neg') : ''}">${c.dif > 0 ? '+' : c.dif < 0 ? '−' : ''}${moeda(Math.abs(c.dif))}</td><td class="num ${c.dif ? (bom ? 'pos' : 'neg') : ''}">${pct(c.pct)}</td><td>${farol(c.farol)}</td></tr>`;
      };
      const corpo = r.grupos.filter((g) => g.orcado || g.realizado).map((g) => linha(g, 'grp', g.receita) + (est.abertos.has(g.id) ? g.contas.map((c) => linha(c, 'sub', g.receita)).join('') : '')).join('')
        + `<tr class="tot"><th scope="row">Resultado</th><td class="num">${moeda(r.resultado.orcado)}</td><td class="num">${moeda(r.resultado.realizado)}</td>
          <td class="num ${r.resultado.dif >= 0 ? 'pos' : 'neg'}">${r.resultado.dif > 0 ? '+' : r.resultado.dif < 0 ? '−' : ''}${moeda(Math.abs(r.resultado.dif))}</td><td class="num ${r.resultado.dif >= 0 ? 'pos' : 'neg'}">${pct(r.resultado.pct)}</td><td>${farol(r.resultado.farol)}</td></tr>`;
      const mx = Math.max(1, ...serie.flatMap((s) => [s.orcado, s.realizado]));
      const futuro = (m) => est.ano > hojeD.getFullYear() || (est.ano === hojeD.getFullYear() && m > hojeD.getMonth());
      const graf = `<div class="grafico-ovr">${serie.map((s) => `<div class="col-ovr ${futuro(s.mes) ? 'futuro' : ''}"><div class="barras">
          <span class="o" style="height:${(s.orcado / mx) * 100}%" data-tip="${esc(`Orçado|${moeda(s.orcado)}|${MESES[s.mes]} de ${est.ano}`)}" tabindex="0"></span>
          <span class="r ${s.realizado > s.orcado * 1.03 && s.orcado ? 'es' : ''}" style="height:${(s.realizado / mx) * 100}%" data-tip="${esc(`Realizado|${moeda(s.realizado)}|${MESES[s.mes]} de ${est.ano}${s.orcado ? ` · ${pct(E.pctDif(s.orcado, s.realizado))}` : ''}`)}" tabindex="0"></span></div><small>${MESES_CURTOS[s.mes].toLowerCase()}</small></div>`).join('')}</div>
        <div class="legenda-ovr"><span><i style="background:#c3cfdc"></i>Orçado</span><span><i style="background:var(--primaria)"></i>Realizado</span><span><i style="background:var(--vermelho)"></i>Acima do orçado</span></div>`;
      return `${avisoGestor()}
        <div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="alvo"></i></span> Orçado × realizado · ${esc(nomePeriodo())}</h2><p>${o ? `Comparação com o orçamento “${esc(o.nome)}”` : 'Sem orçamento aprovado'}</p></div>
          ${alternarModo()}${botoesExportar('ovr')}${filtroCentroHtml()}</div>
        ${o ? '' : semOrcamento()}
        <div class="cards dash-cards" style="--n:4">
          ${tile({ classe: 'destaque', rotulo: 'Resultado', valor: moeda(r.resultado.realizado), det: `orçado ${moeda(r.resultado.orcado)}${r.resultado.pct != null ? ` · <span class="delta ${r.resultado.dif >= 0 ? 'bom' : 'ruim'}">${pct(r.resultado.pct)}</span>` : ''}` })}
          ${tile({ classe: 'verde', rotulo: 'Receitas', valor: moeda(r.receitas.realizado), det: `orçado ${moeda(r.receitas.orcado)} · ${farol(r.receitas.farol)}` })}
          ${tile({ classe: 'vermelho', rotulo: 'Custos e despesas', valor: moeda(r.despesas.realizado), det: `orçado ${moeda(r.despesas.orcado)} · ${farol(r.despesas.farol)}` })}
          ${tile({ classe: 'indigo', rotulo: 'Contas estouradas', valor: `${r.estouradas.length} de ${r.contas}`, det: r.estouradas.length ? `${esc(r.estouradas.slice(0, 2).map((c) => c.nome).join(', '))}${r.atencao.length ? ` · ${r.atencao.length} em atenção` : ''}` : r.atencao.length ? `${r.atencao.length} em atenção` : 'tudo dentro do orçado' })}
        </div>
        <div class="cartao"><div class="cartao-cab"><div><h2>Por conta</h2><p>Toque num grupo para abrir ou fechar as contas</p></div></div>
            <div class="tabela-wrap" style="border:0"><table class="ovr"><thead><tr><th scope="col">Conta</th><th scope="col" class="num">Orçado</th><th scope="col" class="num">Realizado</th><th scope="col" class="num">Diferença</th><th scope="col" class="num">%</th><th scope="col">Situação</th></tr></thead><tbody>${corpo}</tbody></table></div>
            <p class="dica">Dentro: até 3% de diferença ou a favor. Atenção: até 10% contra. Estourado: mais de 10% contra o orçado.</p></div>
        <div class="dash-grade g-duas">
            <div class="cartao"><div class="cartao-cab"><div><h2>Despesas em ${est.ano}</h2><p>Orçado × realizado por mês</p></div></div>${graf}</div>
            <div class="cartao"><div class="cartao-cab"><div><h2>Maiores desvios</h2><p>${esc(nomePeriodo())}</p></div></div>
              ${r.desvios.length ? `<ul class="alertas-lista">${r.desvios.map((c) => `<li class="${c.desfavoravel ? 'at' : ''}">${ic(c.desfavoravel ? 'alerta' : 'check')}<span><b>${esc(c.nome)} ${pct(c.pct)}</b> · realizado ${moeda(c.realizado)}, orçado ${moeda(c.orcado)} (${c.dif > 0 ? '+' : '−'}${moeda(Math.abs(c.dif))}).</span></li>`).join('')}</ul>` : '<p class="suave">Sem desvios no período.</p>'}</div>
        </div>`;
    }

    // ---------- DRE ----------
    function calcDre() {
      return E.dre({ estrutura: D.estrutura, lancamentos: D.lancamentos, valores: orcVigente()?.valores, ano: est.ano, meses: E.mesesDoPeriodo(est.mes, est.modo), centros: filtroCentros() });
    }
    function rDre() {
      const d = calcDre();
      const nomeP = est.modo === 'mes' ? MESES_CURTOS[est.mes].toLowerCase() : est.modo === 'trimestre' ? `${Math.floor(est.mes / 3) + 1}º tri` : 'acum.';
      const v = (c) => `${c < 0 ? '−' : ''}${moeda(Math.abs(c))}`;
      const corpo = d.linhas.map((l) => {
        const abre = l.contas?.length;
        const aberto = abre && est.abertos.has('dre-' + l.id);
        return `<tr class="${l.tipo}" ${abre ? `data-pj-grupo="dre-${l.id}" tabindex="0" aria-expanded="${!!aberto}"` : ''}><th scope="row">${abre ? ic(aberto ? 'desce2' : 'dir') + ' ' : ''}${esc(l.nome)}</th>
          <td class="num">${v(l.real)}</td><td class="num">${v(l.orc)}</td><td class="num">${v(l.acum)}</td><td class="num pct">${l.pct == null ? '—' : String(l.pct).replace('.', ',') + '%'}</td></tr>`
          + (aberto ? l.contas.map((c) => `<tr class="det"><th scope="row">${esc(c.nome)}</th><td class="num">${v(c.real)}</td><td class="num">${v(c.orc)}</td><td class="num">${v(c.acum)}</td><td></td></tr>`).join('') : '');
      }).join('');
      return `${avisoGestor()}
        <div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="grafico"></i></span> DRE gerencial · ${esc(nomePeriodo())}</h2><p>Montada a partir dos lançamentos e do plano de contas · margem do período ${d.margem == null ? '—' : String(d.margem).replace('.', ',') + '%'}</p></div>
          ${alternarModo('Ano')}${botoesExportar('dre')}${filtroCentroHtml()}</div>
        <div class="cartao"><div class="tabela-wrap" style="border:0"><table class="dre"><thead><tr><th scope="col">Linha</th><th scope="col" class="num">Realizado ${esc(nomeP)}</th><th scope="col" class="num">Orçado ${esc(nomeP)}</th><th scope="col" class="num">Acumulado ${est.ano}</th><th scope="col" class="num">% da receita (acum.)</th></tr></thead><tbody>${corpo}</tbody></table></div>
          <p class="dica">Toque numa linha para abrir as contas que formam o valor. Regime de competência pelo mês de vencimento. Exporte em Excel ou PDF para a reunião de resultados.</p></div>`;
    }

    // ---------- fluxo de caixa ----------
    function rCaixa() {
      const f = E.fluxoCaixa({ estrutura: D.estrutura, lancamentos: D.lancamentos, ano: est.ano, centros: filtroCentros() });
      const ent = f.meses.reduce((a, m) => a + m.entradas, 0), sai = f.meses.reduce((a, m) => a + m.saidas, 0);
      const mx = Math.max(1, ...f.meses.flatMap((m) => [m.entradas, m.saidas]));
      const graf = `<div class="grafico-ovr caixa">${f.meses.map((m) => `<div class="col-ovr"><div class="barras">
          <span class="e" style="height:${(m.entradas / mx) * 100}%" data-tip="${esc(`Entradas|${moeda(m.entradas)}|${MESES[m.mes]} · ${moeda(m.entradasRealizadas)} recebido`)}" tabindex="0"></span>
          <span class="s" style="height:${(m.saidas / mx) * 100}%" data-tip="${esc(`Saídas|${moeda(m.saidas)}|${MESES[m.mes]} · ${moeda(m.saidasRealizadas)} pago`)}" tabindex="0"></span></div><small>${MESES_CURTOS[m.mes].toLowerCase()}</small></div>`).join('')}</div>
        <div class="legenda-ovr"><span><i style="background:var(--verde)"></i>Entradas</span><span><i style="background:#c2410c"></i>Saídas</span></div>`;
      const tr = (nome, fn, cls = '') => `<tr class="${cls}"><th scope="row">${nome}</th>${f.meses.map((m) => { const x = fn(m); return `<td class="num ${x < 0 ? 'txt-erro' : ''}">${x < 0 ? '−' : ''}${moedaCurta(Math.abs(x))}</td>`; }).join('')}</tr>`;
      return `${avisoGestor()}
        <div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="dinheiro"></i></span> Fluxo de caixa ${est.ano}</h2><p>Entradas e saídas pelo vencimento, com saldo acumulado${meusCentros() || est.centro ? ' (sem o saldo inicial, por ser um recorte por centro)' : ' a partir do saldo inicial'}</p></div>
          ${botoesExportar('caixa')}${filtroCentroHtml()}</div>
        ${f.negativos.length ? `<div class="aviso-box alerta">${ic('alerta')}<div><b>O caixa fica negativo em ${esc(f.negativos.map((m) => MESES[m].toLowerCase()).join(', '))}.</b> Antecipe recebimentos, renegocie pagamentos ou reveja o orçamento.</div></div>` : ''}
        <div class="cards dash-cards" style="--n:4">
          ${tile({ classe: 'destaque', rotulo: 'Saldo final previsto', valor: moeda(f.final), det: `começa o ano com ${moeda(f.inicial)}` })}
          ${tile({ classe: 'verde', rotulo: 'Entradas no ano', valor: moeda(ent), det: `${moeda(f.meses.reduce((a, m) => a + m.entradasRealizadas, 0))} já recebido` })}
          ${tile({ classe: 'vermelho', rotulo: 'Saídas no ano', valor: moeda(sai), det: `${moeda(f.meses.reduce((a, m) => a + m.saidasRealizadas, 0))} já pago` })}
          ${tile({ classe: f.negativos.length ? 'vermelho' : 'indigo', rotulo: 'Menor saldo do ano', valor: moeda(Math.min(...f.meses.map((m) => m.saldo))), det: MESES[f.meses.reduce((a, m) => (m.saldo < a.saldo ? m : a)).mes] })}
        </div>
        <div class="cartao"><div class="cartao-cab"><div><h2>Entradas × saídas por mês</h2></div></div>${graf}</div>
        <div class="cartao"><div class="tabela-wrap" style="border:0"><table class="tab-caixa"><thead><tr><th scope="col">R$</th>${MESES_CURTOS.map((m) => `<th scope="col" class="num">${m}</th>`).join('')}</tr></thead><tbody>
          ${tr('Entradas', (m) => m.entradas)}${tr('Saídas', (m) => -m.saidas)}${tr('Saldo do mês', (m) => m.saldoMes, 'sub')}${tr('Saldo acumulado', (m) => m.saldo, 'tot')}
        </tbody></table></div></div>`;
    }

    // ---------- plano de contas e centros ----------
    function rCadastros() {
      const ed = pode('estrutura');
      const e = est.estrutura || (est.estrutura = { ...structuredClone(D.estrutura), alterado: false });
      const usado = new Set(D.lancamentos.map((l) => l.conta)), usadoC = new Set(D.lancamentos.map((l) => l.centro));
      const conta = (c) => `<li class="${c.ativa ? '' : 'inativo'}">${ed ? `<input type="text" value="${esc(c.nome)}" maxlength="80" data-cad-conta="${esc(c.id)}" aria-label="Nome da conta">` : `<span>${esc(c.nome)}</span>`}
        ${ed ? `<label class="chave-ativa"><input type="checkbox" data-cad-ativa="${esc(c.id)}" ${c.ativa ? 'checked' : ''}> ativa</label>
          ${usado.has(c.id) ? '' : `<button type="button" class="btn fantasma icone peq apagar" data-cad-del-conta="${esc(c.id)}" title="Excluir" aria-label="Excluir ${esc(c.nome)}">${ic('lixo')}</button>`}` : (c.ativa ? '' : '<small class="suave">inativa</small>')}</li>`;
      return `<div class="cartao dash-cab"><div><h2><span class="bolha"><i data-ic="pasta"></i></span> Plano de contas e centros de custo</h2>
          <p>${ed ? 'O grupo de cada conta define onde ela entra na DRE. Contas e centros já usados não podem ser excluídos: desative.' : 'Somente consulta. Dono e Financeiro podem alterar.'}${e.alterado ? ' · <b class="txt-erro">alterações não salvas</b>' : ''}</p></div>
          ${ed ? `<div class="linha"><button type="button" class="btn sec peq" data-cad="desfazer" ${e.alterado ? '' : 'disabled'}>Desfazer</button><button type="button" class="btn peq" data-cad="salvar" ${e.alterado ? '' : 'disabled'}>${ic('check')} Salvar cadastros</button></div>` : ''}</div>
        <div class="dash-grade g-larga">
          <div class="cartao"><div class="cartao-cab"><div><h2>Plano de contas</h2><p>${e.contas.length} contas</p></div></div>
            ${E.GRUPOS.map((g) => `<div class="cad-grupo"><h3>${esc(g.nome)} <small class="suave">${g.tipo === 'receber' ? 'a receber' : 'a pagar'}</small></h3>
              <ul class="cad-lista">${e.contas.filter((c) => c.grupo === g.id).map(conta).join('') || '<li class="suave">Nenhuma conta.</li>'}</ul>
              ${ed ? `<button type="button" class="btn fantasma peq" data-cad-nova-conta="${g.id}">${ic('mais')} Conta em ${esc(g.nome.toLowerCase())}</button>` : ''}</div>`).join('')}
          </div>
          <div class="dash-coluna">
            <div class="cartao"><div class="cartao-cab"><div><h2>Centros de custo</h2><p>Áreas, obras ou projetos</p></div></div>
              <ul class="cad-lista">${e.centros.map((c) => `<li class="${c.ativo ? '' : 'inativo'}">${ed ? `<input type="text" value="${esc(c.nome)}" maxlength="80" data-cad-centro="${esc(c.id)}" aria-label="Nome do centro">` : `<span>${esc(c.nome)}</span>`}
                ${ed ? `<label class="chave-ativa"><input type="checkbox" data-cad-centro-ativo="${esc(c.id)}" ${c.ativo ? 'checked' : ''}> ativo</label>
                  ${usadoC.has(c.id) ? '' : `<button type="button" class="btn fantasma icone peq apagar" data-cad-del-centro="${esc(c.id)}" title="Excluir" aria-label="Excluir ${esc(c.nome)}">${ic('lixo')}</button>`}` : (c.ativo ? '' : '<small class="suave">inativo</small>')}</li>`).join('')}</ul>
              ${ed ? `<button type="button" class="btn fantasma peq" data-cad-novo-centro>${ic('mais')} Novo centro de custo</button>` : ''}</div>
            ${meusCentros() ? '' : `<div class="cartao"><div class="cartao-cab"><div><h2>Saldo inicial de caixa</h2><p>Saldo em conta antes do primeiro lançamento</p></div></div>
              ${ed ? `<div class="campo-valor"><span>R$</span><input type="text" id="cad-saldo" inputmode="decimal" value="${N.valorParaCampo(e.saldoInicial)}" aria-label="Saldo inicial"></div>` : `<p><b>${moeda(e.saldoInicial)}</b></p>`}</div>`}
          </div>
        </div>`;
    }
    function mudouCadastro() { est.estrutura.alterado = true; $$('[data-cad]').forEach((b) => { b.disabled = false; }); }
    async function salvarCadastros() {
      const e = est.estrutura;
      if (e.contas.some((c) => !c.nome.trim()) || e.centros.some((c) => !c.nome.trim())) return toast('Toda conta e todo centro precisam de nome.', { erro: true });
      try {
        await api('PUT', '/api/empresa/estrutura', { contas: e.contas, centros: e.centros, saldoInicial: e.saldoInicial, rev: D.rev });
        await carregar(); render(); toast('Cadastros salvos.');
      } catch (er) {
        if (er.status === 409) { await carregar(); render(); }
        toast(er.message, { erro: true });
      }
    }

    // ---------- equipe e plano ----------
    function rEquipe() {
      const emp = D.empresa, pl = N.PLANO_ASSINATURA[emp.plano], pe = N.PERIODO[emp.periodo];
      const a = emp.assinatura || {};
      const sit = a.cod === 'vencida' ? `<span class="tag erro">Vencida há ${-a.dias} dias</span>` : a.cod === 'hoje' ? '<span class="tag erro">Vence hoje</span>'
        : a.cod === 'aviso' ? `<span class="tag aviso">Vence em ${a.dias} dias</span>` : a.cod === 'pendente' ? '<span class="tag neutra">Começa no 1º acesso</span>' : '<span class="tag ok">Em dia</span>';
      return `<div class="aviso-box info">${ic('escudo')}<div><b>Usuários e papéis são gerenciados pela AR Consultoria.</b> ${pode('solicitar') ? 'Para incluir, bloquear ou mudar o papel de alguém, envie uma solicitação.' : 'Fale com o Dono da empresa para pedir alterações.'}</div>
          ${pode('solicitar') ? `<button type="button" class="btn peq" data-pj-solicitar>Solicitar alteração à AR</button>` : ''}</div>
        <div class="cartao"><div class="cartao-cab"><div><h2><span class="bolha"><i data-ic="usuarios"></i></span> Equipe da empresa</h2><p>${emp.usuariosPagos} de ${emp.limiteUsuarios} usuários do plano ${esc(pl.nome)} · consulta</p></div></div>
          <div class="tabela-wrap"><table class="t simples"><thead><tr><th>Usuário</th><th>Papel</th><th>Centros de custo</th><th>Situação</th><th class="esconder-cel">Último acesso</th></tr></thead><tbody>
          ${D.equipe.map((u) => `<tr class="${u.ativo ? '' : 'inativo'}"><td><div class="pessoa"><span class="av">${esc(iniciais(u.nome))}</span><div><b>${esc(u.nome)}${u.id === D.eu.id ? ' <span class="tag info">você</span>' : ''}</b><small>${esc(u.login)}</small></div></div></td>
            <td><span class="tag ${u.papel === 'dono' ? 'indigo' : u.papel === 'leitura' ? 'neutra' : 'info'}">${esc(E.PAPEL[u.papel].nome)}</span></td>
            <td>${u.papel === 'gestor' ? esc(u.centros.map(centroNome).join(', ')) : 'Todos'}</td>
            <td>${u.ativo ? '<span class="tag ok">Ativo</span>' : '<span class="tag erro">Bloqueado</span>'}</td>
            <td class="esconder-cel">${u.ultimoAcesso ? esc(dataHora(u.ultimoAcesso)) : '<span class="suave">Nunca entrou</span>'}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="dash-grade g-larga">
          <div class="cartao"><div class="cartao-cab"><div><h2>Papéis</h2></div></div><div class="papeis">
            ${E.PAPEIS.map((p) => `<div class="papel-card ${p.id === papel() ? 'eu' : ''}"><b>${esc(p.nome)}${p.id === papel() ? ' · você' : ''}</b><small>${esc(p.desc)}</small></div>`).join('')}</div></div>
          <div class="cartao"><div class="cartao-cab"><div><h2>Plano da empresa</h2></div></div><table class="tab-dash"><tbody>
            <tr><th scope="row">Plano</th><td class="num"><b>${esc(pl.nome)}</b> · ${esc(pl.det)}</td></tr>
            <tr><th scope="row">Período</th><td class="num">${esc(pe.nome)}${emp.ultimoValor != null ? ` · ${moeda(emp.ultimoValor)}` : ''}</td></tr>
            <tr><th scope="row">Assinatura</th><td class="num">${sit}${emp.assinaturaVence ? ` <small class="suave">até ${emp.assinaturaVence.split('-').reverse().join('/')}</small>` : ''}</td></tr>
            <tr><th scope="row">Usuários</th><td class="num">${emp.usuariosPagos} de ${emp.limiteUsuarios} <small class="suave">(leitura não conta)</small></td></tr></tbody></table></div>
        </div>`;
    }

    function solicitar() {
      const TIPOS = [['novo_usuario', 'Novo usuário'], ['mudar_papel', 'Mudar papel'], ['bloquear', 'Bloquear usuário'], ['plano', 'Mudar de plano'], ['outro', 'Outro']];
      const { modal, fechar } = abrirModal(`<form class="modal" role="dialog" aria-modal="true" aria-labelledby="t-sol" novalidate>
        <div class="cab-modal"><h2 id="t-sol">Solicitar alteração à AR Consultoria</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar"><i data-ic="x"></i></button></div>
        <div class="grade-form">
          <fieldset class="inteiro pilulas"><legend class="rotulo" style="padding:0;margin-bottom:.45em">O que você precisa?</legend>
            ${TIPOS.map(([id, n], i) => `<label><input type="radio" name="sol-tipo" value="${id}" ${i === 0 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</fieldset>
          <div><label class="rotulo" for="sol-nome">Nome da pessoa</label><input type="text" id="sol-nome" maxlength="120"></div>
          <div><label class="rotulo" for="sol-email">E-mail</label><input type="email" id="sol-email" maxlength="120"></div>
          <div><label class="rotulo" for="sol-papel">Papel desejado</label><select id="sol-papel"><option value="">—</option>${E.PAPEIS.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')}</select></div>
          <div><label class="rotulo" for="sol-centro">Centro de custo</label><input type="text" id="sol-centro" maxlength="80" list="sol-centros"><datalist id="sol-centros">${D.estrutura.centros.map((c) => `<option value="${esc(c.nome)}">`).join('')}</datalist></div>
          <div class="inteiro"><label class="rotulo" for="sol-msg">Detalhes <small>(opcional)</small></label><textarea id="sol-msg" rows="3" maxlength="1000"></textarea></div>
        </div>
        <p class="erro-campo" id="sol-erro" role="alert"></p>
        <div class="rodape-modal"><button type="button" class="btn sec" data-fechar>Cancelar</button>
          <button type="button" class="btn whats" data-sol-whats>${ic('mensagem')} Enviar pelo WhatsApp</button>
          <button class="btn">${ic('enviar')} Enviar para o painel da AR</button></div>
      </form>`);
      const ler = () => ({ tipo: $('input[name=sol-tipo]:checked', modal).value, detalhes: { nome: $('#sol-nome', modal).value.trim(), email: $('#sol-email', modal).value.trim(), papel: $('#sol-papel', modal).value, centro: $('#sol-centro', modal).value.trim(), mensagem: $('#sol-msg', modal).value.trim() } });
      $('[data-sol-whats]', modal).addEventListener('click', () => {
        const { tipo, detalhes: d } = ler();
        if (!d.nome && !d.mensagem) { $('#sol-erro', modal).textContent = 'Informe o nome da pessoa ou descreva o pedido.'; return; }
        const texto = [`Olá, AR Consultoria! Solicitação da empresa ${D.empresa.nome}:`, `• ${TIPOS.find((t) => t[0] === tipo)[1]}`,
          d.nome && `• Nome: ${d.nome}`, d.email && `• E-mail: ${d.email}`, d.papel && `• Papel: ${E.PAPEL[d.papel].nome}`, d.centro && `• Centro de custo: ${d.centro}`, d.mensagem && `• Detalhes: ${d.mensagem}`,
          `Enviado por ${eu.nome}.`].filter(Boolean).join('\n');
        const tel = String(D.whatsappAR || '').replace(/\D/g, '');
        window.open(`https://wa.me/${tel ? (tel.length <= 11 ? '55' + tel : tel) : ''}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
      });
      modal.addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await api('POST', '/api/empresa/solicitacoes', ler()); fechar(); toast('Solicitação enviada. A AR Consultoria vai responder.'); }
        catch (er) { $('#sol-erro', modal).textContent = er.message; }
      });
    }

    // ---------- minha conta ----------
    function rConta() {
      return `<div class="cartao"><div class="cartao-cab"><div><h2><span class="bolha"><i data-ic="ajustes"></i></span> Minha conta</h2><p>${esc(eu.login)} · ${esc(E.PAPEL[papel()].nome)} em ${esc(D.empresa.nome)}</p></div></div>
        <form id="pj-perfil" class="grade-form" autocomplete="off"><div><label class="rotulo" for="pj-nome">Seu nome</label><input type="text" id="pj-nome" maxlength="120" value="${esc(eu.nome)}"></div>
          <div class="linha fim" style="align-self:end"><button class="btn">Salvar nome</button></div></form>
        <div class="linha" style="margin-top:1em"><button type="button" class="btn sec" data-trocar-senha>${ic('chave')} Trocar senha</button><button type="button" class="btn sec" data-sair>${ic('sair')} Sair</button></div></div>
        <div class="cartao"><div class="cartao-cab"><div><h2><span class="bolha"><i data-ic="livro"></i></span> Guia do Vértice Empresas</h2><p>Passo a passo de todas as telas, com os papéis de cada pessoa.</p></div></div>
          <div class="linha"><a class="btn sec" href="/guia-empresas" target="_blank" rel="noopener">${ic('livro')} Abrir o guia</a><a class="btn fantasma" href="/guia/Guia-Vertice-Empresas.pdf" download>${ic('baixar')} PDF</a></div></div>`;
    }

    // ---------- exportação ----------
    function exportarCsv(qual) {
      const nomeArq = (s) => `vertice-${D.empresa.nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${s}.csv`;
      let linhas;
      if (qual === 'contas') {
        linhas = [['Vencimento', 'Tipo', 'Descrição', 'Cliente/fornecedor', 'Conta', 'Centro', 'Valor', 'Situação', 'Observações'],
          ...listaContas().map((l) => [N.dataDe(l).toLocaleDateString('pt-BR'), tipoDe(l) === 'receber' ? 'A receber' : 'A pagar', l.desc, l.parte, contaNome(l.conta), centroNome(l.centro), l.centavos, l.pago ? 'Pago' : 'Em aberto', l.obs])];
        baixar(nomeArq(`contas-${est.ano}-${String(est.mes + 1).padStart(2, '0')}`), E.csv(linhas), 'text/csv;charset=utf-8');
      }
      if (qual === 'ovr') {
        const r = E.orcadoRealizado({ estrutura: D.estrutura, lancamentos: D.lancamentos, valores: orcVigente()?.valores, ano: est.ano, meses: E.mesesDoPeriodo(est.mes, est.modo), centros: filtroCentros() });
        linhas = [[`Orçado × realizado · ${nomePeriodo()}`], ['Grupo', 'Conta', 'Orçado', 'Realizado', 'Diferença', '%', 'Situação']];
        for (const g of r.grupos) for (const c of g.contas) linhas.push([g.nome, c.nome, c.orcado, c.realizado, c.dif, c.pct == null ? '' : String(c.pct).replace('.', ','), FAROL[c.farol]]);
        linhas.push(['Resultado', '', r.resultado.orcado, r.resultado.realizado, r.resultado.dif, r.resultado.pct == null ? '' : String(r.resultado.pct).replace('.', ','), FAROL[r.resultado.farol]]);
        baixar(nomeArq(`orcado-realizado-${est.ano}-${String(est.mes + 1).padStart(2, '0')}`), E.csv(linhas), 'text/csv;charset=utf-8');
      }
      if (qual === 'dre') {
        const d = calcDre();
        linhas = [[`DRE gerencial · ${nomePeriodo()}`], ['Linha', 'Realizado', 'Orçado', `Acumulado ${est.ano}`, '% da receita']];
        for (const l of d.linhas) { linhas.push([l.nome, l.real, l.orc, l.acum, l.pct == null ? '' : String(l.pct).replace('.', ',')]); for (const c of l.contas || []) linhas.push([`   ${c.nome}`, c.real, c.orc, c.acum, '']); }
        baixar(nomeArq(`dre-${est.ano}-${String(est.mes + 1).padStart(2, '0')}`), E.csv(linhas), 'text/csv;charset=utf-8');
      }
      if (qual === 'caixa') {
        const f = E.fluxoCaixa({ estrutura: D.estrutura, lancamentos: D.lancamentos, ano: est.ano, centros: filtroCentros() });
        linhas = [['Mês', 'Entradas', 'Recebido', 'Saídas', 'Pago', 'Saldo do mês', 'Saldo acumulado'], ...f.meses.map((m) => [MESES[m.mes], m.entradas, m.entradasRealizadas, m.saidas, m.saidasRealizadas, m.saldoMes, m.saldo])];
        baixar(nomeArq(`fluxo-de-caixa-${est.ano}`), E.csv(linhas), 'text/csv;charset=utf-8');
      }
      if (qual === 'orcamento') {
        const o = prepararOrc();
        linhas = [[`Orçamento ${est.ano}`], ['Grupo', 'Conta', 'Centro', ...MESES, 'Total']];
        for (const c of D.estrutura.contas) for (const [b, ms] of Object.entries(o.valores[c.id] || {})) {
          if (meusCentros() && !meusCentros().includes(b)) continue;
          linhas.push([E.GRUPO[c.grupo].nome, c.nome, b === '_' ? 'Geral' : centroNome(b), ...ms, E.somaLinha(ms)]);
        }
        baixar(nomeArq(`orcamento-${est.ano}`), E.csv(linhas), 'text/csv;charset=utf-8');
      }
    }

    // ---------- eventos ----------
    raiz.addEventListener('click', async (e) => {
      const t = (sel) => e.target.closest(sel);
      let b;
      if ((b = t('[data-pj-filtro]'))) { est.filtro = b.dataset.pjFiltro; return render(); }
      if ((b = t('[data-pj-centro]'))) { est.centro = b.dataset.pjCentro; return render(); }
      if ((b = t('[data-pj-modo]'))) { est.modo = b.dataset.pjModo; return render(); }
      if ((b = t('[data-pj-grupo]'))) { const id = b.dataset.pjGrupo; est.abertos.has(id) ? est.abertos.delete(id) : est.abertos.add(id); render(); return $(`#pj [data-pj-grupo="${id}"]`)?.focus(); }
      if ((b = t('[data-pj-pagar]'))) return alternarPago(b.dataset.pjPagar);
      if ((b = t('[data-pj-editar]'))) return formLancamento(D.lancamentos.find((l) => l.id === b.dataset.pjEditar));
      if ((b = t('[data-pj-excluir]'))) return excluirLancamento(b.dataset.pjExcluir);
      if ((b = t('[data-pj-csv]'))) return exportarCsv(b.dataset.pjCsv);
      if (t('[data-pj-imprimir]')) return window.print();
      if (t('[data-pj-solicitar]')) return solicitar();
      if ((b = t('[data-orc-bucket]'))) { est.bucket = b.dataset.orcBucket; return render(); }
      if ((b = t('[data-orc]'))) return acaoOrcamento(b.dataset.orc);
      if ((b = t('[data-orc-ver]'))) {
        if (est.orc.alterado && !(await confirmar({ titulo: 'Descartar alterações?', botao: 'Abrir outra versão', texto: 'As alterações não salvas no orçamento serão perdidas.' }))) return;
        const v = D.orcamentos.find((x) => x.id === Number(b.dataset.orcVer));
        est.orc = { ano: est.ano, versao: v.id, valores: structuredClone(v.valores), alterado: false }; return render();
      }
      if ((b = t('[data-orc-aprovar]'))) {
        try { await api('POST', `/api/empresa/orcamentos/${b.dataset.orcAprovar}/aprovar`, {}); await carregar(); render(); toast('Versão aprovada. Ela passa a valer no orçado × realizado e na DRE.'); }
        catch (er) { toast(er.message, { erro: true }); }
        return;
      }
      const cad = est.estrutura;
      if ((b = t('[data-cad]'))) { if (b.dataset.cad === 'salvar') return salvarCadastros(); est.estrutura = null; return render(); }
      if ((b = t('[data-cad-nova-conta]'))) { cad.contas.push({ id: N.novoId(), nome: 'Nova conta', grupo: b.dataset.cadNovaConta, ativa: true }); mudouCadastro(); render(); const i = $$('#pj [data-cad-conta]').at(-1); const all = $$(`#pj [data-cad-conta="${cad.contas.at(-1).id}"]`); (all[0] || i)?.select(); return; }
      if ((b = t('[data-cad-novo-centro]'))) { cad.centros.push({ id: N.novoId(), nome: 'Novo centro', ativo: true }); mudouCadastro(); render(); $$('#pj [data-cad-centro]').at(-1)?.select(); return; }
      if ((b = t('[data-cad-del-conta]'))) { cad.contas = cad.contas.filter((c) => c.id !== b.dataset.cadDelConta); mudouCadastro(); return render(); }
      if ((b = t('[data-cad-del-centro]'))) { cad.centros = cad.centros.filter((c) => c.id !== b.dataset.cadDelCentro); mudouCadastro(); return render(); }
    });
    raiz.addEventListener('keydown', (e) => {
      const g = e.target.closest('[data-pj-grupo]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.click(); }
      const cel = e.target.closest('[data-orc-conta]');
      if (cel && e.key === 'Enter') { // Enter desce (Shift+Enter sobe), como numa planilha
        e.preventDefault();
        const cels = $$(`#pj [data-orc-mes="${cel.dataset.orcMes}"]`);
        const prox = cels[cels.indexOf(cel) + (e.shiftKey ? -1 : 1)];
        if (prox) prox.focus(); else cel.blur(); // o blur dispara o change da célula
      }
    });
    raiz.addEventListener('focusin', (e) => { if (e.target.matches('[data-orc-conta]')) e.target.select(); });
    raiz.addEventListener('change', (e) => {
      const cel = e.target.closest('[data-orc-conta]');
      if (cel) {
        const txt = cel.value.trim();
        const v = txt ? N.lerValor(txt.includes(',') ? txt : txt.replace(/\./g, '')) : 0;
        if (!(v >= 0)) { cel.classList.add('invalido'); return toast('Valor inválido nesta célula.', { erro: true }); }
        cel.classList.remove('invalido');
        if (!definirCelula(cel.dataset.orcConta, +cel.dataset.orcMes, Math.round(v / 100) * 100)) { cel.value = reais(Math.round(v / 100) * 100); return; }
        // Redesenha depois que o foco já foi para a próxima célula e devolve o foco a ela.
        setTimeout(() => {
          const a = document.activeElement;
          const foco = a?.matches?.('[data-orc-conta]') ? [a.dataset.orcConta, a.dataset.orcMes, a.value] : null;
          render();
          if (foco) { const n = $(`#pj [data-orc-conta="${CSS.escape(foco[0])}"][data-orc-mes="${foco[1]}"]`); if (n) { n.value = foco[2]; n.focus(); n.select(); } }
        }, 0);
        return;
      }
      const cad = est.estrutura;
      let el;
      if ((el = e.target.closest('[data-cad-conta]'))) { cad.contas.find((c) => c.id === el.dataset.cadConta).nome = el.value.trim(); return mudouCadastro(); }
      if ((el = e.target.closest('[data-cad-centro]'))) { cad.centros.find((c) => c.id === el.dataset.cadCentro).nome = el.value.trim(); return mudouCadastro(); }
      if ((el = e.target.closest('[data-cad-ativa]'))) { cad.contas.find((c) => c.id === el.dataset.cadAtiva).ativa = el.checked; mudouCadastro(); return render(); }
      if ((el = e.target.closest('[data-cad-centro-ativo]'))) { cad.centros.find((c) => c.id === el.dataset.cadCentroAtivo).ativo = el.checked; mudouCadastro(); return render(); }
      if (e.target.id === 'cad-saldo') { const v = N.lerValor(e.target.value); if (Number.isInteger(v)) { cad.saldoInicial = v; e.target.value = N.valorParaCampo(v); mudouCadastro(); } else toast('Saldo inválido.', { erro: true }); }
    });
    raiz.addEventListener('input', (e) => { if (e.target.id === 'pj-busca') { est.busca = e.target.value; const pos = e.target.selectionStart; render(); const i = $('#pj-busca'); i.focus(); i.setSelectionRange(pos, pos); } });
    raiz.addEventListener('submit', async (e) => {
      if (e.target.id !== 'pj-perfil') return;
      e.preventDefault();
      const nome = $('#pj-nome').value.trim();
      if (!nome) return toast('Informe seu nome.', { erro: true });
      try { await api('PUT', '/api/eu', { nome }); eu.nome = nome; render(); toast('Nome atualizado.'); } catch (er) { toast(er.message, { erro: true }); }
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pj-mover], [data-pj-hoje], [data-pj-novo]');
      if (!b) return;
      if (b.matches('[data-pj-novo]')) return formLancamento();
      if (b.matches('[data-pj-hoje]')) { est.ano = hojeD.getFullYear(); est.mes = hojeD.getMonth(); return render(); }
      const d = +b.dataset.pjMover;
      if (['orcamento', 'caixa'].includes(est.secao)) {
        if (est.secao === 'orcamento' && est.orc?.alterado) {
          return confirmar({ titulo: 'Descartar alterações?', botao: 'Trocar de ano', texto: 'As alterações não salvas no orçamento serão perdidas.' }).then((ok) => { if (ok) { est.orc = null; est.ano += d; render(); } });
        }
        est.ano += d;
      } else { const r = N.somarMeses(est.ano, est.mes, d); est.ano = r.ano; est.mes = r.mes; }
      render();
    });
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || $('.fundo-modal') || e.target.closest('input, select, textarea')) return;
      if ((e.key === 'n' || e.key === 'N') && pode('lancar')) { e.preventDefault(); formLancamento(); }
    });
    window.addEventListener('hashchange', () => {
      if (est.secao === 'orcamento' && est.orc?.alterado && location.hash !== '#orcamento') toast('O orçamento tem alterações não salvas: volte em Orçamento para salvar.', { erro: true, tempo: 7000 });
      lerHash();
    });
    window.addEventListener('beforeunload', (e) => { if (est.orc?.alterado || est.estrutura?.alterado) e.preventDefault(); });
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible' || $('.fundo-modal') || est.orc?.alterado || est.estrutura?.alterado || document.activeElement?.closest('#pj input')) return;
      try { await carregar(); render(); } catch { /* tenta na próxima */ }
    });

    return carregar().then(lerHash);
  }

  window.VerticeEmpresa = { iniciar };
})();
