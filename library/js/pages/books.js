/* =========================================================
   کتاب‌ها — فهرست کتاب‌ها، جست‌وجوی ساده و پیشرفته و صفحهٔ هر کتاب
   (امانت، رزرو آنلاین، صف انتظار، علاقه‌مندی، قفسهٔ شخصی، یادداشت، QR و ...)
   ========================================================= */

/* فیلترهای فعلی صفحهٔ کتاب‌ها (تا وقتی صفحه باز است یادش می‌ماند) */
const booksFilter = { q: '', category: 'all', genre: 'all', status: 'all', sort: 'new', title: '', author: '', subject: '', advanced: false };

Pages.books = {
  title: 'کتاب‌های موجود',
  render(param) {
    /* #books-free و #books-loan فیلتر وضعیت را از قبل انتخاب می‌کنند */
    if (['free', 'loan', 'reserved'].includes(param)) booksFilter.status = param;
    const option = (value, label, current) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`;
    const chip = (value, label) => `<button class="chip" type="button" data-cat="${esc(value)}" aria-pressed="${booksFilter.category === value}">${esc(label)}</button>`;
    const subjects = [...new Set(db.books.flatMap(b => b.subjects))].sort((a, b) => a.localeCompare(b, 'fa'));
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">قفسهٔ کتاب‌ها</p>
          <h1>کتاب‌های موجود</h1>
          <p class="lead">با کلمه‌های کلیدی جست‌وجو کنید، یا در «جست‌وجوی پیشرفته» نام، نویسنده، موضوع و ژانر را جدا بنویسید.</p>
        </div>
        <div class="toolbar" id="books-toolbar">
          <div class="toolbar-row">
            <form class="searchbar" role="search" data-form="books-search" novalidate>
              <div class="input-wrap">
                ${icon('search')}
                <input id="book-q" class="input" type="search" name="q" value="${esc(booksFilter.q)}"
                  placeholder="نام کتاب، نویسنده، موضوع، ژانر یا شمارهٔ رده…" aria-label="جست‌وجوی کتاب با کلمات کلیدی">
              </div>
            </form>
            <select id="book-status" class="select" aria-label="وضعیت کتاب">
              ${option('all', 'همهٔ وضعیت‌ها', booksFilter.status)}${option('free', 'فقط آزاد', booksFilter.status)}${option('loan', 'فقط در امانت', booksFilter.status)}${option('reserved', 'فقط رزرو شده', booksFilter.status)}
            </select>
            <select id="book-sort" class="select" aria-label="مرتب‌سازی">
              ${option('new', 'تازه‌ترین', booksFilter.sort)}${option('rating', 'بیشترین امتیاز', booksFilter.sort)}${option('views', 'پربازدیدترین', booksFilter.sort)}${option('popular', 'پرامانت‌ترین', booksFilter.sort)}${option('title', 'به ترتیب الفبا', booksFilter.sort)}
            </select>
          </div>
          <details class="advanced"${booksFilter.advanced ? ' open' : ''}>
            <summary>${icon('filter')} جست‌وجوی پیشرفته</summary>
            <div class="advanced-grid">
              <div class="field"><label for="adv-title">نام کتاب</label><input id="adv-title" class="input" data-adv="title" value="${esc(booksFilter.title)}" placeholder="مثلاً: شازده"></div>
              <div class="field"><label for="adv-author">نویسنده</label><input id="adv-author" class="input" data-adv="author" value="${esc(booksFilter.author)}" placeholder="مثلاً: هوگو"></div>
              <div class="field"><label for="adv-subject">موضوع</label><input id="adv-subject" class="input" data-adv="subject" list="subject-list" value="${esc(booksFilter.subject)}" placeholder="مثلاً: دوستی">
                <datalist id="subject-list">${subjects.map(s => `<option value="${esc(s)}"></option>`).join('')}</datalist></div>
              <div class="field"><label for="adv-genre">ژانر</label><select id="adv-genre" class="select" data-adv="genre">${option('all', 'همهٔ ژانرها', booksFilter.genre)}${GENRES.map(g => option(g, g, booksFilter.genre)).join('')}</select></div>
            </div>
            <button class="link-btn small" type="button" data-action="clear-filters">پاک کردن همهٔ فیلترها</button>
          </details>
          <div class="chips" role="group" aria-label="دسته‌بندی">
            ${chip('all', 'همهٔ دسته‌ها')}${CATEGORIES.map(c => chip(c, c)).join('')}
          </div>
        </div>
        <p class="result-count" id="result-count" aria-live="polite"></p>
        <div class="book-grid" id="book-grid"></div>
      </div>`;
  },
  mount(root) {
    const toolbar = root.querySelector('#books-toolbar');
    let timer;
    /* همهٔ جعبه‌های جست‌وجو با هم خوانده می‌شوند تا تغییری جا نماند */
    const syncFilters = () => {
      booksFilter.q = toolbar.querySelector('#book-q').value;
      toolbar.querySelectorAll('[data-adv]').forEach(el => { booksFilter[el.dataset.adv] = el.value; });
      renderBookList();
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(syncFilters, 150); };
    toolbar.querySelector('#book-q').addEventListener('input', later);
    toolbar.querySelectorAll('[data-adv]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', later));
    toolbar.querySelector('details.advanced').addEventListener('toggle', e => { booksFilter.advanced = e.target.open; });
    toolbar.querySelector('#book-status').addEventListener('change', e => { booksFilter.status = e.target.value; renderBookList(); });
    toolbar.querySelector('#book-sort').addEventListener('change', e => { booksFilter.sort = e.target.value; renderBookList(); });
    toolbar.querySelector('.chips').addEventListener('click', event => {
      const chip = event.target.closest('[data-cat]');
      if (!chip) return;
      booksFilter.category = chip.dataset.cat;
      toolbar.querySelectorAll('[data-cat]').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      renderBookList();
    });
    renderBookList();
  }
};

