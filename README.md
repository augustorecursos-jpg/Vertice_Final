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

**Privacidade:** o administrador gerencia contas, mas o sistema não mostra os lançamentos de ninguém. Nenhuma tela ou rota da API faz isso. A tela "Atividade recente" registra entradas e ações administrativas, sem valores financeiros.

**Segurança:**
- Senhas guardadas com scrypt e sessão em cookie `httpOnly` assinado.
- Bloqueio de login após 8 tentativas erradas por IP.
- Escritas na API só aceitam JSON (proteção contra CSRF).
- Cabeçalhos de segurança, com CSP restritiva.

## O app

- **Lançamentos:** cada lançamento tem vencimento, e os atrasados e próximos de vencer ficam destacados. Tem recorrência mensal e parcelamento (o valor é guardado em centavos, então as parcelas fecham o total exato). Séries são editadas ou excluídas só no mês, dali em diante ou inteiras.
- **Mês:** saldo previsto e realizado, falta pagar, receitas e investimentos. Há filtros, busca e "Desfazer".
- **Visão anual:** gráfico de entradas × saídas, tabela por categoria com detalhe e saldo acumulado.
- **Sincronização:** os dados ficam no servidor e o mesmo login funciona no celular e no computador. Se duas telas alterarem ao mesmo tempo, a segunda recebe a versão mais recente em vez de sobrescrever.
- **Seus dados:** cópia em JSON, CSV do ano e importação, que também aceita arquivos do Vértice antigo.
- **Celular:** layout responsivo e instalável (PWA).

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
db.js                SQLite (usuarios, carteiras, auditoria) e senhas
public/
  index.html         App (Mês, Visão anual, Minha conta, Usuários)
  entrar.html        Tela de login
  css/estilo.css     Identidade visual AR Consultoria (variáveis em :root)
  js/nucleo.js       Regras de negócio, usadas no navegador e no servidor
  js/app.js          Interface
  js/entrar.js       Login
  sw.js              Cache dos arquivos estáticos
test/                Testes (node --test)
render.yaml          Blueprint do Render
Dockerfile           Alternativa para outras hospedagens
```
