/* =========================================================
   کشف کتاب — کتاب هفته، ویژه‌ها، پربازدیدترین و محبوب‌ترین‌ها،
   پیشنهاد هوشمند، مرور ژانرها، کتاب تصادفی و مقایسهٔ کتاب‌ها
   ========================================================= */

Pages.discover = {
  title: 'کشف کتاب',
  render() {
    const user = currentUser();
    const week = bookOfWeek();
    const featured = db.books.filter(b => b.featured);
    const byViews = db.books.slice().sort((a, b) => b.views - a.views).slice(0, 5);
    const byRating = db.books.slice().sort((a, b) => rating(b).avg - rating(a).avg).slice(0, 5);
    const byLoans = db.books.slice().sort((a, b) => bookHistory(b.id).length - bookHistory(a.id).length).slice(0, 5);
    const picks = recommendFor(user, 5);
    const ranked = (list, value) => `<ol class="rank-list">${list.map((b, i) => `
      <li><span class="rank">${fa(i + 1)}</span><a href="#book-${b.id}">${esc(b.title)}</a><span class="muted small">${value(b)}</span></li>`).join('')}</ol>`;
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">کشف کتاب</p>
          <h1>کتاب بعدی‌تان را پیدا کنید</h1>
          <p class="lead">کتاب این هفته، کتاب‌های ویژه، پربازدیدترین‌ها و پیشنهادهایی که از روی سلیقهٔ خودتان ساخته شده‌اند.</p>
        </div>

        ${week ? `
        <section class="week-band">
          <div class="week-cover">${coverHTML(week)}</div>
          <div class="week-text">
            <p class="eyebrow">کتاب این هفته</p>
            <h2>${esc(week.title)}</h2>
            <p class="byline">${esc(week.author)} · ${esc(week.genre)} · ${esc(week.year)}</p>
            <p class="prose">${esc(week.summary || week.description)}</p>
            <div class="hero-actions">
              <a class="btn" href="#book-${week.id}">دیدن کتاب</a>
              <button class="btn btn-gold" type="button" data-action="random-book">${icon('shuffle')} پیشنهاد کتاب تصادفی</button>
            </div>
          </div>
        </section>` : ''}

        <section class="section">
          <div class="section-head"><div><p class="eyebrow">${icon('sparkles')} پیشنهاد هوشمند</p><h2>${user ? 'بر اساس سلیقهٔ شما' : 'برای شروع'}</h2></div>
            ${user ? '<a href="#account">تنظیم ژانرهای مورد علاقه</a>' : '<a href="#login">ورود برای پیشنهاد شخصی</a>'}</div>
          <div class="book-grid">${picks.map(p => bookCardHTML(p.book, '', p.reason)).join('')}</div>
        </section>

        ${featured.length ? `
        <section class="section">
          <div class="section-head"><div><p class="eyebrow">انتخاب کتابدار</p><h2>کتاب‌های ویژه</h2></div></div>
          <div class="book-grid">${featured.map(b => bookCardHTML(b)).join('')}</div>
        </section>` : ''}

        <section class="section rank-grid">
          <div class="panel"><h3>${icon('eye')} پربازدیدترین</h3>${ranked(byViews, b => fa(b.views) + ' بازدید')}</div>
          <div class="panel"><h3>${icon('award')} محبوب‌ترین</h3>${ranked(byRating, b => faDecimal(rating(b).avg) + ' از ۵')}</div>
          <div class="panel"><h3>${icon('book')} پرامانت‌ترین</h3>${ranked(byLoans, b => fa(bookHistory(b.id).length) + ' امانت')}</div>
        </section>

        <section class="section">
          <h2 style="margin-bottom:14px">مرور بر اساس ژانر</h2>
          <div class="genre-grid">${GENRES.map(g => {
            const count = db.books.filter(b => b.genre === g).length;
            return count ? `<button class="genre-tile" type="button" data-action="filter-genre" data-genre="${esc(g)}"><b>${esc(g)}</b><span class="muted small">${fa(count)} کتاب</span></button>` : '';
          }).join('')}</div>
        </section>
      </div>`;
  }
};
Actions['filter-genre'] = (data) => {
  Object.assign(booksFilter, { q: '', category: 'all', title: '', author: '', subject: '', genre: data.genre, advanced: true });
  go('books');
};

/* ---------- کتاب تصادفی (با انیمیشن بُر زدن) ---------- */
Actions['random-book'] = () => {
  const book = db.books[Math.floor(Math.random() * db.books.length)];
  const deck = [0, 1, 2].map(() => db.books[Math.floor(Math.random() * db.books.length)]);
  openModal(modalBox('کتاب تصادفی شما', `
    <div class="shuffle-deck" aria-hidden="true">${deck.map(b => coverHTML(b)).join('')}</div>
    <div class="random-result" hidden>
      <div class="random-book">${coverHTML(book)}<div><h3>${esc(book.title)}</h3><p class="muted">${esc(book.author)} · ${esc(book.genre)}</p><p class="small">${esc(book.description)}</p></div></div>
    </div>`,
    `<a class="btn" href="#book-${book.id}" data-action="close-modal-go">دیدن کتاب</a><button class="btn btn-ghost" type="button" data-action="random-book">${icon('shuffle')} یکی دیگر</button>`));
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    const deckEl = document.querySelector('#modal .shuffle-deck');
    const result = document.querySelector('#modal .random-result');
    if (deckEl) deckEl.hidden = true;
    if (result) result.hidden = false;
  }, reduce ? 0 : 900);
};

/* ---------- مقایسهٔ کتاب‌ها ---------- */
Pages.compare = {
  title: 'مقایسهٔ کتاب‌ها',
  render() {
    const books = compareIds().map(getBook).filter(Boolean);
    const others = db.books.filter(b => !books.includes(b)).sort((a, b) => a.title.localeCompare(b.title, 'fa'));
    const best = (fn) => { const values = books.map(fn); const max = Math.max(...values); return values.map(v => v === max && books.length > 1); };
    const ratings = books.map(b => rating(b));
    const bestRating = best(b => rating(b).avg);
    const bestLoans = best(b => bookHistory(b.id).length);
    const bestViews = best(b => b.views);
    const row = (label, cells) => `<tr><th scope="row">${label}</th>${cells.join('')}</tr>`;
    const stateLabel = { free: 'آزاد', loan: 'در امانت', reserved: 'رزرو شده' };
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">مقایسهٔ کتاب‌ها</p>
          <h1>کدام را بخوانم؟</h1>
          <p class="lead">تا ۴ کتاب را کنار هم ببینید. با دکمهٔ ${icon('columns')} روی هر کتاب، آن را به مقایسه اضافه کنید.</p>
        </div>
        <form class="toolbar-row" data-form="compare-add" style="margin-bottom:18px" novalidate>
          <label class="sr-only" for="compare-pick">افزودن کتاب به مقایسه</label>
          <select id="compare-pick" class="select" name="bookId" style="width:auto;min-width:220px"${books.length >= 4 ? ' disabled' : ''}>
            ${others.map(b => `<option value="${b.id}">${esc(b.title)}</option>`).join('')}
          </select>
          <button class="btn" type="submit"${books.length >= 4 ? ' disabled' : ''}>${icon('plus')} افزودن به مقایسه</button>
          ${books.length ? '<button class="btn btn-ghost" type="button" data-action="compare-clear">پاک کردن مقایسه</button>' : ''}
        </form>
        ${books.length < 2 ? `<div class="empty"><p>${books.length ? 'یک کتاب دیگر اضافه کنید تا مقایسه شروع شود.' : 'هنوز کتابی برای مقایسه انتخاب نکرده‌اید.'}</p><a class="btn btn-sm" href="#books">رفتن به کتاب‌ها</a></div>` : ''}
        ${books.length ? `
        <div class="table-wrap"><table class="table compare-table">
          <thead><tr><th></th>${books.map(b => `<th scope="col"><a class="compare-head" href="#book-${b.id}">${coverHTML(b)}<span>${esc(b.title)}</span></a></th>`).join('')}</tr></thead>
          <tbody>
            ${row('نویسنده', books.map(b => `<td>${esc(b.author)}</td>`))}
            ${row('ژانر', books.map(b => `<td>${esc(b.genre)}</td>`))}
            ${row('دسته', books.map(b => `<td>${esc(b.category)}</td>`))}
            ${row('زمان نگارش', books.map(b => `<td>${esc(b.year)}</td>`))}
            ${row('میانگین امتیاز', books.map((b, i) => `<td class="num${bestRating[i] ? ' best' : ''}">${faDecimal(ratings[i].avg)} از ۵ <span class="muted small">(${fa(ratings[i].count)} رأی)</span></td>`))}
            ${row('دفعات امانت', books.map((b, i) => `<td class="num${bestLoans[i] ? ' best' : ''}">${fa(bookHistory(b.id).length)}</td>`))}
            ${row('بازدید', books.map((b, i) => `<td class="num${bestViews[i] ? ' best' : ''}">${fa(b.views)}</td>`))}
            ${row('وضعیت', books.map(b => `<td>${stateLabel[bookState(b.id).state]}</td>`))}
            ${row('موضوع‌ها', books.map(b => `<td class="wrap-cell">${b.subjects.map(esc).join('، ') || '—'}</td>`))}
            ${row('', books.map(b => `<td><button class="link-btn small" type="button" data-action="compare" data-id="${b.id}">برداشتن</button></td>`))}
          </tbody>
        </table></div>
        <p class="muted small" style="margin-top:10px">خانه‌های پررنگ، بهترین مقدار هر ردیف را نشان می‌دهند.</p>` : ''}
      </div>`;
  }
};
Forms['compare-add'] = (values) => { notify(toggleCompare(values.bookId)); refresh(); };
Actions['compare-clear'] = () => { clearCompare(); refresh(); };
