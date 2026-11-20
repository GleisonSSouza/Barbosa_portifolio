/* ==========================================================================
   Agendamento: janela em 4 passos (procedimento, dia e horário, dados, revisão).
   Qualquer elemento com data-book abre a janela; data-book="d1" já escolhe o serviço.
   No fim, a cliente envia o pedido pelo WhatsApp.
   ========================================================================== */
window.Booking = (function () {
  const D = window.SITE_DATA;
  const { esc, brl, digits, wa } = window.U;

  const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const STEPS = ['Procedimento', 'Data e horário', 'Seus dados', 'Revisão'];
  const PHONE_EXAMPLE = '(71) 9 9999-9999';

  // horários
  const toMin = t => { const [h, m] = t.split(':'); return +h * 60 + +m; };
  const toHHMM = m => String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const brDate = s => s.split('-').reverse().join('/');

  // próximos dias de atendimento (pula hoje se o expediente já acabou)
  function openDays(n = 12) {
    const out = [], now = new Date();
    for (let i = 0; out.length < n && i < 60; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (i === 0 && now.getHours() * 60 + now.getMinutes() >= toMin(D.cfg.close) - 60) continue;
      if (D.cfg.days.includes(d.getDay())) out.push(d);
    }
    return out;
  }

  // horários livres de 30 em 30 min, respeitando a pausa do almoço
  function freeSlots(date, svc) {
    const c = D.cfg, dur = +svc.dur, out = [], now = new Date(), today = iso(now);
    for (let m = toMin(c.open); m + dur <= toMin(c.close); m += 30) {
      if (m < toMin(c.be) && m + dur > toMin(c.bs)) continue;
      if (date === today && m <= now.getHours() * 60 + now.getMinutes()) continue;
      out.push(toHHMM(m));
    }
    return out;
  }

  let dlg, B;

  function ensure() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.className = 'bk';
    dlg.setAttribute('aria-labelledby', 'bk-title');
    document.body.append(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // clique fora fecha
  }

  function open(id) {
    ensure();
    B = { svc: D.services.find(s => s.id === id) || null, date: '', time: '', name: '', phone: '', err: '' };
    B.step = B.svc ? 2 : 1;
    draw();
    dlg.showModal();
  }

  function go(step) { B.step = step; B.err = ''; draw(); }

  function draw() {
    let h = `<div class="bk-in"><div class="bk-head"><h2 class="bk-title" id="bk-title">${B.step === 5 ? 'Quase lá' : 'Agendar horário'}</h2><button class="bk-close" data-a="close" aria-label="Fechar">✕</button></div>`;
    if (B.step < 5) h += `<p class="bk-step">Passo ${B.step} de 4 · ${STEPS[B.step - 1]}</p>`;

    if (B.step === 1) {
      h += `<p class="bk-q">Qual procedimento você quer fazer?</p><div class="bk-opts">` +
        D.services.map(s => `<button class="bk-opt" data-svc="${s.id}"><b>${esc(s.name)}</b><small>${brl(s.price)} · ${s.dur} min</small></button>`).join('') +
        `</div>`;
    } else if (B.step === 2) {
      h += `<p class="bk-q"><b>${esc(B.svc.name)}</b> · ${B.svc.dur} min · ${brl(B.svc.price)}</p>`;
      h += `<div class="bk-days" role="group" aria-label="Dia">` + openDays().map(d => {
        const v = iso(d);
        return `<button class="bk-day" data-day="${v}" aria-pressed="${v === B.date}"><span>${WD[d.getDay()]}</span><b>${d.getDate()}</b><span>${MO[d.getMonth()]}</span></button>`;
      }).join('') + `</div>`;
      if (B.date) {
        const free = freeSlots(B.date, B.svc);
        h += free.length
          ? `<div class="bk-slots" role="group" aria-label="Horário">${free.map(t => `<button class="bk-slot" data-time="${t}" aria-pressed="${t === B.time}">${t}</button>`).join('')}</div>`
          : `<div class="bk-empty">Não há horários livres nesse dia. Escolha outra data.</div>`;
      } else {
        h += `<p class="bk-empty">Escolha um dia para ver os horários livres.</p>`;
      }
      h += `<div class="bk-actions"><button class="bk-btn" data-a="next" ${B.time ? '' : 'disabled'}>Continuar</button><button class="bk-link" data-a="back">Trocar procedimento</button></div>`;
    } else if (B.step === 3) {
      h += `<label class="bk-field"><span>Nome</span><input id="bk-n" autocomplete="name" value="${esc(B.name)}"></label>
            <label class="bk-field"><span>WhatsApp com DDD</span><input id="bk-p" inputmode="tel" autocomplete="tel" placeholder="${PHONE_EXAMPLE}" value="${esc(B.phone)}"></label>
            ${B.err ? `<p class="bk-err" role="alert">${B.err}</p>` : ''}
            <div class="bk-actions"><button class="bk-btn" data-a="review">Revisar pedido</button><button class="bk-link" data-a="back">Voltar</button></div>`;
    } else if (B.step === 4) {
      h += `<dl class="bk-sum"><dt>Procedimento</dt><dd>${esc(B.svc.name)}</dd><dt>Dia</dt><dd>${brDate(B.date)} às ${B.time}</dd><dt>Duração</dt><dd>${B.svc.dur} min</dd><dt>Nome</dt><dd>${esc(B.name)}</dd><dt>Valor</dt><dd>${brl(B.svc.price)}</dd></dl>
            <div class="bk-actions"><button class="bk-btn" data-a="confirm">Confirmar agendamento</button><button class="bk-link" data-a="back">Voltar</button></div>`;
    } else {
      const msg = `Olá, Laís! Quero agendar ${B.svc.name} no dia ${brDate(B.date)} às ${B.time}. Meu nome é ${B.name}.`;
      h += `<p class="bk-q bk-done">Seu pedido de <b>${esc(B.svc.name)}</b> para ${brDate(B.date)} às ${B.time} foi registrado e aguarda a confirmação da Laís.</p>
            <div class="bk-actions"><a class="bk-btn" href="${wa(msg)}" target="_blank" rel="noopener">Avisar no WhatsApp</a><button class="bk-link" data-a="close">Fechar</button></div>
            <p class="bk-note">Você recebe a confirmação pelo WhatsApp.</p>`;
    }

    dlg.innerHTML = h + '</div>';
    const focus = dlg.querySelector('[aria-pressed=true]') || dlg.querySelector('input');
    if (focus && B.step !== 2) focus.focus();
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-book]');
    if (trigger) { e.preventDefault(); open(trigger.dataset.book); return; }
    if (!dlg || !dlg.contains(e.target)) return;

    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.svc) { B.svc = D.services.find(s => s.id === b.dataset.svc); B.date = B.time = ''; go(2); }
    else if (b.dataset.day) { B.date = b.dataset.day; B.time = ''; draw(); dlg.querySelector(`[data-day="${B.date}"]`).focus(); }
    else if (b.dataset.time) { B.time = b.dataset.time; draw(); dlg.querySelector(`[data-time="${B.time}"]`).focus(); }
    else switch (b.dataset.a) {
      case 'close': dlg.close(); break;
      case 'back': go(B.step - 1); break;
      case 'next': go(3); break;
      case 'review':
        B.name = dlg.querySelector('#bk-n').value.trim();
        B.phone = dlg.querySelector('#bk-p').value.trim();
        if (!B.name) { B.err = 'Escreva seu nome.'; draw(); }
        else if (digits(B.phone).length < 10) { B.err = `Escreva o WhatsApp com DDD, por exemplo ${PHONE_EXAMPLE}.`; draw(); }
        else go(4);
        break;
      case 'confirm': go(5); break;
    }
  });

  return { open };
})();
