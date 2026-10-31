const $ = id => document.getElementById(id);
let books = [];
let members = [];
let editing = null;
let pendingDelete = null;
let issueMemberId = '';

function toast(msg, type = 'info') {
  let box = $('toasts');
  if (!box) {
    document.body.insertAdjacentHTML('beforeend', '<div class="toasts" id="toasts" aria-live="polite"></div>');
    box = $('toasts');
  }
  const t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.remove(), 4500);
}

function plural(n, word) { return `${n} ${word}${n === 1 ? '' : 's'}`; }
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function setError(input, msg) {
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  const err = $(input.id + 'Err');
  if (err) err.textContent = msg || '';
  return !msg;
}
function clearErrors(form) {
  form.querySelectorAll('.input').forEach(i => setError(i, ''));
}
function segs(used, limit) {
  return Array.from({ length: limit }, (_, i) =>
    `<span class="seg ${i < used ? 'is-new' : ''}"></span>`).join('');
}

/* ---------------- Tabs ---------------- */
function selectTab(name) {
  document.querySelectorAll('[role="tab"]').forEach(t => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll('.tabpanel').forEach(p => { p.hidden = p.id !== 'panel-' + name; });
  try { history.replaceState(null, '', '#' + name); } catch {}
}

/* ---------------- Rendering ---------------- */
function renderStats(s) {
  $('a-total').textContent = s.totalBooks;
  $('a-issued').textContent = s.issued;
  $('a-overdue').textContent = s.overdue;
  $('a-members').textContent = s.totalMembers;
}

function bookRow(b) {
  const who = b.issuedTo ? (members.find(m => m.id === b.issuedTo)?.name || b.issuedTo) : '';
  return `<tr>
    <td data-label="ID">${esc(b.id)}</td>
    <td data-label="Title"><strong>${esc(b.title)}</strong><br><span class="muted">${esc(b.author)}</span></td>
    <td data-label="Category">${esc(b.category)}</td>
    <td data-label="Status">${badgeHTML(b)}${who ? `<br><span class="muted">${esc(who)} · due ${fmtDate(b.dueDate)}</span>` : ''}</td>
    <td data-label="Actions"><div class="row-actions">
      <button class="btn btn-ghost btn-sm" data-act="edit-book" data-id="${esc(b.id)}" type="button">Edit</button>
      <button class="btn btn-ghost btn-sm btn-danger" data-act="del-book" data-id="${esc(b.id)}" type="button">Delete</button>
    </div></td>
  </tr>`;
}

function renderBooks() {
  const q = $('bookSearch').value.trim().toLowerCase();
  const list = books.filter(b => !q ||
    b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
  $('bookCount').textContent = plural(list.length, 'book');
  $('booksBody').innerHTML = list.length
    ? list.map(bookRow).join('')
    : '<tr><td colspan="5" class="muted">No books found.</td></tr>';
}

function memberRow(m) {
  return `<tr>
    <td data-label="ID">${esc(m.id)}</td>
    <td data-label="Name"><strong>${esc(m.name)}</strong><br><span class="muted">${esc(m.email)}</span></td>
    <td data-label="Type"><span class="badge badge--issued">${esc(m.type)}</span></td>
    <td data-label="Borrowed"><div class="usage"><div class="meter__bar">${segs(m.borrowedCount, m.borrowLimit)}</div><span>${m.borrowedCount}/${m.borrowLimit}</span></div></td>
    <td data-label="Detail">${esc(m.detail)}</td>
    <td data-label="Actions"><div class="row-actions">
      <button class="btn btn-ghost btn-sm" data-act="edit-member" data-id="${esc(m.id)}" type="button">Edit</button>
      <button class="btn btn-ghost btn-sm btn-danger" data-act="del-member" data-id="${esc(m.id)}" type="button">Delete</button>
    </div></td>
  </tr>`;
}

function renderMembers() {
  $('memCount').textContent = plural(members.length, 'member');
  $('membersBody').innerHTML = members.length
    ? members.map(memberRow).join('')
    : '<tr><td colspan="6" class="muted">No members yet.</td></tr>';
}

function renderIssue() {
  const sel = $('issueMember');
  if (!members.length) {
    sel.innerHTML = '';
    $('issueInfo').innerHTML = '<p class="muted">Add a member first.</p>';
    $('issueBook').innerHTML = '';
    $('issueBtn').disabled = true;
    return;
  }
  if (!members.some(m => m.id === issueMemberId)) issueMemberId = members[0].id;
  sel.innerHTML = members.map(m =>
    `<option value="${esc(m.id)}" ${m.id === issueMemberId ? 'selected' : ''}>${esc(m.name)} (${esc(m.type)})</option>`).join('');

  const m = members.find(x => x.id === issueMemberId);
  const full = !m.canBorrow;
  const loans = m.borrowedBookIds.map(id => books.find(b => b.id === id)).filter(Boolean);
  const available = books.filter(b => b.status === 'Available');

  $('issueInfo').innerHTML = `
    <p class="label">Borrowing meter</p>
    <p class="profile__big"><span>${m.borrowedCount}</span> of ${m.borrowLimit} books</p>
    <div class="meter__bar">${segs(m.borrowedCount, m.borrowLimit)}</div>
    <p class="meter__text">${full ? 'Limit reached. A book must be returned first.' : `${plural(m.borrowLimit - m.borrowedCount, 'more book')} can be issued · ${m.loanDays}-day loan`}</p>`;

  $('issueBook').innerHTML = available.length
    ? available.map(b => `<option value="${esc(b.id)}">${esc(b.title)} - ${esc(b.author)}</option>`).join('')
    : '<option value="">No books available</option>';
  $('issueBtn').disabled = full || !available.length;
  $('issueMsg').textContent = full ? `${m.name} has reached the limit of ${m.borrowLimit} books.` : '';

  $('loanList').innerHTML = loans.length
    ? `<ul class="loans">${loans.map(b => {
        const color = CAT_COLORS[b.category] || CAT_COLORS.General;
        return `<li class="loan ${b.overdue ? 'loan--late' : ''}">
          <div class="thumb" style="--cover:${color}" aria-hidden="true"></div>
          <div class="loan__info">
            <h3 class="loan__title">${esc(b.title)}</h3>
            <p class="loan__meta">${esc(b.author)}</p>
            <p class="loan__due">Due ${b.dueDate ? fmtDate(b.dueDate) : '-'} ${b.overdue ? '<span class="badge badge--overdue">Overdue</span>' : ''}</p>
          </div>
          <button class="btn btn-secondary btn-sm" data-act="return" data-id="${esc(b.id)}" type="button">Return</button>
        </li>`;
      }).join('')}</ul>`
    : '<p class="muted">This member has no borrowed books.</p>';
}

function renderAll() {
  renderBooks();
  renderMembers();
  renderIssue();
}

async function loadAll() {
  try {
    const [stats, b, m, cats] = await Promise.all([
      api.stats(), api.adminBooks(), api.members(), api.categories(),
    ]);
    books = b;
    members = m;
    renderStats(stats);
    $('catList').innerHTML = cats.map(c => `<option value="${esc(c)}"></option>`).join('');
    renderAll();
  } catch (e) {
    toast(e.message, 'error');
  }
}

/* ---------------- Book form ---------------- */
function openBook(book) {
  editing = book ? { kind: 'book', id: book.id } : null;
  $('bookForm').reset();
  clearErrors($('bookForm'));
  $('bookDlgTitle').textContent = book ? 'Edit book' : 'Add a book';
  $('bSubmit').textContent = book ? 'Save changes' : 'Add book';
  if (book) {
    $('bTitle').value = book.title;
    $('bAuthor').value = book.author;
    $('bCategory').value = book.category;
    $('bYear').value = book.year || '';
    $('bDesc').value = book.description || '';
  }
  $('bookDlg').showModal();
    setTimeout(() => $('bTitle').focus(), 50);
}

async function submitBook(e) {
  e.preventDefault();
  const title = $('bTitle'), author = $('bAuthor');
  const ok1 = setError(title, title.value.trim() ? '' : 'Title is required');
  const ok2 = setError(author, author.value.trim() ? '' : 'Author is required');
  if (!ok1 || !ok2) return;

  const yearText = $('bYear').value.trim();
  const base = {
    title: title.value.trim(),
    author: author.value.trim(),
    category: $('bCategory').value.trim(),
    description: $('bDesc').value.trim(),
  };

  const btn = $('bSubmit');
  btn.classList.add('is-loading');
  try {
    if (editing) {
      await api.updateBook(editing.id, { ...base, year: yearText ? Number(yearText) : '' });
      toast(`"${base.title}" updated.`, 'success');
    } else {
      const b = await api.addBook({ ...base, year: yearText ? Number(yearText) : undefined });
      toast(`"${b.title}" added as ${b.id}.`, 'success');
    }
    $('bookDlg').close();
    loadAll();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.classList.remove('is-loading');
  }
}

/* ---------------- Member form ---------------- */
function openMember(member) {
  editing = member ? { kind: 'member', id: member.id } : null;
  $('memberForm').reset();
  clearErrors($('memberForm'));
  $('memberDlgTitle').textContent = member ? 'Edit member' : 'Add a member';
  $('mSubmit').textContent = member ? 'Save changes' : 'Add member';
  $('mType').disabled = !!member;
  if (member) {
    $('mType').value = member.type.toLowerCase();
    $('mName').value = member.name;
    $('mEmail').value = member.email;
    $('mDetail').value = member.detail || '';
  }
  $('memberDlg').showModal();
   setTimeout(() => $('mName').focus(), 50);
}

async function submitMember(e) {
  e.preventDefault();
  const name = $('mName'), email = $('mEmail');
  const ok1 = setError(name, name.value.trim() ? '' : 'Name is required');
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  const ok2 = setError(email, valid ? '' : 'Enter a valid email address');
  if (!ok1 || !ok2) return;

  const base = { name: name.value.trim(), email: email.value.trim(), detail: $('mDetail').value.trim() };
  const btn = $('mSubmit');
  btn.classList.add('is-loading');
  try {
    if (editing) {
      await api.updateMember(editing.id, base);
      toast(`${base.name} updated.`, 'success');
    } else {
      const m = await api.addMember({ type: $('mType').value, ...base });
      toast(`${m.name} added as ${m.id} (${m.type}, limit ${m.borrowLimit}).`, 'success');
    }
    $('memberDlg').close();
    loadAll();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.classList.remove('is-loading');
  }
}

/* ---------------- Delete ---------------- */
function askDelete(kind, id) {
  const item = kind === 'book' ? books.find(b => b.id === id) : members.find(m => m.id === id);
  if (!item) return;
  pendingDelete = { kind, id, name: kind === 'book' ? item.title : item.name };
  $('delText').textContent = `Delete "${pendingDelete.name}"? This cannot be undone.`;
  $('delDlg').showModal();
}

async function confirmDelete() {
  const btn = $('delOk');
  btn.classList.add('is-loading');
  try {
    if (pendingDelete.kind === 'book') await api.deleteBook(pendingDelete.id);
    else await api.deleteMember(pendingDelete.id);
    toast(`"${pendingDelete.name}" deleted.`, 'success');
    $('delDlg').close();
    loadAll();
  } catch (err) {
    $('delDlg').close();
    toast(err.message, 'error');
  } finally {
    btn.classList.remove('is-loading');
  }
}

/* ---------------- Issue / Return ---------------- */
async function doIssue() {
  const memberId = $('issueMember').value;
  const bookId = $('issueBook').value;
  if (!memberId || !bookId) return;
  const btn = $('issueBtn');
  btn.classList.add('is-loading');
  btn.disabled = true;
  try {
    const r = await api.issue(memberId, bookId);
    toast(r.message, 'success');
    await loadAll();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.classList.remove('is-loading');
    renderIssue();
  }
}

async function doReturn(bookId) {
  try {
    const r = await api.returnBook(issueMemberId, bookId);
    toast(r.message, 'success');
    loadAll();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---------------- Init ---------------- */
function init() {
  document.querySelectorAll('[role="tab"]').forEach(t =>
    t.addEventListener('click', () => selectTab(t.dataset.tab)));
  const start = location.hash.slice(1);
  selectTab(['books', 'members', 'issue'].includes(start) ? start : 'books');

  $('addBookBtn').addEventListener('click', () => openBook(null));
  $('addMemberBtn').addEventListener('click', () => openMember(null));
  $('bookForm').addEventListener('submit', submitBook);
    enterToNext($('bookForm'));
  enterToNext($('memberForm'));
  $('memberForm').addEventListener('submit', submitMember);
  $('bookCancel').addEventListener('click', () => $('bookDlg').close());
  $('memberCancel').addEventListener('click', () => $('memberDlg').close());
  $('delCancel').addEventListener('click', () => $('delDlg').close());
  $('delOk').addEventListener('click', confirmDelete);
  $('bookSearch').addEventListener('input', renderBooks);
  $('issueMember').addEventListener('change', e => { issueMemberId = e.target.value; renderIssue(); });
  $('issueBtn').addEventListener('click', doIssue);

  ['bTitle', 'bAuthor', 'mName', 'mEmail'].forEach(id =>
    $(id).addEventListener('input', () => setError($(id), '')));

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.act === 'edit-book') openBook(books.find(x => x.id === id));
    if (b.dataset.act === 'del-book') askDelete('book', id);
    if (b.dataset.act === 'edit-member') openMember(members.find(x => x.id === id));
    if (b.dataset.act === 'del-member') askDelete('member', id);
    if (b.dataset.act === 'return') doReturn(id);
  });

  loadAll();
}

document.addEventListener('DOMContentLoaded', init);