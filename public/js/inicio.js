/* Vértice — página de apresentação: revela as seções ao rolar. Sem JavaScript, tudo aparece normalmente. */
(function () {
  'use strict';
  const reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduzir || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');
  const obs = new IntersectionObserver((itens) => {
    for (const i of itens) if (i.isIntersecting) { i.target.classList.add('visivel'); obs.unobserve(i.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  const ligar = () => document.querySelectorAll('.rev').forEach((el) => obs.observe(el));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar); else ligar();
})();
