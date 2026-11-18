/*
 * Vértice — leitura de foto ou PDF no próprio aparelho (nada é enviado ao servidor).
 * PDF: pdf.js tira o texto (se o PDF for só imagem, vira foto). Foto: Tesseract (OCR em português).
 * As regras de interpretação ficam em leitor.js; aqui é a parte de navegador e a tela de conferência.
 */
(function () {
  'use strict';
  const VENDOR = '/vendor/';
  const MAX_MB = 15;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- bibliotecas (carregadas só quando alguém usa a leitura) ----------
  let pdfjs = null, tesseract = null;
  async function carregarPdf() {
    if (!pdfjs) {
      pdfjs = await import(VENDOR + 'pdfjs/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = VENDOR + 'pdfjs/pdf.worker.min.mjs';
    }
    return pdfjs;
  }
  function carregarTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tesseract) {
      tesseract = new Promise((ok, falha) => {
        const s = document.createElement('script');
        s.src = VENDOR + 'tesseract/tesseract.min.js';
        s.onload = () => ok(window.Tesseract);
        s.onerror = () => { tesseract = null; falha(new Error('Não foi possível carregar o leitor de fotos. Verifique a internet e tente de novo.')); };
        document.head.append(s);
      });
    }
    return tesseract;
  }

  // ---------- extração ----------
  /** Junta os pedaços de texto do PDF em linhas (mesma altura), com a caixa de cada linha em pixels da prévia. */
  function linhasDoPdf(itens, viewport) {
    const grupos = [];
    for (const it of itens) {
      if (!it.str || !it.str.trim()) continue;
      const [x, y] = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
      const h = Math.max(6, Math.hypot(it.transform[2], it.transform[3]) * viewport.scale);
      const w = it.width * viewport.scale;
      let g = grupos.find((k) => Math.abs(k.y - y) < h * 0.5);
      if (!g) { g = { y, partes: [] }; grupos.push(g); }
      g.partes.push({ x, w, h, str: it.str });
    }
    return grupos.sort((a, b) => a.y - b.y).map((g) => {
      g.partes.sort((a, b) => a.x - b.x);
      let txt = '', fim = null;
      for (const p of g.partes) {
        if (fim != null) txt += p.x - fim > p.h * 0.15 ? ' ' : '';
        txt += p.str; fim = p.x + p.w;
      }
      const x0 = g.partes[0].x, x1 = Math.max(...g.partes.map((p) => p.x + p.w)), h = Math.max(...g.partes.map((p) => p.h));
      return { texto: txt.replace(/\s+/g, ' ').trim(), caixa: { x: x0, y: g.y - h, w: x1 - x0, h: h * 1.25 } };
    });
  }

  async function ocr(canvas, aoProgresso) {
    const T = await carregarTesseract();
    const worker = await T.createWorker('por', 1, {
      workerPath: VENDOR + 'tesseract/worker.min.js', corePath: VENDOR + 'tesseract/core', langPath: VENDOR + 'tesseract/lang',
      workerBlobURL: false, gzip: true, cacheMethod: 'none',
      logger: (m) => { if (m.status === 'recognizing text') aoProgresso?.(Math.round(40 + m.progress * 60), 'Lendo o texto da imagem…'); else if (/load/.test(m.status)) aoProgresso?.(20, 'Preparando o leitor de fotos…'); },
    });
    try {
      await worker.setParameters({ preserve_interword_spaces: '1' });
      const { data } = await worker.recognize(canvas);
      const linhas = (data.lines || (data.blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || [])))
        .map((l) => ({ texto: String(l.text || '').replace(/\s+/g, ' ').trim(), caixa: { x: l.bbox.x0, y: l.bbox.y0, w: l.bbox.x1 - l.bbox.x0, h: l.bbox.y1 - l.bbox.y0 } }))
        .filter((l) => l.texto);
      return { linhas, confianca: data.confidence };
    } finally { worker.terminate(); }
  }

  /** Foto: corrige a rotação do celular e reduz para no máximo 2200 px (mais rápido e com mesma leitura). */
  async function canvasDaImagem(arquivo) {
    let img;
    try { img = await createImageBitmap(arquivo, { imageOrientation: 'from-image' }); }
    catch {
      img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => falha(new Error('Não foi possível abrir esta imagem.')); i.src = URL.createObjectURL(arquivo); });
    }
    const esc_ = Math.min(1, 2200 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * esc_); c.height = Math.round(img.height * esc_);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /**
   * Lê o arquivo. Devolve { origem: 'pdf' | 'foto', nome, texto, linhas: [{ texto, caixa }], previa: { url, largura, altura } }.
   */
  async function extrair(arquivo, aoProgresso) {
    if (arquivo.size > MAX_MB * 1024 * 1024) throw new Error(`O arquivo tem mais de ${MAX_MB} MB. Use um arquivo menor ou uma foto.`);
    const ehPdf = arquivo.type === 'application/pdf' || /\.pdf$/i.test(arquivo.name || '');
    if (!ehPdf && !/^image\//.test(arquivo.type)) throw new Error('Envie um PDF ou uma imagem (JPG ou PNG).');
    if (ehPdf) {
      aoProgresso?.(10, 'Abrindo o PDF…');
      const lib = await carregarPdf();
      let doc;
      try { doc = await lib.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), isEvalSupported: false }).promise; }
      catch (e) { throw new Error(e?.name === 'PasswordException' ? 'Este PDF tem senha. Abra no banco e salve uma cópia sem senha, ou tire uma foto da tela.' : 'Não foi possível abrir este PDF.'); }
      const pag = await doc.getPage(1);
      const viewport = pag.getViewport({ scale: Math.min(2, 1100 / pag.getViewport({ scale: 1 }).width) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height);
      await pag.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      aoProgresso?.(50, 'Lendo o texto do PDF…');
      let linhas = linhasDoPdf((await pag.getTextContent()).items, viewport);
      // Faturas longas: as páginas seguintes entram no texto (sem caixas na prévia).
      for (let n = 2; n <= Math.min(doc.numPages, 6); n++) {
        const p = await doc.getPage(n);
        linhas = linhas.concat(linhasDoPdf((await p.getTextContent()).items, p.getViewport({ scale: 1 })).map((l) => ({ texto: l.texto, caixa: null })));
      }
      const previa = { url: canvas.toDataURL('image/jpeg', 0.85), largura: canvas.width, altura: canvas.height };
      if (linhas.filter((l) => l.caixa).length < 3) { // PDF escaneado: só imagem
        aoProgresso?.(30, 'O PDF é uma imagem. Lendo como foto…');
        const r = await ocr(canvas, aoProgresso);
        return { origem: 'foto', nome: arquivo.name, texto: r.linhas.map((l) => l.texto).join('\n'), linhas: r.linhas, previa, paginas: doc.numPages };
      }
      aoProgresso?.(100, 'Pronto');
      return { origem: 'pdf', nome: arquivo.name, texto: linhas.map((l) => l.texto).join('\n'), linhas, previa, paginas: doc.numPages };
    }
    aoProgresso?.(8, 'Abrindo a foto…');
    const canvas = await canvasDaImagem(arquivo);
    const r = await ocr(canvas, aoProgresso);
    return { origem: 'foto', nome: arquivo.name || 'foto.jpg', texto: r.linhas.map((l) => l.texto).join('\n'), linhas: r.linhas, confianca: r.confianca,
      previa: { url: canvas.toDataURL('image/jpeg', 0.8), largura: canvas.width, altura: canvas.height } };
  }

  // ---------- tela ----------
  const zonaHtml = (ic) => `<div class="zona-arq" data-zona-arq>
      <span class="ico">${ic('planilha')}</span>
      <div class="zona-txt"><b>Preencher a partir de um arquivo</b>
        <small>Boleto, fatura do cartão, conta de luz/água/internet, recibo ou nota · PDF, JPG ou PNG</small></div>
      <div class="bts"><button type="button" class="btn sec peq" data-arq="foto">${ic('camera')} Tirar foto</button><button type="button" class="btn sec peq" data-arq="arquivo">${ic('enviar')} Escolher arquivo</button><small class="arrastar">ou arraste aqui</small></div>
      <div class="zona-prog" hidden><div class="barra-l"><span></span></div><small aria-live="polite"></small></div>
      <p class="zona-erro" role="alert" hidden></p>
      <input type="file" accept="image/*" capture="environment" data-arq-input="foto" hidden>
      <input type="file" accept="application/pdf,image/*" data-arq-input="arquivo" hidden>
    </div>`;

  /**
   * Liga a área de arquivo de um formulário. aoLer(extracao) recebe o resultado.
   * Devolve { escolher(qual) } para abrir a câmera ou o seletor de arquivos por fora.
   */
  function ligarZona(modal, aoLer) {
    const zona = modal.querySelector('[data-zona-arq]');
    const prog = zona.querySelector('.zona-prog'), erro = zona.querySelector('.zona-erro');
    let ocupado = false;
    const progresso = (pct, txt) => { prog.hidden = false; prog.querySelector('span').style.width = `${Math.max(4, pct)}%`; prog.querySelector('small').textContent = txt; };
    async function ler(arquivo) {
      if (!arquivo || ocupado) return;
      ocupado = true; erro.hidden = true; zona.classList.add('lendo');
      zona.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try {
        const ex = await extrair(arquivo, progresso);
        prog.hidden = true;
        await aoLer(ex);
      } catch (e) {
        prog.hidden = true; erro.hidden = false;
        erro.textContent = e.message || 'Não foi possível ler este arquivo.';
        console.warn('leitura', e);
      } finally {
        ocupado = false; zona.classList.remove('lendo');
        zona.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      }
    }
    const escolher = (qual) => zona.querySelector(`[data-arq-input="${qual}"]`).click();
    zona.addEventListener('click', (e) => { const b = e.target.closest('[data-arq]'); if (b) escolher(b.dataset.arq); });
    zona.addEventListener('change', (e) => { const i = e.target.closest('[data-arq-input]'); if (i) { const a = i.files[0]; i.value = ''; ler(a); } });
    modal.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); zona.classList.add('arrastando'); } });
    modal.addEventListener('dragleave', (e) => { if (!modal.contains(e.relatedTarget)) zona.classList.remove('arrastando'); });
    modal.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); zona.classList.remove('arrastando'); ler(e.dataTransfer.files[0]); } });
    return { escolher, ler };
  }

  /** Acha a linha da extração que corresponde a um trecho do texto (para desenhar a caixa numerada). */
  function caixaDe(ex, trecho) {
    if (!trecho) return null;
    const t = trecho.replace(/\s+/g, ' ').trim();
    const l = ex.linhas.find((x) => x.caixa && x.texto === t) || ex.linhas.find((x) => x.caixa && (x.texto.includes(t) || (x.texto.length > 6 && t.includes(x.texto))));
    return l?.caixa || null;
  }

  /**
   * Monta a tela de conferência no modal: prévia do arquivo à esquerda (com as caixas numeradas)
   * e o formulário à direita. Devolve { selo(rotuloEl, tipo, n) } para marcar os campos preenchidos.
   */
  function montarConferencia(modal, ex, leitura, { ic, aviso = '', lerOutro }) {
    const grade = modal.querySelector('.grade-form');
    let cont = modal.querySelector('.leit');
    if (!cont) {
      cont = document.createElement('div');
      cont.className = 'leit';
      cont.innerHTML = '<div class="prev"></div><div class="leit-form"><div class="leit-status"></div></div>';
      grade.before(cont);
      cont.querySelector('.leit-form').append(grade);
      modal.classList.add('larga');
      modal.querySelector('[data-zona-arq]')?.classList.add('compacta');
      if (lerOutro) {
        const rod = modal.querySelector('.rodape-modal');
        rod.insertAdjacentHTML('afterbegin', `<button type="button" class="btn fantasma ler-outro" data-ler-outro>${ic('repetir')} Ler outro arquivo</button>`);
        rod.querySelector('[data-ler-outro]').addEventListener('click', lerOutro);
      }
    }
    modal.querySelectorAll('.selo-leit, .n-c').forEach((s) => s.remove());
    modal.querySelectorAll('.campo-conf').forEach((s) => s.classList.remove('campo-conf'));
    const { largura: W, altura: H } = ex.previa;
    const caixas = leitura.marcas.map((m) => ({ ...m, c: caixaDe(ex, m.trecho) })).filter((m) => m.c);
    cont.querySelector('.prev').innerHTML = `<div class="arq">${ic(ex.origem === 'pdf' ? 'planilha' : 'camera')} <b>${esc(ex.nome)}</b>${ex.paginas > 1 ? ` <small>· ${ex.paginas} páginas</small>` : ''}</div>
      <div class="prev-img"><div class="prev-pag"><img src="${ex.previa.url}" alt="Prévia do arquivo lido">
        ${caixas.map((m) => `<span class="hl" data-n="${m.n}" style="left:${(m.c.x / W) * 100}%;top:${(m.c.y / H) * 100}%;width:${(m.c.w / W) * 100}%;height:${(m.c.h / H) * 100}%"></span>`).join('')}</div></div>
      <p class="dica">${caixas.length ? 'Os números mostram de onde veio cada campo.' : 'Confira os campos com o arquivo.'}</p>`;
    cont.querySelector('.leit-status').innerHTML = aviso;
    const numero = (campo) => caixas.find((m) => m.campo === campo)?.n;
    return {
      /** tipo: 'lido' | 'confira' | 'sugerido'. campo: nome do campo nas marcas (mostra o número da caixa). */
      selo(rotulo, tipo, campo) {
        if (!rotulo) return;
        const n = campo ? numero(campo) : null;
        if (n) rotulo.insertAdjacentHTML('afterbegin', `<span class="n-c ${tipo === 'confira' ? 'aviso' : ''}">${n}</span>`);
        rotulo.insertAdjacentHTML('beforeend', ` <b class="selo-leit ${tipo}">${{ lido: 'lido ✓', confira: 'confira', sugerido: 'sugerido' }[tipo]}</b>`);
        if (tipo === 'confira') rotulo.parentElement.classList.add('campo-conf');
      },
    };
  }

  const PRIVACIDADE = (ic, ex) => `<p class="privac">${ic('cadeado')} A leitura foi feita no seu aparelho. ${ex.origem === 'foto' ? 'A foto não foi enviada nem guardada.' : 'O arquivo não foi enviado nem guardado.'}</p>`;

  window.VerticeLeitura = { extrair, zonaHtml, ligarZona, montarConferencia, PRIVACIDADE };
})();
