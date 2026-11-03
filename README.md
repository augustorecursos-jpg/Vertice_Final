# Vértice · Gestão financeira

Aplicativo web de finanças pessoais com a identidade visual da **AR Consultoria**: marinho, azul e ciano, fonte Montserrat.
Cada pessoa tem login próprio e vê só os próprios lançamentos. **Só o administrador cria, bloqueia, redefine a senha e exclui contas.** Não existe cadastro público.

## Contas e administração

| Ação do administrador | O que acontece |
|---|---|
| **Novo usuário** | Gera uma senha temporária, mostrada uma única vez, com um botão para copiar o acesso e enviar. No primeiro login, a pessoa é obrigada a criar a própria senha. |
| **Bloquear** | A pessoa sai na hora, mesmo com o app aberto, e não consegue entrar de novo. Os dados ficam guardados. |
| **Desbloquear** | Volta a entrar com a senha que já tinha. |
| **Redefinir senha** | Desconecta a pessoa de todos os dispositivos e gera uma nova senha temporária. |
| **Excluir** | Apaga a conta e todos os lançamentos dela. Exige digitar o login para confirmar. |
| **Perfil** | Usuário ou Administrador. Pode haver mais de um admin. |

Regras de proteção:
- O admin não consegue bloquear, excluir ou rebaixar a própria conta.
- Sempre sobra pelo menos um administrador ativo.

## Assinaturas

- **Prazo:** cada usuário tem **30 dias contados a partir do primeiro acesso**. Administradores não têm assinatura.
- **Sinalização:** quando faltarem poucos dias (padrão: 5), o menu **Usuários** mostra um contador e a tela lista quem precisa de atenção. O contador inclui as assinaturas que vencem hoje e as vencidas.
- **Aviso:** o ícone ✈ gera a mensagem padrão já preenchida com o nome, o vencimento e o valor. O texto pode ser ajustado antes de enviar, e o envio é por **WhatsApp** (no telefone cadastrado), **e-mail** (quando o login é um e-mail) ou copiando o texto.
- **Planos por período:** mensal (30 dias), trimestral (90), semestral (180) e anual (365), para pessoa física e para os planos de empresas (Essencial, Gestão e Grupo). Preços padrão de pessoa física: R$ 11,99 · R$ 32,97 · R$ 59,94 · R$ 107,88.
- **Renovou:** abre a escolha do período pago e do valor recebido. Soma os dias do período a partir do vencimento atual, ou de hoje se a assinatura já venceu, e guarda o histórico de renovações. A lista de usuários mostra o período e o valor da última renovação.
- **Ajustes:** o vencimento pode ser alterado à mão em "Editar".
- **Configurações:** tabela de preços de cada plano e período (com valor por mês e desconto calculados na hora), quantos dias antes avisar e o texto da mensagem. Campos automáticos do texto: `{nome}`, `{vencimento}`, `{prazo}`, `{opcoes}` (lista dos períodos com preço e valor por mês, marcando o melhor preço), `{valor}` (preço mensal) e `{periodo}`.
- **Bloqueio manual:** o sistema não bloqueia sozinho. Quem decide é você, com o botão de bloquear.

**Privacidade:** o administrador gerencia contas, mas o sistema não mostra os lançamentos de ninguém. Nenhuma tela ou rota da API faz isso. A tela "Atividade recente" registra entradas e ações administrativas, sem valores financeiros.

**Segurança:**
- Senhas guardadas com scrypt e sessão em cookie `httpOnly` assinado.
- Bloqueio de login após 8 tentativas erradas por IP.
- Escritas na API só aceitam JSON (proteção contra CSRF).
- Cabeçalhos de segurança, com CSP restritiva.

## Vértice Empresas

Conta de empresa com gestão financeira gerencial. **Quem cria e controla empresas, usuários, papéis e acessos é só a AR Consultoria**, no menu **Empresas e usuários**.

