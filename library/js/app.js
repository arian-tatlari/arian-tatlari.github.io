/* =========================================================
   app.js — برنامهٔ اصلی
   ۱) مسیریاب: با عوض شدن آدرس بعد از # (مثل #books) صفحهٔ مربوط را می‌سازد
   ۲) دکمه‌ها (data-action) و فرم‌ها (data-form) را به کارشان وصل می‌کند
   ۳) سربرگ: منو، زنگ اعلان‌ها، حالت تیره/روشن؛ نوار مقایسه و تایمر شناور
   ========================================================= */

/* ---------- ۱) مسیریاب ---------- */
/* #book-12 یعنی صفحهٔ «book» با مقدار «12» */
function currentRoute() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
  const dash = hash.indexOf('-');
  const name = dash === -1 ? hash : hash.slice(0, dash);
  return { name: Pages[name] ? name : 'home', param: dash === -1 ? '' : hash.slice(dash + 1), hash };
}

let lastHash = null;
let mountedPage = null;
function render() {
  const route = currentRoute();
  const page = Pages[route.name];
  const view = document.getElementById('view');
  if (mountedPage && mountedPage !== page && mountedPage.unmount) mountedPage.unmount();
  expireReservations();
  view.innerHTML = page.render(route.param);
  mountedPage = page;
  if (page.mount) page.mount(view, route.param);
  document.title = page.title + ' | کتابخانهٔ من';
  updateHeader(route);
  /* با رفتن به صفحهٔ تازه، به بالای صفحه می‌رویم و فوکوس را به محتوای اصلی می‌دهیم */
  if (route.hash !== lastHash) {
    if (!/^read-/.test(route.hash)) window.scrollTo(0, 0);
    if (lastHash !== null) view.focus({ preventScroll: true });
  }
  lastHash = route.hash;
}
/* جابه‌جایی بین صفحه‌ها با انیمیشن (اگر مرورگر پشتیبانی کند و کاربر حرکت کم نخواسته باشد) */
function renderWithTransition() {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce || lastHash === null || document.visibilityState !== 'visible') { render(); return; }
  let rendered = false;
  const update = () => { if (!rendered) { rendered = true; render(); } };
  const transition = document.startViewTransition(update);
  transition.ready.catch(() => { /* انیمیشن رد شد؛ صفحه بدون انیمیشن عوض می‌شود */ });
  transition.finished.catch(() => {}).finally(() => document.getElementById('view').focus({ preventScroll: true }));
  /* اگر مرورگر انیمیشن را شروع نکرد، صفحه را بدون انتظار عوض می‌کنیم */
  setTimeout(() => { if (!rendered) { transition.skipTransition(); update(); } }, 250);
}
function go(hash) {
  if (location.hash.replace(/^#/, '') === hash) render();
  else location.hash = hash;
}
/* بعد از هر تغییر، صفحهٔ فعلی را دوباره می‌سازد و دکمه‌ای را که زده شده بود دوباره فوکوس می‌کند */
function refresh() {
  const active = document.activeElement;
  const selector = active && active.dataset && active.dataset.action
    ? '[data-action="' + active.dataset.action + '"]' + (active.dataset.id ? '[data-id="' + active.dataset.id + '"]' : '')
    : null;
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
  const again = selector && document.querySelector(selector);
  if (again) again.focus({ preventScroll: true });
}

/* اگر کاری نیاز به ورود داشت، کاربر را به صفحهٔ ورود می‌بریم و بعد از ورود برمی‌گردانیم */
let afterLoginHash = null;
function requireLogin(message) {
  afterLoginHash = location.hash.replace(/^#/, '') || 'home';
  toast(message, 'bad');
  go('login');
}
function afterLogin() {
  const target = afterLoginHash && !/^(login|register|account)$/.test(afterLoginHash) ? afterLoginHash : 'account';
  afterLoginHash = null;
  syncNotifications(currentUser());
  go(target);
}

/* ---------- ۳) سربرگ، زنگ اعلان، نوار مقایسه ---------- */
const NAV_SECTIONS = { book: 'books', login: 'account', register: 'account', gift: 'donate', author: 'authors', read: 'study', edit: 'admin', compare: 'discover', notifications: 'account' };
function updateHeader(route) {
  const section = NAV_SECTIONS[route.name] || route.name;
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === section) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const user = currentUser();
  document.querySelectorAll('[data-staff]').forEach(link => { link.hidden = !(link.dataset.staff === 'admin' ? isAdmin(user) : isStaff(user)); });
  const more = document.querySelector('.nav-more');
  more.classList.toggle('has-current', !!more.querySelector('[aria-current]'));

  document.getElementById('account-slot').innerHTML = user
    ? '<a class="user-chip" href="#account"' + (section === 'account' ? ' aria-current="page"' : '') + '>' +
      '<span class="avatar" aria-hidden="true">' + esc(user.name.charAt(0)) + '</span><span class="user-name">' + esc(user.name) + '</span></a>'
    : '<a class="btn btn-sm" href="#login">' + icon('login') + '<span class="login-label">ورود / عضویت</span></a>';
  updateBell();
  updateCompareTray(route);
  closeMenus();
}
function updateBell() {
  const user = currentUser();
  const bell = document.getElementById('bell');
  bell.hidden = !user;
  if (!user) return;
  const count = unreadCount(user.id);
  bell.querySelector('.bell-count').textContent = count ? fa(count > 9 ? '9+' : count) : '';
  bell.querySelector('.bell-count').hidden = !count;
  bell.setAttribute('aria-label', 'اعلان‌ها' + (count ? '، ' + count + ' خوانده‌نشده' : ''));
}
function updateCompareTray(route) {
  const tray = document.getElementById('compare-tray');
  const ids = compareIds();
  tray.hidden = !ids.length || route.name === 'compare';
  if (tray.hidden) return;
  tray.innerHTML = '<span>' + icon('columns') + ' ' + fa(ids.length) + ' کتاب برای مقایسه</span>' +
    '<a class="btn btn-sm" href="#compare">دیدن مقایسه</a><button class="btn btn-sm btn-ghost" type="button" data-action="compare-clear">پاک کردن</button>';
}
function closeMenus() {
  document.getElementById('site-nav').classList.remove('open');
  document.querySelector('.menu-btn').setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.nav-more[open]').forEach(d => d.removeAttribute('open'));
}

/* جشن کوچک برای گرفتن نشان و انجام مأموریت */
function celebrate() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement('i');
    piece.className = 'c' + (i % 4);
    piece.style.left = Math.random() * 100 + '%';
    piece.style.animationDelay = Math.random() * 0.4 + 's';
    piece.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2400);
}

