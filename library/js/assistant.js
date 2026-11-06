/* =========================================================
   assistant.js — دستیار هوشمند کتابخانه (بدون اینترنت)
   پرسش کاربر یکسان‌سازی می‌شود، «نیت» آن (خلاصه، نویسنده، وضعیت، پیشنهاد، قانون‌ها و ...)
   با کلیدواژه‌ها تشخیص داده می‌شود و جواب از اطلاعات همین کتابخانه ساخته می‌شود.
   دستیار کتابی را که دربارهٔ آن حرف زده‌اید به خاطر می‌سپارد تا پرسش‌های بعدی را بفهمد.
   ========================================================= */

const assistantLog = [];               /* گفت‌وگوی فعلی (تا وقتی صفحه بسته نشده) */
const assistantContext = { bookId: null, authorId: null };
const assistantAskedBooks = new Set();   /* کتاب‌هایی که از صفحهٔ کتاب دربارهٔ آن‌ها پرسیده شده */

const AUTHOR_ALIASES = {
  ferdowsi: ['فردوسی'], saadi: ['سعدی'], hafez: ['حافظ'], rumi: ['مولانا', 'مولوی', 'رومی'], daneshvar: ['دانشور'],
  aleahmad: ['آل احمد', 'آل‌احمد', 'جلال'], moradi: ['مرادی کرمانی', 'مرادی'], behrangi: ['بهرنگی', 'صمد'],
  exupery: ['اگزوپری', 'سنت اگزوپری'], rowling: ['رولینگ'], twain: ['تواین'], hemingway: ['همینگوی'], hugo: ['هوگو'],
  orwell: ['اورول'], coelho: ['کوئیلو'], gaarder: ['گردر'], hawking: ['هاوکینگ']
};
const CATEGORY_HINTS = [
  ['کودک', 'کودک و نوجوان'], ['نوجوان', 'کودک و نوجوان'], ['کلاسیک', 'ادبیات کلاسیک'], ['شعر', 'ادبیات کلاسیک'],
  ['رمان ایرانی', 'رمان ایرانی'], ['رمان خارجی', 'رمان خارجی'], ['خارجی', 'رمان خارجی'], ['علمی', 'علم، تاریخ و فلسفه'],
  ['فلسفه', 'علم، تاریخ و فلسفه'], ['تاریخ', 'علم، تاریخ و فلسفه'], ['موفقیت', 'مهارت‌های زندگی'], ['مهارت', 'مهارت‌های زندگی']
];
const has = (text, ...words) => words.some(w => text.includes(norm(w)));

function findBookIn(text) {
  const found = db.books.filter(b => text.includes(norm(b.title))).sort((a, b) => b.title.length - a.title.length);
  if (found.length) return found[0];
  /* نام کوتاه: «هری پاتر»، «سوفی»، «مجید» و ... */
  return db.books.find(b => norm(b.title).split(' ').filter(w => w.length > 3).some(w => text.includes(w) && !['کتاب', 'های'].includes(w))) || null;
}
function findAuthorIn(text) {
  const id = Object.keys(AUTHOR_ALIASES).find(key => AUTHOR_ALIASES[key].some(alias => text.includes(norm(alias))));
  return id ? AUTHORS.find(a => a.id === id) : null;
}
function findGenreIn(text) { return GENRES.find(g => text.includes(norm(g))) || (has(text, 'خنده', 'خنده‌دار') ? 'طنز' : has(text, 'ماجرا', 'هیجان') ? 'ماجرایی' : null); }
function findCategoryIn(text) { const hit = CATEGORY_HINTS.find(([word]) => text.includes(norm(word))); return hit ? hit[1] : null; }

