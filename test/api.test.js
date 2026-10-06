// Testes da API: login, permissões do administrador, isolamento dos dados e sincronização.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-teste-'));
process.env.ADMIN_PASSWORD = 'senha-admin-teste';
const { app } = require('../server');

let servidor, base;
before(() => new Promise((ok) => { servidor = app.listen(0, () => { base = `http://localhost:${servidor.address().port}`; ok(); }); }));
after(() => { servidor.close(); fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });

/** Cliente com o próprio cookie, como um navegador separado. */
function cliente() {
  let cookie = '';
  return async function req(metodo, url, corpo, { tipo = 'application/json' } = {}) {
    const r = await fetch(base + url, {
      method: metodo, redirect: 'manual',
      headers: { 'Content-Type': tipo, cookie },
      body: corpo === undefined ? undefined : (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
    });
    const c = r.headers.get('set-cookie');
    if (c) cookie = c.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, dados: ct.includes('json') ? await r.json() : await r.text(), headers: r.headers };
  };
}

const lanc = (id, extra = {}) => ({ id, grupo: null, desc: 'Teste ' + id, categoria: 'fixa', centavos: 1000, ano: 2026, mes: 9, dia: 5, pago: false, parcela: null, criadoEm: 1, ...extra });

const admin = cliente();
let ana, idAna, senhaAna;

test('páginas e API exigem login', async () => {
  const anon = cliente();
  const raiz = await anon('GET', '/');
  assert.equal(raiz.status, 302);
  assert.equal(raiz.headers.get('location'), '/entrar');
  assert.equal((await anon('GET', '/entrar')).status, 200);
  assert.equal((await anon('GET', '/api/dados')).status, 401);
  assert.equal((await anon('GET', '/api/admin/usuarios')).status, 401);
  assert.equal((await anon('GET', '/healthz')).dados, 'ok');
});

test('login do administrador inicial', async () => {
  assert.equal((await admin('POST', '/api/login', { login: 'admin', senha: 'errada' })).status, 401);
  const r = await admin('POST', '/api/login', { login: 'admin', senha: 'senha-admin-teste' });
  assert.equal(r.status, 200);
  const eu = await admin('GET', '/api/eu');
  assert.equal(eu.dados.perfil, 'admin');
  assert.equal(eu.dados.trocarSenha, false);
  assert.equal((await admin('GET', '/')).status, 200);
});

test('escritas na API exigem JSON (proteção contra CSRF)', async () => {
  const r = await admin('POST', '/api/admin/usuarios', 'nome=x&login=y', { tipo: 'application/x-www-form-urlencoded' });
  assert.equal(r.status, 415);
});

test('admin cria usuário com senha temporária', async () => {
  const r = await admin('POST', '/api/admin/usuarios', { nome: 'Ana Souza', login: 'Ana@Exemplo.com' });
  assert.equal(r.status, 201);
  assert.equal(r.dados.login, 'ana@exemplo.com');
  assert.match(r.dados.senhaTemporaria, /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{2}$/);
  idAna = r.dados.id; senhaAna = r.dados.senhaTemporaria;
  assert.equal((await admin('POST', '/api/admin/usuarios', { nome: 'Outra', login: 'ana@exemplo.com' })).status, 409);
  assert.equal((await admin('POST', '/api/admin/usuarios', { nome: 'X', login: 'a b' })).status, 400);
});

test('usuário comum entra, precisa trocar a senha e não acessa a administração', async () => {
  ana = cliente();
  assert.equal((await ana('POST', '/api/login', { login: 'ana@exemplo.com', senha: senhaAna })).status, 200);
  assert.equal((await ana('GET', '/api/eu')).dados.trocarSenha, true);
  assert.equal((await ana('GET', '/api/admin/usuarios')).status, 403);
  assert.equal((await ana('POST', '/api/admin/usuarios', { nome: 'Hacker', login: 'hacker' })).status, 403);
  assert.equal((await ana('POST', '/api/eu/senha', { atual: senhaAna, nova: 'curta' })).status, 400);
  assert.equal((await ana('POST', '/api/eu/senha', { atual: senhaAna, nova: 'nova-senha-da-ana' })).status, 200);
  assert.equal((await ana('GET', '/api/eu')).dados.trocarSenha, false);
});

