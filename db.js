// Banco de dados SQLite (módulo nativo node:sqlite, sem dependências nativas).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const N = require('./public/js/nucleo.js');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'vertice.db');

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  login         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash    TEXT NOT NULL,
  perfil        TEXT NOT NULL DEFAULT 'usuario' CHECK (perfil IN ('admin', 'usuario')),
  ativo         INTEGER NOT NULL DEFAULT 1,
  trocar_senha  INTEGER NOT NULL DEFAULT 1,
  ultimo_acesso TEXT,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dados financeiros de cada usuário (lista de lançamentos em JSON).
-- rev controla a concorrência entre dispositivos: quem grava com rev antiga recebe 409.
CREATE TABLE IF NOT EXISTS carteiras (
  usuario_id    INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  dados         TEXT NOT NULL DEFAULT '[]',
  rev           INTEGER NOT NULL DEFAULT 0,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auditoria (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario   TEXT,
  acao      TEXT NOT NULL,
  detalhe   TEXT,
  ip        TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria(criado_em);

CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS renovacoes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  periodo    TEXT NOT NULL,
  centavos   INTEGER NOT NULL,
  de         TEXT NOT NULL,
  ate        TEXT NOT NULL,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_renovacoes_usuario ON renovacoes(usuario_id);
`);

// Migrações: colunas novas em bancos já existentes.
const colunas = new Set(db.prepare('PRAGMA table_info(usuarios)').all().map((c) => c.name));
for (const [nome, def] of [
  ['telefone', 'TEXT'],              // para o aviso por WhatsApp
  ['assinatura_inicio', 'TEXT'],     // AAAA-MM-DD do primeiro acesso
  ['assinatura_vence', 'TEXT'],      // AAAA-MM-DD; renovar soma os dias do período
  ['plano', "TEXT NOT NULL DEFAULT 'pf'"], // pf | essencial | gestao | grupo
  ['periodo', "TEXT NOT NULL DEFAULT 'mensal'"], // período da última renovação
  ['ultimo_valor', 'INTEGER'],       // centavos pagos na última renovação
  ['ultima_renovacao', 'TEXT'],      // AAAA-MM-DD
]) {
  if (!colunas.has(nome)) db.exec(`ALTER TABLE usuarios ADD COLUMN ${nome} ${def}`);
}

// ---------- configurações editáveis pelo admin ----------
const CONFIG_PADRAO = {
  mensalidade_centavos: '1199',
  dias_aviso: '5',
  mensagem_aviso: 'Olá, {nome}! Tudo bem?\n\nSua assinatura do Vértice vence em {vencimento} ({prazo}). Deseja renovar?\n\nEscolha o plano que preferir:\n{opcoes}\n\nÉ só responder com o plano escolhido que eu envio os dados para pagamento.\n\nAR Consultoria',
  precos_planos: JSON.stringify(N.PRECOS_PADRAO),
};
function lerConfig() {
  const cfg = { ...CONFIG_PADRAO };
  const gravadas = new Set();
  for (const r of db.prepare('SELECT chave, valor FROM config').all()) if (r.chave in cfg) { cfg[r.chave] = r.valor; gravadas.add(r.chave); }
  let precos = null;
  try { precos = N.limparPrecos(JSON.parse(cfg.precos_planos)); } catch { /* usa o padrão */ }
  precos ||= structuredClone(N.PRECOS_PADRAO);
  // Bancos antigos só tinham a mensalidade: ela vira o preço mensal de pessoa física.
  if (!gravadas.has('precos_planos') && gravadas.has('mensalidade_centavos')) precos.pf.mensal = Number(cfg.mensalidade_centavos);
  return { mensalidade: precos.pf.mensal, precos, diasAviso: Number(cfg.dias_aviso), mensagem: cfg.mensagem_aviso };
}
function gravarConfig(chave, valor) {
  db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor').run(chave, String(valor));
}

// ---------- senhas (scrypt) ----------
function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(senha), sal, 64);
  return `scrypt$${sal.toString('hex')}$${h.toString('hex')}`;
}

function conferirSenha(senha, armazenado) {
  const [tipo, salHex, hHex] = String(armazenado || '').split('$');
  if (tipo !== 'scrypt' || !salHex || !hHex) return false;
  const h = crypto.scryptSync(String(senha), Buffer.from(salHex, 'hex'), 64);
  const esperado = Buffer.from(hHex, 'hex');
  return esperado.length === h.length && crypto.timingSafeEqual(h, esperado);
}

/** Senha temporária legível (sem 0/O, 1/l/I): ex. "k7mq-x3vd-9p". */
function senhaTemporaria() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyz23456789';
  const b = crypto.randomBytes(10);
  const s = [...b].map((x) => alfabeto[x % alfabeto.length]).join('');
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

module.exports = { db, DATA_DIR, DB_FILE, hashSenha, conferirSenha, senhaTemporaria, lerConfig, gravarConfig, CONFIG_PADRAO };