/* فقط فهرست کتاب‌ها را دوباره می‌سازد (تا تایپ در جعبهٔ جست‌وجو قطع نشود) */
function renderBookList() {
  const grid = document.getElementById('book-grid');
  if (!grid) return;
  const list = searchBooks(booksFilter);
  const q = booksFilter.q.trim();
  const highlightWords = [q, booksFilter.title, booksFilter.author].filter(Boolean).join(' ');
  document.getElementById('result-count').textContent = fa(list.length) + ' کتاب پیدا شد' + (q ? ' برای «' + q + '»' : '');
  grid.innerHTML = list.length ? list.map(b => bookCardHTML(b, highlightWords)).join('') : `
    <div class="empty" style="grid-column: 1 / -1">
      <p><b>کتابی با این مشخصات پیدا نشد.</b></p>
      <p>کلمهٔ دیگری امتحان کنید، از دستیار بپرسید، یا اگر این کتاب را لازم دارید به ما بگویید.</p>
      <div class="hero-actions" style="margin:0">
        <a class="btn btn-sm" href="#assistant">${icon('sparkles')} پرسیدن از دستیار</a>
        <a class="btn btn-sm btn-ghost" href="#feedback">پیشنهاد خرید کتاب</a>
      </div>
    </div>`;
}
Forms['books-search'] = (values) => { booksFilter.q = String(values.q || ''); renderBookList(); };
Actions['clear-filters'] = () => {
  Object.assign(booksFilter, { q: '', category: 'all', genre: 'all', status: 'all', title: '', author: '', subject: '' });
  refresh();
};
Actions['filter-category'] = (data) => { booksFilter.category = data.cat; booksFilter.q = ''; go('books'); };
Actions['filter-subject'] = (data) => {
  Object.assign(booksFilter, { q: '', category: 'all', genre: 'all', title: '', author: '', subject: data.subject, advanced: true });
  go('books');
};

