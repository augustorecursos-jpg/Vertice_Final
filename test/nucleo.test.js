const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../public/js/nucleo.js');

let seq = 0;
const ids = () => `id${++seq}`;

test('lerValor entende o formato brasileiro', () => {
  assert.equal(N.lerValor('1.500,50'), 150050);
  assert.equal(N.lerValor('R$ 1.500'), 150000);
  assert.equal(N.lerValor('1500,5'), 150050);
  assert.equal(N.lerValor('1500.50'), 150050);
  assert.equal(N.lerValor('12.345.678'), 1234567800);
  assert.equal(N.lerValor('0,1'), 10);
  assert.ok(Number.isNaN(N.lerValor('')));
  assert.ok(Number.isNaN(N.lerValor('abc')));
  assert.ok(Number.isNaN(N.lerValor('1.2.3,4,5')));
});

test('dividir fecha o total exato', () => {
  assert.deepEqual(N.dividir(10000, 3), [3333, 3333, 3334]);
  assert.equal(N.dividir(99999, 7).reduce((a, b) => a + b), 99999);
});

test('parcelamento atravessa o ano e soma o total', () => {
  const ls = N.gerar({ desc: 'Notebook', centavos: 10000, categoria: 'variavel', ano: 2026, mes: 10, dia: 31, recorrencia: 'parcelada', quantidade: 3, modoValor: 'total' }, ids);
  assert.equal(ls.length, 3);
  assert.deepEqual(ls.map((l) => [l.ano, l.mes]), [[2026, 10], [2026, 11], [2027, 0]]);
  assert.equal(ls.reduce((a, l) => a + l.centavos, 0), 10000);
  assert.deepEqual(ls.map((l) => l.parcela.n), [1, 2, 3]);
  assert.ok(ls.every((l) => l.grupo === ls[0].grupo));
  assert.equal(N.titulo(ls[1]), 'Notebook · 2/3');
});

test('parcelamento com valor por parcela repete o valor', () => {
  const ls = N.gerar({ desc: 'X', centavos: 5000, categoria: 'fixa', ano: 2026, mes: 0, dia: 5, recorrencia: 'parcelada', quantidade: 4, modoValor: 'parcela' }, ids);
  assert.deepEqual(ls.map((l) => l.centavos), [5000, 5000, 5000, 5000]);
});

test('recorrência mensal não para em dezembro', () => {
  const ls = N.gerar({ desc: 'Aluguel', centavos: 200000, categoria: 'fixa', ano: 2026, mes: 10, dia: 10, recorrencia: 'mensal', quantidade: 12 }, ids);
  assert.equal(ls.length, 12);
  assert.deepEqual([ls[11].ano, ls[11].mes], [2027, 9]);
  assert.equal(ls[0].parcela, null);
});

test('dia 31 em fevereiro vira o último dia do mês', () => {
  const [l] = N.gerar({ desc: 'a', centavos: 1, categoria: 'fixa', ano: 2027, mes: 1, dia: 31 }, ids);
  assert.equal(N.dataDe(l).getDate(), 28);
  assert.equal(N.isoDe(l), '2027-02-28');
});

test('editar e excluir respeitam o escopo da série', () => {
  const ls = N.gerar({ desc: 'Academia', centavos: 10000, categoria: 'fixa', ano: 2026, mes: 0, dia: 5, recorrencia: 'mensal', quantidade: 6 }, ids);
  const terceiro = ls[2];
  const d = { desc: 'Academia nova', centavos: 12000, categoria: 'fixa', dia: 7, ano: 2026, mes: 2 };
  const ed = N.editar(ls, terceiro.id, d, 'proximos');
  assert.deepEqual(ed.map((l) => l.centavos), [10000, 10000, 12000, 12000, 12000, 12000]);
  assert.deepEqual(ed.map((l) => l.mes), [0, 1, 2, 3, 4, 5]);

  const so = N.editar(ls, terceiro.id, { ...d, mes: 8 }, 'este');
  const mudado = so.find((l) => l.id === terceiro.id);
  assert.equal(mudado.mes, 8);
  assert.equal(mudado.grupo, null);

  const { lista, removidos } = N.excluir(ls, terceiro.id, 'proximos');
  assert.equal(lista.length, 2);
  assert.equal(removidos.length, 4);
  assert.equal(N.excluir(ls, terceiro.id, 'todos').lista.length, 0);
});

test('resumo do mês separa receitas, despesas e reservas', () => {
  const base = { ano: 2026, mes: 3, dia: 1, grupo: null, parcela: null };
  const ls = [
    { ...base, id: 'a', categoria: 'receita', centavos: 500000, pago: true },
    { ...base, id: 'b', categoria: 'fixa', centavos: 200000, pago: true },
    { ...base, id: 'c', categoria: 'variavel', centavos: 50000, pago: false },
    { ...base, id: 'd', categoria: 'investimento', centavos: 100000, pago: false },
    { ...base, id: 'e', categoria: 'fixa', centavos: 999, pago: false, mes: 4 },
  ];
  const r = N.resumoMes(ls, 2026, 3);
  assert.equal(r.entradas, 500000);
  assert.equal(r.saidas, 250000);
  assert.equal(r.faltaPagar, 50000);
  assert.equal(r.reservas, 100000);
  assert.equal(r.saldoPrevisto, 150000);
  assert.equal(r.saldoRealizado, 300000);
  assert.equal(r.pctPago, 80);
});