/* ---------- ساختن جواب ---------- */
function reply(html, extras) { return Object.assign({ html, books: [], chips: [] }, extras || {}); }
function bookLink(book) { return '<a href="#book-' + book.id + '">«' + esc(book.title) + '»</a>'; }
function statusSentence(book) {
  const status = bookState(book.id);
  if (status.state === 'free') return bookLink(book) + ' الان <b>آزاد</b> است و می‌توانید امانت یا رزروش کنید.';
  const queue = queueOf(book.id).length;
  const tail = queue ? ' ' + fa(queue) + ' نفر هم در صف انتظارش هستند.' : ' می‌توانید در صف انتظارش نوبت بگیرید.';
  if (status.state === 'reserved') return bookLink(book) + ' برای یکی از اعضا <b>رزرو شده</b> است.' + tail;
  return bookLink(book) + ' <b>در امانت</b> است و ' + faDate(status.loan.due) + ' برمی‌گردد.' + tail;
}
function similarBooks(book, count) {
  return db.books.filter(b => b.id !== book.id).map(b => ({
    b, score: (b.genre === book.genre ? 3 : 0) + (b.category === book.category ? 1 : 0) + b.subjects.filter(s => book.subjects.includes(s)).length * 2
  })).filter(x => x.score > 0).sort((x, y) => y.score - x.score || rating(y.b).avg - rating(x.b).avg).slice(0, count).map(x => x.b);
}
function bookChips(book) {
  return [
    { label: 'خلاصه‌اش را بگو', ask: 'خلاصهٔ ' + book.title },
    { label: 'نویسنده‌اش کیست؟', ask: 'نویسندهٔ ' + book.title + ' کیست؟' },
    { label: 'الان آزاد است؟', ask: book.title + ' آزاد است؟' },
    { label: 'کتاب مشابه', ask: 'کتابی شبیه ' + book.title }
  ];
}
const START_CHIPS = [
  { label: 'یک کتاب پیشنهاد بده', ask: 'یک کتاب پیشنهاد بده' },
  { label: 'خلاصهٔ شازده کوچولو', ask: 'خلاصهٔ شازده کوچولو' },
  { label: 'فال حافظ', ask: 'فال حافظ بگیر' },
  { label: 'جریمهٔ دیرکرد چقدر است؟', ask: 'جریمهٔ دیرکرد چقدر است؟' },
  { label: 'کتاب علمی خوب', ask: 'یک کتاب علمی معرفی کن' }
];

function answerAbout(book, text) {
  assistantContext.bookId = book.id;
  const chips = bookChips(book);
  if (has(text, 'نویسنده', 'مولف', 'مؤلف', 'کی نوشته', 'سراینده', 'شاعر')) {
    const author = AUTHORS.find(a => a.id === book.authorId);
    return reply(bookLink(book) + ' نوشتهٔ <b>' + esc(book.author) + '</b> است.' + (author ? ' ' + esc(author.bio.split('.')[0]) + '. <a href="#author-' + author.id + '">زندگی‌نامهٔ کامل</a>' : ''), { chips });
  }
  if (has(text, 'آزاد', 'موجود', 'امانت', 'رزرو', 'دارید', 'وضعیت', 'برمیگرده', 'برمی‌گردد')) return reply(statusSentence(book), { chips });
  if (has(text, 'شبیه', 'مشابه', 'مثل')) {
    const list = similarBooks(book, 3);
    return reply(list.length ? 'اگر ' + bookLink(book) + ' را دوست داشتید، این‌ها را هم ببینید:' : 'کتاب مشابهی پیدا نکردم.', { books: list, chips });
  }
  if (has(text, 'امتیاز', 'ستاره', 'نظر', 'نقد')) {
    const r = rating(book);
    return reply('میانگین امتیاز ' + bookLink(book) + ' <b>' + faDecimal(r.avg) + ' از ۵</b> از ' + fa(r.count) + ' رأی است و ' + fa(bookComments(book.id).length) + ' نظر برایش نوشته شده.', { chips });
  }
  if (has(text, 'سال', 'چه زمانی', 'کی چاپ', 'قدیمی')) return reply(bookLink(book) + ' مربوط به <b>' + esc(book.year) + '</b> است.', { chips });
  if (has(text, 'متن', 'بخوان', 'بخونم', 'شعر', 'بیت') && book.textId && TEXTS[book.textId]) {
    const verse = TEXTS[book.textId].parts.find(p => p.verse).verse[0];
    return reply('بخشی از ' + bookLink(book) + ':<blockquote class="bot-verse">' + esc(verse[0]) + '<br>' + esc(verse[1]) + '</blockquote><a href="#read-' + book.id + '">خواندن در کتاب‌خوان آنلاین</a>', { chips });
  }
  const summary = book.summary || book.description;
  return reply('<b>' + esc(book.title) + '</b> (' + esc(book.genre) + '، ' + esc(book.year) + ')<br>' + esc(summary), { chips });
}

