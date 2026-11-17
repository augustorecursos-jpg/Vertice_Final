// Testes das contas de demonstração criadas pelo administrador.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-demo-'));
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
const admin = cliente();
async function entrar(login, senha) {
  const c = cliente();
  const r = await c('POST', '/api/login', { login, senha });
  assert.equal(r.status, 200, `login ${login}`);
  return c;
}
let senha;

test('não sobrescreve uma conta real que use o mesmo login', async () => {
  await admin('POST', '/api/login', { login: 'admin', senha: 'senha-admin-teste' });
  assert.equal((await admin('GET', '/api/admin/demo')).dados.existe, false);
  const real = (await admin('POST', '/api/admin/usuarios', { nome: 'Real', login: 'demo.gestor' })).dados;
  const r = await admin('POST', '/api/admin/demo', {});
  assert.equal(r.status, 409);
  assert.match(r.dados.erro, /demo\.gestor/);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM usuarios WHERE demo = 1").get().n, 0);
  await admin('DELETE', `/api/admin/usuarios/${real.id}`, { confirmar: 'demo.gestor' });
  assert.equal((await cliente()('GET', '/api/admin/demo')).status, 401);
});

test('cria pessoa física e empresa com dados, entrando sem trocar a senha', async () => {
  const r = await admin('POST', '/api/admin/demo', {});
  assert.equal(r.status, 200);
  assert.equal(r.dados.existe, true);
  senha = r.dados.senha;
  assert.match(senha, /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{2}$/);

  const pf = await entrar('demo.pf', senha);
  const eu = (await pf('GET', '/api/eu')).dados;
  assert.equal(eu.trocarSenha, false);
  assert.equal(eu.empresa, null);
  const d = (await pf('GET', '/api/dados')).dados;
  assert.ok(d.lancamentos.length > 100);
  assert.ok(d.lancamentos.some((l) => l.compras?.length === 6), 'fatura com compras');
  assert.ok(d.lancamentos.some((l) => l.parcela), 'compra parcelada');
  assert.equal(d.planos.length, 2);
  assert.equal(d.provisoes.length, 6);
  assert.equal(d.cenarios.length, 1);

  const dono = await entrar('demo.empresa', senha);
  const e = (await dono('GET', '/api/empresa')).dados;
  assert.equal(e.eu.papel, 'dono');
  assert.match(e.empresa.nome, /demonstração/);
  assert.equal(e.lancamentos.length, 132);
  assert.deepEqual(e.orcamentos.map((o) => o.status).sort(), ['proposta', 'vigente']);
  assert.equal(e.estrutura.saldoInicial, 18000000);
  const gestor = await entrar('demo.gestor', senha);
  const g = (await gestor('GET', '/api/empresa')).dados;
  assert.equal(g.eu.papel, 'gestor');
  const comercial = g.estrutura.centros.find((c) => c.nome === 'Comercial').id;
  assert.ok(g.lancamentos.length > 0 && g.lancamentos.every((l) => l.centro === comercial));

  // aparecem marcadas no painel e a assinatura não gera aviso
  const u = (await admin('GET', '/api/admin/usuarios')).dados.find((x) => x.login === 'demo.pf');
  assert.equal(u.demo, true);
  assert.equal(u.assinatura.cod, 'ok');
  const emp = (await admin('GET', '/api/admin/empresas')).dados.find((x) => x.demo);
  assert.equal(emp.assinatura.cod, 'ok');
  assert.equal(emp.usuarios, 2);
});

test('restaurar desfaz o que foi mexido e troca a senha', async () => {
  const pf = await entrar('demo.pf', senha);
  const d = (await pf('GET', '/api/dados')).dados;
  await pf('PUT', '/api/dados', { rev: d.rev, lancamentos: [] });
  const dono = await entrar('demo.empresa', senha);
  const e = (await dono('GET', '/api/empresa')).dados;
  await dono('POST', '/api/empresa/lancamentos/excluir', { ids: e.lancamentos.slice(0, 10).map((l) => l.id) });
  await dono('POST', '/api/empresa/solicitacoes', { tipo: 'outro', detalhes: { mensagem: 'teste' } });

  const r = await admin('POST', '/api/admin/demo', {});
  assert.equal(r.status, 200);
  assert.notEqual(r.dados.senha, senha);
  assert.equal((await cliente()('POST', '/api/login', { login: 'demo.pf', senha })).status, 401);
  senha = r.dados.senha;
  const pf2 = await entrar('demo.pf', senha);
  assert.ok((await pf2('GET', '/api/dados')).dados.lancamentos.length > 100);
  const dono2 = await entrar('demo.empresa', senha);
  assert.equal((await dono2('GET', '/api/empresa')).dados.lancamentos.length, 132);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM empresas WHERE demo = 1').get().n, 1);
  assert.equal((await admin('GET', '/api/admin/solicitacoes')).dados.length, 0);
  const aud = (await admin('GET', '/api/admin/auditoria')).dados.map((a) => a.acao);
  assert.ok(aud.includes('criou a demonstração') && aud.includes('restaurou a demonstração'));
});
