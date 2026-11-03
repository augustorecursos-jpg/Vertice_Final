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
  assert.equal(linhas[1], '09/01/2026;"Conta ""luz""";"Despesa fixa";"";123,45;A pagar;""');
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

test('planejamento: totais por coluna, por linha, total final e meta', () => {
  const p = N.novoPlano({ exemplo: true }, ids);
  const t = N.totaisPlano(p);
  const [c1, c2] = p.colunas;
  assert.equal(t.porColuna[c1.id], 5400000);
  assert.equal(t.porColuna[c2.id], 5400000);
  assert.equal(t.total, 10800000);
  assert.equal(t.porLinha[p.linhas[1].id], 6000000);
  assert.equal(t.pctMeta, 36);
  assert.equal(t.falta, 19200000);
  assert.equal(N.totaisPlano({ ...p, meta: null }).pctMeta, null);
});

test('planejamento: limpeza descarta valores inválidos e colunas desconhecidas', () => {
  const p = N.novoPlano({ exemplo: true }, ids);
  const sujo = { ...p, titulo: '  Viagem   2027 ', meta: -5, linhas: [{ id: 'l1', nome: 'X', valores: { [p.colunas[0].id]: 10.5, naoExiste: 100, [p.colunas[1].id]: 300 } }] };
  const l = N.limparPlano(sujo);
  assert.equal(l.titulo, 'Viagem 2027');
  assert.equal(l.meta, null);
  assert.deepEqual(l.linhas[0].valores, { [p.colunas[1].id]: 300 });
  assert.equal(N.limparPlano({ ...p, colunas: [p.colunas[0], p.colunas[0]] }), null);
  assert.equal(N.limparPlano({ titulo: 'x' }), null);
  assert.equal(N.limparPlano({ ...p, linhas: Array(101).fill({ nome: 'a', valores: {} }) }), null);
});

test('planejamento: CSV com totais', () => {
  const p = N.novoPlano({ exemplo: true }, ids);
  const linhas = N.csvPlano(p).replace('﻿', '').split('\r\n');
  assert.equal(linhas[0], '"Plano apartamento";"1º ano";"2º ano";Total');
  assert.equal(linhas[1], '"Poupança";18000,00;18000,00;36000,00');
  assert.equal(linhas[4], 'TOTAL;54000,00;54000,00;108000,00');
});

test('cartão de crédito é uma despesa', () => {
  assert.equal(N.CAT.cartao.tipo, 'saida');
  const base = { ano: 2026, mes: 9, dia: 1, grupo: null, parcela: null, pago: false };
  const r = N.resumoMes([{ ...base, id: 'a', categoria: 'cartao', centavos: 25000 }, { ...base, id: 'b', categoria: 'receita', centavos: 100000 }], 2026, 9);
  assert.equal(r.saidas, 25000);
  assert.equal(r.saldoPrevisto, 75000);
});

test('provisões: repetição mensal com o mesmo grupo', () => {
  const ps = N.gerarProvisoes({ nome: 'Mercado', centavos: 120000, categoria: 'variavel', ano: 2026, mes: 10, repetir: true, quantidade: 3 }, ids);
  assert.equal(ps.length, 3);
  assert.deepEqual(ps.map((p) => [p.ano, p.mes]), [[2026, 10], [2026, 11], [2027, 0]]);
  assert.ok(ps.every((p) => p.grupo === ps[0].grupo));
  assert.equal(ps[0].id, ps[0].grupo);
  assert.equal(N.gerarProvisoes({ nome: 'X', centavos: 1, categoria: 'receita', ano: 2026, mes: 0, auto: true }, ids)[0].categoria, null);
});