function assistantAnswer(question) {
  const text = norm(question);
  const user = currentUser();
  if (!text) return reply('سوالتان را بنویسید. مثلاً: «خلاصهٔ کیمیاگر» یا «یک کتاب طنز پیشنهاد بده».', { chips: START_CHIPS });
  if (/^(سلام|درود|hi|hello)/.test(text)) return reply('سلام' + (user ? ' ' + esc(user.name) : '') + '! من دستیار کتابخانه هستم. می‌توانم کتاب پیشنهاد بدهم، خلاصه بگویم و به سوال‌هایتان دربارهٔ کتاب‌ها و کتابخانه جواب بدهم.', { chips: START_CHIPS });
  if (has(text, 'ممنون', 'مرسی', 'متشکر', 'دستت درد')) return reply('خواهش می‌کنم! سوال دیگری هم دارید؟', { chips: START_CHIPS });
  if (has(text, 'چه کار', 'چیکار', 'چه کمکی', 'چی بلدی', 'راهنمایی کن')) {
    return reply('این کارها را بلدم:<ul class="bot-list"><li>معرفی و پیشنهاد کتاب بر اساس سلیقه و ژانر</li><li>خلاصهٔ کتاب‌ها و معرفی نویسنده‌ها</li><li>وضعیت کتاب‌ها (آزاد، در امانت، رزرو)</li><li>قانون‌های امانت، رزرو، صف و جریمه</li><li>امانت‌ها، جریمه و امتیاز خودتان</li><li>فال حافظ!</li></ul>', { chips: START_CHIPS });
  }
  if (has(text, 'فال')) {
    const verses = TEXTS.hafez.parts.filter(p => p.verse).flatMap(p => p.verse);
    const verse = verses[Math.floor(Math.random() * verses.length)];
    return reply('فال شما از دیوان حافظ:<blockquote class="bot-verse">' + esc(verse[0]) + '<br>' + esc(verse[1]) + '</blockquote>', { chips: [{ label: 'یک فال دیگر', ask: 'فال حافظ' }, { label: 'دیوان حافظ را بخوانم', ask: 'متن دیوان حافظ' }] });
  }
  if (has(text, 'امانت های من', 'امانتهای من', 'کتابهای من', 'جریمه من', 'امتیاز من', 'سطح من', 'حساب من')) {
    if (!user) return reply('برای دیدن اطلاعات خودتان اول <a href="#login">وارد حساب شوید</a>.');
    const loans = userLoans(user.id);
    const xp = userXP(user.id);
    return reply('شما ' + fa(loans.length) + ' کتاب در امانت دارید' + (loans.length ? ': ' + loans.map(l => { const b = getBook(l.bookId); return b ? bookLink(b) + ' (تا ' + faDate(l.due) + ')' : ''; }).join('، ') : '') + '.<br>' +
      'جریمهٔ پرداخت‌نشده: ' + faPrice(unpaidFineTotal(user.id)) + ' تومان · امتیاز: ' + fa(xp) + ' (سطح «' + levelOf(xp).name + '»)');
  }
  if (has(text, 'ساعت', 'کی باز', 'آدرس', 'نشانی', 'تلفن', 'شماره تماس', 'کجاست')) {
    return reply('ساعت کار: ' + LIBRARY.hours.map(h => h[0] + ' ' + h[1]).join('، ') + '.<br>نشانی: ' + esc(LIBRARY.address) + ' · تلفن: <span class="ltr">' + fa(LIBRARY.phone) + '</span>');
  }
  if (has(text, 'چند کتاب', 'چند تا کتاب', 'تعداد کتاب')) {
    const free = db.books.filter(b => bookState(b.id).state === 'free').length;
    return reply('کتابخانه ' + fa(db.books.length) + ' کتاب دارد که ' + fa(free) + ' تا الان آزادند.');
  }

  const book = findBookIn(text);
  if (book) return answerAbout(book, text);
  const author = findAuthorIn(text);
  if (author) {
    assistantContext.authorId = author.id;
    const theirs = db.books.filter(b => b.authorId === author.id);
    return reply('<b>' + esc(author.name) + '</b> (' + esc(author.years) + '، ' + esc(author.place) + ')<br>' + esc(author.bio) + '<br>آثار: ' + author.works.map(esc).join('، ') + '. <a href="#author-' + author.id + '">صفحهٔ نویسنده</a>', { books: theirs });
  }
  /* پرسش دنبالهٔ کتاب قبلی: «نویسنده‌اش کیست؟» */
  const previous = assistantContext.bookId && getBook(assistantContext.bookId);
  if (previous && has(text, 'نویسنده', 'خلاصه', 'آزاد', 'امانت', 'شبیه', 'مشابه', 'امتیاز', 'سال', 'این کتاب')) return answerAbout(previous, text);

  if (has(text, 'پیشنهاد', 'معرفی کن', 'چی بخونم', 'چه کتابی', 'کتاب خوب', 'بخوانم')) {
    const genre = findGenreIn(text);
    const category = findCategoryIn(text);
    let picks;
    if (genre || category) {
      picks = db.books.filter(b => (!genre || b.genre === genre) && (!category || b.category === category)).sort((a, b) => rating(b).avg - rating(a).avg).slice(0, 3);
      return reply(picks.length ? 'این‌ها از بهترین کتاب‌های ' + (genre ? 'ژانر «' + genre + '»' : '«' + category + '»') + ' کتابخانه‌اند:' : 'در این دسته کتابی پیدا نکردم.', { books: picks });
    }
    picks = recommendFor(user, 3);
    return reply(user ? 'بر اساس سلیقهٔ شما (کتاب‌هایی که خوانده‌اید و دوست دارید):' : 'این کتاب‌ها محبوب‌ترین‌های کتابخانه‌اند. اگر وارد شوید، بر اساس سلیقهٔ خودتان پیشنهاد می‌دهم:', { books: picks.map(p => p.book), notes: picks.map(p => p.reason) });
  }
  if (has(text, 'تصادفی', 'شانسی', 'یه کتاب بگو', 'یک کتاب بگو')) {
    const pick = db.books[Math.floor(Math.random() * db.books.length)];
    assistantContext.bookId = pick.id;
    return reply('کتاب شانسی شما: ' + bookLink(pick) + ' نوشتهٔ ' + esc(pick.author) + '.', { books: [pick], chips: bookChips(pick) });
  }
  /* سوال‌های رایج (رزرو، صف، جریمه، اشتراک و ...) */
  const words = text.split(' ').filter(w => w.length > 2);
  const faq = FAQ.map(item => ({ item, score: words.filter(w => norm(item.q + ' ' + item.a).includes(w)).length })).sort((a, b) => b.score - a.score)[0];
  if (faq && faq.score >= 2) return reply('<b>' + esc(faq.item.q) + '</b><br>' + esc(faq.item.a));
  const genre = findGenreIn(text) || findCategoryIn(text);
  const found = searchBooks({ q: question }).slice(0, 3);
  if (found.length) return reply('این کتاب‌ها با پرسش شما مرتبط‌اند:', { books: found });
  if (genre) return assistantAnswer('یک کتاب ' + genre + ' پیشنهاد بده');
  return reply('متأسفم، این را متوجه نشدم. می‌توانید اسم کتاب یا نویسنده را بنویسید یا یکی از این‌ها را امتحان کنید:', { chips: START_CHIPS });
}

