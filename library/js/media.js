/* =========================================================
   media.js — تصویر و دوربین
   ۱) کشیدن جلد کتاب روی بوم (canvas) برای ذخیرهٔ تصویر
   ۲) تشخیص کتاب از روی تصویر جلد: تصویر به یک «اثر انگشت رنگی» ۸×۱۲ خانه‌ای تبدیل
      و با اثر انگشت جلد همهٔ کتاب‌ها مقایسه می‌شود؛ نزدیک‌ترین‌ها نتیجه‌اند.
   ۳) ساختن کد QR (کتابخانهٔ qrcode-generator) و خواندن آن (کتابخانهٔ jsQR)
   ۴) روشن و خاموش کردن دوربین
   ========================================================= */

const COVER_W = 240;
const COVER_H = 360;

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/* ---------- ۱) کشیدن جلد ---------- */
function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}
function drawCover(ctx, book, w, h) {
  const gradient = ctx.createLinearGradient(0, 0, w * 0.6, h);
  gradient.addColorStop(0, book.colors[0]);
  gradient.addColorStop(1, book.colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  const spine = w * 0.08;                     /* سایهٔ عطف سمت راست */
  const shade = ctx.createLinearGradient(w - spine, 0, w, 0);
  shade.addColorStop(0, 'rgba(255,255,255,0.14)');
  shade.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(w - spine, 0, spine, h);
  ctx.strokeStyle = 'rgba(255,220,150,0.45)';
  ctx.lineWidth = Math.max(1, w / 240);
  ctx.strokeRect(w * 0.06, h * 0.06, w * 0.82, h * 0.88);
  const cx = w * 0.47;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillStyle = '#FFFFFF';
  const size = Math.round(w * 0.09);
  ctx.font = '700 ' + size + 'px Mirza, Vazirmatn, Tahoma, serif';
  const lines = wrapLines(ctx, book.title, w * 0.66);
  lines.forEach((line, i) => ctx.fillText(line, cx, h * 0.45 + (i - (lines.length - 1) / 2) * size * 1.4));
  ctx.fillStyle = 'rgba(255,220,150,0.7)';
  ctx.fillRect(cx - w * 0.07, h * 0.83, w * 0.14, Math.max(1, h / 360));
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '400 ' + Math.round(w * 0.05) + 'px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(book.author, cx, h * 0.89);
}
function coverCanvas(book, w, h) {
  const canvas = makeCanvas(w || COVER_W, h || COVER_H);
  drawCover(canvas.getContext('2d'), book, canvas.width, canvas.height);
  return canvas;
}
function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ---------- ۲) تشخیص کتاب از روی جلد ---------- */
const SIG_W = 8, SIG_H = 12, SIG_CELL = 6;
/* میانگین رنگ هر خانه از یک تصویر کوچک ۴۸×۷۲ */
function signatureOf(source, sx, sy, sw, sh) {
  const small = makeCanvas(SIG_W * SIG_CELL, SIG_H * SIG_CELL);
  const ctx = small.getContext('2d');
  ctx.drawImage(source, sx || 0, sy || 0, sw || source.width, sh || source.height, 0, 0, small.width, small.height);
  const data = ctx.getImageData(0, 0, small.width, small.height).data;
  const sig = [];
  for (let gy = 0; gy < SIG_H; gy++) {
    for (let gx = 0; gx < SIG_W; gx++) {
      let r = 0, g = 0, b = 0;
      for (let y = 0; y < SIG_CELL; y++) {
        for (let x = 0; x < SIG_CELL; x++) {
          const i = ((gy * SIG_CELL + y) * small.width + gx * SIG_CELL + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2];
        }
      }
      const n = SIG_CELL * SIG_CELL;
      sig.push(r / n, g / n, b / n);
    }
  }
  /* برای اینکه نور و روشنایی عکس نتیجه را خراب نکند، هر خانه را با «رنگ نسبت به روشنایی خودش»
     و «روشنایی نسبت به میانگین کل تصویر» نشان می‌دهیم */
  const lum = [];
  for (let i = 0; i < sig.length; i += 3) lum.push(0.299 * sig[i] + 0.587 * sig[i + 1] + 0.114 * sig[i + 2]);
  const meanLum = lum.reduce((a, b) => a + b, 0) / lum.length;
  const features = [];
  lum.forEach((y, k) => features.push(sig[k * 3] - y, sig[k * 3 + 2] - y, y - meanLum));
  return features;
}
const coverSignatureCache = new Map();
function coverSignature(book) {
  const key = book.id + '|' + book.colors.join() + '|' + book.title;
  if (!coverSignatureCache.has(key)) coverSignatureCache.set(key, signatureOf(coverCanvas(book)));
  return coverSignatureCache.get(key);
}
/* وسط تصویر را با نسبت ۲ به ۳ (نسبت جلد کتاب) جدا می‌کند */
function centerCrop(canvas, fill) {
  const ratio = 2 / 3;
  let w = canvas.width, h = canvas.height;
  if (w / h > ratio) w = h * ratio; else h = w / ratio;
  w *= fill; h *= fill;
  return [(canvas.width - w) / 2, (canvas.height - h) / 2, w, h];
}
function recognizeCover(canvas) {
  const crop = centerCrop(canvas, canvas.width / canvas.height > 0.7 || canvas.width / canvas.height < 0.63 ? 0.9 : 1);
  const sig = signatureOf(canvas, crop[0], crop[1], crop[2], crop[3]);
  const scored = db.books.map(book => {
    const ref = coverSignature(book);
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff += Math.abs(sig[i] - ref[i]);
    return { book, distance: diff / sig.length };
  }).sort((a, b) => a.distance - b.distance);
  /* تبدیل فاصله به درصد اطمینان (نزدیک‌ترین‌ها بیشترین سهم را می‌گیرند) */
  const weights = scored.map(s => Math.exp(-s.distance / 6));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return scored.slice(0, 3).map((s, i) => ({ book: s.book, confidence: weights[i] / total, distance: s.distance }));
}
/* عکس آزمایشی: جلد را کمی کج، با نور متفاوت و نویز می‌کشد؛ مثل عکسی که با گوشی گرفته شده */
function samplePhotoOf(book) {
  const canvas = makeCanvas(420, 560);
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 420, 560);
  bg.addColorStop(0, '#D8D2C8');
  bg.addColorStop(1, '#A69E92');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 420, 560);
  ctx.save();
  ctx.translate(210, 280);
  ctx.rotate((Math.random() * 6 - 3) * Math.PI / 180);
  ctx.drawImage(coverCanvas(book), -170, -255, 340, 510);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.08) + ')';
  ctx.fillRect(0, 0, 420, 560);
  const img = ctx.getImageData(0, 0, 420, 560);
  for (let i = 0; i < img.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    img.data[i] += noise; img.data[i + 1] += noise; img.data[i + 2] += noise;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ---------- ۳) کد QR ---------- */
