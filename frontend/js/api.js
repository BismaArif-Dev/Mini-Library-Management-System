const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));

  // Login ke baghair admin page par aaye to login page par bhej do
  if (res.status === 401 && !path.startsWith('/auth/')) {
    const page = location.pathname.split('/').pop();
    if (page === 'admin.html') location.href = 'login.html?next=admin.html';
  }

  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const body = obj => JSON.stringify(obj);

const api = {
  // public
  stats: () => request('/stats'),
  books: (params = {}) => request('/books?' + new URLSearchParams(params)),
  book: (id) => request('/books/' + id),
  categories: () => request('/categories'),

  // auth
  me: () => request('/auth/me'),
  lock: () => request('/auth/lock'),
  login: (username, password) => request('/auth/login', { method: 'POST', body: body({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST', body: '{}' }),

  // admin only
  adminBooks: (params = {}) => request('/admin/books?' + new URLSearchParams(params)),
  members: () => request('/members'),
  member: (id) => request('/members/' + id),
  addBook: (b) => request('/books', { method: 'POST', body: body(b) }),
  updateBook: (id, b) => request('/books/' + id, { method: 'PUT', body: body(b) }),
  deleteBook: (id) => request('/books/' + id, { method: 'DELETE' }),
  addMember: (m) => request('/members', { method: 'POST', body: body(m) }),
  updateMember: (id, m) => request('/members/' + id, { method: 'PUT', body: body(m) }),
  deleteMember: (id) => request('/members/' + id, { method: 'DELETE' }),
  issue: (memberId, bookId) => request('/issue', { method: 'POST', body: body({ memberId, bookId }) }),
  returnBook: (memberId, bookId) => request('/return', { method: 'POST', body: body({ memberId, bookId }) }),
};