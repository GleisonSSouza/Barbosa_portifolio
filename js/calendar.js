/* ==========================================================================
   Painel: calendário (mês, semana, dia) e lista de agendamentos.
   ========================================================================== */

function drawCal() {
  const v = S.cv, a = noon(S.cd), c = S.cfg;
  const active = S.bookings.filter(b => b.status !== 'cancelada');
  const ofDay = k => active.filter(b => b.date === k).sort((x, y) => x.time.localeCompare(y.time));
  const closed = d => !c.days.includes(d.getDay()) || blockedDays().includes(iso(d));
  const chip = b => `<div class="chip ${esc(b.status)}">${b.status === 'bloqueado' ? '🔒 ' + esc(b.name) : esc(b.time) + ' ' + esc(String(b.name || '').split(' ')[0])}</div>`;
  const dayCell = (d, extra, label, content) => {
    const k = iso(d);
    return `<div class="cd ${extra} ${k === today() ? 'td' : ''} ${closed(d) ? 'cl' : ''}" data-act="goDay" data-k="${k}"><span>${label}</span>${content}</div>`;
  };

  let title, body = '';

  if (v === 'month') {
    title = a.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const first = new Date(a.getFullYear(), a.getMonth(), 1, 12);
    first.setDate(1 - first.getDay());
    body = '<div class="mg">' + WD.map(x => `<div class="hd">${x}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(first); d.setDate(first.getDate() + i);
      const list = ofDay(iso(d));
      const chips = list.slice(0, 3).map(chip).join('') + (list.length > 3 ? `<div class="chip">+${list.length - 3}</div>` : '');
      body += dayCell(d, d.getMonth() !== a.getMonth() ? 'o' : '', d.getDate(), chips);
    }
    body += '</div>';
  }

  else if (v === 'week') {
    const start = new Date(a); start.setDate(a.getDate() - a.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const o = { day: 'numeric', month: 'short' };
    title = start.toLocaleDateString('pt-BR', o) + ' – ' + end.toLocaleDateString('pt-BR', o);
    body = '<div class="wk">';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      body += dayCell(d, '', WD[d.getDay()] + ' ' + d.getDate(), ofDay(iso(d)).map(chip).join(''));
    }
    body += '</div>';
  }

  else {
    title = a.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const day = ofDay(S.cd);
    const inHours = b => tm(b.time) >= tm(c.open) && tm(b.time) < tm(c.close);

    if (closed(a)) {
      body = `<div class="note">Sem expediente neste dia.</div>` + day.map(rowBooking).join('');
    } else {
      for (let m = tm(c.open); m < tm(c.close); m += 30) {
        const t = fm(m), b = day.find(x => tm(x.time) <= m && m < tm(x.time) + x.dur);
        let cell;
        if (b) cell = b.time === t ? `<div>${rowBooking(b)}</div>` : `<div class="busy">em atendimento</div>`;
        else if (c.bs && m >= tm(c.bs) && m < tm(c.be)) cell = `<div class="busy">Intervalo</div>`;
        else cell = `<button class="free" data-act="bookAdm" data-k="${esc(S.cd)}" data-t="${t}">+ Livre</button>`;
        body += `<div class="dr"><span class="tt">${t}</span>${cell}</div>`;
      }
      const outside = day.filter(b => !inHours(b));
      if (outside.length) body += `<h3 style="margin-top:18px">Fora do expediente</h3>` + outside.map(rowBooking).join('');
    }
  }

  const views = [['month', 'Mês'], ['week', 'Semana'], ['day', 'Dia']];
  return `<h2>Calendário</h2>
    <div class="ct">
      <div class="seg">${views.map(([k, l]) => `<button class="btn s ${v === k ? '' : 'o'}" data-act="calView" data-v="${k}">${l}</button>`).join('')}</div>
      <button class="btn o s" data-act="calNav" data-n="-1" aria-label="Anterior">‹</button>
      <button class="btn o s" data-act="calToday">Hoje</button>
      <button class="btn o s" data-act="calNav" data-n="1" aria-label="Próximo">›</button>
      <b class="title">${cap(title)}</b><span class="grow"></span>
      <button class="btn s" data-act="bookAdm" data-k="${esc(S.cd)}">+ Novo agendamento</button>
      <button class="btn o s" data-act="blockTime">Bloquear horário</button>
    </div>
    <div class="mbar ${isMonthOpen(S.cd) ? 'open' : ''}">
      <span>Agenda de <b>${monthName(S.cd, true)}</b>: ${isMonthOpen(S.cd)
        ? 'aberta, as clientes podem pré-agendar pelo site.'
        : 'fechada para as clientes. Só você pode agendar neste mês.'}</span>
      ${monthToggle(monthOf(S.cd))}
    </div>${body}`;
}

function calNav(n) {
  const d = noon(S.cd);
  if (S.cv === 'month') { d.setDate(1); d.setMonth(d.getMonth() + n); }
  else d.setDate(d.getDate() + n * (S.cv === 'week' ? 7 : 1));
  S.cd = iso(d);
  drawAdm(true);
}

function goDay(k) { S.cd = k; S.cv = 'day'; drawAdm(true); }

/* ---------- um agendamento na lista ---------- */
function rowBooking(b) {
  if (b.status === 'bloqueado') {
    return `<div class="row">🔒 <b>Bloqueado</b> ${esc(b.time)} · ${esc(b.dur)} min — ${esc(b.name)} <button class="btn o s" data-act="unblock" data-id="${esc(b.id)}">Remover</button></div>`;
  }
  const label = b.status === 'pendente' ? 'pré-agendado' : esc(b.status);
  const actions = b.status === 'cancelada' ? '' : `<br><br>
    ${b.status === 'pendente' ? `<button class="btn s" data-act="confirmB" data-id="${esc(b.id)}">Confirmar</button> ` : ''}
    <button class="btn o s" data-act="cancelB" data-id="${esc(b.id)}">Cancelar</button>
    <button class="btn o s" data-act="rescheduleB" data-id="${esc(b.id)}">Remarcar</button>`;
  return `<div class="row"><b>${esc(brDate(String(b.date || '')))} ${esc(b.time)}</b> · ${esc(b.svc)} <span class="pill ${esc(b.status)}">${label}</span><br>
    ${esc(b.name)} · <a href="https://wa.me/55${dg(b.phone)}" target="_blank" rel="noopener">${esc(b.phone)}</a>${actions}</div>`;
}

function filterBookings() {
  const q = ($('#fq').value || '').toLowerCase(), d = $('#fd').value;
  $('#bl').innerHTML = S.bookings
    .filter(b => b.status !== 'bloqueado' && (!d || b.date === d) && (!q || (b.name + b.phone).toLowerCase().includes(q)))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .map(rowBooking).join('') || '<p>Nenhum agendamento.</p>';
}

/* ---------- ações sobre agendamentos ---------- */
const findB = id => S.bookings.find(x => x.id === id);
const setStatus = (id, s) => db.doc('bookings/' + id).update({ status: s });
const freeSlots = async b => { for (const i of b.ids || []) await db.doc('slots/' + i).delete(); };

async function confirmB(id) {
  const b = findB(id);
  for (const i of b.ids || []) await db.doc('slots/' + i).update({ st: 'ok' }).catch(() => {});
  setStatus(id, 'confirmada');
}

async function cancelB(id) {
  if (!confirm('Cancelar este agendamento?')) return;
  await freeSlots(findB(id));
  setStatus(id, 'cancelada');
}

async function rescheduleB(id) {
  const b = findB(id);
  const d = prompt('Nova data (AAAA-MM-DD):', b.date);
  const t = d && prompt('Novo horário (HH:MM):', b.time);
  if (!t) return;
  const ids = slotIds(d, t, b.dur);
  if (ids.some(i => !(b.ids || []).includes(i) && S.slots.has(i))) { alert('Horário indisponível.'); return; }
  await freeSlots(b);
  for (const i of ids) await db.doc('slots/' + i).set({ date: d, st: b.status === 'pendente' ? 'pre' : 'ok' });
  db.doc('bookings/' + id).update({ date: d, time: t, ids });
}

async function blockTime() {
  const k = prompt('Data (AAAA-MM-DD):', S.cd); if (!k) return;
  const t = prompt('Horário inicial (HH:MM):', '09:00'); if (!t) return;
  const d = +prompt('Duração em minutos:', '60'); if (!d) return;
  const why = prompt('Motivo (opcional):', 'Compromisso') || 'Bloqueio';
  const ids = slotIds(k, t, d);
  if (ids.some(i => S.slots.has(i))) { alert('Já existe agendamento ou bloqueio nesse intervalo.'); return; }
  for (const i of ids) await db.doc('slots/' + i).set({ date: k, st: 'ok' });
  await db.collection('bookings').add({ svc: 'Bloqueio', name: why, status: 'bloqueado', date: k, time: t, dur: d, phone: '', ids, at: Date.now() });
}

async function unblock(id) {
  await freeSlots(findB(id));
  await db.doc('bookings/' + id).delete();
}
