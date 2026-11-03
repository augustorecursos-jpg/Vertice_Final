// Testes do Vértice Empresas: controle central pela AR, papéis, centros de custo, orçamento e solicitações.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-emp-'));
process.env.ADMIN_PASSWORD = 'senha-admin-teste';
const { app } = require('../server');
const { db } = require('../db');

let servidor, base;
before(() => new Promise((ok) => { servidor = app.listen(0, () => { base = `http://localhost:${servidor.address().port}`; ok(); }); }));
after(() => { servidor.close(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });

function cliente() {
  let cookie = '';
  return async (metodo, url, corpo) => {
    const r = await fetch(base + url, { method: metodo, headers: { 'Content-Type': 'application/json', cookie }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    const c = r.headers.get('set-cookie');
    if (c) cookie = c.split(';')[0];
    return { status: r.status, dados: await r.json().catch(() => null) };
  };
}
const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const mais = (iso, d) => { const x = new Date(`${iso}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };

const admin = cliente();
const ctx = {};
async function entrar(login, senha) {
  const c = cliente();
  const r = await c('POST', '/api/login', { login, senha });
  return r.status === 200 ? c : r;
}

test('AR cria empresa com plano de contas padrão e usuários com papéis', async () => {
  await admin('POST', '/api/login', { login: 'admin', senha: 'senha-admin-teste' });
  assert.equal((await admin('POST', '/api/admin/empresas', { nome: 'X', cnpj: '123' })).status, 400);
  let r = await admin('POST', '/api/admin/empresas', { nome: 'Construtora Horizonte Ltda', cnpj: '12.345.678/0001-90', plano: 'essencial' });
  assert.equal(r.status, 201);
  ctx.emp = r.dados.id;
  const lista = (await admin('GET', '/api/admin/empresas')).dados;
  const e = lista.find((x) => x.id === ctx.emp);
  assert.equal(e.cnpj, '12345678000190');
  assert.equal(e.limiteUsuarios, 3);
  assert.equal(e.centros.length, 3);
  ctx.centros = e.centros.map((c) => c.id);

  const criar = (login, papel, centros) => admin('POST', '/api/admin/usuarios', { nome: login, login, empresaId: ctx.emp, papel, centros });
  assert.equal((await criar('gestor0', 'gestor', [])).status, 400); // gestor precisa de centro
  assert.equal((await criar('gestor0', 'gestor', ['nada'])).status, 400);
  ctx.dono = (await criar('roberto', 'dono')).dados;
  ctx.fin = (await criar('paula', 'financeiro')).dados;
  ctx.gestor = (await criar('ricardo', 'gestor', [ctx.centros[1]])).dados;
  r = await criar('quarto', 'financeiro');
  assert.equal(r.status, 400);
  assert.match(r.dados.erro, /permite 3 usuários/);
  ctx.leitura = (await criar('contador', 'leitura')).dados; // leitura não conta no limite
  assert.ok(ctx.leitura.senhaTemporaria);
  assert.equal((await admin('GET', '/api/admin/usuarios')).dados.some((u) => u.login === 'roberto'), false);
  const us = (await admin('GET', `/api/admin/empresas/${ctx.emp}/usuarios`)).dados;
  assert.deepEqual(us.map((u) => u.papel).sort(), ['dono', 'financeiro', 'gestor', 'leitura']);
  assert.deepEqual(us.find((u) => u.login === 'ricardo').centros, [ctx.centros[1]]);
});

test('primeiro acesso começa a assinatura da empresa; /api/eu traz a empresa', async () => {
  ctx.cDono = await entrar('roberto', ctx.dono.senhaTemporaria);
  const eu = (await ctx.cDono('GET', '/api/eu')).dados;
  assert.equal(eu.empresa.nome, 'Construtora Horizonte Ltda');
  assert.equal(eu.empresa.papel, 'dono');
  const e = (await admin('GET', '/api/admin/empresas')).dados.find((x) => x.id === ctx.emp);
  assert.equal(e.assinaturaVence, mais(hoje(), 30));
  assert.equal(db.prepare("SELECT assinatura_vence FROM usuarios WHERE login = 'roberto'").get().assinatura_vence, null);
  ctx.cFin = await entrar('paula', ctx.fin.senhaTemporaria);
  ctx.cGestor = await entrar('ricardo', ctx.gestor.senhaTemporaria);
  ctx.cLeitura = await entrar('contador', ctx.leitura.senhaTemporaria);
});

test('lançamentos respeitam papéis e centros de custo', async () => {
  const d = (await ctx.cDono('GET', '/api/empresa')).dados;
  assert.equal(d.eu.papel, 'dono');
  ctx.est = d.estrutura;
  const conta = (nome) => d.estrutura.contas.find((c) => c.nome === nome).id;
  ctx.conta = conta;
  const [adm, com] = ctx.centros;
  const L = (id, centro, extra = {}) => ({ id, desc: 'Item ' + id, centavos: 10000, conta: conta('Marketing e vendas'), centro, ano: 2026, mes: 9, dia: 10, ...extra });
  let r = await ctx.cDono('POST', '/api/empresa/lancamentos', { lancamentos: [L('a1', adm), L('a2', com), L('a3', null, { conta: conta('Prestação de serviços'), centavos: 50000 })] });
  assert.equal(r.status, 201);
  assert.equal((await ctx.cDono('POST', '/api/empresa/lancamentos', { lancamentos: [L('a1', adm)] })).status, 409);
  assert.equal((await ctx.cDono('POST', '/api/empresa/lancamentos', { lancamentos: [L('x', adm, { conta: 'nada' })] })).status, 400);
  // gestor: só o centro comercial
  const g = (await ctx.cGestor('GET', '/api/empresa')).dados;
  assert.deepEqual(g.lancamentos.map((l) => l.id), ['a2']);
  assert.equal(g.estrutura.saldoInicial, 0);
  assert.equal((await ctx.cGestor('POST', '/api/empresa/lancamentos', { lancamentos: [L('g1', adm)] })).status, 403);
  assert.equal((await ctx.cGestor('POST', '/api/empresa/lancamentos', { lancamentos: [L('g2', null)] })).status, 403);
  assert.equal((await ctx.cGestor('POST', '/api/empresa/lancamentos', { lancamentos: [L('g3', com)] })).status, 201);
  assert.equal((await ctx.cGestor('PUT', '/api/empresa/lancamentos/a1', { pago: true })).status, 403);
  assert.equal((await ctx.cGestor('PUT', '/api/empresa/lancamentos/g3', { centro: adm })).status, 403);
  r = await ctx.cGestor('PUT', '/api/empresa/lancamentos/g3', { pago: true, centavos: 12000 });
  assert.equal(r.status, 200);
  assert.equal(r.dados.lancamento.pago, true);
  assert.equal((await ctx.cGestor('POST', '/api/empresa/lancamentos/excluir', { ids: ['a1'] })).status, 403);
  // leitura: só consulta
  assert.equal((await ctx.cLeitura('GET', '/api/empresa')).dados.lancamentos.length, 4);
  assert.equal((await ctx.cLeitura('POST', '/api/empresa/lancamentos', { lancamentos: [L('l1', adm)] })).status, 403);
  // outra empresa não enxerga nem altera
  const outra = (await admin('POST', '/api/admin/empresas', { nome: 'Outra ME', plano: 'gestao' })).dados.id;
  const fulano = (await admin('POST', '/api/admin/usuarios', { nome: 'Fulano', login: 'fulano', empresaId: outra, papel: 'dono' })).dados;
  const cOutra = await entrar('fulano', fulano.senhaTemporaria);
  assert.equal((await cOutra('GET', '/api/empresa')).dados.lancamentos.length, 0);
  assert.equal((await cOutra('PUT', '/api/empresa/lancamentos/a1', { pago: true })).status, 404);
  assert.equal((await cOutra('POST', '/api/empresa/lancamentos/excluir', { ids: ['a1'] })).dados.excluidos, 0);
  // conta pessoa física não acessa
  const pf = (await admin('POST', '/api/admin/usuarios', { nome: 'PF', login: 'pf1' })).dados;
  assert.equal((await (await entrar('pf1', pf.senhaTemporaria))('GET', '/api/empresa')).status, 403);
  assert.equal((await ctx.cDono('POST', '/api/empresa/lancamentos/excluir', { ids: ['a1'] })).dados.excluidos, 1);
});

test('plano de contas: só dono/financeiro, com revisão e proteção do que está em uso', async () => {
  const d = (await ctx.cFin('GET', '/api/empresa')).dados;
  const est = { ...d.estrutura, rev: d.rev };
  assert.equal((await ctx.cGestor('PUT', '/api/empresa/estrutura', est)).status, 403);
  const mk = ctx.conta('Marketing e vendas');
  assert.equal((await ctx.cFin('PUT', '/api/empresa/estrutura', { ...est, contas: est.contas.filter((c) => c.id !== mk) })).status, 400);
  assert.equal((await ctx.cFin('PUT', '/api/empresa/estrutura', { ...est, contas: est.contas.map((c) => (c.id === mk ? { ...c, grupo: 'custo' } : c)) })).status, 400);
  assert.equal((await ctx.cFin('PUT', '/api/empresa/estrutura', { ...est, centros: est.centros.filter((c) => c.id !== ctx.centros[1]) })).status, 400);
  const nova = { ...est, saldoInicial: 5000000, contas: [...est.contas, { id: 'nova', nome: 'Consultoria', grupo: 'receita' }], centros: est.centros.map((c) => (c.id === ctx.centros[1] ? { ...c, ativo: false } : c)) };
  let r = await ctx.cFin('PUT', '/api/empresa/estrutura', nova);
  assert.equal(r.status, 200);
  assert.equal(r.dados.rev, d.rev + 1);
  r = await ctx.cDono('PUT', '/api/empresa/estrutura', nova); // revisão antiga
  assert.equal(r.status, 409);
  assert.equal(r.dados.estrutura.saldoInicial, 5000000);
});

test('orçamento: financeiro propõe, dono aprova; gestor vê só os centros dele', async () => {
  const mk = ctx.conta('Marketing e vendas'), [adm, com] = ctx.centros;
  const valores = { [mk]: { _: Array(12).fill(100000), [com]: Array(12).fill(50000), [adm]: Array(12).fill(20000) } };
  assert.equal((await ctx.cGestor('POST', '/api/empresa/orcamentos', { ano: 2026, nome: 'G', valores })).status, 403);
  let r = await ctx.cFin('POST', '/api/empresa/orcamentos', { ano: 2026, nome: 'Primeira proposta', valores });
  assert.equal(r.dados.status, 'proposta');
  const proposta = r.dados.id;
  r = await ctx.cDono('POST', '/api/empresa/orcamentos', { ano: 2026, nome: 'Aprovada', valores });
  assert.equal(r.dados.status, 'vigente');
  assert.equal((await ctx.cFin('POST', `/api/empresa/orcamentos/${proposta}/aprovar`, {})).status, 403);
  assert.equal((await ctx.cDono('POST', `/api/empresa/orcamentos/${proposta}/aprovar`, {})).status, 200);
  const os = (await ctx.cDono('GET', '/api/empresa')).dados.orcamentos;
  assert.deepEqual(os.map((o) => o.status), ['substituida', 'vigente']);
  assert.equal(os[1].autor, 'paula');
  const og = (await ctx.cGestor('GET', '/api/empresa')).dados.orcamentos[0].valores;
  assert.deepEqual(Object.keys(og[mk]), [com]);
  assert.equal((await ctx.cFin('POST', '/api/empresa/orcamentos', { ano: 2026, nome: 'X', valores: { nada: { _: Array(12).fill(1) } } })).status, 400);
});

test('solicitações do dono chegam ao painel da AR', async () => {
  assert.equal((await ctx.cFin('POST', '/api/empresa/solicitacoes', { tipo: 'novo_usuario', detalhes: { nome: 'Marcos' } })).status, 403);
  assert.equal((await ctx.cDono('POST', '/api/empresa/solicitacoes', { tipo: 'xyz', detalhes: { nome: 'Marcos' } })).status, 400);
  assert.equal((await ctx.cDono('POST', '/api/empresa/solicitacoes', { tipo: 'novo_usuario', detalhes: { nome: 'Marcos Teixeira', email: 'obras@horizonte.com.br', papel: 'gestor', centro: 'Obras' } })).status, 201);
  let s = (await admin('GET', '/api/admin/solicitacoes')).dados;
  assert.equal(s.length, 1);
  assert.equal(s[0].tipoNome, 'Novo usuário');
  assert.equal(s[0].detalhes.papel, 'gestor');
  assert.equal((await admin('GET', '/api/admin/empresas')).dados.find((e) => e.id === ctx.emp).solicitacoes, 1);
  assert.equal((await admin('PUT', `/api/admin/solicitacoes/${s[0].id}`, { status: 'resolvida' })).status, 200);
  assert.equal((await admin('GET', '/api/admin/solicitacoes')).dados.length, 0);
  assert.equal((await admin('GET', '/api/admin/solicitacoes?status=todas')).dados[0].resolvidoPor, 'admin');
  assert.equal((await ctx.cDono('GET', '/api/admin/solicitacoes')).status, 403);
});

test('AR muda papel, renova, troca plano e bloqueia a empresa inteira', async () => {
  // papel: leitura -> financeiro estoura o limite do Essencial (3)
  let r = await admin('PUT', `/api/admin/usuarios/${ctx.leitura.id}`, { papel: 'financeiro' });
  assert.equal(r.status, 400);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${ctx.leitura.id}`, { perfil: 'admin' })).status, 200);
  assert.equal(db.prepare('SELECT perfil FROM usuarios WHERE id = ?').get(ctx.leitura.id).perfil, 'usuario');
  assert.equal((await admin('PUT', `/api/admin/usuarios/${ctx.gestor.id}`, { centros: [ctx.centros[0]] })).status, 200);
  assert.deepEqual((await ctx.cGestor('GET', '/api/empresa')).dados.eu.centros, [ctx.centros[0]]);
  assert.equal((await admin('POST', `/api/admin/usuarios/${ctx.dono.id}/renovar`, {})).status, 400);
  r = await admin('POST', `/api/admin/empresas/${ctx.emp}/renovar`, { periodo: 'semestral' });
  assert.equal(r.dados.valor, 80460);
  assert.equal(r.dados.assinaturaVence, mais(hoje(), 30 + 180));
  assert.equal((await admin('PUT', `/api/admin/empresas/${ctx.emp}`, { plano: 'pf' })).status, 400);
  assert.equal((await admin('PUT', `/api/admin/empresas/${ctx.emp}`, { plano: 'gestao' })).status, 200);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${ctx.leitura.id}`, { papel: 'financeiro' })).status, 200);
  assert.equal((await admin('PUT', `/api/admin/empresas/${ctx.emp}`, { plano: 'essencial' })).status, 400);
  // bloquear a empresa derruba todos na hora e impede login
  assert.equal((await admin('PUT', `/api/admin/empresas/${ctx.emp}`, { ativo: false })).status, 200);
  assert.equal((await ctx.cDono('GET', '/api/empresa')).status, 401);
  r = await cliente()('POST', '/api/login', { login: 'paula', senha: ctx.fin.senhaTemporaria });
  assert.equal(r.status, 401);
  assert.match(r.dados.erro, /bloqueado/);
  await admin('PUT', `/api/admin/empresas/${ctx.emp}`, { ativo: true });
  assert.equal((await ctx.cDono('GET', '/api/empresa')).status, 200);
  const aud = (await admin('GET', '/api/admin/auditoria')).dados.map((a) => a.acao);
  for (const a of ['criou empresa', 'renovou assinatura da empresa', 'bloqueou empresa', 'desbloqueou empresa', 'aprovou orçamento', 'enviou solicitação à AR']) assert.ok(aud.includes(a), a);
});

test('excluir empresa apaga usuários e dados', async () => {
  assert.equal((await admin('DELETE', `/api/admin/empresas/${ctx.emp}`, { confirmacao: 'errado' })).status, 400);
  assert.equal((await admin('DELETE', `/api/admin/empresas/${ctx.emp}`, { confirmacao: 'Construtora Horizonte Ltda' })).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM usuarios WHERE empresa_id = ?').get(ctx.emp).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM pj_lancamentos WHERE empresa_id = ?').get(ctx.emp).n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM pj_orcamentos WHERE empresa_id = ?').get(ctx.emp).n, 0);
  assert.equal((await ctx.cDono('GET', '/api/eu')).status, 401);
});
