/* =========================================================
   اسکن و تشخیص — خواندن کد QR کتاب (با دوربین، عکس یا نمونه)
   و تشخیص کتاب از روی تصویر جلد
   ========================================================= */

let scanTimer = null;

function stopScanning() {
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = null;
  stopCamera();
}
function scanResultHTML(bookId, imageUrl) {
  const book = getBook(bookId);
  if (!book) return `<div class="empty"><p>این کد مال کتابی در کتابخانه نیست.</p></div>`;
  return `
    <div class="scan-result">
      ${imageUrl ? `<img class="scan-shot" src="${imageUrl}" alt="تصویری که خوانده شد">` : ''}
      <a class="random-book" href="#book-${book.id}">${coverHTML(book)}<span><b>${esc(book.title)}</b><br><span class="muted">${esc(book.author)}</span><br>${stampHTML(book)}</span></a>
      <a class="btn" href="#book-${book.id}">باز کردن صفحهٔ کتاب</a>
    </div>`;
}
function showQrResult(text, imageUrl) {
  const slot = document.getElementById('scan-result');
  if (!slot) return;
  const id = parseBookCode(text);
  slot.innerHTML = id ? scanResultHTML(id, imageUrl) : `<div class="empty"><p>${text ? 'کدی خوانده شد اما مال کتابخانه نیست: <span class="ltr">' + esc(text) + '</span>' : 'کد QR پیدا نشد. تصویر واضح‌تری امتحان کنید.'}</p></div>`;
  if (id && getBook(id)) toast('کد QR خوانده شد: «' + getBook(id).title + '»');
}

