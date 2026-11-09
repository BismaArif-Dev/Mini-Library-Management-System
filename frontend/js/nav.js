(function () {
  const root = document.documentElement;
  const moon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  const sun = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const bars = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  // ---------- Theme ----------
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch {}
  const prefersDark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  const actions = document.querySelector('.navbar__actions');
  const navbar = document.querySelector('.navbar');
  if (!actions || !navbar) return;

  actions.insertAdjacentHTML('afterbegin',
    '<button class="icon-btn" id="themeBtn" type="button"></button>');
  actions.insertAdjacentHTML('beforeend',
    '<button class="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false">' + bars + '</button>');

  const themeBtn = document.getElementById('themeBtn');
  const menuBtn = document.getElementById('menuBtn');

  function paintTheme() {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.innerHTML = dark ? sun : moon;
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  paintTheme();

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    paintTheme();
  });

  // ---------- Mobile menu ----------
  function setMenu(open) {
    navbar.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!navbar.classList.contains('is-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => {
    if (navbar.classList.contains('is-open') && !e.target.closest('.navbar')) setMenu(false);
  });
  window.addEventListener('resize', () => { if (innerWidth > 760) setMenu(false); });
})();// ---------- Staff login link ----------
// ---------- Account control (Staff login ya avatar menu) ----------
(function () {
  const actions = document.querySelector('.navbar__actions');
  const list = document.querySelector('.nav-links');
  if (!actions || typeof api === 'undefined') return;
  const here = location.pathname.split('/').pop();

  // Tabs se Staff login / Dashboard / Log out wale links hata do
  if (list) {
    list.querySelectorAll('a[href="login.html"]').forEach(a => a.closest('li')?.remove());
  }

  const userIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  const menuBtn = document.getElementById('menuBtn');
  const place = html => {
    if (menuBtn) menuBtn.insertAdjacentHTML('beforebegin', html);
    else actions.insertAdjacentHTML('beforeend', html);
  };

  function showLoggedOut() {
    place(`<a class="btn btn-ghost staff-btn" href="login.html" ${here === 'login.html' ? 'aria-current="page"' : ''}>
             ${userIcon}<span>Staff login</span>
           </a>`);
  }

  function showLoggedIn(username) {
    const initial = (username || 'A').trim().charAt(0).toUpperCase();
    place(`
      <div class="acct" id="acct">
        <button class="acct__btn" id="acctBtn" type="button" aria-haspopup="menu" aria-expanded="false"
                aria-label="Account menu for ${esc(username)}">${esc(initial)}</button>
        <div class="acct__menu" id="acctMenu" role="menu" hidden>
          <p class="acct__who"><span class="label">Signed in as</span><strong>${esc(username)}</strong></p>
          <a class="acct__item" role="menuitem" href="admin.html">Dashboard</a>
          <button class="acct__item" role="menuitem" id="logoutBtn" type="button">Log out</button>
        </div>
      </div>`);

    const btn = document.getElementById('acctBtn');
    const menu = document.getElementById('acctMenu');
    const set = open => {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => set(menu.hidden));
    document.addEventListener('click', e => { if (!e.target.closest('#acct')) set(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); }
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { await api.logout(); } catch {}
      location.href = 'login.html';
    });
  }

  api.me()
    .then(me => (me.admin ? showLoggedIn(me.username) : showLoggedOut()))
    .catch(showLoggedOut);
})();// ---------- Shelf link (har page par khud lag jata hai) ----------
(function () {
  const list = document.querySelector('.nav-links');
  if (!list || list.querySelector('a[href="shelf.html"]')) return;
  const here = location.pathname.split('/').pop();

  const li = document.createElement('li');
  li.innerHTML = '<a class="nav-link" href="shelf.html"' +
    (here === 'shelf.html' ? ' aria-current="page"' : '') + '>Shelf</a>';

  const catalog = list.querySelector('a[href="catalog.html"]');
  if (catalog && catalog.closest('li')) catalog.closest('li').after(li);
  else list.appendChild(li);
})();