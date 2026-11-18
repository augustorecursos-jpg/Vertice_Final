// Testes da leitura de documentos (texto já extraído do PDF ou da foto).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../public/js/leitor');

const HOJE = new Date(2026, 10, 18);

// Monta uma linha digitável de boleto bancário válida (dígitos verificadores corretos).
function linhaBancaria(fator, centavos, livre = '1234567890123456789012345') {
  const valor = String(centavos).padStart(10, '0');
  const c1 = '3419' + livre.slice(0, 5), c2 = livre.slice(5, 15), c3 = livre.slice(15, 25);
  return `${c1}${L.mod10(c1)}${c2}${L.mod10(c2)}${c3}${L.mod10(c3)}7${String(fator).padStart(4, '0')}${valor}`;
}
const blocos = (d) => `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d[32]} ${d.slice(33)}`;
// Conta de consumo (48 dígitos, começa com 8), com valor real e módulo 10.
function linhaArrecadacao(segmento, centavos) {
  const barra = `8${segmento}60${String(centavos).padStart(11, '0')}00000000000000000000123456789`.slice(0, 44);
  return [0, 1, 2, 3].map((i) => { const b = barra.slice(i * 11, i * 11 + 11); return b + L.mod10(b); }).join('');
}

test('fator de vencimento antes e depois da virada de 2025', () => {
  assert.equal(L.dataDoFator(1000, new Date(2000, 6, 1)), '2000-07-03');
  assert.equal(L.dataDoFator(9999, new Date(2025, 1, 1)), '2025-02-21');
  assert.equal(L.dataDoFator(1000, HOJE), '2025-02-22');
  assert.equal(L.dataDoFator(1659, HOJE), '2026-12-13');
  assert.equal(L.dataDoFator(0, HOJE), null);
});

test('linha digitável: confere os dígitos e tira valor e vencimento', () => {
  const d = linhaBancaria(1659, 28743);
  const r = L.interpretarLinha(d, HOJE);
  assert.deepEqual([r.tipo, r.centavos, r.vencimento, r.banco], ['bancario', 28743, '2026-12-13', '341']);
  const errada = d.slice(0, 5) + ((+d[5] + 1) % 10) + d.slice(6);
  assert.equal(L.interpretarLinha(errada, HOJE), null);
  const a = L.interpretarLinha(linhaArrecadacao(3, 15990), HOJE);
  assert.deepEqual([a.tipo, a.centavos, a.segmento], ['arrecadacao', 15990, 'Conta de luz']);
});

test('boleto de conta de luz em PDF', () => {
  const d = linhaBancaria(1654, 28743);
  const texto = `Companhia de Energia Exemplo 2ª via
Conta de energia elétrica · Instalação 0045.778.21
Cliente ANA SOUZA Referência NOV/2026
Vencimento 08/12/2026 Total a pagar R$ 287,43
Consumo (312 kWh) R$ 248,10
Bandeira amarela R$ 18,72
Linha digitável
${blocos(d)}`;
  const r = L.ler(texto, { hoje: HOJE });
  assert.equal(r.tipo, 'boleto');
  assert.equal(r.desc, 'Conta de luz');
  assert.equal(r.categoria, 'fixa');
  assert.equal(r.centavos, 28743);
  assert.equal(r.vencimento, '2026-12-08'); // o fator 1654 é 08/12/2026
  assert.equal(r.linhaDigitavel, d);
  assert.ok(r.certeza.centavos && r.certeza.vencimento && r.certeza.desc);
  assert.deepEqual(r.marcas.map((m) => m.campo), ['linha', 'centavos', 'vencimento']);
});

test('boleto sem linha digitável usa os rótulos do texto', () => {
  const r = L.ler('Escola Aprender\nMensalidade dezembro\nData de vencimento: 05/12/2026\nValor do documento\nR$ 1.250,00', { hoje: HOJE });
  assert.equal(r.desc, 'Mensalidade escolar');
  assert.equal(r.centavos, 125000);
  assert.equal(r.vencimento, '2026-12-05');
});

