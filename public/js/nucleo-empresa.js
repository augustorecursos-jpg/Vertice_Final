/*
 * Vértice Empresas — regras de negócio (sem DOM).
 * Plano de contas, centros de custo, contas a pagar e receber, orçamento,
 * orçado × realizado, DRE gerencial e fluxo de caixa. Valores em centavos.
 * Funciona no navegador (window.NucleoEmpresa) e no Node (require), onde o servidor valida os dados.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica(require('./nucleo.js'));
  else raiz.NucleoEmpresa = fabrica(raiz.Nucleo);
})(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  // ---------- plano de contas ----------
  // O grupo define o sinal na DRE e se a conta é "a receber" ou "a pagar".
  const GRUPOS = [
    { id: 'receita', nome: 'Receitas', tipo: 'receber' },
    { id: 'deducao', nome: 'Impostos e deduções sobre vendas', tipo: 'pagar' },
    { id: 'custo', nome: 'Custos', tipo: 'pagar' },
    { id: 'despesa', nome: 'Despesas operacionais', tipo: 'pagar' },
    { id: 'financeiro', nome: 'Despesas financeiras', tipo: 'pagar' },
  ];
  const GRUPO = Object.fromEntries(GRUPOS.map((g) => [g.id, g]));

  // ---------- papéis ----------
  const PAPEIS = [
    { id: 'dono', nome: 'Dono', desc: 'Tudo na empresa, inclusive aprovar o orçamento.', pago: true },
    { id: 'financeiro', nome: 'Financeiro', desc: 'Lança, edita o orçamento e o plano de contas e exporta relatórios.', pago: true },
    { id: 'gestor', nome: 'Gestor', desc: 'Vê e lança só nos centros de custo dele e acompanha o orçado × realizado da área.', pago: true },
    { id: 'leitura', nome: 'Leitura', desc: 'Só consulta e exporta (contador, sócio). Não conta como usuário pago.', pago: false },
  ];
  const PAPEL = Object.fromEntries(PAPEIS.map((p) => [p.id, p]));
  const PERMISSOES = {
    lancar: ['dono', 'financeiro', 'gestor'],
    orcamento: ['dono', 'financeiro'],
    aprovar: ['dono'],
    estrutura: ['dono', 'financeiro'],
    solicitar: ['dono'],
  };
  const pode = (papel, acao) => (PERMISSOES[acao] || []).includes(papel);

  const LIMITES = { contas: 200, centros: 100, texto: 80, lancamentos: 50000, serie: 120 };
  const txt = (v, max = LIMITES.texto) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

  function estruturaPadrao(gerarId = N.novoId) {
    const c = (nome, grupo) => ({ id: gerarId(), nome, grupo, ativa: true });
    return {
      contas: [
        c('Venda de produtos', 'receita'), c('Prestação de serviços', 'receita'),
        c('Impostos sobre vendas', 'deducao'),
        c('Custo dos produtos e serviços', 'custo'), c('Mão de obra direta', 'custo'),
        c('Pessoal e encargos', 'despesa'), c('Aluguel e condomínio', 'despesa'), c('Marketing e vendas', 'despesa'),
        c('Tecnologia', 'despesa'), c('Contabilidade e jurídico', 'despesa'), c('Despesas administrativas', 'despesa'),
        c('Tarifas bancárias e juros', 'financeiro'),
      ],
      centros: ['Administrativo', 'Comercial', 'Operações'].map((nome) => ({ id: gerarId(), nome, ativo: true })),
      saldoInicial: 0,
    };
  }

  /** Valida plano de contas e centros. Recusa tudo (null) se algo estiver inválido. */
  function limparEstrutura(x) {
    if (!x || typeof x !== 'object' || !Array.isArray(x.contas) || !Array.isArray(x.centros)) return null;
    if (x.contas.length > LIMITES.contas || x.centros.length > LIMITES.centros) return null;
    const ids = new Set();
    const id = (v) => { const s = txt(v, 80); if (!s || ids.has(s)) return null; ids.add(s); return s; };
    const contas = [];
    for (const c of x.contas) {
      const i = id(c?.id), nome = txt(c?.nome);
      if (!i || !nome || !GRUPO[c.grupo]) return null;
      contas.push({ id: i, nome, grupo: c.grupo, ativa: c.ativa !== false });
    }
    const centros = [];
    for (const c of x.centros) {
      const i = id(c?.id), nome = txt(c?.nome);
      if (!i || !nome) return null;
      centros.push({ id: i, nome, ativo: c.ativo !== false });
    }
    const saldoInicial = x.saldoInicial ?? 0;
    if (!Number.isInteger(saldoInicial) || Math.abs(saldoInicial) > 1e13) return null;
    return { contas, centros, saldoInicial };
  }

  const contaDe = (est, id) => est.contas.find((c) => c.id === id);
  const tipoDe = (l, est) => GRUPO[contaDe(est, l.conta)?.grupo]?.tipo || 'pagar';

  // ---------- contas a pagar e receber ----------
  function limparLancamento(x, est) {
    if (!x || typeof x !== 'object') return null;
    const ano = Number(x.ano), mes = Number(x.mes), dia = Number(x.dia), centavos = Number(x.centavos);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100 || !Number.isInteger(mes) || mes < 0 || mes > 11) return null;
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) return null;
    if (!Number.isInteger(centavos) || centavos <= 0 || centavos > 1e13) return null;
    const desc = txt(x.desc, 120);
    if (!desc || !contaDe(est, x.conta)) return null;
    const centro = x.centro ? String(x.centro) : null;
    if (centro && !est.centros.some((c) => c.id === centro)) return null;
    const parcela = x.parcela && Number.isInteger(x.parcela.n) && Number.isInteger(x.parcela.de) && x.parcela.n >= 1 && x.parcela.n <= x.parcela.de && x.parcela.de <= LIMITES.serie
      ? { n: x.parcela.n, de: x.parcela.de } : null;
    return {
      id: txt(x.id, 80) || N.novoId(), desc, centavos, conta: x.conta, centro, ano, mes, dia,
      pago: !!x.pago, parte: txt(x.parte), obs: String(x.obs ?? '').replace(/\r/g, '').trim().slice(0, 1000),
      grupo: x.grupo ? txt(x.grupo, 80) : null, parcela, criadoEm: Number(x.criadoEm) || Date.now(),
    };
  }

  /** Lançamentos de um formulário: 'unica' | 'mensal' (repete) | 'parcelada' (divide o total). */
  function gerarLancamentos(f, gerarId = N.novoId) {
    const qtd = f.recorrencia === 'unica' || !f.recorrencia ? 1 : Math.min(LIMITES.serie, Math.max(2, Math.floor(f.quantidade) || 2));
    const grupo = qtd > 1 ? gerarId() : null;
    const valores = f.recorrencia === 'parcelada' ? N.dividir(f.centavos, qtd) : Array(qtd).fill(f.centavos);
    return valores.map((centavos, i) => {
      const { ano, mes } = N.somarMeses(f.ano, f.mes, i);
      return {
        id: gerarId(), desc: txt(f.desc, 120), centavos, conta: f.conta, centro: f.centro || null, ano, mes,
        dia: Math.min(f.dia, N.diasNoMes(ano, mes)), pago: false, parte: txt(f.parte), obs: String(f.obs ?? '').trim(),
        grupo, parcela: f.recorrencia === 'parcelada' ? { n: i + 1, de: qtd } : null, criadoEm: Date.now(),
      };
    });
  }

  /** Gestor só enxerga os centros dele; lista vazia ou null = todos. */
  const noCentro = (centros) => (l) => !centros || !centros.length || centros.includes(l.centro);

  // ---------- períodos ----------
  /** Meses (0–11) de um período: o mês, o trimestre dele ou o acumulado do ano até ele. */
  function mesesDoPeriodo(mes, modo = 'mes') {
    if (modo === 'trimestre') { const q = Math.floor(mes / 3) * 3; return [q, q + 1, q + 2]; }
    if (modo === 'ano') return Array.from({ length: mes + 1 }, (_, i) => i);
    return [mes];
  }

  // ---------- orçamento ----------
  // valores: { contaId: { centroId | '_' (geral): [12 meses em centavos] } }
  function limparValoresOrcamento(v, est) {
    if (!v || typeof v !== 'object') return null;
    const buckets = new Set(['_', ...est.centros.map((c) => c.id)]);
    const r = {};
    for (const [conta, porBucket] of Object.entries(v)) {
      if (!contaDe(est, conta) || !porBucket || typeof porBucket !== 'object') return null;
      for (const [b, meses] of Object.entries(porBucket)) {
        if (!buckets.has(b) || !Array.isArray(meses) || meses.length !== 12) return null;
        if (!meses.every((m) => Number.isInteger(m) && m >= 0 && m <= 1e13)) return null;
        if (meses.some((m) => m > 0)) (r[conta] ||= {})[b] = meses.slice();
      }
    }
    return r;
  }
  /** Orçado de uma conta nos meses dados. Com filtro de centros, a parte "geral" não entra. */
  function orcadoConta(valores, conta, meses, centros = null) {
    const porBucket = valores?.[conta];
    if (!porBucket) return 0;
    let t = 0;
    for (const [b, m] of Object.entries(porBucket)) {
      if (centros && centros.length && !centros.includes(b)) continue;
      for (const i of meses) t += m[i] || 0;
    }
    return t;
  }
  const somaLinha = (meses) => meses.reduce((a, b) => a + b, 0);
  /** Copia um orçamento aplicando reajuste (%) — usado em "Copiar do ano anterior". */
  function reajustar(valores, pct) {
    const f = 1 + (Number(pct) || 0) / 100;
    const r = {};
    for (const [c, pb] of Object.entries(valores || {})) for (const [b, m] of Object.entries(pb)) (r[c] ||= {})[b] = m.map((v) => Math.max(0, Math.round(v * f)));
    return r;
  }

  // ---------- orçado × realizado ----------
  function farol(orcado, realizado, receita) {
    const dif = realizado - orcado;
    const favoravel = receita ? dif >= 0 : dif <= 0;
    const pct = orcado ? Math.abs(dif) / orcado * 100 : (realizado ? 100 : 0);
    return favoravel || pct <= 3 ? 'ok' : pct <= 10 ? 'at' : 'es';
  }
  const pctDif = (orcado, realizado) => (orcado ? Math.round(((realizado - orcado) / orcado) * 1000) / 10 : null);

  function realizadoPorConta(lancamentos, ano, meses, centros) {
    const ms = new Set(meses), r = {};
    for (const l of lancamentos) if (l.ano === ano && ms.has(l.mes) && noCentro(centros)(l)) r[l.conta] = (r[l.conta] || 0) + l.centavos;
    return r;
  }

  function orcadoRealizado({ estrutura: est, lancamentos, valores, ano, meses, centros = null }) {
    const real = realizadoPorConta(lancamentos, ano, meses, centros);
    const grupos = GRUPOS.map((g) => {
      const receita = g.id === 'receita';
      const contas = est.contas.filter((c) => c.grupo === g.id).map((c) => {
        const orcado = orcadoConta(valores, c.id, meses, centros), realizado = real[c.id] || 0;
        return { id: c.id, nome: c.nome, orcado, realizado, dif: realizado - orcado, pct: pctDif(orcado, realizado), farol: farol(orcado, realizado, receita) };
      }).filter((c) => c.orcado || c.realizado);
      const orcado = contas.reduce((a, c) => a + c.orcado, 0), realizado = contas.reduce((a, c) => a + c.realizado, 0);
      return { id: g.id, nome: g.nome, receita, contas, orcado, realizado, dif: realizado - orcado, pct: pctDif(orcado, realizado), farol: farol(orcado, realizado, receita) };
    });
    const rec = grupos.find((g) => g.receita);
    const desp = grupos.filter((g) => !g.receita);
    const despesas = { orcado: desp.reduce((a, g) => a + g.orcado, 0), realizado: desp.reduce((a, g) => a + g.realizado, 0) };
    const resultado = { orcado: rec.orcado - despesas.orcado, realizado: rec.realizado - despesas.realizado };
    resultado.dif = resultado.realizado - resultado.orcado;
    resultado.pct = resultado.orcado ? Math.round((resultado.dif / Math.abs(resultado.orcado)) * 1000) / 10 : null;
    resultado.farol = farol(resultado.orcado, resultado.realizado, true);
    const todas = grupos.flatMap((g) => g.contas.map((c) => ({ ...c, receita: g.receita })));
    const desfavoravel = (c) => (c.receita ? c.dif < 0 : c.dif > 0);
    return {
      grupos, receitas: { orcado: rec.orcado, realizado: rec.realizado, pct: pctDif(rec.orcado, rec.realizado), farol: rec.farol },
      despesas: { ...despesas, pct: pctDif(despesas.orcado, despesas.realizado), farol: farol(despesas.orcado, despesas.realizado, false) },
      resultado, contas: todas.length,
      estouradas: todas.filter((c) => c.farol === 'es'), atencao: todas.filter((c) => c.farol === 'at'),
      desvios: todas.filter((c) => c.dif).sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif)).slice(0, 4).map((c) => ({ ...c, desfavoravel: desfavoravel(c) })),
    };
  }

  /** Despesas (tudo que não é receita) orçadas e realizadas em cada mês do ano. */
  function despesasNoAno({ estrutura: est, lancamentos, valores, ano, centros = null }) {
    const contas = est.contas.filter((c) => c.grupo !== 'receita').map((c) => c.id);
    const set = new Set(contas);
    return Array.from({ length: 12 }, (_, m) => ({
      mes: m,
      orcado: contas.reduce((a, c) => a + orcadoConta(valores, c, [m], centros), 0),
      realizado: lancamentos.filter((l) => l.ano === ano && l.mes === m && set.has(l.conta) && noCentro(centros)(l)).reduce((a, l) => a + l.centavos, 0),
    }));
  }

  // ---------- DRE gerencial ----------
  function dre({ estrutura: est, lancamentos, valores, ano, meses, centros = null }) {
    const acumMeses = Array.from({ length: Math.max(...meses) + 1 }, (_, i) => i);
    const rP = realizadoPorConta(lancamentos, ano, meses, centros), rA = realizadoPorConta(lancamentos, ano, acumMeses, centros);
    const grupo = (g) => {
      const contas = est.contas.filter((c) => c.grupo === g).map((c) => ({
        id: c.id, nome: c.nome, real: rP[c.id] || 0, orc: orcadoConta(valores, c.id, meses, centros), acum: rA[c.id] || 0,
      })).filter((c) => c.real || c.orc || c.acum);
      return { real: contas.reduce((a, c) => a + c.real, 0), orc: contas.reduce((a, c) => a + c.orc, 0), acum: contas.reduce((a, c) => a + c.acum, 0), contas };
    };
    const G = Object.fromEntries(GRUPOS.map((g) => [g.id, grupo(g.id)]));
    const menos = (a, ...bs) => ({ real: bs.reduce((s, b) => s - b.real, a.real), orc: bs.reduce((s, b) => s - b.orc, a.orc), acum: bs.reduce((s, b) => s - b.acum, a.acum) });
    const neg = (g) => ({ real: -g.real, orc: -g.orc, acum: -g.acum, contas: g.contas.map((c) => ({ ...c, real: -c.real, orc: -c.orc, acum: -c.acum })) });
    const liquida = menos(G.receita, G.deducao), bruto = menos(liquida, G.custo), operacional = menos(bruto, G.despesa), final = menos(operacional, G.financeiro);
    const linhas = [
      { id: 'receita', nome: 'Receita bruta', tipo: 'res', ...G.receita },
      { id: 'deducao', nome: '(−) Impostos e deduções', tipo: 'ded', ...neg(G.deducao) },
      { id: 'liquida', nome: 'Receita líquida', tipo: 'res', ...liquida },
      { id: 'custo', nome: '(−) Custos', tipo: 'ded', ...neg(G.custo) },
      { id: 'bruto', nome: 'Lucro bruto', tipo: 'res', ...bruto },
      { id: 'despesa', nome: '(−) Despesas operacionais', tipo: 'ded', ...neg(G.despesa) },
      { id: 'operacional', nome: 'Resultado operacional (EBITDA)', tipo: 'res', ...operacional },
      { id: 'financeiro', nome: '(−) Despesas financeiras', tipo: 'ded', ...neg(G.financeiro) },
      { id: 'final', nome: 'Resultado do período', tipo: 'res final', ...final },
    ];
    const base = G.receita.acum;
    for (const l of linhas) l.pct = base ? Math.round((l.acum / base) * 1000) / 10 : null;
    return { linhas, margem: G.receita.real ? Math.round((final.real / G.receita.real) * 1000) / 10 : null };
  }

  // ---------- fluxo de caixa ----------
  /** Entradas e saídas por mês de vencimento, com saldo acumulado a partir do saldo inicial. */
  function fluxoCaixa({ estrutura: est, lancamentos, ano, centros = null }) {
    const sinal = (l) => (tipoDe(l, est) === 'receber' ? 1 : -1);
    const filtrados = lancamentos.filter(noCentro(centros));
    let saldo = (centros && centros.length ? 0 : est.saldoInicial)
      + filtrados.filter((l) => l.ano < ano).reduce((a, l) => a + sinal(l) * l.centavos, 0);
    const inicial = saldo;
    const meses = Array.from({ length: 12 }, (_, m) => {
      const doMes = filtrados.filter((l) => l.ano === ano && l.mes === m);
      const soma = (tipo, pago) => doMes.filter((l) => tipoDe(l, est) === tipo && (pago == null || l.pago === pago)).reduce((a, l) => a + l.centavos, 0);
      const entradas = soma('receber'), saidas = soma('pagar');
      saldo += entradas - saidas;
      return { mes: m, entradas, saidas, entradasRealizadas: soma('receber', true), saidasRealizadas: soma('pagar', true), saldoMes: entradas - saidas, saldo };
    });
    return { inicial, meses, final: saldo, negativos: meses.filter((m) => m.saldo < 0).map((m) => m.mes) };
  }

  // ---------- painel ----------
  function painel({ estrutura: est, lancamentos, ano, mes, centros = null, hoje = new Date() }) {
    const lista = lancamentos.filter(noCentro(centros));
    const doMes = lista.filter((l) => l.ano === ano && l.mes === mes);
    const soma = (ls, tipo) => ls.filter((l) => tipoDe(l, est) === tipo).reduce((a, l) => a + l.centavos, 0);
    const abertos = lista.filter((l) => !l.pago);
    const atrasados = abertos.filter((l) => N.situacao(l, hoje).cod === 'atrasado');
    const proximos = abertos.filter((l) => { const s = N.situacao(l, hoje); return s.dias >= 0 && s.dias <= 7; }).sort((a, b) => N.dataDe(a) - N.dataDe(b));
    return {
      receber: soma(doMes, 'receber'), pagar: soma(doMes, 'pagar'),
      recebido: soma(doMes.filter((l) => l.pago), 'receber'), pago: soma(doMes.filter((l) => l.pago), 'pagar'),
      atrasados: { qtd: atrasados.length, receber: soma(atrasados, 'receber'), pagar: soma(atrasados, 'pagar'), lista: atrasados.sort((a, b) => N.dataDe(a) - N.dataDe(b)) },
      proximos,
    };
  }

  // ---------- exportação (CSV que abre no Excel) ----------
  function csv(linhas) {
    const q = (s) => (typeof s === 'number' ? (s / 100).toFixed(2).replace('.', ',') : `"${String(s ?? '').replace(/"/g, '""')}"`);
    return '﻿' + linhas.map((l) => l.map(q).join(';')).join('\r\n');
  }

  return {
    GRUPOS, GRUPO, PAPEIS, PAPEL, PERMISSOES, pode, LIMITES,
    estruturaPadrao, limparEstrutura, contaDe, tipoDe,
    limparLancamento, gerarLancamentos, noCentro, mesesDoPeriodo,
    limparValoresOrcamento, orcadoConta, somaLinha, reajustar,
    farol, pctDif, orcadoRealizado, despesasNoAno, dre, fluxoCaixa, painel, csv,
  };
});
