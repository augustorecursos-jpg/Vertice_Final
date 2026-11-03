/*
 * Vértice — regras de negócio (sem DOM).
 * Valores sempre em centavos (inteiros) para que somas e parcelas fechem exatamente.
 * Funciona no navegador (window.Nucleo) e no Node (require) para os testes.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.Nucleo = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSAO_DADOS = 1;

  const CATEGORIAS = [
    { id: 'receita', nome: 'Receita', tipo: 'entrada', feito: 'Recebido', pendente: 'A receber' },
    { id: 'fixa', nome: 'Despesa fixa', tipo: 'saida', feito: 'Pago', pendente: 'A pagar' },
    { id: 'variavel', nome: 'Despesa variável', tipo: 'saida', feito: 'Pago', pendente: 'A pagar' },
    { id: 'cartao', nome: 'Cartão de crédito', tipo: 'saida', feito: 'Pago', pendente: 'A pagar' },
    { id: 'investimento', nome: 'Investimento', tipo: 'reserva', feito: 'Aplicado', pendente: 'A aplicar' },
    { id: 'poupanca', nome: 'Poupança', tipo: 'reserva', feito: 'Guardado', pendente: 'A guardar' },
  ];
  const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

  // Tipo de gasto: classificação opcional das despesas (categorias de saída), para o "Onde estou gastando".
  const TIPOS_GASTO = [
    { id: 'alimentacao', nome: 'Alimentação', emoji: '🍔' }, { id: 'mercado', nome: 'Mercado', emoji: '🛒' },
    { id: 'transporte', nome: 'Transporte', emoji: '🚗' }, { id: 'saude', nome: 'Saúde', emoji: '💊' },
    { id: 'moradia', nome: 'Moradia', emoji: '🏠' }, { id: 'educacao', nome: 'Educação', emoji: '🎓' },
    { id: 'lazer', nome: 'Lazer', emoji: '🎉' }, { id: 'assinaturas', nome: 'Assinaturas', emoji: '📺' },
    { id: 'compras', nome: 'Compras', emoji: '🛍' }, { id: 'viagem', nome: 'Viagem', emoji: '✈️' },
    { id: 'pets', nome: 'Pets', emoji: '🐾' }, { id: 'outros', nome: 'Outros', emoji: '❔' },
  ];
  const TIPO = Object.fromEntries(TIPOS_GASTO.map((t) => [t.id, t]));
  // Palavras que sugerem o tipo pela descrição (a escolha da pessoa sempre vence).
  const PALAVRAS_TIPO = [
    // Expressões específicas primeiro, para não caírem num tipo mais genérico.
    ['compras', ['mercado livre', 'mercadolivre']],
    ['assinaturas', ['amazon prime', 'prime video', 'youtube premium']],
    ['alimentacao', ['ifood', 'rappi', 'restaurante', 'lanche', 'lanchonete', 'pizza', 'hamburguer', 'burger', 'padaria', 'cafe', 'bar ', 'almoco', 'jantar', 'delivery', 'mcdonald', 'subway', 'sushi', 'acai']],
    ['mercado', ['mercado', 'supermercado', 'atacad', 'assai', 'carrefour', 'pao de acucar', 'hortifruti', 'feira', 'sacolao', 'extra ']],
    ['transporte', ['uber', '99 ', '99app', 'taxi', 'combustivel', 'gasolina', 'posto', 'estacionamento', 'pedagio', 'onibus', 'metro', 'ipva', 'seguro auto', 'mecanic', 'oficina']],
    ['saude', ['farmacia', 'drogaria', 'drogasil', 'raia', 'pague menos', 'medic', 'consulta', 'exame', 'dentista', 'plano de saude', 'unimed', 'amil', 'hospital', 'clinica', 'academia', 'smart fit']],
    ['moradia', ['aluguel', 'condominio', 'luz', 'energia', 'enel', 'cemig', 'agua', 'sabesp', 'gas ', 'conta de gas', 'internet', 'iptu', 'reforma', 'manutencao', 'diarista']],
    ['educacao', ['escola', 'faculdade', 'curso', 'mensalidade escolar', 'livro', 'udemy', 'alura', 'material escolar']],
    ['lazer', ['cinema', 'show', 'ingresso', 'teatro', 'parque', 'jogo', 'steam', 'playstation', 'xbox', 'festa', 'balada']],
    ['assinaturas', ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'max ', 'globoplay', 'deezer', 'youtube', 'icloud', 'google one', 'apple', 'assinatura', 'streaming', 'paramount', 'claude', 'chatgpt', 'openai', 'gemini', 'copilot', 'perplexity', 'midjourney', 'canva', 'adobe', 'microsoft 365', 'office 365', 'dropbox', 'notion', 'duolingo']],
    ['compras', ['magalu', 'magazine', 'amazon', 'mercado livre', 'shopee', 'shein', 'americanas', 'casas bahia', 'renner', 'riachuelo', 'c&a', 'loja', 'roupa', 'calcado', 'notebook', 'celular', 'eletro']],
    ['viagem', ['hotel', 'pousada', 'airbnb', 'booking', 'passagem', 'latam', 'gol ', 'azul ', 'smiles', 'viagem', 'decolar', 'aluguel de carro']],
    ['pets', ['pet ', 'pet shop', 'petshop', 'petz', 'cobasi', 'veterin', 'racao', 'banho e tosa']],
  ];
  // ---------- compras da fatura do cartão ----------
  // Um lançamento de cartão pode detalhar as compras da fatura. O valor do lançamento é o da fatura;
  // o que passar da soma das compras é a parte "não detalhada".
  const MAX_COMPRAS = 200;
  function limparCompras(categoria, x) {
    if (categoria !== 'cartao' || !Array.isArray(x)) return [];
    return x.slice(0, MAX_COMPRAS).map((c) => {
      const centavos = Number(c?.centavos);
      const desc = String(c?.desc ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!desc || !Number.isInteger(centavos) || centavos <= 0 || centavos > 1e13) return null;
      return { id: String(c.id || novoId()).slice(0, 80), desc, centavos, tipoGasto: TIPO[c.tipoGasto] ? c.tipoGasto : null, fixa: !!c.fixa };
    }).filter(Boolean);
  }
  const somaCompras = (l) => (l.compras || []).reduce((a, c) => a + c.centavos, 0);

  /** Partes de um gasto para a análise por tipo: as compras da fatura e o resto não detalhado, ou o lançamento inteiro. */
  function partesGasto(l) {
    if (!l.compras || !l.compras.length) return [{ l, desc: l.desc, centavos: l.centavos, tipoGasto: l.tipoGasto || null, compra: null, resto: false }];
    const partes = l.compras.map((c) => ({ l, desc: c.desc, centavos: c.centavos, tipoGasto: c.tipoGasto, compra: c, resto: false }));
    const resto = l.centavos - somaCompras(l);
    if (resto > 0) partes.push({ l, desc: `${l.desc} (não detalhado)`, centavos: resto, tipoGasto: null, compra: null, resto: true });
    return partes;
  }

  /** Compras marcadas "todo mês" na fatura mais recente do mesmo cartão antes de (ano, mes). */
  function comprasFixasAnteriores(lista, cartao, ano, mes, ignorarId = null) {
    if (!cartao) return { compras: [], de: null };
    const k = chaveMes(ano, mes);
    const anterior = lista.filter((l) => l.id !== ignorarId && l.categoria === 'cartao' && mesmoCartao(l.cartao, cartao) && chaveMes(l.ano, l.mes) < k
      && (l.compras || []).some((c) => c.fixa)).sort((a, b) => chaveMes(b.ano, b.mes) - chaveMes(a.ano, a.mes))[0];
    if (!anterior) return { compras: [], de: null };
    return { compras: anterior.compras.filter((c) => c.fixa).map((c) => ({ ...c, id: novoId() })), de: { ano: anterior.ano, mes: anterior.mes } };
  }

  /**
   * Lê compras escritas nas observações, uma por linha: "R$ 110,00 - Claude IA" ou "Claude IA - R$ 110,00".
   * Linhas de título terminadas em ":" ("Fixos:") marcam as compras seguintes como fixas quando o título fala em fixo/mensal.
   * Devolve as compras e o texto que sobra.
   */
  function lerComprasDoTexto(texto) {
    const compras = [], sobra = [];
    let fixas = false;
    for (const linha of String(texto || '').split(/\r?\n/)) {
      const t = linha.trim();
      if (!t) { sobra.push(linha); continue; }
      const titulo = /^([^\d]{1,40}):\s*$/.exec(t);
      if (titulo) { fixas = /fix|mensa|recorr|todo m/i.test(titulo[1]); continue; }
      const m = /^(?:[-•*]\s*)?R\$\s*([\d.,]+)\s*[-–—:]\s*(.+)$/i.exec(t) || /^(?:[-•*]\s*)?(.+?)\s*[-–—:]\s*R\$\s*([\d.,]+)$/i.exec(t);
      if (!m) { sobra.push(linha); continue; }
      const [valorTxt, desc] = /^R\$/i.test(t.replace(/^[-•*]\s*/, '')) ? [m[1], m[2]] : [m[2], m[1]];
      const centavos = lerValor(valorTxt);
      if (!(centavos > 0) || !desc.trim()) { sobra.push(linha); continue; }
      compras.push({ desc: desc.trim().slice(0, 80), centavos, fixa: fixas });
    }
    return { compras, sobra: sobra.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
  }

  /** Sugere o tipo de gasto: primeiro o que a pessoa já usou para a mesma descrição, depois as palavras-chave. */
  function sugerirTipoGasto(desc, lista = []) {
    const n = normalizarTexto(desc);
    if (!n) return null;
    const anterior = lista.flatMap((l) => (l.compras && l.compras.length ? l.compras.map((c) => ({ ...c, criadoEm: l.criadoEm })) : [l]))
      .filter((l) => l.tipoGasto && normalizarTexto(l.desc) === n).sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0))[0];
    if (anterior) return anterior.tipoGasto;
    const alvo = ` ${n} `;
    for (const [tipo, palavras] of PALAVRAS_TIPO) {
      if (palavras.some((p) => alvo.includes(p.endsWith(' ') ? ` ${p}` : p))) return tipo;
    }
    return null;
  }
  /** Tipo de gasto só existe em despesas (fixa, variável e cartão). */
  const limparTipoGasto = (categoria, v) => (CAT[categoria]?.tipo === 'saida' && TIPO[v] ? v : null);

  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const BRL_CURTO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

  // ---------- dinheiro ----------

  /** "1.500,50", "1500,5", "1500.50", "R$ 1.500" → centavos. Devolve NaN se não for um número. */
  function lerValor(texto) {
    let s = String(texto ?? '').trim().replace(/[R$\s]/g, '');
    if (!s || !/^-?[\d.,]+$/.test(s)) return NaN;
    if (s.includes(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      const pontos = (s.match(/\./g) || []).length;
      // Um único ponto seguido de exatamente 3 dígitos é separador de milhar no padrão brasileiro ("1.500").
      if (pontos > 1 || /^\-?\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    }
    if ((s.match(/\./g) || []).length > 1) return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : NaN;
  }

  const moeda = (centavos) => BRL.format((centavos || 0) / 100);
  const moedaCurta = (centavos) => BRL_CURTO.format(Math.round((centavos || 0) / 100));
  /** Para preencher o campo de valor ao editar: 150050 → "1.500,50". */
  const valorParaCampo = (centavos) =>
    ((centavos || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /** Divide um total em n parcelas inteiras; a diferença de centavos fica na última. */
  function dividir(total, n) {
    const base = Math.floor(total / n);
    return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - base * (n - 1) : base));
  }

  // ---------- datas ----------

  const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate();
  function somarMeses(ano, mes, k) {
    const t = ano * 12 + mes + k;
    return { ano: Math.floor(t / 12), mes: ((t % 12) + 12) % 12 };
  }
  const chaveMes = (ano, mes) => ano * 12 + mes;
  const dataDe = (l) => new Date(l.ano, l.mes, Math.min(l.dia, diasNoMes(l.ano, l.mes)));
  const isoDe = (l) => `${l.ano}-${String(l.mes + 1).padStart(2, '0')}-${String(Math.min(l.dia, diasNoMes(l.ano, l.mes))).padStart(2, '0')}`;
  function lerIso(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return null;
    return { ano: +m[1], mes: +m[2] - 1, dia: +m[3] };
  }
  function inicioDoDia(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  /** pago | atrasado | hoje | breve (até 3 dias) | pendente */
  function situacao(l, hoje = new Date()) {
    if (l.pago) return { cod: 'pago', dias: 0 };
    const dias = Math.round((dataDe(l) - inicioDoDia(hoje)) / 86400000);
    if (dias < 0) return { cod: 'atrasado', dias };
    if (dias === 0) return { cod: 'hoje', dias };
    if (dias <= 3) return { cod: 'breve', dias };
    return { cod: 'pendente', dias };
  }

  // ---------- criação ----------

  const MAX_OBS = 1000;
  const limparObs = (v) => String(v ?? '').replace(/\r/g, '').trim().slice(0, MAX_OBS);

  // ---------- cartões de crédito ----------
  // Bancos da lista suspensa "Qual cartão?" (em ordem alfabética). Outros nomes entram por "Outros".
  const CARTOES_SUGERIDOS = [
    'Banco do Brasil', 'Banco Pan', 'BTG Pactual', 'Bradesco', 'C6 Bank', 'Caixa', 'Inter', 'Itaú', 'Mercado Pago',
    'Neon', 'Next', 'Nubank', 'Original', 'PicPay', 'Porto Bank', 'Santander', 'Sicoob', 'Sicredi', 'Will Bank', 'XP',
  ];
  /** Nome do cartão só existe em lançamentos/provisões da categoria cartão. */
  const limparCartao = (categoria, v) => (categoria === 'cartao' ? String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) : '');
  const mesmoCartao = (a, b) => normalizarTexto(a) === normalizarTexto(b);
  function normalizarTexto(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

  function novoId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /**
   * Gera os lançamentos de um formulário.
   * recorrencia: 'unica' | 'mensal' (quantidade = meses) | 'parcelada' (quantidade = parcelas)
   * modoValor (só parcelada): 'total' divide o valor; 'parcela' repete o valor em cada parcela.
   */
  function gerar(f, gerarId = novoId) {
    const base = {
      desc: String(f.desc).trim(), obs: limparObs(f.obs), categoria: f.categoria, cartao: limparCartao(f.categoria, f.cartao),
      tipoGasto: limparTipoGasto(f.categoria, f.tipoGasto),
      provisao: f.provisao || null, pago: false, criadoEm: Date.now(),
    };
    // Compras detalhadas só em fatura de cartão; numa série mensal, os meses seguintes levam as compras fixas.
    const compras = f.recorrencia === 'parcelada' ? [] : limparCompras(f.categoria, f.compras);
    const comCompras = (o, lista) => (lista.length ? { ...o, compras: lista, centavos: Math.max(o.centavos, lista.reduce((a, c) => a + c.centavos, 0)) } : o);
    if (f.recorrencia === 'unica' || !f.recorrencia) {
      return [comCompras({ ...base, id: gerarId(), grupo: null, parcela: null, centavos: f.centavos, ano: f.ano, mes: f.mes, dia: f.dia }, compras)];
    }
    const n = Math.max(2, Math.min(120, Math.floor(f.quantidade) || 2));
    const grupo = gerarId();
    const valores = f.recorrencia === 'parcelada' && f.modoValor !== 'parcela'
      ? dividir(f.centavos, n)
      : Array(n).fill(f.centavos);
    return valores.map((centavos, i) => {
      const { ano, mes } = somarMeses(f.ano, f.mes, i);
      const doMes = i === 0 ? compras : compras.filter((c) => c.fixa).map((c) => ({ ...c, id: gerarId() }));
      return comCompras({
        ...base, id: gerarId(), grupo, centavos, ano, mes, dia: f.dia,
        parcela: f.recorrencia === 'parcelada' ? { n: i + 1, total: n } : null,
      }, doMes);
    });
  }

  const titulo = (l) => (l.parcela ? `${l.desc} · ${l.parcela.n}/${l.parcela.total}` : l.desc);

  // ---------- séries (recorrências e parcelamentos) ----------

  /** Lançamentos afetados por uma ação em `l` com escopo 'este' | 'proximos' | 'todos'. */
  function alvos(lista, l, escopo) {
    if (!l.grupo || escopo === 'este') return [l];
    const k = chaveMes(l.ano, l.mes);
    return lista.filter((x) => x.grupo === l.grupo && (escopo === 'todos' || chaveMes(x.ano, x.mes) >= k));
  }

  /**
   * Edita `id`. Em séries, descrição, valor, categoria e dia valem para os alvos;
   * mês e ano só mudam quando o escopo é 'este' (cada parcela mantém o seu mês).
   * Editar só um item o desliga da série, exceto parcelas (que continuam numeradas).
   */
  function editar(lista, id, d, escopo = 'este') {
    const l = lista.find((x) => x.id === id);
    if (!l) return lista;
    const ids = new Set(alvos(lista, l, escopo).map((x) => x.id));
    return lista.map((x) => {
      if (!ids.has(x.id)) return x;
      const novo = { ...x, desc: d.desc.trim(), obs: d.obs === undefined ? (x.obs || '') : limparObs(d.obs), centavos: d.centavos, categoria: d.categoria, dia: d.dia };
      if (d.provisao !== undefined) novo.provisao = d.provisao || null;
      novo.cartao = limparCartao(d.categoria, d.cartao === undefined ? x.cartao : d.cartao);
      novo.tipoGasto = limparTipoGasto(d.categoria, d.tipoGasto === undefined ? x.tipoGasto : d.tipoGasto);
      // As compras são de cada fatura: só mudam no lançamento editado; os outros da série mantêm valor e compras.
      const compras = limparCompras(d.categoria, x.id === id && d.compras !== undefined ? d.compras : x.compras);
      if (x.id !== id && x.compras && x.compras.length) novo.centavos = x.centavos;
      if (compras.length) { novo.compras = compras; novo.centavos = Math.max(novo.centavos, compras.reduce((a, c) => a + c.centavos, 0)); } else delete novo.compras;
      if (x.id === id && (escopo === 'este' || !x.grupo)) {
        novo.ano = d.ano; novo.mes = d.mes;
        if (x.grupo && !x.parcela) novo.grupo = null;
      }
      return novo;
    });
  }

  function excluir(lista, id, escopo = 'este') {
    const l = lista.find((x) => x.id === id);
    if (!l) return { lista, removidos: [] };
    const ids = new Set(alvos(lista, l, escopo).map((x) => x.id));
    return { lista: lista.filter((x) => !ids.has(x.id)), removidos: lista.filter((x) => ids.has(x.id)) };
  }

  // ---------- resumos ----------

  function resumoMes(lista, ano, mes) {
    const r = { entradas: 0, recebido: 0, saidas: 0, pago: 0, reservas: 0, aplicado: 0, qtd: 0 };
    for (const l of lista) {
      if (l.ano !== ano || l.mes !== mes) continue;
      r.qtd++;
      const tipo = CAT[l.categoria]?.tipo;
      if (tipo === 'entrada') { r.entradas += l.centavos; if (l.pago) r.recebido += l.centavos; }
      else if (tipo === 'reserva') { r.reservas += l.centavos; if (l.pago) r.aplicado += l.centavos; }
      else { r.saidas += l.centavos; if (l.pago) r.pago += l.centavos; }
    }
    r.faltaPagar = r.saidas - r.pago;
    r.faltaReceber = r.entradas - r.recebido;
    r.saldoPrevisto = r.entradas - r.saidas - r.reservas;
    r.saldoRealizado = r.recebido - r.pago - r.aplicado;
    r.pctPago = r.saidas ? Math.round((r.pago / r.saidas) * 100) : 0;
    return r;
  }

  /** Matriz anual: por categoria, por descrição dentro da categoria e saldo/acumulado mês a mês. */
  function resumoAno(lista, ano) {
    const doAno = lista.filter((l) => l.ano === ano);
    const cats = CATEGORIAS.map((c) => {
      const meses = Array(12).fill(0);
      const itens = new Map();
      for (const l of doAno) {
        if (l.categoria !== c.id) continue;
        meses[l.mes] += l.centavos;
        if (!itens.has(l.desc)) itens.set(l.desc, Array(12).fill(0));
        itens.get(l.desc)[l.mes] += l.centavos;
      }
      const total = meses.reduce((a, b) => a + b, 0);
      const detalhes = [...itens.entries()]
        .map(([desc, m]) => ({ desc, meses: m, total: m.reduce((a, b) => a + b, 0) }))
        .sort((a, b) => b.total - a.total);
      return { ...c, meses, total, detalhes };
    });
    const saldo = Array(12).fill(0);
    const entradas = Array(12).fill(0);
    const saidas = Array(12).fill(0);
    for (const c of cats) {
      c.meses.forEach((v, m) => {
        if (c.tipo === 'entrada') { entradas[m] += v; saldo[m] += v; }
        else { saidas[m] += v; saldo[m] -= v; }
      });
    }
    let soma = 0;
    const acumulado = saldo.map((v) => (soma += v));
    return { cats, saldo, entradas, saidas, acumulado, total: soma };
  }

  // ---------- onde estou gastando ----------

  /**
   * Despesas do período por tipo de gasto: totais, descrições, cartões, maiores gastos,
   * parcelas já comprometidas nos meses seguintes, evolução de 6 meses e alertas.
   */
  function gastos(lista, ano, mes = null, { categorias = null } = {}) {
    const filtro = categorias && categorias.length ? new Set(categorias) : null;
    const ehDespesa = (l) => CAT[l.categoria]?.tipo === 'saida' && (!filtro || filtro.has(l.categoria));
    const noPeriodo = (l, a, m) => l.ano === a && (m == null || l.mes === m);
    const lancs = lista.filter((l) => ehDespesa(l) && noPeriodo(l, ano, mes));
    // Faturas com compras detalhadas entram compra por compra.
    const itens = lancs.flatMap(partesGasto);
    const total = itens.reduce((a, p) => a + p.centavos, 0);
    const porTipo = new Map();
    const semTipo = { qtd: 0, total: 0, ids: [] };
    for (const p of itens) {
      if (!p.tipoGasto) {
        semTipo.qtd++; semTipo.total += p.centavos;
        if (!p.compra && !p.resto) semTipo.ids.push(p.l.id);
        continue;
      }
      const t = porTipo.get(p.tipoGasto) || { id: p.tipoGasto, total: 0, qtd: 0, descricoes: new Map() };
      t.total += p.centavos; t.qtd++;
      const k = normalizarTexto(p.desc);
      const d = t.descricoes.get(k) || { desc: p.desc, total: 0, qtd: 0, faturas: [] };
      d.total += p.centavos; d.qtd++;
      if (p.compra && !d.faturas.includes(p.l.desc)) d.faturas.push(p.l.desc);
      t.descricoes.set(k, d);
      porTipo.set(p.tipoGasto, t);
    }
    const tipos = [...porTipo.values()].map((t) => ({
      ...TIPO[t.id], total: t.total, qtd: t.qtd, pct: total ? Math.round((t.total / total) * 100) : 0,
      descricoes: [...t.descricoes.values()].sort((a, b) => b.total - a.total),
    })).sort((a, b) => b.total - a.total);

    // Tipo de gasto por cartão (cartões com gastos no período).
    const cartoes = new Map();
    for (const p of itens) {
      if (p.l.categoria !== 'cartao') continue;
      const nome = (p.l.cartao || '').trim() || 'Sem cartão definido';
      const k = normalizarTexto(nome);
      const c = cartoes.get(k) || { nome, total: 0, porTipo: {} };
      c.total += p.centavos;
      const t = p.tipoGasto || 'semtipo';
      c.porTipo[t] = (c.porTipo[t] || 0) + p.centavos;
      cartoes.set(k, c);
    }

    // Maiores gastos por descrição (somando todas as vezes).
    const descs = new Map();
    for (const p of itens) {
      const k = normalizarTexto(p.desc);
      const d = descs.get(k) || { desc: p.desc, total: 0, qtd: 0, tipoGasto: p.tipoGasto };
      d.total += p.centavos; d.qtd++;
      if (!d.tipoGasto && p.tipoGasto) d.tipoGasto = p.tipoGasto;
      descs.set(k, d);
    }

    // Parcelas que já caem nos meses seguintes ao período.
    const ultimo = mes == null ? chaveMes(ano, 11) : chaveMes(ano, mes);
    const futuras = new Map();
    for (const l of lista) {
      if (!l.parcela || !ehDespesa(l)) continue;
      const k = chaveMes(l.ano, l.mes);
      if (k > ultimo) futuras.set(k, (futuras.get(k) || 0) + l.centavos);
    }
    const proximo = futuras.get(ultimo + 1) || 0;
    const chaveFim = futuras.size ? Math.max(...futuras.keys()) : null;
    const parcelas = { proximoMes: proximo, ate: chaveFim == null ? null : { ano: Math.floor(chaveFim / 12), mes: chaveFim % 12 } };

    // Evolução de 6 meses (só no período mensal): maior tipo × média dos demais tipos.
    let evolucao = null;
    if (mes != null && tipos.length) {
      const alvo = tipos[0].id;
      evolucao = { tipo: TIPO[alvo], meses: [] };
      for (let i = 5; i >= 0; i--) {
        const { ano: a, mes: m } = somarMeses(ano, mes, -i);
        const doMes = lista.filter((l) => ehDespesa(l) && l.ano === a && l.mes === m).flatMap(partesGasto).filter((p) => p.tipoGasto);
        const doAlvo = doMes.filter((l) => l.tipoGasto === alvo).reduce((s, l) => s + l.centavos, 0);
        const outros = new Map();
        for (const l of doMes) if (l.tipoGasto !== alvo) outros.set(l.tipoGasto, (outros.get(l.tipoGasto) || 0) + l.centavos);
        const media = outros.size ? Math.round([...outros.values()].reduce((s, v) => s + v, 0) / outros.size) : 0;
        evolucao.meses.push({ ano: a, mes: m, alvo: doAlvo, media });
      }
    }

    // Alertas: tipo que subiu bastante, assinaturas e parcelas futuras.
    const alertas = [];
    const ant = periodoAnterior(ano, mes);
    const antPorTipo = new Map();
    for (const l of lista) {
      if (ehDespesa(l) && noPeriodo(l, ant.ano, ant.mes)) for (const p of partesGasto(l)) if (p.tipoGasto) antPorTipo.set(p.tipoGasto, (antPorTipo.get(p.tipoGasto) || 0) + p.centavos);
    }
    for (const t of tipos) {
      const a = antPorTipo.get(t.id) || 0;
      const v = variacao(t.total, a);
      if (v != null && v >= 20 && t.total - a >= 5000) { alertas.push({ cod: 'subiu', tipo: t, de: a, para: t.total, pct: v }); break; }
    }
    const assin = tipos.find((t) => t.id === 'assinaturas');
    if (assin) alertas.push({ cod: 'assinaturas', total: assin.total, qtd: assin.descricoes.length, nomes: assin.descricoes.map((d) => d.desc) });
    if (proximo) alertas.push({ cod: 'parcelas', total: proximo, ate: parcelas.ate });

    return {
      total, qtd: lancs.length, tipos, semTipo, maior: tipos[0] || null,
      cartoes: [...cartoes.values()].sort((a, b) => b.total - a.total),
      maioresDescricoes: [...descs.values()].sort((a, b) => b.total - a.total).slice(0, 5),
      parcelas, evolucao, alertas,
    };
  }

  // ---------- dashboard ----------

  /** Totais de um período: mês (mes 0–11) ou ano inteiro (mes = null). */
  /** categorias: lista de ids para filtrar (vazia ou ausente = todas). */
  function painel(lista, ano, mes = null, { categorias = null } = {}) {
    const filtro = categorias && categorias.length ? new Set(categorias) : null;
    const itens = lista.filter((l) => l.ano === ano && (mes == null || l.mes === mes) && (!filtro || filtro.has(l.categoria)));
    const porCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c.id, 0]));
    const qtdCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c.id, 0]));
    const cartoes = new Map();
    let pagoDespesas = 0;
    for (const l of itens) {
      if (!(l.categoria in porCategoria)) continue;
      porCategoria[l.categoria] += l.centavos;
      qtdCategoria[l.categoria]++;
      if (CAT[l.categoria].tipo === 'saida' && l.pago) pagoDespesas += l.centavos;
      if (l.categoria === 'cartao') {
        const nome = (l.cartao || '').trim() || 'Sem cartão definido';
        const k = normalizarTexto(nome);
        const c = cartoes.get(k) || { nome, total: 0, qtd: 0 };
        c.total += l.centavos; c.qtd++;
        cartoes.set(k, c);
      }
    }
    const soma = (tipo) => CATEGORIAS.filter((c) => c.tipo === tipo).reduce((a, c) => a + porCategoria[c.id], 0);
    const receitas = soma('entrada'), despesas = soma('saida'), reservas = soma('reserva');
    const pct = (v, base) => (base > 0 ? Math.round((v / base) * 100) : null);
    return {
      ano, mes, qtd: itens.length, porCategoria, qtdCategoria, receitas, despesas, reservas,
      saldo: receitas - despesas - reservas,
      taxaPoupanca: pct(reservas, receitas),
      comprometido: pct(despesas, receitas),
      pagoDespesas, abertoDespesas: despesas - pagoDespesas,
      cartoes: [...cartoes.values()].sort((a, b) => b.total - a.total),
      maiores: itens.filter((l) => CAT[l.categoria]?.tipo === 'saida').sort((a, b) => b.centavos - a.centavos).slice(0, 5),
    };
  }

  /**
   * Detalhe de uma categoria no período: os lançamentos agrupados pela descrição
   * (parcelas e meses de uma conta mensal somam juntos), do maior para o menor.
   */
  function detalhesCategoria(lista, ano, mes, categoria) {
    const grupos = new Map();
    for (const l of lista) {
      if (l.categoria !== categoria || l.ano !== ano || (mes != null && l.mes !== mes)) continue;
      const k = normalizarTexto(l.desc);
      const g = grupos.get(k) || { desc: l.desc, total: 0, qtd: 0, pago: 0, cartoes: [] };
      g.total += l.centavos; g.qtd++;
      if (l.pago) g.pago += l.centavos;
      if (l.cartao && !g.cartoes.some((c) => normalizarTexto(c) === normalizarTexto(l.cartao))) g.cartoes.push(l.cartao);
      grupos.set(k, g);
    }
    return [...grupos.values()].sort((a, b) => b.total - a.total || a.desc.localeCompare(b.desc, 'pt-BR'));
  }

  /** Período anterior para comparação: mês anterior ou ano anterior. */
  function periodoAnterior(ano, mes = null) {
    if (mes == null) return { ano: ano - 1, mes: null };
    return somarMeses(ano, mes, -1);
  }

  /** Variação percentual entre dois valores (null quando não há base). */
  const variacao = (atual, anterior) => (anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : null);

  // ---------- busca ----------

  const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ---------- backup, migração e CSV ----------

  /** Valida e limpa um lançamento vindo de arquivo. Devolve null se for inválido. */
  function limpar(x) {
    if (!x || typeof x !== 'object') return null;
    const ano = Number(x.ano), mes = Number(x.mes), dia = Number(x.dia), centavos = Number(x.centavos);
    if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 0 || mes > 11) return null;
    if (!Number.isInteger(centavos) || centavos < 0 || !CAT[x.categoria]) return null;
    const p = x.parcela && Number.isInteger(x.parcela.n) && Number.isInteger(x.parcela.total) ? { n: x.parcela.n, total: x.parcela.total } : null;
    return {
      id: String(x.id || novoId()), grupo: x.grupo ? String(x.grupo) : null, desc: String(x.desc || 'Sem descrição').slice(0, 120), obs: limparObs(x.obs),
      categoria: x.categoria, centavos, ano, mes, dia: Number.isInteger(dia) && dia >= 1 && dia <= 31 ? dia : 1,
      pago: !!x.pago, parcela: p, criadoEm: Number(x.criadoEm) || Date.now(),
      provisao: x.provisao ? String(x.provisao).slice(0, 80) : null, cartao: limparCartao(x.categoria, x.cartao),
      tipoGasto: limparTipoGasto(x.categoria, x.tipoGasto),
      ...(() => { const c = limparCompras(x.categoria, x.compras); return c.length ? { compras: c, centavos: Math.max(centavos, c.reduce((a, y) => a + y.centavos, 0)) } : {}; })(),
    };
  }

  const CAT_ANTIGA = { 'Renda': 'receita', 'Despesa Fixa': 'fixa', 'Despesa Variável': 'variavel', 'Investimento': 'investimento', 'Poupança': 'poupanca' };

  /** Converte o formato do Vértice antigo ({id, desc, val, category, paid, month, year}). */
  function migrarAntigo(arr) {
    if (!Array.isArray(arr)) return [];
    const grupos = new Map();
    const out = [];
    for (const t of arr) {
      if (!t || typeof t !== 'object' || !CAT_ANTIGA[t.category]) continue;
      const val = Number(t.val), mes = Number(t.month), ano = Number(t.year);
      if (!Number.isFinite(val) || !Number.isInteger(mes) || !Number.isInteger(ano)) continue;
      let desc = String(t.desc || 'Sem descrição');
      let parcela = null, grupo = null;
      const m = /^(.*) \[(\d+)\/(\d+)\]$/.exec(desc);
      if (m) {
        desc = m[1];
        parcela = { n: +m[2], total: +m[3] };
        const chave = `${desc}|${t.category}|${m[3]}|${Math.floor((Number(t.id) - parcela.n) / 1000)}`;
        if (!grupos.has(chave)) grupos.set(chave, novoId());
        grupo = grupos.get(chave);
      }
      out.push({
        id: novoId(), grupo, desc, obs: '', categoria: CAT_ANTIGA[t.category], centavos: Math.round(val * 100),
        ano, mes, dia: 10, pago: !!t.paid, parcela, criadoEm: Number(t.id) || Date.now(),
      });
    }
    return out;
  }

  /** Aceita o backup novo ({versao, lancamentos}) ou a lista do Vértice antigo. */
  function lerBackup(obj) {
    if (Array.isArray(obj)) return { lancamentos: migrarAntigo(obj), perfil: null, origem: 'antigo' };
    if (obj && Array.isArray(obj.lancamentos)) {
      return { lancamentos: obj.lancamentos.map(limpar).filter(Boolean), perfil: obj.perfil || null, origem: 'vertice' };
    }
    throw new Error('Arquivo não reconhecido como backup do Vértice.');
  }

  function csv(lista, ano) {
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const linhas = [['Vencimento', 'Descrição', 'Categoria', 'Cartão', 'Valor', 'Situação', 'Observações'].join(';')];
    lista.filter((l) => ano == null || l.ano === ano)
      .sort((a, b) => dataDe(a) - dataDe(b))
      .forEach((l) => {
        const c = CAT[l.categoria];
        linhas.push([
          dataDe(l).toLocaleDateString('pt-BR'), q(titulo(l)), q(c.nome), q(l.cartao || ''),
          (l.centavos / 100).toFixed(2).replace('.', ','), l.pago ? c.feito : c.pendente, q(l.obs || ''),
        ].join(';'));
      });
    return '﻿' + linhas.join('\r\n');
  }

  // ---------- provisões (previsão de gasto por mês) ----------
  // Cada provisão vale para um mês. Provisões repetidas compartilham o mesmo `grupo`,
  // e é o grupo que o lançamento guarda em `provisao`: assim as parcelas de uma compra
  // consomem a provisão do mês de cada parcela.
  // auto: consome também os lançamentos da categoria da provisão que não foram ligados a outra.

  const MAX_PROVISOES = 1200;

  function gerarProvisoes(f, gerarId = novoId) {
    const n = f.repetir ? Math.max(1, Math.min(60, Math.floor(f.quantidade) || 1)) : 1;
    const grupo = gerarId();
    return Array.from({ length: n }, (_, i) => {
      const { ano, mes } = somarMeses(f.ano, f.mes, i);
      return {
        id: i === 0 ? grupo : gerarId(), grupo, nome: String(f.nome).trim().slice(0, 80), centavos: f.centavos,
        categoria: CAT[f.categoria]?.tipo === 'saida' ? f.categoria : null, auto: !!f.auto && CAT[f.categoria]?.tipo === 'saida',
        cartao: limparCartao(f.categoria, f.cartao),
        obs: limparObs(f.obs), ano, mes, criadoEm: Date.now(),
      };
    });
  }

  function limparProvisao(x) {
    if (!x || typeof x !== 'object') return null;
    const ano = Number(x.ano), mes = Number(x.mes), centavos = Number(x.centavos);
    if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 0 || mes > 11) return null;
    if (!Number.isInteger(centavos) || centavos <= 0 || centavos > 1e13) return null;
    const nome = String(x.nome || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!nome) return null;
    const categoria = CAT[x.categoria]?.tipo === 'saida' ? x.categoria : null;
    const id = String(x.id || novoId()).slice(0, 80);
    return {
      id, grupo: String(x.grupo || id).slice(0, 80), nome, centavos, categoria, auto: !!x.auto && !!categoria, cartao: limparCartao(categoria, x.cartao),
      obs: limparObs(x.obs), ano, mes, criadoEm: Number(x.criadoEm) || Date.now(),
    };
  }

  /** Consumo das provisões de um mês: o que foi lançado nelas, quanto já foi pago e quanto resta. */
  function consumoProvisoes(lancamentos, provisoes, ano, mes) {
    const doMes = provisoes.filter((p) => p.ano === ano && p.mes === mes);
    const grupos = new Set(doMes.map((p) => p.grupo));
    const lancMes = lancamentos.filter((l) => l.ano === ano && l.mes === mes && CAT[l.categoria]?.tipo !== 'entrada');
    const r = doMes.map((p) => {
      const itens = lancMes.filter((l) => l.provisao === p.grupo
        || (p.auto && l.categoria === p.categoria && (!p.cartao || mesmoCartao(l.cartao, p.cartao))
          && !(l.provisao && grupos.has(l.provisao))));
      const consumido = itens.reduce((a, l) => a + l.centavos, 0);
      const pago = itens.filter((l) => l.pago).reduce((a, l) => a + l.centavos, 0);
      return {
        provisao: p, itens, consumido, pago, restante: Math.max(0, p.centavos - consumido),
        excedente: Math.max(0, consumido - p.centavos), pct: Math.round((consumido / p.centavos) * 100),
      };
    });
    return r.sort((a, b) => b.pct - a.pct);
  }

  /** Quanto ainda está reservado nas provisões do mês (previsto e ainda não lançado). */
  const reservadoProvisoes = (lancamentos, provisoes, ano, mes) =>
    consumoProvisoes(lancamentos, provisoes, ano, mes).reduce((a, c) => a + c.restante, 0);

  // ---------- planejamentos (tabelas livres: linhas × colunas) ----------

  const LIMITES_PLANO = { planos: 100, linhas: 100, colunas: 24, texto: 80 };

  function novoPlano({ titulo = 'Novo planejamento', exemplo = false } = {}, gerarId = novoId) {
    const col = (nome) => ({ id: gerarId(), nome });
    const lin = (nome, valores = []) => ({ id: gerarId(), nome, valores });
    const agora = Date.now();
    if (exemplo) {
      const c = [col('1º ano'), col('2º ano')];
      const v = (a, b) => ({ [c[0].id]: a, [c[1].id]: b });
      return {
        id: gerarId(), titulo: 'Plano apartamento', meta: 30000000, obs: '', colunas: c, criadoEm: agora, atualizadoEm: agora,
        linhas: [lin('Poupança', v(1800000, 1800000)), lin('PLR', v(3000000, 3000000)), lin('13º salário', v(600000, 600000))],
      };
    }
    return { id: gerarId(), titulo, meta: null, obs: '', colunas: [col('1º ano'), col('2º ano')], linhas: [lin('', {})], criadoEm: agora, atualizadoEm: agora };
  }

  function totaisPlano(p) {
    const porColuna = Object.fromEntries(p.colunas.map((c) => [c.id, 0]));
    const porLinha = {};
    for (const l of p.linhas) {
      let t = 0;
      for (const c of p.colunas) {
        const v = Number.isInteger(l.valores[c.id]) ? l.valores[c.id] : 0;
        porColuna[c.id] += v; t += v;
      }
      porLinha[l.id] = t;
    }
    const total = Object.values(porColuna).reduce((a, b) => a + b, 0);
    const pctMeta = p.meta > 0 ? Math.max(0, Math.round((total / p.meta) * 100)) : null;
    return { porColuna, porLinha, total, pctMeta, falta: p.meta > 0 ? Math.max(0, p.meta - total) : null };
  }

  /** Valida um planejamento vindo do navegador ou de arquivo. Devolve null se for inválido. */
  function limparPlano(x) {
    if (!x || typeof x !== 'object' || !Array.isArray(x.colunas) || !Array.isArray(x.linhas)) return null;
    if (x.colunas.length > LIMITES_PLANO.colunas || x.linhas.length > LIMITES_PLANO.linhas) return null;
    const txt = (v, max = LIMITES_PLANO.texto) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    const colunas = x.colunas.map((c) => ({ id: String(c?.id || novoId()), nome: txt(c?.nome) }));
    const ids = new Set(colunas.map((c) => c.id));
    if (ids.size !== colunas.length) return null;
    const linhas = x.linhas.map((l) => {
      const valores = {};
      for (const [k, v] of Object.entries(l?.valores || {})) {
        if (ids.has(k) && Number.isInteger(v) && Math.abs(v) <= 1e13) valores[k] = v;
      }
      return { id: String(l?.id || novoId()), nome: txt(l?.nome), valores };
    });
    const meta = Number.isInteger(x.meta) && x.meta > 0 && x.meta <= 1e13 ? x.meta : null;
    return {
      id: String(x.id || novoId()), titulo: txt(x.titulo, 120) || 'Planejamento', meta, obs: limparObs(x.obs),
      colunas, linhas, criadoEm: Number(x.criadoEm) || Date.now(), atualizadoEm: Number(x.atualizadoEm) || Date.now(),
    };
  }

  function csvPlano(p) {
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const v = (c) => (c / 100).toFixed(2).replace('.', ',');
    const t = totaisPlano(p);
    const linhas = [[q(p.titulo), ...p.colunas.map((c) => q(c.nome)), 'Total'].join(';')];
    for (const l of p.linhas) linhas.push([q(l.nome), ...p.colunas.map((c) => v(l.valores[c.id] || 0)), v(t.porLinha[l.id])].join(';'));
    linhas.push(['TOTAL', ...p.colunas.map((c) => v(t.porColuna[c.id])), v(t.total)].join(';'));
    if (p.meta) linhas.push(['META', ...p.colunas.map(() => ''), v(p.meta)].join(';'));
    return '﻿' + linhas.join('\r\n');
  }

  // ---------- planos de assinatura por período ----------
  const PERIODOS = [
    { id: 'mensal', nome: 'Mensal', dias: 30, meses: 1 },
    { id: 'trimestral', nome: 'Trimestral', dias: 90, meses: 3 },
    { id: 'semestral', nome: 'Semestral', dias: 180, meses: 6 },
    { id: 'anual', nome: 'Anual', dias: 365, meses: 12 },
  ];
  const PERIODO = Object.fromEntries(PERIODOS.map((p) => [p.id, p]));
  const PLANOS_ASSINATURA = [
    { id: 'pf', nome: 'Pessoa física', det: '1 usuário · tudo incluído', usuarios: 1 },
    { id: 'essencial', nome: 'Essencial', det: 'até 3 usuários', empresa: true, usuarios: 3 },
    { id: 'gestao', nome: 'Gestão', det: 'até 8 usuários', empresa: true, usuarios: 8 },
    { id: 'grupo', nome: 'Grupo', det: 'até 20 usuários', empresa: true, usuarios: 20 },
  ];
  const PLANO_ASSINATURA = Object.fromEntries(PLANOS_ASSINATURA.map((p) => [p.id, p]));
  // Pessoa física com 8%, 17% e 25% de desconto; empresas com 5%, 10% e 15%.
  const PRECOS_PADRAO = {
    pf: { mensal: 1199, trimestral: 3297, semestral: 5994, anual: 10788 },
    essencial: { mensal: 14900, trimestral: 42465, semestral: 80460, anual: 151980 },
    gestao: { mensal: 29900, trimestral: 85215, semestral: 161460, anual: 304980 },
    grupo: { mensal: 59000, trimestral: 168150, semestral: 318600, anual: 601800 },
  };
  const MAX_PRECO = 100000000;

  /** Tabela completa de preços. Valores ausentes vêm da base; qualquer valor inválido recusa tudo (null). */
  function limparPrecos(x, base = PRECOS_PADRAO) {
    if (!x || typeof x !== 'object') return null;
    const r = {};
    for (const pl of PLANOS_ASSINATURA) {
      r[pl.id] = {};
      for (const pe of PERIODOS) {
        const v = x[pl.id]?.[pe.id];
        if (v === undefined) { r[pl.id][pe.id] = base[pl.id][pe.id]; continue; }
        if (!Number.isInteger(v) || v <= 0 || v > MAX_PRECO) return null;
        r[pl.id][pe.id] = v;
      }
    }
    return r;
  }

  function precoPeriodo(precos, plano, periodo) {
    const tabela = precos[plano] || precos.pf, pe = PERIODO[periodo] || PERIODO.mensal;
    const total = tabela[pe.id], cheio = tabela.mensal * pe.meses;
    return { total, porMes: Math.round(total / pe.meses), desconto: cheio > 0 ? Math.max(0, Math.round((1 - total / cheio) * 100)) : 0 };
  }

  /** Lista para a mensagem de aviso ({opcoes}). */
  function opcoesAssinatura(precos, plano = 'pf') {
    const itens = PERIODOS.map((pe) => ({ pe, ...precoPeriodo(precos, plano, pe.id) }));
    const melhor = itens.reduce((a, b) => (b.porMes < a.porMes ? b : a));
    return itens.map((i) => `• ${i.pe.nome}: ${moeda(i.total)}${i.pe.meses > 1 ? ` (${moeda(i.porMes)}/mês)` : ''}${i === melhor && i.pe.meses > 1 ? ' ← melhor preço' : ''}`).join('\n');
  }

  // ---------- simulador ("e se…?") ----------
  // Nada aqui altera lançamentos: só calcula cenários a partir deles.

  const MAX_CENARIOS = 30;
  const PCTS_TIPO = [0, 10, 20, 30, 50];

  /** Valores de partida: o mês escolhido ou a média dele com os 2 anteriores. */
  function baseSimulacao(lista, ano, mes, modo = 'mes') {
    const meses = modo === 'media3' ? [-2, -1, 0].map((d) => somarMeses(ano, mes, d)) : [{ ano, mes }];
    const chaves = new Set(meses.map((m) => m.ano * 12 + m.mes));
    const valores = Object.fromEntries(CATEGORIAS.map((c) => [c.id, 0]));
    const porTipo = new Map();
    for (const l of lista) {
      if (!chaves.has(l.ano * 12 + l.mes) || !(l.categoria in valores)) continue;
      valores[l.categoria] += l.centavos;
      if (CAT[l.categoria].tipo !== 'saida') continue;
      for (const p of partesGasto(l)) {
        if (!p.tipoGasto || !TIPO[p.tipoGasto]) continue;
        const t = porTipo.get(p.tipoGasto) || { ...TIPO[p.tipoGasto], total: 0, porCat: {} };
        t.total += p.centavos; t.porCat[l.categoria] = (t.porCat[l.categoria] || 0) + p.centavos;
        porTipo.set(p.tipoGasto, t);
      }
    }
    const n = meses.length;
    for (const k in valores) valores[k] = Math.round(valores[k] / n);
    const tipos = [...porTipo.values()].map((t) => ({
      ...t, total: Math.round(t.total / n), porCat: Object.fromEntries(Object.entries(t.porCat).map(([k, v]) => [k, Math.round(v / n)])),
    })).sort((a, b) => b.total - a.total);
    return { modo: modo === 'media3' ? 'media3' : 'mes', ano, mes, meses, valores, tipos };
  }

  function totaisSimulacao(v) {
    const soma = (tipo) => CATEGORIAS.filter((c) => c.tipo === tipo).reduce((a, c) => a + (v[c.id] || 0), 0);
    const receitas = soma('entrada'), despesas = soma('saida'), reservas = soma('reserva');
    return {
      receitas, despesas, reservas, saldo: receitas - despesas - reservas,
      guardado: receitas - despesas, // sobra do mês + investimentos + poupança
      taxa: receitas > 0 ? Math.round((reservas / receitas) * 100) : null,
      pctDespesas: receitas > 0 ? Math.round((despesas / receitas) * 100) : null,
    };
  }

  /**
   * Aplica um cenário sobre a base. cen.valores: { categoria: centavos } substitui o valor do mês;
   * cen.tipos: { tipoGasto: % de corte } reduz a parte daquele tipo dentro de cada categoria.
   */
  function simular(base, cen = {}) {
    const manuais = cen.valores || {}, cortes = cen.tipos || {};
    const reducao = {};
    for (const t of base.tipos) {
      const pct = cortes[t.id] || 0;
      if (!pct) continue;
      for (const [cat, v] of Object.entries(t.porCat)) reducao[cat] = (reducao[cat] || 0) + Math.round((v * pct) / 100);
    }
    const valores = {};
    for (const c of CATEGORIAS) {
      const v = Number.isInteger(manuais[c.id]) ? manuais[c.id] : base.valores[c.id];
      valores[c.id] = Math.max(0, v - (reducao[c.id] || 0));
    }
    const hoje = totaisSimulacao(base.valores), simulado = totaisSimulacao(valores);
    const projecao = Array.from({ length: 12 }, (_, i) => ({
      ...somarMeses(base.ano, base.mes, i + 1), hoje: hoje.guardado * (i + 1), simulado: simulado.guardado * (i + 1),
    }));
    return { valores, reducao, hoje, simulado, projecao };
  }

  /** Em quantos meses cada planejamento com meta seria atingido guardando o valor mensal de hoje e o simulado. */
  function impactoMetas(planos, res, ano, mes) {
    const prazo = (falta, g) => (falta === 0 ? 0 : g > 0 ? Math.ceil(falta / g) : null);
    const quando = (m) => (m == null ? null : somarMeses(ano, mes, m));
    return planos.filter((p) => p.meta > 0).map((p) => {
      const t = totaisPlano(p);
      const mh = prazo(t.falta, res.hoje.guardado), ms = prazo(t.falta, res.simulado.guardado);
      return {
        id: p.id, titulo: p.titulo, meta: p.meta, total: t.total, falta: t.falta, pct: Math.min(100, t.pctMeta),
        hoje: { meses: mh, quando: quando(mh) }, simulado: { meses: ms, quando: quando(ms) },
        antes: mh != null && ms != null ? mh - ms : null,
      };
    });
  }

  function limparCenario(x) {
    if (!x || typeof x !== 'object') return null;
    const nome = String(x.nome || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (!nome) return null;
    const valores = {}, tipos = {};
    for (const c of CATEGORIAS) {
      const v = x.valores?.[c.id];
      if (Number.isInteger(v) && v >= 0 && v <= 1e11) valores[c.id] = v;
    }
    for (const t of TIPOS_GASTO) {
      const v = x.tipos?.[t.id];
      if (Number.isInteger(v) && v > 0 && v <= 100) tipos[t.id] = v;
    }
    return {
      id: String(x.id || novoId()).slice(0, 80), nome, base: x.base === 'media3' ? 'media3' : 'mes',
      valores, tipos, criadoEm: Number(x.criadoEm) || Date.now(),
    };
  }

  return {
    LIMITES_PLANO, novoPlano, totaisPlano, limparPlano, csvPlano,
    CARTOES_SUGERIDOS, mesmoCartao, painel, detalhesCategoria, periodoAnterior, variacao,
    TIPOS_GASTO, TIPO, sugerirTipoGasto, gastos,
    MAX_COMPRAS, limparCompras, somaCompras, partesGasto, comprasFixasAnteriores, lerComprasDoTexto,
    PERIODOS, PERIODO, PLANOS_ASSINATURA, PLANO_ASSINATURA, PRECOS_PADRAO, limparPrecos, precoPeriodo, opcoesAssinatura,
    MAX_CENARIOS, PCTS_TIPO, baseSimulacao, simular, impactoMetas, limparCenario,
    MAX_PROVISOES, gerarProvisoes, limparProvisao, consumoProvisoes, reservadoProvisoes,
    VERSAO_DADOS, CATEGORIAS, CAT, MESES, MESES_CURTOS,
    lerValor, moeda, moedaCurta, valorParaCampo, dividir,
    diasNoMes, somarMeses, chaveMes, dataDe, isoDe, lerIso, situacao,
    MAX_OBS, novoId, gerar, titulo, alvos, editar, excluir,
    resumoMes, resumoAno, normalizar, limpar, migrarAntigo, lerBackup, csv,
  };
});
