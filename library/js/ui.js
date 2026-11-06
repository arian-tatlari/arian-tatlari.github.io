/* =========================================================
   ui.js — ابزارهای ظاهری که همهٔ صفحه‌ها از آن استفاده می‌کنند:
   آیکن‌ها، اعلان، پنجرهٔ پیام، جلد و عطف کتاب، ستاره‌ها و فرم‌ها
   ========================================================= */

/* آیکن‌ها (طرح‌های خطی ساده با SVG، بدون نیاز به اینترنت) */
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  arrow: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
  shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.97a4 4 0 0 0 3.3-1.7l5.45-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.97a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  map: '<path d="M14.1 5.55a2 2 0 0 0 1.8 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.9l-4.56 2.27a2 2 0 0 1-1.78 0l-4.22-2.1a2 2 0 0 0-1.78 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.9l4.56-2.27a2 2 0 0 1 1.78 0z"/><path d="M15 5.76v15"/><path d="M9 3.24v15"/>',
  edit: '<path d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.36a.5.5 0 0 0 .62.62l4.36-1.32a2 2 0 0 0 .83-.5z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  send: '<path d="M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
  pen: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  minus: '<path d="M5 12h14"/>',
  filter: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  idcard: '<rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><path d="M8 2v2"/><path d="M16 2v2"/><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>'
};
const STAR_POINTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

function icon(name, extraClass) {
  return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}
function starIcon(extraClass) {
  return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" aria-hidden="true"><polygon fill="currentColor" points="' + STAR_POINTS + '"/></svg>';
}
/* جایگزین کردن <span data-icon="..."> های فایل HTML با آیکن واقعی */
function fillStaticIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
}
function faDecimal(n) { return fa(Number(n).toFixed(1)).replace('.', '٫'); }

/* آیا صفحه مستقیم باز شده (نه داخل یک قاب)؟ فقط آن موقع دکمهٔ چاپ را نشان می‌دهیم */
const CAN_PRINT = (() => { try { return window.self === window.top; } catch (e) { return false; } })();

/* ---------- اعلان کوچک پایین صفحه ---------- */
function toast(message, type) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  el.innerHTML = icon(type === 'bad' ? 'info' : 'check') + '<span>' + esc(message) + '</span>';
  box.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}
/* نتیجهٔ توابع store.js را به‌صورت اعلان نشان می‌دهد و درست/غلط بودنش را برمی‌گرداند */
function notify(result) { toast(result.msg, result.ok ? 'ok' : 'bad'); return result.ok; }

/* ---------- پنجرهٔ پیام (مودال) ---------- */
let pendingConfirm = null;

function modalBox(title, body, actions) {
  return '<div class="modal-inner">' +
    '<div class="modal-head"><h2 id="modal-title">' + title + '</h2>' +
    '<button class="icon-btn" type="button" data-action="close-modal">' + icon('close') + '<span class="sr-only">بستن</span></button></div>' +
    body + (actions ? '<div class="modal-actions">' + actions + '</div>' : '') + '</div>';
}
function openModal(html) {
  pendingConfirm = null;
  const dialog = document.getElementById('modal');
  document.getElementById('modal-body').innerHTML = html;
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
    dialog.classList.add('fallback-open');
  }
  const first = dialog.querySelector('[autofocus], .modal-actions .btn, input, textarea');
  if (first) first.focus();
}
function closeModal() {
  const dialog = document.getElementById('modal');
  if (typeof dialog.close === 'function') { if (dialog.open) dialog.close(); }
  else dialog.removeAttribute('open');
  dialog.classList.remove('fallback-open');
}
/* پنجرهٔ «مطمئن هستید؟» — به‌جای confirm() مرورگر */
function askConfirm({ title, text, yes, danger, onYes }) {
  openModal(modalBox(title, '<p>' + text + '</p>',
    '<button class="btn ' + (danger ? 'btn-danger' : '') + '" type="button" data-action="confirm-yes">' + yes + '</button>' +
    '<button class="btn btn-ghost" type="button" data-action="close-modal" autofocus>انصراف</button>'));
  pendingConfirm = onYes;   /* بعد از باز شدن پنجره تنظیم می‌شود تا پنجرهٔ قبلی آن را پاک نکند */
}
function initModal() {
  const dialog = document.getElementById('modal');
  /* بستن با کلیک بیرون پنجره، برای مرورگرهایی که closedby را نمی‌شناسند */
  if (window.HTMLDialogElement && !('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = r.top <= event.clientY && event.clientY <= r.top + r.height && r.left <= event.clientX && event.clientX <= r.left + r.width;
      if (!inside) closeModal();
    });
  }
}

