/* ==========================================================================
   Categorias dos serviços.

   A lista fica em S.cfg.cats (a ordem dela é a ordem no site). No cadastro
   de serviço a categoria é escolhida numa lista, então não dá para errar a
   digitação. Ao criar uma nova, o nome é comparado com as existentes:
     - igual sem contar acento/maiúscula ("depilacao" = "Depilação"): usa a existente
     - parecido ("Depilaçao", "Depilaçoes"): pergunta antes de criar
   ========================================================================== */

// "  Depilação " -> "depilacao"
const normCat = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// distância de edição (quantas letras trocar, tirar ou pôr)
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

// tira a terminação de plural/singular: depilacao, depilacoes -> depilac
const stem = s => s.replace(/(oes|aes|ao|ais|al|eis|el|s)$/, '');

// parecidas o bastante para ser erro de digitação ou plural
function looksLike(a, b) {
  a = normCat(a); b = normCat(b);
  if (!a || !b || a === b) return a === b;
  if (stem(a) === stem(b)) return true;
  const short = Math.min(a.length, b.length);
  // palavra cortada no fim ("Sobrancelh" x "Sobrancelhas"), mas não "Depilação" x "Depilação a cera"
  if (short >= 4 && Math.abs(a.length - b.length) <= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  return editDistance(a, b) <= (short >= 6 ? 2 : 1);
}

// categorias em uso: as cadastradas + as que algum serviço já tenha
function catList() {
  const out = [];
  const add = c => { c = String(c || '').trim(); if (c && !out.some(x => normCat(x) === normCat(c))) out.push(c); };
  (S.cfg.cats || []).forEach(add);
  S.services.forEach(s => add(s.cat));
  return out;
}

const findCat = name => catList().find(x => normCat(x) === normCat(name));
const similarCat = (name, except) => catList().find(x => x !== except && normCat(x) !== normCat(name) && looksLike(x, name));
const catCount = name => S.services.filter(s => normCat(s.cat) === normCat(name)).length;

// agrupa serviços pela categoria, na ordem da lista; sem categoria vai por último
function byCat(list) {
  const order = catList().map(normCat);
  const groups = [];
  list.forEach(s => {
    const key = normCat(s.cat);
    let g = groups.find(x => normCat(x[0]) === key);
    if (!g) groups.push(g = [key ? (findCat(s.cat) || s.cat) : '', []]);
    g[1].push(s);
  });
  const pos = g => g[0] ? order.indexOf(normCat(g[0])) : Infinity;
  return groups.sort((a, b) => pos(a) - pos(b));
}

/* ---------- gravar ---------- */
const saveCats = cats => { S.cfg.cats = cats; return db.doc('config/main').set(cfgToSave(S.cfg)); };

async function moveServices(from, to) {
  await ensureReal('services');   // exemplos viram itens reais antes de mudar
  for (const s of S.services.filter(s => normCat(s.cat) === normCat(from))) {
    await db.doc('services/' + s.id).update({ cat: to });
  }
}

/* ---------- painel: bloco "Categorias" no topo da aba Serviços ---------- */
function viewCats() {
  const cats = catList();
  const dupes = [];
  cats.forEach((a, i) => cats.slice(i + 1).forEach(b => { if (looksLike(a, b)) dupes.push([a, b]); }));

  return `<div class="row cats">
    <b>Categorias</b>
    <p class="meta">A ordem abaixo é a ordem em que aparecem no site.</p>
    ${dupes.map(([a, b]) => {
      // fica a que tem mais serviços; empate: a mais antiga (vem antes na lista)
      const [from, to] = catCount(b) > catCount(a) ? [a, b] : [b, a];
      return `<div class="note">“${esc(a)}” e “${esc(b)}” parecem a mesma categoria.
        <button class="btn s" data-act="catMerge" data-from="${esc(from)}" data-to="${esc(to)}">Juntar em “${esc(to)}”</button></div>`;
    }).join('')}
    ${cats.length ? `<div class="catlist">${cats.map((c, i) => {
      const n = catCount(c);
      return `<div class="catrow">
        <span class="nm">${esc(c)}</span>
        <small>${n ? n + ' serviço' + (n > 1 ? 's' : '') : 'nenhum serviço'}</small>
        <span class="tools">
          <button class="btn o s" data-act="catMove" data-cat="${esc(c)}" data-n="-1" ${i ? '' : 'disabled'} aria-label="Subir ${esc(c)}">↑</button>
          <button class="btn o s" data-act="catMove" data-cat="${esc(c)}" data-n="1" ${i < cats.length - 1 ? '' : 'disabled'} aria-label="Descer ${esc(c)}">↓</button>
          <button class="btn o s" data-act="catRename" data-cat="${esc(c)}">Renomear</button>
          <button class="btn o s" data-act="catDelete" data-cat="${esc(c)}">Excluir</button>
        </span>
      </div>`;
    }).join('')}</div>` : '<p class="meta">Nenhuma categoria ainda. Sem categoria, os serviços aparecem juntos no site.</p>'}
    <div class="catadd newcat">
      <input class="newcat-in" placeholder="Nova categoria (ex: Depilação)" data-input="catTyping" aria-label="Nome da nova categoria">
      <button class="btn s" data-act="catAdd">Adicionar</button>
    </div>
    <p class="cathint" role="status"></p>
  </div>`;
}

/* ---------- campo "Categoria" no cadastro do serviço ---------- */
function catField(v) {
  const cur = findCat(v) || '';
  return `<div class="catfield"><label>Categoria</label>
    <select data-k="cat" data-change="catSelect">
      <option value="">Sem categoria</option>
      ${catList().map(c => `<option value="${esc(c)}" ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      <option value="__new">+ Nova categoria…</option>
    </select>
    <div class="newcat" hidden>
      <input class="newcat-in" placeholder="Nome da nova categoria" data-input="catTyping" aria-label="Nome da nova categoria">
      <p class="cathint" role="status"></p>
    </div>
  </div>`;
}

function catSelect(sel) {
  const box = sel.parentElement.querySelector('.newcat');
  box.hidden = sel.value !== '__new';
  if (!box.hidden) box.querySelector('input').focus();
}

// aviso enquanto digita o nome de uma categoria nova
function catHint(input) {
  const scope = input.closest('.catfield, .cats');
  const hint = scope.querySelector('.cathint');
  const name = input.value.trim();
  if (!name) { hint.innerHTML = ''; return { name }; }

  const same = findCat(name);
  if (same) {
    hint.innerHTML = `Já existe a categoria <b>${esc(same)}</b>. ${input.closest('.catfield')
      ? `<button type="button" class="lk" data-act="useCat" data-cat="${esc(same)}">Usar ${esc(same)}</button>` : ''}`;
    return { name, same };
  }
  const like = similarCat(name);
  if (like) {
    hint.innerHTML = `Você quis dizer <b>${esc(like)}</b>?
      <button type="button" class="lk" data-act="useCat" data-cat="${esc(like)}">Usar ${esc(like)}</button>
      <button type="button" class="lk" data-act="forceNewCat">Criar “${esc(name)}” mesmo assim</button>`;
    return { name, like };
  }
  hint.textContent = `Será criada a categoria “${name}”.`;
  return { name };
}

// digitou de novo: desfaz o "criar mesmo assim"
const catTyping = input => { input.dataset.ok = ''; catHint(input); };

// escolheu a categoria sugerida
function useCat(btn) {
  const field = btn.closest('.catfield');
  if (field) {
    field.querySelector('select').value = btn.dataset.cat;
    field.querySelector('.newcat').hidden = true;
    field.querySelector('.newcat-in').value = '';
    field.querySelector('.cathint').innerHTML = '';
  } else {
    const box = btn.closest('.cats');
    box.querySelector('.newcat-in').value = '';
    box.querySelector('.cathint').innerHTML = '';
  }
}

// insistiu no nome novo mesmo parecido com outro
function forceNewCat(btn) {
  const scope = btn.closest('.catfield, .cats');
  const input = scope.querySelector('.newcat-in');
  input.dataset.ok = '1';
  if (scope.classList.contains('cats')) return catAdd();
  scope.querySelector('.cathint').textContent = `Ok. A categoria “${input.value.trim()}” será criada ao salvar o serviço.`;
}

/* Na hora de salvar o serviço: devolve o nome da categoria, ou null se
   ainda precisa de uma decisão (aí o aviso já está na tela). */
async function resolveCat(row) {
  const sel = row.querySelector('select[data-k=cat]');
  if (!sel || sel.value !== '__new') return sel ? sel.value : '';
  const input = row.querySelector('.newcat-in'), ok = input.dataset.ok === '1';
  const { name, same, like } = catHint(input);
  if (!name) { row.querySelector('.cathint').textContent = 'Escreva o nome da nova categoria.'; input.focus(); return null; }
  if (same) return same;
  if (like && !ok) { input.focus(); return null; }
  await saveCats([...catList(), name]);
  return name;
}

/* ---------- ações do bloco Categorias ---------- */
async function catAdd() {
  const box = $('.cats'), input = box.querySelector('.newcat-in');
  const ok = input.dataset.ok === '1';
  const { name, same, like } = catHint(input);
  if (!name) { input.focus(); return; }
  if (same) return;
  if (like && !ok) return;
  await saveCats([...catList(), name]);
  drawAdm(true);
}

async function catMove(name, d) {
  const cats = catList(), i = cats.indexOf(name), j = i + d;
  if (i < 0 || j < 0 || j >= cats.length) return;
  [cats[i], cats[j]] = [cats[j], cats[i]];
  await saveCats(cats);
  drawAdm(true);
}

async function catRename(old) {
  const typed = prompt(`Novo nome para “${old}”:`, old);
  const name = (typed || '').trim();
  if (!name || name === old) return;

  let dest = name;
  const same = catList().find(x => x !== old && normCat(x) === normCat(name));
  const like = !same && similarCat(name, old);
  if (same) {
    if (!confirm(`Já existe “${same}”. Juntar os serviços de “${old}” em “${same}”?`)) return;
    dest = same;
  } else if (like && confirm(`Existe “${like}”, parecida com “${name}”.\n\nOK: juntar os serviços em “${like}”.\nCancelar: renomear para “${name}” mesmo.`)) {
    dest = like;
  }
  await moveServices(old, dest);
  const list = [];
  catList().forEach(x => { const v = x === old ? dest : x; if (!list.some(y => normCat(y) === normCat(v))) list.push(v); });
  await saveCats(list);
  drawAdm(true);
}

async function catMerge(from, to) {
  if (!confirm(`Mover os serviços de “${from}” para “${to}” e apagar “${from}”?`)) return;
  await moveServices(from, to);
  await saveCats(catList().filter(x => x !== from));
  drawAdm(true);
}

async function catDelete(name) {
  const n = catCount(name);
  if (!confirm(n ? `Excluir “${name}”? ${n} serviço(s) ficam sem categoria.` : `Excluir “${name}”?`)) return;
  if (n) await moveServices(name, '');
  await saveCats(catList().filter(x => x !== name));
  drawAdm(true);
}
