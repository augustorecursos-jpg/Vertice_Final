/*
 * Vértice — menu do celular: 4 atalhos fixos + "Mais" (painel com o resto e o Sair).
 * Lê os links do menu lateral (#menu a[data-secao]), então ícones, nomes, avisos e links ficam num lugar só.
 * Uso: const nav = VerticeNav.criar({ fixos: ['mes', ...], mais: [['Grupo', ['ano', ...]], ...], ic, abrirModal });
 *      nav.atualizar(secaoAtual) depois de cada render.
 */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function criar({ fixos, mais, ic, abrirModal }) {
    const link = (id) => document.querySelector(`#menu a[data-secao="${id}"]`);
    const visivel = (id) => { const a = link(id); return a && !a.hidden; };
    const curto = (a) => (a.querySelector('.rot-curto') || a.querySelector('span')).textContent.trim();
    const longo = (a) => (a.querySelector('.rot-longo') || a.querySelector('span')).textContent.trim();
    const icone = (a) => a.querySelector('svg')?.outerHTML || '';
    const aviso = (a) => { const c = a.querySelector('.cont'); return c && !c.hidden && c.textContent.trim() ? { n: c.textContent.trim(), aviso: c.classList.contains('aviso') } : null; };

    const barra = document.createElement('nav');
    barra.className = 'nav-celular';
    barra.setAttribute('aria-label', 'Menu');
    document.body.append(barra);

    function desenhar(atual) {
      const itensMais = mais.flatMap(([, ids]) => ids).filter(visivel);
      const somaMais = itensMais.map((id) => aviso(link(id))).filter(Boolean);
      const total = somaMais.reduce((a, x) => a + (Number(x.n) || 0), 0);
      barra.innerHTML = fixos.filter(visivel).map((id) => {
        const a = link(id), av = aviso(a);
        return `<a href="#${id}" class="${id === atual ? 'ativo' : ''}" ${id === atual ? 'aria-current="page"' : ''}>${icone(a)}<span>${esc(curto(a))}</span>${av ? `<b class="cont ${av.aviso ? 'aviso' : ''}">${esc(av.n)}</b>` : ''}</a>`;
      }).join('') + (itensMais.length ? `<button type="button" class="${itensMais.includes(atual) ? 'ativo' : ''}" data-nav-mais aria-haspopup="dialog">${ic('pontos')}<span>Mais</span>${total ? `<b class="cont ${somaMais.some((x) => x.aviso) ? 'aviso' : ''}">${total}</b>` : ''}</button>` : '');
    }

    function abrirMais() {
      const grupos = mais.map(([nome, ids]) => [nome, ids.filter(visivel)]).filter(([, ids]) => ids.length);
      const { modal, fechar } = abrirModal(`<div class="modal folha-mais" role="dialog" aria-modal="true" aria-labelledby="t-mais">
          <div class="pega" aria-hidden="true"></div>
          <div class="cab-modal"><h2 id="t-mais">Mais opções</h2><button type="button" class="btn fantasma icone" data-fechar aria-label="Fechar">${ic('x')}</button></div>
          ${grupos.map(([nome, ids]) => `${nome && grupos.length > 1 ? `<div class="grupo-m">${esc(nome)}</div>` : ''}<div class="grade-m">${ids.map((id) => {
            const a = link(id), av = aviso(a);
            return `<a href="#${id}" class="${location.hash.replace('#', '').split('/')[0] === id ? 'ativo' : ''}">${icone(a)}<span>${esc(longo(a))}</span>${av ? `<b class="cont ${av.aviso ? 'aviso' : ''}">${esc(av.n)}</b>` : ''}</a>`;
          }).join('')}</div>`).join('')}
          <button type="button" class="sair-m" data-sair>${ic('sair')} Sair</button>
        </div>`, { estreito: true });
      modal.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) fechar(); });
    }
    barra.addEventListener('click', (e) => { if (e.target.closest('[data-nav-mais]')) abrirMais(); });
    // Avisos e links do menu lateral mudam sozinhos (atrasados, assinaturas): a barra acompanha.
    let ultima = null;
    new MutationObserver(() => desenhar(ultima)).observe(document.querySelector('#menu'), { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class'] });

    return { atualizar: (atual) => { ultima = atual; desenhar(atual); } };
  }

  window.VerticeNav = { criar };
})();
