const filters = { search: '', category: '', available: '' };
let sortBy = 'title';
let allBooks = [];
let reqId = 0;

const $ = id => document.getElementById(id);

function readURL() {
  const p = new URLSearchParams(location.search);
  filters.search = p.get('search') || '';
  filters.category = p.get('category') || '';
  $('q').value = filters.search;
}

function writeURL() {
  const p = new URLSearchParams();
  if (filters.search) p.set('search', filters.search);
  if (filters.category) p.set('category', filters.category);
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function sorted(list) {
  const copy = [...list];
  if (sortBy === 'title') copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sortBy === 'author') copy.sort((a, b) => a.author.localeCompare(b.author));
  if (sortBy === 'newest') copy.sort((a, b) => (b.year || 0) - (a.year || 0));
  return copy;
}

function skeletons() {
  $('grid').innerHTML = Array.from({ length: 8 }, () => `
    <div class="card card--skeleton">
      <div class="skeleton skeleton--cover"></div>
      <div class="skeleton skeleton--line"></div>
      <div class="skeleton skeleton--line short"></div>
    </div>`).join('');
}

function cardHTML(b) {
  const issued = b.status !== 'Available';
  const note = issued && b.dueDate
    ? `<span class="card__due">Expected back ${fmtDate(b.dueDate)}</span>`
    : '';
  return `
    <article class="card ${issued ? 'card--issued' : ''}">
      ${coverHTML(b)}
      <div class="card__body">
        <h3 class="card__title">${esc(b.title)}</h3>
        <p class="card__meta">${esc(b.author)}${b.year ? ' · ' + esc(b.year) : ''}</p>
        <div class="card__row">${badgeHTML(b)}${note}</div>
      </div>
    </article>`;
}

function render() {
  const list = sorted(allBooks);
  $('count').textContent = `${list.length} ${list.length === 1 ? 'book' : 'books'}`;
  if (!list.length) {
    $('grid').innerHTML = `
      <div class="empty">
        <h3>No books found</h3>
        <p>Try a different word, or clear the filters.</p>
        <button class="btn btn-secondary" id="clearBtn" type="button">Clear filters</button>
      </div>`;
    return;
  }
  $('grid').innerHTML = list.map(cardHTML).join('');
}

async function load() {
  const id = ++reqId;
  skeletons();
  writeURL();
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.available) params.available = filters.available;
  try {
    const books = await api.books(params);
    if (id !== reqId) return;
    allBooks = books;
    render();
  } catch (e) {
    if (id !== reqId) return;
    $('grid').innerHTML = `<div class="empty"><h3>Could not load books</h3><p>${esc(e.message)}. Is the server running?</p></div>`;
  }
}

function drawChips(categories) {
  const items = ['', ...categories];
  $('chips').innerHTML = items.map(c => `
    <button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${filters.category === c}">
      ${c ? esc(c) : 'All'}
    </button>`).join('');
}

async function init() {
  readURL();
  try { drawChips(await api.categories()); } catch { drawChips([]); }

  let timer;
  $('q').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => { filters.search = e.target.value.trim(); load(); }, 250);
  });
  $('searchForm').addEventListener('submit', e => e.preventDefault());

  $('chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filters.category = chip.dataset.cat;
    $('chips').querySelectorAll('.chip').forEach(c =>
      c.setAttribute('aria-pressed', c.dataset.cat === filters.category));
    load();
  });

  $('availOnly').addEventListener('change', e => {
    filters.available = e.target.checked ? 'true' : '';
    load();
  });

  $('sort').addEventListener('change', e => { sortBy = e.target.value; render(); });

  $('grid').addEventListener('click', e => {
    if (e.target.closest('#clearBtn')) {
      filters.search = ''; filters.category = ''; filters.available = '';
      $('q').value = ''; $('availOnly').checked = false;
      $('chips').querySelectorAll('.chip').forEach(c =>
        c.setAttribute('aria-pressed', c.dataset.cat === ''));
      load();
    }
  });

  load();
}

document.addEventListener('DOMContentLoaded', init);