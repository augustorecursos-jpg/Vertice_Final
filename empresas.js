// Vértice Empresas: dados da empresa (com papéis) e administração central pela AR.
const N = require('./public/js/nucleo.js');
const E = require('./public/js/nucleo-empresa.js');

const TIPOS_SOLICITACAO = {
  novo_usuario: 'Novo usuário', mudar_papel: 'Mudar papel', bloquear: 'Bloquear usuário', plano: 'Mudar de plano', outro: 'Outro',
};

module.exports = function montarEmpresas(app, ctx) {
  const { db, exigirLogin, exigirAdmin, auditar, lerConfig, transacao, hojeISO, somarDias, diasAte, dataValida, texto, telefoneValido } = ctx;

  // ---------- leitura ----------
  const empresaPorId = (id) => db.prepare('SELECT * FROM empresas WHERE id = ?').get(id);
  const lerJSON = (s, padrao) => { try { return JSON.parse(s); } catch { return padrao; } };
  const centrosDe = (u) => (Array.isArray(lerJSON(u.centros, [])) ? lerJSON(u.centros, []) : []);
  function estruturaDe(empresaId) {
    const r = db.prepare('SELECT dados, rev FROM pj_estrutura WHERE empresa_id = ?').get(empresaId);
    return r ? { ...JSON.parse(r.dados), rev: r.rev } : { ...E.estruturaPadrao(), rev: 0 };
  }
  const planoDe = (emp) => N.PLANO_ASSINATURA[emp.plano] || N.PLANO_ASSINATURA.essencial;
  const usuariosPagos = (empresaId, excetoId = 0) => db.prepare(
    "SELECT COUNT(*) n FROM usuarios WHERE empresa_id = ? AND ativo = 1 AND COALESCE(papel, 'leitura') <> 'leitura' AND id <> ?",
  ).get(empresaId, excetoId).n;

  function situacao(emp, diasAviso = lerConfig().diasAviso) {
    if (!emp.assinatura_vence) return { cod: 'pendente', dias: null };
    const dias = diasAte(emp.assinatura_vence);
    return { cod: dias < 0 ? 'vencida' : dias === 0 ? 'hoje' : dias <= diasAviso ? 'aviso' : 'ok', dias };
  }
  const publicaEmpresa = (emp, diasAviso) => ({
    id: emp.id, nome: emp.nome, cnpj: emp.cnpj || '', telefone: emp.telefone || '', plano: planoDe(emp).id,
    periodo: N.PERIODO[emp.periodo] ? emp.periodo : 'mensal', ativo: !!emp.ativo, assinaturaInicio: emp.assinatura_inicio,
    assinaturaVence: emp.assinatura_vence, assinatura: situacao(emp, diasAviso), ultimoValor: emp.ultimo_valor ?? null,
    ultimaRenovacao: emp.ultima_renovacao || null, limiteUsuarios: planoDe(emp).usuarios, criadoEm: emp.criado_em,
  });
  const membro = (u) => ({
    id: u.id, nome: u.nome, login: u.login, papel: E.PAPEL[u.papel] ? u.papel : 'leitura', centros: centrosDe(u),
    ativo: !!u.ativo, ultimoAcesso: u.ultimo_acesso, trocarSenha: !!u.trocar_senha,
  });

  /** Centros válidos para um usuário: gestor precisa de pelo menos um; os demais papéis veem todos. */
  function validarAcesso(empresaId, papel, centros) {
    if (!E.PAPEL[papel]) return { erro: 'Papel inválido.' };
    if (papel !== 'gestor') return { centros: [] };
    const validos = new Set(estruturaDe(empresaId).centros.map((c) => c.id));
    const lista = [...new Set(Array.isArray(centros) ? centros.map(String) : [])];
    if (!lista.length) return { erro: 'Escolha pelo menos um centro de custo para o gestor.' };
    if (lista.some((c) => !validos.has(c))) return { erro: 'Centro de custo inválido.' };
    return { centros: lista };
  }
  function cabeNoPlano(emp, papel, ativo, excetoId = 0) {
    if (!ativo || !E.PAPEL[papel]?.pago) return null;
    const pl = planoDe(emp);
    return usuariosPagos(emp.id, excetoId) + 1 > pl.usuarios
      ? `O plano ${pl.nome} permite ${pl.usuarios} usuários (usuários de leitura não contam). Mude o plano ou use o papel Leitura.` : null;
  }

  // ---------- usuário da empresa ----------
  function exigirEmpresa(req, res, next) {
    exigirLogin(req, res, () => {
      const u = req.usuario;
      if (!u.empresa_id) return res.status(403).json({ erro: 'Esta conta não pertence a uma empresa.' });
      const emp = empresaPorId(u.empresa_id);
      if (!emp || !emp.ativo) return res.status(403).json({ erro: 'O acesso da empresa está bloqueado. Fale com a AR Consultoria.' });
      req.empresa = emp;
      req.papel = E.PAPEL[u.papel] ? u.papel : 'leitura';
      req.centros = req.papel === 'gestor' ? centrosDe(u) : null;
      next();
    });
  }
  const permitir = (acao) => (req, res, next) => (E.pode(req.papel, acao) ? next()
    : res.status(403).json({ erro: 'Seu papel na empresa não permite esta ação.' }));
  const doCentro = (req, centro) => !req.centros || (centro && req.centros.includes(centro));

  const lancamentosDe = (req) => db.prepare('SELECT dados FROM pj_lancamentos WHERE empresa_id = ?').all(req.empresa.id)
    .map((r) => JSON.parse(r.dados)).filter((l) => doCentro(req, l.centro));
  function orcamentosDe(req) {
    return db.prepare('SELECT * FROM pj_orcamentos WHERE empresa_id = ? ORDER BY ano DESC, id DESC').all(req.empresa.id).map((o) => {
      let valores = JSON.parse(o.valores);
      if (req.centros) { // gestor: só a parte dos centros dele
        valores = Object.fromEntries(Object.entries(valores).map(([c, pb]) => [c, Object.fromEntries(Object.entries(pb).filter(([b]) => req.centros.includes(b)))])
          .filter(([, pb]) => Object.keys(pb).length));
      }
      return { id: o.id, ano: o.ano, nome: o.nome, status: o.status, autor: o.autor, criadoEm: o.criado_em, aprovadoPor: o.aprovado_por, aprovadoEm: o.aprovado_em, valores };
    });
  }

  app.get('/api/empresa', exigirEmpresa, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const est = estruturaDe(req.empresa.id);
    const equipe = db.prepare('SELECT * FROM usuarios WHERE empresa_id = ? ORDER BY ativo DESC, nome COLLATE NOCASE').all(req.empresa.id).map(membro);
    res.json({
      empresa: { ...publicaEmpresa(req.empresa), usuariosPagos: usuariosPagos(req.empresa.id) },
      eu: { id: req.usuario.id, papel: req.papel, centros: req.centros || [] },
      estrutura: { contas: est.contas, centros: est.centros, saldoInicial: req.centros ? 0 : est.saldoInicial }, rev: est.rev,
      lancamentos: lancamentosDe(req), orcamentos: orcamentosDe(req), equipe,
      whatsappAR: lerConfig().whatsappAR,
    });
  });

  app.post('/api/empresa/lancamentos', exigirEmpresa, permitir('lancar'), (req, res) => {
    const lista = req.body?.lancamentos;
    if (!Array.isArray(lista) || !lista.length || lista.length > E.LIMITES.serie) return res.status(400).json({ erro: 'Formato inválido.' });
    const total = db.prepare('SELECT COUNT(*) n FROM pj_lancamentos WHERE empresa_id = ?').get(req.empresa.id).n;
    if (total + lista.length > E.LIMITES.lancamentos) return res.status(413).json({ erro: `Limite de ${E.LIMITES.lancamentos} lançamentos.` });
    const est = estruturaDe(req.empresa.id);
    const limpos = lista.map((l) => E.limparLancamento({ ...l, pago: !!l.pago }, est));
    if (limpos.some((l) => !l)) return res.status(400).json({ erro: 'Há lançamentos inválidos.' });
    if (limpos.some((l) => !doCentro(req, l.centro))) return res.status(403).json({ erro: 'Você só pode lançar nos seus centros de custo.' });
    try {
      transacao(() => {
        const ins = db.prepare('INSERT INTO pj_lancamentos (id, empresa_id, centro, conta, dados, atualizado_por) VALUES (?, ?, ?, ?, ?, ?)');
        for (const l of limpos) ins.run(l.id, req.empresa.id, l.centro, l.conta, JSON.stringify(l), req.usuario.login);
      });
    } catch { return res.status(409).json({ erro: 'Lançamento repetido. Atualize a página.' }); }
    res.status(201).json({ lancamentos: limpos });
  });

  app.put('/api/empresa/lancamentos/:id', exigirEmpresa, permitir('lancar'), (req, res) => {
    const r = db.prepare('SELECT dados FROM pj_lancamentos WHERE id = ? AND empresa_id = ?').get(String(req.params.id), req.empresa.id);
    if (!r) return res.status(404).json({ erro: 'Lançamento não encontrado. Atualize a página.' });
    const antigo = JSON.parse(r.dados);
    if (!doCentro(req, antigo.centro)) return res.status(403).json({ erro: 'Você só pode alterar lançamentos dos seus centros de custo.' });
    const novo = E.limparLancamento({ ...antigo, ...req.body, id: antigo.id, grupo: antigo.grupo, parcela: antigo.parcela, criadoEm: antigo.criadoEm }, estruturaDe(req.empresa.id));
    if (!novo) return res.status(400).json({ erro: 'Lançamento inválido.' });
    if (!doCentro(req, novo.centro)) return res.status(403).json({ erro: 'Você só pode lançar nos seus centros de custo.' });
    db.prepare("UPDATE pj_lancamentos SET centro = ?, conta = ?, dados = ?, atualizado_em = datetime('now'), atualizado_por = ? WHERE id = ? AND empresa_id = ?")
      .run(novo.centro, novo.conta, JSON.stringify(novo), req.usuario.login, novo.id, req.empresa.id);
    res.json({ lancamento: novo });
  });

  app.post('/api/empresa/lancamentos/excluir', exigirEmpresa, permitir('lancar'), (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 500) return res.status(400).json({ erro: 'Formato inválido.' });
    const linhas = ids.map((id) => db.prepare('SELECT id, centro FROM pj_lancamentos WHERE id = ? AND empresa_id = ?').get(String(id), req.empresa.id)).filter(Boolean);
    if (linhas.some((l) => !doCentro(req, l.centro))) return res.status(403).json({ erro: 'Você só pode excluir lançamentos dos seus centros de custo.' });
    transacao(() => { for (const l of linhas) db.prepare('DELETE FROM pj_lancamentos WHERE id = ? AND empresa_id = ?').run(l.id, req.empresa.id); });
    res.json({ excluidos: linhas.length });
  });

  app.put('/api/empresa/estrutura', exigirEmpresa, permitir('estrutura'), (req, res) => {
    const nova = E.limparEstrutura(req.body || {});
    if (!nova) return res.status(400).json({ erro: 'Plano de contas ou centros inválidos.' });
    const atual = estruturaDe(req.empresa.id);
    if (req.body.rev !== atual.rev) return res.status(409).json({ erro: 'O plano de contas foi alterado por outra pessoa. Carreguei a versão atual.', estrutura: atual, rev: atual.rev });
    const contas = new Set(nova.contas.map((c) => c.id)), centros = new Set(nova.centros.map((c) => c.id));
    const emUso = db.prepare('SELECT conta, centro FROM pj_lancamentos WHERE empresa_id = ?').all(req.empresa.id);
    const orcs = db.prepare('SELECT valores FROM pj_orcamentos WHERE empresa_id = ?').all(req.empresa.id).map((o) => JSON.parse(o.valores));
    const contaUsada = (id) => emUso.some((l) => l.conta === id) || orcs.some((v) => v[id]);
    const centroUsado = (id) => emUso.some((l) => l.centro === id) || orcs.some((v) => Object.values(v).some((pb) => pb[id]))
      || db.prepare("SELECT 1 FROM usuarios WHERE empresa_id = ? AND centros LIKE ?").get(req.empresa.id, `%"${id.replace(/[%_"]/g, '')}"%`);
    const contaRemovida = atual.contas.find((c) => !contas.has(c.id) && contaUsada(c.id));
    if (contaRemovida) return res.status(400).json({ erro: `A conta “${contaRemovida.nome}” já tem lançamentos ou orçamento. Desative em vez de excluir.` });
    const centroRemovido = atual.centros.find((c) => !centros.has(c.id) && centroUsado(c.id));
    if (centroRemovido) return res.status(400).json({ erro: `O centro “${centroRemovido.nome}” já está em uso. Desative em vez de excluir.` });
    const trocouGrupo = atual.contas.find((c) => contas.has(c.id) && c.grupo !== nova.contas.find((n) => n.id === c.id).grupo && contaUsada(c.id));
    if (trocouGrupo) return res.status(400).json({ erro: `A conta “${trocouGrupo.nome}” já está em uso e não pode mudar de grupo.` });
    const rev = atual.rev + 1;
    db.prepare('INSERT INTO pj_estrutura (empresa_id, dados, rev) VALUES (?, ?, ?) ON CONFLICT (empresa_id) DO UPDATE SET dados = excluded.dados, rev = excluded.rev')
      .run(req.empresa.id, JSON.stringify(nova), rev);
    auditar(req, 'alterou o plano de contas da empresa', req.empresa.nome);
    res.json({ estrutura: nova, rev });
  });

  app.post('/api/empresa/orcamentos', exigirEmpresa, permitir('orcamento'), (req, res) => {
    const ano = Number(req.body?.ano), nome = texto(req.body?.nome, 80);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) return res.status(400).json({ erro: 'Ano inválido.' });
    if (!nome) return res.status(400).json({ erro: 'Dê um nome para a versão.' });
    const valores = E.limparValoresOrcamento(req.body?.valores, estruturaDe(req.empresa.id));
    if (!valores) return res.status(400).json({ erro: 'Valores do orçamento inválidos.' });
    if (db.prepare('SELECT COUNT(*) n FROM pj_orcamentos WHERE empresa_id = ? AND ano = ?').get(req.empresa.id, ano).n >= 50) {
      return res.status(413).json({ erro: 'Limite de 50 versões por ano.' });
    }
    const aprovar = req.papel === 'dono';
    const id = transacao(() => {
      if (aprovar) db.prepare("UPDATE pj_orcamentos SET status = 'substituida' WHERE empresa_id = ? AND ano = ? AND status = 'vigente'").run(req.empresa.id, ano);
      return Number(db.prepare(`INSERT INTO pj_orcamentos (empresa_id, ano, nome, valores, status, autor, aprovado_por, aprovado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ${aprovar ? "datetime('now')" : 'NULL'})`)
        .run(req.empresa.id, ano, nome, JSON.stringify(valores), aprovar ? 'vigente' : 'proposta', req.usuario.nome, aprovar ? req.usuario.nome : null).lastInsertRowid);
    });
    auditar(req, aprovar ? 'aprovou orçamento' : 'propôs orçamento', `${req.empresa.nome} · ${ano} · ${nome}`);
    res.status(201).json({ id, status: aprovar ? 'vigente' : 'proposta' });
  });

  app.post('/api/empresa/orcamentos/:id/aprovar', exigirEmpresa, permitir('aprovar'), (req, res) => {
    const o = db.prepare('SELECT * FROM pj_orcamentos WHERE id = ? AND empresa_id = ?').get(Number(req.params.id), req.empresa.id);
    if (!o) return res.status(404).json({ erro: 'Versão não encontrada.' });
    transacao(() => {
      db.prepare("UPDATE pj_orcamentos SET status = 'substituida' WHERE empresa_id = ? AND ano = ? AND status = 'vigente'").run(req.empresa.id, o.ano);
      db.prepare("UPDATE pj_orcamentos SET status = 'vigente', aprovado_por = ?, aprovado_em = datetime('now') WHERE id = ?").run(req.usuario.nome, o.id);
    });
    auditar(req, 'aprovou orçamento', `${req.empresa.nome} · ${o.ano} · ${o.nome}`);
    res.json({ ok: true });
  });

  app.post('/api/empresa/solicitacoes', exigirEmpresa, permitir('solicitar'), (req, res) => {
    const tipo = req.body?.tipo;
    if (!TIPOS_SOLICITACAO[tipo]) return res.status(400).json({ erro: 'Escolha o que você precisa.' });
    const d = req.body?.detalhes || {};
    const detalhes = { nome: texto(d.nome, 120) || '', email: texto(d.email, 120) || '', papel: E.PAPEL[d.papel] ? d.papel : '', centro: texto(d.centro, 80) || '', mensagem: String(d.mensagem ?? '').trim().slice(0, 1000) };
    if (!detalhes.nome && !detalhes.mensagem) return res.status(400).json({ erro: 'Informe o nome da pessoa ou descreva o pedido.' });
    if (db.prepare("SELECT COUNT(*) n FROM solicitacoes WHERE empresa_id = ? AND status = 'aberta'").get(req.empresa.id).n >= 30) {
      return res.status(429).json({ erro: 'Há muitas solicitações abertas. Aguarde a AR responder.' });
    }
    db.prepare('INSERT INTO solicitacoes (empresa_id, autor, tipo, detalhes) VALUES (?, ?, ?, ?)').run(req.empresa.id, req.usuario.nome, tipo, JSON.stringify(detalhes));
    auditar(req, 'enviou solicitação à AR', `${req.empresa.nome} · ${TIPOS_SOLICITACAO[tipo]}`);
    res.status(201).json({ ok: true });
  });

  // ---------- administração AR ----------
  function buscarEmpresa(req, res) {
    const e = empresaPorId(Number(req.params.id));
    if (!e) res.status(404).json({ erro: 'Empresa não encontrada.' });
    return e;
  }
  const cnpjValido = (v) => { const d = String(v || '').replace(/\D/g, ''); return !d ? '' : d.length === 14 ? d : null; };

  app.get('/api/admin/empresas', exigirAdmin, (req, res) => {
    const { diasAviso } = lerConfig();
    const lista = db.prepare('SELECT * FROM empresas ORDER BY ativo DESC, nome COLLATE NOCASE').all().map((e) => ({
      ...publicaEmpresa(e, diasAviso),
      usuarios: db.prepare('SELECT COUNT(*) n FROM usuarios WHERE empresa_id = ?').get(e.id).n,
      usuariosPagos: usuariosPagos(e.id),
      centros: estruturaDe(e.id).centros.map((c) => ({ id: c.id, nome: c.nome, ativo: c.ativo })),
      solicitacoes: db.prepare("SELECT COUNT(*) n FROM solicitacoes WHERE empresa_id = ? AND status = 'aberta'").get(e.id).n,
    }));
    res.json(lista);
  });

  app.post('/api/admin/empresas', exigirAdmin, (req, res) => {
    const nome = texto(req.body?.nome, 120);
    if (!nome) return res.status(400).json({ erro: 'Informe o nome da empresa.' });
    const cnpj = cnpjValido(req.body?.cnpj);
    if (cnpj === null) return res.status(400).json({ erro: 'CNPJ inválido: use os 14 números.' });
    const plano = N.PLANO_ASSINATURA[req.body?.plano]?.empresa ? req.body.plano : 'essencial';
    const telefone = req.body?.telefone ? telefoneValido(req.body.telefone) : '';
    if (telefone === null) return res.status(400).json({ erro: 'Telefone inválido: use DDD + número.' });
    const id = transacao(() => {
      const r = db.prepare('INSERT INTO empresas (nome, cnpj, telefone, plano) VALUES (?, ?, ?, ?)').run(nome, cnpj, telefone, plano);
      const eid = Number(r.lastInsertRowid);
      db.prepare('INSERT INTO pj_estrutura (empresa_id, dados, rev) VALUES (?, ?, 1)').run(eid, JSON.stringify(E.estruturaPadrao()));
      return eid;
    });
    auditar(req, 'criou empresa', `${nome} (${N.PLANO_ASSINATURA[plano].nome})`);
    res.status(201).json({ id });
  });

  app.put('/api/admin/empresas/:id', exigirAdmin, (req, res) => {
    const e = buscarEmpresa(req, res);
    if (!e) return;
    const b = req.body || {};
    const nome = b.nome === undefined ? e.nome : texto(b.nome, 120);
    if (!nome) return res.status(400).json({ erro: 'Informe o nome da empresa.' });
    const cnpj = b.cnpj === undefined ? e.cnpj : cnpjValido(b.cnpj);
    if (cnpj === null) return res.status(400).json({ erro: 'CNPJ inválido: use os 14 números.' });
    const telefone = b.telefone === undefined ? e.telefone : (b.telefone ? telefoneValido(b.telefone) : '');
    if (telefone === null) return res.status(400).json({ erro: 'Telefone inválido: use DDD + número.' });
    const plano = b.plano === undefined ? e.plano : b.plano;
    if (!N.PLANO_ASSINATURA[plano]?.empresa) return res.status(400).json({ erro: 'Plano inválido.' });
    if (plano !== e.plano && usuariosPagos(e.id) > N.PLANO_ASSINATURA[plano].usuarios) {
      return res.status(400).json({ erro: `O plano ${N.PLANO_ASSINATURA[plano].nome} permite ${N.PLANO_ASSINATURA[plano].usuarios} usuários e a empresa tem ${usuariosPagos(e.id)} ativos. Passe alguém para Leitura ou bloqueie antes.` });
    }
    const ativo = b.ativo === undefined ? e.ativo : (b.ativo ? 1 : 0);
    let vence = e.assinatura_vence;
    if (b.assinaturaVence !== undefined) {
      vence = b.assinaturaVence || null;
      if (vence && !dataValida(vence)) return res.status(400).json({ erro: 'Data de vencimento inválida.' });
    }
    db.prepare('UPDATE empresas SET nome = ?, cnpj = ?, telefone = ?, plano = ?, ativo = ?, assinatura_vence = ? WHERE id = ?')
      .run(nome, cnpj, telefone, plano, ativo, vence, e.id);
    const mudancas = [
      nome !== e.nome && `nome "${nome}"`, plano !== e.plano && `plano ${N.PLANO_ASSINATURA[plano].nome}`,
      vence !== e.assinatura_vence && `vencimento ${vence ? vence.split('-').reverse().join('/') : 'removido'}`,
      ativo !== e.ativo && (ativo ? 'desbloqueada' : 'bloqueada (todos os usuários)'),
      (cnpj || '') !== (e.cnpj || '') && 'CNPJ', (telefone || '') !== (e.telefone || '') && 'telefone',
    ].filter(Boolean);
    if (mudancas.length) auditar(req, ativo !== e.ativo ? (ativo ? 'desbloqueou empresa' : 'bloqueou empresa') : 'alterou empresa', `${nome}: ${mudancas.join(', ')}`);
    res.json({ ok: true });
  });

  app.post('/api/admin/empresas/:id/renovar', exigirAdmin, (req, res) => {
    const e = buscarEmpresa(req, res);
    if (!e) return;
    const periodo = req.body?.periodo ?? 'mensal';
    if (!N.PERIODO[periodo]) return res.status(400).json({ erro: 'Período inválido.' });
    let valor = req.body?.valor;
    if (valor === undefined || valor === null) valor = N.precoPeriodo(lerConfig().precos, planoDe(e).id, periodo).total;
    if (!Number.isInteger(valor) || valor < 0 || valor > 100000000) return res.status(400).json({ erro: 'Valor pago inválido.' });
    const hoje = hojeISO();
    const base = e.assinatura_vence && e.assinatura_vence > hoje ? e.assinatura_vence : hoje;
    const vence = somarDias(base, N.PERIODO[periodo].dias);
    transacao(() => {
      db.prepare('UPDATE empresas SET assinatura_vence = ?, assinatura_inicio = COALESCE(assinatura_inicio, ?), periodo = ?, ultimo_valor = ?, ultima_renovacao = ? WHERE id = ?')
        .run(vence, hoje, periodo, valor, hoje, e.id);
      db.prepare('INSERT INTO renovacoes_empresas (empresa_id, periodo, centavos, de, ate) VALUES (?, ?, ?, ?, ?)').run(e.id, periodo, valor, base, vence);
    });
    auditar(req, 'renovou assinatura da empresa', `${e.nome}: ${planoDe(e).nome} · ${N.PERIODO[periodo].nome} · ${N.moeda(valor)} · até ${vence.split('-').reverse().join('/')}`);
    res.json({ assinaturaVence: vence, periodo, valor });
  });

  app.delete('/api/admin/empresas/:id', exigirAdmin, (req, res) => {
    const e = buscarEmpresa(req, res);
    if (!e) return;
    if (String(req.body?.confirmacao || '').trim() !== e.nome) return res.status(400).json({ erro: 'Confirme digitando o nome exato da empresa.' });
    transacao(() => {
      db.prepare('DELETE FROM usuarios WHERE empresa_id = ?').run(e.id);
      db.prepare('DELETE FROM empresas WHERE id = ?').run(e.id);
    });
    auditar(req, 'excluiu empresa', e.nome);
    res.json({ ok: true });
  });

  app.get('/api/admin/empresas/:id/usuarios', exigirAdmin, (req, res) => {
    const e = buscarEmpresa(req, res);
    if (!e) return;
    res.json(db.prepare('SELECT * FROM usuarios WHERE empresa_id = ? ORDER BY ativo DESC, nome COLLATE NOCASE').all(e.id).map((u) => ({ ...membro(u), telefone: u.telefone || '' })));
  });

  app.get('/api/admin/solicitacoes', exigirAdmin, (req, res) => {
    const status = req.query.status === 'todas' ? null : 'aberta';
    res.json(db.prepare(`SELECT s.*, e.nome empresa FROM solicitacoes s JOIN empresas e ON e.id = s.empresa_id
      ${status ? "WHERE s.status = 'aberta'" : ''} ORDER BY s.id DESC LIMIT 200`).all().map((s) => ({
      id: s.id, empresaId: s.empresa_id, empresa: s.empresa, autor: s.autor, tipo: s.tipo, tipoNome: TIPOS_SOLICITACAO[s.tipo] || s.tipo,
      detalhes: lerJSON(s.detalhes, {}), status: s.status, criadoEm: s.criado_em, resolvidoPor: s.resolvido_por, resolvidoEm: s.resolvido_em,
    })));
  });

  app.put('/api/admin/solicitacoes/:id', exigirAdmin, (req, res) => {
    const s = db.prepare('SELECT s.*, e.nome empresa FROM solicitacoes s JOIN empresas e ON e.id = s.empresa_id WHERE s.id = ?').get(Number(req.params.id));
    if (!s) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    const status = req.body?.status === 'aberta' ? 'aberta' : 'resolvida';
    db.prepare(`UPDATE solicitacoes SET status = ?, resolvido_por = ?, resolvido_em = ${status === 'resolvida' ? "datetime('now')" : 'NULL'} WHERE id = ?`)
      .run(status, status === 'resolvida' ? req.usuario.login : null, s.id);
    auditar(req, status === 'resolvida' ? 'resolveu solicitação' : 'reabriu solicitação', `${s.empresa} · ${TIPOS_SOLICITACAO[s.tipo] || s.tipo}`);
    res.json({ ok: true });
  });

  return { empresaPorId, validarAcesso, cabeNoPlano, centrosDe, planoDe };
};
