const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../public/js/nucleo-empresa.js');

let seq = 0;
const gid = () => `id${++seq}`;
function cenario() {
  seq = 0;
  const est = E.estruturaPadrao(gid);
  const conta = (nome) => est.contas.find((c) => c.nome === nome).id;
  const [adm, com] = est.centros.map((c) => c.id);
  return { est, conta, adm, com };
}

test('estrutura padrão é válida e a validação recusa dados ruins', () => {
  const { est } = cenario();
  assert.equal(est.contas.length, 12);
  assert.deepEqual(E.limparEstrutura(est), est);
  assert.equal(E.limparEstrutura({ ...est, contas: [...est.contas, { id: est.contas[0].id, nome: 'Dup', grupo: 'receita' }] }), null);
  assert.equal(E.limparEstrutura({ ...est, contas: [{ id: 'x', nome: 'X', grupo: 'nada' }] }), null);
  assert.equal(E.limparEstrutura({ ...est, centros: [{ id: 'c', nome: '  ' }] }), null);
  assert.equal(E.limparEstrutura({ ...est, saldoInicial: 1.5 }), null);
});

test('lançamentos: validação, série mensal e parcelada, tipo pela conta', () => {
  const { est, conta, adm } = cenario();
  const base = { desc: 'Aluguel', centavos: 180000, conta: conta('Aluguel e condomínio'), centro: adm, ano: 2026, mes: 10, dia: 31 };
  assert.ok(E.limparLancamento(base, est));
  assert.equal(E.limparLancamento({ ...base, conta: 'nada' }, est), null);
  assert.equal(E.limparLancamento({ ...base, centro: 'nada' }, est), null);
  assert.equal(E.limparLancamento({ ...base, centavos: 0 }, est), null);
  const mensal = E.gerarLancamentos({ ...base, recorrencia: 'mensal', quantidade: 3 }, gid);
  assert.deepEqual(mensal.map((l) => [l.ano, l.mes, l.dia]), [[2026, 10, 30], [2026, 11, 31], [2027, 0, 31]]);
  assert.ok(mensal.every((l) => l.grupo === mensal[0].grupo && l.grupo));
  const parc = E.gerarLancamentos({ ...base, centavos: 100000, recorrencia: 'parcelada', quantidade: 3 }, gid);
  assert.deepEqual(parc.map((l) => l.centavos), [33333, 33333, 33334]);
  assert.deepEqual(parc[2].parcela, { n: 3, de: 3 });
  assert.equal(E.tipoDe(base, est), 'pagar');
  assert.equal(E.tipoDe({ conta: conta('Prestação de serviços') }, est), 'receber');
});

test('papéis e permissões', () => {
  assert.ok(E.pode('dono', 'aprovar'));
  assert.ok(!E.pode('financeiro', 'aprovar'));
  assert.ok(E.pode('gestor', 'lancar'));
  assert.ok(!E.pode('gestor', 'orcamento'));
  assert.ok(!E.pode('leitura', 'lancar'));
  assert.equal(E.PAPEL.leitura.pago, false);
  assert.deepEqual(E.mesesDoPeriodo(4, 'trimestre'), [3, 4, 5]);
  assert.deepEqual(E.mesesDoPeriodo(2, 'ano'), [0, 1, 2]);
});

test('orçamento: validação, soma por centro e reajuste', () => {
  const { est, conta, adm, com } = cenario();
  const mk = conta('Marketing e vendas');
  const v = E.limparValoresOrcamento({ [mk]: { _: Array(12).fill(1000), [com]: Array(12).fill(500), [adm]: Array(12).fill(0) } }, est);
  assert.deepEqual(Object.keys(v[mk]).sort(), ['_', com].sort());
  assert.equal(E.limparValoresOrcamento({ [mk]: { nada: Array(12).fill(1) } }, est), null);
  assert.equal(E.limparValoresOrcamento({ [mk]: { _: [1, 2] } }, est), null);
  assert.equal(E.orcadoConta(v, mk, [0, 1]), 3000);
  assert.equal(E.orcadoConta(v, mk, [0, 1], [com]), 1000);
  assert.equal(E.reajustar(v, 10)[mk]._[0], 1100);
});

