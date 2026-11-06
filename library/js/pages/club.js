/* =========================================================
   باشگاه کتاب‌خوان‌ها — امتیاز و سطح، نشان‌های افتخار،
   مأموریت‌های هفتگی و جدول رتبه‌بندی اعضا
   ========================================================= */

let clubBoard = 'all';

Pages.club = {
  title: 'باشگاه کتاب‌خوان‌ها',
  render() {
    const user = currentUser();
    const board = xpLeaderboard(clubBoard);
    const weekEnd = weekStart() + 7 * DAY;
    let mine = '';
    if (user) {
      const xp = userXP(user.id);
      const level = levelOf(xp);
      const earned = new Set(userBadges(user.id).map(b => b.id));
      const missions = missionsFor(user.id);
      mine = `
        <section class="level-card">
          <div class="level-badge" aria-hidden="true"><span>${fa(level.number)}</span></div>
          <div class="level-info">
            <p class="eyebrow">سطح ${fa(level.number)}</p>
            <h2>${esc(level.name)}</h2>
            <p><b>${fa(xp)}</b> امتیاز${level.next ? ` · ${fa(level.next - xp)} امتیاز تا سطح بعد` : ' · بالاترین سطح!'}</p>
            <div class="meter" role="progressbar" aria-label="پیشرفت تا سطح بعد" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(level.progress * 100)}"><span style="width:${level.progress * 100}%"></span></div>
          </div>
          <div class="level-week"><b>${fa(userXP(user.id, weekStart()))}</b><span class="muted small">امتیاز این هفته</span></div>
        </section>

        <section class="section">
          <div class="section-head"><div><p class="eyebrow">${icon('target')} مأموریت‌های هفتگی</p><h2>چالش‌های این هفته</h2></div>
            <span class="muted small">تا پایان ${faDate(weekEnd - 1)}</span></div>
          <div class="missions">${missions.map(m => `
            <div class="mission${m.claimed ? ' claimed' : m.done ? ' done' : ''}">
              <div class="mission-top"><b>${esc(m.title)}</b><span class="chip-badge">+${fa(m.reward)} امتیاز</span></div>
              <div class="progress" aria-hidden="true"><span style="width:${Math.min(100, m.value / m.target * 100)}%"></span></div>
              <div class="mission-foot">
                <span class="muted small num">${fa(Math.min(m.value, m.target))} از ${fa(m.target)}</span>
                ${m.claimed ? `<span class="small">${icon('check')} جایزه گرفته شد</span>` : m.done ? `<button class="btn btn-sm btn-gold" type="button" data-action="claim" data-id="${m.id}">گرفتن جایزه</button>` : ''}
              </div>
            </div>`).join('')}</div>
        </section>

        <section class="section">
          <div class="section-head"><div><p class="eyebrow">${icon('award')} نشان‌های افتخار</p><h2>${fa(earned.size)} نشان از ${fa(BADGES.length)}</h2></div></div>
          <div class="badges">${BADGES.map(b => `
            <div class="badge${earned.has(b.id) ? ' earned' : ''}">
              <span class="badge-icon" aria-hidden="true">${icon(b.icon)}</span>
              <b>${esc(b.name)}</b><span class="muted small">${esc(b.desc)}</span>
              <span class="sr-only">${earned.has(b.id) ? 'گرفته‌اید' : 'هنوز نگرفته‌اید'}</span>
            </div>`).join('')}</div>
        </section>`;
    }
    return `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">باشگاه کتاب‌خوان‌ها</p>
          <h1>بخوان، امتیاز بگیر، نشان ببر</h1>
          <p class="lead">با امانت گرفتن، مطالعه با تایمر، نوشتن نقد و انجام مأموریت‌های هفتگی امتیاز بگیرید و در جدول رتبه‌بندی بالا بروید.</p>
        </div>
        ${user ? mine : `<div class="empty"><p>برای دیدن امتیاز، نشان‌ها و مأموریت‌هایتان وارد شوید.</p><a class="btn" href="#login">${icon('login')} ورود</a></div>`}

        <section class="section two-col">
          <div>
            <div class="section-head">
              <h2>جدول رتبه‌بندی</h2>
              <div class="tabs" role="tablist" style="margin:0">
                <button class="tab" role="tab" type="button" data-action="club-board" data-board="all" aria-selected="${clubBoard === 'all'}">همهٔ زمان‌ها</button>
                <button class="tab" role="tab" type="button" data-action="club-board" data-board="week" aria-selected="${clubBoard === 'week'}">این هفته</button>
              </div>
            </div>
            <div class="table-wrap"><table class="table">
              <thead><tr><th>رتبه</th><th>نام</th><th>سطح</th><th>امتیاز</th></tr></thead>
              <tbody>${board.map((row, i) => `
                <tr class="${user && row.user.id === user.id ? 'me' : ''}">
                  <td>${i < 3 ? `<span class="medal">${fa(i + 1)}</span>` : fa(i + 1)}</td>
                  <td>${esc(row.user.name)}</td>
                  <td>${esc(row.level.name)}</td>
                  <td class="num"><b>${fa(row.xp)}</b></td>
                </tr>`).join('')}</tbody>
            </table></div>
          </div>
          <aside class="panel">
            <h2>چطور امتیاز بگیرم؟</h2>
            <table class="hours"><tbody>${XP_RULES.map(([label, points]) => `<tr><td>${label}</td><td>${typeof points === 'number' ? '+' + fa(points) : fa(points)}</td></tr>`).join('')}</tbody></table>
            <a class="btn btn-sm btn-ghost" style="margin-top:14px" href="#competition">${icon('trophy')} مسابقهٔ کتابخوانی</a>
          </aside>
        </section>
      </div>`;
  }
};

Actions['club-board'] = (data) => { clubBoard = data.board; refresh(); };
Actions['claim'] = (data) => {
  const result = claimMission(currentUser(), data.id);
  if (notify(result)) { celebrate(); refresh(); }
};
