# Vértice · Gestão financeira

Aplicativo web de finanças pessoais com a identidade visual da **AR Consultoria**: marinho, azul e ciano, fonte Montserrat.
É um site estático, sem servidor e sem banco de dados. Os dados ficam no navegador de quem usa (`localStorage`), e o próprio app oferece backup.

## O que mudou em relação à versão anterior

**Correções**
- O lançamento entra na data escolhida no formulário. O formulário abre no mês que está na tela, e quando a data cai em outro mês o app avisa e oferece "Ver".
- Todos os valores são guardados em **centavos**. Parcelas fecham o total exato: R$ 100 em 3 parcelas vira 33,33 + 33,33 + 33,34.
- "Todo mês" não para mais em dezembro. Você escolhe quantos meses (padrão 12) e a série atravessa o ano.
- Recorrências e parcelamentos formam uma **série**. Editar ou excluir pergunta: só este, este e os próximos, ou toda a série.
- Os textos digitados são escapados antes de ir para o HTML, então uma descrição com `<` não quebra a tela nem executa código.
- O campo de valor aceita o formato brasileiro ("1.500,50", "R$ 1.500", "1500,5").
- Os IDs usam `crypto.randomUUID()`, então não colidem.
- Quando falta um campo, o formulário mostra o erro ao lado dele.

**Segurança e privacidade**
- Saiu o login falso. Ele guardava senha, CPF e telefone em texto puro no navegador e não protegia nada. O app pede só um nome para a saudação.
- Backup em JSON (baixar e restaurar, juntando ou substituindo os dados) e exportação de CSV do ano para Excel e Planilhas.
- O app avisa quando o último backup tem mais de 30 dias.
- "Apagar tudo" fica em Ajustes, exige digitar **APAGAR** e pode ser desfeito na hora.
- Os dados do Vértice antigo (`vertice_stable_*`) são detectados no mesmo navegador e importados com um clique.

**UX**
- **Vencimento** em cada lançamento. Atrasados e os que vencem em até 3 dias aparecem destacados, e um aviso no topo soma os atrasados de todos os meses.
- **Cards de resumo:** o saldo previsto do mês ganha destaque (o saldo realizado aparece embaixo), e "Falta pagar" vem com uma barra de progresso.
- **Status por tipo:** despesas ficam "Pago", receitas "Recebido", investimentos "Aplicado" e poupança "Guardado".
- **Lista:** filtros (em aberto, concluídos, receitas, despesas, investimentos, atrasados), busca e ordenação.
- **Desfazer:** excluir mostra um aviso com o botão "Desfazer" em vez de pedir confirmação antes.
- **Navegação:** setas ‹ › para trocar o mês, botão "Hoje" e atalhos de teclado (`N`, `←`/`→`, `/`).
- **Visão anual:** gráfico de entradas × saídas, tabela com a primeira coluna fixa, categorias que abrem por descrição, saldo do mês e acumulado. Clicar em um mês abre os lançamentos dele.
- **Celular:** barra de navegação inferior, botão flutuante "+" e lista adaptada.
- **App instalável (PWA)**, com uso offline.
- **Acessibilidade:** labels ligados aos campos, botões de verdade (marcar como pago, ações) com `aria-label`, foco visível e contraste melhor.

## Estrutura

```
index.html            Telas (Mês, Visão anual, Backup e ajustes) e modelo do formulário
css/estilo.css        Identidade visual AR Consultoria (variáveis em :root)
js/nucleo.js          Regras de negócio sem DOM: valores, séries, resumos, backup, migração, CSV
js/app.js             Interface: renderização, modais, eventos
sw.js                 Cache offline
manifest.webmanifest  Instalação como app
fonts/                Montserrat (licença OFL)
test/                 Testes das regras de negócio
```

## Como rodar

Abra o `index.html` direto no navegador, ou sirva a pasta para habilitar o modo offline e a instalação:

```bash
npm start      # http://localhost:8080
npm test       # testes de nucleo.js (Node 18+)
```

Para publicar, qualquer hospedagem estática funciona: GitHub Pages, Netlify, Vercel ou Render Static Site.
Ao publicar uma mudança, aumente a versão `CACHE` em `sw.js` para os usuários receberem os arquivos novos.

## Próximos passos possíveis

- Sincronização entre dispositivos com login real (Supabase ou Firebase Auth). Os dados já estão num formato versionado (`versao: 1`), pronto para isso.
- Categorias personalizadas e orçamento por categoria.