test('provisões: consumo por vínculo, parcelas por mês, automático por categoria e estouro', () => {
  const compras = N.gerarProvisoes({ nome: 'Compras parceladas', centavos: 80000, ano: 2026, mes: 9, repetir: true, quantidade: 2 }, ids);
  const provs = [
    ...compras,
    ...N.gerarProvisoes({ nome: 'Cartão', centavos: 50000, categoria: 'cartao', auto: true, ano: 2026, mes: 9 }, ids),
  ];
  const grupoCompras = compras[0].grupo;
  const tv = N.gerar({ desc: 'TV', centavos: 300000, categoria: 'cartao', ano: 2026, mes: 9, dia: 10, recorrencia: 'parcelada', quantidade: 6, provisao: grupoCompras }, ids);
  const avulsos = [
    ...N.gerar({ desc: 'Restaurante', centavos: 30000, categoria: 'cartao', ano: 2026, mes: 9, dia: 3 }, ids),
    ...N.gerar({ desc: 'App', centavos: 25000, categoria: 'cartao', ano: 2026, mes: 9, dia: 4 }, ids),
    ...N.gerar({ desc: 'Luz', centavos: 9999, categoria: 'variavel', ano: 2026, mes: 9, dia: 5 }, ids),
  ];
  avulsos[0].pago = true;
  const c = N.consumoProvisoes([...tv, ...avulsos], provs, 2026, 9);
  const porNome = Object.fromEntries(c.map((x) => [x.provisao.nome, x]));
  // A parcela da TV (cartão) vai para "Compras parceladas" e não é contada de novo na provisão automática do cartão.
  assert.equal(porNome['Compras parceladas'].consumido, 50000);
  assert.equal(porNome['Compras parceladas'].restante, 30000);
  assert.equal(porNome['Cartão'].consumido, 55000);
  assert.equal(porNome['Cartão'].pago, 30000);
  assert.equal(porNome['Cartão'].excedente, 5000);
  assert.equal(porNome['Cartão'].pct, 110);
  assert.equal(N.reservadoProvisoes([...tv, ...avulsos], provs, 2026, 9), 30000);
  // No mês seguinte, a 2ª parcela consome a provisão daquele mês.
  assert.equal(N.consumoProvisoes(tv, provs, 2026, 10)[0].consumido, 50000);
});

test('provisões: limpeza e vínculo preservado nos lançamentos', () => {
  assert.equal(N.limparProvisao({ nome: '', centavos: 100, ano: 2026, mes: 0 }), null);
  assert.equal(N.limparProvisao({ nome: 'x', centavos: 0, ano: 2026, mes: 0 }), null);
  const p = N.limparProvisao({ id: 'p1', nome: ' Natal ', centavos: 150000, categoria: 'receita', auto: true, ano: 2026, mes: 11 });
  assert.deepEqual([p.nome, p.grupo, p.categoria, p.auto], ['Natal', 'p1', null, false]);
  const [l] = N.gerar({ desc: 'Presente', centavos: 100, categoria: 'variavel', ano: 2026, mes: 11, dia: 1, provisao: 'p1' }, ids);
  assert.equal(N.limpar(l).provisao, 'p1');
  assert.equal(N.editar([l], l.id, { desc: 'Presente', centavos: 100, categoria: 'variavel', dia: 1, ano: 2026, mes: 11 })[0].provisao, 'p1');
  assert.equal(N.editar([l], l.id, { desc: 'Presente', centavos: 100, categoria: 'variavel', dia: 1, ano: 2026, mes: 11, provisao: null })[0].provisao, null);
});

test('cartão: nome guardado só em lançamentos de cartão e mantido na série', () => {
  const ls = N.gerar({ desc: 'Celular', centavos: 120000, categoria: 'cartao', cartao: '  Nubank ', ano: 2026, mes: 9, dia: 10, recorrencia: 'parcelada', quantidade: 3 }, ids);
  assert.ok(ls.every((l) => l.cartao === 'Nubank'));
  assert.equal(N.gerar({ desc: 'Luz', centavos: 1, categoria: 'variavel', cartao: 'Nubank', ano: 2026, mes: 9, dia: 1 }, ids)[0].cartao, '');
  const d = { desc: 'Celular', centavos: 40000, categoria: 'cartao', dia: 10, ano: 2026, mes: 10 };
  assert.deepEqual(N.editar(ls, ls[1].id, { ...d, cartao: 'PicPay' }, 'proximos').map((l) => l.cartao), ['Nubank', 'PicPay', 'PicPay']);
  assert.equal(N.editar(ls, ls[0].id, d, 'este')[0].cartao, 'Nubank');
  assert.equal(N.editar(ls, ls[0].id, { ...d, categoria: 'variavel' }, 'este')[0].cartao, '');
  assert.equal(N.limpar({ ...ls[0], cartao: 'x'.repeat(90) }).cartao.length, 40);
  assert.ok(N.csv(ls, 2026).split('\r\n')[1].includes(';"Cartão de crédito";"Nubank";'));
  assert.ok(N.mesmoCartao('itau', ' Itaú '));
});

