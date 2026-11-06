/* =========================================================
   store-plus.js — منطق امکانات هوشمند کتابخانه
   رزرو، صف انتظار، جریمه، اعلان، علاقه‌مندی، یادداشت، قفسهٔ شخصی، زمان مطالعه،
   برنامهٔ مطالعه، امتیاز و نشان، مأموریت هفتگی، پیشنهاد هوشمند و آمار نمودارها
   ========================================================= */

const HOUR = 60 * 60 * 1000;
const dateKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const startOfDay = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
/* هفته در ایران از شنبه شروع می‌شود */
function weekStart(ts) {
  const d = new Date(startOfDay(ts || Date.now()));
  d.setDate(d.getDate() - (d.getDay() + 1) % 7);
  return d.getTime();
}

/* ---------- وضعیت کتاب: آزاد / در امانت / رزرو ---------- */
function bookState(bookId) {
  const loan = activeLoan(bookId);
  if (loan) return { state: 'loan', loan, reservation: null };
  const reservation = db.reservations.find(r => r.bookId === bookId && r.status === 'waiting') || null;
  return { state: reservation ? 'reserved' : 'free', loan: null, reservation };
}
function userReservations(userId) { return db.reservations.filter(r => r.userId === userId && r.status === 'waiting'); }

/* ---------- رزرو آنلاین ---------- */
function reserveBook(user, bookId) {
  const book = getBook(bookId);
  if (!user) return fail('برای رزرو، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  if (bookState(book.id).state !== 'free') return fail('این کتاب آزاد نیست. می‌توانید در صف انتظارش نوبت بگیرید.');
  if (unpaidFineTotal(user.id) > 0) return fail('اول جریمهٔ دیرکرد خود را از «حساب من» پرداخت کنید.');
  const plan = planOf(user);
  if (userLoans(user.id).length + userReservations(user.id).length >= plan.maxLoans) {
    return fail('با «' + plan.name + '» فقط ' + fa(plan.maxLoans) + ' کتاب را می‌توانید هم‌زمان امانت یا رزرو کنید.');
  }
  const now = Date.now();
  const reservation = { id: newId('r'), bookId: book.id, userId: user.id, created: now, expires: now + RESERVE_HOURS * HOUR, status: 'waiting', fromQueue: false };
  db.reservations.push(reservation);
  leaveQueue(user.id, book.id, true);
  pushNotification(user.id, 'reserve', 'رزرو «' + book.title + '» تأیید شد. تا ' + faDate(reservation.expires) + ' برای تحویل به میز امانت بیایید.', reservation.id);
  saveDB();
  return ok('«' + book.title + '» برای شما رزرو شد. تا ' + fa(RESERVE_HOURS) + ' ساعت فرصت دارید آن را تحویل بگیرید.');
}
function cancelReservation(reservationId, byStaff) {
  const reservation = db.reservations.find(r => r.id === reservationId && r.status === 'waiting');
  if (!reservation) return fail('این رزرو پیدا نشد.');
  reservation.status = 'cancelled';
  const book = getBook(reservation.bookId);
  if (byStaff) pushNotification(reservation.userId, 'reserve', 'رزرو «' + (book ? book.title : 'کتاب') + '» از طرف کتابدار لغو شد.', reservation.id + '-c');
  handleFreedBook(reservation.bookId);
  saveDB();
  return ok('رزرو «' + (book ? book.title : 'کتاب') + '» لغو شد.');
}
/* کتابدار: عضو آمد و کتاب رزروشده را تحویل گرفت */
function confirmPickup(reservationId) {
  const reservation = db.reservations.find(r => r.id === reservationId && r.status === 'waiting');
  if (!reservation) return fail('این رزرو پیدا نشد.');
  return borrowBook(getUser(reservation.userId), reservation.bookId);
}
/* رزروهایی که مهلتشان گذشته لغو می‌شوند */
function expireReservations() {
  let changed = false;
  db.reservations.filter(r => r.status === 'waiting' && r.expires < Date.now()).forEach(r => {
    r.status = 'expired';
    changed = true;
    const book = getBook(r.bookId);
    pushNotification(r.userId, 'reserve', 'مهلت تحویل رزرو «' + (book ? book.title : 'کتاب') + '» تمام شد و رزرو لغو شد.', r.id + '-x');
    handleFreedBook(r.bookId);
  });
  if (changed) saveDB();
}
/* وقتی کتابی آزاد شد، اولین نفر صف برایش رزرو می‌گیرد */
function handleFreedBook(bookId) {
  if (bookState(bookId).state !== 'free') return;
  const next = queueOf(bookId)[0];
  if (!next) return;
  db.queue = db.queue.filter(q => q !== next);
  const now = Date.now();
  const reservation = { id: newId('r'), bookId, userId: next.userId, created: now, expires: now + RESERVE_HOURS * HOUR, status: 'waiting', fromQueue: true };
  db.reservations.push(reservation);
  const book = getBook(bookId);
  pushNotification(next.userId, 'queue', 'نوبت شما رسید! «' + (book ? book.title : 'کتاب') + '» تا ' + fa(RESERVE_HOURS) + ' ساعت برایتان رزرو شد.', reservation.id);
}

/* ---------- صف انتظار ---------- */
function queueOf(bookId) { return db.queue.filter(q => q.bookId === bookId).sort((a, b) => a.joined - b.joined); }
function queuePosition(userId, bookId) { return queueOf(bookId).findIndex(q => q.userId === userId) + 1; }
function joinQueue(user, bookId) {
  const book = getBook(bookId);
  if (!user) return fail('برای نوبت گرفتن، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  const status = bookState(book.id);
  if (status.state === 'free') return fail('این کتاب آزاد است؛ می‌توانید همین حالا امانت یا رزروش کنید.');
  if ((status.loan && status.loan.userId === user.id) || (status.reservation && status.reservation.userId === user.id)) return fail('این کتاب همین حالا مال شماست.');
  if (queuePosition(user.id, book.id)) return fail('شما قبلاً در صف این کتاب هستید.');
  db.queue.push({ id: newId('q'), bookId: book.id, userId: user.id, joined: Date.now() });
  saveDB();
  return ok('در صف «' + book.title + '» قرار گرفتید. نفر ' + fa(queuePosition(user.id, book.id)) + ' هستید و وقتی نوبتتان برسد خبرتان می‌کنیم.');
}
function leaveQueue(userId, bookId, silent) {
  const before = db.queue.length;
  db.queue = db.queue.filter(q => !(q.userId === userId && q.bookId === bookId));
  if (!silent) saveDB();
  return before !== db.queue.length ? ok('از صف خارج شدید.') : fail('شما در این صف نبودید.');
}

/* ---------- جریمهٔ دیرکرد ---------- */
function userFines(userId) {
  return db.loans.filter(l => l.userId === userId && ((l.returned && l.fine && !l.finePaid) || (!l.returned && lateDays(l) > 0)));
}
function unpaidFineTotal(userId) {
  return db.loans.filter(l => l.userId === userId && l.returned && l.fine && !l.finePaid).reduce((sum, l) => sum + l.fine, 0);
}
function payFine(loanId) {
  const loan = db.loans.find(l => l.id === loanId);
  if (!loan || !loan.returned || !loan.fine || loan.finePaid) return fail('جریمهٔ پرداخت‌نشده‌ای برای این امانت نیست.');
  loan.finePaid = true;
  saveDB();
  return ok('جریمهٔ ' + faPrice(loan.fine) + ' تومانی پرداخت شد (نمایشی).');
}

/* ---------- اعلان‌ها ---------- */
let notificationListener = null;   /* app.js با این، اعلان تازه را نشان می‌دهد */
function pushNotification(userId, type, text, ref) {
  if (ref && db.notifications.some(n => n.userId === userId && n.type === type && n.ref === ref)) return;
  const item = { id: newId('n'), userId, type, text, ref: ref || null, date: Date.now(), read: false };
  db.notifications.push(item);
  if (notificationListener && userId === sessionUserId) notificationListener(item);
}
function userNotifications(userId) { return db.notifications.filter(n => n.userId === userId).sort((a, b) => b.date - a.date); }
function unreadCount(userId) { return db.notifications.filter(n => n.userId === userId && !n.read).length; }
function markAllRead(userId) { db.notifications.forEach(n => { if (n.userId === userId) n.read = true; }); saveDB(); }
/* یادآوری زمان برگشت کتاب‌ها (یک بار برای هر امانت) */
function syncNotifications(user) {
  if (!user) return;
  userLoans(user.id).forEach(loan => {
    const book = getBook(loan.bookId);
    const title = book ? book.title : 'کتاب';
    const left = daysLeft(loan.due);
    if (left >= 0 && left <= 2) pushNotification(user.id, 'due', 'یادآوری: مهلت پس دادن «' + title + '» ' + (left === 0 ? 'امروز' : fa(left) + ' روز دیگر') + ' تمام می‌شود.', 'due-' + loan.id);
    if (left < 0) pushNotification(user.id, 'late', '«' + title + '» ' + fa(-left) + ' روز دیر شده است. جریمه روزانه ' + faPrice(FINE_PER_DAY) + ' تومان است.', 'late-' + loan.id);
  });
  saveDB();
}

/* ---------- علاقه‌مندی‌ها و یادداشت‌ها ---------- */
function isFavorite(userId, bookId) { return db.favorites.some(f => f.userId === userId && f.bookId === bookId); }
function toggleFavorite(user, bookId) {
  const book = getBook(bookId);
  if (!user) return fail('برای افزودن به علاقه‌مندی‌ها، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  if (isFavorite(user.id, book.id)) {
    db.favorites = db.favorites.filter(f => !(f.userId === user.id && f.bookId === book.id));
    saveDB();
    return ok('«' + book.title + '» از علاقه‌مندی‌ها برداشته شد.');
  }
  db.favorites.push({ userId: user.id, bookId: book.id, date: Date.now() });
  saveDB();
  return ok('«' + book.title + '» به علاقه‌مندی‌ها اضافه شد.');
}
function userFavorites(userId) { return db.favorites.filter(f => f.userId === userId).sort((a, b) => b.date - a.date).map(f => getBook(f.bookId)).filter(Boolean); }

function addNote(user, bookId, text) {
  text = String(text || '').trim();
  if (!user) return fail('برای یادداشت‌گذاری، اول وارد حساب خود شوید.');
  if (text.length < 2) return fail('متن یادداشت را بنویسید.');
  db.notes.push({ id: newId('t'), userId: user.id, bookId: Number(bookId), text, date: Date.now() });
  checkBadges(user.id);
  saveDB();
  return ok('یادداشت ذخیره شد. فقط خودتان آن را می‌بینید.');
}
function deleteNote(noteId) { db.notes = db.notes.filter(n => n.id !== noteId); saveDB(); return ok('یادداشت حذف شد.'); }
function userNotes(userId, bookId) {
  return db.notes.filter(n => n.userId === userId && (bookId == null || n.bookId === Number(bookId))).sort((a, b) => b.date - a.date);
}

/* ---------- قفسهٔ شخصی: در حال خواندن / می‌خواهم بخوانم / خوانده‌ام ---------- */
const SHELF_NAMES = { reading: 'در حال خواندن', want: 'می‌خواهم بخوانم', read: 'خوانده‌ام' };
function shelfEntry(userId, bookId) { return db.shelves.find(s => s.userId === userId && s.bookId === Number(bookId)) || null; }
function userShelf(userId, status) {
  return db.shelves.filter(s => s.userId === userId && (!status || s.status === status)).sort((a, b) => b.updated - a.updated);
}
function setShelf(user, bookId, status) {
  const book = getBook(bookId);
  if (!user) return fail('برای ساختن قفسهٔ شخصی، اول وارد حساب خود شوید.');
  if (!book) return fail('این کتاب پیدا نشد.');
  let entry = shelfEntry(user.id, book.id);
  if (!status) {
    db.shelves = db.shelves.filter(s => s !== entry);
    saveDB();
    return ok('«' + book.title + '» از قفسهٔ شما برداشته شد.');
  }
  if (!SHELF_NAMES[status]) return fail('این قفسه وجود ندارد.');
  const now = Date.now();
  if (!entry) { entry = { userId: user.id, bookId: book.id, status, progress: 0, added: now, updated: now }; db.shelves.push(entry); }
  entry.status = status;
  entry.updated = now;
  if (status === 'read') { entry.progress = 100; addXP(user.id, 'finish', 30, 'b' + book.id); }
  checkBadges(user.id);
  saveDB();
  return ok('«' + book.title + '» در قفسهٔ «' + SHELF_NAMES[status] + '» گذاشته شد.');
}
function setProgress(user, bookId, percent) {
  if (!user) return fail('اول وارد حساب خود شوید.');
  let entry = shelfEntry(user.id, bookId);
  if (!entry) { setShelf(user, bookId, 'reading'); entry = shelfEntry(user.id, bookId); }
  entry.progress = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  entry.updated = Date.now();
  if (entry.progress === 100 && entry.status !== 'read') return setShelf(user, bookId, 'read');
  saveDB();
  return ok('پیشرفت مطالعه: ' + fa(entry.progress) + '٪');
}

/* ---------- زمان مطالعه (تایمر) و برنامهٔ مطالعه (تقویم) ---------- */
function logReading(user, bookId, minutes, ts) {
  minutes = Math.round(Number(minutes) || 0);
  if (!user) return fail('برای ثبت زمان مطالعه، اول وارد حساب خود شوید.');
  if (minutes < 1) return fail('زمان مطالعه باید دست‌کم ۱ دقیقه باشد.');
  if (minutes > 600) return fail('زمان هر نوبت مطالعه حداکثر ۶۰۰ دقیقه است.');
  const session = { id: newId('z'), userId: user.id, bookId: getBook(bookId) ? Number(bookId) : null, minutes, date: ts || Date.now() };
  db.sessions.push(session);
  const points = Math.floor(minutes / 5);
  if (points) addXP(user.id, 'minutes', points, session.id);
  saveDB();
  return ok(fa(minutes) + ' دقیقه مطالعه ثبت شد' + (points ? ' و ' + fa(points) + ' امتیاز گرفتید.' : '.'));
}
function minutesByDay(userId, days) {
  const today = startOfDay(Date.now());
  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = today - i * DAY;
    const minutes = db.sessions.filter(s => (userId == null || s.userId === userId) && s.date >= day && s.date < day + DAY).reduce((sum, s) => sum + s.minutes, 0);
    rows.push({ date: day, minutes });
  }
  return rows;
}
function readingStreak(userId) {
  let streak = 0;
  let day = startOfDay(Date.now());
  const has = d => db.sessions.some(s => s.userId === userId && s.date >= d && s.date < d + DAY);
  if (!has(day)) day -= DAY;            /* اگر امروز هنوز نخوانده، از دیروز حساب می‌کنیم */
  while (has(day)) { streak += 1; day -= DAY; }
  return streak;
}
function addPlan(user, { date, bookId, minutes, note }) {
  if (!user) return fail('برای برنامه‌ریزی، اول وارد حساب خود شوید.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return fail('روز برنامه را انتخاب کنید.');
  minutes = Math.round(Number(minutes) || 0);
  if (minutes < 5 || minutes > 300) return fail('زمان برنامه باید بین ۵ تا ۳۰۰ دقیقه باشد.');
  db.plans.push({ id: newId('p'), userId: user.id, date, bookId: getBook(bookId) ? Number(bookId) : null, minutes, note: String(note || '').trim(), done: false });
  saveDB();
  return ok('برنامهٔ مطالعه ثبت شد.');
}
function togglePlan(planId) {
  const plan = db.plans.find(p => p.id === planId);
  if (!plan) return fail('این برنامه پیدا نشد.');
  plan.done = !plan.done;
  saveDB();
  return ok(plan.done ? 'برنامه انجام شد. آفرین!' : 'برنامه به حالت انجام‌نشده برگشت.');
}
function deletePlan(planId) { db.plans = db.plans.filter(p => p.id !== planId); saveDB(); return ok('برنامه حذف شد.'); }
function plansOn(userId, key) { return db.plans.filter(p => p.userId === userId && p.date === key); }

/* ---------- امتیاز، سطح، نشان و مأموریت ---------- */
function addXP(userId, type, points, ref) {
  if (!userId || !points) return;
  if (ref && db.activity.some(a => a.userId === userId && a.type === type && a.ref === ref)) return;
  db.activity.push({ id: newId('a'), userId, type, points, ref: ref || null, date: Date.now() });
  checkBadges(userId);
}
function userXP(userId, since) {
  return db.activity.filter(a => a.userId === userId && (!since || a.date >= since)).reduce((sum, a) => sum + a.points, 0);
}
function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i += 1;
  const current = LEVELS[i];
  const next = LEVELS[i + 1];
  return { number: i + 1, name: current.name, min: current.min, next: next ? next.min : null, progress: next ? (xp - current.min) / (next.min - current.min) : 1 };
}
function userStats(userId) {
  const loans = db.loans.filter(l => l.userId === userId);
  const readIds = new Set(db.shelves.filter(s => s.userId === userId && s.status === 'read').map(s => s.bookId));
  const genreSet = new Set();
  readIds.forEach(id => { const b = getBook(id); if (b) genreSet.add(b.genre); });
  loans.filter(l => l.returned).forEach(l => { const b = getBook(l.bookId); if (b) genreSet.add(b.genre); });
  return {
    loans: loans.length,
    onTime: loans.filter(l => l.returned && l.returned <= l.due).length,
    reviews: db.comments.filter(c => c.userId === userId).length,
    minutes: db.sessions.filter(s => s.userId === userId).reduce((sum, s) => sum + s.minutes, 0),
    booksRead: readIds.size,
    genres: genreSet.size,
    donated: db.activity.filter(a => a.userId === userId && a.type === 'donate').length,
    notes: db.notes.filter(n => n.userId === userId).length,
    quizPerfect: db.scores.filter(s => s.userId === userId && s.correct === s.total).length
  };
}
function userBadges(userId) { const stats = userStats(userId); return BADGES.filter(b => b.test(stats)); }
/* اگر نشان تازه‌ای گرفته شد، اعلان می‌دهیم */
function checkBadges(userId) {
  const user = getUser(userId);
  if (!user) return;
  user.badges = user.badges || [];
  userBadges(userId).forEach(badge => {
    if (user.badges.includes(badge.id)) return;
    user.badges.push(badge.id);
    pushNotification(userId, 'badge', 'تبریک! نشان «' + badge.name + '» را گرفتید.', badge.id);
  });
}
function weeklyMetrics(userId) {
  const since = weekStart();
  const mine = list => list.filter(x => x.userId === userId);
  const shelfGenresBefore = new Set(mine(db.shelves).filter(s => s.added < since).map(s => (getBook(s.bookId) || {}).genre));
  mine(db.loans).filter(l => l.start < since).forEach(l => shelfGenresBefore.add((getBook(l.bookId) || {}).genre));
  const newGenres = new Set(mine(db.shelves).filter(s => s.added >= since).map(s => (getBook(s.bookId) || {}).genre).filter(g => g && !shelfGenresBefore.has(g)));
  return {
    minutes: mine(db.sessions).filter(s => s.date >= since).reduce((sum, s) => sum + s.minutes, 0),
    borrows: mine(db.loans).filter(l => l.start >= since).length,
    reviews: mine(db.comments).filter(c => c.date >= since).length,
    ratings: mine(db.activity).filter(a => a.type === 'rate' && a.date >= since).length,
    newGenres: newGenres.size
  };
}
function missionsFor(userId) {
  const metrics = weeklyMetrics(userId);
  const week = weekStart();
  return MISSIONS.map(m => {
    const value = metrics[m.metric] || 0;
    const claimed = db.activity.some(a => a.userId === userId && a.type === 'mission' && a.ref === m.id + '@' + week);
    return Object.assign({}, m, { value, done: value >= m.target, claimed });
  });
}
function claimMission(user, missionId) {
  if (!user) return fail('اول وارد حساب خود شوید.');
  const mission = missionsFor(user.id).find(m => m.id === missionId);
  if (!mission) return fail('این مأموریت پیدا نشد.');
  if (!mission.done) return fail('این مأموریت هنوز کامل نشده است.');
  if (mission.claimed) return fail('جایزهٔ این مأموریت را قبلاً گرفته‌اید.');
  addXP(user.id, 'mission', mission.reward, mission.id + '@' + weekStart());
  saveDB();
  return ok('مأموریت «' + mission.title + '» انجام شد و ' + fa(mission.reward) + ' امتیاز گرفتید!');
}
function xpLeaderboard(period) {
  const since = period === 'week' ? weekStart() : 0;
  return db.users.filter(u => u.role === 'member')
    .map(u => ({ user: u, xp: userXP(u.id, since), level: levelOf(userXP(u.id)) }))
    .sort((a, b) => b.xp - a.xp);
}

/* ---------- بازدید، کتاب هفته، مقایسه ---------- */
const viewedThisVisit = new Set();
function addView(bookId) {
  const book = getBook(bookId);
  if (!book || viewedThisVisit.has(book.id)) return;
  viewedThisVisit.add(book.id);
  book.views += 1;
  saveDB();
}
function bookOfWeek() {
  const list = db.books.slice().sort((a, b) => a.id - b.id);
  return list.length ? list[Math.floor(weekStart() / (7 * DAY)) % list.length] : null;
}
const COMPARE_KEY = 'my-library-compare';
function compareIds() {
  try { return (JSON.parse(storage.get(COMPARE_KEY) || '[]') || []).filter(id => getBook(id)); } catch (e) { return []; }
}
function toggleCompare(bookId) {
  const book = getBook(bookId);
  if (!book) return fail('این کتاب پیدا نشد.');
  let ids = compareIds();
  if (ids.includes(book.id)) ids = ids.filter(id => id !== book.id);
  else {
    if (ids.length >= 4) return fail('حداکثر ۴ کتاب را می‌توانید با هم مقایسه کنید.');
    ids.push(book.id);
  }
  storage.set(COMPARE_KEY, JSON.stringify(ids));
  return ok(ids.includes(book.id) ? '«' + book.title + '» به مقایسه اضافه شد.' : '«' + book.title + '» از مقایسه برداشته شد.');
}
function clearCompare() { storage.set(COMPARE_KEY, '[]'); }

/* ---------- پیشنهاد هوشمند بر اساس سلیقهٔ کاربر ---------- */
function tasteOf(user) {
  const taste = { genre: {}, category: {}, subject: {}, author: {} };
  const add = (book, weight) => {
    if (!book) return;
    taste.genre[book.genre] = (taste.genre[book.genre] || 0) + weight;
    taste.category[book.category] = (taste.category[book.category] || 0) + weight;
    taste.author[book.author] = (taste.author[book.author] || 0) + weight;
    book.subjects.forEach(s => { taste.subject[s] = (taste.subject[s] || 0) + weight; });
  };
  db.favorites.filter(f => f.userId === user.id).forEach(f => add(getBook(f.bookId), 3));
  db.loans.filter(l => l.userId === user.id).forEach(l => add(getBook(l.bookId), 2));
  db.shelves.filter(s => s.userId === user.id).forEach(s => add(getBook(s.bookId), s.status === 'read' ? 2 : 1));
  db.notes.filter(n => n.userId === user.id).forEach(n => add(getBook(n.bookId), 1));
  db.books.forEach(b => { if (b.ratings[user.id]) add(b, (b.ratings[user.id] - 3) * 1.5); });
  (user.prefs && user.prefs.genres || []).forEach(g => { taste.genre[g] = (taste.genre[g] || 0) + 3; });
  return taste;
}
function recommendFor(user, count) {
  if (!user) {
    return db.books.slice().sort((a, b) => rating(b).avg - rating(a).avg).slice(0, count).map(book => ({ book, reason: 'از محبوب‌ترین کتاب‌های کتابخانه' }));
  }
  const taste = tasteOf(user);
  const known = new Set();
  db.loans.filter(l => l.userId === user.id).forEach(l => known.add(l.bookId));
  db.shelves.filter(s => s.userId === user.id && s.status !== 'want').forEach(s => known.add(s.bookId));
  const scored = db.books.filter(b => !known.has(b.id)).map(book => {
    const parts = [
      { score: taste.genre[book.genre] || 0, reason: 'چون به ژانر «' + book.genre + '» علاقه دارید' },
      { score: (taste.author[book.author] || 0) * 1.5, reason: 'چون آثار «' + book.author + '» را دوست دارید' },
      { score: (taste.category[book.category] || 0) * 0.6, reason: 'هم‌دستهٔ کتاب‌هایی که خوانده‌اید' }
    ];
    book.subjects.forEach(s => parts.push({ score: (taste.subject[s] || 0) * 0.5, reason: 'چون موضوع «' + s + '» برایتان جالب است' }));
    const best = parts.reduce((a, b) => (b.score > a.score ? b : a));
    const total = parts.reduce((sum, p) => sum + Math.max(0, p.score), 0) + rating(book).avg * 0.3;
    return { book, score: total, reason: best.score > 0 ? best.reason : 'از کتاب‌های پرامتیاز کتابخانه' };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, count);
}

/* ---------- مدیریت: افزودن، ویرایش و ویژه کردن کتاب ---------- */
function saveBook(values, bookId) {
  const title = String(values.title || '').trim();
  const author = String(values.author || '').trim();
  if (title.length < 2 || author.length < 2) return fail('نام کتاب و نویسنده را بنویسید.');
  if (!CATEGORIES.includes(values.category)) return fail('دستهٔ کتاب را انتخاب کنید.');
  if (!GENRES.includes(values.genre)) return fail('ژانر کتاب را انتخاب کنید.');
  const fields = {
    title, author, category: values.category, genre: values.genre,
    subjects: String(values.subjects || '').split(/[،,]/).map(s => s.trim()).filter(Boolean).slice(0, 8),
    year: String(values.year || '').trim() || '—', origin: String(values.origin || '').trim() || '—',
    ddc: String(values.ddc || '').trim().replace(/[^0-9.]/g, ''),
    description: String(values.description || '').trim() || 'توضیحی برای این کتاب نوشته نشده است.',
    summary: String(values.summary || '').trim()
  };
  let book = bookId ? getBook(bookId) : null;
  if (bookId && !book) return fail('این کتاب پیدا نشد.');
  if (book) Object.assign(book, fields);
  else {
    const id = Math.max(0, ...db.books.map(b => b.id)) + 1;
    book = Object.assign({ id, colors: DONATED_COVERS[id % DONATED_COVERS.length], votes: [0, 0], ratings: {}, addedAt: Date.now(), donatedBy: null, textId: null, featured: false, views: 0, authorId: null }, fields);
    db.books.push(book);
  }
  const author2 = AUTHORS.find(a => norm(a.name) === norm(book.author));
  if (author2) book.authorId = author2.id;
  saveDB();
  return Object.assign(ok(bookId ? '«' + title + '» ویرایش شد.' : '«' + title + '» به کتابخانه اضافه شد.'), { book });
}
function toggleFeatured(bookId) {
  const book = getBook(bookId);
  if (!book) return fail('این کتاب پیدا نشد.');
  book.featured = !book.featured;
  saveDB();
  return ok(book.featured ? '«' + book.title + '» به کتاب‌های ویژه اضافه شد.' : '«' + book.title + '» از ویژه‌ها برداشته شد.');
}

/* ---------- آمار نمودارها ---------- */
/* شروع ماه شمسیِ تاریخ داده‌شده */
function persianMonthStart(ts) { return startOfDay(ts) - (persianParts(ts).day - 1) * DAY; }
function loansPerMonth(count) {
  const months = [];
  let start = persianMonthStart(Date.now());
  for (let i = 0; i < count; i++) {
    const end = i === 0 ? Infinity : months[0].start;
    months.unshift({ start, end });
    start = persianMonthStart(start - DAY);
  }
  return months.map(m => ({ label: persianMonthName(m.start), value: db.loans.filter(l => l.start >= m.start && l.start < m.end).length }));
}
function booksByCategory() { return CATEGORIES.map(c => ({ label: c, value: db.books.filter(b => b.category === c).length })); }
function membersByPlan() { return PLANS.map(p => ({ label: p.name, value: db.users.filter(u => u.role === 'member' && planOf(u).id === p.id).length })); }
function topBooksByLoans(count) {
  return db.books.map(b => ({ label: b.title, value: bookHistory(b.id).length })).sort((a, b) => b.value - a.value).slice(0, count);
}
function minutesPerWeek(count) {
  const rows = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = weekStart() - i * 7 * DAY;
    rows.push({ label: faDateShort(start).split('/').slice(1).join('/'), value: db.sessions.filter(s => s.date >= start && s.date < start + 7 * DAY).reduce((sum, s) => sum + s.minutes, 0) });
  }
  return rows;
}

/* ---------- اطلاعات نمونهٔ امکانات هوشمند (فقط بار اول) ---------- */
function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedSmartData(s, at) {
  const rnd = seededRandom(1405);
  const pick = list => list[Math.floor(rnd() * list.length)];
  const members = ['u2', 'u3', 'u4', 'u5'];
  let n = 0;
  const id = p => p + 's' + (++n);

  /* امانت‌های شش ماه گذشته (برای نمودار و تاریخچه) */
  for (let d = 178; d > 72; d -= 3 + Math.floor(rnd() * 5)) {
    const start = at(-d);
    const kept = 10 + Math.floor(rnd() * 8);
    const fine = Math.max(0, kept - 14) * FINE_PER_DAY;
    s.loans.push({ id: id('l'), bookId: 1 + Math.floor(rnd() * 20), userId: pick(members), start, due: start + 14 * DAY, returned: start + kept * DAY, fine, finePaid: true });
  }
  /* جریمهٔ پرداخت‌نشدهٔ امیرحسین */
  s.loans.push({ id: id('l'), bookId: 12, userId: 'u5', start: at(-24), due: at(-14), returned: at(-11), fine: 3 * FINE_PER_DAY, finePaid: false });

  s.reservations.push({ id: id('r'), bookId: 14, userId: 'u2', created: at(-5 / 24), expires: at(-5 / 24) + RESERVE_HOURS * HOUR, status: 'waiting', fromQueue: false });
  s.queue.push({ id: id('q'), bookId: 11, userId: 'u3', joined: at(-3) }, { id: id('q'), bookId: 11, userId: 'u5', joined: at(-1) }, { id: id('q'), bookId: 16, userId: 'u2', joined: at(-2) });

  [['u2', [10, 3, 17]], ['u3', [1, 18, 13]], ['u4', [8, 9]], ['u5', [11, 16]]].forEach(([userId, ids]) => {
    ids.forEach((bookId, i) => s.favorites.push({ userId, bookId, date: at(-10 - i) }));
  });
  const shelf = (userId, bookId, status, progress, daysAgo) => s.shelves.push({ userId, bookId, status, progress, added: at(-daysAgo - 20), updated: at(-daysAgo) });
  shelf('u2', 3, 'reading', 40, 1); shelf('u2', 6, 'reading', 15, 2); shelf('u2', 10, 'read', 100, 30); shelf('u2', 11, 'read', 100, 20);
  shelf('u2', 9, 'read', 100, 14); shelf('u2', 17, 'want', 0, 5); shelf('u2', 19, 'want', 0, 6);
  shelf('u3', 10, 'reading', 60, 1); shelf('u3', 1, 'read', 100, 40); shelf('u3', 20, 'read', 100, 12); shelf('u3', 18, 'want', 0, 3);
  shelf('u5', 16, 'reading', 30, 2); shelf('u5', 10, 'read', 100, 33); shelf('u4', 11, 'reading', 70, 1);

  s.notes.push({ id: id('t'), userId: 'u2', bookId: 10, text: 'گفت‌وگوی شازده کوچولو با روباه را دوباره بخوانم.', date: at(-25) });
  s.notes.push({ id: id('t'), userId: 'u2', bookId: 3, text: 'غزل نخست را برای انشای کلاس حفظ کنم.', date: at(-2) });
  s.notes.push({ id: id('t'), userId: 'u3', bookId: 1, text: 'برای کنفرانس کلاس: داستان رستم و سهراب.', date: at(-38) });

  /* زمان مطالعهٔ ۸ هفتهٔ گذشته */
  [['u2', 0.85, 15, 55, [3, 6]], ['u3', 0.6, 20, 45, [10]], ['u5', 0.35, 10, 30, [16]], ['u4', 0.25, 10, 25, [11]]].forEach(([userId, chance, min, max, books]) => {
    for (let d = 55; d >= 0; d--) {
      if (rnd() > chance) continue;
      s.sessions.push({ id: id('z'), userId, bookId: pick(books), minutes: min + Math.floor(rnd() * (max - min)), date: at(-d) - (d === 0 ? 2 * HOUR : 0) });
    }
  });
  const today = dateKey(Date.now());
  s.plans.push({ id: id('p'), userId: 'u2', date: dateKey(at(1)), bookId: 3, minutes: 30, note: 'دو غزل تازه', done: false });
  s.plans.push({ id: id('p'), userId: 'u2', date: dateKey(at(3)), bookId: 6, minutes: 45, note: '', done: false });
  s.plans.push({ id: id('p'), userId: 'u2', date: today, bookId: 3, minutes: 20, note: '', done: false });
  s.plans.push({ id: id('p'), userId: 'u2', date: dateKey(at(-2)), bookId: 6, minutes: 30, note: '', done: true });

  /* امتیازها از روی کارهای انجام‌شده ساخته می‌شوند */
  const xp = (userId, type, points, ref, date) => s.activity.push({ id: id('a'), userId, type, points, ref, date });
  s.loans.forEach(l => {
    xp(l.userId, 'borrow', 10, l.id, l.start);
    if (l.returned && l.returned <= l.due) xp(l.userId, 'ontime', 15, l.id, l.returned);
  });
  s.comments.forEach(c => xp(c.userId, 'review', 10, c.id, c.date));
  s.sessions.forEach(z => { if (z.minutes >= 5) xp(z.userId, 'minutes', Math.floor(z.minutes / 5), z.id, z.date); });
  s.scores.forEach(q => { if (q.userId) xp(q.userId, 'quiz', q.correct * 5, q.id, q.date); });
  s.shelves.filter(e => e.status === 'read').forEach(e => xp(e.userId, 'finish', 30, 'b' + e.bookId, e.updated));

  s.notifications.push({ id: id('n'), userId: 'u2', type: 'welcome', text: 'به باشگاه کتاب‌خوان‌ها خوش آمدید! مأموریت‌های این هفته منتظر شماست.', ref: null, date: at(-2), read: true });
  s.notifications.push({ id: id('n'), userId: 'u2', type: 'reserve', text: 'رزرو «بینوایان» تأیید شد. تا دو روز دیگر برای تحویل به میز امانت بیایید.', ref: null, date: at(-5 / 24), read: false });

  /* نشان‌هایی که اعضا از قبل دارند (بدون اعلان) */
  const saved = db;
  db = s;
  s.users.forEach(u => { u.badges = userBadges(u.id).map(b => b.id); });
  db = saved;
}
