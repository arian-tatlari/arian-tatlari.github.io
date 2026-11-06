/* =========================================================
   store.js — «پایگاه داده»ی برنامه
   همهٔ اطلاعات (کتاب‌ها، اعضا، امانت‌ها، نظرها و ...) در localStorage مرورگر ذخیره می‌شود؛
   یعنی پروژه بدون سرور کار می‌کند. هر تابع این فایل یک کار مشخص انجام می‌دهد.
   امکانات هوشمند (رزرو، صف، امتیاز، اعلان و ...) در store-plus.js هستند.
   ========================================================= */

const DAY = 24 * 60 * 60 * 1000;
const STORE_KEY = 'my-library-db-v2';     /* نسخهٔ ۲: با امکانات هوشمند */
const SESSION_KEY = 'my-library-session';

/* اگر مرورگر اجازهٔ ذخیره ندهد (مثلاً حالت ناشناس)، برنامه بدون خطا در حافظهٔ موقت کار می‌کند */
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ذخیره نشد؛ مشکلی نیست */ } },
  remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ... */ } }
};

/* ---------- ساختن اطلاعات اولیه از فایل‌های data ---------- */
function bookExtras(id) {
  const x = BOOK_EXTRAS[id] || {};
  return {
    genre: x.genre || GENRES[0], subjects: (x.subjects || []).slice(), year: x.year || '—', summary: x.summary || '',
    textId: x.textId || null, featured: !!x.featured, views: x.views || 0, authorId: x.authorId || null
  };
}
function createSeedDB() {
  const now = Date.now();
  const at = days => now + days * DAY;
  const seeded = {
    nextId: 100,
    books: SEED_BOOKS.map(b => Object.assign({
      id: b.id, title: b.title, author: b.author, category: b.category, origin: b.origin,
      ddc: b.ddc, colors: b.colors, description: b.description,
      votes: b.votes.slice(), ratings: {}, addedAt: at(-b.addedDaysAgo), donatedBy: null
    }, bookExtras(b.id))),
    users: SEED_USERS.map(u => ({
      id: u.id, name: u.name, username: u.username, password: u.password, role: u.role,
      plan: u.plan, planUntil: u.planDays ? at(u.planDays) : null, joinedAt: at(-u.joinedDaysAgo),
      prefs: { genres: (u.genres || []).slice() }
    })),
    loans: SEED_LOANS.map((l, i) => ({
      id: 'l' + (i + 1), bookId: l.bookId, userId: l.userId,
      start: at(l.start), due: at(l.due), returned: l.returned === null ? null : at(l.returned), fine: 0, finePaid: true
    })),
    comments: SEED_COMMENTS.map((c, i) => ({ id: 'c' + (i + 1), bookId: c.bookId, userId: c.userId, text: c.text, date: at(-c.daysAgo) })),
    feedback: SEED_FEEDBACK.map((f, i) => ({
      id: 'f' + (i + 1), type: f.type, userId: f.userId, name: f.name, text: f.text,
      likes: f.likes.slice(), status: f.status, date: at(-f.daysAgo)
    })),
    scores: SEED_SCORES.map((s, i) => ({ id: 's' + (i + 1), userId: s.userId, name: s.name, score: s.score, correct: s.score, total: s.total, date: at(-s.daysAgo) })),
    messages: [], gifts: [],
    reservations: [], queue: [], favorites: [], notes: [], shelves: [], sessions: [], plans: [], activity: [], notifications: []
  };
  seedSmartData(seeded, at);   /* store-plus.js: تاریخچه، قفسه‌ها، زمان مطالعه، امتیازها و ... */
  return seeded;
}

function loadDB() {
  const raw = storage.get(STORE_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.books) && Array.isArray(saved.activity)) return saved;
    } catch (e) { /* اطلاعات خراب بود؛ از نو می‌سازیم */ }
  }
  const fresh = createSeedDB();
  storage.set(STORE_KEY, JSON.stringify(fresh));
  return fresh;
}

