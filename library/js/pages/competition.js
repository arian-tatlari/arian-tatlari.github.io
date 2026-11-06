/* =========================================================
   مسابقهٔ کتابخوانی — ۸ سوال چهارگزینه‌ای و جدول امتیازها
   ========================================================= */

/* وضعیت مسابقهٔ در حال اجرا */
const quiz = { questions: [], index: 0, correct: 0, picked: null, finished: false, started: false };

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startQuiz() {
  /* سوال‌ها و گزینه‌ها هر بار جابه‌جا می‌شوند؛ جواب درست در data.js همیشه گزینهٔ اول است */
  quiz.questions = shuffle(QUIZ).slice(0, QUIZ_LENGTH).map(q => ({ q: q.q, answer: q.options[0], options: shuffle(q.options) }));
  quiz.index = 0;
  quiz.correct = 0;
  quiz.picked = null;
  quiz.finished = false;
  quiz.started = true;
}

Pages.competition = {
  title: 'مسابقهٔ کتابخوانی',
  render() {
    const now = persianParts();
    return `
      <div class="wrap">
        <section class="contest-band">
          <div>
            <p class="eyebrow">مسابقهٔ کتابخوانی ${seasonName(now.month)} ${fa(now.year)}</p>
            <h1>کتاب بخوان، جایزه ببر!</h1>
            <p class="lead" style="margin-top:10px">به ${fa(QUIZ_LENGTH)} سوال دربارهٔ کتاب‌های همین کتابخانه جواب بدهید. هر جواب درست یک امتیاز دارد و اعضای اشتراک سالانه امتیاز دوبرابر می‌گیرند.</p>
          </div>
          <ol class="prize-list" aria-label="جایزه‌ها">
            <li><span class="medal">۱</span>نفر اول: اشتراک سالانهٔ رایگان</li>
            <li><span class="medal">۲</span>نفر دوم: اشتراک سه‌ماههٔ رایگان</li>
            <li><span class="medal">۳</span>نفر سوم: اشتراک یک‌ماههٔ رایگان</li>
          </ol>
        </section>

        <section class="section">
          <div class="steps">
            <div class="step"><b>۱. کتاب بخوانید</b><span class="muted">کتاب‌های آزاد را امانت بگیرید و بخوانید.</span></div>
            <div class="step"><b>۲. به سوال‌ها جواب بدهید</b><span class="muted">${fa(QUIZ_LENGTH)} سوال چهارگزینه‌ای، بدون محدودیت زمان.</span></div>
            <div class="step"><b>۳. در جدول بالا بروید</b><span class="muted">اگر وارد حساب باشید، امتیازتان ثبت می‌شود.</span></div>
          </div>
        </section>

        <section class="section two-col">
          <div class="panel quiz" id="quiz-box" aria-live="polite">${quizHTML()}</div>
          <div>
            <h2 style="margin-bottom:14px">جدول امتیازها</h2>
            <div id="leaderboard">${leaderboardHTML()}</div>
          </div>
        </section>
      </div>`;
  }
};

