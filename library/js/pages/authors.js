/* =========================================================
   نویسندگان — معرفی نویسندگان معروف همراه با زندگی‌نامه و آثار
   ========================================================= */

function authorInitial(author) {
  return '<span class="author-mark" style="--c1:' + author.color + '" aria-hidden="true">' + esc(author.name.replace(/^(حکیم|خواجه)\s/, '').charAt(0)) + '</span>';
}

Pages.authors = {
  title: 'نویسندگان',
  render() {
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">معرفی نویسندگان</p>
          <h1>نویسندگانی که در قفسه‌های ما هستند</h1>
          <p class="lead">زندگی‌نامهٔ کوتاه و آثار ${fa(AUTHORS.length)} نویسنده و شاعر بزرگ؛ از فردوسی و حافظ تا همینگوی و هاوکینگ.</p>
        </div>
        <div class="author-grid">
          ${AUTHORS.map(a => `
            <a class="author-card" href="#author-${a.id}">
              ${authorInitial(a)}
              <span><b>${esc(a.name)}</b><span class="muted small">${esc(a.years)} · ${esc(a.place)}</span></span>
            </a>`).join('')}
        </div>
      </div>`;
  }
};

Pages.author = {
  title: 'نویسنده',
  render(param) {
    const author = AUTHORS.find(a => a.id === param);
    if (!author) return `<div class="wrap"><div class="empty"><p>این نویسنده پیدا نشد.</p><a class="btn" href="#authors">همهٔ نویسندگان</a></div></div>`;
    this.title = author.name;
    const books = db.books.filter(b => b.authorId === author.id);
    const inLibrary = new Set(books.map(b => norm(b.title)));
    return `
      <div class="wrap">
        <nav class="breadcrumb" aria-label="مسیر"><a href="#authors">نویسندگان</a><span>/</span><span>${esc(author.name)}</span></nav>
        <div class="author-head">
          ${authorInitial(author)}
          <div>
            <h1>${esc(author.name)}</h1>
            <p class="byline">${esc(author.years)} · ${esc(author.place)}</p>
          </div>
        </div>
        <div class="two-col" style="margin-top:22px">
          <section class="panel">
            <h2>زندگی‌نامه</h2>
            <p class="prose">${esc(author.bio)}</p>
            <a class="btn btn-sm btn-ghost" style="margin-top:14px" href="#assistant" data-action="ask" data-q="${esc(author.name)}">${icon('sparkles')} پرسیدن از دستیار</a>
          </section>
          <section class="panel">
            <h2>آثار مهم</h2>
            <ul class="works-list">${author.works.map(w => `<li>${esc(w)}${inLibrary.has(norm(w)) ? ' <span class="chip-badge">در کتابخانه</span>' : ''}</li>`).join('')}</ul>
          </section>
        </div>
        ${books.length ? `
          <section class="section">
            <h2 style="margin-bottom:14px">کتاب‌های این نویسنده در کتابخانه</h2>
            <div class="book-grid">${books.map(b => bookCardHTML(b)).join('')}</div>
          </section>` : ''}
      </div>`;
  }
};