test('cada usuário só vê os próprios lançamentos', async () => {
  const r = await ana('PUT', '/api/dados', { rev: 0, lancamentos: [lanc('a1'), lanc('a2')] });
  assert.equal(r.status, 200);
  assert.equal(r.dados.rev, 1);
  assert.equal((await ana('GET', '/api/dados')).dados.lancamentos.length, 2);
  assert.equal((await admin('GET', '/api/dados')).dados.lancamentos.length, 0);
  // A listagem de usuários não traz dados financeiros.
  const lista = (await admin('GET', '/api/admin/usuarios')).dados;
  assert.ok(lista.every((u) => !('lancamentos' in u) && !('senha_hash' in u)));
});

test('gravação com revisão antiga recebe conflito com os dados atuais', async () => {
  const r = await ana('PUT', '/api/dados', { rev: 0, lancamentos: [] });
  assert.equal(r.status, 409);
  assert.equal(r.dados.rev, 1);
  assert.equal(r.dados.lancamentos.length, 2);
});

test('lançamentos inválidos são recusados', async () => {
  assert.equal((await ana('PUT', '/api/dados', { rev: 1, lancamentos: [lanc('x', { categoria: 'nada' })] })).status, 400);
  assert.equal((await ana('PUT', '/api/dados', { rev: 1, lancamentos: 'x' })).status, 400);
});

test('bloquear derruba a sessão na hora e impede novo login', async () => {
  assert.equal((await admin('PUT', `/api/admin/usuarios/${idAna}`, { ativo: false })).status, 200);
  assert.equal((await ana('GET', '/api/dados')).status, 401);
  const r = await cliente()('POST', '/api/login', { login: 'ana@exemplo.com', senha: 'nova-senha-da-ana' });
  assert.equal(r.status, 401);
  assert.match(r.dados.erro, /bloqueado/);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${idAna}`, { ativo: true })).status, 200);
  assert.equal((await ana('POST', '/api/login', { login: 'ana@exemplo.com', senha: 'nova-senha-da-ana' })).status, 200);
});

test('redefinir senha derruba a sessão e exige troca', async () => {
  const r = await admin('POST', `/api/admin/usuarios/${idAna}/senha`, {});
  assert.equal(r.status, 200);
  assert.equal((await ana('GET', '/api/eu')).status, 401);
  assert.equal((await ana('POST', '/api/login', { login: 'ana@exemplo.com', senha: r.dados.senhaTemporaria })).status, 200);
  assert.equal((await ana('GET', '/api/eu')).dados.trocarSenha, true);
});

test('admin não se tranca para fora e sempre sobra um admin', async () => {
  const eu = (await admin('GET', '/api/eu')).dados;
  assert.equal((await admin('PUT', `/api/admin/usuarios/${eu.id}`, { ativo: false })).status, 400);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${eu.id}`, { perfil: 'usuario' })).status, 400);
  assert.equal((await admin('DELETE', `/api/admin/usuarios/${eu.id}`, { confirmar: 'admin' })).status, 400);
  // Promover a Ana permite rebaixá-la de novo, porque ainda há outro admin.
  assert.equal((await admin('PUT', `/api/admin/usuarios/${idAna}`, { perfil: 'admin' })).status, 200);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${idAna}`, { perfil: 'usuario' })).status, 200);
});

test('excluir usuário exige confirmação e apaga os dados dele', async () => {
  assert.equal((await admin('DELETE', `/api/admin/usuarios/${idAna}`, { confirmar: 'errado' })).status, 400);
  assert.equal((await admin('DELETE', `/api/admin/usuarios/${idAna}`, { confirmar: 'ana@exemplo.com' })).status, 200);
  assert.equal((await ana('GET', '/api/dados')).status, 401);
  const { db } = require('../db');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM carteiras WHERE usuario_id = ?').get(idAna).n, 0);
  const aud = (await admin('GET', '/api/admin/auditoria')).dados.map((x) => x.acao);
  assert.ok(aud.includes('excluiu usuário') && aud.includes('bloqueou usuário') && aud.includes('criou usuário'));
});

test('cabeçalhos de segurança', async () => {
  const r = await admin('GET', '/');
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
});