test('cartão: provisão automática por cartão conta só aquele cartão', () => {
  const nu = N.gerarProvisoes({ nome: 'Nubank', centavos: 100000, categoria: 'cartao', cartao: 'Nubank', auto: true, ano: 2026, mes: 9 }, ids);
  const pic = N.gerarProvisoes({ nome: 'PicPay', centavos: 50000, categoria: 'cartao', cartao: 'PicPay', auto: true, ano: 2026, mes: 9 }, ids);
  const geral = N.gerarProvisoes({ nome: 'Todos os cartões', centavos: 300000, categoria: 'cartao', auto: true, ano: 2026, mes: 9 }, ids);
  const g = (desc, cartao, centavos) => N.gerar({ desc, cartao, centavos, categoria: 'cartao', ano: 2026, mes: 9, dia: 5 }, ids)[0];
  const ls = [g('A', 'nubank', 30000), g('B', 'Nubank', 20000), g('C', 'PicPay', 15000), g('D', 'Inter', 7000), g('E', '', 1000)];
  const c = Object.fromEntries(N.consumoProvisoes(ls, [...nu, ...pic, ...geral], 2026, 9).map((x) => [x.provisao.nome, x.consumido]));
  assert.deepEqual(c, { Nubank: 50000, PicPay: 15000, 'Todos os cartões': 73000 });
  assert.equal(N.limparProvisao({ ...nu[0], categoria: 'variavel' }).cartao, '');
  assert.equal(N.limparProvisao(nu[0]).cartao, 'Nubank');
});

test('dashboard: totais por categoria, grupos, taxa de poupança e cartões', () => {
  const g = (f) => N.gerar({ ano: 2026, mes: 9, dia: 5, ...f }, ids)[0];
  const ls = [
    g({ desc: 'Salário', centavos: 1000000, categoria: 'receita' }),
    g({ desc: 'Aluguel', centavos: 300000, categoria: 'fixa' }),
    g({ desc: 'Mercado', centavos: 150000, categoria: 'variavel' }),
    g({ desc: 'Roupa', centavos: 50000, categoria: 'cartao', cartao: 'Nubank' }),
    g({ desc: 'Jantar', centavos: 20000, categoria: 'cartao', cartao: 'nubank' }),
    g({ desc: 'App', centavos: 5000, categoria: 'cartao' }),
    g({ desc: 'Tesouro', centavos: 100000, categoria: 'investimento' }),
    g({ desc: 'Reserva', centavos: 50000, categoria: 'poupanca' }),
    g({ desc: 'Outro mês', centavos: 999999, categoria: 'fixa', mes: 8 }),
  ];
  ls[1].pago = true;
  const p = N.painel(ls, 2026, 9);
  assert.equal(p.receitas, 1000000);
  assert.equal(p.despesas, 525000);
  assert.equal(p.reservas, 150000);
  assert.equal(p.saldo, 325000);
  assert.equal(p.taxaPoupanca, 15);
  assert.equal(p.comprometido, 53);
  assert.equal(p.porCategoria.cartao, 75000);
  assert.equal(p.qtdCategoria.cartao, 3);
  assert.equal(p.pagoDespesas, 300000);
  assert.equal(p.abertoDespesas, 225000);
  assert.deepEqual(p.cartoes.map((c) => [c.nome, c.total, c.qtd]), [['Nubank', 70000, 2], ['Sem cartão definido', 5000, 1]]);
  assert.deepEqual(p.maiores.map((l) => l.desc), ['Aluguel', 'Mercado', 'Roupa', 'Jantar', 'App']);
  const ano = N.painel(ls, 2026);
  assert.equal(ano.porCategoria.fixa, 1299999);
  assert.equal(N.painel([], 2026, 9).taxaPoupanca, null);
});

test('dashboard: período anterior e variação', () => {
  assert.deepEqual(N.periodoAnterior(2026, 0), { ano: 2025, mes: 11 });
  assert.deepEqual(N.periodoAnterior(2026, null), { ano: 2025, mes: null });
  assert.equal(N.variacao(120, 100), 20);
  assert.equal(N.variacao(80, 100), -20);
  assert.equal(N.variacao(50, 0), null);
});

