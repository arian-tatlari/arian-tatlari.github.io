/* =========================================================
   خدمات — نصب اپ و دریافت اشتراک، اهدای کتاب و هدیه دادن کتاب
   ========================================================= */

/* ---------- نصب اپ و دریافت اشتراک ---------- */
Pages.app = {
  title: 'نصب اپ و دریافت اشتراک',
  render() {
    const user = currentUser();
    const current = planOf(user);
    const phoneBooks = [10, 11, 1, 16].map(getBook).filter(Boolean);
    return `
      <div class="wrap">
        <section class="app-band">
          <div>
            <div class="page-head" style="margin-bottom:18px">
              <p class="eyebrow">نصب اپ و دریافت اشتراک</p>
              <h1>کتابخانهٔ من، همیشه در جیب شما</h1>
              <p class="lead">اپ کتابخانه را روی گوشی نصب کنید تا بدون باز کردن مرورگر، کتاب جست‌وجو کنید، امانت بگیرید و تاریخ برگشت کتاب‌هایتان را ببینید.</p>
            </div>
            <ul class="plan" style="border:0;padding:0;background:none">
              <li>${icon('check')} جست‌وجو و امانت کتاب با چند لمس</li>
              <li>${icon('check')} یادآوری تاریخ برگشت کتاب‌ها</li>
              <li>${icon('check')} شرکت در مسابقهٔ کتابخوانی از روی گوشی</li>
            </ul>
            <div class="hero-actions">
              <button class="btn btn-gold" type="button" data-action="install-app">${icon('download')} نصب اپ</button>
              <a class="btn btn-ghost" href="#help">راهنمای نصب</a>
            </div>
          </div>
          <div class="phone" aria-hidden="true">
            <div class="phone-screen">
              <div class="phone-bar">کتابخانهٔ من</div>
              <div class="phone-books">${phoneBooks.map(b => coverHTML(b)).join('')}</div>
              <div class="phone-tabs">${icon('library')}${icon('search')}${icon('trophy')}${icon('user')}</div>
            </div>
          </div>
        </section>

        <section class="section" aria-labelledby="plans-title">
          <div class="section-head">
            <div>
              <p class="eyebrow">دریافت اشتراک</p>
              <h2 id="plans-title">اشتراکی که به کارتان می‌آید را انتخاب کنید</h2>
            </div>
            <p class="muted">${user ? 'اشتراک فعلی شما: <b>' + current.name + '</b>' : 'برای خرید اشتراک، اول <a href="#login">وارد شوید</a>.'}</p>
          </div>
          <div class="plans">
            ${PLANS.map(plan => {
              const isCurrent = user && plan.id === current.id;
              const flag = isCurrent ? 'اشتراک فعلی شما' : plan.featured ? 'پیشنهاد ما' : '';
              let button;
              if (plan.id === 'free') button = user ? '<span class="muted small">برای همهٔ اعضا فعال است</span>' : '<a class="btn btn-ghost btn-block" href="#register">عضویت رایگان</a>';
              else button = `<button class="btn btn-block${plan.featured ? ' btn-gold' : ''}" type="button" data-action="buy-plan" data-plan="${plan.id}">${isCurrent ? 'تمدید اشتراک' : 'خرید اشتراک'}</button>`;
              return `
                <article class="plan${plan.featured ? ' featured' : ''}${isCurrent ? ' current' : ''}">
                  ${flag ? `<span class="plan-flag">${flag}</span>` : ''}
                  <h3>${plan.name}</h3>
                  <p class="plan-price">${plan.price ? faPrice(plan.price) + ' <small>تومان</small>' : 'رایگان'}</p>
                  <ul>${plan.perks.map(p => `<li>${icon('check')}<span>${p}</span></li>`).join('')}</ul>
                  ${isCurrent && plan.id !== 'free' ? `<p class="muted small">فعال تا ${faDate(user.planUntil)}</p>` : ''}
                  ${button}
                </article>`;
            }).join('')}
          </div>
          <p class="muted small" style="margin-top:14px">این پروژه نسخهٔ نمایشی است و موقع خرید اشتراک هیچ پولی پرداخت نمی‌شود.</p>
        </section>
      </div>`;
  }
};

Actions['install-app'] = () => {
  openModal(modalBox('نصب اپ کتابخانهٔ من', `
    <div class="install-progress">
      <p id="install-status">در حال آماده‌سازی اپ…</p>
      <div class="progress"><span id="install-bar" style="width:0%"></span></div>
    </div>
    <div>
      <p><b>نصب روی گوشی واقعی:</b></p>
      <ol class="install-steps">
        <li>سایت را در مرورگر گوشی باز کنید.</li>
        <li>اندروید (Chrome): منوی سه‌نقطه ← «افزودن به صفحهٔ اصلی».</li>
        <li>آیفون (Safari): دکمهٔ اشتراک‌گذاری ← «Add to Home Screen».</li>
      </ol>
    </div>`, '<button class="btn btn-ghost" type="button" data-action="close-modal">بستن</button>'));
  /* نوار پیشرفت نمایشی نصب */
  let percent = 0;
  const timer = setInterval(() => {
    const bar = document.getElementById('install-bar');
    const status = document.getElementById('install-status');
    if (!bar || !status) return clearInterval(timer);
    percent = Math.min(100, percent + 20);
    bar.style.width = percent + '%';
    status.textContent = percent < 100 ? 'در حال نصب… ' + fa(percent) + '٪' : 'اپ نصب شد! (نسخهٔ نمایشی)';
    if (percent === 100) clearInterval(timer);
  }, 350);
};

