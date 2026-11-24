/* ==========================================================================
   Banco de dados local (demonstração).

   Imita a forma de uso do Firestore (collection/doc/onSnapshot), a mesma que
   o site usava dentro do Claude. Para ligar um banco online no futuro, basta
   trocar este arquivo por um que fale com o serviço escolhido.

   Os dados ficam no IndexedDB do navegador. Abas abertas do mesmo site
   conversam entre si: um agendamento feito numa aba aparece no painel da outra.
   ========================================================================== */
const Store = (() => {
  const TABLE = 'docs';
  const mem = new Map();           // 'colecao/id' -> dados
  const subs = new Set();          // ouvintes ativos
  let idb = null;
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CONFIG.DB_NAME) : null;

  /* ---------- IndexedDB ---------- */
  const openIdb = () => new Promise(res => {
    try {
      const r = indexedDB.open(CONFIG.DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(TABLE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });

  const loadAll = () => new Promise(res => {
    if (!idb) return res();
    mem.clear();
    const rq = idb.transaction(TABLE).objectStore(TABLE).openCursor();
    rq.onsuccess = () => { const c = rq.result; if (c) { mem.set(c.key, c.value); c.continue(); } else res(); };
    rq.onerror = () => res();
  });

  const persist = (key, val) => new Promise((res, rej) => {
    if (!idb) return res();
    const tx = idb.transaction(TABLE, 'readwrite');
    val === undefined ? tx.objectStore(TABLE).delete(key) : tx.objectStore(TABLE).put(val, key);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error || new Error('Não foi possível salvar no navegador.'));
    tx.onabort = () => rej(tx.error || new Error('Espaço do navegador esgotado.'));
  });

  /* ---------- fotos instantâneas (snapshots) ---------- */
  const colOf = path => path.split('/')[0];

  const colSnap = col => {
    const docs = [];
    mem.forEach((v, k) => { if (colOf(k) === col) docs.push({ id: k.slice(col.length + 1), data: () => ({ ...v }) }); });
    return { empty: !docs.length, docs };
  };
  const docSnap = path => ({ id: path.split('/')[1], exists: mem.has(path), data: () => ({ ...mem.get(path) }) });

  const notify = path => subs.forEach(s => {
    if (s.col === colOf(path) || s.doc === path) s.cb(s.col ? colSnap(s.col) : docSnap(s.doc));
  });
  const notifyAll = () => subs.forEach(s => s.cb(s.col ? colSnap(s.col) : docSnap(s.doc)));

  const listen = (sub) => {
    subs.add(sub);
    sub.cb(sub.col ? colSnap(sub.col) : docSnap(sub.doc));
    return () => subs.delete(sub);
  };

  async function write(path, val) {
    await persist(path, val);
    val === undefined ? mem.delete(path) : mem.set(path, val);
    notify(path);
    if (channel) channel.postMessage({ path });
  }

  // outra aba mudou algo: recarrega e avisa
  if (channel) channel.onmessage = async () => { await loadAll(); notifyAll(); };

  // ids em ordem crescente: o navegador devolve os itens ordenados pelo id,
  // então a ordem de cadastro se mantém depois de recarregar a página
  let lastTs = 0;
  const newId = () => {
    lastTs = Math.max(Date.now(), lastTs + 1);
    return lastTs.toString(36) + Math.random().toString(36).slice(2, 6);
  };

  /* ---------- API no formato do Firestore ---------- */
  const db = {
    collection: col => ({
      add: async o => { const id = newId(); await write(col + '/' + id, { ...o }); return { id }; },
      onSnapshot: cb => listen({ col, cb })
    }),
    doc: path => ({
      get: async () => docSnap(path),
      set: o => write(path, { ...o }),
      update: o => mem.has(path)
        ? write(path, { ...mem.get(path), ...o })
        : Promise.reject(new Error('Registro não encontrado.')),
      delete: () => write(path, undefined),
      onSnapshot: cb => listen({ doc: path, cb })
    }),
    // apaga tudo (botão "Limpar dados de demonstração")
    clear: async () => {
      if (idb) await new Promise(res => { const tx = idb.transaction(TABLE, 'readwrite'); tx.objectStore(TABLE).clear(); tx.oncomplete = res; tx.onerror = res; });
      mem.clear(); notifyAll();
      if (channel) channel.postMessage({ path: '*' });
    }
  };

  /* ---------- envio de fotos e vídeos ---------- */
  const readAsDataUrl = f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(f);
  });

  // reduz a foto para não lotar o navegador
  async function shrink(file) {
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, CONFIG.MAX_IMG_PX / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/webp', .85);
    } catch (e) { return readAsDataUrl(file); }
  }

  const assets = {
    upload: async file => {
      if (!file) throw new Error('Nenhum arquivo escolhido.');
      if (file.type.startsWith('video')) {
        if (file.size > CONFIG.MAX_VIDEO_MB * 1024 * 1024) throw new Error(`O vídeo passa de ${CONFIG.MAX_VIDEO_MB} MB.`);
        return { url: await readAsDataUrl(file) };
      }
      return { url: await shrink(file) };
    }
  };

  /* ---------- início ---------- */
  async function ready() {
    idb = await openIdb();
    await loadAll();
    return { db, assets };
  }

  return { ready };
})();

/* ==========================================================================
   Login da Laís (demonstração).
   A senha não fica escrita no código, só o hash dela (js/config.js).
   ========================================================================== */
const Auth = (() => {
  const KEY = 'lais-admin';
  let mem = false;   // reserva caso o navegador bloqueie o sessionStorage

  const get = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return mem; } };
  const put = v => { mem = v; try { v ? sessionStorage.setItem(KEY, '1') : sessionStorage.removeItem(KEY); } catch (e) {} };

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return {
    isOwner: get,
    async login(user, pass) {
      if (!window.crypto || !crypto.subtle) throw new Error('Abra o site por https para entrar no painel.');
      const ok = (await sha256(user.trim().toLowerCase() + ':' + pass)) === CONFIG.ADMIN.hash;
      put(ok);
      return ok;
    },
    logout: () => put(false)
  };
})();