/* ---------- صفحهٔ دستیار ---------- */
function botMessageHTML(msg) {
  if (msg.from === 'user') return '<div class="msg msg-user"><p>' + esc(msg.text) + '</p></div>';
  const r = msg.reply;
  return '<div class="msg msg-bot"><span class="bot-avatar" aria-hidden="true">' + icon('sparkles') + '</span><div class="bot-body">' +
    '<div class="bot-text">' + r.html + '</div>' +
    (r.books.length ? '<div class="bot-books">' + r.books.map((b, i) => '<a class="bot-book" href="#book-' + b.id + '">' + coverHTML(b) + '<span><b>' + esc(b.title) + '</b><br><span class="muted small">' + esc(r.notes ? r.notes[i] : b.author) + '</span></span></a>').join('') + '</div>' : '') +
    (r.chips.length ? '<div class="chips">' + r.chips.map(c => '<button class="chip" type="button" data-action="ask" data-q="' + esc(c.ask) + '">' + esc(c.label) + '</button>').join('') + '</div>' : '') +
    '</div></div>';
}
Pages.assistant = {
  title: 'دستیار هوشمند',
  render(param) {
    if (!assistantLog.length) assistantLog.push({ from: 'bot', reply: assistantAnswer('سلام') });
    const book = getBook(param);
    if (book && !assistantAskedBooks.has(book.id)) { assistantAskedBooks.add(book.id); askAssistant('دربارهٔ ' + book.title + ' توضیح بده', true); }
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">دستیار هوش مصنوعی</p>
          <h1>از دستیار کتابخانه بپرسید</h1>
          <p class="lead">کتاب معرفی می‌کند، خلاصه می‌گوید و به سوال‌هایتان جواب می‌دهد. دستیار بدون اینترنت کار می‌کند و جواب‌هایش را از اطلاعات همین کتابخانه می‌سازد.</p>
        </div>
        <section class="chat panel" aria-label="گفت‌وگو با دستیار">
          <div class="chat-log" id="chat-log" aria-live="polite">${assistantLog.map(botMessageHTML).join('')}</div>
          <form class="chat-form" data-form="ask" novalidate>
            <label class="sr-only" for="ask-q">پرسش شما</label>
            <input id="ask-q" class="input" name="q" autocomplete="off" placeholder="مثلاً: خلاصهٔ کیمیاگر، یا: کتاب طنز پیشنهاد بده" maxlength="200">
            <button class="btn" type="submit">${icon('send')}<span class="sr-only">فرستادن</span></button>
          </form>
        </section>
      </div>`;
  },
  mount(root) {
    const log = root.querySelector('#chat-log');
    log.scrollTop = log.scrollHeight;
  }
};
function askAssistant(question, silent) {
  assistantLog.push({ from: 'user', text: question });
  assistantLog.push({ from: 'bot', reply: assistantAnswer(question) });
  if (silent) return;
  const log = document.getElementById('chat-log');
  if (!log) return;
  log.insertAdjacentHTML('beforeend', botMessageHTML(assistantLog[assistantLog.length - 2]) + '<div class="msg msg-bot typing" aria-hidden="true"><span class="bot-avatar">' + icon('sparkles') + '</span><span class="dots"><i></i><i></i><i></i></span></div>');
  log.scrollTop = log.scrollHeight;
  setTimeout(() => {
    const typing = log.querySelector('.typing');
    if (typing) typing.remove();
    log.insertAdjacentHTML('beforeend', botMessageHTML(assistantLog[assistantLog.length - 1]));
    log.scrollTop = log.scrollHeight;
  }, 450);
}
Forms['ask'] = (values, form) => {
  const q = String(values.q || '').trim();
  if (!q) return;
  form.reset();
  askAssistant(q);
};
Actions['ask'] = (data) => {
  if (currentRoute().name !== 'assistant') { assistantLog.push({ from: 'user', text: data.q }, { from: 'bot', reply: assistantAnswer(data.q) }); go('assistant'); return; }
  askAssistant(data.q);
};
