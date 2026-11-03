// Testes das assinaturas: 30 dias a partir do 1º acesso, avisos, renovação e mensagem padrão.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'vertice-assin-'));
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
let id, senha;
const doUsuario = async () => (await admin('GET', '/api/admin/usuarios')).dados.find((u) => u.id === id);

test('assinatura começa no primeiro acesso, com 30 dias', async () => {
  await admin('POST', '/api/login', { login: 'admin', senha: 'senha-admin-teste' });
  const r = await admin('POST', '/api/admin/usuarios', { nome: 'Bruno Lima', login: 'bruno', telefone: '(11) 98765-4321' });
  assert.equal(r.status, 201);
  ({ id, senhaTemporaria: senha } = r.dados);
  let u = await doUsuario();
  assert.equal(u.assinatura.cod, 'pendente');
  assert.equal(u.telefone, '11987654321');
  assert.equal((await admin('GET', '/api/admin/usuarios')).dados.find((x) => x.login === 'admin').assinatura.cod, 'isento');

  assert.equal((await cliente()('POST', '/api/login', { login: 'bruno', senha })).status, 200);
  u = await doUsuario();
  assert.equal(u.assinaturaInicio, hoje());
  assert.equal(u.assinaturaVence, mais(hoje(), 30));
  assert.deepEqual(u.assinatura, { cod: 'ok', dias: 30 });
  // Entrar de novo não reinicia o prazo.
  db.prepare('UPDATE usuarios SET assinatura_vence = ? WHERE id = ?').run(mais(hoje(), 3), id);
  await cliente()('POST', '/api/login', { login: 'bruno', senha });
  assert.equal((await doUsuario()).assinaturaVence, mais(hoje(), 3));
});

test('situação: aviso perto do vencimento, hoje e vencida', async () => {
  assert.deepEqual((await doUsuario()).assinatura, { cod: 'aviso', dias: 3 });
  db.prepare('UPDATE usuarios SET assinatura_vence = ? WHERE id = ?').run(hoje(), id);
  assert.equal((await doUsuario()).assinatura.cod, 'hoje');
  db.prepare('UPDATE usuarios SET assinatura_vence = ? WHERE id = ?').run(mais(hoje(), -2), id);
  assert.deepEqual((await doUsuario()).assinatura, { cod: 'vencida', dias: -2 });
});

test('renovar soma 30 dias a partir de hoje se venceu, ou do vencimento se ainda vale', async () => {
  let r = await admin('POST', `/api/admin/usuarios/${id}/renovar`, {});
  assert.equal(r.dados.assinaturaVence, mais(hoje(), 30));
  r = await admin('POST', `/api/admin/usuarios/${id}/renovar`, {});
  assert.equal(r.dados.assinaturaVence, mais(hoje(), 60));
  const eu = (await admin('GET', '/api/eu')).dados;
  assert.equal((await admin('POST', `/api/admin/usuarios/${eu.id}/renovar`, {})).status, 400);
  const aud = (await admin('GET', '/api/admin/auditoria')).dados;
  assert.ok(aud.some((a) => a.acao === 'renovou assinatura'));
});

test('renovar por período soma os dias certos e registra o valor pago', async () => {
  const { db } = require('../db');
  db.prepare('UPDATE usuarios SET assinatura_vence = ? WHERE id = ?').run(mais(hoje(), -1), id);
  let r = await admin('POST', `/api/admin/usuarios/${id}/renovar`, { periodo: 'semestral' });
  assert.equal(r.dados.assinaturaVence, mais(hoje(), 180));
  assert.equal(r.dados.valor, 5994);
  r = await admin('POST', `/api/admin/usuarios/${id}/renovar`, { periodo: 'anual', valor: 9990 });
  assert.equal(r.dados.assinaturaVence, mais(hoje(), 545));
  const u = await doUsuario();
  assert.equal(u.periodo, 'anual');
  assert.equal(u.ultimoValor, 9990);
  assert.equal(u.plano, 'pf');
  const hist = db.prepare('SELECT periodo, centavos FROM renovacoes WHERE usuario_id = ? ORDER BY id DESC LIMIT 2').all(id);
  assert.deepEqual(hist.map((h) => [h.periodo, h.centavos]), [['anual', 9990], ['semestral', 5994]]);
  assert.equal((await admin('POST', `/api/admin/usuarios/${id}/renovar`, { periodo: 'bienal' })).status, 400);
  assert.equal((await admin('POST', `/api/admin/usuarios/${id}/renovar`, { valor: -5 })).status, 400);
  const aud = (await admin('GET', '/api/admin/auditoria')).dados;
  assert.ok(aud.some((a) => /Anual · R\$\s99,90/.test(a.detalhe || '')));
});

test('tabela de preços por plano e período', async () => {
  let c = (await admin('GET', '/api/admin/config')).dados;
  assert.deepEqual(c.precos.pf, { mensal: 1199, trimestral: 3297, semestral: 5994, anual: 10788 });
  assert.equal(c.precos.gestao.anual, 304980);
  assert.equal((await admin('PUT', '/api/admin/config', { precos: { pf: { anual: 9900 }, grupo: { mensal: 60000 } } })).status, 200);
  c = (await admin('GET', '/api/admin/config')).dados;
  assert.equal(c.precos.pf.anual, 9900);
  assert.equal(c.precos.pf.mensal, 1199);
  assert.equal(c.precos.grupo.mensal, 60000);
  assert.equal((await admin('PUT', '/api/admin/config', { precos: { pf: { anual: 0 } } })).status, 400);
  assert.equal((await admin('PUT', '/api/admin/config', { precos: { pf: { anual: 1.5 } } })).status, 400);
  assert.equal((await admin('GET', '/api/admin/config')).dados.precos.pf.anual, 9900);
  assert.equal((await admin('PUT', '/api/admin/config', { precos: structuredClone(require('../public/js/nucleo.js').PRECOS_PADRAO) })).status, 200);
});

test('admin ajusta vencimento e telefone; valida os dados', async () => {
  assert.equal((await admin('PUT', `/api/admin/usuarios/${id}`, { assinaturaVence: '2027-02-30' })).status, 400);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${id}`, { telefone: '123' })).status, 400);
  assert.equal((await admin('PUT', `/api/admin/usuarios/${id}`, { assinaturaVence: '2027-01-15', telefone: '' })).status, 200);
  const u = await doUsuario();
  assert.equal(u.assinaturaVence, '2027-01-15');
  assert.equal(u.telefone, '');
});

test('configuração da mensalidade e da mensagem padrão', async () => {
  const c = (await admin('GET', '/api/admin/config')).dados;
  assert.equal(c.mensalidade, 1199);
  assert.equal(c.diasAviso, 5);
  assert.match(c.mensagem, /\{vencimento\}/);
  assert.match(c.mensagem, /\{opcoes\}/);
  assert.equal((await admin('PUT', '/api/admin/config', { mensalidade: 1490, diasAviso: 7, mensagem: 'Oi {nome}' })).status, 200);
  assert.deepEqual((await admin('GET', '/api/admin/config')).dados.mensalidade, 1490);
  assert.equal((await admin('PUT', '/api/admin/config', { mensalidade: -1 })).status, 400);
  assert.equal((await admin('PUT', '/api/admin/config', { mensagem: '  ' })).status, 400);
  const usuario = cliente();
  await usuario('POST', '/api/login', { login: 'bruno', senha });
  assert.equal((await usuario('GET', '/api/admin/config')).status, 403);
  assert.equal((await usuario('POST', `/api/admin/usuarios/${id}/renovar`, {})).status, 403);
});
