/* =========================================================
   تور مجازی کتابخانه — نقشهٔ تعاملی بخش‌های کتابخانه
   با راهنمای قدم‌به‌قدم و پخش خودکار
   ========================================================= */

/* بخش‌ها به ترتیب مسیر تور (مختصات روی نقشه‌ای به اندازهٔ ۱۰۰۰×۶۲۰) */
const TOUR_ZONES = [
  { id: 'entrance', name: 'ورودی', x: 430, y: 545, w: 140, h: 60, icon: 'home', link: ['#about', 'ساعت کار کتابخانه'],
    text: 'از اینجا وارد می‌شوید. کنار در، تابلوی راهنمای بخش‌ها و صندوق برگشت کتاب است؛ کتاب‌های امانتی را حتی وقتی کتابخانه بسته است می‌توانید داخلش بیندازید.' },
  { id: 'desk', name: 'میز امانت و رزرو', x: 400, y: 420, w: 200, h: 90, icon: 'idcard', link: ['#books-free', 'رزرو آنلاین کتاب'],
    text: 'کتابدار اینجا کتاب‌های رزروشده را تحویل می‌دهد، امانت‌ها را ثبت می‌کند و جریمهٔ دیرکرد را می‌گیرد. کتاب رزرو آنلاین تا ۴۸ ساعت اینجا نگه داشته می‌شود.' },
  { id: 'kids', name: 'کودک و نوجوان', x: 700, y: 380, w: 270, h: 225, icon: 'heart', link: ['cat:کودک و نوجوان', 'کتاب‌های کودک و نوجوان'],
    text: 'قفسه‌های کوتاه، فرش رنگی و کتاب‌هایی مثل «قصه‌های مجید»، «ماهی سیاه کوچولو» و «هری پاتر». ساعت قصه‌گویی هم همین‌جا برگزار می‌شود.' },
  { id: 'classics', name: 'ادبیات کلاسیک', x: 700, y: 40, w: 270, h: 310, icon: 'library', link: ['#read', 'کتاب‌خوان آنلاین'],
    text: 'شاهنامه، گلستان، دیوان حافظ، مثنوی معنوی و کلیله و دمنه. متن گزیدهٔ این آثار را در کتاب‌خوان آنلاین هم می‌توانید بخوانید.' },
  { id: 'events', name: 'سالن مسابقه و کارگاه', x: 330, y: 40, w: 340, h: 110, icon: 'trophy', link: ['#competition', 'مسابقهٔ کتابخوانی'],
    text: 'مسابقهٔ کتابخوانی، نشست‌های نقد کتاب و کارگاه‌های نویسندگی اینجا برگزار می‌شود.' },
  { id: 'hall', name: 'تالار مطالعه', x: 330, y: 175, w: 340, h: 215, icon: 'clock', link: ['#study', 'تایمر و میز مطالعه'],
    text: 'میزهای مطالعه با نور مناسب و سکوت کامل. برای ثبت زمان مطالعه‌تان، تایمر میز مطالعه را روشن کنید.' },
  { id: 'novels', name: 'رمان ایرانی و خارجی', x: 30, y: 40, w: 270, h: 200, icon: 'book', link: ['cat:رمان خارجی', 'رمان‌های خارجی'],
    text: 'رمان‌ها به ترتیب شمارهٔ ردهٔ دیویی چیده شده‌اند؛ مثلاً رمان‌های فارسی با ۸۹۱/۵۵۳ و رمان‌های فرانسوی با ۸۴۳ شروع می‌شوند.' },
  { id: 'science', name: 'علم، تاریخ و فلسفه', x: 30, y: 265, w: 270, h: 150, icon: 'bulb', link: ['#assistant', 'پیشنهاد از دستیار هوشمند'],
    text: '«تاریخچهٔ زمان»، «انسان خردمند» و «دنیای سوفی» اینجا هستند. برای پیدا کردن کتاب علمی مناسب از دستیار هوشمند هم کمک بگیرید.' },
  { id: 'digital', name: 'گوشهٔ دیجیتال', x: 30, y: 440, w: 270, h: 165, icon: 'qr', link: ['#scan', 'اسکن QR کتاب'],
    text: 'رایانه‌ها و دستگاه اسکن QR. کد QR روی هر کتاب را اسکن کنید تا صفحه‌اش باز شود؛ با هدفون هم می‌توانید کتاب صوتی گوش بدهید.' }
];
let tourStep = 0;
let tourAuto = null;