test('orçado × realizado, DRE e fluxo de caixa', () => {
  const { est, conta, adm, com } = cenario();
  const rec = conta('Prestação de serviços'), imp = conta('Impostos sobre vendas'), mk = conta('Marketing e vendas'), alu = conta('Aluguel e condomínio'), tar = conta('Tarifas bancárias e juros');
  const valores = {
    [rec]: { _: Array(12).fill(1000000) }, [imp]: { _: Array(12).fill(50000) },
    [mk]: { [com]: Array(12).fill(100000) }, [alu]: { [adm]: Array(12).fill(200000) },
  };
  const L = (desc, conta, centavos, mes, centro = null, pago = true) => ({ id: gid(), desc, conta, centavos, ano: 2026, mes, dia: 10, centro, pago });
  const lanc = [
    L('Serviço', rec, 950000, 9), L('Imposto', imp, 50000, 9), L('Ads', mk, 155000, 9, com), L('Aluguel', alu, 200000, 9, adm),
    L('Tarifa', tar, 3000, 9), L('Serviço set', rec, 1000000, 8), L('Aluguel set', alu, 200000, 8, adm), L('Serviço nov', rec, 500000, 10, null, false),
  ];
  const r = E.orcadoRealizado({ estrutura: est, lancamentos: lanc, valores, ano: 2026, meses: [9] });
  assert.equal(r.receitas.realizado, 950000);
  assert.equal(r.receitas.farol, 'at');
  const mkt = r.grupos.find((g) => g.id === 'despesa').contas.find((c) => c.id === mk);
  assert.equal(mkt.pct, 55);
  assert.equal(mkt.farol, 'es');
  assert.equal(r.estouradas.length, 2); // marketing e tarifas (sem orçamento)
  assert.equal(r.resultado.orcado, 1000000 - 50000 - 300000);
  assert.equal(r.resultado.realizado, 950000 - 50000 - 155000 - 200000 - 3000);
  assert.equal(r.desvios[0].id, mk);
  const soCom = E.orcadoRealizado({ estrutura: est, lancamentos: lanc, valores, ano: 2026, meses: [9], centros: [com] });
  assert.equal(soCom.receitas.realizado, 0);
  assert.equal(soCom.despesas.orcado, 100000);
  const serie = E.despesasNoAno({ estrutura: est, lancamentos: lanc, valores, ano: 2026 });
  assert.equal(serie[9].realizado, 50000 + 155000 + 200000 + 3000);
  assert.equal(serie[0].orcado, 350000);

  const d = E.dre({ estrutura: est, lancamentos: lanc, valores, ano: 2026, meses: [9] });
  const linha = (id) => d.linhas.find((l) => l.id === id);
  assert.equal(linha('liquida').real, 900000);
  assert.equal(linha('deducao').real, -50000);
  assert.equal(linha('final').real, 950000 - 50000 - 155000 - 200000 - 3000);
  assert.equal(linha('receita').acum, 1950000);
  assert.equal(linha('receita').pct, 100);
  assert.equal(linha('final').orc, 1000000 - 50000 - 300000);

  const f = E.fluxoCaixa({ estrutura: { ...est, saldoInicial: 100000 }, lancamentos: lanc, ano: 2026 });
  assert.equal(f.inicial, 100000);
  assert.equal(f.meses[8].saldo, 100000 + 800000);
  assert.equal(f.meses[10].entradas, 500000);
  assert.equal(f.meses[10].entradasRealizadas, 0);
  assert.equal(f.final, 100000 + 800000 + 542000 + 500000);
  assert.deepEqual(f.negativos, []);

  const p = E.painel({ estrutura: est, lancamentos: lanc, ano: 2026, mes: 10, hoje: new Date(2026, 10, 5) });
  assert.equal(p.receber, 500000);
  assert.equal(p.proximos.length, 1);
  assert.match(E.csv([['Conta', 'Valor'], ['Ads "Google"', 155000]]), /"Ads ""Google""";1550,00/);
});
