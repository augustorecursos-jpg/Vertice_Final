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
    { id: 'investimento', nome: 'Investimento', tipo: 'reserva', feito: 'Aplicado', pendente: 'A aplicar' },
    { id: 'poupanca', nome: 'Poupança', tipo: 'reserva', feito: 'Guardado', pendente: 'A guardar' },
  ];
  const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

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
      desc: String(f.desc).trim(), obs: limparObs(f.obs), categoria: f.categoria, pago: false, criadoEm: Date.now(),
    };
    if (f.recorrencia === 'unica' || !f.recorrencia) {
      return [{ ...base, id: gerarId(), grupo: null, parcela: null, centavos: f.centavos, ano: f.ano, mes: f.mes, dia: f.dia }];
    }
    const n = Math.max(2, Math.min(120, Math.floor(f.quantidade) || 2));
    const grupo = gerarId();
    const valores = f.recorrencia === 'parcelada' && f.modoValor !== 'parcela'
      ? dividir(f.centavos, n)
      : Array(n).fill(f.centavos);
    return valores.map((centavos, i) => {
      const { ano, mes } = somarMeses(f.ano, f.mes, i);
      return {
        ...base, id: gerarId(), grupo, centavos, ano, mes, dia: f.dia,
        parcela: f.recorrencia === 'parcelada' ? { n: i + 1, total: n } : null,
      };
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
    const linhas = [['Vencimento', 'Descrição', 'Categoria', 'Valor', 'Situação', 'Observações'].join(';')];
    lista.filter((l) => ano == null || l.ano === ano)
      .sort((a, b) => dataDe(a) - dataDe(b))
      .forEach((l) => {
        const c = CAT[l.categoria];
        linhas.push([
          dataDe(l).toLocaleDateString('pt-BR'), q(titulo(l)), q(c.nome),
          (l.centavos / 100).toFixed(2).replace('.', ','), l.pago ? c.feito : c.pendente, q(l.obs || ''),
        ].join(';'));
      });
    return '﻿' + linhas.join('\r\n');
  }

  return {
    VERSAO_DADOS, CATEGORIAS, CAT, MESES, MESES_CURTOS,
    lerValor, moeda, moedaCurta, valorParaCampo, dividir,
    diasNoMes, somarMeses, chaveMes, dataDe, isoDe, lerIso, situacao,
    MAX_OBS, novoId, gerar, titulo, alvos, editar, excluir,
    resumoMes, resumoAno, normalizar, limpar, migrarAntigo, lerBackup, csv,
  };
});
