/* Vértice — tela de login. */
(function () {
  'use strict';
  const ICONES = {
    calendario: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    repetir: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    grafico: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  };
  document.querySelectorAll('i[data-ic]').forEach((el) => {
    el.outerHTML = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[el.dataset.ic] || ''}</svg>`;
  });

  const form = document.getElementById('form-login');
  const erro = document.getElementById('erro');
  const botao = document.getElementById('entrar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = form.login.value.trim();
    const senha = form.senha.value;
    if (!login || !senha) { erro.textContent = 'Informe usuário e senha.'; return; }
    erro.textContent = '';
    botao.disabled = true;
    botao.textContent = 'Entrando…';
    try {
      const r = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, senha }),
      });
      if (r.ok) { location.replace('/'); return; }
      const d = await r.json().catch(() => ({}));
      erro.textContent = d.erro || 'Não foi possível entrar.';
      form.senha.value = '';
      form.senha.focus();
    } catch {
      erro.textContent = 'Sem conexão com o servidor. Tente de novo.';
    }
    botao.disabled = false;
    botao.textContent = 'Entrar';
  });
})();