test('dashboard: filtro de categorias e detalhe por descrição', () => {
  const g = (f) => N.gerar({ ano: 2026, mes: 9, dia: 5, ...f }, ids);
  const ls = [
    ...g({ desc: 'Salário', centavos: 500000, categoria: 'receita' }),
    ...g({ desc: 'Mercado', centavos: 40000, categoria: 'variavel' }),
    ...g({ desc: 'mercado', centavos: 10000, categoria: 'variavel', dia: 20 }),
    ...g({ desc: 'Luz', centavos: 20000, categoria: 'variavel' }),
    ...g({ desc: 'Notebook', centavos: 300000, categoria: 'cartao', cartao: 'Nubank', recorrencia: 'parcelada', quantidade: 3, mes: 8 }),
    ...g({ desc: 'Notebook', centavos: 50000, categoria: 'cartao', cartao: 'Itaú' }),
  ];
  ls[1].pago = true;
  const so = N.painel(ls, 2026, 9, { categorias: ['variavel', 'cartao'] });
  assert.equal(so.receitas, 0);
  assert.equal(so.despesas, 70000 + 100000 + 50000);
  assert.equal(so.taxaPoupanca, null);
  assert.equal(N.painel(ls, 2026, 9, { categorias: [] }).receitas, 500000);
  const det = N.detalhesCategoria(ls, 2026, 9, 'variavel');
  assert.deepEqual(det.map((d) => [d.desc, d.total, d.qtd, d.pago]), [['Mercado', 50000, 2, 40000], ['Luz', 20000, 1, 0]]);
  const notebook = N.detalhesCategoria(ls, 2026, null, 'cartao');
  assert.deepEqual(notebook.map((d) => [d.desc, d.total, d.qtd]), [['Notebook', 350000, 4]]);
  assert.deepEqual(notebook[0].cartoes, ['Nubank', 'Itaú']);
});

test('tipo de gasto: só em despesas, mantido na série e limpo nos demais', () => {
  const ls = N.gerar({ desc: 'Notebook', centavos: 300000, categoria: 'cartao', cartao: 'Nubank', tipoGasto: 'compras', ano: 2026, mes: 9, dia: 5, recorrencia: 'parcelada', quantidade: 3 }, ids);
  assert.ok(ls.every((l) => l.tipoGasto === 'compras'));
  assert.equal(N.gerar({ desc: 'Salário', centavos: 1, categoria: 'receita', tipoGasto: 'compras', ano: 2026, mes: 9, dia: 5 }, ids)[0].tipoGasto, null);
  assert.equal(N.gerar({ desc: 'X', centavos: 1, categoria: 'fixa', tipoGasto: 'inexistente', ano: 2026, mes: 9, dia: 5 }, ids)[0].tipoGasto, null);
  const d = { desc: 'Notebook', centavos: 100000, categoria: 'cartao', dia: 5, ano: 2026, mes: 10 };
  assert.deepEqual(N.editar(ls, ls[1].id, { ...d, tipoGasto: 'educacao' }, 'proximos').map((l) => l.tipoGasto), ['compras', 'educacao', 'educacao']);
  assert.equal(N.editar(ls, ls[0].id, d, 'este')[0].tipoGasto, 'compras');
  assert.equal(N.editar(ls, ls[0].id, { ...d, categoria: 'investimento' }, 'este')[0].tipoGasto, null);
  assert.equal(N.limpar({ ...ls[0], tipoGasto: 'pets' }).tipoGasto, 'pets');
  assert.equal(N.limpar({ ...ls[0], tipoGasto: 'xyz' }).tipoGasto, null);
});

test('tipo de gasto: sugestão aprende com o que a pessoa já usou', () => {
  assert.equal(N.sugerirTipoGasto('iFood'), 'alimentacao');
  assert.equal(N.sugerirTipoGasto('Mercado Livre'), 'compras');
  assert.equal(N.sugerirTipoGasto('Loja do Zé'), 'compras');
  assert.equal(N.sugerirTipoGasto('Xyz'), null);
  const antigos = N.gerar({ desc: 'Loja do Zé', centavos: 1, categoria: 'variavel', tipoGasto: 'pets', ano: 2026, mes: 1, dia: 1 }, ids);
  assert.equal(N.sugerirTipoGasto('loja do ze', antigos), 'pets');
});

