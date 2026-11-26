/* ==========================================================================
   Parte pública do site: topo, comunicados, serviços, cursos, feedbacks
   e rodapé. Tudo é redesenhado a partir de S sempre que os dados mudam.
   ========================================================================== */

function drawPublic() {
  drawHero();
  drawBanners();
  drawServices();
  drawCourses();
  drawFeedbacks();
  drawFooter();
  applyBgs();   // fotos de fundo (ver bgImg em js/utils.js)
}

/* ---------- topo ---------- */
function drawHero() {
  const c = S.cfg;
  $('#hName').textContent = c.name;
  $('#hTag').textContent = c.tag;
  $('#hBio').textContent = c.bio;
  const img = safeMedia(c.img), hero = $('#hImg');
  hero.removeAttribute('style');
  if (img) Object.assign(hero.style, {
    backgroundImage: cssUrl(img) + ', linear-gradient(160deg,#B39977,#EDE6D9)',
    backgroundPosition: 'center top',
    backgroundSize: 'cover'
  });

  // meses com agenda aberta, a partir do mês atual
  const open = openMonthList()
    .filter(k => k >= today().slice(0, 7))
    .map(k => noon(k + '-01').toLocaleDateString('pt-BR', { month: 'long' }));
  $('#agSt').textContent = open.length
    ? '● Agenda aberta: ' + open.join(', ')
    : '● Agenda fechada no momento. Fique atenta aos comunicados.';
}

/* ---------- comunicados ---------- */
function drawBanners() {
  const t = today();
  const list = S.banners
    .filter(b => b.on && (!b.from || b.from <= t) && (!b.to || b.to >= t))
    .sort((a, b) => (b.prio || 0) - (a.prio || 0));

  $('#banners').innerHTML = list.map(b => `
    <div class="banner ${b.hi ? 'hi' : ''}" ${bgImg(b.img)}>
      ${safeMedia(b.img) ? '<div class="shade"></div>' : ''}
      <div class="eyebrow">Comunicado</div>
      <h3>${esc(b.title)}</h3>
      <p>${esc(b.text)}</p>
      ${safeLink(b.link) ? `<a class="btn s" href="${esc(safeLink(b.link))}" target="_blank" rel="noopener">Saiba mais</a>` : ''}
    </div>`).join('');
}

/* ---------- serviços ---------- */
function drawServices() {
  const card = s => `
    <div class="card">
      <div class="ph" ${bgImg(s.img)}></div>
      <div class="txt">
        <h3>${esc(s.name)}</h3>
        <p class="meta">${s.desc ? esc(s.desc) + '<br>' : ''}⏱ ${esc(durText(s))}</p>
        <span class="price">${brl(s.price)}</span> &nbsp;
        <button class="btn s" data-act="book" data-id="${esc(s.id)}">Agendar</button>
      </div>
    </div>`;

  $('#svcs').innerHTML = byCat(S.services.filter(s => s.on)).map(([cat, list]) =>
    (cat ? `<h3 class="cat">${esc(cat)}</h3>` : '') + `<div class="grid">${list.map(card).join('')}</div>`
  ).join('');
}

/* ---------- cursos (sanfona) ---------- */
const COURSE_BG = ['#B39977,#684F36', '#EDE6D9,#B39977', '#684F36,#B39977'];
const activeCourses = () => S.courses.filter(x => x.on);

