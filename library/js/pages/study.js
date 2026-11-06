/* =========================================================
   میز مطالعه — تایمر مطالعه، نمودار پیشرفت، پیشرفت هر کتاب
   و تقویم برنامه‌ریزی مطالعه (تقویم شمسی)
   ========================================================= */

/* تایمر بین صفحه‌ها روشن می‌ماند (حتی بعد از بارگذاری دوباره) */
const TIMER_KEY = 'my-library-timer';
const studyTimer = (() => { try { return JSON.parse(storage.get(TIMER_KEY)) || null; } catch (e) { return null; } })() || { running: false, startedAt: 0, elapsed: 0, bookId: null, goal: 25 };
let calendarOffset = 0;

function timerMs() { return studyTimer.elapsed + (studyTimer.running ? Date.now() - studyTimer.startedAt : 0); }
function saveTimer() { storage.set(TIMER_KEY, JSON.stringify(studyTimer)); }
function clock(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor(total % 3600 / 60), s = total % 60;
  return fa((h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'));
}
/* هر ثانیه همهٔ نمایشگرهای تایمر را به‌روز می‌کند */
function tickTimers() {
  const ms = timerMs();
  document.querySelectorAll('[data-timer-text]').forEach(el => { el.textContent = clock(ms); });
  const ring = document.querySelector('[data-timer-ring]');
  if (ring) ring.style.strokeDashoffset = String(301.6 * (1 - Math.min(1, ms / (studyTimer.goal * 60000))));
  const pill = document.getElementById('timer-pill');
  if (pill) pill.hidden = !studyTimer.running && !studyTimer.elapsed;
}

Pages.study = {
  title: 'میز مطالعه',
  render() {
    const user = currentUser();
    if (!user) {
      return `<div class="wrap"><div class="page-head"><p class="eyebrow">میز مطالعه</p><h1>زمان مطالعه‌تان را ثبت کنید</h1>
        <p class="lead">تایمر مطالعه، نمودار پیشرفت و تقویم برنامه‌ریزی برای اعضای کتابخانه است.</p></div>
        <div class="empty"><p>برای استفاده از میز مطالعه وارد حساب خود شوید.</p><a class="btn" href="#login">${icon('login')} ورود</a></div></div>`;
    }
    const days = minutesByDay(user.id, 14);
    const week = minutesByDay(user.id, 7).reduce((sum, d) => sum + d.minutes, 0);
    const total = db.sessions.filter(s => s.userId === user.id).reduce((sum, s) => sum + s.minutes, 0);
    const reading = userShelf(user.id, 'reading');
    const myBooks = [...new Set([...reading.map(s => s.bookId), ...userLoans(user.id).map(l => l.bookId)])].map(getBook).filter(Boolean);
    const options = (selected) => [...myBooks, ...db.books.filter(b => !myBooks.includes(b))].map(b => `<option value="${b.id}"${b.id === selected ? ' selected' : ''}>${esc(b.title)}</option>`).join('');
    const timerBook = studyTimer.bookId || (myBooks[0] && myBooks[0].id);
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">میز مطالعه</p>
          <h1>امروز چقدر کتاب خواندید؟</h1>
          <p class="lead">با تایمر مطالعه کنید، پیشرفتتان را در نمودار ببینید و برای روزهای بعد برنامه بریزید. هر ۵ دقیقه مطالعه ۱ امتیاز باشگاه دارد.</p>
        </div>

        <div class="study-grid">
          <section class="panel timer-card" aria-labelledby="timer-title">
            <h2 id="timer-title">${icon('clock')} تایمر مطالعه</h2>
            <div class="timer-ring">
              <svg viewBox="0 0 110 110" aria-hidden="true"><circle class="ring-track" cx="55" cy="55" r="48"/><circle class="ring-fill" data-timer-ring cx="55" cy="55" r="48"/></svg>
              <div><b class="timer-digits" data-timer-text>${clock(timerMs())}</b><span class="muted small">هدف: ${fa(studyTimer.goal)} دقیقه</span></div>
            </div>
            <div class="form-row">
              <div class="field"><label for="timer-book">کتاب</label><select id="timer-book" class="select" data-timer-book>${options(timerBook)}</select></div>
              <div class="field"><label for="timer-goal">هدف (دقیقه)</label><select id="timer-goal" class="select" data-timer-goal>${[15, 25, 45, 60].map(g => `<option value="${g}"${g === studyTimer.goal ? ' selected' : ''}>${fa(g)}</option>`).join('')}</select></div>
            </div>
            <div class="book-actions">
              ${studyTimer.running
                ? `<button class="btn" type="button" data-action="timer-pause">${icon('pause')} مکث</button>`
                : `<button class="btn" type="button" data-action="timer-start">${icon('play')} ${studyTimer.elapsed ? 'ادامه' : 'شروع'}</button>`}
              <button class="btn btn-gold" type="button" data-action="timer-save">${icon('check')} پایان و ثبت</button>
              <button class="btn btn-ghost" type="button" data-action="timer-reset">صفر کردن</button>
            </div>
            <details class="manual-log">
              <summary>ثبت دستی زمان مطالعه</summary>
              <form class="form-row" data-form="log-reading" novalidate style="margin-top:10px">
                <div class="field"><label for="log-book">کتاب</label><select id="log-book" class="select" name="bookId">${options(timerBook)}</select></div>
                <div class="field"><label for="log-min">دقیقه</label><input id="log-min" class="input" name="minutes" type="number" min="1" max="600" value="20" required></div>
                <button class="btn btn-sm" type="submit">ثبت</button>
              </form>
            </details>
          </section>

          <section class="panel" aria-labelledby="progress-title">
            <h2 id="progress-title">${icon('chart')} پیشرفت مطالعه</h2>
            <div class="mini-stats">
              <div><b>${fa(week)}</b><span>دقیقه در ۷ روز اخیر</span></div>
              <div><b>${fa(readingStreak(user.id))}</b><span>روز پشت سر هم ${icon('flame')}</span></div>
              <div><b>${fa(Math.round(total / 60))}</b><span>ساعت مطالعهٔ کل</span></div>
            </div>
            ${columnChartHTML({ data: days.map(d => ({ label: faDateShort(d.date).split('/').slice(1).join('/'), value: d.minutes })), unit: 'دقیقه', columnLabel: 'روز', labelEvery: 2, caption: 'دقیقهٔ مطالعه در ۱۴ روز اخیر' })}
          </section>
        </div>

        <section class="section">
          <div class="section-head"><h2>کتاب‌هایی که می‌خوانید</h2><a href="#shelf">قفسهٔ من</a></div>
          ${reading.length ? `<div class="progress-list">${reading.map(s => {
            const b = getBook(s.bookId);
            return b ? `<a class="progress-item" href="#book-${b.id}">${coverHTML(b)}<span><b>${esc(b.title)}</b><span class="progress"><span style="width:${s.progress}%"></span></span><span class="muted small">${fa(s.progress)}٪ خوانده شده</span></span></a>` : '';
          }).join('')}</div>` : '<p class="empty">کتابی در قفسهٔ «در حال خواندن» ندارید. از صفحهٔ هر کتاب، آن را به قفسه‌تان اضافه کنید.</p>'}
        </section>

        <section class="section" aria-labelledby="cal-title">${calendarHTML(user)}</section>
      </div>`;
  },
  mount(root) {
    const book = root.querySelector('[data-timer-book]');
    if (book) book.addEventListener('change', () => { studyTimer.bookId = Number(book.value); saveTimer(); });
    const goal = root.querySelector('[data-timer-goal]');
    if (goal) goal.addEventListener('change', () => { studyTimer.goal = Number(goal.value); saveTimer(); refresh(); });
    tickTimers();
  }
};

/* ---------- تقویم شمسی برنامه‌ریزی مطالعه ---------- */
function calendarHTML(user) {
  let start = persianMonthStart(Date.now());
  for (let i = 0; i < Math.abs(calendarOffset); i++) start = calendarOffset < 0 ? persianMonthStart(start - DAY) : persianMonthStart(start + 32 * DAY);
  const month = persianParts(start).month;
  const days = [];
  for (let d = start; persianParts(d).month === month; d += DAY) days.push(d);
  const blanks = (new Date(start).getDay() + 1) % 7;          /* شنبه ستون اول است */
  const today = startOfDay(Date.now());
  const title = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(new Date(start));
  const cells = days.map(d => {
    const key = dateKey(d);
    const plans = plansOn(user.id, key);
    const minutes = db.sessions.filter(s => s.userId === user.id && s.date >= d && s.date < d + DAY).reduce((sum, s) => sum + s.minutes, 0);
    return `<button class="cal-day${d === today ? ' today' : ''}${minutes ? ' has-reading' : ''}" type="button" data-action="cal-day" data-key="${key}" aria-label="${persianParts(d).day} ${esc(title)}${minutes ? '، ' + minutes + ' دقیقه مطالعه' : ''}${plans.length ? '، ' + plans.length + ' برنامه' : ''}">
      <span class="cal-num">${fa(persianParts(d).day)}</span>
      ${minutes ? `<span class="cal-min">${fa(minutes)} دقیقه</span>` : ''}
      ${plans.map(p => { const b = getBook(p.bookId); return `<span class="cal-plan${p.done ? ' done' : ''}">${b ? esc(b.title) : 'مطالعه'} · ${fa(p.minutes)}</span>`; }).join('')}
    </button>`;
  });
  return `
    <div class="section-head">
      <div><p class="eyebrow">${icon('calendar')} تقویم برنامه‌ریزی مطالعه</p><h2 id="cal-title">${title}</h2></div>
      <div class="hero-actions" style="margin:0">
        <button class="btn btn-sm btn-ghost" type="button" data-action="cal-move" data-step="-1">ماه قبل</button>
        ${calendarOffset ? '<button class="btn btn-sm btn-ghost" type="button" data-action="cal-move" data-step="0">امروز</button>' : ''}
        <button class="btn btn-sm btn-ghost" type="button" data-action="cal-move" data-step="1">ماه بعد</button>
      </div>
    </div>
    <p class="muted small" style="margin-bottom:10px">روی هر روز بزنید تا برنامهٔ مطالعه اضافه کنید. روزهایی که مطالعه کرده‌اید با رنگ طلایی مشخص‌اند.</p>
    <div class="calendar">
      ${['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map(w => `<span class="cal-head">${w}</span>`).join('')}
      ${'<span class="cal-blank"></span>'.repeat(blanks)}${cells.join('')}
    </div>`;
}

Actions['cal-move'] = (data) => { calendarOffset = Number(data.step) === 0 ? 0 : calendarOffset + Number(data.step); refresh(); };
Actions['cal-day'] = (data) => {
  const user = currentUser();
  if (!user) return;
  const plans = plansOn(user.id, data.key);
  const [y, m, d] = data.key.split('-').map(Number);
  const label = faDate(new Date(y, m - 1, d).getTime());
  openModal(modalBox('برنامهٔ مطالعهٔ ' + label, `
    ${plans.length ? `<ul class="plan-list">${plans.map(p => { const b = getBook(p.bookId); return `
      <li class="${p.done ? 'done' : ''}"><span><b>${b ? esc(b.title) : 'مطالعه'}</b> · ${fa(p.minutes)} دقیقه${p.note ? '<br><span class="muted small">' + esc(p.note) + '</span>' : ''}</span>
        <span><button class="link-btn small" type="button" data-action="plan-toggle" data-id="${p.id}" data-key="${data.key}">${p.done ? 'انجام‌نشده' : 'انجام شد'}</button>
        <button class="link-btn small" type="button" data-action="plan-delete" data-id="${p.id}" data-key="${data.key}">حذف</button></span></li>`; }).join('')}</ul>` : '<p class="muted">برای این روز برنامه‌ای ندارید.</p>'}
    <form class="form" data-form="plan" data-key="${data.key}" novalidate>
      <div class="form-row">
        <div class="field"><label for="plan-book">کتاب</label><select id="plan-book" class="select" name="bookId">${db.books.map(b => `<option value="${b.id}">${esc(b.title)}</option>`).join('')}</select></div>
        <div class="field"><label for="plan-min">دقیقه</label><input id="plan-min" class="input" name="minutes" type="number" min="5" max="300" value="30" required></div>
      </div>
      <div class="field"><label for="plan-note">یادداشت (اختیاری)</label><input id="plan-note" class="input" name="note" maxlength="80" placeholder="مثلاً: فصل دوم"></div>
      <button class="btn" type="submit">${icon('plus')} افزودن برنامه</button>
    </form>`));
};
Forms['plan'] = (values, form) => {
  if (notify(addPlan(currentUser(), Object.assign({ date: form.dataset.key }, values)))) { closeModal(); refresh(); }
};
Actions['plan-toggle'] = (data) => { notify(togglePlan(data.id)); refresh(); Actions['cal-day']({ key: data.key }); };
Actions['plan-delete'] = (data) => { notify(deletePlan(data.id)); refresh(); Actions['cal-day']({ key: data.key }); };

/* ---------- دکمه‌های تایمر ---------- */
Actions['timer-start'] = () => {
  if (!currentUser()) return requireLogin('برای استفاده از تایمر، اول وارد حساب خود شوید.');
  const select = document.querySelector('[data-timer-book]');
  if (select) studyTimer.bookId = Number(select.value);
  studyTimer.running = true;
  studyTimer.startedAt = Date.now();
  saveTimer();
  refresh();
};
Actions['timer-pause'] = () => {
  studyTimer.elapsed = timerMs();
  studyTimer.running = false;
  saveTimer();
  refresh();
};
Actions['timer-reset'] = () => {
  Object.assign(studyTimer, { running: false, startedAt: 0, elapsed: 0 });
  saveTimer();
  refresh();
};
Actions['timer-save'] = () => {
  if (timerMs() < 1000) return toast('تایمر هنوز شروع نشده است. اول «شروع» را بزنید.', 'bad');
  const minutes = Math.max(1, Math.round(timerMs() / 60000));
  const result = logReading(currentUser(), studyTimer.bookId, minutes);
  if (!notify(result)) return;
  Object.assign(studyTimer, { running: false, startedAt: 0, elapsed: 0 });
  saveTimer();
  refresh();
};
Forms['log-reading'] = (values) => { if (notify(logReading(currentUser(), values.bookId, values.minutes))) refresh(); };