/* ---------- کتاب: جلد، عطف، مهر وضعیت و ستاره‌ها ---------- */
function coverStyle(book) { return '--c1:' + book.colors[0] + ';--c2:' + book.colors[1]; }
/* transitionName: نام انیمیشن جابه‌جایی جلد از فهرست به صفحهٔ کتاب */
function coverHTML(book, extraClass, transitionName) {
  return '<div class="cover' + (extraClass ? ' ' + extraClass : '') + '" style="' + coverStyle(book) + (transitionName ? ';view-transition-name:' + transitionName : '') + '" aria-hidden="true">' +
    '<span class="cover-title">' + esc(book.title) + '</span>' +
    '<span class="cover-foot"><span class="cover-orn"></span><span class="cover-author">' + esc(book.author) + '</span></span></div>';
}
function spineHTML(book) {
  const h = 196 + (book.id * 37) % 74;     /* ارتفاع و پهنای هر عطف کمی فرق دارد تا قفسه طبیعی دیده شود */
  const w = 44 + (book.id * 13) % 14;
  return '<a class="spine" href="#book-' + book.id + '" style="' + coverStyle(book) + ';--h:' + h + 'px;--w:' + w + 'px" title="' + esc(book.title + ' — ' + book.author) + '">' +
    '<span class="spine-band"></span><span class="spine-title">' + esc(book.title) + '</span>' +
    '<span class="call-label">' + (book.ddc ? ddcFa(book.ddc).replace('/', '<br>/') : '—') + '</span></a>';
}
function stampHTML(book) {
  const state = bookState(book.id).state;
  if (state === 'loan') return '<span class="stamp loan">در امانت</span>';
  if (state === 'reserved') return '<span class="stamp reserved">رزرو شده</span>';
  return '<span class="stamp">آزاد</span>';
}
/* دکمه‌های کوچک «علاقه‌مندی» و «مقایسه» */
function favButtonHTML(bookId) {
  const user = currentUser();
  const on = !!user && isFavorite(user.id, bookId);
  return '<button class="mini-btn fav-btn" type="button" data-action="fav" data-id="' + bookId + '" aria-pressed="' + on + '" title="' + (on ? 'برداشتن از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها') + '">' + icon('heart') + '<span class="sr-only">علاقه‌مندی</span></button>';
}
function compareButtonHTML(bookId) {
  const on = compareIds().includes(bookId);
  return '<button class="mini-btn" type="button" data-action="compare" data-id="' + bookId + '" aria-pressed="' + on + '" title="' + (on ? 'برداشتن از مقایسه' : 'افزودن به مقایسه') + '">' + icon('columns') + '<span class="sr-only">مقایسه</span></button>';
}
function starsHTML(avg, count) {
  let stars = '';
  for (let i = 1; i <= 5; i++) stars += starIcon(avg >= i - 0.25 ? '' : 'off');
  return '<span class="stars" title="میانگین امتیاز ' + faDecimal(avg) + ' از ۵">' + stars +
    '<b>' + (avg ? faDecimal(avg) : '—') + '</b>' + (count != null ? '<span class="muted small">(' + fa(count) + ' رأی)</span>' : '') + '</span>';
}
function starInputHTML(bookId, value) {
  let buttons = '';
  for (let i = 5; i >= 1; i--) {
    buttons += '<button type="button" class="' + (value >= i ? 'on' : '') + '" data-action="rate" data-id="' + bookId + '" data-stars="' + i + '" aria-label="' + fa(i) + ' ستاره" aria-pressed="' + (value === i) + '">' + starIcon() + '</button>';
  }
  return '<span class="star-input" role="group" aria-label="امتیاز شما">' + buttons + '</span>';
}
/* پررنگ کردن کلمه‌های جست‌وجوشده */
function highlight(text, query) {
  const words = String(query || '').trim().split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return esc(text);
  const pattern = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return String(text).split(pattern).map((part, i) => (i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part))).join('');
}
function bookCardHTML(book, query, note) {
  const r = rating(book);
  return '<div class="book-card"><a class="book-card-link" href="#book-' + book.id + '">' + coverHTML(book) +
    '<span class="book-card-title">' + highlight(book.title, query) + '</span>' +
    '<span class="book-card-author">' + highlight(book.author, query) + '</span></a>' + stampHTML(book) +
    (note ? '<span class="book-card-note">' + esc(note) + '</span>' : '') +
    '<div class="book-card-meta">' + starsHTML(r.avg) +
    '<span class="book-card-actions">' + (book.donatedBy ? '<span class="chip-badge">اهدایی</span>' : '') + favButtonHTML(book.id) + compareButtonHTML(book.id) + '</span></div></div>';
}