test('resumo anual soma por categoria e acumula o saldo', () => {
  const ls = [
    ...N.gerar({ desc: 'Salário', centavos: 100000, categoria: 'receita', ano: 2026, mes: 0, dia: 5, recorrencia: 'mensal', quantidade: 12 }, ids),
    ...N.gerar({ desc: 'Aluguel', centavos: 60000, categoria: 'fixa', ano: 2026, mes: 0, dia: 10, recorrencia: 'mensal', quantidade: 12 }, ids),
  ];
  const a = N.resumoAno(ls, 2026);
  assert.equal(a.cats.find((c) => c.id === 'receita').total, 1200000);
  assert.equal(a.acumulado[11], 480000);
  assert.equal(a.total, 480000);
  assert.equal(a.cats.find((c) => c.id === 'fixa').detalhes[0].desc, 'Aluguel');
});

test('situação de vencimento', () => {
  const hoje = new Date(2026, 9, 6, 15, 0);
  const l = (dia, pago = false) => ({ ano: 2026, mes: 9, dia, pago });
  assert.equal(N.situacao(l(5), hoje).cod, 'atrasado');
  assert.equal(N.situacao(l(6), hoje).cod, 'hoje');
  assert.equal(N.situacao(l(8), hoje).cod, 'breve');
  assert.equal(N.situacao(l(20), hoje).cod, 'pendente');
  assert.equal(N.situacao(l(1, true), hoje).cod, 'pago');
});

test('migra dados do Vértice antigo, agrupando parcelas', () => {
  const antigo = [
    { id: 1700000000001, desc: 'TV [1/2]', val: 50.5, category: 'Despesa Variável', paid: true, month: 10, year: 2026 },
    { id: 1700000000002, desc: 'TV [2/2]', val: 50.5, category: 'Despesa Variável', paid: false, month: 11, year: 2026 },
    { id: 1700000000500, desc: 'Salário', val: 3000, category: 'Renda', paid: false, month: 10, year: 2026 },
    { id: 1, desc: 'inválido', val: 'x', category: 'Renda', month: 1, year: 2026 },
  ];
  const { lancamentos, origem } = N.lerBackup(antigo);
  assert.equal(origem, 'antigo');
  assert.equal(lancamentos.length, 3);
  const tv = lancamentos.filter((l) => l.desc === 'TV');
  assert.equal(tv.length, 2);
  assert.equal(tv[0].grupo, tv[1].grupo);
  assert.equal(tv[0].centavos, 5050);
  assert.equal(lancamentos.find((l) => l.desc === 'Salário').categoria, 'receita');
});

test('backup novo descarta registros inválidos', () => {
  const { lancamentos } = N.lerBackup({ versao: 1, lancamentos: [
    { id: 'a', desc: 'ok', categoria: 'fixa', centavos: 100, ano: 2026, mes: 0, dia: 3 },
    { id: 'b', desc: 'ruim', categoria: 'nao-existe', centavos: 100, ano: 2026, mes: 0, dia: 3 },
    { id: 'c', desc: 'ruim', categoria: 'fixa', centavos: 1.5, ano: 2026, mes: 0, dia: 3 },
  ] });
  assert.deepEqual(lancamentos.map((l) => l.id), ['a']);
  assert.throws(() => N.lerBackup({ foo: 1 }));
});

test('CSV usa ponto e vírgula e vírgula decimal', () => {
  const ls = N.gerar({ desc: 'Conta "luz"', centavos: 12345, categoria: 'fixa', ano: 2026, mes: 0, dia: 9 }, ids);
  const linhas = N.csv(ls, 2026).split('\r\n');
  assert.equal(linhas[1], '09/01/2026;"Conta ""luz""";"Despesa fixa";123,45;A pagar;""');
  const [comObs] = N.gerar({ desc: 'Luz', obs: 'Pago via Pix; ver "boleto"', centavos: 100, categoria: 'fixa', ano: 2026, mes: 0, dia: 9 }, ids);
  assert.ok(N.csv([comObs], 2026).endsWith(';"Pago via Pix; ver ""boleto"""'));
});

test('observações são gravadas, editadas na série e limitadas', () => {
  const ls = N.gerar({ desc: 'Academia', obs: '  Plano anual  ', centavos: 10000, categoria: 'fixa', ano: 2026, mes: 0, dia: 5, recorrencia: 'mensal', quantidade: 3 }, ids);
  assert.ok(ls.every((l) => l.obs === 'Plano anual'));
  const d = { desc: 'Academia', centavos: 10000, categoria: 'fixa', dia: 5, ano: 2026, mes: 1 };
  const ed = N.editar(ls, ls[1].id, { ...d, obs: 'Mudou de unidade' }, 'proximos');
  assert.deepEqual(ed.map((l) => l.obs), ['Plano anual', 'Mudou de unidade', 'Mudou de unidade']);
  assert.equal(N.editar(ls, ls[0].id, d, 'este')[0].obs, 'Plano anual');
  assert.equal(N.limpar({ ...ls[0], obs: 'x'.repeat(5000) }).obs.length, N.MAX_OBS);
  assert.equal(N.limpar({ ...ls[0], obs: undefined }).obs, '');
});
