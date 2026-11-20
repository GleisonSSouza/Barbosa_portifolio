/* ==========================================================================
   Movimento: revelar ao rolar, títulos palavra a palavra, barra fixa
   e marcação da seção atual. Carregado com defer, depois do conteúdo montado.
   Marcações no HTML:
     data-rv          sobe e aparece        data-rv="pop"   cresce e aparece
     data-rv="clip"   título palavra a palavra
     data-rv="ink"    assinatura "escrita" da esquerda para a direita
     data-rv-group    os filhos aparecem em sequência
   ========================================================================== */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Títulos: cada palavra sobe de dentro de uma máscara, com 45ms entre elas.
  function splitWords(h) {
    if (h.dataset.split) return;
    h.dataset.split = '1';
    const words = h.textContent.trim().split(/\s+/).map(w => w.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
    h.setAttribute('aria-label', words.join(' '));
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--w:${i}">${w}</span></span>`).join(' ');
  }

  // Elementos que começam recortados (clip-path) têm área zero e o
  // IntersectionObserver não os vê; nesses casos observamos o pai.
  const targets = new Map();
  const show = el => {
    const i = +el.style.getPropertyValue('--i') || 0;
    el.classList.add('in');
    setTimeout(() => { el.removeAttribute('data-rv'); el.classList.remove('in'); }, (reduce ? 400 : 1800) + i * 70);
  };
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      (targets.get(e.target) || []).forEach(show);
      targets.delete(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  const watch = el => {
    const kind = el.getAttribute('data-rv');
    if (kind === 'clip') splitWords(el);
    const t = kind === 'clip' || kind === 'ink' ? el.parentElement : el;
    if (!targets.has(t)) { targets.set(t, []); io.observe(t); }
    targets.get(t).push(el);
  };

  function scan(root = document) {
    root.querySelectorAll('[data-rv-group]').forEach(g => {
      const kind = g.getAttribute('data-rv-group');
      [...g.children].forEach((c, i) => {
        if (!c.hasAttribute('data-rv')) c.setAttribute('data-rv', kind);
        c.style.setProperty('--i', i);
      });
      g.removeAttribute('data-rv-group');
    });
    root.querySelectorAll('[data-rv]').forEach(watch);
  }
  scan();
  window.Reveal = { scan };

  // Barra fixa: aparece quando o topo sai da tela.
  const bar = document.querySelector('.bar'), hero = document.querySelector('.hero');
  if (bar && hero) {
    new IntersectionObserver(([e]) => {
      const on = !e.isIntersecting;
      bar.classList.toggle('on', on);
      bar.inert = !on;
    }).observe(hero);
  }

  // Seção atual na barra.
  const links = [...document.querySelectorAll('.bar ul a')];
  const byId = new Map();
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1), sec = document.getElementById(id);
    if (sec) byId.set(sec, a); else a.parentElement.remove();
  });
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.removeAttribute('aria-current'));
      byId.get(e.target)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, sec) => spy.observe(sec));
})();
