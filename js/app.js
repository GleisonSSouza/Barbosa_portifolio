/* ==========================================================================
   Início: liga o banco local, escuta as mudanças e conecta os cliques.

   Os botões não têm onclick no HTML. Cada um tem data-act="nome" e,
   se precisar, data-id / data-k / data-n... O mapa ACTIONS abaixo diz
   o que cada nome faz.
   ========================================================================== */
let db = null, assets = null, owner = false;
let stopBookings = null;

/* ---------- cliques ---------- */
const ACTIONS = {
  // site
  book: el => book(el.dataset.id),
  openCourse: el => openCourse(+el.dataset.i),
  stepCourse: el => stepCourse(+el.dataset.n),
  zoom: el => zoom(el.src),
  openAdm: (el, e) => { e.preventDefault(); openAdm(); },

  // agendamento
  closeBk,
  toggleService: el => toggleService(el.dataset.id),
  confirmServices,
  pickMonth: el => pickMonth(el.dataset.k),
  pickDate: el => pickDate(el.dataset.k),
  pickTime: el => pickTime(el.dataset.t),
  goStep: el => goStep(+el.dataset.n),
  saveContact,
  confirmBooking,

  // painel
  tab: el => { if (!leaveEdit()) return; S.tab = el.dataset.tab; drawAdm(true); },
  closeAdm,
  logout: () => { if (leaveEdit()) logout(); },
  closeLogin,
  seed: el => seed(el.dataset.c),
  newItem: el => newItem(el.dataset.c),
  editItem: el => editItem(el.dataset.id),
  cancelEdit,
  saveItem: el => saveItem(el.dataset.c, el.dataset.id, el),
  delItem: el => delItem(el.dataset.c, el.dataset.id),
  saveCfg: el => saveCfg(el),
  setMonth: el => setMonth(el.dataset.k, el.dataset.open === '1'),
  clearDemo,

  // categorias
  useCat: el => useCat(el),
  forceNewCat: el => forceNewCat(el),
  catAdd: () => catAdd(),
  catMove: el => catMove(el.dataset.cat, +el.dataset.n),
  catRename: el => catRename(el.dataset.cat),
  catDelete: el => catDelete(el.dataset.cat),
  catMerge: el => catMerge(el.dataset.from, el.dataset.to),

  // calendário
  calView: el => { S.cv = el.dataset.v; drawAdm(true); },
  calNav: el => calNav(+el.dataset.n),
  calToday: () => { S.cd = today(); drawAdm(true); },
  goDay: el => goDay(el.dataset.k),
  bookAdm: (el, e) => { e.stopPropagation(); bookAdm(el.dataset.k, el.dataset.t); },
  blockTime,
  unblock: el => unblock(el.dataset.id),
  confirmB: el => confirmB(el.dataset.id),
  cancelB: el => cancelB(el.dataset.id),
  rescheduleB: el => rescheduleB(el.dataset.id)
};

const CHANGES = { uploadImage, uploadMedia, toggleMonth, catSelect };
const INPUTS = { filterBookings, catTyping };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
});
document.addEventListener('change', e => {
  const fn = CHANGES[e.target.dataset.change];
  if (fn) fn(e.target);
});
document.addEventListener('input', e => {
  const fn = INPUTS[e.target.dataset.input];
  if (fn) fn(e.target);
});

// qualquer mudança no formulário aberto do painel marca "não salvo"
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  if (e.target.closest('#am .row.editing')) S.dirty = true;
}));

// clicar no fundo escuro fecha a janela
['#bk', '#lg'].forEach(id => $(id).addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('on');
}));
// a foto ampliada fecha com qualquer clique
$('#zm').addEventListener('click', () => $('#zm').classList.remove('on'));

// Esc fecha a janela aberta
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  for (const id of ['#zm', '#bk', '#lg']) {
    if ($(id).classList.contains('on')) { $(id).classList.remove('on'); return; }
  }
});

$('#lgForm').addEventListener('submit', doLogin);

/* ---------- login ---------- */
function setOwner(on) {
  owner = on;
  $('#admBtn').hidden = !on;
  if (on && db && !stopBookings) {
    stopBookings = db.collection('bookings').onSnapshot(s => {
      S.bookings = s.docs.map(d => ({ id: d.id, ...d.data() }));
      drawAdm();
    });
  }
  if (!on) {
    if (stopBookings) stopBookings();
    stopBookings = null;
    S.bookings = [];
  }
}

// volta o estado ao conteúdo padrão (usado ao apagar a demonstração)
function resetState() {
  S.cfg = { ...DEF.cfg };
  ['services', 'courses', 'banners', 'feedbacks'].forEach(c => { S[c] = DEF[c]; });
  S.slots = new Set();
  S.slotSt = {};
}

/* ---------- endereço #painel abre o login ---------- */
function route() {
  if (location.hash === '#painel') openAdm();
}
addEventListener('hashchange', route);

/* ---------- início ---------- */
drawPublic();

(async () => {
  try { ({ db, assets } = await Store.ready()); } catch (e) { console.warn('Banco local indisponível', e); }

  setOwner(Auth.isOwner());
  route();
  if (!db) return;

  // conteúdo editável: se a coleção estiver vazia, mostra os exemplos
  for (const c of ['services', 'courses', 'banners', 'feedbacks']) {
    db.collection(c).onSnapshot(s => {
      S[c] = s.empty ? DEF[c] : s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.ord || 0) - (b.ord || 0));
      drawPublic();
      drawAdm();
    });
  }

  db.doc('config/main').onSnapshot(s => {
    S.cfg = s.exists ? { ...DEF.cfg, ...s.data() } : { ...DEF.cfg };
    drawPublic();
    drawAdm();
    if ($('#bk').classList.contains('on') && B.step === 2) drawBk();   // mês abriu ou fechou com a janela aberta
  });

  db.collection('slots').onSnapshot(s => {
    S.slots = new Set(s.docs.map(d => d.id));
    S.slotSt = {};
    s.docs.forEach(d => { S.slotSt[d.id] = d.data().st || 'ok'; });
    if ($('#bk').classList.contains('on') && B.step === 2) drawBk();
    if (S.tab === 'cal' || S.tab === 'dash') drawAdm();
  });
})();