test('fatura do cartão com compras, parcelas e estorno', () => {
  const texto = `Fatura do cartão de crédito Nubank
Total desta fatura R$ 1.326,00
Vencimento 10/12/2026
Lançamentos
02/11 MERCADO BOM PRECO 412,90
04/11 POSTO AVENIDA 230,00
06/11 STREAMING PLUS 55,90
09/11 RESTAURANTE SABOR 128,40
12/11 FARMACIA CENTRAL 2/3 96,30
15/11 LOJA ONLINE ELETRO PARC 4/10 189,90
19/11 CINEMA SHOPPING 74,00
20/11 ESTORNO LOJA X -20,00
23/11 PET AMIGO 158,60
25/11 PAGAMENTO RECEBIDO -900,00
Total 1.326,00`;
  const r = L.ler(texto, { hoje: HOJE });
  assert.equal(r.tipo, 'fatura');
  assert.equal(r.categoria, 'cartao');
  assert.equal(r.cartao, 'Nubank');
  assert.equal(r.desc, 'Fatura Nubank');
  assert.equal(r.centavos, 132600);
  assert.equal(r.vencimento, '2026-12-10');
  assert.equal(r.compras.length, 8);
  assert.equal(r.creditos.length, 1);
  assert.equal(r.somaConfere, true);
  assert.equal(r.compras[0].desc, 'Mercado Bom Preco');
  assert.deepEqual(r.compras[4].parcela, { n: 2, total: 3 });
  assert.equal(r.compras[4].desc, 'Farmacia Central 2/3');
  assert.equal(r.compras[5].desc, 'Loja Online Eletro 4/10');
});

test('fatura cuja soma não bate avisa', () => {
  const r = L.ler('Fatura cartão Itaú\nTotal da fatura 500,00\nVencimento 10/12/2026\n01/11 PADARIA 10,00\n02/11 MERCADO 20,00', { hoje: HOJE });
  assert.equal(r.cartao, 'Itaú');
  assert.equal(r.somaConfere, false);
});

test('recibo de foto (texto com ruído do OCR)', () => {
  const texto = `PADARIA E CONFEITARIA TRIGO
CNPJ 12.345.678/0001-90
Rua das Flores, 120
Pão francês 1kg 18,90
Café 500g 24,50
Bolo de fubá 22,00
TOTAL R$ 65,40
18/11/2026 08:42
*** CUPOM FISCAL ***`;
  const r = L.ler(texto, { hoje: HOJE });
  assert.equal(r.tipo, 'recibo');
  assert.equal(r.categoria, 'variavel');
  assert.equal(r.desc, 'Padaria e Confeitaria Trigo');
  assert.equal(r.centavos, 6540);
  assert.equal(r.vencimento, '2026-11-18');
  assert.equal(r.cnpj, '12.345.678/0001-90');
});

test('nota fiscal da empresa com duplicatas', () => {
  const texto = `DANFE Documento auxiliar da nota fiscal eletrônica
Nº 004.512 Série 1
EMITENTE
DEPÓSITO DE MATERIAIS CONSTRUFORTE LTDA
CNPJ 98.765.432/0001-10
DESTINATÁRIO CONSTRUTORA HORIZONTE LTDA CNPJ 11.222.333/0001-44
Cimento CP-II 50kg 4.680,00
Valor total da nota R$ 9.600,00
Fatura / duplicatas
001 10/12/2026 4.800,00
002 10/01/2027 4.800,00`;
  const r = L.ler(texto, { hoje: HOJE });
  assert.equal(r.tipo, 'nota');
  assert.equal(r.emitente, 'Depósito de Materiais Construforte LTDA');
  assert.equal(r.cnpj, '98.765.432/0001-10');
  assert.equal(r.numero, '4512');
  assert.equal(r.centavos, 960000);
  assert.deepEqual(r.duplicatas.map((d) => [d.n, d.iso, d.centavos]), [[1, '2026-12-10', 480000], [2, '2027-01-10', 480000]]);
  assert.equal(r.somaConfere, true);
  assert.equal(r.desc, 'NF 4512 · Depósito de Materiais Construforte');
});

test('texto vazio ou sem nada útil', () => {
  assert.equal(L.ler('', { hoje: HOJE }).tipo, 'documento');
  const r = L.ler('Olá, tudo bem?', { hoje: HOJE });
  assert.equal(r.centavos, null);
  assert.equal(r.vencimento, null);
});
