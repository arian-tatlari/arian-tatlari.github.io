/* =========================================================
   charts.js — نمودارهای ساده با HTML و CSS (بدون کتابخانه، بدون اینترنت)
   ستونی برای روند زمانی، میله‌ای افقی برای مقایسهٔ دسته‌ها.
   هر نمودار یک «جدول داده‌ها» هم دارد تا عددها بدون نگاه کردن به رنگ هم خوانده شوند.
   ========================================================= */

/* گام «گرد» برای خطوط راهنما: ۱، ۲، ۵، ۱۰، ۲۰، ۵۰ ... */
function niceStep(raw) {
  if (raw <= 1) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / power;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power;
}

function chartTableHTML(data, columnLabel, unit) {
  return '<details class="chart-table"><summary>جدول داده‌ها</summary><div class="table-wrap"><table class="table">' +
    '<thead><tr><th>' + columnLabel + '</th><th>' + unit + '</th></tr></thead><tbody>' +
    data.map(d => '<tr><td>' + esc(d.label) + '</td><td class="num">' + fa(d.value) + '</td></tr>').join('') +
    '</tbody></table></div></details>';
}

/* نمودار ستونی (زمان از راست به چپ جلو می‌رود؛ قدیمی‌ترین ستون سمت راست است) */
function columnChartHTML({ data, unit, columnLabel, labelEvery, caption }) {
  const max = Math.max(0, ...data.map(d => d.value));
  const step = niceStep(max / 4);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const peak = data.findIndex(d => d.value === max && max > 0);
  const every = labelEvery || 1;
  return '<figure class="chart">' + (caption ? '<figcaption class="chart-caption">' + caption + '</figcaption>' : '') +
    '<div class="col-chart">' +
      '<div class="col-axis" aria-hidden="true">' + ticks.map(v => '<span style="bottom:' + (v / top * 100) + '%">' + fa(v) + '</span>').join('') + '</div>' +
      '<div class="col-plot">' +
        '<div class="col-grid" aria-hidden="true">' + ticks.map(v => '<span style="bottom:' + (v / top * 100) + '%"></span>').join('') + '</div>' +
        '<div class="col-bars">' + data.map((d, i) =>
          '<div class="col" tabindex="0" data-tip="' + esc(d.label + ': ' + fa(d.value) + ' ' + unit) + '">' +
            '<span class="col-bar" style="height:' + (d.value / top * 100) + '%">' + (i === peak ? '<span class="col-value">' + fa(d.value) + '</span>' : '') + '</span>' +
          '</div>').join('') + '</div>' +
      '</div>' +
      '<div class="col-labels" aria-hidden="true">' + data.map((d, i) => '<span>' + (i % every === 0 || i === data.length - 1 ? esc(d.label) : '') + '</span>').join('') + '</div>' +
    '</div>' + chartTableHTML(data, columnLabel || 'زمان', unit) + '</figure>';
}

/* نمودار میله‌ای افقی (برای دسته‌ها؛ عدد هر میله کنار انتهای آن نوشته می‌شود) */
function barChartHTML({ data, unit, columnLabel, caption }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return '<figure class="chart">' + (caption ? '<figcaption class="chart-caption">' + caption + '</figcaption>' : '') +
    '<div class="hbar-chart">' + data.map(d =>
      '<div class="hbar-row" tabindex="0" data-tip="' + esc(d.label + ': ' + fa(d.value) + ' ' + unit) + '">' +
        '<span class="hbar-label">' + esc(d.label) + '</span>' +
        '<span class="hbar-track"><span class="hbar-fill" style="width:' + (d.value / max * 100) + '%"></span><span class="hbar-value">' + fa(d.value) + '</span></span>' +
      '</div>').join('') + '</div>' + chartTableHTML(data, columnLabel || 'دسته', unit) + '</figure>';
}

/* راهنمای شناور نمودارها (با ماوس و با کلید Tab) */
function initChartTips() {
  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  tip.setAttribute('role', 'status');
  document.body.appendChild(tip);
  const show = target => {
    const mark = target.closest && target.closest('.chart [data-tip]');
    if (!mark) return;
    tip.textContent = mark.dataset.tip;
    tip.hidden = false;
    const r = mark.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - t.width - 8, Math.max(8, r.left + r.width / 2 - t.width / 2));
    tip.style.left = left + 'px';
    tip.style.top = Math.max(8, r.top - t.height - 8) + 'px';
  };
  const hide = () => { tip.hidden = true; };
  document.addEventListener('pointerover', e => (e.target.closest && e.target.closest('.chart [data-tip]') ? show(e.target) : hide()));
  document.addEventListener('focusin', e => (e.target.closest && e.target.closest('.chart [data-tip]') ? show(e.target) : hide()));
  document.addEventListener('scroll', hide, { passive: true });
}