/* ---------- فرم‌ها ---------- */
const SUPPORTS_USER_INVALID = window.CSS && CSS.supports && CSS.supports('selector(:user-invalid)');

/* aria-invalid را با ظاهر خطای فیلد هماهنگ می‌کند تا صفحه‌خوان‌ها هم خطا را اعلام کنند */
function syncAria(scope) {
  (scope || document).querySelectorAll('.input, .select, .textarea').forEach(el => {
    const afterSubmit = el.closest('.was-validated') && !el.checkValidity();
    const touched = SUPPORTS_USER_INVALID && el.matches(':user-invalid');
    if (afterSubmit || touched) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  });
}
function initFormAria() {
  const update = event => { if (event.target.matches && event.target.matches('.input, .select, .textarea')) syncAria(event.target.parentNode); };
  document.addEventListener('blur', update, true);
  document.addEventListener('input', update, true);
}
/* بررسی فرم قبل از ارسال؛ اگر فیلدی مشکل داشت، پیامش نشان داده می‌شود */
function validateForm(form) {
  form.classList.add('was-validated');
  syncAria(form);
  const firstBad = form.querySelector('.input:invalid, .select:invalid, .textarea:invalid');
  if (firstBad) { firstBad.focus(); return false; }
  return true;
}
function formValues(form) {
  const values = {};
  new FormData(form).forEach((value, key) => { values[key] = value; });
  return values;
}
/* ساختن یک فیلد فرم با برچسب و پیام خطا */
function field({ id, label, name, type, value, required, min, max, pattern, placeholder, hint, error, dir, as, options, rows, autocomplete }) {
  const common = 'id="' + id + '" name="' + name + '"' + (required ? ' required' : '') + (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') +
    ' aria-describedby="' + id + '-err' + (hint ? ' ' + id + '-hint' : '') + '"';
  let control;
  if (as === 'select') {
    control = '<select class="select" ' + common + '>' + options.map(o => '<option value="' + esc(o.value) + '"' + (o.value === value ? ' selected' : '') + (o.disabled ? ' disabled' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
  } else if (as === 'textarea') {
    control = '<textarea class="textarea" ' + common + (min ? ' minlength="' + min + '"' : '') + (max ? ' maxlength="' + max + '"' : '') + ' rows="' + (rows || 4) + '">' + esc(value || '') + '</textarea>';
  } else {
    control = '<input class="input" type="' + (type || 'text') + '" ' + common + ' value="' + esc(value || '') + '"' +
      (min ? ' minlength="' + min + '"' : '') + (max ? ' maxlength="' + max + '"' : '') + (pattern ? ' pattern="' + pattern + '"' : '') +
      (dir ? ' dir="' + dir + '"' : '') + (autocomplete ? ' autocomplete="' + autocomplete + '"' : '') + '>';
  }
  return '<div class="field"><label for="' + id + '">' + label + '</label>' +
    (hint ? '<span class="hint" id="' + id + '-hint">' + hint + '</span>' : '') + control +
    '<span class="error-msg" id="' + id + '-err">' + (error || 'این بخش را کامل کنید.') + '</span></div>';
}

/* ---------- جای ثبت صفحه‌ها ----------
   هر فایل داخل پوشهٔ pages صفحهٔ خودش را در Pages، کار دکمه‌هایش را در Actions
   و کار فرم‌هایش را در Forms ثبت می‌کند؛ app.js آن‌ها را به هم وصل می‌کند. */
const Pages = {};
const Actions = {};
const Forms = {};

/* ---------- کپی کردن متن ---------- */
function copyText(text, targetId) {
  const selectTarget = () => {
    const target = targetId && document.getElementById(targetId);
    if (target) {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    toast('متن انتخاب شد؛ با Ctrl+C کپی کنید.', 'bad');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('کپی شد.'), selectTarget);
  } else selectTarget();
}
