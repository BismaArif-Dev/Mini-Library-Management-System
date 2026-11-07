async function initHome() {
  // Hero search: catalog page par le jata hai
  document.getElementById('heroSearch').addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('q').value.trim();
    window.location.href = 'catalog.html' + (q ? '?search=' + encodeURIComponent(q) : '');
  });

  // Stats
  try {
    const s = await api.stats();
       countUp('stat-total', s.totalBooks);
    countUp('stat-available', s.available);
    countUp('stat-issued', s.issued);
    countUp('stat-members', s.totalMembers);
  } catch (e) {
    document.querySelectorAll('.stat__num').forEach(el => (el.textContent = '-'));
  }

  // Books: hero stack, shelf, categories
  const shelf = document.getElementById('shelf');
  const catList = document.getElementById('catList');
  try {
    const books = await api.books();

      buildHero(books);
          initInteractive(books);

    const available = books.filter(b => b.status === 'Available').slice(0, 8);
    shelf.innerHTML = available.length
      ? available.map(b => `
        <a class="shelf__item shelf__link" href="catalog.html?search=${encodeURIComponent(b.title)}">
          ${coverHTML(b)}
          <h3 class="shelf__title">${esc(b.title)}</h3>
          <p class="shelf__author">${esc(b.author)}</p>
          ${badgeHTML(b)}
        </a>`).join('')
      : '<p>No books available right now.</p>';

    const counts = {};
    books.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    catList.innerHTML = Object.keys(counts).sort().map(c => `
      <li>
        <a class="cat" href="catalog.html?category=${encodeURIComponent(c)}">
          <span class="cat__name">${esc(c)}</span>
          <span class="cat__count">${counts[c]} ${counts[c] === 1 ? 'book' : 'books'}</span>
        </a>
      </li>`).join('');
  } catch (e) {
    shelf.innerHTML = '<p>Could not load books. Is the server running?</p>';
  }
}

document.addEventListener('DOMContentLoaded', initHome);function initInteractive(books) {
  // ---------- Shelf arrows ----------
  const shelf = document.getElementById('shelf');
  const prev = document.getElementById('shelfPrev');
  const next = document.getElementById('shelfNext');
  const arrows = () => {
    prev.disabled = shelf.scrollLeft < 8;
    next.disabled = shelf.scrollLeft + shelf.clientWidth >= shelf.scrollWidth - 8;
  };
  prev.addEventListener('click', () => shelf.scrollBy({ left: -shelf.clientWidth * 0.8, behavior: 'smooth' }));
  next.addEventListener('click', () => shelf.scrollBy({ left: shelf.clientWidth * 0.8, behavior: 'smooth' }));
  shelf.addEventListener('scroll', arrows, { passive: true });
  window.addEventListener('resize', arrows);
  arrows();

  // ---------- Live suggestions ----------
  const input = document.getElementById('q');
  const list = document.getElementById('suggest');
  let items = [];
  let active = -1;

  const go = b => { location.href = 'catalog.html?search=' + encodeURIComponent(b.title); };

  const close = () => {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const paint = () => {
    list.innerHTML = items.map((b, i) => `
      <li role="option" id="sg${i}" class="suggest__item ${i === active ? 'is-active' : ''}"
          data-i="${i}" aria-selected="${i === active}">
        <span class="suggest__title">${esc(b.title)}</span>
        <span class="suggest__meta">${esc(b.author)}</span>
      </li>`).join('');
    if (active >= 0) input.setAttribute('aria-activedescendant', 'sg' + active);
    else input.removeAttribute('aria-activedescendant');
  };

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { close(); return; }
    items = books.filter(b =>
      b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)).slice(0, 5);
    if (!items.length) { close(); return; }
    active = -1;
    paint();
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  });

  input.addEventListener('keydown', e => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; paint(); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); go(items[active]); }
    else if (e.key === 'Escape') { close(); }
  });

  // mousedown (click nahi), taake input ka blur list ko pehle band na kar de
  list.addEventListener('mousedown', e => {
    const li = e.target.closest('.suggest__item');
    if (li) { e.preventDefault(); go(items[Number(li.dataset.i)]); }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
}