/* ---------- صفحهٔ هر کتاب ---------- */
Pages.book = {
  title: 'صفحهٔ کتاب',
  render(param) {
    const book = getBook(param);
    if (!book) {
      return `<div class="wrap"><div class="empty"><p><b>این کتاب پیدا نشد.</b></p><p>شاید از کتابخانه حذف شده باشد.</p><a class="btn" href="#books">برگشت به کتاب‌ها</a></div></div>`;
    }
    addView(book.id);
    this.title = book.title;
    const user = currentUser();
    const r = rating(book);
    const myStars = user ? (book.ratings[user.id] || 0) : 0;
    const history = bookHistory(book.id);
    const comments = bookComments(book.id);
    const shelf = user ? shelfEntry(user.id, book.id) : null;
    const author = AUTHORS.find(a => a.id === book.authorId);

    /* برگهٔ تاریخ برگشت: آخرین امانت‌ها مثل مهرهای پشت کتاب */
    const slipRows = history.slice(0, 5).map(l => `<li><span>${faDateShort(l.start)}</span><span>${faDateShort(l.due)}</span></li>`);
    while (slipRows.length < 5) slipRows.push('<li><span></span><span></span></li>');

    return `
      <div class="wrap">
        <nav class="breadcrumb" aria-label="مسیر"><a href="#books">کتاب‌ها</a><span>/</span><a href="#books" data-action="filter-category" data-cat="${esc(book.category)}">${esc(book.category)}</a><span>/</span><span>${esc(book.title)}</span></nav>
        <div class="book-page">
          <aside class="book-side">
            ${coverHTML(book, 'cover-lg', 'book-cover')}
            <div class="qr-card">
              ${qrSVG(bookCode(book.id), 112)}
              <div><b>کد QR کتاب</b><p class="muted small">با «اسکن QR» این کد را بخوانید تا صفحهٔ کتاب باز شود.</p><p class="gift-code small">${bookCode(book.id)}</p>
              ${CAN_PRINT ? `<div class="hero-actions" style="margin:6px 0 0"><button class="link-btn small" type="button" data-action="download-qr" data-id="${book.id}">دانلود QR</button><button class="link-btn small" type="button" data-action="download-cover" data-id="${book.id}">ذخیرهٔ تصویر جلد</button></div>` : ''}</div>
            </div>
            <div class="due-slip">
              <p class="due-slip-head">برگهٔ تاریخ برگشت</p>
              <ol aria-label="تاریخ امانت و تاریخ برگشت">${slipRows.join('')}</ol>
            </div>
          </aside>
          <div class="book-info">
            <div>
              <p class="eyebrow">${esc(book.category)} · ${esc(book.genre)}${book.featured ? ' · <span class="chip-badge">ویژه</span>' : ''}</p>
              <h1>${esc(book.title)}</h1>
              <p class="byline">نویسنده/مؤلف: <b>${author ? `<a href="#author-${author.id}">${esc(book.author)}</a>` : esc(book.author)}</b></p>
            </div>

            <div class="rate-box">
              <span class="rating-big">${r.avg ? faDecimal(r.avg) : '—'}</span>
              <div>${starsHTML(r.avg, r.count)}<p class="muted small">میانگین امتیاز خوانندگان · ${icon('eye')} ${fa(book.views)} بازدید</p></div>
              <div>
                <p class="small">${user ? 'امتیاز شما:' : '<a href="#login">وارد شوید</a> تا امتیاز بدهید:'}</p>
                ${starInputHTML(book.id, myStars)}
              </div>
            </div>

            ${statusPanelHTML(book, user)}

            <div class="book-actions">
              ${favButtonHTML(book.id).replace('mini-btn', 'btn btn-ghost').replace('<span class="sr-only">علاقه‌مندی</span>', ' علاقه‌مندی')}
              ${compareButtonHTML(book.id).replace('mini-btn', 'btn btn-ghost').replace('<span class="sr-only">مقایسه</span>', ' مقایسه')}
              ${book.textId ? `<a class="btn btn-ghost" href="#read-${book.id}">${icon('book')} خواندن آنلاین</a>` : ''}
              <a class="btn btn-ghost" href="#read-${book.id}">${icon('headphones')} گوش دادن</a>
              <a class="btn btn-ghost" href="#assistant-${book.id}">${icon('sparkles')} از دستیار بپرس</a>
              <a class="btn btn-ghost" href="#gift-${book.id}">${icon('gift')} هدیه</a>
            </div>

            ${user ? `
              <div class="panel shelf-panel">
                <div class="field"><label for="my-shelf">قفسهٔ من</label>
                  <select id="my-shelf" class="select" data-shelf="${book.id}">
                    <option value=""${!shelf ? ' selected' : ''}>در قفسهٔ من نیست</option>
                    ${Object.keys(SHELF_NAMES).map(k => `<option value="${k}"${shelf && shelf.status === k ? ' selected' : ''}>${SHELF_NAMES[k]}</option>`).join('')}
                  </select></div>
                <div class="field"><label for="my-progress">پیشرفت مطالعه: <b id="progress-label">${fa(shelf ? shelf.progress : 0)}٪</b></label>
                  <input id="my-progress" type="range" min="0" max="100" step="5" value="${shelf ? shelf.progress : 0}" data-progress="${book.id}"></div>
              </div>` : ''}

            ${isStaff(user) ? `
              <div class="book-actions admin-actions">
                <a class="btn btn-sm btn-ghost" href="#edit-${book.id}">${icon('edit')} ویرایش</a>
                <button class="btn btn-sm btn-ghost" type="button" data-action="feature" data-id="${book.id}">${book.featured ? 'برداشتن از ویژه‌ها' : 'افزودن به ویژه‌ها'}</button>
                ${isAdmin(user) ? `<button class="btn btn-sm btn-danger" type="button" data-action="delete-book" data-id="${book.id}">${icon('trash')} حذف کتاب از کتابخانه</button>` : ''}
              </div>` : ''}

            <dl class="meta-list">
              <div><dt>نویسنده/مؤلف</dt><dd>${esc(book.author)}</dd></div>
              <div><dt>ژانر</dt><dd>${esc(book.genre)}</dd></div>
              <div><dt>دسته</dt><dd>${esc(book.category)}</dd></div>
              <div><dt>زمان نگارش</dt><dd>${esc(book.year)}</dd></div>
              <div><dt>زبان اصلی</dt><dd>${esc(book.origin)}</dd></div>
              <div><dt>ردهٔ دیویی</dt><dd class="num">${ddcFa(book.ddc)}</dd></div>
              <div><dt>دفعات امانت</dt><dd class="num">${fa(history.length)} بار</dd></div>
              <div><dt>${book.donatedBy ? 'اهدایی از' : 'ورود به کتابخانه'}</dt><dd>${book.donatedBy ? esc(book.donatedBy) : faDate(book.addedAt)}</dd></div>
            </dl>
            ${book.subjects.length ? `<div class="chips" aria-label="موضوع‌ها">${book.subjects.map(s => `<button class="chip" type="button" data-action="filter-subject" data-subject="${esc(s)}"># ${esc(s)}</button>`).join('')}</div>` : ''}

            <section>
              <h2>دربارهٔ کتاب</h2>
              <p class="prose">${esc(book.description)}</p>
              ${book.summary ? `<div class="summary-box"><p class="eyebrow">${icon('sparkles')} خلاصهٔ هوشمند</p><p class="prose">${esc(book.summary)}</p></div>` : ''}
            </section>

            ${user ? notesSectionHTML(book, user) : ''}

            <section class="comments" aria-labelledby="comments-title">
              <h2 id="comments-title">نقد و نظر خوانندگان <span class="muted">(${fa(comments.length)})</span></h2>
              ${user ? `
                <form class="form panel" data-form="comment" data-id="${book.id}" novalidate>
                  ${field({ id: 'comment-text', label: 'نقد و نظر شما دربارهٔ این کتاب', name: 'text', as: 'textarea', required: true, min: 3, max: 600, rows: 3, error: 'نظرتان را بنویسید (دست‌کم ۳ حرف).' })}
                  <div><button class="btn" type="submit">${icon('chat')} ثبت نقد و نظر</button></div>
                </form>` : `<p class="panel">برای نوشتن نقد و نظر <a href="#login">وارد حساب خود شوید</a>.</p>`}
              ${comments.map(c => commentHTML(c, user)).join('') || '<p class="muted">هنوز کسی دربارهٔ این کتاب نظر نداده است. اولین نفر باشید!</p>'}
            </section>
          </div>
        </div>
        ${similarBooks(book, 5).length ? `
          <section class="section">
            <div class="section-head"><h2>کتاب‌های مشابه</h2><span class="muted small">بر اساس ژانر، دسته و موضوع</span></div>
            <div class="book-grid">${similarBooks(book, 5).map(b => bookCardHTML(b)).join('')}</div>
          </section>` : ''}
      </div>`;
  },
  mount(root) {
    const shelf = root.querySelector('[data-shelf]');
    if (shelf) shelf.addEventListener('change', () => { notify(setShelf(currentUser(), shelf.dataset.shelf, shelf.value)); refresh(); });
    const progress = root.querySelector('[data-progress]');
    if (progress) {
      progress.addEventListener('input', () => { root.querySelector('#progress-label').textContent = fa(progress.value) + '٪'; });
      progress.addEventListener('change', () => { notify(setProgress(currentUser(), progress.dataset.progress, progress.value)); refresh(); });
    }
  }
};

