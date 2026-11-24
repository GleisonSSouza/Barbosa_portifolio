/* ==========================================================================
   Painel da Laís: login, abas, cadastros (serviços, cursos, banners,
   feedbacks), horários e configurações.
   O calendário e os agendamentos ficam em js/calendar.js.
   ========================================================================== */

/* campos de cada cadastro: [chave, rótulo, tipo]
   tipos: t = texto longo, n = número, d = data, c = caixa de marcar,
          i = imagem, m = print ou vídeo, k = categoria (js/categories.js);
          sem tipo = texto curto */
const FIELDS = {
  services: [['cat', 'Categoria', 'k'], ['name', 'Nome'], ['desc', 'Descrição', 't'], ['price', 'Valor (R$)', 'n'], ['dur', 'Duração para a agenda (minutos)', 'n'], ['durTxt', 'Duração exibida (ex: 30 a 40 min)'], ['ord', 'Ordem de exibição', 'n'], ['img', 'Foto', 'i'], ['on', 'Ativo', 'c']],
  courses: [['name', 'Nome'], ['desc', 'Descrição', 't'], ['prog', 'Conteúdo programático (um por linha)', 't'], ['mode', 'Modalidade'], ['dur', 'Duração'], ['price', 'Valor (R$)', 'n'], ['pay', 'Formas de pagamento'], ['info', 'Informações de inscrição'], ['img', 'Imagem', 'i'], ['on', 'Ativo', 'c'], ['excl', 'Exclusivo para clientes', 'c']],
  feedbacks: [['handle', '@ do Instagram (ex: @maria)'], ['role', 'Legenda (ex: Aluna do curso)'], ['text', 'Depoimento (opcional)', 't'], ['av', 'Foto de perfil', 'i'], ['media', `Print ou vídeo do depoimento (vídeo até ${CONFIG.MAX_VIDEO_MB} MB)`, 'm'], ['on', 'Ativo', 'c']],
  banners: [['title', 'Título'], ['text', 'Texto', 't'], ['img', 'Imagem', 'i'], ['link', 'Link'], ['from', 'Início', 'd'], ['to', 'Término', 'd'], ['prio', 'Prioridade', 'n'], ['hi', 'Destaque', 'c'], ['on', 'Ativo', 'c']]
};

const TABS = [['dash', 'Painel'], ['cal', 'Calendário'], ['ag', 'Agendamentos'], ['services', 'Serviços'], ['courses', 'Cursos'], ['banners', 'Banners'], ['feedbacks', 'Feedbacks'], ['hor', 'Horários'], ['cfg', 'Configurações']];

const panelOpen = () => $('#adm').classList.contains('on');

/* ---------- entrar e sair ---------- */
function openAdm() {
  if (!owner) return showLogin();
  $('#adm').classList.add('on');
  document.body.style.overflow = 'hidden';
  drawAdm(true);
}

function closeAdm() {
  if (!leaveEdit()) return;
  $('#adm').classList.remove('on');
  document.body.style.overflow = '';
  if (location.hash === '#painel') history.replaceState(null, '', location.pathname + location.search);
}

function showLogin(err) {
  $('#lg').classList.add('on');
  $('#lgErr').textContent = err || '';
  setTimeout(() => $('#lgUser').focus(), 30);
}
const closeLogin = () => $('#lg').classList.remove('on');

