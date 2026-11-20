/* ==========================================================================
   Funções de apoio usadas pelos outros scripts
   ========================================================================== */
window.U = (function () {
  const D = window.SITE_DATA;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: n % 1 ? 2 : 0 });
  const digits = s => String(s || '').replace(/\D/g, '');

  // links de contato
  const wa = text => `https://wa.me/${digits(D.cfg.wa)}?text=${encodeURIComponent(text)}`;
  const ig = () => `https://instagram.com/${D.cfg.ig.replace('@', '')}`;

  // iniciais para o avatar: "Ana Paula S." -> "AP"
  const initials = n => n.replace(/[^A-Za-zÀ-ú ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  return { $, esc, brl, digits, wa, ig, initials, reduceMotion };
})();