/* جعبهٔ وضعیت کتاب: آزاد / رزرو / در امانت (مال خودتان یا دیگران) */
function statusPanelHTML(book, user) {
  const status = bookState(book.id);
  const plan = planOf(user);
  const queue = queueOf(book.id);
  const myPlace = user ? queuePosition(user.id, book.id) : 0;
  const queueLine = queue.length ? `<p class="small">صف انتظار: ${fa(queue.length)} نفر${myPlace ? ` · شما نفر ${fa(myPlace)} هستید` : ''}</p>` : '';
  const queueButton = myPlace
    ? `<button class="btn btn-ghost" type="button" data-action="queue-leave" data-id="${book.id}">خروج از صف</button>`
    : `<button class="btn" type="button" data-action="queue-join" data-id="${book.id}">${icon('users')} نوبت گرفتن</button>`;

  if (status.state === 'free') {
    return `
      <div class="status-panel">
        <div class="status-line"><span class="stamp">آزاد</span><b>این کتاب در قفسه است.</b></div>
        <p class="muted small">مهلت امانت با «${plan.name}»: ${fa(plan.loanDays)} روز · رزرو آنلاین تا ${fa(RESERVE_HOURS)} ساعت نگه داشته می‌شود.</p>
        <div class="book-actions">
          <button class="btn" type="button" data-action="borrow" data-id="${book.id}">${icon('book')} امانت گرفتن</button>
          <button class="btn btn-ghost" type="button" data-action="reserve" data-id="${book.id}">${icon('calendar')} رزرو آنلاین</button>
        </div>
      </div>`;
  }
  if (status.state === 'reserved') {
    const res = status.reservation;
    if (user && res.userId === user.id) {
      return `
        <div class="status-panel reserved">
          <div class="status-line"><span class="stamp reserved">رزرو شده</span><b>این کتاب برای شما کنار گذاشته شده.</b></div>
          <p>تا <b>${faDate(res.expires)}</b> (${fa(Math.max(0, Math.ceil((res.expires - Date.now()) / HOUR)))} ساعت دیگر) برای تحویل به میز امانت بیایید.</p>
          <div class="book-actions">
            <button class="btn" type="button" data-action="borrow" data-id="${book.id}">تحویل گرفتم، امانت شود</button>
            <button class="btn btn-ghost" type="button" data-action="cancel-reserve" data-id="${res.id}">لغو رزرو</button>
          </div>
        </div>`;
    }
    return `
      <div class="status-panel reserved">
        <div class="status-line"><span class="stamp reserved">رزرو شده</span><b>این کتاب برای یکی از اعضا رزرو شده است.</b></div>
        ${queueLine}<div class="book-actions">${user ? queueButton : '<a class="btn" href="#login">برای نوبت گرفتن وارد شوید</a>'}</div>
      </div>`;
  }
  const loan = status.loan;
  const left = daysLeft(loan.due);
  const when = left >= 0 ? `${fa(left)} روز دیگر` : `${fa(-left)} روز دیرکرد`;
  if (user && loan.userId === user.id) {
    return `
      <div class="status-panel loan">
        <div class="status-line"><span class="stamp loan">در امانت</span><b>این کتاب دست شماست.</b></div>
        <p>مهلت پس دادن: <b>${faDate(loan.due)}</b> (<span class="days-left${left < 0 ? ' late' : ''}">${when}</span>)</p>
        ${left < 0 ? `<p class="small">جریمهٔ دیرکرد تا امروز: <b>${faPrice(fineOf(loan))} تومان</b> (روزی ${faPrice(FINE_PER_DAY)} تومان)</p>` : ''}
        <div><button class="btn btn-ghost" type="button" data-action="return" data-id="${loan.id}">${icon('undo')} پس دادن کتاب</button></div>
      </div>`;
  }
  return `
    <div class="status-panel loan">
      <div class="status-line"><span class="stamp loan">در امانت</span><b>این کتاب الان در امانت یکی از اعضاست.</b></div>
      <p>تاریخ برگشت: <b>${faDate(loan.due)}</b>${left < 0 ? ' — با تأخیر؛ به‌زودی برمی‌گردد' : ''}</p>
      ${queueLine}<div class="book-actions">${user ? queueButton : '<a class="btn" href="#login">برای نوبت گرفتن وارد شوید</a>'}</div>
    </div>`;
}

