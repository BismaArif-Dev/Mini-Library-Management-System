(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const root = $('main'), stage = $('stage3d'), dlg = $('detailDlg');
  let books = [], N = 0, M = 0, tapes = [], lift = [];
  let H = 0, ws = 0, d = 0, gap = 0;
  let s = 0, T = 0, hover = -1, active = -1;
  let dragging = false, suppress = false, mx = 0, my = 0, tiltX = 0, tiltY = 0, last = 0, wt;

  const smooth = x => x * x * (3 - 2 * x);
  const B = r => Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
  const mod = (a, n) => ((a % n) + n) % n;

  function measure() {
    const w = innerWidth;
    H = w <= 767 ? Math.min(w * 0.6, innerHeight * 0.4) : Math.min(innerHeight * 0.46, w * 0.31);
    ws = H * 142 / 840; d = H * 0.62; gap = H * 0.03;
      document.documentElement.style.setProperty('--H', H + 'px');
    document.documentElement.style.setProperty('--ws', ws + 'px');
    document.documentElement.style.setProperty('--d', d + 'px');
  }

  function tapeHTML(b, v) {
    const color = CAT_COLORS[b.category] || CAT_COLORS.General;
    return `<div class="tape" data-v="${v}" aria-label="${esc(b.title)}" style="--cover:${color}">
      <div class="sp"><span class="sp__t">${esc(b.title)}</span><span class="sp__a">${esc(b.author)}</span></div>
      <div class="cv">${coverHTML(b)}</div></div>`;
  }

  function setActive(a, dir) {
    active = a;
    const b = books[a];
    $('cCat').textContent = b.category;
    $('cTitle').textContent = b.title;
    $('cMeta').textContent = b.author + (b.year ? ' · ' + b.year : '');
    if (!reduce) {
      ['cCat', 'cTitle', 'cMeta'].forEach((id, i) => $(id).animate(
        [{ transform: `translateY(${dir * 105}%)` }, { transform: 'none' }],
        { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', delay: i * 60, fill: 'backwards' }));
    }
    document.querySelectorAll('#tabs .chip').forEach(t =>
      t.setAttribute('aria-pressed', String(t.dataset.cat === b.category)));
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const k = reduce ? 1 : (dragging ? 18 : 5.2);
    s += (T - s) * (1 - Math.exp(-k * dt));
    if (Math.abs(T - s) < 1e-4) s = T;
    if (Math.abs(s) > 2 * M) { const sh = Math.sign(s) * M; s -= sh; T -= sh; }

    if (!reduce) {
      tiltY += ((mx - innerWidth / 2) / innerWidth * 10 - tiltY) * (1 - Math.exp(-7 * dt));
      tiltX += (-(my - innerHeight / 2) / H * 6 - tiltX) * (1 - Math.exp(-7 * dt));
    }

    const a = mod(Math.round(s), N);
    if (a !== active) setActive(a, Math.sign(T - s) || 1);

    const cull = innerWidth / 2 + 1.5 * d;
    for (let v = 0; v < M; v++) {
      const el = tapes[v];
      const r = mod(v - s + M / 2, M) - M / 2;
      const x = r * (ws + gap) + (d - ws + 1.6 * gap) * B(r);
      if (Math.abs(x) > cull) {
        if (!el._hid) { el.style.visibility = 'hidden'; el._hid = true; }
        continue;
      }
      if (el._hid) { el.style.visibility = ''; el._hid = false; }
      const o = smooth(Math.max(0, 1 - Math.abs(r)));
      lift[v] += (((hover === v && Math.abs(r) > 0.5) ? 1 : 0) - lift[v]) * (1 - Math.exp(-12 * dt));
      const y = -o * 0.025 * H - lift[v] * 0.045 * H;
      el.style.transform = `translate3d(${x}px,${y}px,${o * 0.2 * H}px) rotateZ(${-4.5 * o}deg) rotateX(${tiltX * o}deg) rotateY(${-90 * o + tiltY * o}deg)`;
      el.style.setProperty('--so', (o * 0.55).toFixed(3));
      el.style.setProperty('--co', ((1 - o) * 0.5).toFixed(3));
      el._r = r;
    }
    requestAnimationFrame(frame);
  }

  function openDetail() {
    const b = books[active];
    if (!b) return;
    const issued = b.status !== 'Available';
    $('dCover').innerHTML = coverHTML(b);
    $('dTitle').textContent = b.title;
    $('dAuthor').textContent = b.author + (b.year ? ' · ' + b.year : '');
    $('dCat').textContent = b.category;
    $('dDesc').textContent = b.description || 'No description yet.';
    $('dStatus').innerHTML = badgeHTML(b);
    $('dNote').textContent = issued && b.dueDate
      ? 'Expected back on ' + new Date(b.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) + '.'
      : 'Ask the librarian at the desk to borrow this book.';
    dlg.showModal();
  }

  function jumpTo(i) {
    const base = Math.round(T);
    let diff = i - mod(base, N);
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    T = base + diff;
  }

  function bind() {
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
    stage.addEventListener('pointerover', e => {
      const t = e.target.closest('.tape'); hover = t ? +t.dataset.v : -1;
    });
    stage.addEventListener('pointerleave', () => { hover = -1; });

    stage.addEventListener('click', e => {
      const t = e.target.closest('.tape');
      if (!t || suppress) return;
      const r = tapes[+t.dataset.v]._r;
      if (Math.abs(r) < 0.5) openDetail(); else T = Math.round(T + r);
    });

    stage.addEventListener('pointerdown', e => {
      const x0 = e.clientX, T0 = T;
      const move = ev => {
        const dx = ev.clientX - x0;
        if (!dragging && Math.abs(dx) > 5) dragging = true;
        if (dragging) T = T0 - dx / (ws + gap);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (dragging) { T = Math.round(T); suppress = true; setTimeout(() => (suppress = false), 0); }
        dragging = false;
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    root.addEventListener('wheel', e => {
      if (dlg.open) return;
      e.preventDefault();
      const dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      T += dl / (ws + gap) * 0.5;
      clearTimeout(wt);
      wt = setTimeout(() => { T = Math.round(T); }, 160);
    }, { passive: false });

    $('prev').addEventListener('click', () => { T = Math.round(T) - 1; });
    $('next').addEventListener('click', () => { T = Math.round(T) + 1; });
    document.addEventListener('keydown', e => {
      if (dlg.open) return;
      if (e.key === 'ArrowLeft') T = Math.round(T) - 1;
      else if (e.key === 'ArrowRight') T = Math.round(T) + 1;
      else if (e.key === 'Enter' && document.activeElement === document.body) openDetail();
    });

    $('tabs').addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (c) jumpTo(c.dataset.cat ? books.findIndex(b => b.category === c.dataset.cat) : 0);
    });

    $('dClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    window.addEventListener('resize', measure);
  }

  async function init() {
    try { books = await api.books(); } catch (e) { $('cTitle').textContent = 'Could not load books'; return; }
    if (!books.length) { $('cTitle').textContent = 'No books yet'; return; }
    N = books.length; M = 3 * N;
    measure();

    let html = '';
    for (let c = 0; c < 3; c++) books.forEach((b, i) => { html += tapeHTML(b, c * N + i); });
    stage.innerHTML = html;
    tapes = [...stage.children];
    lift = new Array(M).fill(0);

    const cats = [...new Set(books.map(b => b.category))];
    $('tabs').innerHTML = ['', ...cats].map(c =>
      `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="false">${c ? esc(c) : 'All'}</button>`).join('');

    s = T = N;
    bind();
    requestAnimationFrame(frame);
  }

  init();
})();