/* =========================================================
   پنل مدیریت — داشبورد آماری با نمودار، افزودن، ویرایش و حذف کتاب،
   مدیریت نظرها و پیام‌ها، فهرست اعضا و بازگردانی اطلاعات
   ========================================================= */

Pages.admin = {
  title: 'پنل مدیریت',
  render() {
    const user = currentUser();
    if (!isAdmin(user)) {
      return `
        <div class="wrap"><div class="empty">
          <p><b>این بخش فقط برای مدیر کتابخانه است.</b></p>
          <p>برای امتحان، با نام کاربری <code dir="ltr">admin</code> و رمز <code dir="ltr">1234</code> وارد شوید.</p>
          <a class="btn" href="#login">${icon('login')} ورود مدیر</a>
        </div></div>`;
    }
    const active = db.loans.filter(l => !l.returned);
    const late = active.filter(l => l.due < Date.now());
    const waiting = db.feedback.filter(f => f.status !== 'done');
    const comments = db.comments.slice().sort((a, b) => b.date - a.date).slice(0, 8);
    const messages = db.messages.slice().sort((a, b) => b.date - a.date);
    const weekMinutes = db.sessions.filter(s => s.date >= weekStart()).reduce((sum, s) => sum + s.minutes, 0);
    const stateLabel = { free: '<span class="stamp">آزاد</span>', loan: '<span class="stamp loan">در امانت</span>', reserved: '<span class="stamp reserved">رزرو</span>' };
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">پنل مدیریت</p>
          <h1>داشبورد کتابخانه</h1>
          <p class="lead">آمار و نمودارهای کتابخانه، افزودن و ویرایش و حذف کتاب‌ها، و مدیریت نظرها و پیام‌های اعضا.</p>
        </div>

        <div class="admin-stats">
          <div class="admin-stat"><b>${fa(db.books.length)}</b><span class="muted">کتاب</span></div>
          <div class="admin-stat"><b>${fa(db.books.filter(b => bookState(b.id).state === 'free').length)}</b><span class="muted">کتاب موجود</span></div>
          <div class="admin-stat"><b>${fa(db.users.filter(u => u.role === 'member').length)}</b><span class="muted">عضو</span></div>
          <div class="admin-stat"><b>${fa(active.length)}</b><span class="muted">امانت فعال</span></div>
          <div class="admin-stat"><b>${fa(late.length)}</b><span class="muted">دیرکرد</span></div>
          <div class="admin-stat"><b>${fa(weekMinutes)}</b><span class="muted">دقیقه مطالعه در این هفته</span></div>
        </div>

        <section class="dashboard" aria-label="نمودارها">
          <div class="panel"><h2>امانت در ۶ ماه اخیر</h2>${columnChartHTML({ data: loansPerMonth(6), unit: 'امانت', columnLabel: 'ماه' })}</div>
          <div class="panel"><h2>دقیقهٔ مطالعهٔ اعضا در ۸ هفتهٔ اخیر</h2>${columnChartHTML({ data: minutesPerWeek(8), unit: 'دقیقه', columnLabel: 'شروع هفته', labelEvery: 2 })}</div>
          <div class="panel"><h2>کتاب‌ها بر اساس دسته</h2>${barChartHTML({ data: booksByCategory(), unit: 'کتاب' })}</div>
          <div class="panel"><h2>پرامانت‌ترین کتاب‌ها</h2>${barChartHTML({ data: topBooksByLoans(5), unit: 'امانت', columnLabel: 'کتاب' })}</div>
          <div class="panel"><h2>اعضا بر اساس اشتراک</h2>${barChartHTML({ data: membersByPlan(), unit: 'عضو', columnLabel: 'اشتراک' })}</div>
          <div class="panel admin-links"><h2>میان‌برها</h2>
            <a class="btn btn-ghost" href="#librarian">${icon('idcard')} پنل کتابدار (امانت، رزرو، جریمه)</a>
            <a class="btn btn-ghost" href="#feedback">${icon('bulb')} نظرات و پیشنهادات (${fa(waiting.length)} در انتظار)</a>
            <a class="btn btn-ghost" href="#edit-new">${icon('plus')} افزودن کتاب تازه</a>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>کتاب‌ها</h2>
            <div class="toolbar-row">
              <div class="searchbar" style="margin:0;flex:0 1 280px">
                <div class="input-wrap">${icon('search')}<input id="admin-q" class="input" type="search" placeholder="فیلتر کتاب‌ها…" aria-label="فیلتر جدول کتاب‌ها"></div>
              </div>
              <a class="btn btn-sm" href="#edit-new">${icon('plus')} افزودن کتاب</a>
            </div>
          </div>
          <div class="table-wrap"><table class="table" id="admin-books">
            <thead><tr><th>کتاب</th><th>نویسنده/مؤلف</th><th>ژانر</th><th>وضعیت</th><th>بازدید</th><th>عملیات</th></tr></thead>
            <tbody>${db.books.slice().sort((a, b) => a.title.localeCompare(b.title, 'fa')).map(b => `
              <tr data-text="${esc(norm(b.title + ' ' + b.author + ' ' + b.category + ' ' + b.genre))}">
                <td><a href="#book-${b.id}">${esc(b.title)}</a>${b.featured ? ' <span class="chip-badge">ویژه</span>' : ''}${b.donatedBy ? ' <span class="chip-badge">اهدایی</span>' : ''}</td>
                <td>${esc(b.author)}</td>
                <td>${esc(b.genre)}</td>
                <td>${stateLabel[bookState(b.id).state]}</td>
                <td class="num">${fa(b.views)}</td>
                <td class="row-actions">
                  <a class="btn btn-sm btn-ghost" href="#edit-${b.id}">${icon('edit')} ویرایش</a>
                  <button class="btn btn-sm btn-ghost" type="button" data-action="feature" data-id="${b.id}">${b.featured ? 'برداشتن ویژه' : 'ویژه کردن'}</button>
                  <button class="btn btn-sm btn-danger" type="button" data-action="delete-book" data-id="${b.id}">${icon('trash')} حذف</button>
                </td>
              </tr>`).join('')}</tbody>
          </table></div>
        </section>

        <section class="section">
          <div class="section-head"><h2>آخرین نقد و نظرها</h2><a href="#feedback">مدیریت نظرات و پیشنهادات</a></div>
          ${comments.length ? `
            <div class="table-wrap"><table class="table">
              <thead><tr><th>کتاب</th><th>عضو</th><th>نظر</th><th>زمان</th><th>عملیات</th></tr></thead>
              <tbody>${comments.map(c => {
                const book = getBook(c.bookId);
                const member = getUser(c.userId);
                return `
                  <tr>
                    <td>${book ? `<a href="#book-${book.id}">${esc(book.title)}</a>` : '—'}</td>
                    <td>${member ? esc(member.name) : '—'}</td>
                    <td class="wrap-cell">${esc(c.text)}</td>
                    <td class="muted small">${timeAgo(c.date)}</td>
                    <td><button class="btn btn-sm btn-danger" type="button" data-action="delete-comment" data-id="${c.id}">حذف</button></td>
                  </tr>`;
              }).join('')}</tbody>
            </table></div>` : '<p class="empty">هنوز نظری ثبت نشده است.</p>'}
        </section>

        <section class="section">
          <h2 style="margin-bottom:14px">پیام‌های «ارتباط با ما»</h2>
          ${messages.length ? `<div class="fb-list">${messages.map(m => `
            <article class="fb-item">
              <div class="fb-top"><span class="fb-type">${esc(m.subject)}</span><b>${esc(m.name)}</b><span class="ltr small">${esc(m.contact)}</span><span class="muted small">${timeAgo(m.date)}</span></div>
              <p>${esc(m.text)}</p>
            </article>`).join('')}</div>` : '<p class="empty">هنوز پیامی نرسیده است. پیام‌هایی که از صفحهٔ «ارتباط با ما» فرستاده شوند اینجا دیده می‌شوند.</p>'}
        </section>

        <section class="section">
          <h2 style="margin-bottom:14px">اعضا</h2>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>نام</th><th>نام کاربری</th><th>نقش</th><th>اشتراک</th><th>امانت فعال</th><th>امتیاز باشگاه</th></tr></thead>
            <tbody>${db.users.map(u => `
              <tr>
                <td>${esc(u.name)}</td>
                <td class="ltr">${esc(u.username)}</td>
                <td>${u.role === 'admin' ? 'مدیر' : u.role === 'librarian' ? 'کتابدار' : 'عضو'}</td>
                <td>${planOf(u).name}</td>
                <td class="num">${fa(userLoans(u.id).length)}</td>
                <td class="num">${fa(userXP(u.id))}</td>
              </tr>`).join('')}</tbody>
          </table></div>
        </section>

        <section class="section">
          <div class="admin-note">
            <h3>بازگردانی اطلاعات نمونه</h3>
            <p>قبل از ارائهٔ پروژه می‌توانید همه‌چیز را به حالت اول برگردانید. کتاب‌های تازه، امانت‌ها، نظرها، امتیازها و حساب‌های تازه پاک می‌شوند.</p>
            <button class="btn btn-sm btn-danger" style="margin-top:10px" type="button" data-action="reset-data">${icon('undo')} بازگردانی اطلاعات</button>
          </div>
        </section>
      </div>`;
  },
  mount(root) {
    const input = root.querySelector('#admin-q');
    if (!input) return;
    input.addEventListener('input', () => {
      const words = norm(input.value).split(' ').filter(Boolean);
      root.querySelectorAll('#admin-books tbody tr').forEach(row => { row.hidden = !words.every(w => row.dataset.text.includes(w)); });
    });
  }
};

/* ---------- افزودن و ویرایش کتاب (#edit-new و #edit-12) ---------- */
Pages.edit = {
  title: 'ویرایش کتاب',
  render(param) {
    if (!isStaff(currentUser())) return `<div class="wrap"><div class="empty"><p>افزودن و ویرایش کتاب برای مدیر و کتابدار است.</p><a class="btn" href="#login">ورود</a></div></div>`;
    const book = param === 'new' ? null : getBook(param);
    if (param !== 'new' && !book) return `<div class="wrap"><div class="empty"><p>این کتاب پیدا نشد.</p><a class="btn" href="#admin">پنل مدیریت</a></div></div>`;
    this.title = book ? 'ویرایش «' + book.title + '»' : 'افزودن کتاب';
    const v = book || { title: '', author: '', category: '', genre: '', subjects: [], year: '', origin: '', ddc: '', description: '', summary: '', colors: DONATED_COVERS[0] };
    const options = (list, current, placeholder) => [{ value: '', label: placeholder, disabled: true }].concat(list.map(x => ({ value: x, label: x })));
    return `
      <div class="wrap">
        <nav class="breadcrumb" aria-label="مسیر"><a href="#admin">پنل مدیریت</a><span>/</span><span>${book ? 'ویرایش کتاب' : 'افزودن کتاب'}</span></nav>
        <div class="page-head"><h1>${book ? 'ویرایش «' + esc(book.title) + '»' : 'افزودن کتاب تازه'}</h1></div>
        <div class="edit-layout">
          <form class="form panel" data-form="save-book" data-id="${book ? book.id : ''}" novalidate>
            <div class="form-row">
              ${field({ id: 'ed-title', label: 'نام کتاب', name: 'title', required: true, min: 2, max: 80, value: v.title, error: 'نام کتاب را بنویسید.' })}
              ${field({ id: 'ed-author', label: 'نویسنده/مؤلف', name: 'author', required: true, min: 2, max: 60, value: v.author, error: 'نام نویسنده را بنویسید.' })}
            </div>
            <div class="form-row">
              ${field({ id: 'ed-cat', label: 'دسته', name: 'category', as: 'select', required: true, value: v.category, options: options(CATEGORIES, v.category, 'یک دسته انتخاب کنید'), error: 'دسته را انتخاب کنید.' })}
              ${field({ id: 'ed-genre', label: 'ژانر', name: 'genre', as: 'select', required: true, value: v.genre, options: options(GENRES, v.genre, 'یک ژانر انتخاب کنید'), error: 'ژانر را انتخاب کنید.' })}
            </div>
            ${field({ id: 'ed-subjects', label: 'موضوع‌ها', name: 'subjects', value: v.subjects.join('، '), hint: 'با ویرگول جدا کنید؛ مثلاً: دوستی، سفر' })}
            <div class="form-row">
              ${field({ id: 'ed-year', label: 'زمان نگارش', name: 'year', value: v.year === '—' ? '' : v.year, placeholder: 'مثلاً: ۱۳۴۸ ش' })}
              ${field({ id: 'ed-origin', label: 'زبان اصلی', name: 'origin', value: v.origin === '—' ? '' : v.origin, placeholder: 'مثلاً: ترجمه از انگلیسی' })}
            </div>
            ${field({ id: 'ed-ddc', label: 'شمارهٔ ردهٔ دیویی', name: 'ddc', value: v.ddc, dir: 'ltr', placeholder: '891.553' })}
            ${field({ id: 'ed-desc', label: 'توضیح کوتاه', name: 'description', as: 'textarea', max: 500, rows: 3, value: v.description })}
            ${field({ id: 'ed-summary', label: 'خلاصهٔ کامل (برای دستیار هوشمند)', name: 'summary', as: 'textarea', max: 900, rows: 4, value: v.summary })}
            <div class="book-actions">
              <button class="btn" type="submit">${icon('check')} ${book ? 'ذخیرهٔ تغییرها' : 'افزودن به کتابخانه'}</button>
              <a class="btn btn-ghost" href="${book ? '#book-' + book.id : '#admin'}">انصراف</a>
            </div>
          </form>
          <aside class="edit-preview">
            <p class="eyebrow">پیش‌نمایش جلد</p>
            <div id="cover-preview">${coverHTML(Object.assign({}, v, { title: v.title || 'نام کتاب', author: v.author || 'نویسنده' }))}</div>
          </aside>
        </div>
      </div>`;
  },
  mount(root, param) {
    const form = root.querySelector('[data-form="save-book"]');
    if (!form) return;
    const book = getBook(param);
    const colors = book ? book.colors : DONATED_COVERS[0];
    const update = () => {
      const title = form.querySelector('#ed-title').value.trim() || 'نام کتاب';
      const author = form.querySelector('#ed-author').value.trim() || 'نویسنده';
      root.querySelector('#cover-preview').innerHTML = coverHTML({ title, author, colors });
    };
    form.querySelector('#ed-title').addEventListener('input', update);
    form.querySelector('#ed-author').addEventListener('input', update);
  }
};
Forms['save-book'] = (values, form) => {
  if (!validateForm(form)) return;
  const result = saveBook(values, form.dataset.id ? Number(form.dataset.id) : null);
  if (notify(result)) go('book-' + result.book.id);
};

Actions['reset-data'] = () => {
  if (!isAdmin(currentUser())) return;
  askConfirm({
    title: 'بازگردانی اطلاعات نمونه',
    text: 'همهٔ تغییرها پاک می‌شود و کتابخانه به حالت اول برمی‌گردد. از حساب مدیر هم خارج می‌شوید.',
    yes: 'بله، بازگردانی شود',
    danger: true,
    onYes: () => {
      resetDB();
      lastGift = null;
      clearCompare();
      toast('اطلاعات به حالت اول برگشت.');
      go('home');
    }
  });
};