function tourMapSVG() {
  const shelves = (z, rows) => Array.from({ length: rows }, (_, i) => `<rect class="furniture" x="${z.x + 24}" y="${z.y + 50 + i * ((z.h - 70) / rows)}" width="${z.w - 48}" height="8" rx="3"/>`).join('');
  const tables = z => [0, 1, 2].map(i => `<rect class="furniture" x="${z.x + 40 + i * 100}" y="${z.y + 95}" width="60" height="36" rx="6"/>`).join('');
  const center = z => [z.x + z.w / 2, z.y + z.h / 2];
  const pos = center(TOUR_ZONES[tourStep]);
  return `
    <svg class="tour-map" viewBox="0 0 1000 620" role="group" aria-label="نقشهٔ کتابخانه">
      <rect class="floor" x="10" y="20" width="980" height="595" rx="18"/>
      ${TOUR_ZONES.map((z, i) => `
        <g class="zone${i === tourStep ? ' active' : ''}" data-action="tour-go" data-step="${i}" tabindex="0" role="button" aria-label="${fa(i + 1)}. ${z.name}">
          <rect class="zone-box" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="12"/>
          ${['classics', 'novels', 'science'].includes(z.id) ? shelves(z, z.id === 'classics' ? 5 : 3) : ''}
          ${z.id === 'hall' ? tables(z) : ''}
          ${z.id === 'kids' ? `<circle class="furniture" cx="${z.x + z.w / 2}" cy="${z.y + z.h / 2 + 20}" r="55"/>` : ''}
          <circle class="zone-num-bg" cx="${z.x + 30}" cy="${z.y + 30}" r="20"/>
          <text class="zone-num" x="${z.x + 30}" y="${z.y + 31}">${fa(i + 1)}</text>
          <text class="zone-label" x="${center(z)[0]}" y="${z.y + z.h - 16}">${z.name}</text>
        </g>`).join('')}
      <g class="walker" style="transform: translate(${pos[0]}px, ${pos[1]}px)" aria-hidden="true"><circle r="16"/><circle r="6" class="walker-dot"/></g>
    </svg>`;
}
function tourPanelHTML() {
  const z = TOUR_ZONES[tourStep];
  const [href, label] = z.link;
  const linkHTML = href.startsWith('cat:')
    ? `<a class="btn btn-sm" href="#books" data-action="filter-category" data-cat="${esc(href.slice(4))}">${label}</a>`
    : `<a class="btn btn-sm" href="${href}">${label}</a>`;
  return `
    <p class="eyebrow">ایستگاه ${fa(tourStep + 1)} از ${fa(TOUR_ZONES.length)}</p>
    <h2>${icon(z.icon)} ${z.name}</h2>
    <p class="prose">${z.text}</p>
    <div class="hero-actions">${linkHTML}</div>
    <div class="tour-dots" aria-hidden="true">${TOUR_ZONES.map((_, i) => `<span class="${i === tourStep ? 'on' : ''}"></span>`).join('')}</div>
    <div class="book-actions">
      <button class="btn btn-ghost" type="button" data-action="tour-go" data-step="${tourStep - 1}"${tourStep === 0 ? ' disabled' : ''}>قبلی</button>
      <button class="btn" type="button" data-action="tour-go" data-step="${tourStep + 1}"${tourStep === TOUR_ZONES.length - 1 ? ' disabled' : ''}>بعدی</button>
      <button class="btn btn-ghost" type="button" data-action="tour-auto">${tourAuto ? icon('pause') + ' توقف تور' : icon('play') + ' تور خودکار'}</button>
    </div>`;
}
function updateTour() {
  const map = document.getElementById('tour-map');
  const panel = document.getElementById('tour-panel');
  if (!map || !panel) return;
  const z = TOUR_ZONES[tourStep];
  map.querySelectorAll('.zone').forEach((g, i) => g.classList.toggle('active', i === tourStep));
  const walker = map.querySelector('.walker');
  if (walker) walker.style.transform = 'translate(' + (z.x + z.w / 2) + 'px, ' + (z.y + z.h / 2) + 'px)';
  panel.innerHTML = tourPanelHTML();
}
function stopTourAuto() { if (tourAuto) clearInterval(tourAuto); tourAuto = null; }

Pages.tour = {
  title: 'تور مجازی کتابخانه',
  render() {
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">تور مجازی</p>
          <h1>قدم‌به‌قدم با کتابخانه آشنا شوید</h1>
          <p class="lead">روی هر بخش نقشه بزنید یا «تور خودکار» را روشن کنید تا با بخش‌های کتابخانه و کاری که هر کدام برایتان می‌کند آشنا شوید.</p>
        </div>
        <div class="tour-layout">
          <div class="panel tour-map-wrap" id="tour-map">${tourMapSVG()}</div>
          <aside class="panel tour-panel" id="tour-panel" aria-live="polite">${tourPanelHTML()}</aside>
        </div>
      </div>`;
  },
  unmount: stopTourAuto
};
Actions['tour-go'] = (data) => {
  const step = Number(data.step);
  if (step < 0 || step >= TOUR_ZONES.length) return;
  tourStep = step;
  updateTour();
};
Actions['tour-auto'] = () => {
  if (tourAuto) { stopTourAuto(); updateTour(); return; }
  if (tourStep === TOUR_ZONES.length - 1) tourStep = 0;
  tourAuto = setInterval(() => {
    if (tourStep >= TOUR_ZONES.length - 1) { stopTourAuto(); updateTour(); return; }
    tourStep += 1;
    updateTour();
  }, 4000);
  updateTour();
};