function drawCourses() {
  const c = S.cfg, list = activeCourses();
  if (S.open >= list.length) S.open = 0;

  $('#acc').innerHTML = list.map((x, i) => {
    const im = x.img || c.img;
    const msg = +x.price > 0 ? 'Olá! Quero participar do curso ' + x.name : 'Olá! Quero saber os valores e as próximas turmas do ' + x.name + '.';
    return `
    <div class="p ${i === S.open ? 'open' : ''}" data-act="openCourse" data-i="${i}">
      <div class="bg" ${bgImg(im)} data-grad="linear-gradient(160deg,${COURSE_BG[i % 3]})"></div>
      <div class="v">${esc(x.name)}</div>
      <div class="in">
        <span>
          <span class="tag">${esc(x.mode)}</span><span class="tag">${esc(x.dur)}</span><span class="tag">${x.excl ? 'Exclusivo para clientes' : 'Aberto ao público'}</span>
        </span>
        <h3>${esc(x.name)}</h3>
        <div>${esc(x.desc)}</div>
        ${x.prog ? `<small><b>Conteúdo:</b> ${esc(x.prog).replace(/\n/g, ' · ')}</small>` : ''}
        ${x.pay ? `<small><b>Pagamento:</b> ${esc(x.pay)}</small>` : ''}
        ${x.info ? `<small><b>Inscrição:</b> ${esc(x.info)}</small>` : ''}
        <div>${+x.price > 0 ? `<span class="price">${brl(x.price)}</span> &nbsp;` : ''}<a class="btn s" target="_blank" rel="noopener" href="${waLink(c.wa, msg)}">${+x.price > 0 ? 'Quero participar' : 'Consultar valores'}</a></div>
      </div>
    </div>`;
  }).join('');
}

function openCourse(i) {
  S.open = i;
  $$('.p').forEach((p, j) => p.classList.toggle('open', j === i));
}

function stepCourse(d) {
  const n = activeCourses().length;
  if (n) openCourse((S.open + d + n) % n);
}

/* ---------- feedbacks ---------- */
// repete a lista para a faixa rolar sem buraco
function repeat(a) {
  if (!a.length) return [];
  let r = a;
  while (r.length < 6) r = r.concat(a);
  return r.concat(r);
}

const avatar = f => `<span class="av ph" ${bgImg(f.av)}></span>`;

function fbCard(f) {
  const src = safeMedia(f.media, f.mt === 'video' ? 'video' : 'image');
  const media = !src ? ''
    : f.mt === 'video'
      ? `<video src="${esc(src)}" controls playsinline preload="metadata"></video>`
      : `<img src="${esc(src)}" alt="Feedback" loading="lazy" data-act="zoom">`;
  return `<div class="fc">${media}${f.text ? `<p>“${esc(f.text)}”</p>` : ''}<div class="who">${avatar(f)}<b>${esc(f.handle)}</b></div></div>`;
}

const fbPill = f => `<div class="pl">${avatar(f)}<div><b>${esc(f.handle)}</b><small>${esc(f.role)}</small></div></div>`;

function drawFeedbacks() {
  const all = S.feedbacks.filter(f => f.on);
  const withContent = all.filter(f => f.media || f.text);

  $('#fbc').innerHTML = withContent.length
    ? `<div class="trk" style="animation-duration:${Math.max(30, withContent.length * 9)}s">${repeat(withContent).map(fbCard).join('')}</div>` : '';
  $('#fbh').innerHTML = all.length
    ? `<div class="trk r" style="animation-duration:${Math.max(30, all.length * 7)}s">${repeat(all).map(fbPill).join('')}</div>` : '';
  $('#feedbacks').style.display = all.length ? '' : 'none';
}

function zoom(src) {
  const safe = safeMedia(src);
  if (!safe) return;
  $('#zm').innerHTML = `<img src="${esc(safe)}" alt="">`;
  $('#zm').classList.add('on');
}

/* ---------- rodapé ---------- */
function drawFooter() {
  const c = S.cfg;
  $('#ct').innerHTML = `
    <h3>${esc(c.name)}</h3>
    <p>${esc(c.addr)}<br>
      <a href="${waLink(c.wa)}">WhatsApp</a> · <a href="https://instagram.com/${encodeURIComponent(String(c.ig || '').replace('@', '').trim())}" target="_blank" rel="noopener">${esc(c.ig)}</a>
    </p>`;
}
