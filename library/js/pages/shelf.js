/* =========================================================
   قفسهٔ کتاب مجازی من — سه طبقهٔ «در حال خواندن»، «می‌خواهم بخوانم»
   و «خوانده‌ام» به‌علاوهٔ علاقه‌مندی‌ها. عطف کتاب‌ها را می‌شود بین طبقه‌ها کشید و رها کرد.
   ========================================================= */

Pages.shelf = {
  title: 'قفسهٔ من',
  render() {
    const user = currentUser();
    if (!user) {
      return `<div class="wrap"><div class="page-head"><p class="eyebrow">قفسهٔ کتاب مجازی</p><h1>قفسهٔ کتاب شخصی شما</h1>
        <p class="lead">کتاب‌هایی را که می‌خوانید، خوانده‌اید یا می‌خواهید بخوانید روی قفسهٔ خودتان بچینید.</p></div>
        <div class="empty"><p>برای ساختن قفسهٔ شخصی وارد حساب خود شوید.</p><a class="btn" href="#login">${icon('login')} ورود</a></div></div>`;
    }
    const favorites = userFavorites(user.id);
    const shelfRow = (status, title) => {
      const entries = userShelf(user.id, status).map(s => ({ s, b: getBook(s.bookId) })).filter(x => x.b);
      return `
        <section class="my-shelf" aria-labelledby="shelf-${status}">
          <div class="section-head"><h2 id="shelf-${status}">${title}</h2><span class="muted small">${fa(entries.length)} کتاب</span></div>
          <div class="shelf my-shelf-row" data-drop="${status}">
            ${entries.map(({ s, b }) => `
              <div class="spine-wrap" draggable="true" data-drag="${b.id}">
                ${spineHTML(b)}
                ${status === 'reading' ? `<span class="spine-progress" title="${fa(s.progress)}٪ خوانده شده"><span style="height:${s.progress}%"></span></span>` : ''}
              </div>`).join('') || '<p class="shelf-empty">کتابی اینجا نیست. عطف یک کتاب را اینجا بکشید یا از صفحهٔ کتاب اضافه‌اش کنید.</p>'}
          </div>
          <div class="shelf-board"></div>
        </section>`;
    };
    const allMine = db.shelves.filter(s => s.userId === user.id).map(s => s.bookId);
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">قفسهٔ کتاب مجازی من</p>
          <h1>قفسهٔ ${esc(user.name)}</h1>
          <p class="lead">عطف هر کتاب را بکشید و روی طبقهٔ دیگر رها کنید. با گذاشتن کتاب در «خوانده‌ام» ۳۰ امتیاز باشگاه می‌گیرید.</p>
        </div>
        ${shelfRow('reading', SHELF_NAMES.reading)}
        ${shelfRow('want', SHELF_NAMES.want)}
        ${shelfRow('read', SHELF_NAMES.read)}

        <section class="section two-col">
          <div class="panel">
            <h2>افزودن کتاب به قفسه</h2>
            <form class="form-row" data-form="shelf-add" novalidate>
              <div class="field"><label for="shelf-book">کتاب</label><select id="shelf-book" class="select" name="bookId">${db.books.filter(b => !allMine.includes(b.id)).map(b => `<option value="${b.id}">${esc(b.title)}</option>`).join('')}</select></div>
              <div class="field"><label for="shelf-status">طبقه</label><select id="shelf-status" class="select" name="status">${Object.keys(SHELF_NAMES).map(k => `<option value="${k}">${SHELF_NAMES[k]}</option>`).join('')}</select></div>
              <button class="btn" type="submit">${icon('plus')} افزودن</button>
            </form>
            <h3 style="margin-top:20px">جابه‌جایی بدون کشیدن</h3>
            <p class="muted small">روی گوشی یا با صفحه‌کلید، طبقهٔ هر کتاب را از اینجا عوض کنید:</p>
            <ul class="move-list">${userShelf(user.id).map(s => { const b = getBook(s.bookId); return b ? `
              <li><span>${esc(b.title)}</span><select class="select" data-move="${b.id}" aria-label="طبقهٔ ${esc(b.title)}">
                ${Object.keys(SHELF_NAMES).map(k => `<option value="${k}"${s.status === k ? ' selected' : ''}>${SHELF_NAMES[k]}</option>`).join('')}<option value="">برداشتن از قفسه</option></select></li>` : ''; }).join('')}</ul>
          </div>
          <div>
            <h2 style="margin-bottom:14px">${icon('heart')} علاقه‌مندی‌ها</h2>
            ${favorites.length ? `<div class="book-grid">${favorites.map(b => bookCardHTML(b)).join('')}</div>` : '<p class="empty">با دکمهٔ قلب روی هر کتاب، آن را به علاقه‌مندی‌ها اضافه کنید.</p>'}
          </div>
        </section>
      </div>`;
  },
  mount(root) {
    root.querySelectorAll('[data-drag]').forEach(el => {
      el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', el.dataset.drag); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
    });
    root.querySelectorAll('[data-drop]').forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drop-target'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drop-target'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drop-target');
        const bookId = e.dataTransfer.getData('text/plain');
        if (bookId) { notify(setShelf(currentUser(), bookId, zone.dataset.drop)); refresh(); }
      });
    });
    root.querySelectorAll('[data-move]').forEach(select => select.addEventListener('change', () => {
      notify(setShelf(currentUser(), select.dataset.move, select.value));
      refresh();
    }));
  }
};
Forms['shelf-add'] = (values) => { if (values.bookId) { notify(setShelf(currentUser(), values.bookId, values.status)); refresh(); } };
