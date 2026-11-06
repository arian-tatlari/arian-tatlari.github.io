/* =========================================================
   صفحهٔ اصلی — «ورود به کتابخانه»، کتاب هفته، پیشنهادهای هوشمند
   و نقشهٔ همهٔ امکانات کتابخانهٔ هوشمند
   ========================================================= */

/* کتاب‌هایی که روی قفسهٔ صفحهٔ اصلی چیده می‌شوند */
const SHELF_IDS = [1, 3, 10, 6, 11, 9, 16, 14, 2, 8, 19];

/* نقشهٔ امکانات، دسته‌بندی‌شده */
const FEATURE_GROUPS = [
  { title: 'جست‌وجو و کشف', icon: 'search', items: [
    ['#books', 'جست‌وجوی پیشرفته (نام، نویسنده، موضوع، ژانر)'], ['#discover', 'کتاب هفته و کتاب‌های ویژه'], ['#discover', 'محبوب‌ترین و پربازدیدترین'],
    ['#discover', 'پیشنهاد هوشمند بر اساس سلیقه'], ['#compare', 'مقایسهٔ چند کتاب'], ['#discover', 'پیشنهاد کتاب تصادفی'], ['#authors', 'معرفی نویسندگان معروف']] },
  { title: 'هوش مصنوعی و فناوری', icon: 'sparkles', items: [
    ['#assistant', 'دستیار هوشمند: معرفی، خلاصه و پاسخ'], ['#scan', 'اسکن QR Code کتاب'], ['#scan-cover', 'تشخیص کتاب از روی تصویر جلد']] },
  { title: 'امانت و رزرو', icon: 'calendar', items: [
    ['#books-free', 'رزرو آنلاین و امانت کتاب'], ['#book-11', 'صف انتظار کتاب‌های در امانت'], ['#account', 'جریمهٔ خودکار دیرکرد'],
    ['#notifications', 'اعلان زمان برگشت و تأیید رزرو'], ['#books-loan', 'وضعیت کتاب: آزاد، رزرو یا در امانت']] },
  { title: 'مطالعه', icon: 'book', items: [
    ['#read-3', 'کتاب‌خوان آنلاین (متن‌های مجاز)'], ['#read-1', 'کتاب صوتی و خواندن با صدا'], ['#read-4', 'حالت مطالعهٔ بدون حواس‌پرتی'],
    ['#study', 'تایمر و ثبت زمان مطالعه'], ['#study', 'نمودار پیشرفت مطالعه'], ['#study', 'تقویم برنامه‌ریزی مطالعه'], ['#shelf', 'قفسهٔ کتاب مجازی من'], ['#book-10', 'یادداشت‌گذاری برای هر کتاب']] },
  { title: 'باشگاه کتاب‌خوان‌ها', icon: 'trophy', items: [
    ['#club', 'امتیاز و نشان افتخار'], ['#club', 'جدول رتبه‌بندی کاربران'], ['#club', 'مأموریت‌های هفتگی'], ['#competition', 'مسابقهٔ کتابخوانی']] },
  { title: 'حساب کاربری', icon: 'user', items: [
    ['#register', 'ثبت‌نام و ورود'], ['#account', 'پروفایل اختصاصی و تاریخچهٔ مطالعه'], ['#account', 'لیست علاقه‌مندی‌ها'], ['#book-10', 'امتیاز ستاره‌ای و نقد کتاب'],
    ['#app', 'نصب اپ و اشتراک'], ['#donate', 'اهدا و هدیه دادن کتاب']] },
  { title: 'مدیریت', icon: 'shield', items: [
    ['#admin', 'پنل مدیریت: افزودن، ویرایش و حذف کتاب'], ['#librarian', 'پنل کتابدار: امانت‌ها و رزروها'], ['#admin', 'داشبورد آماری با نمودار'], ['#tour', 'تور مجازی کتابخانه']] },
  { title: 'ارتباط و پشتیبانی', icon: 'help', items: [
    ['#feedback', 'نظرات و پیشنهادات کاربران'], ['#help', 'راهنما و سوالات رایج'], ['#about', 'دربارهٔ کتابخانهٔ من'], ['#contact', 'ارتباط با ما']] }
];