/* ---------- حالت تیره و روشن ---------- */
const THEME_KEY = 'my-library-theme';
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const systemTheme = () => (darkQuery && darkQuery.matches ? 'dark' : 'light');
const shownTheme = () => document.documentElement.getAttribute('data-theme') || systemTheme();

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme); else root.removeAttribute('data-theme');
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.content = theme || 'light dark';
  updateThemeButton();
}
function updateThemeButton() {
  const button = document.querySelector('[data-action="toggle-theme"]');
  const label = shownTheme() === 'dark' ? 'رفتن به حالت روشن' : 'رفتن به حالت تیره';
  button.innerHTML = icon(shownTheme() === 'dark' ? 'sun' : 'moon') + '<span class="sr-only">' + label + '</span>';
  button.title = label;
}
/* هر کلیک حالت را برعکس می‌کند؛ اگر حالت تازه همان حالت سیستم باشد، دوباره از سیستم پیروی می‌کنیم */
Actions['toggle-theme'] = () => {
  const next = shownTheme() === 'dark' ? 'light' : 'dark';
  if (next === systemTheme()) { storage.remove(THEME_KEY); applyTheme(null); }
  else { storage.set(THEME_KEY, next); applyTheme(next); }
};

/* ---------- کارهای عمومی دکمه‌ها ---------- */
Actions['toggle-menu'] = (data, button) => {
  const nav = document.getElementById('site-nav');
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  button.setAttribute('aria-expanded', String(open));
};
Actions['skip-to-content'] = () => document.getElementById('view').focus();
Actions['close-modal'] = () => closeModal();
Actions['close-modal-go'] = (data, link) => { closeModal(); go(link.getAttribute('href').replace(/^#/, '')); };
Actions['confirm-yes'] = () => {
  const callback = pendingConfirm;
  pendingConfirm = null;
  closeModal();
  if (callback) callback();
};

/* ---------- ۲) وصل کردن دکمه‌ها و فرم‌ها ---------- */
document.addEventListener('click', event => {
  /* بستن منوی «بیشتر» با کلیک بیرون آن */
  document.querySelectorAll('.nav-more[open]').forEach(d => { if (!d.contains(event.target)) d.removeAttribute('open'); });
  if (event.target.closest('.site-nav a')) closeMenus();

  /* انیمیشن پرواز جلد کتاب از فهرست به صفحهٔ کتاب */
  const cardLink = event.target.closest('.book-card-link, .spine, .bot-book');
  if (cardLink && !document.querySelector('[style*="view-transition-name:book-cover"]')) {
    const cover = cardLink.querySelector('.cover') || cardLink;
    cover.style.viewTransitionName = 'book-cover';
  }

  const element = event.target.closest('[data-action]');
  const handler = element && Actions[element.dataset.action];
  if (!handler) return;
  event.preventDefault();
  handler(element.dataset, element);
});
document.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const handler = Forms[form.dataset.form];
  if (handler) handler(formValues(form), form);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenus();
  /* بخش‌های نقشه و نمودار که دکمهٔ واقعی نیستند، با Enter و Space هم کار کنند */
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches && event.target.matches('[data-action][role="button"]:not(button):not(a)')) {
    event.preventDefault();
    event.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});

/* ---------- شروع برنامه ---------- */
function start() {
  document.documentElement.lang = 'fa';
  document.documentElement.dir = 'rtl';
  initDB();
  fillStaticIcons();
  initModal();
  initFormAria();
  initChartTips();
  const savedTheme = storage.get(THEME_KEY);
  if (savedTheme) applyTheme(savedTheme); else updateThemeButton();
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', updateThemeButton);
  document.querySelector('[data-year]').textContent = fa(persianParts().year);
  /* اعلان تازه: پیام کوچک، جشن برای نشان، و اعلان مرورگر اگر اجازه داده شده باشد */
  notificationListener = item => {
    toast(item.text, item.type === 'late' || item.type === 'fine' ? 'bad' : 'ok');
    if (item.type === 'badge') celebrate();
    if (window.Notification && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('کتابخانهٔ من', { body: item.text }); } catch (e) { /* بعضی مرورگرها اجازه نمی‌دهند */ }
    }
    updateBell();
  };
  expireReservations();
  syncNotifications(currentUser());
  window.addEventListener('hashchange', renderWithTransition);
  render();
  setInterval(tickTimers, 1000);
  setInterval(() => { expireReservations(); updateBell(); }, 60000);
}
start();