- **Painel da AR:** empresas clientes, usuários de empresas, receita mensal equivalente e o que precisa de atenção. Para cada empresa: plano (Essencial até 3 usuários, Gestão até 8, Grupo até 20), período e valor, assinatura, renovação com escolha do período, aviso por WhatsApp/e-mail, bloqueio da empresa inteira (derruba todos os usuários na hora) e exclusão.
- **Usuários da empresa:** criados pela AR com papel e centros de custo. Usuários de **Leitura** não contam no limite do plano. Troca de papel, redefinição de senha, bloqueio e exclusão ficam na atividade recente.
- **Papéis:** **Dono** (tudo, inclusive aprovar o orçamento), **Financeiro** (lança, edita orçamento e plano de contas, exporta), **Gestor** (vê e lança só nos centros de custo dele) e **Leitura** (consulta e exporta). As permissões são verificadas no servidor.
- **Solicitações:** o Dono vê a equipe em modo consulta e usa **Solicitar alteração à AR**, pelo WhatsApp da AR (configurado em Planos, preços e avisos) ou direto no painel da AR.
- **Telas da empresa:** Painel do mês; Contas a pagar e receber (única, mensal ou parcelada, com cliente/fornecedor, conta e centro de custo); Orçamento anual em grade tipo planilha, por centro de custo, com cópia do ano anterior + reajuste, distribuição do valor anual e **versões** (Financeiro propõe, Dono aprova); Orçado × realizado por mês, trimestre ou acumulado, com farol (dentro, atenção, estourado) e maiores desvios; DRE gerencial; Fluxo de caixa com saldo acumulado; Plano de contas e centros de custo; Equipe e plano.
- **Exportação:** Excel (CSV) e PDF (impressão) em contas, orçamento, orçado × realizado, DRE e fluxo de caixa.
- A assinatura é da empresa: começa no primeiro acesso de qualquer usuário dela.

## O app

- **Lançamentos:** cada lançamento tem vencimento, e os atrasados e próximos de vencer ficam destacados. Tem recorrência mensal e parcelamento (o valor é guardado em centavos, então as parcelas fecham o total exato). Séries são editadas ou excluídas só no mês, dali em diante ou inteiras.
- **Mês:** saldo previsto e realizado, falta pagar, receitas e investimentos. Há filtros, busca e "Desfazer".
- **Visão anual:** gráfico de entradas × saídas, tabela por categoria com detalhe e saldo acumulado.
- **Sincronização:** os dados ficam no servidor e o mesmo login funciona no celular e no computador. Se duas telas alterarem ao mesmo tempo, a segunda recebe a versão mais recente em vez de sobrescrever.
- **Seus dados:** cópia em JSON, CSV do ano e importação, que também aceita arquivos do Vértice antigo.
- **Cartão de crédito** como tipo de lançamento (despesa), com linha própria na visão anual. O campo **"Qual cartão?"** é uma lista suspensa de bancos (Nubank, PicPay, Itaú, Caixa, Mercado Pago…) com a opção **"Outros"** para digitar um banco diferente. Os nomes digitados passam a aparecer na lista. O campo existe no lançamento e na provisão. A lista do mês tem filtros por cartão com o total de cada um, e uma provisão automática de cartão conta só os gastos daquele cartão.
- **Provisões:** previsão de gasto por mês, única ou mensal, com categoria opcional e contagem automática. Lançamentos e parcelas consomem a provisão do próprio mês. A tela mostra o consumido, o que resta, o estouro e o saldo após provisões.
- **Dashboard** (mês ou ano): saldo, receitas, despesas, investido e poupado e taxa de poupança, com variação contra o período anterior. Também mostra o total por categoria (valor e % das receitas), a composição das despesas, pago × em aberto, os gastos por cartão e as 5 maiores despesas. As barras mostram os detalhes ao passar o mouse ou focar com o teclado. Tem **filtro por categoria** (uma ou várias), e cada categoria **abre até as descrições** dos lançamentos, com total, quantidade e cartão.
- **Tipo de gasto** (opcional) nas despesas: Alimentação, Mercado, Transporte, Saúde, Moradia, Educação, Lazer, Assinaturas, Compras, Viagem, Pets e Outros. O Vértice sugere o tipo pela descrição e aprende com as suas escolhas anteriores.
- **Simulador (“e se…?”)**: mude receitas, despesas fixas e variáveis, cartão, investimento e poupança (arrastando ou digitando) e corte gastos por tipo (−10% a −50%). Compara hoje × simulado, projeta quanto você terá guardado em 12 meses e mostra em quanto tempo cada meta de planejamento seria atingida. A base é o mês escolhido ou a média dos últimos 3 meses. Os cenários podem ser salvos e reabertos. Nada é alterado nos lançamentos.
- **Onde estou gastando**: segunda aba do Dashboard (botão *Resumo | Onde estou gastando*). Mostra o maior tipo de gasto, os lançamentos sem tipo (com “classificar agora”), as parcelas já comprometidas, o ranking por tipo com as descrições, alertas (tipo que subiu, assinaturas, parcelas), a evolução de 6 meses, o tipo de gasto por cartão e os maiores gastos por descrição.
- **Observações** em cada lançamento: aparecem na lista, entram na busca e no CSV.
- **Planejamentos:** tabelas livres (ex.: "Plano apartamento" com uma coluna por ano), com total por coluna, total final, meta opcional, CSV e duplicação.
- **Celular:** layout responsivo e instalável (PWA).

