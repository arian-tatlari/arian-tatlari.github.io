/* =========================================================
   ارتباط با اعضا — دربارهٔ کتابخانه، نظرات و پیشنهادات،
   راهنمایی و پشتیبانی (سوالات رایج) و ارتباط با ما
   ========================================================= */

/* ---------- دربارهٔ کتابخانهٔ من ---------- */
Pages.about = {
  title: 'دربارهٔ کتابخانهٔ من',
  render() {
    const totalLoans = db.loans.length;
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">دربارهٔ کتابخانهٔ من</p>
          <h1>جایی برای خواندن، پرسیدن و یاد گرفتن</h1>
          <p class="lead">کتابخانهٔ من یک کتابخانهٔ کوچک و صمیمی است که می‌خواهد کتاب خواندن را برای همه ساده و لذت‌بخش کند.</p>
        </div>
        <div class="two-col">
          <div class="panel prose">
            <h2>داستان ما</h2>
            <p>کتابخانهٔ من با چند قفسه کتاب و یک ایدهٔ ساده شروع شد: کتابی که یک بار خوانده شده، می‌تواند بارها و بارها خوانده شود. حالا اعضای کتابخانه می‌توانند کتاب‌ها را آنلاین جست‌وجو کنند، ببینند کدام کتاب آزاد است، امانت بگیرند و نظرشان را با دیگران در میان بگذارند.</p>
            <p style="margin-top:12px">هر کتاب در کتابخانهٔ ما یک شمارهٔ رده (دیویی) دارد که روی عطفش چسبانده شده و جای آن را در قفسه نشان می‌دهد. پشت هر کتاب هم یک «برگهٔ تاریخ برگشت» هست که تاریخ امانت‌ها روی آن مهر می‌خورد.</p>
          </div>
          <aside class="panel">
            <h2>ساعت کار</h2>
            <table class="hours"><tbody>
              ${LIBRARY.hours.map(h => `<tr><td>${h[0]}</td><td>${h[1]}</td></tr>`).join('')}
            </tbody></table>
            <p style="margin-top:14px">${icon('pin')} ${esc(LIBRARY.address)}</p>
            <a class="btn btn-sm btn-ghost" style="margin-top:12px" href="#contact">ارتباط با ما</a>
          </aside>
        </div>

        <section class="section">
          <div class="values">
            <div class="value-card">${icon('users')}<b>کتاب برای همه</b><span class="muted">عضویت رایگان است و هر کسی می‌تواند کتاب امانت بگیرد.</span></div>
            <div class="value-card">${icon('bulb')}<b>یادگیری با لذت</b><span class="muted">با مسابقهٔ کتابخوانی، خواندن به یک بازی هیجان‌انگیز تبدیل می‌شود.</span></div>
            <div class="value-card">${icon('heart')}<b>کتابخانهٔ زنده</b><span class="muted">اعضا کتاب اهدا می‌کنند، نظر می‌دهند و کتاب‌های تازه پیشنهاد می‌کنند.</span></div>
          </div>
        </section>

        <div class="stats">
          <div class="stat"><b class="num">${fa(db.books.length)}</b><span>کتاب</span></div>
          <div class="stat"><b class="num">${fa(db.users.length)}</b><span>عضو</span></div>
          <div class="stat"><b class="num">${fa(totalLoans)}</b><span>امانت تا امروز</span></div>
          <div class="stat"><b class="num">${fa(db.comments.length)}</b><span>نظر دربارهٔ کتاب‌ها</span></div>
        </div>

        <section class="section">
          <h2 style="margin-bottom:16px">کتابخانه چطور کار می‌کند؟</h2>
          <div class="steps" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
            <div class="step"><b>۱. عضو شوید</b><span class="muted">در چند ثانیه و رایگان. <a href="#register">ثبت‌نام</a></span></div>
            <div class="step"><b>۲. کتاب را پیدا کنید</b><span class="muted">با جست‌وجو یا دسته‌بندی‌ها. <a href="#books">کتاب‌ها</a></span></div>
            <div class="step"><b>۳. امانت بگیرید</b><span class="muted">اگر وضعیت کتاب «آزاد» باشد.</span></div>
            <div class="step"><b>۴. بخوانید و نظر بدهید</b><span class="muted">و سر موعد پس بدهید.</span></div>
          </div>
        </section>
      </div>`;
  }
};

/* ---------- نظرات و پیشنهادات کاربران ---------- */
const feedbackFilter = { type: 'all', sort: 'new' };

Pages.feedback = {
  title: 'نظرات و پیشنهادات',
  render() {
    const user = currentUser();
    const typeOptions = Object.keys(FEEDBACK_TYPES).map(k => ({ value: k, label: FEEDBACK_TYPES[k] }));
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">نظرات و پیشنهادات کاربران</p>
          <h1>صدای شما، کتابخانهٔ بهتر</h1>
          <p class="lead">کتابی را پیشنهاد کنید، ایده‌ای برای سایت بدهید یا انتقادتان را بگویید. پیشنهادهای دیگران را هم می‌توانید بپسندید.</p>
        </div>
        <div class="two-col">
          <div style="min-width:0">
            <div class="toolbar-row" style="margin-bottom:16px" id="fb-tools">
              <div class="chips" role="group" aria-label="نوع پیام">
                <button class="chip" type="button" data-fb-type="all" aria-pressed="${feedbackFilter.type === 'all'}">همه</button>
                ${typeOptions.map(t => `<button class="chip" type="button" data-fb-type="${t.value}" aria-pressed="${feedbackFilter.type === t.value}">${t.label}</button>`).join('')}
              </div>
              <select class="select" id="fb-sort" aria-label="مرتب‌سازی" style="width:auto">
                <option value="new"${feedbackFilter.sort === 'new' ? ' selected' : ''}>جدیدترین</option>
                <option value="likes"${feedbackFilter.sort === 'likes' ? ' selected' : ''}>پرطرفدارترین</option>
              </select>
            </div>
            <div class="fb-list" id="fb-list">${feedbackListHTML()}</div>
          </div>
          <aside class="panel">
            <form class="form" data-form="feedback" novalidate>
              <h2>ثبت نظر یا پیشنهاد</h2>
              ${field({ id: 'fb-name', label: 'نام شما', name: 'name', required: true, min: 2, max: 40, value: user ? user.name : '', error: 'نام خود را بنویسید.' })}
              ${field({ id: 'fb-type', label: 'نوع پیام', name: 'type', as: 'select', required: true, value: 'book', options: typeOptions })}
              ${field({ id: 'fb-text', label: 'متن پیام', name: 'text', as: 'textarea', required: true, min: 5, max: 500, error: 'متن پیام را بنویسید (دست‌کم ۵ حرف).' })}
              <button class="btn" type="submit">${icon('bulb')} ثبت پیام</button>
            </form>
          </aside>
        </div>
      </div>`;
  },
  mount(root) {
    const tools = root.querySelector('#fb-tools');
    tools.querySelector('.chips').addEventListener('click', event => {
      const chip = event.target.closest('[data-fb-type]');
      if (!chip) return;
      feedbackFilter.type = chip.dataset.fbType;
      tools.querySelectorAll('[data-fb-type]').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      updateFeedbackList();
    });
    tools.querySelector('#fb-sort').addEventListener('change', event => { feedbackFilter.sort = event.target.value; updateFeedbackList(); });
  }
};