Pages.scan = {
  title: 'اسکن QR و تشخیص جلد',
  render(param) {
    const cover = param === 'cover';
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">اسکن و تشخیص</p>
          <h1>${cover ? 'تشخیص کتاب از روی تصویر جلد' : 'اسکن QR Code کتاب'}</h1>
          <p class="lead">${cover ? 'عکس جلد یکی از کتاب‌های کتابخانه را بدهید تا کتاب پیدا شود. تشخیص با مقایسهٔ رنگ‌ها و چیدمان جلد با جلد همهٔ کتاب‌ها انجام می‌شود.' : 'روی هر کتاب یک کد QR هست. با دوربین یا عکس آن را بخوانید تا صفحهٔ کتاب باز شود.'}</p>
        </div>
        <div class="tabs" role="tablist">
          <a class="tab" role="tab" href="#scan" aria-selected="${!cover}">${icon('qr')} اسکن QR</a>
          <a class="tab" role="tab" href="#scan-cover" aria-selected="${cover}">${icon('image')} تشخیص از روی جلد</a>
        </div>
        <div class="two-col">
          <section class="panel scan-panel">
            <div class="camera-box"><video id="scan-video" playsinline muted hidden></video>
              <div class="camera-placeholder" id="camera-placeholder">${icon('camera')}<span>دوربین خاموش است</span></div></div>
            <div class="book-actions">
              <button class="btn" type="button" data-action="${cover ? 'cover-camera' : 'qr-camera'}">${icon('camera')} ${cover ? 'روشن کردن دوربین' : 'اسکن با دوربین'}</button>
              ${cover ? `<button class="btn btn-gold" type="button" data-action="cover-snap">گرفتن عکس و تشخیص</button>` : ''}
              <button class="btn btn-ghost" type="button" data-action="camera-stop">خاموش کردن</button>
            </div>
            <div class="book-actions">
              <label class="btn btn-ghost">${icon('upload')} انتخاب عکس از کامپیوتر<input type="file" accept="image/*" data-scan-file="${cover ? 'cover' : 'qr'}" hidden></label>
              <button class="btn btn-ghost" type="button" data-action="${cover ? 'cover-demo' : 'qr-demo'}">${icon('shuffle')} امتحان با ${cover ? 'عکس' : 'کد'} نمونه</button>
            </div>
            ${cover ? '' : `
              <form class="form-row" data-form="qr-code" novalidate>
                <div class="field"><label for="qr-text">یا کد زیر QR را بنویسید</label><input id="qr-text" class="input" name="code" dir="ltr" placeholder="KM-BOOK-12"></div>
                <button class="btn btn-sm" type="submit">باز کردن</button>
              </form>`}
            <p class="muted small">دوربین فقط روی همین صفحه و فقط با اجازهٔ شما روشن می‌شود و تصویری ذخیره یا ارسال نمی‌شود.</p>
          </section>
          <section aria-live="polite">
            <h2 style="margin-bottom:14px">نتیجه</h2>
            <div id="scan-result"><p class="empty">هنوز تصویری بررسی نشده است.</p></div>
          </section>
        </div>
      </div>`;
  },
  mount(root) {
    const file = root.querySelector('[data-scan-file]');
    file.addEventListener('change', async () => {
      try {
        const canvas = await imageFileToCanvas(file.files[0]);
        if (file.dataset.scanFile === 'qr') showQrResult(decodeQR(canvas), canvas.toDataURL('image/jpeg', 0.7));
        else showCoverResults(canvas);
      } catch (e) { toast('این فایل تصویر نیست یا خوانده نشد.', 'bad'); }
    });
  },
  unmount: stopScanning
};

async function openCamera() {
  const video = document.getElementById('scan-video');
  try {
    await startCamera(video);
    video.hidden = false;
    document.getElementById('camera-placeholder').hidden = true;
    return video;
  } catch (e) {
    toast('دوربین روشن نشد. اجازهٔ دوربین را بدهید یا از «انتخاب عکس» استفاده کنید.', 'bad');
    return null;
  }
}
Actions['qr-camera'] = async () => {
  const video = await openCamera();
  if (!video) return;
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = setInterval(() => {
    if (!video.videoWidth) return;
    const frame = videoFrame(video);
    const text = decodeQR(frame);
    if (text) { stopScanning(); video.hidden = true; document.getElementById('camera-placeholder').hidden = false; showQrResult(text, frame.toDataURL('image/jpeg', 0.7)); }
  }, 300);
};
Actions['camera-stop'] = () => {
  stopScanning();
  const video = document.getElementById('scan-video');
  if (video) video.hidden = true;
  const placeholder = document.getElementById('camera-placeholder');
  if (placeholder) placeholder.hidden = false;
};
Actions['qr-demo'] = () => {
  const book = db.books[Math.floor(Math.random() * db.books.length)];
  const canvas = qrCanvas(bookCode(book.id), 6);
  showQrResult(decodeQR(canvas), canvas.toDataURL('image/png'));
};
Forms['qr-code'] = (values) => showQrResult(values.code, null);

/* ---------- تشخیص از روی جلد ---------- */
function showCoverResults(canvas) {
  const slot = document.getElementById('scan-result');
  if (!slot) return;
  const results = recognizeCover(canvas);
  const best = results[0];
  slot.innerHTML = `
    <div class="cover-results">
      <img class="scan-shot" src="${canvas.toDataURL('image/jpeg', 0.7)}" alt="تصویر بررسی‌شده">
      <div>
        <p>${best.confidence > 0.6 ? 'به احتمال زیاد این کتاب است:' : 'مطمئن نیستم؛ نزدیک‌ترین کتاب‌ها:'}</p>
        <ol class="match-list">${results.map(r => `
          <li><a href="#book-${r.book.id}">${coverHTML(r.book)}<span><b>${esc(r.book.title)}</b><span class="muted small">${esc(r.book.author)}</span>
            <span class="meter" aria-hidden="true"><span style="width:${Math.round(r.confidence * 100)}%"></span></span>
            <span class="small">اطمینان: ${fa(Math.round(r.confidence * 100))}٪</span></span></a></li>`).join('')}</ol>
      </div>
    </div>`;
}
Actions['cover-camera'] = () => { openCamera(); };
Actions['cover-snap'] = () => {
  const video = document.getElementById('scan-video');
  if (!video || video.hidden || !video.videoWidth) return toast('اول دوربین را روشن کنید.', 'bad');
  showCoverResults(videoFrame(video));
};
Actions['cover-demo'] = () => {
  const book = db.books[Math.floor(Math.random() * db.books.length)];
  showCoverResults(samplePhotoOf(book));
  toast('یک عکس آزمایشی از جلد «' + book.title + '» ساخته شد (کج، با نور و نویز).');
};
