/* ==========================================================================
   Funções pequenas usadas no site inteiro.
   ========================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// escapa texto antes de colocar dentro de HTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dg = s => String(s || '').replace(/\D/g, '');           // só os dígitos

// horários: "09:30" <-> 570 minutos
const tm = t => { const [a, b] = t.split(':'); return +a * 60 + +b; };
const fm = m => String(m / 60 | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// datas no formato AAAA-MM-DD
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => iso(new Date());
const brDate = d => d.split('-').reverse().join('/');          // 2026-12-05 -> 05/12/2026
const noon = k => new Date(k + 'T12:00');                       // evita erro de fuso

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// lista de datas bloqueadas e de telefones, digitadas como texto no painel
const blockedDays = () => String(S.cfg.blocked).split(',').map(x => x.trim());
const fixedPhones = () => String(S.cfg.phones).split(/[\n,;]/).map(dg).filter(Boolean);

// ids de 30 em 30 minutos ocupados por um atendimento: "2026-12-05_09:00", ...
const slotIds = (date, time, dur) => {
  const ids = [];
  for (let x = tm(time); x < tm(time) + +dur; x += 30) ids.push(date + '_' + fm(x));
  return ids;
};

const waLink = (num, text) => `https://wa.me/${dg(num)}` + (text ? `?text=${encodeURIComponent(text)}` : '');
/* ---------- links e imagens vindos do banco ----------
   Tudo o que a Laís (ou o banco) grava passa por aqui antes de virar
   href, src ou fundo. Assim um link "javascript:..." ou um endereço
   com aspas não consegue executar código nem quebrar o CSS. */

// só links http(s); o resto (javascript:, data:, vbscript:...) vira vazio
function safeLink(u) {
  try {
    const x = new URL(String(u || '').trim(), location.href);
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '';
  } catch (e) { return ''; }
}

// fotos e vídeos: arquivo do próprio site, data:image|video (enviados pelo painel) ou http(s)
function safeMedia(u, kind = 'image') {
  u = String(u || '').trim();
  if (!u) return '';
  // o conteúdo não precisa ser varrido (pode ter 20 MB): ele sempre é escapado no HTML e no CSS
  if (new RegExp(`^data:(${kind})/[\\w.+-]+;base64,`, 'i').test(u)) return u;
  if (/^[\w./-]+$/.test(u) && !u.includes('..')) return u;   // ex.: assets/img/lais.webp
  return safeLink(u);
}

// url("...") para CSS, com aspas, barras e quebras de linha escapadas
const cssUrl = u => `url("${String(u).replace(/["\\\n\r\f]/g, c => '\\' + c.charCodeAt(0).toString(16) + ' ')}")`;

// fundo com foto: o HTML leva só data-bg; applyBgs() aplica pelo JavaScript
const bgImg = u => `data-bg="${esc(safeMedia(u))}"`;
function applyBgs(root = document) {
  root.querySelectorAll('[data-bg]').forEach(el => {
    const u = el.dataset.bg;
    el.style.backgroundImage = [u && cssUrl(u), el.dataset.grad].filter(Boolean).join(', ');
  });
}

const durText = s => s.durTxt || s.dur + ' min';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);   // "dezembro de 2026" -> "Dezembro de 2026"