Actions['buy-plan'] = (data) => {
  const user = currentUser();
  if (!user) return requireLogin('برای خرید اشتراک، اول وارد حساب خود شوید.');
  const plan = PLANS.find(p => p.id === data.plan);
  if (!plan) return;
  askConfirm({
    title: 'خرید ' + plan.name,
    text: `مبلغ: <b>${faPrice(plan.price)} تومان</b> برای ${fa(plan.days)} روز.<br>با این اشتراک ${fa(plan.maxLoans)} کتاب را هم‌زمان و هر کدام تا ${fa(plan.loanDays)} روز امانت می‌گیرید.<br><span class="muted small">پرداخت نمایشی است و پولی کم نمی‌شود.</span>`,
    yes: 'تأیید خرید',
    onYes: () => { notify(buyPlan(user, plan.id)); refresh(); }
  });
};

/* ---------- اهدا و هدیه دادن کتاب ---------- */
let lastGift = null;

Pages.donate = {
  title: 'اهدا و هدیه دادن کتاب',
  render(param) { return donateHTML('donate', param); }
};
Pages.gift = {
  title: 'هدیه دادن کتاب',
  render(param) { return donateHTML('gift', param); }
};

function donateHTML(tab, param) {
  const user = currentUser();
  const donated = db.books.filter(b => b.donatedBy).sort((a, b) => b.addedAt - a.addedAt);
  const isDonate = tab === 'donate';
  return `
    <div class="wrap">
      <div class="page-head">
        <p class="eyebrow">اهدا و هدیه دادن کتاب</p>
        <h1>${isDonate ? 'کتاب‌هایتان را با دیگران شریک شوید' : 'یک کتاب به دوستتان هدیه بدهید'}</h1>
        <p class="lead">${isDonate ? 'کتابی که خوانده‌اید را به کتابخانه اهدا کنید تا به قفسه اضافه شود و دیگران هم امانتش بگیرند.' : 'کتاب را انتخاب کنید، پیامتان را بنویسید و کارت هدیه بسازید. دوستتان با کد هدیه، کتاب را از کتابخانه تحویل می‌گیرد.'}</p>
      </div>
      <div class="tabs" role="tablist">
        <a class="tab" role="tab" href="#donate" aria-selected="${isDonate}">${icon('heart')} اهدای کتاب به کتابخانه</a>
        <a class="tab" role="tab" href="#gift" aria-selected="${!isDonate}">${icon('gift')} هدیه دادن کتاب به دوست</a>
      </div>
      <div class="two-col">
        <div class="panel">${isDonate ? donateFormHTML(user) : giftFormHTML(user, Number(param))}</div>
        <div>
          ${isDonate ? `
            <h2 style="margin-bottom:14px">کتاب‌های اهدایی</h2>
            ${donated.length ? `<div class="book-grid">${donated.map(b => bookCardHTML(b)).join('')}</div>` : `
              <div class="empty"><p>هنوز کتابی اهدا نشده است. اولین اهداکننده شما باشید!</p></div>`}
            <p class="muted small" style="margin-top:14px">کتاب‌های سالم و تمیز را می‌پذیریم. کتاب اهدایی با نام شما در قفسه قرار می‌گیرد.</p>` : `
            <div id="gift-preview">${lastGift ? giftCardHTML(lastGift) : `
              <div class="empty"><p>${icon('gift')}</p><p>پیش‌نمایش کارت هدیه بعد از ساختن، اینجا نشان داده می‌شود.</p></div>`}</div>`}
        </div>
      </div>
    </div>`;
}

function donateFormHTML(user) {
  return `
    <form class="form" data-form="donate" novalidate>
      <h2>اهدای کتاب</h2>
      ${field({ id: 'don-title', label: 'نام کتاب', name: 'title', required: true, min: 2, max: 60, error: 'نام کتاب را بنویسید.' })}
      ${field({ id: 'don-author', label: 'نویسنده یا مؤلف', name: 'author', required: true, min: 2, max: 60, error: 'نام نویسنده را بنویسید.' })}
      ${field({ id: 'don-cat', label: 'دسته', name: 'category', as: 'select', required: true, value: '',
        options: [{ value: '', label: 'یک دسته انتخاب کنید', disabled: true }].concat(CATEGORIES.map(c => ({ value: c, label: c }))), error: 'دستهٔ کتاب را انتخاب کنید.' })}
      ${field({ id: 'don-desc', label: 'توضیح کوتاه دربارهٔ کتاب (اختیاری)', name: 'description', as: 'textarea', max: 300, rows: 3 })}
      ${field({ id: 'don-donor', label: 'نام اهداکننده', name: 'donor', required: true, min: 2, max: 40, value: user ? user.name : '', error: 'نام خود را بنویسید.' })}
      <button class="btn" type="submit">${icon('heart')} اهدای کتاب</button>
    </form>`;
}

