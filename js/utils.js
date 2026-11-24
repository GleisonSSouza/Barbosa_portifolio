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
const bgImg = u => u ? `style="background-image:url('${esc(u)}')"` : '';

const durText = s => s.durTxt || s.dur + ' min';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);   // "dezembro de 2026" -> "Dezembro de 2026"