## Guia do cliente (e-book)

- **Web:** `/guia` (público, sem login), com link na tela de entrada e em Minha conta. É o link para enviar a um cliente novo junto com o acesso.
- **PDF:** `public/guia/Guia-Vertice.pdf` (12 páginas A4), também em `/guia/Guia-Vertice.pdf`.
- **Atualizar:** edite `public/guia.html` e gere o PDF de novo com `LANG=pt_BR.UTF-8 node scripts/gerar-guia-pdf.js`. O script precisa do Playwright e avisa se alguma página passar do tamanho da folha.

## Rodar localmente

Requer Node.js 22.13 ou superior (o SQLite já vem embutido no Node).

```bash
npm install
npm start          # http://localhost:3000
npm test           # testes das regras e da API
```

No primeiro start, o servidor cria o administrador inicial. Localmente o acesso é `admin` / `vertice-admin`, e o sistema pede uma senha nova no primeiro acesso.
Os dados ficam em `data/vertice.db`, ou na pasta definida em `DATA_DIR`.

## Publicar no Render

1. No Render: **New → Blueprint** e escolha este repositório. Ele lê o `render.yaml`.
2. Quando pedir, preencha **ADMIN_PASSWORD** com a senha do seu administrador (login `admin`, que dá para trocar em `ADMIN_LOGIN`).
3. Pronto. Acesse o endereço gerado, entre como admin e crie os usuários em **Usuários**.

O blueprint usa o plano **Starter com disco persistente de 1 GB**, porque no plano grátis o disco é apagado a cada reinício.
O Render faz um snapshot diário do disco.

Variáveis de ambiente:

| Variável | Uso |
|---|---|
| `ADMIN_PASSWORD` | Senha do primeiro administrador. É obrigatória em produção e só é usada quando o banco está vazio. |
| `ADMIN_LOGIN`, `ADMIN_NOME` | Login e nome do primeiro administrador. |
| `SESSION_SECRET` | Chave das sessões. O blueprint gera uma sozinho. |
| `DATA_DIR` | Pasta do banco SQLite (no Render, o disco montado em `/var/data`). |

## Estrutura

```
server.js            API: login, sessão, dados do usuário, administração de contas
empresas.js          API do Vértice Empresas e administração central das empresas
db.js                SQLite (usuarios, carteiras, empresas, auditoria...) e senhas
public/
  index.html         App (Mês, Visão anual, Minha conta, Usuários)
  entrar.html        Tela de login
  css/estilo.css     Identidade visual AR Consultoria (variáveis em :root)
  js/nucleo.js       Regras de negócio, usadas no navegador e no servidor
  js/nucleo-empresa.js  Regras do Vértice Empresas (DRE, orçado × realizado, fluxo de caixa)
  js/app.js          Interface (pessoa física e administração)
  js/empresa.js      Interface da empresa
  js/entrar.js       Login
  sw.js              Cache dos arquivos estáticos
test/                Testes (node --test)
render.yaml          Blueprint do Render
Dockerfile           Alternativa para outras hospedagens
```
