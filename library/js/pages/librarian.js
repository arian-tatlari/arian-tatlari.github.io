/* =========================================================
   پنل کتابدار — مدیریت رزروها، صف‌ها، امانت‌ها و جریمه‌ها
   (برای کتابدار و مدیر کتابخانه)
   ========================================================= */

Pages.librarian = {
  title: 'پنل کتابدار',
  render() {
    const user = currentUser();
    if (!isStaff(user)) {
      return `
        <div class="wrap"><div class="empty">
          <p><b>این بخش برای کتابدار و مدیر کتابخانه است.</b></p>
          <p>برای امتحان، با نام کاربری <code dir="ltr">librarian</code> و رمز <code dir="ltr">1234</code> وارد شوید.</p>
          <a class="btn" href="#login">${icon('login')} ورود کتابدار</a>
        </div></div>`;
    }
    const waiting = db.reservations.filter(r => r.status === 'waiting').sort((a, b) => a.expires - b.expires);
    const loans = db.loans.filter(l => !l.returned).sort((a, b) => a.due - b.due);
    const late = loans.filter(l => l.due < Date.now());
    const fines = db.loans.filter(l => l.returned && l.fine && !l.finePaid);
    const queued = [...new Set(db.queue.map(q => q.bookId))].map(getBook).filter(Boolean);
    const members = db.users.filter(u => u.role === 'member');
    const freeBooks = db.books.filter(b => bookState(b.id).state === 'free').sort((a, b) => a.title.localeCompare(b.title, 'fa'));
    const name = id => { const u = getUser(id); return u ? esc(u.name) : '—'; };
    const title = id => { const b = getBook(id); return b ? `<a href="#book-${b.id}">${esc(b.title)}</a>` : '—'; };
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">پنل اختصاصی کتابدار</p>
          <h1>میز امانت و رزرو</h1>
          <p class="lead">رزروها را تحویل بدهید، کتاب‌های برگشتی را بگیرید، صف‌ها را ببینید و جریمه‌ها را ثبت کنید.</p>
        </div>
        <div class="admin-stats">
          <div class="admin-stat"><b>${fa(waiting.length)}</b><span class="muted">رزرو منتظر تحویل</span></div>
          <div class="admin-stat"><b>${fa(loans.length)}</b><span class="muted">امانت فعال</span></div>
          <div class="admin-stat"><b>${fa(late.length)}</b><span class="muted">دیرکرد</span></div>
          <div class="admin-stat"><b>${fa(db.queue.length)}</b><span class="muted">نفر در صف‌ها</span></div>
          <div class="admin-stat"><b>${faPrice(fines.reduce((s, l) => s + l.fine, 0))}</b><span class="muted">تومان جریمهٔ پرداخت‌نشده</span></div>
        </div>

        <section class="section" style="margin-top:0">
          <h2 style="margin-bottom:14px">${icon('calendar')} رزروهای منتظر تحویل</h2>
          ${waiting.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>کتاب</th><th>عضو</th><th>نوع</th><th>مهلت تحویل</th><th>عملیات</th></tr></thead>
            <tbody>${waiting.map(r => `<tr>
              <td>${title(r.bookId)}</td><td>${name(r.userId)}</td><td>${r.fromQueue ? 'نوبت صف' : 'رزرو آنلاین'}</td>
              <td class="num">${faDateShort(r.expires)} <span class="muted small">(${fa(Math.max(0, Math.ceil((r.expires - Date.now()) / HOUR)))} ساعت)</span></td>
              <td><button class="btn btn-sm" type="button" data-action="pickup" data-id="${r.id}">تحویل داده شد</button>
                <button class="btn btn-sm btn-ghost" type="button" data-action="cancel-reserve" data-id="${r.id}">لغو</button></td>
            </tr>`).join('')}</tbody></table></div>` : '<p class="empty">رزروی منتظر تحویل نیست.</p>'}
        </section>

        <section class="section two-col">
          <div class="panel">
            <h2>${icon('book')} ثبت امانت حضوری</h2>
            <form class="form" data-form="issue-loan" novalidate>
              <div class="field"><label for="issue-user">عضو</label><select id="issue-user" class="select" name="userId">${members.map(m => `<option value="${m.id}">${esc(m.name)} (${esc(m.username)})</option>`).join('')}</select></div>
              <div class="field"><label for="issue-book">کتاب آزاد</label><select id="issue-book" class="select" name="bookId">${freeBooks.map(b => `<option value="${b.id}">${esc(b.title)}</option>`).join('')}</select></div>
              <button class="btn" type="submit"${freeBooks.length ? '' : ' disabled'}>ثبت امانت</button>
            </form>
          </div>
          <div class="panel">
            <h2>${icon('users')} صف‌های انتظار</h2>
            ${queued.length ? `<ul class="queue-list">${queued.map(b => `<li><b>${title(b.id)}</b><ol>${queueOf(b.id).map(q => `<li>${name(q.userId)} <span class="muted small">از ${timeAgo(q.joined)}</span></li>`).join('')}</ol></li>`).join('')}</ul>` : '<p class="muted">صفی وجود ندارد.</p>'}
          </div>
        </section>

        <section class="section">
          <h2 style="margin-bottom:14px">${icon('clock')} امانت‌های فعال</h2>
          ${loans.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>کتاب</th><th>عضو</th><th>مهلت</th><th>وضعیت</th><th>جریمه تا امروز</th><th>عملیات</th></tr></thead>
            <tbody>${loans.map(l => { const left = daysLeft(l.due); return `<tr>
              <td>${title(l.bookId)}</td><td>${name(l.userId)}</td><td class="num">${faDateShort(l.due)}</td>
              <td><span class="days-left${left < 0 ? ' late' : ''}">${left >= 0 ? fa(left) + ' روز مانده' : fa(-left) + ' روز دیرکرد'}</span></td>
              <td class="num">${fineOf(l) ? faPrice(fineOf(l)) + ' تومان' : '—'}</td>
              <td><button class="btn btn-sm btn-ghost" type="button" data-action="return" data-id="${l.id}">تحویل گرفته شد</button></td>
            </tr>`; }).join('')}</tbody></table></div>` : '<p class="empty">همهٔ کتاب‌ها در قفسه‌اند.</p>'}
        </section>

        <section class="section">
          <h2 style="margin-bottom:14px">جریمه‌های پرداخت‌نشده</h2>
          ${fines.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>عضو</th><th>کتاب</th><th>روز تأخیر</th><th>مبلغ</th><th>عملیات</th></tr></thead>
            <tbody>${fines.map(l => `<tr><td>${name(l.userId)}</td><td>${title(l.bookId)}</td><td class="num">${fa(lateDays(l))}</td><td class="num">${faPrice(l.fine)} تومان</td>
              <td><button class="btn btn-sm btn-ghost" type="button" data-action="pay-fine" data-id="${l.id}">پرداخت شد</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">جریمهٔ پرداخت‌نشده‌ای نیست.</p>'}
        </section>
      </div>`;
  }
};

Actions['pickup'] = (data) => { notify(confirmPickup(data.id)); refresh(); };
Actions['pay-fine'] = (data) => { notify(payFine(data.id)); refresh(); };
Forms['issue-loan'] = (values) => {
  const member = getUser(values.userId);
  if (!member) return;
  notify(borrowBook(member, values.bookId));
  refresh();
};
