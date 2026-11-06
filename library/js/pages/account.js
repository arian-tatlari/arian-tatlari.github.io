/* =========================================================
   عضویت، ثبت‌نام و ورود — و پروفایل اختصاصی «حساب من»
   (امانت‌ها، رزروها، صف‌ها، جریمه، علاقه‌مندی‌ها، تاریخچه، سلیقه و اعلان‌ها)
   ========================================================= */

Pages.account = {
  title: 'عضویت، ثبت‌نام و ورود',
  render(param) {
    const user = currentUser();
    return user ? profileHTML(user) : authHTML(param === 'register' ? 'register' : 'login');
  }
};
/* #login و #register همان صفحه را با زبانهٔ مناسب باز می‌کنند */
Pages.login = { title: 'ورود', render: () => Pages.account.render('login') };
Pages.register = { title: 'ثبت‌نام', render: () => Pages.account.render('register') };

function genreChecks(selected) {
  return `<fieldset class="genre-checks"><legend class="field-label">ژانرهای مورد علاقه (برای پیشنهاد هوشمند)</legend>
    ${GENRES.map(g => `<label class="check-chip"><input type="checkbox" name="genre" value="${esc(g)}"${selected.includes(g) ? ' checked' : ''}><span>${esc(g)}</span></label>`).join('')}</fieldset>`;
}

function authHTML(tab) {
  const isLogin = tab === 'login';
  return `
    <div class="wrap">
      <div class="two-col">
        <div>
          <div class="page-head">
            <p class="eyebrow">عضویت، ثبت‌نام و ورود</p>
            <h1>${isLogin ? 'ورود به حساب' : 'عضو کتابخانه شوید'}</h1>
            <p class="lead">${isLogin ? 'وارد شوید تا کتاب امانت یا رزرو کنید، امتیاز بگیرید و پیشنهادهای مخصوص خودتان را ببینید.' : 'عضویت رایگان است و همین حالا فعال می‌شود. ژانرهای مورد علاقه‌تان را هم انتخاب کنید تا پیشنهادهای هوشمند دقیق‌تر شوند.'}</p>
          </div>
          <div class="tabs" role="tablist">
            <a class="tab" role="tab" href="#login" aria-selected="${isLogin}">ورود</a>
            <a class="tab" role="tab" href="#register" aria-selected="${!isLogin}">ثبت‌نام</a>
          </div>
          <div class="panel">
            ${isLogin ? `
              <form class="form" data-form="login" novalidate>
                ${field({ id: 'login-user', label: 'نام کاربری', name: 'username', required: true, dir: 'ltr', autocomplete: 'username', error: 'نام کاربری را بنویسید.' })}
                ${field({ id: 'login-pass', label: 'رمز عبور', name: 'password', type: 'password', required: true, dir: 'ltr', autocomplete: 'current-password', error: 'رمز عبور را بنویسید.' })}
                <button class="btn btn-block" type="submit">${icon('login')} ورود</button>
                <p class="form-note">برای امتحان (رمز همه <code>1234</code>): عضو <code>sara</code> · کتابدار <code>librarian</code> · مدیر <code>admin</code></p>
              </form>` : `
              <form class="form" data-form="register" novalidate>
                ${field({ id: 'reg-name', label: 'نام و نام خانوادگی', name: 'name', required: true, min: 3, max: 40, autocomplete: 'name', error: 'نام و نام خانوادگی را کامل بنویسید.' })}
                ${field({ id: 'reg-user', label: 'نام کاربری', name: 'username', required: true, dir: 'ltr', pattern: '[A-Za-z0-9_]{3,20}', autocomplete: 'username', hint: '۳ تا ۲۰ حرف انگلیسی یا عدد؛ مثل reza_2010', error: 'فقط حرف انگلیسی، عدد و _ (۳ تا ۲۰ حرف).' })}
                <div class="form-row">
                  ${field({ id: 'reg-pass', label: 'رمز عبور', name: 'password', type: 'password', required: true, min: 4, dir: 'ltr', autocomplete: 'new-password', error: 'رمز باید دست‌کم ۴ حرف باشد.' })}
                  ${field({ id: 'reg-pass2', label: 'تکرار رمز عبور', name: 'password2', type: 'password', required: true, min: 4, dir: 'ltr', autocomplete: 'new-password', error: 'تکرار رمز را بنویسید.' })}
                </div>
                ${genreChecks([])}
                <button class="btn btn-block" type="submit">${icon('user')} ساخت حساب و عضویت رایگان</button>
              </form>`}
          </div>
        </div>
        <aside class="panel">
          <h2>با عضویت چه کارهایی می‌توانید بکنید؟</h2>
          <ul class="install-steps">
            <li>کتاب امانت یا رزرو آنلاین کنید و برای کتاب‌های در امانت نوبت بگیرید.</li>
            <li>زمان مطالعه را با تایمر ثبت کنید و پیشرفتتان را در نمودار ببینید.</li>
            <li>امتیاز و نشان افتخار بگیرید و مأموریت‌های هفتگی را انجام دهید.</li>
            <li>قفسهٔ مجازی، علاقه‌مندی‌ها و یادداشت‌های شخصی خودتان را داشته باشید.</li>
          </ul>
        </aside>
      </div>
    </div>`;
}