async function doLogin(e) {
  e.preventDefault();
  const btn = $('#lgBtn');
  btn.disabled = true;
  try {
    const ok = await Auth.login($('#lgUser').value, $('#lgPass').value);
    if (!ok) { $('#lgErr').textContent = 'Usuário ou senha incorretos.'; $('#lgPass').select(); return; }
    $('#lgForm').reset();
    closeLogin();
    setOwner(true);
    openAdm();
  } catch (err) {
    $('#lgErr').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

function logout() {
  Auth.logout();
  setOwner(false);
  closeAdm();
}

/* ---------- desenho do painel ---------- */
function drawAdm(force) {
  if (!panelOpen()) return;

  $('#side').innerHTML = TABS.map(([k, label]) =>
    `<button class="${S.tab === k ? 'a' : ''}" data-act="tab" data-tab="${k}">${label}</button>`).join('') +
    `<span class="sp"></span><button data-act="closeAdm">← Ver site</button><button data-act="logout">Sair</button>`;

  // formulários não são redesenhados sozinhos, para não apagar o que está sendo digitado
  const isForm = FIELDS[S.tab] || S.tab === 'cfg' || S.tab === 'hor';
  if (isForm && !force && !S.force) return;
  S.force = false;

  const views = { dash: viewDash, cal: drawCal, ag: viewBookings, hor: viewHours, cfg: viewConfig };
  $('#am').innerHTML = (FIELDS[S.tab] ? viewList(S.tab) : views[S.tab]()) +
    (!db ? '<div class="note">Banco de dados indisponível neste navegador.</div>' : '');
  if (S.tab === 'ag') filterBookings();
}

function viewDash() {
  const t = today(), bk = S.bookings.filter(b => b.status !== 'bloqueado');
  const next = bk.filter(b => b.status !== 'cancelada' && b.date >= t)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 6);
  const stats = [
    ['Total', bk.length],
    ['Hoje', bk.filter(b => b.date === t && b.status !== 'cancelada').length],
    ['Pré-agendados', bk.filter(b => b.status === 'pendente').length],
    ['Confirmados', bk.filter(b => b.status === 'confirmada').length],
    ['Clientes', new Set(bk.map(b => b.phone)).size],
    ['Fixas', fixedPhones().length]
  ];
  return `<h2>Painel</h2>
    <div class="stats">${stats.map(([l, n]) => `<div class="stat"><b>${n}</b>${l}</div>`).join('')}</div>
    <h3 style="margin:24px 0 8px">Agenda dos próximos meses</h3>${monthsPanel()}
    <h3 style="margin:24px 0 8px">Próximos atendimentos</h3>${next.map(rowBooking).join('') || '<p>Nenhum.</p>'}`;
}

// lista de meses com o botão de abrir/fechar a agenda para as clientes
function monthsPanel() {
  return `<div class="mlist">${monthsAhead().map(k => {
    const open = isMonthOpen(k), n = monthBookings(k).length;
    return `<div class="mrow ${open ? 'open' : ''}">
      <b>${cap(monthName(k, true))}</b>
      <span class="mst">${open ? 'Aberta para clientes' : 'Fechada'}</span>
      <span class="mct">${n ? n + ' agendamento' + (n > 1 ? 's' : '') : 'Sem agendamentos'}</span>
      ${monthToggle(k)}
    </div>`;
  }).join('')}</div>`;
}

const monthToggle = k => isMonthOpen(k)
  ? `<button class="btn o s" data-act="setMonth" data-k="${esc(k)}" data-open="0">Fechar agenda</button>`
  : `<button class="btn s" data-act="setMonth" data-k="${esc(k)}" data-open="1">Abrir agenda</button>`;

async function setMonth(k, open) {
  const n = monthBookings(k).length;
  if (!open && n && !confirm(`Fechar a agenda de ${monthName(k)}? As clientes não poderão mais agendar neste mês. Os ${n} agendamento(s) já feitos continuam valendo.`)) return;
  S.force = true;
  await setMonthOpen(k, open);
}

function viewBookings() {
  return `<h2>Agendamentos</h2>
    <div class="search"><input id="fq" placeholder="Buscar nome ou telefone" data-input="filterBookings"><input id="fd" type="date" data-input="filterBookings"></div>
    <div id="bl"></div>`;
}

/* ---------- cadastros: um item por vez ----------
   A lista mostra um resumo de cada item. Só um formulário fica aberto:
   S.edit = id do item em edição, ou 'new' para um item novo (que só é
   gravado no banco ao clicar em Salvar). */
const ITEM = {
  services: { one: 'serviço', title: x => x.name, sub: x => [x.cat, brl(x.price), durText(x)] },
  courses: { one: 'curso', title: x => x.name, sub: x => [x.mode, x.dur, brl(x.price)] },
  banners: { one: 'banner', title: x => x.title, sub: x => [x.from && x.to ? `${brDate(x.from)} a ${brDate(x.to)}` : x.from ? 'desde ' + brDate(x.from) : x.to ? 'até ' + brDate(x.to) : 'sem data'] },
  feedbacks: { one: 'feedback', title: x => x.handle, sub: x => [x.role, x.media ? (x.mt === 'video' ? 'com vídeo' : 'com print') : ''] }
};
const nameKey = c => FIELDS[c][0][2] === 'k' ? FIELDS[c][1][0] : FIELDS[c][0][0];   // campo obrigatório

function blankItem(c) {
  const o = { on: true };
  FIELDS[c].forEach(([k, , t]) => { if (t !== 'c') o[k] = ''; });
  return o;
}

function viewList(c) {
  const it = ITEM[c], hasReal = S[c].some(x => !isExample(x.id));
  const flash = S.flash ? `<p class="flash" role="status">${esc(S.flash)}</p>` : '';
  S.flash = '';

  return `<h2>${TABS.find(x => x[0] === c)[1]}</h2>` + flash +
    (c === 'services' ? viewCats() : '') +
    `<div class="list-head">
      ${S.edit === 'new' ? '' : `<button class="btn s" data-act="newItem" data-c="${c}">+ Novo ${it.one}</button>`}
      ${db && !hasReal ? `<button class="btn o s" data-act="seed" data-c="${c}">Carregar exemplos editáveis</button>` : ''}
    </div>` +
    (S.edit === 'new' ? editor(c, blankItem(c), 'new') : '') +
    S[c].map(x => S.edit === x.id ? editor(c, x, x.id) : summary(c, x)).join('');
}

function summary(c, x) {
  const it = ITEM[c], sub = it.sub(x).filter(Boolean).map(esc).join(' · ');
  return `<div class="item">
    <div class="sum"><b>${esc(it.title(x)) || '<i>Sem nome</i>'}</b>${sub ? `<small>${sub}</small>` : ''}</div>
    ${x.on ? '' : '<span class="pill">inativo</span>'}
    <button class="btn o s" data-act="editItem" data-c="${c}" data-id="${esc(x.id)}">Editar</button>
    <button class="btn o s" data-act="delItem" data-c="${c}" data-id="${esc(x.id)}">Excluir</button>
  </div>`;
}

function editor(c, x, id) {
  const isNew = id === 'new';
  return `<div class="row editing" data-id="${esc(id)}">
    <h3>${isNew ? 'Novo ' + ITEM[c].one : 'Editar ' + ITEM[c].one}</h3>
    <div class="two">${FIELDS[c].map(f => field(f, x)).join('')}</div>
    <p class="form-err" role="alert"></p>
    <button class="btn s" data-act="saveItem" data-c="${c}" data-id="${esc(id)}">${isNew ? 'Criar ' + ITEM[c].one : 'Salvar alterações'}</button>
    <button class="btn o s" data-act="cancelEdit">Cancelar</button>
  </div>`;
}

// antes de trocar de item/aba: se há alterações não salvas, pergunta
function leaveEdit() {
  if (S.edit && S.dirty && !confirm('Há alterações não salvas. Descartar?')) return false;
  S.edit = null; S.dirty = false;
  return true;
}

function openEditor(id) {
  if (!leaveEdit()) return;
  S.edit = id;
  drawAdm(true);
  const box = $('#am .row.editing');
  if (box) { box.scrollIntoView({ block: 'nearest' }); box.querySelector('input:not([type=hidden]), select')?.focus(); }
}

const newItem = () => openEditor('new');
const editItem = id => openEditor(id);
function cancelEdit() { if (leaveEdit()) drawAdm(true); }

function field([k, label, type], x) {
  const v = x[k];
  if (type === 'k') return catField(v);
  if (type === 'c') return `<label><input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}>${label}</label>`;
  if (type === 't') return `<div class="full"><label>${label}</label><textarea data-k="${k}">${esc(v)}</textarea></div>`;
  if (type === 'm') return `<div><label>${label}</label><input type="hidden" data-k="${k}" value="${esc(v)}"><input type="hidden" data-k="mt" value="${esc(x.mt || '')}"><input type="file" accept="image/*,video/*" data-change="uploadMedia"><small>${v ? '✓ ' + (x.mt === 'video' ? 'vídeo' : 'print') + ' definido' : ''}</small></div>`;
  if (type === 'i') return `<div><label>${label}</label><input type="hidden" data-k="${k}" value="${esc(v)}"><input type="file" accept="image/*" data-change="uploadImage">${v ? '<small>✓ imagem definida</small>' : ''}</div>`;
  const attr = type === 'n' ? 'type="number" step="any"' : type === 'd' ? 'type="date"' : '';
  return `<div><label>${label}</label><input data-k="${k}" ${attr} value="${esc(v)}"></div>`;
}

function viewHours() {
  const c = S.cfg, D = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `<h2>Horários</h2><div class="row">
    <div class="two">
      <div><label>Abre</label><input type="time" id="c_open" value="${esc(c.open)}"></div>
      <div><label>Fecha</label><input type="time" id="c_close" value="${esc(c.close)}"></div>
      <div><label>Intervalo início</label><input type="time" id="c_bs" value="${esc(c.bs)}"></div>
      <div><label>Intervalo fim</label><input type="time" id="c_be" value="${esc(c.be)}"></div>
    </div>
    <label>Meses abertos para agendamento (os demais ficam fechados)</label><p>${monthOptions()}</p>
    <label>Dias de funcionamento</label>
    <p>${D.map((d, i) => `<label><input type="checkbox" class="dy" value="${i}" ${c.days.includes(i) ? 'checked' : ''}>${d} </label>`).join('')}</p>
    <label>Folgas / feriados / bloqueios (datas AAAA-MM-DD separadas por vírgula)</label><textarea id="c_blocked">${esc(c.blocked)}</textarea>
    <h3>Prioridade para clientes fixas</h3>
    <div class="two">
      <div><label>Exclusivo de</label><input type="date" id="c_pf" value="${esc(c.pf)}"></div>
      <div><label>até</label><input type="date" id="c_pt" value="${esc(c.pt)}"></div>
    </div>
    <label>Telefones das clientes fixas autorizadas (um por linha)</label><textarea id="c_phones" rows="4">${esc(c.phones)}</textarea>
    <button class="btn s" data-act="saveCfg">Salvar</button>
  </div>`;
}

function viewConfig() {
  const c = S.cfg;
  const fields = [['name', 'Nome profissional'], ['tag', 'Frase de impacto'], ['bio', 'Biografia'], ['wa', 'WhatsApp (com DDI)'], ['ig', 'Instagram'], ['addr', 'Endereço']];
  return `<h2>Configurações</h2><div class="row">
    ${fields.map(([k, l]) => `<label for="c_${k}">${l}</label><input id="c_${k}" value="${esc(c[k])}">`).join('')}
    <label>Foto principal</label><input type="hidden" id="c_img" value="${esc(c.img)}"><input type="file" accept="image/*" data-change="uploadImage" data-target="c_img"><br>
    <button class="btn s" data-act="saveCfg">Salvar</button>
  </div>
  <div class="row">
    <b>Dados de demonstração</b>
    <p class="meta">Tudo o que foi editado e agendado fica salvo só neste navegador. Apagar volta o site ao conteúdo original.</p>
    <button class="btn o s" data-act="clearDemo">Apagar dados deste navegador</button>
  </div>`;
}

function monthOptions() {
  const out = [], d = new Date();
  d.setDate(1); d.setHours(12);
  for (let i = 0; i < 12; i++) {
    const k = iso(d).slice(0, 7), on = (S.cfg.openMonths || []).includes(k);
    out.push(`<label class="mo"><input type="checkbox" ${on ? 'checked' : ''} data-change="toggleMonth" data-k="${k}">${d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</label>`);
    d.setMonth(d.getMonth() + 1);
  }
  return out.join('');
}

/* ---------- envio de fotos e vídeos ---------- */
async function uploadImage(el) {
  if (!el.files[0]) return;
  try {
    const r = await assets.upload(el.files[0]);
    (el.dataset.target ? $('#' + el.dataset.target) : el.previousElementSibling).value = r.url;
    el.insertAdjacentHTML('afterend', '<small>✓ enviada — clique em Salvar</small>');
  } catch (e) { alert('Falha no envio: ' + (e.message || e.code)); }
}

async function uploadMedia(el) {
  const f = el.files[0];
  if (!f) return;
  const box = el.parentElement, msg = box.querySelector('small');
  msg.textContent = 'enviando…';
  try {
    const r = await assets.upload(f);
    box.querySelector('[data-k=media]').value = r.url;
    box.querySelector('[data-k=mt]').value = f.type.startsWith('video') ? 'video' : 'image';
    msg.textContent = '✓ enviado — clique em Salvar';
  } catch (e) {
    msg.textContent = '';
    alert('Falha no envio: ' + (e.message || e.code));
  }
}

/* ---------- salvar cadastros ----------
   Cada ação grava tudo e só no fim redesenha o painel (drawAdm(true)).
   Os formulários não se redesenham sozinhos a cada gravação para não
   apagar o que a Laís está digitando. */
function collect(root) {
  const o = {};
  root.querySelectorAll('[data-k]').forEach(i => {
    o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.type === 'number' ? +i.value : i.value;
  });
  return o;
}

// enquanto a lista só tiver exemplos, grava todos como itens reais
// (senão os exemplos somem do site assim que o primeiro item real é gravado)
async function ensureReal(c, replaceId, replaceWith) {
  for (const x of S[c].filter(x => isExample(x.id))) {   // mantém a ordem da lista
    const { id, ...rest } = x;
    await db.collection(c).add(id === replaceId ? replaceWith : rest);
  }
}

async function saveItem(c, id, btn) {
  const row = btn.closest('.row');
  const err = row.querySelector('.form-err');
  const o = collect(row);
  const key = nameKey(c);
  if (!String(o[key] || '').trim()) {
    err.textContent = `Preencha o campo “${FIELDS[c].find(f => f[0] === key)[1]}”.`;
    row.querySelector(`[data-k=${key}]`).focus();
    return;
  }
  if (c === 'services') {
    const cat = await resolveCat(row);
    if (cat === null) return;   // falta decidir a categoria nova (aviso na tela)
    o.cat = cat;
  }
  btn.disabled = true;
  try {
    if (id === 'new') { await ensureReal(c); await db.collection(c).add(o); }
    else if (isExample(id)) await ensureReal(c, id, o);
    else await db.doc(c + '/' + id).set(o);
  } catch (e) { btn.disabled = false; err.textContent = 'Não foi possível salvar: ' + (e.message || e.code); return; }
  S.edit = null; S.dirty = false;
  S.flash = `${cap(ITEM[c].one)} “${o[key]}” ${id === 'new' ? 'criado' : 'salvo'}.`;
  drawAdm(true);
}

async function delItem(c, id) {
  const x = S[c].find(y => y.id === id);
  if (!confirm(`Excluir “${ITEM[c].title(x) || 'item sem nome'}”?`)) return;
  if (S.edit === id) { S.edit = null; S.dirty = false; }
  if (isExample(id)) { S[c] = S[c].filter(x => x.id !== id); drawPublic(); }
  else await db.doc(c + '/' + id).delete();
  drawAdm(true);
}

async function seed(c) {
  for (const x of DEF[c]) { const { id, ...o } = x; await db.collection(c).add(o); }
  drawAdm(true);
}

async function saveCfg(btn) {
  const c = { ...S.cfg };
  $$('[id^=c_]').forEach(i => { c[i.id.slice(2)] = i.value; });
  if ($('.dy')) c.days = $$('.dy:checked').map(i => +i.value);
  S.force = true;
  try {
    await db.doc('config/main').set(cfgToSave(c));
    btn.textContent = 'Salvo ✓';
  } catch (e) { alert(e.message || e.code); }
}

const toggleMonth = el => setMonthOpen(el.dataset.k, el.checked);

async function clearDemo() {
  if (!confirm('Apagar todos os dados salvos neste navegador? O site volta ao conteúdo original.')) return;
  await db.clear();
  resetState();
  S.force = true;
  drawPublic();
  drawAdm(true);
}
