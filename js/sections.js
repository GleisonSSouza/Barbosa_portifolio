/* ==========================================================================
   Preenche as seções com o conteúdo de js/data.js:
   recado, tabela de valores, cursos (com filtro), sobre e rodapé.
   ========================================================================== */
(function () {
  const D = window.SITE_DATA;
  const { $, esc, brl, wa, ig } = window.U;

  /* ---------- recado ---------- */
  $('#bTitle').textContent = D.banner.title;
  $('#bText').textContent = D.banner.text;

  /* ---------- tabela de valores ---------- */
  $('#svc').innerHTML = D.services.map(s => `
    <button class="item" data-book="${s.id}">
      <span class="line"><h3>${esc(s.name)}</h3><span class="dots"></span><span class="price">${brl(s.price)}</span></span>
      <span class="sub"><span>${esc(s.desc)} ${s.dur} min.</span><span class="go">Agendar</span></span>
    </button>`).join('');
  $('#duv').href = wa('Olá, Laís! Tenho uma dúvida sobre os procedimentos.');

  /* ---------- cursos ---------- */
  const check = (bg, fg) => `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="${bg}"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // ícone de cada curso (arco da sobrancelha, tigela de henna, flor)
  const ICONS = {
    c1: '<svg viewBox="0 0 46 46" aria-hidden="true"><path d="M6 32C13 15 30 9 40 22" fill="none" stroke="#E6BC5C" stroke-width="9" stroke-linecap="round"/></svg>',
    c2: '<svg viewBox="0 0 46 46" aria-hidden="true"><path d="M3 20h40a20 20 0 0 1-40 0z" fill="#E6BC5C"/><circle cx="31" cy="10" r="6" fill="#F1D9CF"/></svg>',
    c3: '<svg viewBox="0 0 46 46" aria-hidden="true"><g fill="#3E4524"><ellipse cx="23" cy="11" rx="6" ry="10"/><ellipse cx="23" cy="35" rx="6" ry="10"/><ellipse cx="11" cy="23" rx="10" ry="6"/><ellipse cx="35" cy="23" rx="10" ry="6"/></g><circle cx="23" cy="23" r="5" fill="#E6BC5C"/></svg>'
  };

  const grid = $('#crs');
  let drawn = false;

  function drawCourses(mode) {
    const list = D.courses.filter(c => !mode || c.mode === mode);
    grid.classList.toggle('all', !mode);
    grid.innerHTML = list.map(c => {
      const k = D.courses.indexOf(c) + 1; // cor do cartão segue a posição original
      return `
      <article class="ca-card k${k}">
        ${c.excl ? '<span class="ca-excl">Só para clientes</span>' : ''}
        <div class="ca-top">${ICONS[c.id] || ''}<div><h3>${esc(c.name)}</h3><small>${esc(c.mode)}, ${esc(c.dur)}</small></div></div>
        <div class="ca-price"><span>R$</span>${c.price.toLocaleString('pt-BR')}</div>
        <p class="ca-pay">${esc(c.pay)}</p>
        <p class="ca-desc">${esc(c.desc)}</p>
        <ul class="ca-list">${[...c.prog, c.info].map(p => `<li>${check('var(--ckbg)', 'var(--ckfg)')}${esc(p)}</li>`).join('')}</ul>
        <a class="ca-btn" target="_blank" rel="noopener" href="${wa('Olá, Laís! Quero participar do curso ' + c.name + '.')}">Quero participar</a>
      </article>`;
    }).join('') || '<p class="ca-empty">Nenhum curso nesse formato por enquanto.</p>';

    // ao trocar o filtro, os cartões novos entram em sequência (css/motion.css → .enter)
    if (drawn) [...grid.children].forEach((c, i) => { c.classList.add('enter'); c.style.setProperty('--i', i); });
    drawn = true;
  }

  drawCourses('');
  document.querySelectorAll('.ca-seg button').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.ca-seg button').forEach(x => x.setAttribute('aria-pressed', x === btn));
    drawCourses(btn.dataset.f);
  }));

  /* ---------- sobre e rodapé ---------- */
  $('#aBio').textContent = D.cfg.bio;
  $('#fAddr').textContent = D.cfg.addr;
  $('#fWa').href = wa('Olá, Laís!');
  $('#fIg').href = ig();
  $('#fIg').textContent = D.cfg.ig;
})();
