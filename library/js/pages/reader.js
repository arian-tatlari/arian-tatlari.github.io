/* =========================================================
   کتاب‌خوان آنلاین — خواندن متن‌های مجاز، حالت بدون حواس‌پرتی،
   خواندن با صدا (تبدیل متن به گفتار) و پخش فایل کتاب صوتی
   ========================================================= */

const readerPrefs = (() => { try { return JSON.parse(storage.get('my-library-reader')) || {}; } catch (e) { return {}; } })();
readerPrefs.size = readerPrefs.size || 1.3;
readerPrefs.mode = readerPrefs.mode || 'paper';
let readerLocalText = null;           /* متن فایلی که کاربر از کامپیوتر باز کرده */
let readerScrollHandler = null;
let readerKeyHandler = null;

function saveReaderPrefs() { storage.set('my-library-reader', JSON.stringify(readerPrefs)); }

/* متن قابل خواندن: یا متن کامل اثر کهن، یا خلاصه و توضیح کتاب */
function readerContent(book) {
  if (book && book.textId && TEXTS[book.textId]) return { title: TEXTS[book.textId].title, parts: TEXTS[book.textId].parts, full: true };
  if (book) return { title: book.title, parts: [{ heading: 'خلاصه' }, { p: book.summary || book.description }, { heading: 'دربارهٔ کتاب' }, { p: book.description }], full: false };
  if (readerLocalText) return { title: readerLocalText.name, parts: readerLocalText.text.split(/\n\s*\n/).map(p => ({ p: p.trim() })).filter(x => x.p), full: true };
  return null;
}
function partsHTML(parts) {
  return parts.map(part => {
    if (part.heading) return `<h2>${esc(part.heading)}</h2>`;
    if (part.verse) return `<div class="verses">${part.verse.map(b => `<p class="beyt"><span>${esc(b[0])}</span><span>${esc(b[1])}</span></p>`).join('')}</div>`;
    return `<p>${esc(part.p)}</p>`;
  }).join('');
}
function partsText(parts) {
  return parts.map(p => p.heading || (p.verse ? p.verse.map(b => b.join('، ')).join('. ') : p.p)).join('. ');
}
function persianVoices() { return window.speechSynthesis ? speechSynthesis.getVoices().filter(v => /^fa/i.test(v.lang)) : []; }

