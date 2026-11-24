/* ==========================================================================
   Agendamento em 4 passos: procedimento > data e horário > dados > revisão.
   O mesmo fluxo serve para a cliente (pré-agendamento) e para a Laís no
   painel (B.adm = 1: agendamento já confirmado, sem as travas da agenda).
   ========================================================================== */
let B = {};
const STEPS = ['', 'Procedimento', 'Data e horário', 'Seus dados', 'Revisão'];
const stepLabel = n => n === 3 && B.adm ? 'Dados da cliente' : STEPS[n];

/* as regras de mês aberto, dias e horários ficam em js/agenda.js */

/* ---------- abrir e fechar ---------- */
function book(id) {
  B = { adm: 0, step: 1, sel: id ? [id] : [], svc: null, month: '', date: '', time: '', name: '', phone: '', err: '' };
  $('#bk').classList.add('on');
  drawBk();
}

function bookAdm(date, time) {
  B = { adm: 1, step: 1, sel: [], svc: null, month: monthOf(date || S.cd), date: date || '', time: time || '', name: '', phone: '', err: '' };
  $('#bk').classList.add('on');
  drawBk();
}

const closeBk = () => $('#bk').classList.remove('on');

/* ---------- ações dos passos ---------- */
function toggleService(id) {
  const i = B.sel.indexOf(id);
  i < 0 ? B.sel.push(id) : B.sel.splice(i, 1);
  drawBk();
}

function chosenServices() {
  return B.sel.map(i => S.services.find(x => x.id === i && x.on)).filter(Boolean);
}

function confirmServices() {
  const list = chosenServices();
  if (!list.length) return;
  B.svc = {
    id: list.map(x => x.id).join(','),
    name: list.map(x => x.name).join(' + '),
    dur: list.reduce((a, x) => a + +x.dur, 0),
    price: list.reduce((a, x) => a + +x.price, 0)
  };
  B.step = 2;
  if (!B.month) B.month = B.date ? monthOf(B.date) : (openMonthsAhead()[0] || monthOf(today()));
  if (B.date && !freeTimes(B.date, B.svc, B.adm).includes(B.time)) B.time = '';
  drawBk();
}

function saveContact() {
  B.name = $('#bn').value.trim();
  B.phone = $('#bp').value.trim();
  if (B.name && dg(B.phone).length >= 10) { B.step = 4; B.err = ''; }
  else B.err = 'Informe nome e telefone com DDD.';
  drawBk();
}

function goStep(n) { B.step = n; B.err = ''; drawBk(); }
function pickMonth(k) { B.month = k; if (monthOf(B.date) !== k) { B.date = ''; B.time = ''; } drawBk(); }
function pickDate(k) { B.date = k; B.time = ''; drawBk(); }
function pickTime(t) { B.time = t; drawBk(); }

/* ---------- desenho de cada passo ---------- */
function stepServices() {
  const on = S.services.filter(s => s.on), list = chosenServices();
  const td = list.reduce((a, x) => a + +x.dur, 0), tp = list.reduce((a, x) => a + +x.price, 0);

  return `<p class="sv">Escolha um ou mais procedimentos:</p>` +
    byCat(on).map(([cat, items]) =>
      (cat ? `<p class="cat2">${esc(cat)}</p>` : '') +
      items.map(s => `
        <div class="row sc ${B.sel.includes(s.id) ? 'on' : ''}" data-act="toggleService" data-id="${esc(s.id)}">
          <span class="ck">${B.sel.includes(s.id) ? '✓' : ''}</span>
          <div><b>${esc(s.name)}</b><br><small>${brl(s.price)} · ${esc(durText(s))}</small></div>
        </div>`).join('')
    ).join('') +
    (list.length ? `<p class="sv"><b>${list.length} selecionado${list.length > 1 ? 's' : ''}</b> · ${td} min · ${brl(tp)}</p>` : '') +
    `<div class="cta"><button class="btn" ${list.length ? '' : 'disabled'} data-act="confirmServices">Continuar</button></div>`;
}

