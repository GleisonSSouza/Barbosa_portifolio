/* ==========================================================================
   Regras da agenda: meses abertos, dias de atendimento e horários.

   Cada mês tem uma chave "AAAA-MM". Os meses abertos para as clientes ficam
   em S.cfg.openMonths. Mês fechado: a cliente vê que está fechado e não
   consegue escolher dia; a Laís, pelo painel, agenda normalmente.
   ========================================================================== */
const MONTHS_AHEAD = 6;   // quantos meses a cliente vê na escolha de data

const monthOf = k => String(k).slice(0, 7);
const isMonthOpen = k => (S.cfg.openMonths || []).includes(monthOf(k));
// nome do mês em minúsculas ("dezembro"); com year = "dezembro de 2026"
const monthName = (k, year) => noon(monthOf(k) + '-01').toLocaleDateString('pt-BR', year ? { month: 'long', year: 'numeric' } : { month: 'long' });
const daysInMonth = k => { const d = noon(monthOf(k) + '-01'); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };

// mês atual e os próximos (mais qualquer mês aberto que esteja além disso)
function monthsAhead(n = MONTHS_AHEAD) {
  const out = [], d = new Date();
  d.setDate(1); d.setHours(12, 0, 0, 0);
  for (let i = 0; i < n; i++) { out.push(monthOf(iso(d))); d.setMonth(d.getMonth() + 1); }
  (S.cfg.openMonths || []).forEach(k => { if (k > out[out.length - 1]) out.push(k); });
  return out;
}

const openMonthsAhead = () => (S.cfg.openMonths || []).filter(k => k >= monthOf(today())).sort();

const isWorkDay = k => S.cfg.days.includes(noon(k).getDay()) && !blockedDays().includes(k);
const isPriority = d => S.cfg.pf && S.cfg.pt && d >= S.cfg.pf && d <= S.cfg.pt;

/* Horários de um dia para um serviço com a duração dur.
   Cada horário vem com a situação:
     free = livre
     pre  = pré-agendado por outra cliente (aguarda a Laís confirmar)
     busy = ocupado (confirmado ou bloqueado pela Laís)
   adm = 1 ignora se o mês está fechado. */
function slotsView(date, svc, adm) {
  const c = S.cfg, out = [];
  if (date < today() || !isWorkDay(date) || (!adm && !isMonthOpen(date))) return out;

  const dur = +svc.dur, now = new Date();
  for (let m = tm(c.open); m + dur <= tm(c.close); m += 30) {
    if (c.bs && c.be && m < tm(c.be) && m + dur > tm(c.bs)) continue;              // cai no intervalo
    if (date === today() && m <= now.getHours() * 60 + now.getMinutes()) continue;  // já passou

    let ok = 0, pre = 0;
    for (let x = m; x < m + dur; x += 30) {
      const id = date + '_' + fm(x);
      if (S.slots.has(id)) S.slotSt[id] === 'pre' ? pre++ : ok++;
    }
    out.push({ t: fm(m), st: ok ? 'busy' : pre ? 'pre' : 'free' });
  }
  return out;
}

const freeTimes = (date, svc, adm) => slotsView(date, svc, adm).filter(o => o.st === 'free').map(o => o.t);

// situação do dia no calendário: past, off (sem atendimento), free (tem horário livre), full (lotado)
function dayState(k, svc, adm) {
  if (k < today()) return 'past';
  if (!isWorkDay(k)) return 'off';
  return freeTimes(k, svc, adm).length ? 'free' : 'full';
}

/* ---------- abrir e fechar mês (painel) ---------- */

// a foto padrão não é gravada no banco: se a Laís não trocar, continua a do arquivo
const cfgToSave = c => { const o = { ...c }; if (o.img === HERO) delete o.img; return o; };

async function setMonthOpen(k, open) {
  const set = new Set(S.cfg.openMonths || []);
  open ? set.add(monthOf(k)) : set.delete(monthOf(k));
  S.cfg.openMonths = [...set].sort();
  try { await db.doc('config/main').set(cfgToSave(S.cfg)); }
  catch (e) { alert(e.message || e.code); }
}

// agendamentos ativos de um mês (para mostrar no painel)
const monthBookings = k => S.bookings.filter(b => monthOf(b.date) === k && b.status !== 'cancelada' && b.status !== 'bloqueado');