Pages.read = {
  title: 'کتاب‌خوان آنلاین',
  render(param) {
    const book = getBook(param);
    const content = readerContent(book);
    const permitted = db.books.filter(b => b.textId);
    if (!content) {
      return `
        <div class="wrap">
          <div class="page-head">
            <p class="eyebrow">کتاب‌خوان آنلاین</p>
            <h1>کتاب‌های مجاز برای خواندن آنلاین</h1>
            <p class="lead">متن کامل فقط برای آثار کهن فارسی که حق نشر ندارند در دسترس است. فایل متنی مجاز خودتان را هم می‌توانید اینجا باز کنید.</p>
          </div>
          <div class="book-grid">${permitted.map(b => `<a class="book-card-link" href="#read-${b.id}">${coverHTML(b)}<span class="book-card-title">${esc(b.title)}</span></a>`).join('')}</div>
          <div class="panel" style="margin-top:24px">
            <h2>باز کردن فایل متنی مجاز</h2>
            <p class="muted small">فقط فایل‌هایی را باز کنید که حق خواندنشان را دارید (مثلاً متن‌های آزاد یا نوشته‌های خودتان). فایل از کامپیوتر شما بیرون نمی‌رود.</p>
            <label class="btn btn-ghost" style="margin-top:10px">${icon('upload')} انتخاب فایل txt<input type="file" accept=".txt,text/plain" data-text-file hidden></label>
          </div>
        </div>`;
    }
    this.title = 'خواندن ' + content.title;
    const voices = persianVoices();
    return `
      <div class="reader-page" data-reader-mode="${readerPrefs.mode}" style="--reader-size:${readerPrefs.size}rem">
        <div class="reader-progress" aria-hidden="true"><span id="reader-bar"></span></div>
        <div class="wrap">
          <div class="reader-bar" role="toolbar" aria-label="تنظیمات کتاب‌خوان">
            ${book ? `<a class="btn btn-sm btn-ghost" href="#book-${book.id}">${icon('arrow')} برگشت</a>` : `<button class="btn btn-sm btn-ghost" type="button" data-action="reader-close-local">${icon('close')} بستن فایل</button>`}
            <span class="reader-title">${esc(content.title)}</span>
            <span class="reader-tools">
              <button class="mini-btn" type="button" data-action="reader-size" data-step="-0.1" title="کوچک کردن متن">${icon('minus')}<span class="sr-only">کوچک کردن متن</span></button>
              <button class="mini-btn" type="button" data-action="reader-size" data-step="0.1" title="بزرگ کردن متن">${icon('plus')}<span class="sr-only">بزرگ کردن متن</span></button>
              ${[['paper', 'روشن'], ['sepia', 'کاغذی'], ['night', 'شب']].map(([m, label]) => `<button class="chip" type="button" data-action="reader-mode" data-mode="${m}" aria-pressed="${readerPrefs.mode === m}">${label}</button>`).join('')}
              <button class="btn btn-sm btn-ghost" type="button" data-action="focus-mode">${icon('book')} حالت تمرکز</button>
              <button class="mini-btn" type="button" data-action="fullscreen" title="تمام‌صفحه">${icon('expand')}<span class="sr-only">تمام‌صفحه</span></button>
            </span>
          </div>

          <div class="audio-panel panel">
            <div><b>${icon('headphones')} گوش دادن</b>
              <p class="muted small" id="tts-note">${voices.length ? 'متن با صدای فارسی «' + esc(voices[0].name) + '» خوانده می‌شود.' : 'این مرورگر صدای فارسی ندارد؛ در مرورگر Edge با اینترنت صدای فارسی در دسترس است. فایل صوتی کتاب را هم می‌توانید باز کنید.'}</p></div>
            <div class="book-actions">
              <button class="btn btn-sm" type="button" data-action="tts-play"${voices.length ? '' : ' disabled'}>${icon('play')} خواندن با صدا</button>
              <button class="btn btn-sm btn-ghost" type="button" data-action="tts-pause"${voices.length ? '' : ' disabled'}>${icon('pause')} مکث</button>
              <button class="btn btn-sm btn-ghost" type="button" data-action="tts-stop"${voices.length ? '' : ' disabled'}>${icon('stop')} توقف</button>
              <label class="btn btn-sm btn-ghost">${icon('upload')} فایل کتاب صوتی<input type="file" accept="audio/*" data-audio-file hidden></label>
            </div>
            <div id="audio-slot"></div>
          </div>

          <article class="reader-text" id="reader-text" lang="fa">
            <h1>${esc(content.title)}</h1>
            ${content.full ? '' : '<p class="reader-note">متن کامل این کتاب حق نشر دارد و فقط نسخهٔ کاغذی آن در کتابخانه است؛ اینجا خلاصه و معرفی آن را می‌خوانید یا می‌شنوید.</p>'}
            ${partsHTML(content.parts)}
          </article>
        </div>
      </div>`;
  },
  mount(root, param) {
    const textFile = root.querySelector('[data-text-file]');
    if (textFile) {
      textFile.addEventListener('change', () => {
        const file = textFile.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { readerLocalText = { name: file.name.replace(/\.txt$/i, ''), text: String(reader.result) }; refresh(); };
        reader.readAsText(file, 'utf-8');
      });
      return;
    }
    const audio = root.querySelector('[data-audio-file]');
    audio.addEventListener('change', () => {
      const file = audio.files[0];
      if (!file) return;
      root.querySelector('#audio-slot').innerHTML = `<div class="audio-player"><audio controls src="${URL.createObjectURL(file)}"></audio>
        <label class="small">سرعت <select class="select" data-audio-speed style="width:auto">${[0.75, 1, 1.25, 1.5].map(s => `<option value="${s}"${s === 1 ? ' selected' : ''}>${fa(s)}×</option>`).join('')}</select></label></div>`;
      const player = root.querySelector('#audio-slot audio');
      root.querySelector('[data-audio-speed]').addEventListener('change', e => { player.playbackRate = Number(e.target.value); });
    });
    if (window.speechSynthesis && !persianVoices().length) speechSynthesis.onvoiceschanged = () => { if (persianVoices().length && currentRoute().name === 'read') refresh(); };

    /* جای خواندن و پیشرفت مطالعه را نگه می‌داریم */
    const book = getBook(param);
    const posKey = 'my-library-read-pos-' + (book ? book.id : 'local');
    const saved = Number(storage.get(posKey) || 0);
    const article = root.querySelector('#reader-text');
    if (saved) window.scrollTo(0, article.offsetTop + saved * article.offsetHeight - 80);
    let maxSaved = 0;
    readerScrollHandler = () => {
      const ratio = Math.max(0, Math.min(1, (window.scrollY + window.innerHeight - article.offsetTop) / article.offsetHeight));
      const bar = document.getElementById('reader-bar');
      if (bar) bar.style.width = (ratio * 100) + '%';
      storage.set(posKey, String(Math.max(0, (window.scrollY - article.offsetTop + 80) / article.offsetHeight)));
      const user = currentUser();
      if (user && book && book.textId && ratio * 100 >= maxSaved + 10) {
        maxSaved = Math.floor(ratio * 10) * 10;
        const entry = shelfEntry(user.id, book.id);
        if (!entry || (entry.status !== 'read' && entry.progress < maxSaved)) setProgress(user, book.id, maxSaved);
      }
    };
    window.addEventListener('scroll', readerScrollHandler, { passive: true });
    readerScrollHandler();
    readerKeyHandler = e => { if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) Actions['focus-mode'](); };
    document.addEventListener('keydown', readerKeyHandler);
  },
  unmount() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    document.body.classList.remove('focus-mode');
    if (readerScrollHandler) window.removeEventListener('scroll', readerScrollHandler);
    if (readerKeyHandler) document.removeEventListener('keydown', readerKeyHandler);
    readerScrollHandler = readerKeyHandler = null;
  }
};

