// Vértice · servidor
// Login com sessão assinada, dados financeiros por usuário e administração de contas.
// Só o administrador cria, bloqueia, redefine a senha e exclui usuários; não existe cadastro público.
// O administrador gerencia contas, mas a API não expõe os lançamentos de outros usuários.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { db, DATA_DIR, hashSenha, conferirSenha, senhaTemporaria, lerConfig, gravarConfig, CONFIG_PADRAO } = require('./db');
const N = require('./public/js/nucleo.js');
const E = require('./public/js/nucleo-empresa.js');

const PORT = Number(process.env.PORT) || 3000;
const PRODUCAO = process.env.NODE_ENV === 'production';
const SENHA_INICIAL_DEV = 'vertice-admin';
const MAX_LANCAMENTOS = 20000;
const PUBLICO = path.join(__dirname, 'public');

const SECRET_FILE = path.join(DATA_DIR, '.session-secret');
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'));
  return fs.readFileSync(SECRET_FILE, 'utf8');
})();

// Primeiro acesso: cria o administrador inicial se ainda não houver usuários.
if (!db.prepare('SELECT COUNT(*) n FROM usuarios').get().n) {
  const login = process.env.ADMIN_LOGIN || 'admin';
  const senha = process.env.ADMIN_PASSWORD || (PRODUCAO ? null : SENHA_INICIAL_DEV);
  if (!senha) {
    console.error('[erro] Em produção defina ADMIN_PASSWORD para criar o primeiro administrador.');
    process.exit(1);
  }
  db.prepare("INSERT INTO usuarios (nome, login, senha_hash, perfil, trocar_senha) VALUES (?, ?, ?, 'admin', ?)")
    .run(process.env.ADMIN_NOME || 'Administrador', login, hashSenha(senha), process.env.ADMIN_PASSWORD ? 0 : 1);
  console.log(`[info] Administrador inicial criado: login "${login}"${process.env.ADMIN_PASSWORD ? '' : ` / senha "${SENHA_INICIAL_DEV}" (troque no primeiro acesso)`}.`);
}

// ---------- sessão ----------
const COOKIE = 'sess_vertice';
const HORAS_SESSAO = 24 * 7;

function assinar(payload) {
  const corpo = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(corpo).digest('base64url');
  return `${corpo}.${sig}`;
}