test('onde estou gastando: totais por tipo, sem tipo, cartões, parcelas futuras, evolução e alertas', () => {
  const g = (f) => N.gerar({ ano: 2026, mes: 9, dia: 5, categoria: 'cartao', cartao: 'Nubank', ...f }, ids);
  const ls = [
    ...g({ desc: 'iFood', centavos: 30000, tipoGasto: 'alimentacao' }),
    ...g({ desc: 'iFood', centavos: 20000, tipoGasto: 'alimentacao', dia: 9 }),
    ...g({ desc: 'Restaurante', centavos: 15000, tipoGasto: 'alimentacao', cartao: 'Itaú' }),
    ...g({ desc: 'Netflix', centavos: 5590, tipoGasto: 'assinaturas' }),
    ...g({ desc: 'Spotify', centavos: 2190, tipoGasto: 'assinaturas' }),
    ...g({ desc: 'Geladeira', centavos: 360000, tipoGasto: 'compras', recorrencia: 'parcelada', quantidade: 6 }),
    ...g({ desc: 'Sem classificação', centavos: 4000, categoria: 'variavel', cartao: '' }),
    ...g({ desc: 'Salário', centavos: 900000, categoria: 'receita' }),
    ...g({ desc: 'iFood', centavos: 30000, tipoGasto: 'alimentacao', mes: 8 }),
  ];
  const r = N.gastos(ls, 2026, 9);
  assert.equal(r.total, 30000 + 20000 + 15000 + 5590 + 2190 + 60000 + 4000);
  assert.deepEqual(r.tipos.map((t) => [t.id, t.total]), [['alimentacao', 65000], ['compras', 60000], ['assinaturas', 7780]]);
  assert.deepEqual(r.tipos[0].descricoes.map((d) => [d.desc, d.qtd, d.total]), [['iFood', 2, 50000], ['Restaurante', 1, 15000]]);
  assert.deepEqual([r.semTipo.qtd, r.semTipo.total], [1, 4000]);
  assert.equal(r.maior.id, 'alimentacao');
  assert.deepEqual(r.cartoes.map((c) => [c.nome, c.total]), [['Nubank', 117780], ['Itaú', 15000]]);
  assert.equal(r.cartoes[0].porTipo.alimentacao, 50000);
  assert.equal(r.maioresDescricoes[0].desc, 'Geladeira');
  assert.equal(r.parcelas.proximoMes, 60000);
  assert.deepEqual(r.parcelas.ate, { ano: 2027, mes: 2 });
  assert.equal(r.evolucao.meses.length, 6);
  assert.deepEqual(r.evolucao.meses.at(-1), { ano: 2026, mes: 9, alvo: 65000, media: 33890 });
  const cods = r.alertas.map((a) => a.cod);
  assert.ok(cods.includes('subiu') && cods.includes('assinaturas') && cods.includes('parcelas'));
  assert.equal(r.alertas.find((a) => a.cod === 'subiu').pct, 117);
  const soCartao = N.gastos(ls, 2026, 9, { categorias: ['variavel'] });
  assert.deepEqual([soCartao.total, soCartao.tipos.length, soCartao.semTipo.qtd], [4000, 0, 1]);
  assert.equal(N.gastos(ls, 2026).evolucao, null);
});