Actions['reader-size'] = (data) => {
  readerPrefs.size = Math.max(1, Math.min(2.2, Math.round((readerPrefs.size + Number(data.step)) * 10) / 10));
  saveReaderPrefs();
  const page = document.querySelector('.reader-page');
  if (page) page.style.setProperty('--reader-size', readerPrefs.size + 'rem');
};
Actions['reader-mode'] = (data) => {
  readerPrefs.mode = data.mode;
  saveReaderPrefs();
  const page = document.querySelector('.reader-page');
  if (page) page.dataset.readerMode = data.mode;
  document.querySelectorAll('[data-action="reader-mode"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === data.mode)));
};
Actions['focus-mode'] = () => {
  const on = document.body.classList.toggle('focus-mode');
  toast(on ? 'حالت تمرکز روشن شد. برای خروج دکمهٔ Esc را بزنید.' : 'حالت تمرکز خاموش شد.');
};
Actions['fullscreen'] = () => {
  const el = document.documentElement;
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
  if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('مرورگر اجازهٔ تمام‌صفحه نداد.', 'bad'));
  else toast('این مرورگر حالت تمام‌صفحه ندارد.', 'bad');
};
Actions['tts-play'] = () => {
  if (!window.speechSynthesis) return toast('این مرورگر خواندن با صدا را پشتیبانی نمی‌کند.', 'bad');
  if (speechSynthesis.paused) { speechSynthesis.resume(); return; }
  const route = currentRoute();
  const content = readerContent(getBook(route.param));
  if (!content) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(content.title + '. ' + partsText(content.parts));
  utterance.lang = 'fa-IR';
  const voice = persianVoices()[0];
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  speechSynthesis.speak(utterance);
};
Actions['reader-close-local'] = () => { readerLocalText = null; refresh(); };
Actions['tts-pause'] = () => { if (window.speechSynthesis && speechSynthesis.speaking) speechSynthesis.pause(); };
Actions['tts-stop'] = () => { if (window.speechSynthesis) speechSynthesis.cancel(); };
