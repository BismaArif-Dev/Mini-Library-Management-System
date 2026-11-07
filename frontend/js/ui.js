const CAT_COLORS = {
  'Programming': '#1F4D3F',
  'Computer Science': '#2B4A6F',
  'Self Development': '#A94A18',
  'History': '#6B4A2B',
  'Science': '#243B55',
  'Fiction': '#5B3A55',
  'Psychology': '#2F6B6B',
  'Mathematics': '#4A4F5C',
  'General': '#5E564B',
    'Literature': '#5B3A55',
  'Islamic & Pakistan Studies': '#6B4A2B',
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function coverHTML(book) {
  const color = CAT_COLORS[book.category] || CAT_COLORS.General;
  return `
    <div class="cover" style="--cover:${color}" role="img" aria-label="Cover of ${esc(book.title)}">
      <span class="cover__cat">${esc(book.category)}</span>
      <span class="cover__title">${esc(book.title)}</span>
      <span class="cover__author">${esc(book.author)}</span>
    </div>`;
}

function badgeHTML(book) {
  if (book.overdue) return '<span class="badge badge--overdue">Overdue</span>';
  if (book.status === 'Available') return '<span class="badge badge--ok">Available</span>';
  return '<span class="badge badge--issued">Issued</span>';
}// Enter dabane par agle box mein jao; aakhri box mein Enter se form submit
function enterToNext(form) {
  form.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const el = e.target;
    if (!el.matches('input, select')) return;   // textarea mein Enter nayi line hi banaye

    const fields = [...form.querySelectorAll('input, select, textarea')]
      .filter(f => !f.disabled && f.type !== 'hidden' && f.offsetParent !== null);
    const i = fields.indexOf(el);
    if (i === -1) return;

    e.preventDefault();
    const next = fields[i + 1];
    if (next) next.focus();
    else form.requestSubmit();
  });
}