test('simulador: base do mês ou média de 3 meses, cortes por tipo, projeção e metas', () => {
  const ls = [];
  for (const mes of [7, 8, 9]) {
    ls.push(...N.gerar({ desc: 'Salário', centavos: 600000, categoria: 'receita', ano: 2026, mes, dia: 5 }));
    ls.push(...N.gerar({ desc: 'Aluguel', centavos: 200000, categoria: 'fixa', ano: 2026, mes, dia: 5, tipoGasto: 'moradia' }));
    ls.push(...N.gerar({ desc: 'iFood', centavos: mes === 9 ? 90000 : 30000, categoria: 'cartao', cartao: 'Nubank', ano: 2026, mes, dia: 9, tipoGasto: 'alimentacao' }));
    ls.push(...N.gerar({ desc: 'Tesouro', centavos: 50000, categoria: 'investimento', ano: 2026, mes, dia: 25 }));
  }
  const b = N.baseSimulacao(ls, 2026, 9);
  assert.equal(b.valores.cartao, 90000);
  assert.equal(b.tipos[0].id, 'moradia');
  const m3 = N.baseSimulacao(ls, 2026, 9, 'media3');
  assert.equal(m3.valores.cartao, 50000);
  assert.deepEqual(m3.meses.map((m) => m.mes), [7, 8, 9]);

  const igual = N.simular(b);
  assert.deepEqual(igual.valores, b.valores);
  assert.equal(igual.hoje.saldo, 600000 - 200000 - 90000 - 50000);
  assert.equal(igual.hoje.guardado, 310000);

  const r = N.simular(b, { valores: { receita: 700000, investimento: 80000 }, tipos: { alimentacao: 50 } });
  assert.equal(r.valores.cartao, 45000);
  assert.equal(r.reducao.cartao, 45000);
  assert.equal(r.simulado.receitas, 700000);
  assert.equal(r.simulado.guardado, 700000 - 245000);
  assert.equal(r.simulado.taxa, Math.round((80000 / 700000) * 100));
  assert.equal(r.projecao.length, 12);
  assert.deepEqual([r.projecao[0].ano, r.projecao[0].mes], [2026, 10]);
  assert.equal(r.projecao[11].simulado, 455000 * 12);
  // valor manual nunca fica negativo depois do corte por tipo
  assert.equal(N.simular(b, { valores: { cartao: 10000 }, tipos: { alimentacao: 50 } }).valores.cartao, 0);

  const plano = N.novoPlano({ titulo: 'Viagem' });
  plano.meta = 1000000;
  plano.linhas[0].valores[plano.colunas[0].id] = 100000;
  const [meta] = N.impactoMetas([plano, N.novoPlano({ titulo: 'Sem meta' })], r, 2026, 9);
  assert.equal(meta.falta, 900000);
  assert.equal(meta.hoje.meses, Math.ceil(900000 / 310000));
  assert.equal(meta.simulado.meses, Math.ceil(900000 / 455000));
  assert.equal(meta.antes, 1);
  assert.deepEqual(meta.simulado.quando, { ano: 2026, mes: 11 });
  const neg = N.simular(b, { valores: { receita: 0 } });
  assert.equal(N.impactoMetas([plano], neg, 2026, 9)[0].simulado.meses, null);

  const c = N.limparCenario({ nome: '  Meu   cenário ', valores: { receita: 1.5, fixa: 100 }, tipos: { lazer: 0, saude: 30 } });
  assert.equal(c.nome, 'Meu cenário');
  assert.deepEqual(c.valores, { fixa: 100 });
  assert.deepEqual(c.tipos, { saude: 30 });
  assert.equal(c.base, 'mes');
  assert.equal(N.limparCenario({ nome: '' }), null);
});

test('planos por período: preços, descontos e opções da mensagem', () => {
  const P = N.PRECOS_PADRAO;
  assert.deepEqual(N.precoPeriodo(P, 'pf', 'semestral'), { total: 5994, porMes: 999, desconto: 17 });
  assert.equal(N.precoPeriodo(P, 'gestao', 'anual').desconto, 15);
  assert.equal(N.precoPeriodo(P, 'pf', 'mensal').desconto, 0);
  const txt = N.opcoesAssinatura(P, 'pf');
  const linhas = txt.split('\n');
  assert.equal(linhas.length, 4);
  assert.match(linhas[0], /^• Mensal: R\$\s11,99$/);
  assert.match(linhas[3], /Anual: R\$\s107,88 \(R\$\s8,99\/mês\) ← melhor preço/);
  assert.equal(txt.match(/melhor preço/g).length, 1);
  assert.equal(N.limparPrecos({ pf: { mensal: -1 } }), null);
  assert.equal(N.limparPrecos({ pf: { mensal: 1500 } }).pf.mensal, 1500);
  assert.equal(N.limparPrecos({}).grupo.anual, 601800);
  assert.deepEqual(N.PERIODOS.map((p) => p.dias), [30, 90, 180, 365]);
});

