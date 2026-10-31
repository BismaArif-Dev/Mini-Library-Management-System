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

    document.getElementById('heroStack').innerHTML =
      books.slice(0, 3).map(b => `<div class="stack__item">${coverHTML(b)}</div>`).join('');

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

document.addEventListener('DOMContentLoaded', initHome);