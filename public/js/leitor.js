/*
 * Vértice — leitura de documentos (boleto, fatura do cartão, conta de consumo, recibo, nota fiscal).
 * Recebe o TEXTO já extraído do PDF ou da foto e devolve o que dá para preencher no lançamento.
 * Não usa rede nem DOM: funciona no navegador (window.VerticeLeitor) e no Node (require) para os testes.
 */
(function (raiz, fabrica) {
  const api = fabrica(typeof module === 'object' && module.exports ? require('./nucleo') : raiz.Nucleo);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.VerticeLeitor = api;
})(typeof self !== 'undefined' ? self : this, function (N) {
  'use strict';

  const DIA = 86400000;
  const p2 = (n) => String(n).padStart(2, '0');
  const isoUTC = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`; };
  const norm = (s) => N.normalizar(String(s || '')).replace(/\s+/g, ' ').trim();
  const VALOR = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2})(?![\d%])/g;
  const DATA = /\b(\d{2})[/.-](\d{2})[/.-](\d{4}|\d{2})\b/g;
  const CNPJ = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;

  // ---------- linha digitável ----------
  function mod10(num) {
    let s = 0, peso = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      let p = +num[i] * peso;
      if (p > 9) p = Math.floor(p / 10) + (p % 10);
      s += p; peso = peso === 2 ? 1 : 2;
    }
    return (10 - (s % 10)) % 10;
  }
  function mod11Arrecadacao(num) {
    let s = 0, peso = 2;
    for (let i = num.length - 1; i >= 0; i--) { s += +num[i] * peso; peso = peso === 9 ? 2 : peso + 1; }
    const r = s % 11;
    return r === 0 || r === 1 ? 0 : r === 10 ? 1 : 11 - r;
  }
  /** Vencimento pelo fator do boleto. O fator voltou a 1000 em 22/02/2025; vale a data mais perto de hoje. */
  function dataDoFator(fator, hoje = new Date()) {
    if (!(fator > 0)) return null;
    const ref = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const cands = [Date.UTC(1997, 9, 7) + fator * DIA];
    if (fator >= 1000) cands.push(Date.UTC(2025, 1, 22) + (fator - 1000) * DIA);
    return isoUTC(cands.sort((a, b) => Math.abs(a - ref) - Math.abs(b - ref))[0]);
  }
  const SEGMENTO = { 1: 'Prefeitura', 2: 'Conta de água', 3: 'Conta de luz', 4: 'Telefone e internet', 5: 'Órgão do governo', 7: 'Multa de trânsito' };

  /** Interpreta 47 dígitos (boleto bancário) ou 48 (conta de consumo/tributo). Só aceita se os dígitos verificadores batem. */
  function interpretarLinha(digitos, hoje) {
    const d = digitos;
    if (d.length === 47 && d[0] !== '8') {
      if (mod10(d.slice(0, 9)) !== +d[9] || mod10(d.slice(10, 20)) !== +d[20] || mod10(d.slice(21, 31)) !== +d[31]) return null;
      const centavos = +d.slice(37, 47);
      return { tipo: 'bancario', linha: d, centavos: centavos || null, vencimento: dataDoFator(+d.slice(33, 37), hoje), banco: d.slice(0, 3) };
    }
    if (d.length === 48 && d[0] === '8') {
      const id = d[2];
      const dv = id === '6' || id === '7' ? mod10 : id === '8' || id === '9' ? mod11Arrecadacao : null;
      if (!dv) return null;
      for (let i = 0; i < 4; i++) if (dv(d.slice(i * 12, i * 12 + 11)) !== +d[i * 12 + 11]) return null;
      const barra = [0, 1, 2, 3].map((i) => d.slice(i * 12, i * 12 + 11)).join('');
      const centavos = id === '6' || id === '8' ? +barra.slice(4, 15) : null;
      return { tipo: 'arrecadacao', linha: d, centavos: centavos || null, vencimento: null, segmento: SEGMENTO[barra[1]] || null };
    }
    return null;
  }
  /** Procura a linha digitável no texto (com pontos, espaços e traços, numa linha ou quebrada em duas). */
  function acharLinhaDigitavel(linhas, hoje) {
    const tentar = (txt) => {
      for (const m of txt.matchAll(/\d[\d.\s-]{40,80}\d/g)) {
        const dig = m[0].replace(/\D/g, '');
        for (const n of [47, 48]) {
          for (let i = 0; i + n <= dig.length; i++) {
            const r = interpretarLinha(dig.slice(i, i + n), hoje);
            if (r) return { ...r, trecho: m[0].trim() };
          }
        }
      }
      return null;
    };
    for (let i = 0; i < linhas.length; i++) {
      const r = tentar(linhas[i]) || (i + 1 < linhas.length ? tentar(`${linhas[i]} ${linhas[i + 1]}`) : null);
      if (r) return r;
    }
    return null;
  }

  // ---------- pedaços do texto ----------
  const valoresDe = (txt) => [...String(txt).matchAll(VALOR)].map((m) => ({ centavos: N.lerValor(m[1]), texto: m[1] })).filter((v) => v.centavos > 0);
  function datasDe(txt) {
    const r = [];
    for (const m of String(txt).matchAll(DATA)) {
      const dia = +m[1], mes = +m[2], ano = m[3].length === 2 ? 2000 + +m[3] : +m[3];
      if (mes < 1 || mes > 12 || dia < 1 || dia > N.diasNoMes(ano, mes - 1) || ano < 2000 || ano > 2100) continue;
      r.push({ iso: `${ano}-${p2(mes)}-${p2(dia)}`, texto: m[0] });
    }
    return r;
  }
  /** Valor ou data depois de um rótulo: na mesma linha (depois do rótulo) ou nas duas linhas seguintes. */
  function aposRotulo(linhas, rotulo, extrair) {
    for (let i = 0; i < linhas.length; i++) {
      const n = norm(linhas[i]);
      const m = rotulo.exec(n);
      if (!m) continue;
      // posição aproximada do fim do rótulo na linha original (normalizar não muda o tamanho do texto latino)
      const resto = linhas[i].slice(Math.min(linhas[i].length, m.index + m[0].length));
      const achados = extrair(resto);
      if (achados.length) return { ...achados[0], trecho: linhas[i] };
      for (let j = i + 1; j <= i + 2 && j < linhas.length; j++) {
        const a = extrair(linhas[j]);
        if (a.length) return { ...a[0], trecho: linhas[j] };
      }
    }
    return null;
  }
  const titulo = (s) => {
    const t = String(s).replace(/\s+/g, ' ').trim();
    if (t !== t.toUpperCase()) return t;
    return t.toLowerCase().replace(/(^|[\s/(-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
      .replace(/\b(De|Da|Do|Das|Dos|E|Em)\b/g, (x) => x.toLowerCase()).replace(/\b(Ltda|Me|Epp|S\.a\.?|Sa)\b/gi, (x) => x.toUpperCase());
  };

  const CONTAS = [
    [/energia eletrica|\bkwh\b|distribuidora de energia|conta de luz/, 'Conta de luz', 'fixa'],
    [/saneamento|agua e esgoto|abastecimento de agua|conta de agua/, 'Conta de água', 'fixa'],
    [/gas canalizado|consumo de gas|\bcomgas\b|conta de gas/, 'Conta de gás', 'fixa'],
    [/banda larga|internet|fibra optica/, 'Internet', 'fixa'],
    [/telefonia|telefone|celular|plano movel/, 'Telefone', 'fixa'],
    [/condominio/, 'Condomínio', 'fixa'],
    [/aluguel|locacao/, 'Aluguel', 'fixa'],
    [/\biptu\b/, 'IPTU', 'fixa'],
    [/\bipva\b|licenciamento/, 'IPVA', 'fixa'],
    [/mensalidade|matricula|colegio|faculdade|escola/, 'Mensalidade escolar', 'fixa'],
    [/plano de saude|assistencia medica|odontologic/, 'Plano de saúde', 'fixa'],
    [/seguro/, 'Seguro', 'fixa'],
  ];
  const CARTAO_PALAVRA = { Caixa: /\bcaixa (economica|cartoes?)|cartao caixa/, Inter: /\bbanco inter\b|\binter&co|\binter co\b/, Next: /\bbanco next\b|\bnext\b.*cartao/, Original: /\bbanco original\b/, Neon: /\bbanco neon\b|\bneon pagamentos\b/ };
  function acharCartao(textoNorm) {
    for (const nome of N.CARTOES_SUGERIDOS) {
      const re = CARTAO_PALAVRA[nome] || new RegExp(`\\b${norm(nome).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(textoNorm)) return nome;
    }
    return null;
  }

  // ---------- fatura do cartão ----------
  const IGNORAR_COMPRA = /pagamento|saldo anterior|^total|total da fatura|total desta|limite|^saldo|credito de|pagto/;
  function comprasDaFatura(linhas) {
    const compras = [], creditos = [];
    const re = /^(\d{2})[/.](\d{2})(?:[/.]\d{2,4})?\s+(.+?)\s+(-\s*)?(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2})\s*(-|C|CR)?$/i;
    for (const linha of linhas) {
      const m = re.exec(linha.trim());
      if (!m) continue;
      let desc = m[3].replace(/\s+/g, ' ').trim();
      if (IGNORAR_COMPRA.test(norm(desc)) || !/\p{L}{2}/u.test(desc)) continue;
      const centavos = N.lerValor(m[5].replace('-', ''));
      if (!(centavos > 0)) continue;
      const credito = !!m[4] || m[5].startsWith('-') || !!m[6] || /estorno|reembolso|devolucao/.test(norm(desc));
      let parcela = null;
      const p = /\s*(?:parc(?:ela)?\.?\s*)?\b(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})$/i.exec(desc);
      if (p && +p[1] >= 1 && +p[2] >= 2 && +p[1] <= +p[2]) { parcela = { n: +p[1], total: +p[2] }; desc = desc.slice(0, p.index).trim(); }
      const item = { data: `${m[1]}/${m[2]}`, desc: titulo(desc).slice(0, 70) + (parcela ? ` ${parcela.n}/${parcela.total}` : ''), centavos, parcela, trecho: linha };
      (credito ? creditos : compras).push(item);
    }
    return { compras, creditos };
  }

  // ---------- nota fiscal ----------
  function lerNota(linhas, texto) {
    let emitente = null;
    const iEmit = linhas.findIndex((l) => /^(identificacao do )?emitente\b|razao social/.test(norm(l)));
    if (iEmit >= 0) {
      const mesma = linhas[iEmit].replace(/^.*?(emitente|raz[ãa]o social)\s*:?\s*/i, '').trim();
      emitente = mesma.length > 3 && /\p{L}{3}/u.test(mesma) ? mesma : (linhas.slice(iEmit + 1).find((l) => /\p{L}{3}/u.test(l) && !CNPJ.test(l)) || null);
    }
    if (!emitente) emitente = linhas.find((l) => /\b(ltda|s\.?a\.?|eireli|epp|me)\b\.?$/i.test(l.trim())) || null;
    const cnpj = (CNPJ.exec(texto) || [null])[0];
    const numero = (/\b(?:n[º°o.]|numero)\s*:?\s*(\d{1,3}(?:\.\d{3})+|\d{3,9})/i.exec(texto) || [])[1] || null;
    const duplicatas = [];
    for (const m of texto.matchAll(/\b(\d{3})\s*[-·|/]?\s*(\d{2}\/\d{2}\/\d{4})\s*[-·|]?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g)) {
      const d = datasDe(m[2])[0];
      const c = N.lerValor(m[3]);
      if (d && c > 0) duplicatas.push({ n: +m[1], iso: d.iso, centavos: c, trecho: m[0] });
    }
    return { emitente: emitente ? titulo(emitente.replace(CNPJ, '').replace(/cnpj[:\s]*/i, '')).replace(/\s+/g, ' ').trim().slice(0, 80) : null, cnpj, numero: numero ? numero.replace(/\./g, '').replace(/^0+/, '') : null, duplicatas };
  }

  // ---------- leitura principal ----------
  /**
   * Lê o texto de um documento.
   * Devolve { tipo, desc, centavos, vencimento, categoria, cartao, compras, creditos, somaConfere, linhaDigitavel,
   *           emitente, cnpj, numero, duplicatas, certeza: { campo: true|false }, marcas: [{ n, campo, trecho }] }
   */
  function ler(texto, { hoje = new Date() } = {}) {
    const linhas = String(texto || '').split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
    const tudo = linhas.join('\n');
    const tn = norm(tudo);
    const r = { tipo: 'documento', desc: null, centavos: null, vencimento: null, categoria: 'fixa', cartao: null, compras: [], creditos: [], somaConfere: null,
      linhaDigitavel: null, emitente: null, cnpj: null, numero: null, duplicatas: [], certeza: {}, marcas: [] };
    if (!linhas.length) return r;
    const marcar = (campo, trecho) => { if (trecho) r.marcas.push({ n: r.marcas.length + 1, campo, trecho }); };

    const linha = acharLinhaDigitavel(linhas, hoje);
    const venc = aposRotulo(linhas, /(data (de|do) )?vencimento|vence em|pagar ate|pagavel ate/, datasDe);
    const ehNota = /\bdanfe\b|nota fiscal eletronica|\bnf-e\b/.test(tn) && !/consumidor/.test(tn);
    const fat = comprasDaFatura(linhas);
    const ehFatura = (/fatura/.test(tn) && /cartao|credito|mastercard|visa|elo\b/.test(tn) && fat.compras.length >= 1) || fat.compras.length >= 4;
    const ehRecibo = !linha && !ehNota && !ehFatura && (/cupom|recibo|nfc-?e|consumidor|comprovante|\btotal\b/.test(tn));

    if (linha) {
      r.linhaDigitavel = linha.linha;
      marcar('linha', linha.trecho);
      if (linha.centavos) { r.centavos = linha.centavos; r.certeza.centavos = true; }
      if (linha.vencimento) { r.vencimento = linha.vencimento; r.certeza.vencimento = true; }
    }

    if (ehNota) {
      r.tipo = 'nota';
      Object.assign(r, lerNota(linhas, tudo));
      const tot = aposRotulo(linhas, /valor total da nota|v\.? ?total da nota|valor total dos produtos|total da nota/, valoresDe);
      if (tot) { r.centavos = tot.centavos; r.certeza.centavos = true; marcar('centavos', tot.trecho); }
      if (r.emitente) { r.certeza.emitente = true; marcar('emitente', linhas.find((l) => norm(l).includes(norm(r.emitente).slice(0, 12))) || null); }
      if (r.duplicatas.length) {
        r.vencimento = r.duplicatas[0].iso; r.certeza.vencimento = true;
        marcar('duplicatas', r.duplicatas[0].trecho);
        const soma = r.duplicatas.reduce((a, d) => a + d.centavos, 0);
        r.somaConfere = r.centavos ? soma === r.centavos : null;
        if (!r.centavos) r.centavos = soma;
      } else if (venc) { r.vencimento = venc.iso; marcar('vencimento', venc.trecho); }
      const curto = r.emitente ? r.emitente.replace(/\b(LTDA|ME|EPP|S\.?A\.?|EIRELI)\b\.?/gi, '').replace(/\s+/g, ' ').trim() : '';
      r.desc = [r.numero ? `NF ${r.numero}` : 'Nota fiscal', curto].filter(Boolean).join(' · ').slice(0, 80);
      r.certeza.desc = !!r.numero;
      return r;
    }

    if (ehFatura) {
      r.tipo = 'fatura'; r.categoria = 'cartao';
      r.cartao = acharCartao(tn);
      r.compras = fat.compras; r.creditos = fat.creditos;
      const tot = aposRotulo(linhas, /total (desta|da) fatura|valor total da fatura|total a pagar|valor da fatura|pagamento total|total$/, valoresDe);
      if (tot && !r.centavos) { r.centavos = tot.centavos; r.certeza.centavos = true; marcar('centavos', tot.trecho); }
      if (venc && !r.vencimento) { r.vencimento = venc.iso; r.certeza.vencimento = true; marcar('vencimento', venc.trecho); }
      if (fat.compras.length) marcar('compras', fat.compras[0].trecho);
      const soma = fat.compras.reduce((a, c) => a + c.centavos, 0) - fat.creditos.reduce((a, c) => a + c.centavos, 0);
      r.somaConfere = r.centavos ? soma === r.centavos : null;
      if (!r.centavos && soma > 0) r.centavos = soma;
      r.desc = r.cartao ? `Fatura ${r.cartao}` : 'Fatura do cartão';
      r.certeza.desc = !!r.cartao; r.certeza.cartao = !!r.cartao;
      return r;
    }

    // conta de consumo, boleto ou recibo
    const conta = CONTAS.find(([re]) => re.test(tn));
    if (conta) { r.desc = conta[1]; r.categoria = conta[2]; r.certeza.desc = true; }
    else if (linha?.segmento) { r.desc = linha.segmento; r.certeza.desc = true; }

    if (ehRecibo) {
      r.tipo = 'recibo'; r.categoria = conta ? conta[2] : 'variavel';
      const tot = aposRotulo(linhas, /valor total|total a pagar|total geral|\btotal\b|valor pago|valor recebido|importancia de/, valoresDe);
      if (tot) { r.centavos = tot.centavos; r.certeza.centavos = true; marcar('centavos', tot.trecho); }
      const d = venc || (() => { const ds = linhas.flatMap((l) => datasDe(l).map((x) => ({ ...x, trecho: l }))); return ds[0] || null; })();
      if (d) { r.vencimento = d.iso; r.certeza.vencimento = true; marcar('vencimento', d.trecho); }
      if (!r.desc) {
        const nome = linhas.find((l) => /\p{L}{3}/u.test(l) && !/cnpj|cpf|rua|av\.|avenida|endereco|cupom|recibo|inscri|\bie\b|tel|fone|data|hora|extrato|documento|nfc|sat\b|danfe|^\d/.test(norm(l)));
        if (nome) { r.desc = titulo(nome).slice(0, 60); r.certeza.desc = false; marcar('desc', nome); }
      }
      r.cnpj = (CNPJ.exec(tudo) || [null])[0];
      return r;
    }

    r.tipo = linha ? 'boleto' : 'documento';
    if (!r.centavos) {
      const tot = aposRotulo(linhas, /total a pagar|valor do documento|valor a pagar|valor cobrado|valor total|total da conta|\bvalor\b|\btotal\b/, valoresDe);
      if (tot) { r.centavos = tot.centavos; r.certeza.centavos = !linha; marcar('centavos', tot.trecho); }
    } else {
      const igual = linhas.find((l) => valoresDe(l).some((v) => v.centavos === r.centavos));
      marcar('centavos', igual);
    }
    if (!r.vencimento && venc) { r.vencimento = venc.iso; r.certeza.vencimento = true; marcar('vencimento', venc.trecho); }
    else if (r.vencimento) marcar('vencimento', linhas.find((l) => datasDe(l).some((d) => d.iso === r.vencimento)));
    if (!r.desc) {
      const benef = aposRotulo(linhas, /beneficiario|cedente|favorecido/, (t) => { const s = t.replace(/^[\s:–-]+/, '').replace(CNPJ, '').replace(/cnpj.*$/i, '').trim(); return s.length > 2 && /\p{L}{3}/u.test(s) ? [{ texto: s }] : []; });
      if (benef) { r.desc = titulo(benef.texto).slice(0, 60); marcar('desc', benef.trecho); }
      r.certeza.desc = false;
    }
    return r;
  }

  /** Formata a linha digitável em blocos, como no boleto. */
  function formatarLinha(d) {
    if (!d) return '';
    if (d.length === 47) return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d[32]} ${d.slice(33)}`;
    return [0, 1, 2, 3].map((i) => `${d.slice(i * 12, i * 12 + 11)}-${d[i * 12 + 11]}`).join(' ');
  }

  return { ler, interpretarLinha, dataDoFator, mod10, mod11Arrecadacao, formatarLinha, comprasDaFatura };
});