// meses: a cliente vê de cara quais estão abertos
function monthTabs() {
  return `<div class="months">${monthsAhead().map(k => {
    const open = isMonthOpen(k);
    return `<button type="button" class="mchip ${k === B.month ? 'sel' : ''} ${open ? '' : 'closed'}" data-act="pickMonth" data-k="${esc(k)}" aria-pressed="${k === B.month}">
      <b>${monthName(k)}</b><small>${open ? 'agenda aberta' : 'fechada'}</small></button>`;
  }).join('')}</div>`;
}

// calendário do mês com a situação de cada dia
function monthGrid() {
  const first = noon(B.month + '-01');
  let h = `<div class="cal">${WD.map(w => `<span class="wd">${w}</span>`).join('')}`;
  for (let i = 0; i < first.getDay(); i++) h += '<span></span>';

  const label = { past: 'já passou', off: 'sem atendimento', free: 'com horários livres', full: 'lotado' };
  for (let d = 1; d <= daysInMonth(B.month); d++) {
    const k = B.month + '-' + String(d).padStart(2, '0'), st = dayState(k, B.svc, B.adm);
    const off = st === 'past' || st === 'off';
    h += `<button type="button" class="dd is-${st} ${k === B.date ? 'sel' : ''}" ${off ? 'disabled' : `data-act="pickDate" data-k="${k}"`}
      aria-label="${d} de ${monthName(k)}, ${label[st]}" aria-pressed="${k === B.date}">${d}<i></i></button>`;
  }
  return h + `</div>
    <p class="legend"><span><i class="is-free"></i>com horários livres</span><span><i class="is-full"></i>lotado</span><span><i class="is-off"></i>sem atendimento</span></p>`;
}

