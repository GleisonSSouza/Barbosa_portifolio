/* ==========================================================================
   Depoimentos: pilha de cartões.
   O cartão da frente pode ser arrastado para o lado (vai para o fim da pilha)
   ou trocado pelas setas. A pilha começa fechada e se abre ao aparecer na tela.
   ========================================================================== */
(function () {
  const D = window.SITE_DATA;
  const { $, esc, initials, reduceMotion } = window.U;
  const pile = $('#pile');
  const reviews = D.reviews || [];
  if (!pile || !reviews.length) return;

  const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" fill="currentColor"/></svg>';
  const STARS = `<span class="stars" role="img" aria-label="Nota 5 de 5">${STAR.repeat(5)}</span>`;
  const FLOWER = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 10c-3-5-.5-8.5 0-9 .5.5 3 4 0 9zm0 0c5-3 8.5-.5 9 0-.5.5-4 3-9 0zm0 0c3 5 .5 8.5 0 9-.5-.5-3-4 0-9zm0 0c-5 3-8.5.5-9 0 .5-.5 4-3 9 0z" fill="currentColor"/></svg>';

  pile.innerHTML = reviews.map((r, i) => `
    <article class="pc t${i % 5 + 1}">
      <div class="ph">${FLOWER}${esc(r.what)}</div>
      <div class="pb">${STARS}<p>${esc(r.text)}</p>
        <div class="pf"><span class="dav">${initials(r.name)}</span><b>${esc(r.name)}</b></div>
      </div>
    </article>`).join('');

  const cards = [...pile.children];
  const counter = $('#pcount');
  let order = cards.map((_, i) => i); // order[0] é o cartão da frente
  let busy = false;

  // posição de cada lugar da pilha: [x, y, rotação]
  const SLOTS = [[0, 0, -2], [50, -28, 5], [-54, -40, -7], [76, -62, 9], [-26, -78, -11]];
  const scale = () => Math.max(.4, Math.min(1, pile.clientWidth / 720));
  const at = (x, y, r) => `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${r}deg)`;

  function place() {
    const s = scale();
    order.forEach((ci, slot) => {
      const c = cards[ci], [x, y, r] = SLOTS[Math.min(slot, SLOTS.length - 1)];
      c.style.zIndex = 20 - slot;
      c.style.transform = at(x * s, y * s, r);
      c.setAttribute('aria-hidden', slot ? 'true' : 'false');
    });
    counter.textContent = `${order[0] + 1} de ${cards.length}`;
  }

  // joga o cartão da frente para o lado e o coloca no fim da pilha
  function next(dir = 1) {
    if (busy) return;
    busy = true;
    const s = scale();
    cards[order[0]].style.transform = at(dir * 320 * s, -30 * s, dir * 16);
    setTimeout(() => { order.push(order.shift()); place(); busy = false; }, reduceMotion ? 0 : 190);
  }

  function prev() {
    if (busy) return;
    order.unshift(order.pop());
    place();
  }

  /* arrastar o cartão da frente: passa se andar mais de 90px ou for jogado rápido */
  let startX = null, dx = 0, t0 = 0;
  pile.addEventListener('pointerdown', e => {
    const c = cards[order[0]];
    if (!c.contains(e.target) || busy) return;
    startX = e.clientX; dx = 0; t0 = performance.now();
    c.setPointerCapture(e.pointerId);
    c.style.transition = 'none';
  });
  pile.addEventListener('pointermove', e => {
    if (startX === null) return;
    dx = e.clientX - startX;
    cards[order[0]].style.transform = `translate(-50%,-50%) translate(${dx}px,${-Math.abs(dx) * .06}px) rotate(${-2 + dx / 18}deg)`;
  });
  const endDrag = () => {
    if (startX === null) return;
    const c = cards[order[0]], speed = Math.abs(dx) / Math.max(1, performance.now() - t0);
    c.style.transition = '';
    startX = null;
    if (Math.abs(dx) > 90 || (Math.abs(dx) > 24 && speed > .5)) next(Math.sign(dx) || 1);
    else place();
  };
  pile.addEventListener('pointerup', endDrag);
  pile.addEventListener('pointercancel', endDrag);

  $('#pnext').addEventListener('click', () => next(1));
  $('#pprev').addEventListener('click', prev);
  addEventListener('resize', place);

  /* entrada: a pilha começa fechada e se abre em leque quando aparece na tela */
  function stack() {
    cards.forEach((c, i) => { c.style.zIndex = 20 - order.indexOf(i); c.style.transform = 'translate(-50%,-50%) rotate(-2deg)'; });
    counter.textContent = `1 de ${cards.length}`;
  }
  function deal() {
    order.forEach((ci, slot) => { cards[ci].style.transitionDelay = slot * 70 + 'ms'; });
    place();
    setTimeout(() => cards.forEach(c => { c.style.transitionDelay = ''; }), 900);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    place();
  } else {
    stack();
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      o.disconnect();
      setTimeout(deal, 280);
    }, { threshold: .4 }).observe(pile);
  }
})();