let db = null;
let sessionUserId = null;
/* app.js این تابع را موقع شروع صدا می‌زند (بعد از بارگذاری همهٔ فایل‌ها) */
function initDB() {
  db = loadDB();
  sessionUserId = storage.get(SESSION_KEY);
}
function saveDB() { storage.set(STORE_KEY, JSON.stringify(db)); }
function newId(prefix) { db.nextId += 1; return prefix + db.nextId; }
function resetDB() {
  db = createSeedDB();
  saveDB();
  sessionUserId = null;
  storage.remove(SESSION_KEY);
}
const ok = msg => ({ ok: true, msg });
const fail = msg => ({ ok: false, msg });

/* ---------- ابزارهای نمایش (عدد فارسی، تاریخ شمسی، ...) ---------- */
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function fa(value) { return String(value).replace(/\d/g, d => FA_DIGITS[d]); }
function faPrice(n) { return fa(Number(n).toLocaleString('en-US')).replace(/,/g, '٬'); }
function faDate(ts) {
  try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ts)); }
  catch (e) { return new Date(ts).toLocaleDateString(); }
}
function faDateShort(ts) {
  try { return new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(ts)); }
  catch (e) { return new Date(ts).toLocaleDateString(); }
}
/* تاریخ شمسی با ارقام لاتین؛ برای حساب فصل، ماه و تقویم */
function persianParts(ts) {
  try {
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ts || Date.now()));
    const get = type => Number((parts.find(p => p.type === type) || {}).value);
    return { year: get('year'), month: get('month'), day: get('day') };
  } catch (e) { return { year: 1405, month: 8, day: 1 }; }
}
function persianMonthName(ts) {
  try { return new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(ts)); } catch (e) { return ''; }
}
function seasonName(month) { return ['بهار', 'تابستان', 'پاییز', 'زمستان'][Math.floor((month - 1) / 3)] || 'پاییز'; }
function daysLeft(ts) { return Math.ceil((ts - Date.now()) / DAY); }
function timeAgo(ts) {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 60) return minutes < 1 ? 'همین حالا' : fa(minutes) + ' دقیقه پیش';
  if (minutes < 24 * 60) return fa(Math.floor(minutes / 60)) + ' ساعت پیش';
  const days = Math.floor(minutes / (24 * 60));
  if (days === 1) return 'دیروز';
  if (days < 30) return fa(days) + ' روز پیش';
  if (days < 365) return fa(Math.floor(days / 30)) + ' ماه پیش';
  return fa(Math.floor(days / 365)) + ' سال پیش';
}
function ddcFa(ddc) { return ddc ? fa(String(ddc).replace('.', '/')) : 'رده‌بندی نشده'; }
function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/* یکسان‌سازی متن برای جست‌وجو: ی و ک عربی، اعراب، نیم‌فاصله و ارقام فارسی */
function norm(text) {
  return String(text || '').toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه').replace(/[أإآ]/g, 'ا').replace(/ؤ/g, 'و')
    .replace(/[ً-ٰٕ]/g, '')
    .replace(/[‌‎‏]/g, '')
    .replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/\//g, '.')
    .replace(/[؟?!،,.:؛«»"()]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/* ---------- کاربران و ورود ---------- */
function currentUser() { return db.users.find(u => u.id === sessionUserId) || null; }
function getUser(id) { return db.users.find(u => u.id === id) || null; }
function isAdmin(user) { return !!user && user.role === 'admin'; }
function isStaff(user) { return !!user && (user.role === 'admin' || user.role === 'librarian'); }
function memberNo(user) {
  const index = db.users.indexOf(user);
  return fa(String(index + 1).padStart(4, '0')) + '-' + fa(String(new Date(user.joinedAt).getFullYear()).slice(2));
}

function register({ name, username, password, genres }) {
  name = String(name || '').trim();
  username = String(username || '').trim().toLowerCase();
  if (name.length < 3) return fail('نام و نام خانوادگی را کامل بنویسید.');
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return fail('نام کاربری باید ۳ تا ۲۰ حرف انگلیسی یا عدد باشد.');
  if (String(password || '').length < 4) return fail('رمز عبور باید دست‌کم ۴ حرف باشد.');
  if (db.users.some(u => u.username === username)) return fail('این نام کاربری قبلاً گرفته شده است. یک نام دیگر انتخاب کنید.');
  /* در یک پروژهٔ واقعی، رمز عبور باید روی سرور و به‌صورت رمزنگاری‌شده (هش) ذخیره شود */
  const user = {
    id: newId('u'), name, username, password: String(password), role: 'member', plan: 'free', planUntil: null,
    joinedAt: Date.now(), prefs: { genres: (genres || []).filter(g => GENRES.includes(g)) }
  };
  db.users.push(user);
  pushNotification(user.id, 'welcome', 'به کتابخانهٔ من خوش آمدید! از «باشگاه» مأموریت‌های این هفته را ببینید.');
  saveDB();
  setSession(user.id);
  return ok('خوش آمدید ' + name + '! عضویت رایگان شما فعال شد.');
}
function login(username, password) {
  username = String(username || '').trim().toLowerCase();
  const user = db.users.find(u => u.username === username);
  if (!user || user.password !== String(password || '')) return fail('نام کاربری یا رمز عبور درست نیست.');
  setSession(user.id);
  return ok('سلام ' + user.name + '، خوش آمدید!');
}
function logout() { setSession(null); }
function setSession(userId) {
  sessionUserId = userId;
  if (userId) storage.set(SESSION_KEY, userId); else storage.remove(SESSION_KEY);
}

/* ---------- اشتراک ---------- */
function planOf(user) {
  if (!user) return PLANS[0];
  const plan = PLANS.find(p => p.id === user.plan) || PLANS[0];
  if (plan.id !== 'free' && (!user.planUntil || user.planUntil < Date.now())) return PLANS[0];
  return plan;
}
function buyPlan(user, planId) {
  const plan = PLANS.find(p => p.id === planId);
  if (!user) return fail('برای خرید اشتراک، اول وارد حساب خود شوید.');
  if (!plan || plan.id === 'free') return fail('این اشتراک پیدا نشد.');
  const current = planOf(user);
  /* اگر همین اشتراک فعال است، مدتش تمدید می‌شود */
  const from = current.id === plan.id ? user.planUntil : Date.now();
  user.plan = plan.id;
  user.planUntil = from + plan.days * DAY;
  saveDB();
  return ok('«' + plan.name + '» تا ' + faDate(user.planUntil) + ' فعال شد.');
}

/* ---------- کتاب‌ها، وضعیت و امتیاز ---------- */
function getBook(id) { return db.books.find(b => b.id === Number(id)) || null; }
function activeLoan(bookId) { return db.loans.find(l => l.bookId === bookId && !l.returned) || null; }
function userLoans(userId) { return db.loans.filter(l => l.userId === userId && !l.returned).sort((a, b) => a.due - b.due); }
function userHistory(userId) { return db.loans.filter(l => l.userId === userId && l.returned).sort((a, b) => b.returned - a.returned); }
function bookHistory(bookId) { return db.loans.filter(l => l.bookId === bookId).sort((a, b) => b.start - a.start); }
function rating(book) {
  const mine = Object.values(book.ratings || {});
  const count = book.votes[0] + mine.length;
  const sum = book.votes[1] + mine.reduce((a, b) => a + b, 0);
  return { avg: count ? sum / count : 0, count };
}
function rateBook(user, bookId, stars) {
  const book = getBook(bookId);
  if (!user) return fail('برای امتیاز دادن، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  const first = !book.ratings[user.id];
  book.ratings[user.id] = Math.min(5, Math.max(1, Number(stars)));
  if (first) addXP(user.id, 'rate', 2, 'b' + book.id);
  saveDB();
  return ok('امتیاز ' + fa(book.ratings[user.id]) + ' از ۵ برای «' + book.title + '» ثبت شد.');
}

/* جست‌وجوی ساده (کلمات کلیدی) و پیشرفته (نام، نویسنده، موضوع، ژانر) + فیلتر وضعیت و مرتب‌سازی */
function searchBooks({ q = '', category = 'all', genre = 'all', status = 'all', sort = 'new', title = '', author = '', subject = '' } = {}) {
  const words = norm(q).split(' ').filter(Boolean);
  const t = norm(title), a = norm(author), s = norm(subject);
  const list = db.books.filter(book => {
    if (category !== 'all' && book.category !== category) return false;
    if (genre !== 'all' && book.genre !== genre) return false;
    if (status !== 'all' && bookState(book.id).state !== status) return false;
    if (t && !norm(book.title).includes(t)) return false;
    if (a && !norm(book.author).includes(a)) return false;
    if (s && !norm([book.subjects.join(' '), book.category, book.genre].join(' ')).includes(s)) return false;
    if (!words.length) return true;
    const haystack = norm([book.title, book.author, book.category, book.genre, book.subjects.join(' '), book.origin, book.description, book.ddc, book.year, book.donatedBy].join(' '));
    return words.every(word => haystack.includes(word));
  });
  const sorters = {
    new: (x, y) => y.addedAt - x.addedAt,
    rating: (x, y) => rating(y).avg - rating(x).avg,
    title: (x, y) => x.title.localeCompare(y.title, 'fa'),
    popular: (x, y) => bookHistory(y.id).length - bookHistory(x.id).length,
    views: (x, y) => y.views - x.views
  };
  return list.sort(sorters[sort] || sorters.new);
}

/* ---------- امانت گرفتن و پس دادن ---------- */
function borrowBook(user, bookId) {
  const book = getBook(bookId);
  if (!user) return fail('برای امانت گرفتن، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  const status = bookState(book.id);
  if (status.state === 'loan') return fail('این کتاب الان در امانت است. می‌توانید در صف انتظارش نوبت بگیرید.');
  if (status.state === 'reserved' && status.reservation.userId !== user.id) return fail('این کتاب برای عضو دیگری رزرو شده است. می‌توانید نوبت بگیرید.');
  if (unpaidFineTotal(user.id) > 0) return fail('اول جریمهٔ دیرکرد خود را از «حساب من» پرداخت کنید.');
  const plan = planOf(user);
  const myReservation = status.state === 'reserved' ? status.reservation : null;
  const busy = userLoans(user.id).length + userReservations(user.id).filter(r => r !== myReservation).length;
  if (busy >= plan.maxLoans) {
    return fail('با «' + plan.name + '» فقط ' + fa(plan.maxLoans) + ' کتاب را می‌توانید هم‌زمان امانت یا رزرو کنید. اول یکی را پس بدهید یا اشتراک بیشتری بگیرید.');
  }
  if (myReservation) myReservation.status = 'picked';
  const now = Date.now();
  const loan = { id: newId('l'), bookId: book.id, userId: user.id, start: now, due: now + plan.loanDays * DAY, returned: null, fine: 0, finePaid: true };
  db.loans.push(loan);
  leaveQueue(user.id, book.id, true);
  addXP(user.id, 'borrow', 10, loan.id);
  saveDB();
  return ok('«' + book.title + '» امانت گرفته شد. مهلت پس دادن: ' + faDate(loan.due));
}
/* جریمهٔ یک امانت: برای کتاب‌های برگشته ثبت‌شده است، برای بقیه هر روز بیشتر می‌شود */
function lateDays(loan) {
  const end = loan.returned || Date.now();
  return Math.max(0, Math.ceil((end - loan.due) / DAY));
}
function fineOf(loan) { return loan.returned ? (loan.fine || 0) : lateDays(loan) * FINE_PER_DAY; }

function returnBook(loanId) {
  const loan = db.loans.find(l => l.id === loanId && !l.returned);
  if (!loan) return fail('این امانت پیدا نشد.');
  loan.returned = Date.now();
  const book = getBook(loan.bookId);
  const title = book ? book.title : 'کتاب';
  const late = lateDays(loan);
  let msg = '«' + title + '» پس داده شد. ممنون!';
  if (late > 0) {
    loan.fine = late * FINE_PER_DAY;
    loan.finePaid = false;
    msg = '«' + title + '» با ' + fa(late) + ' روز تأخیر پس داده شد. جریمه: ' + faPrice(loan.fine) + ' تومان.';
    pushNotification(loan.userId, 'fine', 'برای ' + fa(late) + ' روز تأخیر در پس دادن «' + title + '»، ' + faPrice(loan.fine) + ' تومان جریمه ثبت شد.', loan.id);
  } else {
    addXP(loan.userId, 'ontime', 15, loan.id);
  }
  handleFreedBook(loan.bookId);   /* اگر کسی در صف بود، کتاب برایش رزرو می‌شود */
  saveDB();
  return ok(msg);
}

/* ---------- نظر دربارهٔ کتاب ---------- */
function addComment(user, bookId, text) {
  text = String(text || '').trim();
  if (!user) return fail('برای نوشتن نظر، اول وارد حساب خود شوید.');
  if (text.length < 3) return fail('نظرتان را کمی کامل‌تر بنویسید.');
  const comment = { id: newId('c'), bookId: Number(bookId), userId: user.id, text, date: Date.now() };
  db.comments.push(comment);
  addXP(user.id, 'review', 10, comment.id);
  saveDB();
  return ok('نظر شما ثبت شد.');
}
function bookComments(bookId) { return db.comments.filter(c => c.bookId === Number(bookId)).sort((a, b) => b.date - a.date); }
function deleteComment(id) { db.comments = db.comments.filter(c => c.id !== id); saveDB(); return ok('نظر حذف شد.'); }

/* ---------- اهدا، هدیه و حذف کتاب ---------- */
function donateBook({ title, author, category, genre, description, donor }) {
  title = String(title || '').trim();
  author = String(author || '').trim();
  donor = String(donor || '').trim();
  if (title.length < 2 || author.length < 2 || donor.length < 2) return fail('نام کتاب، نویسنده و نام اهداکننده را بنویسید.');
  const id = Math.max(0, ...db.books.map(b => b.id)) + 1;
  const book = {
    id, title, author, category: CATEGORIES.includes(category) ? category : CATEGORIES[0], origin: 'اهدایی',
    ddc: '', colors: DONATED_COVERS[id % DONATED_COVERS.length],
    description: String(description || '').trim() || 'این کتاب را یکی از دوستداران کتاب به کتابخانه اهدا کرده است.',
    votes: [0, 0], ratings: {}, addedAt: Date.now(), donatedBy: donor,
    genre: GENRES.includes(genre) ? genre : GENRES[4], subjects: [], year: '—', summary: '', textId: null, featured: false, views: 0, authorId: null
  };
  db.books.push(book);
  if (sessionUserId) addXP(sessionUserId, 'donate', 20, 'b' + id);
  saveDB();
  return Object.assign(ok('«' + title + '» به کتابخانه اضافه شد. ممنون از اهدای شما!'), { book });
}
function createGift({ bookId, friend, message, from }) {
  const book = getBook(bookId);
  friend = String(friend || '').trim();
  from = String(from || '').trim();
  if (!book) return fail('یک کتاب انتخاب کنید.');
  if (friend.length < 2 || from.length < 2) return fail('نام خودتان و نام دوستتان را بنویسید.');
  const code = 'KM-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const gift = { id: newId('g'), bookId: book.id, friend, from, message: String(message || '').trim(), code, date: Date.now(), userId: sessionUserId };
  db.gifts.push(gift);
  saveDB();
  return Object.assign(ok('کارت هدیه ساخته شد.'), { gift });
}
function deleteBook(bookId) {
  const book = getBook(bookId);
  if (!book) return fail('این کتاب پیدا نشد.');
  const loan = activeLoan(book.id);
  if (loan) {
    const user = getUser(loan.userId);
    return fail('«' + book.title + '» الان در امانت ' + (user ? user.name : 'یک عضو') + ' است. اول باید پس داده شود.');
  }
  const keep = item => item.bookId !== book.id;
  db.books = db.books.filter(b => b.id !== book.id);
  ['comments', 'loans', 'reservations', 'queue', 'favorites', 'notes', 'shelves', 'plans'].forEach(key => { db[key] = db[key].filter(keep); });
  saveDB();
  return ok('«' + book.title + '» از کتابخانه حذف شد.');
}

/* ---------- نظرات و پیشنهادات، پیام‌ها و مسابقه ---------- */
function addFeedback({ type, name, text }) {
  name = String(name || '').trim();
  text = String(text || '').trim();
  if (!FEEDBACK_TYPES[type]) return fail('نوع پیام را انتخاب کنید.');
  if (name.length < 2 || text.length < 5) return fail('نام و متن پیشنهاد را کامل بنویسید.');
  db.feedback.push({ id: newId('f'), type, userId: sessionUserId, name, text, likes: [], status: 'review', date: Date.now() });
  saveDB();
  return ok('ممنون! پیام شما ثبت شد و مدیر کتابخانه آن را بررسی می‌کند.');
}
function toggleLike(feedbackId, user) {
  const item = db.feedback.find(f => f.id === feedbackId);
  if (!user) return fail('برای پسندیدن، اول وارد حساب خود شوید.');
  if (!item) return fail('این پیام پیدا نشد.');
  const i = item.likes.indexOf(user.id);
  if (i >= 0) item.likes.splice(i, 1); else item.likes.push(user.id);
  saveDB();
  return ok(i >= 0 ? 'پسند برداشته شد.' : 'پسندیدید.');
}
function setFeedbackStatus(id, status) {
  const item = db.feedback.find(f => f.id === id);
  if (item) { item.status = status; saveDB(); }
  return ok(status === 'done' ? 'به «بررسی شد» تغییر کرد.' : 'به «در حال بررسی» برگشت.');
}
function deleteFeedback(id) { db.feedback = db.feedback.filter(f => f.id !== id); saveDB(); return ok('پیام حذف شد.'); }

function addMessage({ name, contact, subject, text }) {
  name = String(name || '').trim();
  contact = String(contact || '').trim();
  text = String(text || '').trim();
  if (name.length < 2 || contact.length < 5 || text.length < 5) return fail('همهٔ بخش‌های فرم را کامل کنید.');
  db.messages.push({ id: newId('m'), name, contact, subject: String(subject || 'سوال'), text, date: Date.now(), read: false });
  saveDB();
  return ok('پیام شما رسید. پاسخ را از طریق «' + contact + '» می‌گیرید.');
}
/* correct = تعداد جواب درست، score = امتیاز جدول مسابقه (برای اشتراک سالانه دو برابر) */
function saveScore(user, name, correct, total) {
  const score = planOf(user).id === 'yearly' ? correct * 2 : correct;
  db.scores.push({ id: newId('s'), userId: user ? user.id : null, name, score, correct, total, date: Date.now() });
  if (user) addXP(user.id, 'quiz', correct * 5, 'quiz-' + Date.now());
  saveDB();
  return ok('امتیاز شما (' + fa(score) + ') در جدول ثبت شد.');
}
function leaderboard() {
  return db.scores.slice().sort((a, b) => b.score - a.score || a.date - b.date).slice(0, 10);
}