// horários do dia escolhido: só os livres aparecem
function timeGrid() {
  const times = freeTimes(B.date, B.svc, B.adm);
  const day = noon(B.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  let h = `<p class="day-title">Horários livres de ${day}</p>`;
  if (!B.adm && isPriority(B.date)) h += `<div class="note">Período exclusivo para clientes fixas. Você precisará estar na lista de autorizadas.</div>`;
  if (!times.length) return h + `<div class="empty">Todos os horários deste dia já foram reservados. Escolha outro dia.</div>`;

  return h + `<div class="slots">${times.map(t =>
    `<button type="button" class="slot ${t === B.time ? 'sel' : ''}" data-act="pickTime" data-t="${t}" aria-pressed="${t === B.time}">${t}</button>`).join('')}</div>`;
}

function datePicker() {
  let h = monthTabs();

  if (!isMonthOpen(B.month)) {
    if (!B.adm) {
      const others = openMonthsAhead();
      return h + `<div class="empty"><b>A agenda de ${monthName(B.month)} está fechada.</b><br>${others.length
        ? `Agenda aberta em: ${others.map(k => monthName(k)).join(', ')}.`
        : 'Fique atenta aos comunicados: assim que a agenda abrir, você poderá escolher seu horário aqui.'}</div>`;
    }
    h += `<div class="note">A agenda de ${monthName(B.month)} está fechada para as clientes. Pelo painel você pode agendar mesmo assim.</div>`;
  }

  h += monthGrid();
  if (!B.date || monthOf(B.date) !== B.month) return h + `<div class="empty">Escolha um dia para ver os horários.</div>`;
  return h + timeGrid();
}

function stepDate() {
  const ok = B.date && B.time && freeTimes(B.date, B.svc, B.adm).includes(B.time);
  return datePicker() + `<div class="cta"><button class="btn" ${ok ? '' : 'disabled'} data-act="goStep" data-n="3">Continuar</button><button class="lk" data-act="goStep" data-n="1">Trocar procedimento</button></div>`;
}

function stepContact() {
  return `<label for="bn">Nome</label><input id="bn" autocomplete="name" value="${esc(B.name)}">
    <label for="bp">Telefone / WhatsApp</label><input id="bp" inputmode="tel" autocomplete="tel" value="${esc(B.phone)}">
    <div class="cta"><button class="btn" data-act="saveContact">Revisar</button><button class="lk" data-act="goStep" data-n="2">Voltar</button></div>`;
}

function stepReview() {
  return `<div class="row"><b>${esc(B.svc.name)}</b><br>${brDate(B.date)} às ${B.time} (${B.svc.dur} min)<br>${esc(B.name)} · ${esc(B.phone)}<br><span class="price">${brl(B.svc.price)}</span></div>
    <div class="cta"><button class="btn" id="cf" data-act="confirmBooking">${B.adm ? 'Confirmar' : 'Pré-agendar'}</button><button class="lk" data-act="goStep" data-n="3">Voltar</button></div>`;
}

function stepDone() {
  const a = B.adm;
  const msg = a
    ? `Olá ${B.name}! Seu horário de ${B.svc.name} está confirmado para ${brDate(B.date)} às ${B.time}.`
    : `Olá! Fiz o pré-agendamento de ${B.svc.name} em ${brDate(B.date)} às ${B.time}. Nome: ${B.name}`;
  return `<div class="note"><b>${a ? 'Agendamento criado e confirmado!' : 'Pré-agendado!'}</b><br>${esc(B.svc.name)} em ${brDate(B.date)} às ${B.time}.${a ? '' : '<br>Seu horário está <b>pré-agendado</b> e reservado para você até a confirmação da profissional, que entrará em contato pelo WhatsApp.'}</div>
    <a class="btn" target="_blank" rel="noopener" href="${waLink(a ? '55' + dg(B.phone) : S.cfg.wa, msg)}">${a ? 'Avisar cliente' : 'Avisar'} no WhatsApp</a>`;
}

function drawBk() {
  let h = `<div class="bh"><div><h2>${B.adm ? 'Novo agendamento' : 'Agendar horário'}</h2><p class="st">${B.step < 5 ? `Passo ${B.step} de 4 · ${stepLabel(B.step)}` : 'Pronto!'}</p></div><button class="x" data-act="closeBk" aria-label="Fechar">✕</button></div>`;

  if (!db) {
    h += `<div class="note">O agendamento online está indisponível neste navegador. Agende pelo <a href="${waLink(S.cfg.wa)}">WhatsApp</a>.</div>`;
  } else {
    if (B.step > 1 && B.step < 5) h += `<p class="sv"><b>${esc(B.svc.name)}</b> · ${B.svc.dur} min · ${brl(B.svc.price)}</p>`;
    if (B.err) h += `<p class="note" role="alert">${esc(B.err)}</p>`;
    h += [null, stepServices, stepDate, stepContact, stepReview, stepDone][B.step]();
  }

  $('#bkb').innerHTML = h;
  const sel = $('.mchip.sel');   // deixa o mês escolhido visível na faixa
  if (sel) { const box = sel.parentElement; box.scrollLeft += sel.getBoundingClientRect().left - box.getBoundingClientRect().left - 8; }
}

/* ---------- gravar ---------- */
async function confirmBooking() {
  const btn = $('#cf');
  btn.disabled = true;
  const fail = msg => { B.err = msg; drawBk(); };

  try {
    if (!B.adm && !isMonthOpen(B.date)) { B.step = 2; B.time = ''; return fail('A agenda deste mês foi fechada. Escolha outro mês.'); }
    if (!freeTimes(B.date, B.svc, B.adm).includes(B.time)) { B.step = 2; B.time = ''; return fail('Este horário não está mais disponível. Escolha outro.'); }
    if (!B.adm && isPriority(B.date) && !fixedPhones().includes(dg(B.phone))) return fail('Este período é exclusivo para clientes fixas.');

    const ids = slotIds(B.date, B.time, B.svc.dur);
    for (const i of ids) {
      if ((await db.doc('slots/' + i).get()).exists) {
        B.step = 2; B.time = '';
        return fail('Este horário acabou de ser ocupado. Escolha outro.');
      }
    }
    for (const i of ids) await db.doc('slots/' + i).set({ date: B.date, st: B.adm ? 'ok' : 'pre' });
    await db.collection('bookings').add({
      svc: B.svc.name, svcId: B.svc.id, dur: +B.svc.dur, price: +B.svc.price,
      date: B.date, time: B.time, name: B.name, phone: dg(B.phone),
      status: B.adm ? 'confirmada' : 'pendente', manual: !!B.adm, ids, at: Date.now()
    });
    B.step = 5; B.err = '';
    drawBk();
  } catch (e) {
    fail('Não foi possível agendar: ' + (e.message || e.code));
  }
}