function notesSectionHTML(book, user) {
  const notes = userNotes(user.id, book.id);
  return `
    <section class="notes" aria-labelledby="notes-title">
      <h2 id="notes-title">یادداشت‌های من <span class="muted small">(فقط خودتان می‌بینید)</span></h2>
      <form class="note-form" data-form="note" data-id="${book.id}" novalidate>
        <label class="sr-only" for="note-text">یادداشت تازه</label>
        <input id="note-text" class="input" name="text" maxlength="300" placeholder="مثلاً: فصل سوم را برای کنفرانس کلاس خلاصه کنم">
        <button class="btn" type="submit">${icon('pen')} ذخیره</button>
      </form>
      ${notes.length ? `<ul class="note-list">${notes.map(n => `
        <li><p>${esc(n.text)}</p><span class="muted small">${timeAgo(n.date)}</span>
          <button class="link-btn small" type="button" data-action="note-delete" data-id="${n.id}">حذف</button></li>`).join('')}</ul>` : '<p class="muted small">هنوز یادداشتی ننوشته‌اید.</p>'}
    </section>`;
}

function commentHTML(comment, user) {
  const author = getUser(comment.userId);
  const name = author ? author.name : 'عضو کتابخانه';
  const book = getBook(comment.bookId);
  const stars = book && author && book.ratings[author.id];
  return `
    <article class="comment">
      <span class="avatar" aria-hidden="true">${esc(name.charAt(0))}</span>
      <div>
        <div class="comment-head">
          <b>${esc(name)}</b>
          ${stars ? starsHTML(stars) : ''}
          <span class="muted small">${timeAgo(comment.date)}</span>
          ${isAdmin(user) ? `<button class="link-btn small" type="button" data-action="delete-comment" data-id="${comment.id}">حذف نظر</button>` : ''}
        </div>
        <p>${esc(comment.text)}</p>
      </div>
    </article>`;
}

