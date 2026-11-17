// Contas de demonstração para apresentar o Vértice a clientes.
// O administrador cria (ou restaura) com um clique: uma pessoa física e uma empresa com usuários
// Dono e Gestor, todas com um ano de dados de exemplo relativos à data de hoje.
// Restaurar apaga só os dados dessas contas (marcadas com demo = 1) e gera tudo de novo.
const N = require('./public/js/nucleo.js');
const E = require('./public/js/nucleo-empresa.js');

const LOGIN_PF = 'demo.pf';
const LOGINS_EMPRESA = [
  { login: 'demo.empresa', nome: 'Roberto Almeida', papel: 'dono' },
  { login: 'demo.gestor', nome: 'Ricardo Melo', papel: 'gestor' },
];
const NOME_EMPRESA = 'Construtora Horizonte (demonstração)';
const DEZ_ANOS = 3650;

module.exports = function montarDemo(app, ctx) {
  const { db, exigirAdmin, auditar, transacao, hojeISO, somarDias, hashSenha, senhaTemporaria } = ctx;

  // ---------- dados da pessoa física ----------
  function dadosPessoaFisica(hoje) {
    const [A, M1, D] = hoje.split('-').map(Number);
    const M = M1 - 1;
    const hojeD = new Date(A, M, D);
    const ls = [];
    const add = (f) => ls.push(...N.gerar(f));
    add({ desc: 'Salário', centavos: 685000, categoria: 'receita', ano: A, mes: 0, dia: 5, recorrencia: 'mensal', quantidade: 12 });
    add({ desc: 'Aluguel', centavos: 190000, categoria: 'fixa', ano: A, mes: 0, dia: 10, recorrencia: 'mensal', quantidade: 12, tipoGasto: 'moradia' });
    add({ desc: 'Internet', centavos: 11990, categoria: 'fixa', ano: A, mes: 0, dia: 15, recorrencia: 'mensal', quantidade: 12, tipoGasto: 'moradia' });
    add({ desc: 'Academia', centavos: 9990, categoria: 'fixa', ano: A, mes: 0, dia: 8, recorrencia: 'mensal', quantidade: 12, tipoGasto: 'saude' });
    add({ desc: 'Tesouro Selic', centavos: 50000, categoria: 'investimento', ano: A, mes: 0, dia: 25, recorrencia: 'mensal', quantidade: 12 });
    add({ desc: 'Reserva de emergência', centavos: 30000, categoria: 'poupanca', ano: A, mes: 0, dia: 25, recorrencia: 'mensal', quantidade: 12 });
    add({ desc: 'Streaming', centavos: 5590, categoria: 'cartao', cartao: 'Nubank', ano: A, mes: 0, dia: 12, recorrencia: 'mensal', quantidade: 12, tipoGasto: 'assinaturas' });
    const luz = [18740, 17520, 16380, 15990, 14870, 15210, 16640, 17330, 18120, 21480, 19500, 20100];
    const merc = [86020, 79450, 91230, 84510, 88760, 82340, 95110, 87690, 90420, 85030, 88000, 112000];
    const rest = [32000, 28000, 41000, 36500, 29000, 33800, 45200, 38000, 30500, 42700, 35000, 52000];
    const farm = [8900, 12000, 7600, 9800, 15400, 8700, 9900, 11200, 8300, 13600, 9000, 9500];
    for (let m = 0; m < 12; m++) {
      add({ desc: 'Conta de luz', centavos: luz[m], categoria: 'variavel', ano: A, mes: m, dia: 3, tipoGasto: 'moradia',
        obs: m === M ? 'Bandeira vermelha neste mês: conferir o consumo do ar-condicionado.' : '' });
      add({ desc: 'Mercado', centavos: merc[m], categoria: 'variavel', ano: A, mes: m, dia: 20, tipoGasto: 'mercado' });
      add({ desc: 'Farmácia', centavos: farm[m], categoria: 'cartao', cartao: 'Itaú', ano: A, mes: m, dia: 9, tipoGasto: 'saude' });
      // No mês atual, a fatura do PicPay vem com as compras detalhadas.
      if (m !== M) add({ desc: 'Restaurantes', centavos: rest[m], categoria: 'cartao', cartao: 'PicPay', ano: A, mes: m, dia: 16, tipoGasto: 'alimentacao' });
    }
    add({ desc: 'Fatura PicPay', centavos: 102055, categoria: 'cartao', cartao: 'PicPay', ano: A, mes: M, dia: 16, obs: 'Fatura fecha dia 10.',
      compras: [
        { desc: 'Espaço Laser', centavos: 17926, tipoGasto: 'saude', fixa: true },
        { desc: 'Claude IA', centavos: 11000, tipoGasto: 'assinaturas', fixa: true },
        { desc: 'iFood', centavos: 8640, tipoGasto: 'alimentacao' },
        { desc: 'Posto Shell', centavos: 22000, tipoGasto: 'transporte' },
        { desc: 'Amazon', centavos: 13490, tipoGasto: 'compras' },
        { desc: 'Cinemark', centavos: 7000, tipoGasto: 'lazer' },
      ] });
    const parcelaIni = N.somarMeses(A, M, -4);
    add({ desc: 'Notebook', centavos: 480000, categoria: 'cartao', cartao: 'Nubank', ano: parcelaIni.ano, mes: parcelaIni.mes, dia: 12,
      recorrencia: 'parcelada', quantidade: 10, modoValor: 'total', tipoGasto: 'compras', obs: 'Comprado na loja online, cartão final 4321.' });
    add({ desc: 'Freela de identidade visual', centavos: 120000, categoria: 'receita', ano: A, mes: M, dia: Math.min(18, N.diasNoMes(A, M)),
      obs: 'Cliente: Padaria Sol. Metade na entrega, metade em 30 dias.' });
    for (const l of ls) {
      l.pago = N.dataDe(l) < hojeD && !(l.desc === 'Conta de luz' && l.ano === A && l.mes === M);
      if (l.desc === 'Salário' && l.ano === A && l.mes === M) l.pago = true;
    }
    const lancamentos = ls.map(N.limpar).filter(Boolean);
    const provisoes = [
      ...N.gerarProvisoes({ nome: 'Mercado', centavos: 120000, categoria: 'variavel', auto: true, ano: A, mes: M, repetir: true, quantidade: 3 }),
      ...N.gerarProvisoes({ nome: 'Cartão PicPay', centavos: 110000, categoria: 'cartao', cartao: 'PicPay', auto: true, ano: A, mes: M, repetir: true, quantidade: 3 }),
    ].map(N.limparProvisao).filter(Boolean);
    const plano = N.novoPlano({ exemplo: true });
    const viagem = N.novoPlano({ titulo: `Viagem de férias ${A + 1}` });
    viagem.colunas = [{ id: 'v1', nome: 'Passagens' }, { id: 'v2', nome: 'Hospedagem' }, { id: 'v3', nome: 'Passeios' }];
    viagem.linhas = [{ id: 'l1', nome: 'Guardar até o fim do ano', valores: { v1: 180000, v2: 120000, v3: 40000 } }, { id: 'l2', nome: '13º salário', valores: { v2: 100000, v3: 60000 } }];
    viagem.meta = 600000;
    const cenarios = [N.limparCenario({ nome: 'Aumento + cortar o cartão', base: 'mes', valores: { receita: 900000, cartao: 70000, investimento: 80000 } })];
    return { lancamentos, planos: [plano, viagem].map(N.limparPlano), provisoes, cenarios, tiposGasto: [] };
  }

  // ---------- dados da empresa ----------
  function dadosEmpresa(hoje) {
    const [A, M1, D] = hoje.split('-').map(Number);
    const hojeD = new Date(A, M1 - 1, D);
    const est = E.estruturaPadrao();
    const renomear = (de, para) => { est.contas.find((c) => c.nome === de).nome = para; };
    renomear('Venda de produtos', 'Venda de imóveis');
    renomear('Prestação de serviços', 'Serviços de reforma');
    renomear('Custo dos produtos e serviços', 'Materiais de obra');
    est.centros.push({ id: N.novoId(), nome: 'Obras', ativo: true });
    est.saldoInicial = 18000000;
    const conta = (n) => est.contas.find((c) => c.nome === n).id;
    const cen = (n) => est.centros.find((c) => c.nome === n).id;
    const M = (arr) => arr.map((v) => v * 100);
    const orc = {
      [conta('Venda de imóveis')]: { _: M([300000, 320000, 340000, 350000, 360000, 360000, 360000, 360000, 360000, 360000, 380000, 420000]) },
      [conta('Serviços de reforma')]: { [cen('Obras')]: M([50000, 50000, 50000, 50000, 50000, 50000, 60000, 60000, 60000, 60000, 60000, 60000]) },
      [conta('Impostos sobre vendas')]: { _: M(Array(12).fill(10000)) },
      [conta('Materiais de obra')]: { [cen('Obras')]: M([55000, 56000, 58000, 60000, 62000, 62000, 62000, 62000, 62000, 62000, 64000, 66000]) },
      [conta('Mão de obra direta')]: { [cen('Obras')]: M(Array(12).fill(105000)) },
      [conta('Pessoal e encargos')]: { [cen('Administrativo')]: M(Array(12).fill(65000)), [cen('Comercial')]: M(Array(12).fill(11000)) },
      [conta('Marketing e vendas')]: { [cen('Comercial')]: M([20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 25000, 25000, 30000]) },
      [conta('Aluguel e condomínio')]: { [cen('Administrativo')]: M(Array(12).fill(18000)) },
      [conta('Tecnologia')]: { [cen('Administrativo')]: M(Array(12).fill(15000)) },
      [conta('Tarifas bancárias e juros')]: { _: M(Array(12).fill(4000)) },
    };
    // Variação do realizado em relação ao orçado; o mês anterior ao atual tem desvios marcantes para a demonstração.
    const fator = [0.95, 1.02, 0.98, 1.05, 0.97, 1.01, 1.04, 0.99, 1.03, 0.97, 1, 1];
    const destaque = (M1 + 10) % 12; // mês anterior
    const lanc = [];
    const add = (desc, c, centro, valor, mes, dia, parte) => {
      const l = { id: N.novoId(), desc, conta: c, centro, centavos: Math.round(valor), ano: A, mes, dia, parte };
      l.pago = new Date(A, mes, dia) < hojeD && !(mes === M1 - 1 && /Comissão/.test(desc));
      lanc.push(l);
    };
    const v = (cnome, m, b) => (orc[conta(cnome)][b || '_'])[m];
    for (let m = 0; m < 12; m++) {
      const d = m === destaque, f = fator[m];
      add('Venda de unidades', conta('Venda de imóveis'), null, v('Venda de imóveis', m) * (d ? 0.92 : f), m, 15, 'Clientes diversos');
      add('Reformas contratadas', conta('Serviços de reforma'), cen('Obras'), v('Serviços de reforma', m, cen('Obras')) * (d ? 1.12 : f), m, 20, '');
      add('Simples Nacional', conta('Impostos sobre vendas'), null, v('Impostos sobre vendas', m) * (d ? 1.07 : 1), m, 20, 'Receita Federal');
      add('Cimento, aço e acabamentos', conta('Materiais de obra'), cen('Obras'), v('Materiais de obra', m, cen('Obras')) * (d ? 0.965 : f), m, 12, 'Depósito Constrular');
      add('Equipe de obra', conta('Mão de obra direta'), cen('Obras'), v('Mão de obra direta', m, cen('Obras')) * (d ? 1.06 : 1), m, 5, '');
      add('Folha administrativa', conta('Pessoal e encargos'), cen('Administrativo'), v('Pessoal e encargos', m, cen('Administrativo')) * (d ? 0.98 : 1), m, 5, '');
      add('Comissão de vendas', conta('Pessoal e encargos'), cen('Comercial'), v('Pessoal e encargos', m, cen('Comercial')) * (d ? 1.1 : 1), m, 10, 'Corretores');
      add(d ? 'Google Ads e portais' : 'Anúncios e portais', conta('Marketing e vendas'), cen('Comercial'), v('Marketing e vendas', m, cen('Comercial')) * (d ? 1.556 : f), m, 8, 'Google');
      add('Aluguel do escritório', conta('Aluguel e condomínio'), cen('Administrativo'), 1800000, m, 10, 'Imobiliária Central');
      add('Licenças e sistemas', conta('Tecnologia'), cen('Administrativo'), v('Tecnologia', m, cen('Administrativo')) * (d ? 0.9 : 1), m, 18, '');
      add('Tarifas e juros', conta('Tarifas bancárias e juros'), null, 420000, m, 28, 'Banco');
    }
    const estrutura = E.limparEstrutura(est);
    const valores = E.limparValoresOrcamento(orc, estrutura);
    const lancamentos = lanc.map((l) => E.limparLancamento(l, estrutura));
    return { estrutura, valores, lancamentos, ano: A, gestorCentros: [cen('Comercial')] };
  }

  // ---------- contas ----------
  /** Um login de demonstração só pode reaproveitar uma conta que também seja de demonstração. */
  function conflitoDeLogin(login) {
    const u = db.prepare('SELECT demo FROM usuarios WHERE login = ?').get(login);
    return u && !u.demo ? `O login “${login}” já é usado por uma conta que não é de demonstração.` : null;
  }

  function gravarUsuario({ login, nome, senhaHash, hoje, empresaId = null, papel = null, centros = [] }) {
    const u = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(login);
    const vence = empresaId ? null : somarDias(hoje, DEZ_ANOS);
    if (u) {
      db.prepare(`UPDATE usuarios SET nome = ?, senha_hash = ?, perfil = 'usuario', ativo = 1, trocar_senha = 0, empresa_id = ?, papel = ?, centros = ?,
        assinatura_inicio = ?, assinatura_vence = ?, periodo = 'anual', demo = 1 WHERE id = ?`)
        .run(nome, senhaHash, empresaId, papel, JSON.stringify(centros), empresaId ? null : hoje, vence, u.id);
      return u.id;
    }
    return Number(db.prepare(`INSERT INTO usuarios (nome, login, senha_hash, perfil, ativo, trocar_senha, empresa_id, papel, centros, assinatura_inicio, assinatura_vence, periodo, demo)
      VALUES (?, ?, ?, 'usuario', 1, 0, ?, ?, ?, ?, ?, 'anual', 1)`)
      .run(nome, login, senhaHash, empresaId, papel, JSON.stringify(centros), empresaId ? null : hoje, vence).lastInsertRowid);
  }

  function situacao() {
    const pf = db.prepare('SELECT id, login FROM usuarios WHERE login = ? AND demo = 1').get(LOGIN_PF);
    const emp = db.prepare('SELECT id, nome FROM empresas WHERE demo = 1').get();
    const em = db.prepare("SELECT valor FROM config WHERE chave = 'demo_restaurada_em'").get();
    return { existe: !!(pf && emp), restauradaEm: em?.valor || null, loginPf: LOGIN_PF, empresa: NOME_EMPRESA, loginsEmpresa: LOGINS_EMPRESA };
  }

  app.get('/api/admin/demo', exigirAdmin, (req, res) => res.json(situacao()));

  app.post('/api/admin/demo', exigirAdmin, (req, res) => {
    const hoje = hojeISO();
    const empDemo = db.prepare('SELECT id FROM empresas WHERE demo = 1').get();
    for (const login of [LOGIN_PF, ...LOGINS_EMPRESA.map((u) => u.login)]) {
      const erro = conflitoDeLogin(login);
      if (erro) return res.status(409).json({ erro });
    }
    const senha = senhaTemporaria();
    const senhaHash = hashSenha(senha);
    const pf = dadosPessoaFisica(hoje);
    const pj = dadosEmpresa(hoje);
    const existia = situacao().existe;

    transacao(() => {
      // Pessoa física: conta e carteira inteira refeitas.
      const uid = gravarUsuario({ login: LOGIN_PF, nome: 'Ana Souza (demonstração)', senhaHash, hoje });
      const rev = (db.prepare('SELECT rev FROM carteiras WHERE usuario_id = ?').get(uid)?.rev || 0) + 1;
      db.prepare(`INSERT INTO carteiras (usuario_id, dados, rev) VALUES (?, ?, ?)
        ON CONFLICT (usuario_id) DO UPDATE SET dados = excluded.dados, rev = excluded.rev, atualizado_em = datetime('now')`).run(uid, JSON.stringify(pf), rev);

      // Empresa: cadastro, estrutura, lançamentos e orçamento refeitos.
      let eid = empDemo?.id;
      if (eid) {
        for (const t of ['pj_lancamentos', 'pj_orcamentos', 'solicitacoes', 'renovacoes_empresas']) db.prepare(`DELETE FROM ${t} WHERE empresa_id = ?`).run(eid);
        db.prepare("UPDATE empresas SET nome = ?, plano = 'gestao', periodo = 'anual', ativo = 1, assinatura_inicio = ?, assinatura_vence = ? WHERE id = ?")
          .run(NOME_EMPRESA, hoje, somarDias(hoje, DEZ_ANOS), eid);
        db.prepare(`DELETE FROM usuarios WHERE empresa_id = ? AND login NOT IN (${LOGINS_EMPRESA.map(() => '?').join(',')})`).run(eid, ...LOGINS_EMPRESA.map((u) => u.login));
      } else {
        eid = Number(db.prepare("INSERT INTO empresas (nome, cnpj, plano, periodo, ativo, assinatura_inicio, assinatura_vence, demo) VALUES (?, '', 'gestao', 'anual', 1, ?, ?, 1)")
          .run(NOME_EMPRESA, hoje, somarDias(hoje, DEZ_ANOS)).lastInsertRowid);
      }
      const revEst = (db.prepare('SELECT rev FROM pj_estrutura WHERE empresa_id = ?').get(eid)?.rev || 0) + 1;
      db.prepare('INSERT INTO pj_estrutura (empresa_id, dados, rev) VALUES (?, ?, ?) ON CONFLICT (empresa_id) DO UPDATE SET dados = excluded.dados, rev = excluded.rev')
        .run(eid, JSON.stringify(pj.estrutura), revEst);
      for (const u of LOGINS_EMPRESA) {
        gravarUsuario({ login: u.login, nome: u.nome, senhaHash, hoje, empresaId: eid, papel: u.papel, centros: u.papel === 'gestor' ? pj.gestorCentros : [] });
      }
      const ins = db.prepare('INSERT INTO pj_lancamentos (id, empresa_id, centro, conta, dados, atualizado_por) VALUES (?, ?, ?, ?, ?, ?)');
      for (const l of pj.lancamentos) ins.run(l.id, eid, l.centro, l.conta, JSON.stringify(l), 'demo');
      const orc = db.prepare(`INSERT INTO pj_orcamentos (empresa_id, ano, nome, valores, status, autor, aprovado_por, aprovado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      orc.run(eid, pj.ano, 'Primeira proposta', JSON.stringify(pj.valores), 'proposta', 'Paula Lima', null, null);
      orc.run(eid, pj.ano, 'Aprovada', JSON.stringify(pj.valores), 'vigente', 'Roberto Almeida', 'Roberto Almeida', hoje);
      db.prepare("INSERT INTO config (chave, valor) VALUES ('demo_restaurada_em', ?) ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor").run(hoje);
    });
    auditar(req, existia ? 'restaurou a demonstração' : 'criou a demonstração', `${LOGIN_PF}, ${LOGINS_EMPRESA.map((u) => u.login).join(', ')}`);
    res.json({ ...situacao(), senha });
  });
};