function bookCode(id) { return 'KM-BOOK-' + id; }
function parseBookCode(text) {
  const match = /KM-BOOK-(\d+)/i.exec(String(text || '').trim());
  return match ? Number(match[1]) : null;
}
function qrMatrix(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr;
}
/* رنگ کد QR همیشه سیاه روی سفید است تا در هر دو حالت روشن و تیره خوانده شود */
function qrSVG(text, size) {
  const qr = qrMatrix(text);
  const n = qr.getModuleCount();
  const margin = 2;
  const total = n + margin * 2;
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += 'M' + (c + margin) + ' ' + (r + margin) + 'h1v1h-1z';
  return '<svg class="qr" viewBox="0 0 ' + total + ' ' + total + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" role="img" aria-label="کد QR: ' + esc(text) + '">' +
    '<rect width="' + total + '" height="' + total + '" fill="#FFFFFF"/><path d="' + path + '" fill="#000000"/></svg>';
}
function qrCanvas(text, scale) {
  const qr = qrMatrix(text);
  const n = qr.getModuleCount();
  const s = scale || 8;
  const canvas = makeCanvas((n + 4) * s, (n + 4) * s);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + 2) * s, (r + 2) * s, s, s);
  return canvas;
}
function decodeQR(canvas) {
  if (typeof jsQR !== 'function') return null;
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
  return result ? result.data : null;
}

/* ---------- ۴) دوربین و فایل تصویر ---------- */
let cameraStream = null;
async function startCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-camera');
  stopCamera();
  cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  video.srcObject = cameraStream;
  await video.play();
}
function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
}
function videoFrame(video) {
  const canvas = makeCanvas(video.videoWidth || 640, video.videoHeight || 480);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function imageFileToCanvas(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('not-image')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const canvas = makeCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad-image')); };
    img.src = url;
  });
}