function feedbackListHTML() {
  const user = currentUser();
  const admin = isAdmin(user);
  let items = db.feedback.filter(f => feedbackFilter.type === 'all' || f.type === feedbackFilter.type);
  items = items.sort(feedbackFilter.sort === 'likes' ? (a, b) => b.likes.length - a.likes.length || b.date - a.date : (a, b) => b.date - a.date);
  if (!items.length) return '<div class="empty"><p>در این دسته هنوز پیامی ثبت نشده است.</p></div>';
  return items.map(f => {
    const liked = user && f.likes.includes(user.id);
    return `
      <article class="fb-item">
        <div class="fb-top">
          <span class="fb-type">${FEEDBACK_TYPES[f.type] || 'پیام'}</span>
          <b>${esc(f.name)}</b>
          <span class="muted small">${timeAgo(f.date)}</span>
          <span class="fb-status${f.status === 'done' ? ' done' : ''}">${f.status === 'done' ? '✓ بررسی شد' : 'در حال بررسی'}</span>
        </div>
        <p>${esc(f.text)}</p>
        <div class="fb-actions">
          <button class="like-btn" type="button" data-action="like" data-id="${f.id}" aria-pressed="${!!liked}">${icon('heart')} <span class="num">${fa(f.likes.length)}</span><span class="sr-only">پسند</span></button>
          ${admin ? `
            <button class="btn btn-sm btn-ghost" type="button" data-action="fb-status" data-id="${f.id}" data-status="${f.status === 'done' ? 'review' : 'done'}">${f.status === 'done' ? 'برگرداندن به «در حال بررسی»' : 'علامت «بررسی شد»'}</button>
            <button class="btn btn-sm btn-danger" type="button" data-action="fb-delete" data-id="${f.id}">حذف</button>` : ''}
        </div>
      </article>`;
  }).join('');
}
function updateFeedbackList() {
  const list = document.getElementById('fb-list');
  if (list) list.innerHTML = feedbackListHTML();
}