function quizHTML() {
  if (!quiz.started) {
    return `
      <h2>آماده‌اید؟</h2>
      <p class="muted">سوال‌ها از کتاب‌های همین کتابخانه است: از شاهنامه و گلستان تا شازده کوچولو و هری پاتر.</p>
      <div><button class="btn btn-gold" type="button" data-action="quiz-start">${icon('trophy')} شروع مسابقه</button></div>`;
  }
  if (quiz.finished) {
    const user = currentUser();
    const percent = quiz.correct / quiz.questions.length;
    const message = percent === 1 ? 'عالی! همهٔ جواب‌ها درست بود.' : percent >= 0.75 ? 'خیلی خوب! شما یک کتابخوان حرفه‌ای هستید.' : percent >= 0.5 ? 'خوب بود! با خواندن چند کتاب دیگر بهتر هم می‌شود.' : 'اشکالی ندارد! چند کتاب امانت بگیرید و دوباره امتحان کنید.';
    return `
      <h2>نتیجهٔ شما</h2>
      <p class="score-big num">${fa(quiz.correct)} از ${fa(quiz.questions.length)}</p>
      <p>${message}</p>
      ${user ? `<p class="muted small">امتیاز شما به نام «${esc(user.name)}» در جدول ثبت شد.</p>` : `<p class="form-note">برای ثبت امتیاز در جدول، <a href="#login">وارد حساب خود شوید</a> و دوباره شرکت کنید.</p>`}
      <div class="hero-actions" style="margin:0">
        <button class="btn" type="button" data-action="quiz-start">${icon('undo')} دوباره امتحان کنید</button>
        <a class="btn btn-ghost" href="#books">رفتن به کتاب‌ها</a>
      </div>`;
  }
  const item = quiz.questions[quiz.index];
  const answered = quiz.picked !== null;
  const isLast = quiz.index === quiz.questions.length - 1;
  return `
    <div class="section-head" style="margin:0"><b>سوال ${fa(quiz.index + 1)} از ${fa(quiz.questions.length)}</b><span class="muted num">جواب درست: ${fa(quiz.correct)}</span></div>
    <div class="progress" aria-hidden="true"><span style="width:${(quiz.index + (answered ? 1 : 0)) / quiz.questions.length * 100}%"></span></div>
    <p class="quiz-q">${esc(item.q)}</p>
    <div class="quiz-options">
      ${item.options.map((option, i) => {
        let state = '';
        if (answered && option === item.answer) state = ' correct';
        else if (answered && i === quiz.picked) state = ' wrong';
        return `<button class="quiz-option${state}" type="button" data-action="quiz-answer" data-i="${i}"${answered ? ' disabled' : ''}>${esc(option)}</button>`;
      }).join('')}
    </div>
    ${answered ? `
      <p><b>${item.options[quiz.picked] === item.answer ? 'آفرین، درست بود!' : 'جواب درست: «' + esc(item.answer) + '»'}</b></p>
      <div><button class="btn" type="button" data-action="quiz-next">${isLast ? 'دیدن نتیجه' : 'سوال بعد'} ${icon('arrow')}</button></div>` : ''}`;
}

function leaderboardHTML() {
  const user = currentUser();
  const rows = leaderboard();
  if (!rows.length) return '<p class="empty">هنوز کسی شرکت نکرده است.</p>';
  return `
    <div class="table-wrap"><table class="table">
      <thead><tr><th>رتبه</th><th>نام</th><th>جواب درست</th><th>امتیاز</th><th>زمان</th></tr></thead>
      <tbody>${rows.map((s, i) => `
        <tr class="${user && s.userId === user.id ? 'me' : ''}">
          <td>${i < 3 ? `<span class="medal">${fa(i + 1)}</span>` : fa(i + 1)}</td>
          <td>${esc(s.name)}</td>
          <td class="num">${fa(s.correct)} از ${fa(s.total)}</td>
          <td class="num"><b>${fa(s.score)}</b></td>
          <td class="muted small">${timeAgo(s.date)}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function updateQuizBox() {
  const box = document.getElementById('quiz-box');
  if (box) box.innerHTML = quizHTML();
  const board = document.getElementById('leaderboard');
  if (board) board.innerHTML = leaderboardHTML();
}

Actions['quiz-start'] = () => { startQuiz(); updateQuizBox(); };
Actions['quiz-answer'] = (data) => {
  if (quiz.picked !== null) return;
  const item = quiz.questions[quiz.index];
  quiz.picked = Number(data.i);
  if (item.options[quiz.picked] === item.answer) quiz.correct += 1;
  updateQuizBox();
};
Actions['quiz-next'] = () => {
  if (quiz.index < quiz.questions.length - 1) {
    quiz.index += 1;
    quiz.picked = null;
  } else {
    quiz.finished = true;
    const user = currentUser();
    if (user) notify(saveScore(user, user.name, quiz.correct, quiz.questions.length));
  }
  updateQuizBox();
  const box = document.getElementById('quiz-box');
  const focusTarget = box && box.querySelector('.quiz-option, .btn');
  if (focusTarget) focusTarget.focus();
};