function profileHTML(user) {
  const plan = planOf(user);
  const loans = userLoans(user.id);
  const reservations = userReservations(user.id);
  const queues = db.queue.filter(q => q.userId === user.id);
  const fines = db.loans.filter(l => l.userId === user.id && l.returned && l.fine && !l.finePaid);
  const history = userHistory(user.id);
  const readShelf = userShelf(user.id, 'read');
  const favorites = userFavorites(user.id);
  const xp = userXP(user.id);
  const level = levelOf(xp);
  const notifEnabled = window.Notification && Notification.permission === 'granted';
  const bookTitle = id => { const b = getBook(id); return b ? `<a href="#book-${b.id}">${esc(b.title)}</a>` : 'کتاب حذف‌شده'; };
  return `
    <div class="wrap">
      <div class="page-head">
        <p class="eyebrow">پروفایل من</p>
        <h1>سلام ${esc(user.name)}!</h1>
        <p class="lead">امانت‌ها، رزروها، علاقه‌مندی‌ها، تاریخچهٔ مطالعه و تنظیمات شما.</p>
      </div>
      <div class="two-col">
        <div style="display:grid;gap:28px;min-width:0">
          ${fines.length ? `
            <section class="fine-box" aria-labelledby="fine-title">
              <h2 id="fine-title">${icon('info')} جریمهٔ دیرکرد پرداخت‌نشده: ${faPrice(unpaidFineTotal(user.id))} تومان</h2>
              <p class="small">تا جریمه پرداخت نشود، امانت و رزرو تازه ممکن نیست.</p>
              <ul>${fines.map(l => `<li>${bookTitle(l.bookId)} · ${fa(lateDays(l))} روز تأخیر · ${faPrice(l.fine)} تومان
                <button class="btn btn-sm btn-gold" type="button" data-action="pay-fine" data-id="${l.id}">پرداخت (نمایشی)</button></li>`).join('')}</ul>
            </section>` : ''}
          <section>
            <div class="section-head"><h2>کتاب‌های امانت من</h2><span class="muted num">${fa(loans.length + reservations.length)} از ${fa(plan.maxLoans)}</span></div>
            <div class="loan-list">
              ${loans.length ? loans.map(loanRowHTML).join('') : `<div class="empty"><p>الان کتابی امانت نگرفته‌اید.</p><a class="btn btn-sm" href="#books-free">دیدن کتاب‌های آزاد</a></div>`}
            </div>
          </section>
          ${reservations.length || queues.length ? `
            <section>
              <h2 style="margin-bottom:14px">رزروها و صف‌های من</h2>
              <ul class="plain-list">
                ${reservations.map(r => `<li>${icon('calendar')} ${bookTitle(r.bookId)} برای شما رزرو شده · تا ${faDate(r.expires)} تحویل بگیرید
                  <button class="link-btn small" type="button" data-action="cancel-reserve" data-id="${r.id}">لغو رزرو</button></li>`).join('')}
                ${queues.map(q => `<li>${icon('users')} ${bookTitle(q.bookId)} · نفر ${fa(queuePosition(user.id, q.bookId))} صف
                  <button class="link-btn small" type="button" data-action="queue-leave" data-id="${q.bookId}">خروج از صف</button></li>`).join('')}
              </ul>
            </section>` : ''}
          <section>
            <div class="section-head"><h2>${icon('heart')} علاقه‌مندی‌ها</h2><a href="#shelf">قفسهٔ من</a></div>
            ${favorites.length ? `<div class="book-grid">${favorites.slice(0, 6).map(b => bookCardHTML(b)).join('')}</div>` : '<p class="muted">هنوز کتابی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>'}
          </section>
          <section>
            <h2 style="margin-bottom:14px">تاریخچهٔ مطالعه</h2>
            ${readShelf.length || history.length ? `
              <div class="table-wrap"><table class="table">
                <thead><tr><th>کتاب</th><th>نوع</th><th>تاریخ</th></tr></thead>
                <tbody>${readShelf.map(s => `<tr><td>${bookTitle(s.bookId)}</td><td>خوانده‌ام</td><td class="num">${faDateShort(s.updated)}</td></tr>`).join('')}
                ${history.map(l => `<tr><td>${bookTitle(l.bookId)}</td><td>امانت${l.fine ? ' (با تأخیر)' : ''}</td><td class="num">${faDateShort(l.start)} تا ${faDateShort(l.returned)}</td></tr>`).join('')}</tbody>
              </table></div>` : '<p class="muted">هنوز کتابی نخوانده یا پس نداده‌اید.</p>'}
          </section>
        </div>
        <aside style="display:grid;gap:18px;align-content:start;min-width:0">
          <div class="member-card">
            <div class="mc-top"><span>کارت عضویت کتابخانهٔ من</span>${icon('library')}</div>
            <div class="mc-name">${esc(user.name)}</div>
            <div class="mc-no">${memberNo(user)}</div>
            <div class="mc-top">
              <span class="mc-plan">${plan.name}</span>
              <span class="small">${plan.id === 'free' ? 'بدون تاریخ انقضا' : 'تا ' + faDate(user.planUntil)}</span>
            </div>
          </div>
          <a class="panel level-mini" href="#club">
            <span class="level-badge small-badge" aria-hidden="true"><span>${fa(level.number)}</span></span>
            <span><b>${esc(level.name)}</b><br><span class="muted small">${fa(xp)} امتیاز · ${fa(userBadges(user.id).length)} نشان</span></span>
          </a>
          <div class="panel">
            <h3>اشتراک شما</h3>
            <p>${fa(plan.maxLoans)} کتاب هم‌زمان · مهلت ${fa(plan.loanDays)} روز</p>
            <p class="muted small">عضو از ${faDate(user.joinedAt)}</p>
            <div class="hero-actions" style="margin-top:14px">
              <a class="btn btn-sm btn-gold" href="#app">${plan.id === 'free' ? 'خرید اشتراک' : 'تمدید یا ارتقای اشتراک'}</a>
              ${isStaff(user) ? `<a class="btn btn-sm" href="#librarian">${icon('idcard')} پنل کتابدار</a>` : ''}
              ${isAdmin(user) ? `<a class="btn btn-sm" href="#admin">${icon('shield')} پنل مدیریت</a>` : ''}
            </div>
          </div>
          <form class="panel" data-form="prefs" novalidate>
            ${genreChecks(user.prefs && user.prefs.genres || [])}
            <button class="btn btn-sm" type="submit" style="margin-top:10px">ذخیرهٔ سلیقه</button>
          </form>
          <div class="panel">
            <h3>${icon('bell')} اعلان‌ها</h3>
            <p class="small">${fa(unreadCount(user.id))} اعلان خوانده‌نشده · <a href="#notifications">همهٔ اعلان‌ها</a></p>
            ${window.Notification ? (notifEnabled ? '<p class="muted small">اعلان‌های مرورگر روشن است.</p>' : '<button class="btn btn-sm btn-ghost" type="button" data-action="enable-notifications">روشن کردن اعلان مرورگر</button>') : ''}
          </div>
          <button class="btn btn-ghost" type="button" data-action="logout">${icon('logout')} خروج از حساب</button>
        </aside>
      </div>
    </div>`;
}