Pages.home = {
  title: 'ورود به کتابخانه',
  render() {
    const user = currentUser();
    const shelf = SHELF_IDS.map(getBook).filter(Boolean);
    const freeCount = db.books.filter(b => bookState(b.id).state === 'free').length;
    const activeCount = db.loans.filter(l => !l.returned).length;
    const week = bookOfWeek();
    const picks = recommendFor(user, 4);
    const featureCount = FEATURE_GROUPS.reduce((n, g) => n + g.items.length, 0);

    return `
      <div class="wrap">
        <section class="hero">
          <div>
            <p class="eyebrow">ورود به کتابخانهٔ هوشمند</p>
            <h1>کتابخانهٔ <span class="gold">من</span></h1>
            <p class="lead">هر کتاب، یک دنیای تازه. جست‌وجو کن، رزرو کن، با دستیار هوشمند گپ بزن، زمان مطالعه‌ات را ثبت کن و در باشگاه کتاب‌خوان‌ها امتیاز بگیر.</p>
            <form class="searchbar" role="search" data-form="home-search" novalidate>
              <div class="input-wrap">
                ${icon('search')}
                <input id="home-q" class="input" type="search" name="q" placeholder="نام کتاب، نویسنده یا موضوع…" aria-label="جست‌وجوی کتاب">
              </div>
              <button class="btn" type="submit">جست‌وجو</button>
            </form>
            <div class="hero-actions">
              <a class="btn btn-gold" href="#books">${icon('library')} ورود به کتابخانه</a>
              <a class="btn btn-ghost" href="#assistant">${icon('sparkles')} دستیار هوشمند</a>
              <a class="btn btn-ghost" href="${user ? '#account' : '#register'}">${user ? 'حساب من' : 'عضویت رایگان'}</a>
            </div>
          </div>
          <div class="shelf-wrap">
            <div class="shelf">${shelf.map(spineHTML).join('')}</div>
            <div class="shelf-board"></div>
            <p class="shelf-caption">روی عطف هر کتاب بزنید تا صفحه‌اش باز شود. عددِ روی برچسب، شمارهٔ ردهٔ دیویی کتاب است.</p>
          </div>
        </section>

        <div class="stats">
          <div class="stat"><b>${fa(db.books.length)}</b><span>کتاب در کتابخانه</span></div>
          <div class="stat"><b>${fa(freeCount)}</b><span>کتاب آزاد، آمادهٔ امانت</span></div>
          <div class="stat"><b>${fa(db.users.filter(u => u.role === 'member').length)}</b><span>عضو</span></div>
          <div class="stat"><b>${fa(activeCount)}</b><span>امانت فعال</span></div>
        </div>

        ${week ? `
        <section class="section week-band">
          <div class="week-cover">${coverHTML(week)}</div>
          <div class="week-text">
            <p class="eyebrow">کتاب این هفته</p>
            <h2>${esc(week.title)}</h2>
            <p class="byline">${esc(week.author)} · ${esc(week.genre)}</p>
            <p class="prose">${esc(week.summary || week.description)}</p>
            <div class="hero-actions">
              <a class="btn" href="#book-${week.id}">دیدن کتاب</a>
              <button class="btn btn-ghost" type="button" data-action="random-book">${icon('shuffle')} یک کتاب تصادفی</button>
            </div>
          </div>
        </section>` : ''}

        <section class="section">
          <div class="section-head">
            <div><p class="eyebrow">${icon('sparkles')} پیشنهاد هوشمند</p><h2>${user ? 'پیشنهاد برای ' + esc(user.name) : 'محبوب‌ترین‌ها برای شروع'}</h2></div>
            <a href="#discover">کتاب‌های بیشتر</a>
          </div>
          <div class="book-grid">${picks.map(p => bookCardHTML(p.book, '', p.reason)).join('')}</div>
        </section>

        <section class="section" aria-labelledby="features-title">
          <div class="section-head">
            <div><p class="eyebrow">قابلیت‌ها</p><h2 id="features-title">نقشهٔ امکانات کتابخانهٔ هوشمند</h2></div>
            <span class="muted small">${fa(featureCount)} امکان در ${fa(FEATURE_GROUPS.length)} گروه</span>
          </div>
          <div class="feature-groups">
            ${FEATURE_GROUPS.map(g => `
              <div class="feature-group">
                <h3>${icon(g.icon)} ${g.title}</h3>
                <ul>${g.items.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
              </div>`).join('')}
          </div>
        </section>
      </div>`;
  }
};

/* جست‌وجو از صفحهٔ اصلی: کلمه را به صفحهٔ کتاب‌ها می‌برد */
Forms['home-search'] = (values) => {
  booksFilter.q = String(values.q || '').trim();
  go('books');
};
