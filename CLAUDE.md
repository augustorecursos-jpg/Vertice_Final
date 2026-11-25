# Vértice — regras do projeto

App de finanças pessoais e de empresas da AR Consultoria. Node 22 + Express 5 + node:sqlite; frontend em JS puro (sem build).

## Regra: guias sempre em dia

**Toda mudança que o cliente vê no app (tela nova, botão, menu, fluxo, texto, preço) atualiza os guias na mesma entrega:**

1. Texto: `public/guia.html` (pessoa física) e/ou `public/guia-empresas.html` (Vértice Empresas). Capítulo novo entra no sumário e os números de página do rodapé são refeitos.
2. Imagens: `npm run guia:imagens` refaz todas as fotos dos guias com as contas de demonstração (o script sobe um servidor temporário; não mexe em dados reais). Foto nova vai em `scripts/gerar-guia-imagens.js`.
3. PDFs: `npm run guia:pdf` gera `public/guia/Guia-Vertice.pdf` e `Guia-Vertice-Empresas.pdf` e avisa se alguma página estourou.
4. README: a seção do recurso.

A **página de apresentação** (`public/inicio.html`, em `/` para quem não está logado e em `/conheca`) também acompanha: recurso novo e importante ganha uma seção ou entra numa existente, e as fotos de celular dela saem do mesmo `npm run guia:imagens`. Os preços dela vêm da tabela de preços do painel (não escreva preço fixo no HTML).

Mudança só de administração (painel da AR) entra no README; nos guias, só se o cliente percebe algo (ex.: Pix na mensagem de renovação).

## Rotina de publicação

- `npm test` (precisa passar).
- Trocar a versão `CACHE` em `public/sw.js` quando mudar CSS/JS.
- Antes de mexer em tela nova ou mudar o visual, o dono do produto quer **ver imagens/mockups primeiro** e aprovar.
- Commit e push na `main` (o Render publica sozinho).

## Onde fica cada coisa

- `public/js/nucleo.js` regras de pessoa física (também usadas no servidor) · `nucleo-empresa.js` empresas
- `public/js/app.js` app pessoa física e painel da AR · `empresa.js` app de empresas
- `public/js/calendario.js` calendário · `leitor.js` + `leitura.js` leitura de foto/PDF · `public/vendor/` bibliotecas (pdf.js, Tesseract, QR Code)
- `server.js`, `db.js`, `empresas.js`, `demo.js` servidor
- Valores sempre em centavos (inteiros).