function loanRowHTML(loan) {
  const book = getBook(loan.bookId);
  if (!book) return '';
  const left = daysLeft(loan.due);
  return `
    <div class="loan-row">
      ${coverHTML(book)}
      <div>
        <a href="#book-${book.id}"><b>${esc(book.title)}</b></a>
        <p class="small muted">مهلت: ${faDate(loan.due)}</p>
        <p class="small days-left${left < 0 ? ' late' : ''}">${left >= 0 ? fa(left) + ' روز مانده' : fa(-left) + ' روز دیرکرد · جریمه تا امروز ' + faPrice(fineOf(loan)) + ' تومان'}</p>
      </div>
      <button class="btn btn-sm btn-ghost" type="button" data-action="return" data-id="${loan.id}">پس دادن</button>
    </div>`;
}

/* ---------- صفحهٔ اعلان‌ها ---------- */
const NOTIF_ICONS = { due: 'clock', late: 'info', fine: 'info', reserve: 'calendar', queue: 'users', badge: 'award', welcome: 'sparkles' };
Pages.notifications = {
  title: 'اعلان‌ها',
  render() {
    const user = currentUser();
    if (!user) return `<div class="wrap"><div class="empty"><p>برای دیدن اعلان‌ها وارد شوید.</p><a class="btn" href="#login">ورود</a></div></div>`;
    const list = userNotifications(user.id);
    return `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">اعلان‌ها</p><h1>خبرهای شما</h1>
          <p class="lead">یادآوری زمان برگشت کتاب، تأیید رزرو، رسیدن نوبت صف، جریمه و نشان‌های تازه.</p></div>
        ${list.length ? `<button class="btn btn-sm btn-ghost" type="button" data-action="read-all" style="margin-bottom:14px">همه را خوانده‌شده کن</button>
          <ul class="notif-list">${list.map(n => `<li class="${n.read ? '' : 'unread'}">${icon(NOTIF_ICONS[n.type] || 'bell')}<span><span>${esc(n.text)}</span><br><span class="muted small">${timeAgo(n.date)}</span></span></li>`).join('')}</ul>` : '<p class="empty">اعلانی ندارید.</p>'}
      </div>`;
  }
};

