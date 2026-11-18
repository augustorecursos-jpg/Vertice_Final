// Testes do calendário de vencimentos (grade, resumo e HTML).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/js/calendario');

const item = (iso, centavos, extra = {}) => ({ id: iso + centavos, iso, desc: `Conta ${centavos}`, centavos, pago: false, sit: { cod: 'pendente', dias: 5 }, entrada: false, sub: '', podeMarcar: true, podeEditar: true, ...extra });

test('grade do mês começa no domingo e fecha semanas inteiras', () => {
  const nov = C.gradeMes(2026, 10); // novembro de 2026 começa num domingo
  assert.equal(nov.length, 35);
  assert.equal(nov[0].iso, '2026-11-01');
  assert.equal(nov.filter((d) => !d.fora).length, 30);
  assert.deepEqual(nov.slice(-5).map((d) => d.iso), ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
  const fev = C.gradeMes(2026, 1); // fevereiro de 2026: domingo a sábado, 4 semanas exatas
  assert.equal(fev.length, 28);
  const ago = C.gradeMes(2026, 7); // agosto de 2026 começa num sábado: 6 semanas
  assert.equal(ago.length, 42);
  assert.equal(ago[0].iso, '2026-07-26');
  assert.ok(ago[0].fora && ago[6].iso === '2026-08-01' && !ago[6].fora);
});

test('semana cruza a virada do mês', () => {
  assert.deepEqual(C.semanaDe('2026-12-02').map((d) => d.iso), ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
});

test('resumo separa hoje, próximos 7 dias, atrasadas e o que falta no mês', () => {
  const hoje = new Date(2026, 10, 18);
  const itens = [
    item('2026-11-18', 1000),
    item('2026-11-18', 5000, { entrada: true }),
    item('2026-11-25', 2000),
    item('2026-11-26', 7000), // fora dos 7 dias
    item('2026-11-10', 3000, { sit: { cod: 'atrasado', dias: -8 } }),
    item('2026-10-05', 4000, { sit: { cod: 'atrasado', dias: -44 } }),
    item('2026-11-20', 9000, { pago: true, sit: { cod: 'pago', dias: 0 } }),
  ];
  const r = C.resumo(itens, 2026, 10, hoje);
  assert.deepEqual(r.hoje, { n: 1, v: 1000 });
  assert.deepEqual(r.hojeTodos, { n: 2, v: 6000 });
  assert.deepEqual(r.prox7, { n: 2, v: 3000 });
  assert.deepEqual(r.atrasadas, { n: 2, v: 7000 });
  assert.deepEqual(r.pagarMes, { n: 4, v: 13000 });
  assert.deepEqual(r.receberMes, { n: 1, v: 5000 });
});

test('dia aberto: o escolhido, hoje ou o primeiro com contas', () => {
  const hoje = new Date(2026, 10, 18);
  assert.equal(C.diaPadrao('2026-11-03', [], 2026, 10, hoje), '2026-11-03');
  assert.equal(C.diaPadrao('2026-10-03', [], 2026, 10, hoje), '2026-11-18');
  assert.equal(C.diaPadrao(null, [item('2026-12-20', 1), item('2026-12-07', 1)], 2026, 11, hoje), '2026-12-07');
  assert.equal(C.diaPadrao(null, [], 2027, 0, hoje), '2027-01-01');
});

test('HTML: limita contas por dia, escapa textos e destaca hoje, atrasado e pago', () => {
  const hoje = new Date(2026, 10, 18);
  const itens = [1, 2, 3, 4, 5].map((n) => item('2026-11-10', n * 100))
    .concat(item('2026-11-18', 700, { desc: '<script>x</script>', sit: { cod: 'atrasado', dias: -1 } }))
    .concat(item('2026-11-20', 800, { pago: true, sit: { cod: 'pago', dias: 0 }, podeMarcar: false }));
  const h = C.montar({ ano: 2026, mes: 10, hoje, itens, vista: 'mes', filtro: 'todos', dia: '2026-11-10', titulo: 'Calendário', podeLancar: true });
  assert.match(h, /\+ 2 contas/);
  assert.ok(!h.includes('<script>x'));
  assert.match(h, /&lt;script&gt;x/);
  assert.match(h, /class="cal-dia [^"]*hoje[^"]*tem-atraso/);
  assert.match(h, /chip-c pago/);
  assert.match(h, /data-cal-novo="2026-11-10"/);
  // o painel do dia 10 lista as 5 contas com o botão de marcar
  const painel = h.slice(h.indexOf('cal-painel'));
  assert.equal((painel.match(/data-cal-marcar=/g) || []).length, 5);
  // sem permissão: nada de lançar nem marcar
  const leitura = C.montar({ ano: 2026, mes: 10, hoje, itens: itens.map((i) => ({ ...i, podeMarcar: false, podeEditar: false })), vista: 'mes', dia: '2026-11-10', titulo: 'x', podeLancar: false });
  assert.ok(!/data-cal-(marcar|novo|editar)=/.test(leitura));
});

test('HTML: semana e lista', () => {
  const hoje = new Date(2026, 10, 18);
  const itens = [item('2026-11-30', 100), item('2026-12-01', 200), item('2026-11-02', 300)];
  const s = C.montar({ ano: 2026, mes: 10, hoje, itens, vista: 'semana', dia: '2026-11-30', titulo: 'x' });
  assert.equal((s.match(/class="cal-dia[ "]/g) || []).length, 7);
  assert.match(s, /R\$\s?2/); // conta de 1º de dezembro aparece na semana
  const l = C.montar({ ano: 2026, mes: 10, hoje, itens, vista: 'lista', titulo: 'x' });
  assert.equal((l.match(/cal-lista-dia/g) || []).length, 2); // só os dias de novembro com contas
  assert.ok(l.indexOf('2 de novembro') < l.indexOf('30 de novembro'));
});