Forms['feedback'] = (values, form) => {
  if (!validateForm(form)) return;
  if (!notify(addFeedback(values))) return;
  feedbackFilter.type = 'all';
  feedbackFilter.sort = 'new';
  refresh();
};
Actions['like'] = (data) => {
  const user = currentUser();
  if (!user) return requireLogin('برای پسندیدن، اول وارد حساب خود شوید.');
  toggleLike(data.id, user);
  updateFeedbackList();
};
Actions['fb-status'] = (data) => { if (isAdmin(currentUser())) { notify(setFeedbackStatus(data.id, data.status)); refresh(); } };
Actions['fb-delete'] = (data) => {
  if (!isAdmin(currentUser())) return;
  askConfirm({ title: 'حذف پیام', text: 'این نظر یا پیشنهاد حذف شود؟', yes: 'حذف', danger: true, onYes: () => { notify(deleteFeedback(data.id)); refresh(); } });
};

/* ---------- راهنمایی و پشتیبانی (سوالات رایج) ---------- */
Pages.help = {
  title: 'راهنمایی و پشتیبانی',
  render() {
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">راهنمایی و پشتیبانی</p>
          <h1>سوالات رایج</h1>
          <p class="lead">جواب بیشتر سوال‌ها اینجاست. اگر جوابتان را پیدا نکردید، با ما در تماس باشید.</p>
        </div>
        <div class="two-col">
          <div style="min-width:0">
            <div class="searchbar" style="margin:0 0 16px;max-width:none">
              <div class="input-wrap">${icon('search')}<input id="faq-q" class="input" type="search" placeholder="جست‌وجو در سوال‌ها… (مثلاً: امانت)" aria-label="جست‌وجو در سوالات رایج"></div>
            </div>
            <div class="faq-list" id="faq-list">
              ${FAQ.map((item, i) => `
                <details class="faq" data-text="${esc(norm(item.q + ' ' + item.a))}"${i === 0 ? ' open' : ''}>
                  <summary>${esc(item.q)} ${icon('chevron')}</summary>
                  <p class="faq-a">${esc(item.a)}</p>
                </details>`).join('')}
            </div>
            <p class="empty" id="faq-empty" hidden>سوالی با این کلمه پیدا نشد. از <a href="#contact">ارتباط با ما</a> بپرسید.</p>
          </div>
          <aside style="display:grid;gap:16px">
            <div class="panel">
              <h2>جواب سوالتان را پیدا نکردید؟</h2>
              <p class="muted">پشتیبانی کتابخانه در ساعت کاری پاسخگوی شماست.</p>
              <p style="margin-top:10px">${icon('phone')} <span class="ltr num">${fa(LIBRARY.phone)}</span></p>
              <div class="hero-actions" style="margin-top:14px">
                <a class="btn btn-sm" href="#contact">${icon('mail')} ارتباط با ما</a>
                <a class="btn btn-sm btn-ghost" href="#feedback">ثبت پیشنهاد</a>
              </div>
            </div>
            <div class="panel">
              <h3>راهنمای سریع امانت گرفتن</h3>
              <ol class="install-steps">
                <li>از «ورود / عضویت» وارد حساب شوید.</li>
                <li>در «کتاب‌ها» کتاب آزاد را پیدا کنید.</li>
                <li>در صفحهٔ کتاب، «امانت گرفتن» را بزنید.</li>
                <li>تاریخ برگشت را در «حساب من» ببینید.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>`;
  },
  mount(root) {
    root.querySelector('#faq-q').addEventListener('input', event => {
      const words = norm(event.target.value).split(' ').filter(Boolean);
      let shown = 0;
      root.querySelectorAll('#faq-list .faq').forEach(item => {
        const match = words.every(w => item.dataset.text.includes(w));
        item.hidden = !match;
        if (match) shown += 1;
        if (words.length && match) item.open = true;
      });
      root.querySelector('#faq-empty').hidden = shown > 0;
    });
  }
};

/* ---------- ارتباط با ما ---------- */
Pages.contact = {
  title: 'ارتباط با ما',
  render() {
    const user = currentUser();
    const subjects = ['سوال', 'پیشنهاد', 'گزارش مشکل', 'همکاری'].map(s => ({ value: s, label: s }));
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">ارتباط با ما</p>
          <h1>با کتابخانهٔ من در تماس باشید</h1>
          <p class="lead">سوال، پیشنهاد یا مشکلی دارید؟ فرم را پر کنید یا تلفنی با ما صحبت کنید.</p>
        </div>
        <div class="two-col">
          <div class="panel">
            <form class="form" data-form="contact" novalidate>
              <div class="form-row">
                ${field({ id: 'ct-name', label: 'نام و نام خانوادگی', name: 'name', required: true, min: 2, max: 40, value: user ? user.name : '', error: 'نام خود را بنویسید.' })}
                ${field({ id: 'ct-contact', label: 'ایمیل یا شمارهٔ تماس', name: 'contact', required: true, min: 5, max: 60, dir: 'ltr', error: 'یک ایمیل یا شماره برای پاسخ بنویسید.' })}
              </div>
              ${field({ id: 'ct-subject', label: 'موضوع', name: 'subject', as: 'select', value: 'سوال', options: subjects })}
              ${field({ id: 'ct-text', label: 'پیام شما', name: 'text', as: 'textarea', required: true, min: 5, max: 800, rows: 5, error: 'متن پیام را بنویسید (دست‌کم ۵ حرف).' })}
              <button class="btn" type="submit">${icon('mail')} ارسال پیام</button>
            </form>
          </div>
          <div class="contact-list">
            <div class="contact-item">${icon('pin')}<div><span class="muted small">نشانی</span><p class="value">${esc(LIBRARY.address)}</p></div><span></span></div>
            <div class="contact-item">${icon('phone')}<div><span class="muted small">تلفن</span><p class="value"><span class="ltr num" id="ct-phone">${fa(esc(LIBRARY.phone))}</span></p></div>
              <button class="icon-btn" type="button" data-action="copy" data-text="${esc(LIBRARY.phone)}" data-target="ct-phone" title="کپی شماره">${icon('copy')}<span class="sr-only">کپی شماره</span></button></div>
            <div class="contact-item">${icon('mail')}<div><span class="muted small">ایمیل</span><p class="value"><span class="ltr" id="ct-email">${esc(LIBRARY.email)}</span></p></div>
              <button class="icon-btn" type="button" data-action="copy" data-text="${esc(LIBRARY.email)}" data-target="ct-email" title="کپی ایمیل">${icon('copy')}<span class="sr-only">کپی ایمیل</span></button></div>
            <div class="contact-item">${icon('clock')}<div><span class="muted small">ساعت کار</span><p class="value">${LIBRARY.hours[0][0]}، ${LIBRARY.hours[0][1]}</p></div><span></span></div>
          </div>
        </div>
      </div>`;
  }
};

Forms['contact'] = (values, form) => {
  if (!validateForm(form)) return;
  if (!notify(addMessage(values))) return;
  form.reset();
  form.classList.remove('was-validated');
  syncAria(form);
};
Actions['copy'] = (data) => copyText(data.text, data.target);