/* ---------- فرم‌ها و دکمه‌ها ---------- */
Forms['login'] = (values, form) => {
  if (!validateForm(form)) return;
  if (notify(login(values.username, values.password))) afterLogin();
};
Forms['register'] = (values, form) => {
  const repeat = form.querySelector('#reg-pass2');
  repeat.setCustomValidity(values.password === values.password2 ? '' : 'mismatch');
  form.querySelector('#reg-pass2-err').textContent = values.password2 ? 'تکرار رمز با رمز عبور یکی نیست.' : 'تکرار رمز را بنویسید.';
  if (!validateForm(form)) return;
  values.genres = [...form.querySelectorAll('[name="genre"]:checked')].map(c => c.value);
  if (notify(register(values))) afterLogin();
};
Forms['prefs'] = (values, form) => {
  const user = currentUser();
  if (!user) return;
  user.prefs = { genres: [...form.querySelectorAll('[name="genre"]:checked')].map(c => c.value) };
  saveDB();
  toast('سلیقهٔ شما ذخیره شد؛ پیشنهادهای هوشمند به‌روز شدند.');
};
Actions['logout'] = () => {
  logout();
  toast('از حساب خود خارج شدید.');
  go('home');
};
Actions['read-all'] = () => { markAllRead(currentUser().id); refresh(); };
Actions['enable-notifications'] = () => {
  if (!window.Notification) return;
  Notification.requestPermission().then(permission => {
    toast(permission === 'granted' ? 'اعلان‌های مرورگر روشن شد.' : 'مرورگر اجازهٔ اعلان نداد.', permission === 'granted' ? 'ok' : 'bad');
    refresh();
  }).catch(() => toast('مرورگر اجازهٔ اعلان نداد.', 'bad'));
};