function giftFormHTML(user, selectedId) {
  const options = [{ value: '', label: 'یک کتاب انتخاب کنید', disabled: true }]
    .concat(db.books.slice().sort((a, b) => a.title.localeCompare(b.title, 'fa')).map(b => ({ value: String(b.id), label: b.title + ' — ' + b.author })));
  return `
    <form class="form" data-form="gift" novalidate>
      <h2>ساختن کارت هدیه</h2>
      ${field({ id: 'gift-book', label: 'کتاب هدیه', name: 'bookId', as: 'select', required: true, value: getBook(selectedId) ? String(selectedId) : '', options, error: 'یک کتاب انتخاب کنید.' })}
      <div class="form-row">
        ${field({ id: 'gift-friend', label: 'نام دوستتان', name: 'friend', required: true, min: 2, max: 40, error: 'نام دوستتان را بنویسید.' })}
        ${field({ id: 'gift-from', label: 'از طرف', name: 'from', required: true, min: 2, max: 40, value: user ? user.name : '', error: 'نام خودتان را بنویسید.' })}
      </div>
      ${field({ id: 'gift-msg', label: 'پیام شما (اختیاری)', name: 'message', as: 'textarea', max: 200, rows: 3, placeholder: 'مثلاً: تولدت مبارک! امیدوارم از این کتاب لذت ببری.' })}
      <button class="btn btn-gold" type="submit">${icon('gift')} ساختن کارت هدیه</button>
    </form>`;
}

function giftCardHTML(gift) {
  const book = getBook(gift.bookId);
  return `
    <div class="gift-card print-area" id="gift-card">
      <p class="eyebrow">کارت هدیهٔ کتابخانهٔ من</p>
      <h3>یک هدیه برای ${esc(gift.friend)}</h3>
      ${book ? `<div class="gift-book">${coverHTML(book)}<p>کتاب <b>«${esc(book.title)}»</b><br><span class="muted">نوشتهٔ ${esc(book.author)}</span></p></div>` : ''}
      ${gift.message ? `<p class="gift-msg">${esc(gift.message)}</p>` : ''}
      <p>از طرف: <b>${esc(gift.from)}</b> · ${faDate(gift.date)}</p>
      <p>کد هدیه: <span class="gift-code" id="gift-code">${esc(gift.code)}</span></p>
      <p class="small muted">این کد را به کتابدار نشان بدهید تا کتاب را تحویل بگیرید.</p>
    </div>
    <div class="hero-actions">
      <button class="btn btn-sm" type="button" data-action="copy-gift">${icon('copy')} کپی متن کارت</button>
      ${CAN_PRINT ? `<button class="btn btn-sm btn-ghost" type="button" data-action="print-gift">${icon('printer')} چاپ کارت</button>` : ''}
    </div>`;
}

Forms['donate'] = (values, form) => {
  if (!validateForm(form)) return;
  const result = donateBook(values);
  if (!notify(result)) return;
  openModal(modalBox('ممنون از اهدای شما!', `
    <div class="gift-book" style="display:grid;grid-template-columns:90px 1fr;gap:16px;align-items:center">
      ${coverHTML(result.book)}
      <p>«${esc(result.book.title)}» به قفسهٔ «${esc(result.book.category)}» اضافه شد و از همین حالا قابل امانت است.</p>
    </div>`,
    `<a class="btn" href="#book-${result.book.id}" data-action="close-modal-go">دیدن صفحهٔ کتاب</a><button class="btn btn-ghost" type="button" data-action="close-modal">بستن</button>`));
  refresh();
};
Forms['gift'] = (values, form) => {
  if (!validateForm(form)) return;
  const result = createGift(values);
  if (!notify(result)) return;
  lastGift = result.gift;
  document.getElementById('gift-preview').innerHTML = giftCardHTML(lastGift);
  document.getElementById('gift-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
};
Actions['copy-gift'] = () => {
  if (!lastGift) return;
  const book = getBook(lastGift.bookId);
  const text = `کارت هدیهٔ کتابخانهٔ من\nبرای: ${lastGift.friend}\nکتاب: «${book ? book.title : ''}»\nاز طرف: ${lastGift.from}\n${lastGift.message ? 'پیام: ' + lastGift.message + '\n' : ''}کد هدیه: ${lastGift.code}`;
  copyText(text, 'gift-card');
};
Actions['print-gift'] = () => { try { window.print(); } catch (e) { toast('چاپ در این حالت ممکن نیست.', 'bad'); } };