test('fatura do cartão com compras detalhadas: valor, tipos, resto não detalhado e fixas', () => {
  const compras = [
    { desc: 'Claude IA', centavos: 11000, tipoGasto: 'assinaturas', fixa: true },
    { desc: 'iFood', centavos: 8640, tipoGasto: 'alimentacao' },
    { desc: 'Posto', centavos: 22000, tipoGasto: null },
  ];
  // valor da fatura menor que a soma: vale a soma
  let [f] = N.gerar({ desc: 'Cartão PicPay', centavos: 100, categoria: 'cartao', cartao: 'PicPay', ano: 2026, mes: 9, dia: 30, compras });
  assert.equal(f.centavos, 41640);
  assert.equal(f.compras.length, 3);
  assert.equal(f.compras[0].fixa, true);
  // compras só em cartão
  assert.equal(N.gerar({ desc: 'Mercado', centavos: 100, categoria: 'variavel', ano: 2026, mes: 9, dia: 1, compras })[0].compras, undefined);
  // série mensal: meses seguintes levam só as fixas
  const serie = N.gerar({ desc: 'Cartão PicPay', centavos: 50000, categoria: 'cartao', cartao: 'PicPay', ano: 2026, mes: 9, dia: 30, compras, recorrencia: 'mensal', quantidade: 3 });
  assert.equal(serie[0].compras.length, 3);
  assert.deepEqual(serie[1].compras.map((c) => c.desc), ['Claude IA']);
  assert.notEqual(serie[1].compras[0].id, serie[0].compras[0].id);

  // fatura de R$ 500 com R$ 416,40 detalhado
  f = N.limpar({ ...f, id: 'f1', centavos: 50000 });
  const ls = [f, ...N.gerar({ desc: 'Netflix', centavos: 5590, categoria: 'cartao', cartao: 'Nubank', ano: 2026, mes: 9, dia: 5, tipoGasto: 'assinaturas' })];
  const g = N.gastos(ls, 2026, 9);
  assert.equal(g.total, 55590);
  assert.equal(g.qtd, 2);
  const assin = g.tipos.find((t) => t.id === 'assinaturas');
  assert.equal(assin.total, 11000 + 5590);
  assert.deepEqual(assin.descricoes.find((d) => d.desc === 'Claude IA').faturas, ['Cartão PicPay']);
  assert.equal(g.semTipo.total, 22000 + 8360); // Posto + não detalhado
  assert.deepEqual(g.semTipo.ids, []); // nada para classificar no lançamento inteiro
  const picpay = g.cartoes.find((c) => c.nome === 'PicPay');
  assert.equal(picpay.total, 50000);
  assert.equal(picpay.porTipo.alimentacao, 8640);
  assert.ok(g.maioresDescricoes.some((d) => d.desc === 'Cartão PicPay (não detalhado)'));
  // simulador enxerga as compras
  const b = N.baseSimulacao(ls, 2026, 9);
  assert.equal(b.tipos.find((t) => t.id === 'alimentacao').porCat.cartao, 8640);
  // sugestão aprende com as compras
  assert.equal(N.sugerirTipoGasto('posto', ls), 'transporte');
  assert.equal(N.sugerirTipoGasto('claude ia', ls), 'assinaturas');

  // editar: compras mudam só na fatura editada; tirar do cartão remove as compras
  let lista = N.editar(ls, 'f1', { desc: 'Cartão PicPay', centavos: 1000, categoria: 'cartao', cartao: 'PicPay', ano: 2026, mes: 9, dia: 30, compras: [{ desc: 'Uber', centavos: 3000, tipoGasto: 'transporte' }] });
  assert.equal(lista[0].centavos, 3000);
  assert.deepEqual(lista[0].compras.map((c) => c.desc), ['Uber']);
  lista = N.editar(lista, 'f1', { desc: 'X', centavos: 1000, categoria: 'variavel', ano: 2026, mes: 9, dia: 30 });
  assert.equal(lista[0].compras, undefined);
  // validação
  assert.deepEqual(N.limparCompras('cartao', [{ desc: '', centavos: 10 }, { desc: 'A', centavos: -1 }, { desc: 'B', centavos: 5, tipoGasto: 'xx' }]).map((c) => [c.desc, c.tipoGasto]), [['B', null]]);

  // fixas da fatura anterior do mesmo cartão
  const ant = N.comprasFixasAnteriores(ls, 'picpay', 2026, 10);
  assert.deepEqual(ant.compras.map((c) => c.desc), ['Claude IA']);
  assert.deepEqual(ant.de, { ano: 2026, mes: 9 });
  assert.equal(N.comprasFixasAnteriores(ls, 'Nubank', 2026, 10).compras.length, 0);
  assert.equal(N.comprasFixasAnteriores(ls, 'PicPay', 2026, 9).compras.length, 0);

  // ler compras das observações
  const t = N.lerComprasDoTexto('Fixos:\nR$ 179,26 - Espaço Laser\nR$ 110,00 - Claude IA\n\nVariáveis:\niFood - R$ 86,40\nFatura fecha dia 20.');
  assert.deepEqual(t.compras, [
    { desc: 'Espaço Laser', centavos: 17926, fixa: true }, { desc: 'Claude IA', centavos: 11000, fixa: true }, { desc: 'iFood', centavos: 8640, fixa: false },
  ]);
  assert.equal(t.sobra, 'Fatura fecha dia 20.');
});