function verificar(token) {
  if (!token) return null;
  const [corpo, sig] = token.split('.');
  if (!corpo || !sig) return null;
  const esperado = crypto.createHmac('sha256', SESSION_SECRET).update(corpo).digest('base64url');
  if (sig.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) return null;
  try {
    const payload = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function lerCookies(req) {
  const out = {};
  for (const parte of (req.headers.cookie || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
}

function definirSessao(res, usuario) {
  const token = assinar({ uid: usuario.id, v: usuario.senha_hash.slice(-12), exp: Date.now() + HORAS_SESSAO * 3600e3 });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: HORAS_SESSAO * 3600e3, secure: PRODUCAO });
}

/** Usuário da sessão, ou null. Bloquear o usuário ou trocar a senha derruba a sessão na hora. */
function usuarioDaSessao(req) {
  const s = verificar(lerCookies(req)[COOKIE]);
  const u = s && db.prepare('SELECT * FROM usuarios WHERE id = ? AND ativo = 1').get(s.uid);
  if (!u || u.senha_hash.slice(-12) !== s.v) return null;
  // Bloquear a empresa derruba na hora a sessão de todos os usuários dela.
  if (u.empresa_id && !db.prepare('SELECT ativo FROM empresas WHERE id = ?').get(u.empresa_id)?.ativo) return null;
  return u;
}

function exigirLogin(req, res, next) {
  const u = usuarioDaSessao(req);
  if (!u) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  req.usuario = u;
  next();
}

function exigirAdmin(req, res, next) {
  exigirLogin(req, res, () => {
    if (req.usuario.perfil !== 'admin') return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
    next();
  });
}

function auditar(req, acao, detalhe = '') {
  db.prepare('INSERT INTO auditoria (usuario, acao, detalhe, ip) VALUES (?, ?, ?, ?)')
    .run(req.usuario?.login || '-', acao, String(detalhe).slice(0, 500), req.ip || '');
}

// ---------- assinaturas (só para perfil usuário) ----------
const DIAS_ASSINATURA = 30;
const hojeISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const somarDias = (iso, dias) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10); };
const diasAte = (iso) => Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${hojeISO()}T12:00:00Z`)) / 86400000);
const dataValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))
  && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/** ok | aviso (vence em até N dias) | hoje | vencida | pendente (ainda não entrou) | isento (admin) */
function situacaoAssinatura(u, diasAviso = lerConfig().diasAviso) {
  if (u.perfil === 'admin') return { cod: 'isento', dias: null };
  if (!u.assinatura_vence) return { cod: 'pendente', dias: null };
  const dias = diasAte(u.assinatura_vence);
  return { cod: dias < 0 ? 'vencida' : dias === 0 ? 'hoje' : dias <= diasAviso ? 'aviso' : 'ok', dias };
}

const texto = (v, max = 300) => {
  const t = String(v ?? '').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};
const loginValido = (v) => /^[a-z0-9._@-]{3,80}$/i.test(String(v || ''));
const publico = (u) => ({
  id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, ativo: !!u.ativo,
  trocarSenha: !!u.trocar_senha, ultimoAcesso: u.ultimo_acesso, criadoEm: u.criado_em,
});
const telefoneValido = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length >= 10 && d.length <= 13 ? d : null; };
const paraAdmin = (u, diasAviso) => ({
  ...publico(u), telefone: u.telefone || '', assinaturaInicio: u.assinatura_inicio, assinaturaVence: u.assinatura_vence,
  assinatura: situacaoAssinatura(u, diasAviso), plano: N.PLANO_ASSINATURA[u.plano] ? u.plano : 'pf',
  periodo: N.PERIODO[u.periodo] ? u.periodo : 'mensal', ultimoValor: u.ultimo_valor ?? null, ultimaRenovacao: u.ultima_renovacao || null,
});

function transacao(fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ---------- app ----------
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
});
app.use(express.json({ limit: '4mb' }));

// Escritas na API só com JSON: um formulário de outro site não consegue enviar JSON sem pré-verificação (CSRF).
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ erro: 'Envie os dados em JSON.' });
  }
  next();
});

app.get('/healthz', (req, res) => res.send('ok'));

// ---------- páginas ----------
const pagina = (arquivo) => (req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(PUBLICO, arquivo)); };
app.get('/', (req, res, next) => (usuarioDaSessao(req) ? pagina('index.html')(req, res, next) : res.redirect('/entrar')));
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/guia', pagina('guia.html')); // guia do cliente: público, para enviar antes do primeiro acesso
app.get('/entrar', (req, res, next) => (usuarioDaSessao(req) ? res.redirect('/') : pagina('entrar.html')(req, res, next)));
app.use(express.static(PUBLICO, { index: false, extensions: false, setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') }));

// ---------- autenticação ----------
const falhas = new Map(); // ip -> { n, ate }
app.post('/api/login', (req, res) => {
  const ip = req.ip || '';
  const f = falhas.get(ip);
  if (f && f.n >= 8 && f.ate > Date.now()) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' });

  const login = texto(req.body?.login, 80);
  const u = login && db.prepare('SELECT * FROM usuarios WHERE login = ?').get(login);
  const senhaOk = u && conferirSenha(req.body?.senha || '', u.senha_hash);
  const empresaBloqueada = u?.empresa_id && !db.prepare('SELECT ativo FROM empresas WHERE id = ?').get(u.empresa_id)?.ativo;
  if (!senhaOk || !u.ativo || empresaBloqueada) {
    const atual = f && f.ate > Date.now() ? f : { n: 0 };
    falhas.set(ip, { n: atual.n + 1, ate: Date.now() + 10 * 60e3 });
    // Conta bloqueada só é revelada para quem acertou a senha.
    return res.status(401).json({ erro: senhaOk ? 'Seu acesso está bloqueado. Fale com o administrador.' : 'Usuário ou senha inválidos.' });
  }
  falhas.delete(ip);
  db.prepare("UPDATE usuarios SET ultimo_acesso = datetime('now') WHERE id = ?").run(u.id);
  if (u.empresa_id) {
    // Em empresas a assinatura é da empresa: começa no primeiro acesso de qualquer usuário dela.
    const hoje = hojeISO();
    db.prepare('UPDATE empresas SET assinatura_inicio = ?, assinatura_vence = ? WHERE id = ? AND assinatura_vence IS NULL').run(hoje, somarDias(hoje, DIAS_ASSINATURA), u.empresa_id);
  } else if (u.perfil !== 'admin' && !u.assinatura_vence) {
    const hoje = hojeISO();
    db.prepare('UPDATE usuarios SET assinatura_inicio = ?, assinatura_vence = ? WHERE id = ?').run(hoje, somarDias(hoje, DIAS_ASSINATURA), u.id);
  }
  definirSessao(res, u);
  req.usuario = u;
  auditar(req, 'entrou');
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/eu', exigirLogin, (req, res) => {
  const u = req.usuario;
  const emp = u.empresa_id && db.prepare('SELECT id, nome, plano FROM empresas WHERE id = ?').get(u.empresa_id);
  res.json({ ...publico(u), empresa: emp ? { id: emp.id, nome: emp.nome, plano: emp.plano, papel: u.papel || 'leitura' } : null });
});

app.put('/api/eu', exigirLogin, (req, res) => {
  const nome = texto(req.body?.nome, 120);
  if (!nome) return res.status(400).json({ erro: 'Informe seu nome.' });
  db.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').run(nome, req.usuario.id);
  res.json({ ok: true });
});

app.post('/api/eu/senha', exigirLogin, (req, res) => {
  const { atual, nova } = req.body || {};
  if (!conferirSenha(atual || '', req.usuario.senha_hash)) return res.status(400).json({ erro: 'Senha atual incorreta.' });
  if (String(nova || '').length < 8) return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 8 caracteres.' });
  if (nova === atual) return res.status(400).json({ erro: 'A nova senha precisa ser diferente da atual.' });
  const hash = hashSenha(nova);
  db.prepare('UPDATE usuarios SET senha_hash = ?, trocar_senha = 0 WHERE id = ?').run(hash, req.usuario.id);
  definirSessao(res, { ...req.usuario, senha_hash: hash });
  auditar(req, 'trocou a própria senha');
  res.json({ ok: true });
});

// ---------- dados financeiros (sempre do próprio usuário) ----------
// carteiras.dados guarda { lancamentos, planos, provisoes, cenarios }. Versões antigas guardavam só a lista de lançamentos.
function carteira(uid) {
  const c = db.prepare('SELECT dados, rev FROM carteiras WHERE usuario_id = ?').get(uid);
  if (!c) return { rev: 0, lancamentos: [], planos: [], provisoes: [], cenarios: [], tiposGasto: [] };
  const d = JSON.parse(c.dados);
  return Array.isArray(d)
    ? { rev: c.rev, lancamentos: d, planos: [], provisoes: [], cenarios: [], tiposGasto: [] }
    : { rev: c.rev, lancamentos: d.lancamentos || [], planos: d.planos || [], provisoes: d.provisoes || [], cenarios: d.cenarios || [], tiposGasto: d.tiposGasto || [] };
}

app.get('/api/dados', exigirLogin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(carteira(req.usuario.id));
});

app.put('/api/dados', exigirLogin, (req, res) => {
  const { rev, lancamentos, planos, provisoes, cenarios, tiposGasto } = req.body || {};
  if (!Number.isInteger(rev) || !Array.isArray(lancamentos) || (planos !== undefined && !Array.isArray(planos))
    || (provisoes !== undefined && !Array.isArray(provisoes)) || (cenarios !== undefined && !Array.isArray(cenarios)) || (tiposGasto !== undefined && !Array.isArray(tiposGasto))) {
    return res.status(400).json({ erro: 'Formato inválido.' });
  }
  if (lancamentos.length > MAX_LANCAMENTOS) return res.status(413).json({ erro: `Limite de ${MAX_LANCAMENTOS} lançamentos.` });
  if (planos && planos.length > N.LIMITES_PLANO.planos) return res.status(413).json({ erro: `Limite de ${N.LIMITES_PLANO.planos} planejamentos.` });
  const limpos = lancamentos.map(N.limpar);
  if (limpos.some((l) => !l)) return res.status(400).json({ erro: 'Há lançamentos inválidos.' });
  const planosLimpos = planos?.map(N.limparPlano);
  if (planosLimpos?.some((p) => !p)) return res.status(400).json({ erro: 'Há planejamentos inválidos.' });
  if (provisoes && provisoes.length > N.MAX_PROVISOES) return res.status(413).json({ erro: `Limite de ${N.MAX_PROVISOES} provisões.` });
  const provisoesLimpas = provisoes?.map(N.limparProvisao);
  if (provisoesLimpas?.some((p) => !p)) return res.status(400).json({ erro: 'Há provisões inválidas.' });
  if (cenarios && cenarios.length > N.MAX_CENARIOS) return res.status(413).json({ erro: `Limite de ${N.MAX_CENARIOS} cenários.` });
  const cenariosLimpos = cenarios?.map(N.limparCenario);
  if (cenariosLimpos?.some((c) => !c)) return res.status(400).json({ erro: 'Há cenários inválidos.' });
  if (tiposGasto && tiposGasto.length > N.MAX_TIPOS_PROPRIOS) return res.status(413).json({ erro: `Limite de ${N.MAX_TIPOS_PROPRIOS} tipos de gasto próprios.` });
  const tiposLimpos = tiposGasto && N.limparTiposGasto(tiposGasto);

  const r = transacao(() => {
    const atual = carteira(req.usuario.id);
    if (atual.rev !== rev) return { conflito: atual };
    const nova = rev + 1;
    db.prepare(`INSERT INTO carteiras (usuario_id, dados, rev) VALUES (?, ?, ?)
      ON CONFLICT (usuario_id) DO UPDATE SET dados = excluded.dados, rev = excluded.rev, atualizado_em = datetime('now')`)
      .run(req.usuario.id, JSON.stringify({ lancamentos: limpos, planos: planosLimpos || atual.planos, provisoes: provisoesLimpas || atual.provisoes, cenarios: cenariosLimpos || atual.cenarios, tiposGasto: tiposLimpos || atual.tiposGasto }), nova);
    return { rev: nova };
  });
  if (r.conflito) return res.status(409).json({ erro: 'Seus dados foram alterados em outro dispositivo.', ...r.conflito });
  res.json(r);
});

// ---------- administração de contas ----------
app.get('/api/admin/usuarios', exigirAdmin, (req, res) => {
  const { diasAviso } = lerConfig();
  res.json(db.prepare('SELECT * FROM usuarios WHERE empresa_id IS NULL ORDER BY ativo DESC, nome COLLATE NOCASE').all().map((u) => paraAdmin(u, diasAviso)));
});

app.post('/api/admin/usuarios', exigirAdmin, (req, res) => {
  const nome = texto(req.body?.nome, 120);
  const login = texto(req.body?.login, 80)?.toLowerCase();
  const perfil = req.body?.perfil === 'admin' ? 'admin' : 'usuario';
  const telefone = req.body?.telefone ? telefoneValido(req.body.telefone) : '';
  if (telefone === null) return res.status(400).json({ erro: 'Telefone inválido: use DDD + número, ex. (11) 98765-4321.' });
  if (!nome) return res.status(400).json({ erro: 'Informe o nome.' });
  if (!loginValido(login)) return res.status(400).json({ erro: 'Login inválido: use de 3 a 80 letras, números, ponto, hífen, _ ou @ (pode ser o e-mail).' });
  if (db.prepare('SELECT 1 FROM usuarios WHERE login = ?').get(login)) return res.status(409).json({ erro: 'Esse login já existe.' });
  // Usuário de empresa: papel e centros definidos só pela AR, dentro do limite do plano.
  let empresa = null, papel = null, centros = '[]';
  if (req.body?.empresaId != null) {
    empresa = empresas.empresaPorId(Number(req.body.empresaId));
    if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });
    papel = req.body.papel;
    const acesso = empresas.validarAcesso(empresa.id, papel, req.body.centros);
    if (acesso.erro) return res.status(400).json({ erro: acesso.erro });
    const limite = empresas.cabeNoPlano(empresa, papel, 1);
    if (limite) return res.status(400).json({ erro: limite });
    centros = JSON.stringify(acesso.centros);
  }
  const senha = senhaTemporaria();
  const r = db.prepare('INSERT INTO usuarios (nome, login, senha_hash, perfil, trocar_senha, telefone, empresa_id, papel, centros) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)')
    .run(nome, login, hashSenha(senha), empresa ? 'usuario' : perfil, telefone, empresa?.id ?? null, papel, centros);
  auditar(req, 'criou usuário', empresa ? `${login} (${papel} em ${empresa.nome})` : `${login} (${perfil})`);
  res.status(201).json({ id: Number(r.lastInsertRowid), login, senhaTemporaria: senha });
});

/** Regras que protegem o acesso administrativo: ninguém se tranca para fora e sempre sobra um admin ativo. */
function validarMudancaAdmin(req, alvo, { perfil = alvo.perfil, ativo = alvo.ativo, excluir = false }) {
  if (alvo.id === req.usuario.id && (excluir || perfil !== 'admin' || !ativo)) {
    return 'Você não pode bloquear, excluir ou remover o seu próprio acesso de administrador.';
  }
  if (alvo.perfil === 'admin' && alvo.ativo && (excluir || perfil !== 'admin' || !ativo)) {
    const outros = db.prepare("SELECT COUNT(*) n FROM usuarios WHERE perfil = 'admin' AND ativo = 1 AND id <> ?").get(alvo.id).n;
    if (!outros) return 'É preciso manter pelo menos um administrador ativo.';
  }
  return null;
}

function buscarAlvo(req, res) {
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(Number(req.params.id));
  if (!u) res.status(404).json({ erro: 'Usuário não encontrado.' });
  return u;
}

app.put('/api/admin/usuarios/:id', exigirAdmin, (req, res) => {
  const u = buscarAlvo(req, res);
  if (!u) return;
  const nome = texto(req.body?.nome, 120) || u.nome;
  // Usuário de empresa nunca vira administrador.
  const perfil = u.empresa_id ? 'usuario' : req.body?.perfil ? (req.body.perfil === 'admin' ? 'admin' : 'usuario') : u.perfil;
  const ativo = req.body?.ativo === undefined ? u.ativo : (req.body.ativo ? 1 : 0);
  const erro = validarMudancaAdmin(req, u, { perfil, ativo });
  if (erro) return res.status(400).json({ erro });
  let papel = u.papel, centros = u.centros;
  if (u.empresa_id) {
    const empresa = empresas.empresaPorId(u.empresa_id);
    papel = req.body?.papel ?? u.papel;
    const acesso = empresas.validarAcesso(u.empresa_id, papel, req.body?.centros ?? empresas.centrosDe(u));
    if (acesso.erro) return res.status(400).json({ erro: acesso.erro });
    const pesaAgora = ativo && E.PAPEL[papel]?.pago, pesavaAntes = u.ativo && E.PAPEL[u.papel]?.pago;
    const limite = pesaAgora && !pesavaAntes && empresas.cabeNoPlano(empresa, papel, ativo, u.id);
    if (limite) return res.status(400).json({ erro: limite });
    centros = JSON.stringify(acesso.centros);
  }
  let telefone = u.telefone || '';
  if (req.body?.telefone !== undefined) {
    telefone = req.body.telefone ? telefoneValido(req.body.telefone) : '';
    if (telefone === null) return res.status(400).json({ erro: 'Telefone inválido: use DDD + número, ex. (11) 98765-4321.' });
  }
  let vence = u.assinatura_vence;
  if (req.body?.assinaturaVence !== undefined) {
    vence = req.body.assinaturaVence || null;
    if (vence && !dataValida(vence)) return res.status(400).json({ erro: 'Data de vencimento inválida.' });
  }
  db.prepare('UPDATE usuarios SET nome = ?, perfil = ?, ativo = ?, telefone = ?, assinatura_vence = ?, assinatura_inicio = COALESCE(assinatura_inicio, CASE WHEN ? IS NULL THEN NULL ELSE ? END), papel = ?, centros = ? WHERE id = ?')
    .run(nome, perfil, ativo, telefone, vence, vence, hojeISO(), papel, centros, u.id);
  const mudancas = [
    papel !== u.papel && `papel ${papel}`, centros !== u.centros && 'centros de custo',
    vence !== u.assinatura_vence && `vencimento ${vence ? vence.split('-').reverse().join('/') : 'removido'}`,
    telefone !== (u.telefone || '') && 'telefone',
    nome !== u.nome && `nome "${nome}"`,
    perfil !== u.perfil && `perfil ${perfil}`,
    ativo !== u.ativo && (ativo ? 'desbloqueado' : 'bloqueado'),
  ].filter(Boolean);
  if (mudancas.length) auditar(req, ativo !== u.ativo ? (ativo ? 'desbloqueou usuário' : 'bloqueou usuário') : 'alterou usuário', `${u.login}: ${mudancas.join(', ')}`);
  res.json({ ok: true });
});

/**
 * Renova pelo período pago (mensal 30, trimestral 90, semestral 180, anual 365 dias),
 * a partir do vencimento atual, ou de hoje se já venceu (ou nunca começou). Registra o valor pago.
 */
app.post('/api/admin/usuarios/:id/renovar', exigirAdmin, (req, res) => {
  const u = buscarAlvo(req, res);
  if (!u) return;
  if (u.perfil === 'admin') return res.status(400).json({ erro: 'Administradores não têm assinatura.' });
  if (u.empresa_id) return res.status(400).json({ erro: 'Usuários de empresa seguem a assinatura da empresa: renove pela empresa.' });
  const periodo = req.body?.periodo ?? 'mensal';
  if (!N.PERIODO[periodo]) return res.status(400).json({ erro: 'Período inválido.' });
  const plano = N.PLANO_ASSINATURA[u.plano] ? u.plano : 'pf';
  let valor = req.body?.valor;
  if (valor === undefined || valor === null) valor = N.precoPeriodo(lerConfig().precos, plano, periodo).total;
  if (!Number.isInteger(valor) || valor < 0 || valor > 100000000) return res.status(400).json({ erro: 'Valor pago inválido.' });
  const hoje = hojeISO();
  const base = u.assinatura_vence && u.assinatura_vence > hoje ? u.assinatura_vence : hoje;
  const vence = somarDias(base, N.PERIODO[periodo].dias);
  transacao(() => {
    db.prepare(`UPDATE usuarios SET assinatura_vence = ?, assinatura_inicio = COALESCE(assinatura_inicio, ?), periodo = ?, ultimo_valor = ?, ultima_renovacao = ?
      WHERE id = ?`).run(vence, hoje, periodo, valor, hoje, u.id);
    db.prepare('INSERT INTO renovacoes (usuario_id, periodo, centavos, de, ate) VALUES (?, ?, ?, ?, ?)').run(u.id, periodo, valor, base, vence);
  });
  auditar(req, 'renovou assinatura', `${u.login}: ${N.PERIODO[periodo].nome} · ${N.moeda(valor)} · até ${vence.split('-').reverse().join('/')}`);
  res.json({ assinaturaVence: vence, periodo, valor });
});

app.get('/api/admin/config', exigirAdmin, (req, res) => res.json({ ...lerConfig(), mensagemPadrao: CONFIG_PADRAO.mensagem_aviso }));

app.put('/api/admin/config', exigirAdmin, (req, res) => {
  const { mensalidade, diasAviso, mensagem, precos, whatsappAR } = req.body || {};
  const whats = whatsappAR === undefined ? undefined : (whatsappAR ? telefoneValido(whatsappAR) : '');
  if (whats === null) return res.status(400).json({ erro: 'WhatsApp da AR inválido: use DDD + número.' });
  if (mensalidade !== undefined && !(Number.isInteger(mensalidade) && mensalidade > 0 && mensalidade <= 10000000)) {
    return res.status(400).json({ erro: 'Valor da mensalidade inválido.' });
  }
  const atuais = lerConfig().precos;
  const novosPrecos = precos === undefined ? null : N.limparPrecos(precos, atuais);
  if (precos !== undefined && !novosPrecos) return res.status(400).json({ erro: 'Há preços inválidos na tabela de planos.' });
  if (diasAviso !== undefined && !(Number.isInteger(diasAviso) && diasAviso >= 1 && diasAviso <= 30)) {
    return res.status(400).json({ erro: 'Os dias de aviso devem ficar entre 1 e 30.' });
  }
  if (mensagem !== undefined && !String(mensagem).trim()) return res.status(400).json({ erro: 'A mensagem não pode ficar vazia.' });
  if (novosPrecos || mensalidade !== undefined) {
    const tabela = novosPrecos || atuais;
    if (mensalidade !== undefined) tabela.pf.mensal = mensalidade;
    gravarConfig('precos_planos', JSON.stringify(tabela));
  }
  if (diasAviso !== undefined) gravarConfig('dias_aviso', diasAviso);
  if (whats !== undefined) gravarConfig('whatsapp_ar', whats);
  if (mensagem !== undefined) gravarConfig('mensagem_aviso', String(mensagem).replace(/\r/g, '').trim().slice(0, 2000));
  auditar(req, 'alterou as configurações de assinatura');
  res.json(lerConfig());
});

app.post('/api/admin/usuarios/:id/senha', exigirAdmin, (req, res) => {
  const u = buscarAlvo(req, res);
  if (!u) return;
  if (u.id === req.usuario.id) return res.status(400).json({ erro: 'Para a sua própria senha, use "Trocar senha" em Minha conta.' });
  const senha = senhaTemporaria();
  // Trocar o hash derruba as sessões abertas do usuário.
  db.prepare('UPDATE usuarios SET senha_hash = ?, trocar_senha = 1 WHERE id = ?').run(hashSenha(senha), u.id);
  auditar(req, 'redefiniu a senha', u.login);
  res.json({ senhaTemporaria: senha });
});

app.delete('/api/admin/usuarios/:id', exigirAdmin, (req, res) => {
  const u = buscarAlvo(req, res);
  if (!u) return;
  const erro = validarMudancaAdmin(req, u, { excluir: true });
  if (erro) return res.status(400).json({ erro });
  if (String(req.body?.confirmar || '').toLowerCase() !== u.login.toLowerCase()) {
    return res.status(400).json({ erro: 'Confirme digitando o login do usuário.' });
  }
  db.prepare('DELETE FROM renovacoes WHERE usuario_id = ?').run(u.id);
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(u.id); // a carteira cai junto (ON DELETE CASCADE)
  auditar(req, 'excluiu usuário', u.login);
  res.json({ ok: true });
});

app.get('/api/admin/auditoria', exigirAdmin, (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 200, 1000);
  res.json(db.prepare('SELECT usuario, acao, detalhe, criado_em FROM auditoria ORDER BY id DESC LIMIT ?').all(limite));
});

// ---------- erros ----------
// ---------- Vértice Empresas ----------
const empresas = require('./empresas')(app, {
  db, exigirLogin, exigirAdmin, auditar, lerConfig, transacao, hojeISO, somarDias, diasAte, dataValida, texto, telefoneValido,
});

app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Dados grandes demais.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[info] Vértice em http://localhost:${PORT}`));
}

module.exports = { app };