/* ---------- کار دکمه‌ها ---------- */
const needUser = message => { const user = currentUser(); if (!user) requireLogin(message); return user; };

Actions['borrow'] = (data) => { const user = needUser('برای امانت گرفتن، اول وارد حساب خود شوید.'); if (user) { notify(borrowBook(user, data.id)); refresh(); } };
Actions['reserve'] = (data) => { const user = needUser('برای رزرو، اول وارد حساب خود شوید.'); if (user) { notify(reserveBook(user, data.id)); refresh(); } };
Actions['cancel-reserve'] = (data) => {
  askConfirm({ title: 'لغو رزرو', text: 'رزرو این کتاب لغو شود؟', yes: 'بله، لغو شود', onYes: () => { notify(cancelReservation(data.id, isStaff(currentUser()) && currentRoute().name === 'librarian')); refresh(); } });
};
Actions['queue-join'] = (data) => { const user = needUser('برای نوبت گرفتن، اول وارد حساب خود شوید.'); if (user) { notify(joinQueue(user, data.id)); refresh(); } };
Actions['queue-leave'] = (data) => { const user = currentUser(); if (user) { notify(leaveQueue(user.id, Number(data.id))); refresh(); } };
Actions['return'] = (data) => {
  askConfirm({
    title: 'پس دادن کتاب',
    text: 'کتاب به میز امانت تحویل داده شد؟ با تأیید، وضعیت کتاب عوض می‌شود و اگر تأخیر داشته باشد جریمه ثبت می‌شود.',
    yes: 'بله، تحویل داده شد',
    onYes: () => { notify(returnBook(data.id)); refresh(); }
  });
};
Actions['rate'] = (data) => { const user = needUser('برای امتیاز دادن، اول وارد حساب خود شوید.'); if (user) { notify(rateBook(user, data.id, data.stars)); refresh(); } };
Actions['fav'] = (data) => { const user = needUser('برای افزودن به علاقه‌مندی‌ها، اول وارد حساب خود شوید.'); if (user) { notify(toggleFavorite(user, data.id)); refresh(); } };
Actions['compare'] = (data) => { notify(toggleCompare(data.id)); refresh(); };
Actions['note-delete'] = (data) => { notify(deleteNote(data.id)); refresh(); };
Actions['feature'] = (data) => { if (isStaff(currentUser())) { notify(toggleFeatured(data.id)); refresh(); } };
Actions['download-qr'] = (data) => downloadCanvas(qrCanvas(bookCode(data.id), 10), 'qr-book-' + data.id + '.png');
Actions['download-cover'] = (data) => { const book = getBook(data.id); if (book) downloadCanvas(coverCanvas(book, 480, 720), 'cover-book-' + book.id + '.png'); };
Actions['delete-book'] = (data) => {
  const book = getBook(data.id);
  if (!book || !isAdmin(currentUser())) return;
  askConfirm({
    title: 'حذف کتاب از کتابخانه',
    text: `«${esc(book.title)}» و همهٔ نظرها، رزروها و یادداشت‌هایش برای همیشه حذف می‌شود. مطمئن هستید؟`,
    yes: 'بله، حذف شود',
    danger: true,
    onYes: () => { if (notify(deleteBook(book.id)) && currentRoute().name === 'book') go('books'); else refresh(); }
  });
};
Actions['delete-comment'] = (data) => {
  if (!isAdmin(currentUser())) return;
  askConfirm({ title: 'حذف نظر', text: 'این نظر حذف شود؟', yes: 'حذف', danger: true, onYes: () => { notify(deleteComment(data.id)); refresh(); } });
};
Forms['comment'] = (values, form) => {
  if (!validateForm(form)) return;
  if (notify(addComment(currentUser(), form.dataset.id, values.text))) refresh();
};
Forms['note'] = (values, form) => { if (notify(addNote(currentUser(), form.dataset.id, values.text))) refresh(); };