test('tipos de gasto próprios: criar, validar, usar na análise e no simulador', () => {
  const r1 = N.novoTipoGasto('  Viagem de trabalho ', []);
  assert.deepEqual(r1, { tipo: { id: 'u:viagem-de-trabalho', nome: 'Viagem de trabalho', emoji: '🏷️', proprio: true }, novo: true });
  assert.equal(N.novoTipoGasto('viagem', []).tipo.id, 'viagem'); // reaproveita o tipo que já existe
  assert.equal(N.novoTipoGasto('SAÚDE', []).novo, false);
  assert.equal(N.novoTipoGasto('Viagem de Trabalho', [r1.tipo]).novo, false);
  assert.equal(N.novoTipoGasto('Viagem-de trabalho!', [{ id: 'u:viagem-de-trabalho', nome: 'Outro nome' }]).tipo.id, 'u:viagem-de-trabalho-2');
  assert.equal(N.novoTipoGasto('  ', []), null);
  assert.deepEqual(N.limparTiposGasto([{ id: 'u:a', nome: 'A' }, { id: 'u:a', nome: 'Dup' }, { id: 'x', nome: 'Inválido' }, { id: 'u:b', nome: '' }]).map((t) => t.id), ['u:a']);

  const ls = N.gerar({ desc: 'Hotel congresso', centavos: 90000, categoria: 'variavel', ano: 2026, mes: 9, dia: 3, tipoGasto: 'u:viagem-de-trabalho' });
  ls.push(...N.gerar({ desc: 'Fatura', centavos: 5000, categoria: 'cartao', cartao: 'Nubank', ano: 2026, mes: 9, dia: 3, compras: [{ desc: 'Uber aeroporto', centavos: 5000, tipoGasto: 'u:viagem-de-trabalho' }] }));
  assert.equal(ls[0].tipoGasto, 'u:viagem-de-trabalho');
  assert.equal(N.limpar(ls[1]).compras[0].tipoGasto, 'u:viagem-de-trabalho');
  assert.equal(N.limpar({ ...ls[0], tipoGasto: 'u:ruim!' }).tipoGasto, null);
  // sem registrar: nome legível a partir do id
  let g = N.gastos(ls, 2026, 9);
  assert.equal(g.tipos[0].nome, 'Viagem de trabalho');
  assert.equal(g.tipos[0].total, 95000);
  // registrado: usa o nome que a pessoa digitou
  N.definirTiposProprios([{ id: 'u:viagem-de-trabalho', nome: 'Viagens a trabalho' }]);
  g = N.gastos(ls, 2026, 9);
  assert.equal(g.tipos[0].nome, 'Viagens a trabalho');
  assert.equal(N.todosTipos().length, 13);
  assert.equal(N.sugerirTipoGasto('hotel congresso', ls), 'u:viagem-de-trabalho');
  const b = N.baseSimulacao(ls, 2026, 9);
  assert.equal(b.tipos[0].id, 'u:viagem-de-trabalho');
  const res = N.simular(b, { tipos: { 'u:viagem-de-trabalho': 50 } });
  assert.equal(res.reducao.variavel, 45000);
  assert.deepEqual(N.limparCenario({ nome: 'X', tipos: { 'u:viagem-de-trabalho': 50, 'u:x!': 10 } }).tipos, { 'u:viagem-de-trabalho': 50 });
  N.definirTiposProprios([]);
  assert.equal(N.todosTipos().length, 12);
  assert.equal(N.TIPO['u:viagem-de-trabalho'], undefined);
});
