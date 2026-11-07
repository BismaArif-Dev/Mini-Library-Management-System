// DEMO API: server ki jagah browser ke andar chalta hai (localStorage mein data)
const DB_KEY = 'cs_demo_db_v1';
const LOGIN_KEY = 'cs_demo_admin';
const ATTEMPT_KEY = 'cs_demo_attempts';
const DEMO_USER = 'admin';
const DEMO_PASS = 'demo1234';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 2 * 60 * 60 * 1000;
const DAY = 86400000;

const RULES = {
  student: { type: 'Student', limit: 3, days: 14 },
  teacher: { type: 'Teacher', limit: 5, days: 30 },
};

const SEED_BOOKS = [
  { id: 'B001', title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', year: 2008, description: 'A handbook of agile software craftsmanship.' },
  { id: 'B002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', category: 'Programming', year: 1999, description: 'Journey to mastery for modern developers.' },
  { id: 'B003', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', year: 2009, description: 'The standard reference on algorithms.' },
  { id: 'B004', title: 'Design Patterns', author: 'Erich Gamma et al.', category: 'Programming', year: 1994, description: 'Elements of reusable object-oriented software.' },
  { id: 'B005', title: 'The C++ Programming Language', author: 'Bjarne Stroustrup', category: 'Programming', year: 2013, description: 'By the creator of C++.' },
  { id: 'B006', title: 'Atomic Habits', author: 'James Clear', category: 'Self Development', year: 2018, description: 'Tiny changes, remarkable results.' },
  { id: 'B007', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', year: 2011, description: 'A brief history of humankind.' },
  { id: 'B008', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', year: 1988, description: 'From the Big Bang to black holes.' },
  { id: 'B009', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', year: 1988, description: 'A shepherd follows his dream across the desert.' },
  { id: 'B010', title: '1984', author: 'George Orwell', category: 'Fiction', year: 1949, description: 'A dystopian classic about surveillance.' },
  { id: 'B011', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', year: 2011, description: 'The two systems that drive the way we think.' },
  { id: 'B012', title: 'Discrete Mathematics', author: 'Kenneth H. Rosen', category: 'Mathematics', year: 2018, description: 'Foundations for computer science.' },
];

const SEED_MEMBERS = [
  { id: 'S001', type: 'student', name: 'Ayesha Khan', email: 'ayesha@campus.edu', detail: 'BS Computer Science' },
  { id: 'S002', type: 'student', name: 'Hamza Ali', email: 'hamza@campus.edu', detail: 'BS Software Engineering' },
  { id: 'T001', type: 'teacher', name: 'Dr. Sara Ahmed', email: 'sara@campus.edu', detail: 'Department of Computer Science' },
  { id: 'T002', type: 'teacher', name: 'Prof. Imran Malik', email: 'imran@campus.edu', detail: 'Department of Mathematics' },
];

/* ---------- storage ---------- */
const memoryStore = {};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return memoryStore[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { memoryStore[k] = v; } },
  del(k) { try { localStorage.removeItem(k); } catch { delete memoryStore[k]; } },
};

function loadDB() {
  const raw = store.get(DB_KEY);
  if (raw) { try { return JSON.parse(raw); } catch {} }
  const db = {
    books: SEED_BOOKS.map(b => ({ ...b, issuedTo: null, dueDate: null })),
    members: SEED_MEMBERS.map(m => ({ ...m, borrowed: [] })),
  };
  saveDB(db);
  return db;
}
function saveDB(db) { store.set(DB_KEY, JSON.stringify(db)); }

/* ---------- helpers ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fail(status, message, extra) {
  const e = new Error(message);
  e.status = status;
  e.data = { error: message, ...(extra || {}) };
  return e;
}
function bookJSON(b) {
  return {
    id: b.id, title: b.title, author: b.author, category: b.category,
    year: b.year, description: b.description,
    status: b.issuedTo ? 'Issued' : 'Available',
    issuedTo: b.issuedTo, dueDate: b.dueDate,
    overdue: !!b.issuedTo && new Date(b.dueDate) < new Date(),
  };
}
const pub = ({ issuedTo, ...rest }) => rest;
function memberInfo(m) {
  const r = RULES[m.type];
  return {
    id: m.id, name: m.name, email: m.email, type: r.type, detail: m.detail,
    borrowLimit: r.limit, loanDays: r.days,
    borrowedCount: m.borrowed.length, borrowedBookIds: [...m.borrowed],
    canBorrow: m.borrowed.length < r.limit,
  };
}
function nextId(prefix, list) {
  const nums = list.filter(x => x.id.startsWith(prefix)).map(x => parseInt(x.id.slice(1), 10));
  return prefix + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}
function findBook(db, id) {
  const b = db.books.find(x => x.id === id);
  if (!b) throw fail(404, `Book ${id} not found`);
  return b;
}
function findMember(db, id) {
  const m = db.members.find(x => x.id === id);
  if (!m) throw fail(404, `Member ${id} not found`);
  return m;
}
function searchBooks(db, p = {}) {
  const q = String(p.search || '').toLowerCase();
  return db.books
    .filter(b => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    .filter(b => !p.category || b.category.toLowerCase() === String(p.category).toLowerCase())
    .filter(b => p.available === undefined || p.available === '' || (p.available === 'true') === !b.issuedTo)
    .map(bookJSON);
}

/* ---------- admin session ---------- */
function adminSession() {
  try {
    const s = JSON.parse(store.get(LOGIN_KEY));
    return s && s.exp > Date.now() ? s : null;
  } catch { return null; }
}
function needAdmin() {
  if (adminSession()) return;
  const page = location.pathname.split('/').pop();
  if (page === 'admin.html') location.href = 'login.html?next=admin.html';
  throw fail(401, 'Admin login required');
}

/* ---------- login lock ---------- */
function attemptsState() {
  try { return JSON.parse(store.get(ATTEMPT_KEY)) || { count: 0, lockedUntil: 0 }; }
  catch { return { count: 0, lockedUntil: 0 }; }
}
function lockLeft() {
  const a = attemptsState();
  if (a.lockedUntil > Date.now()) return Math.ceil((a.lockedUntil - Date.now()) / 1000);
  if (a.lockedUntil) store.del(ATTEMPT_KEY);
  return 0;
}

/* ---------- the API (same names as the real one) ---------- */
async function run(fn) { await sleep(120); return fn(); }

const api = {
  // public
  stats: () => run(() => {
    const db = loadDB();
    const issued = db.books.filter(b => b.issuedTo).length;
    return {
      totalBooks: db.books.length, issued, available: db.books.length - issued,
      overdue: db.books.filter(b => bookJSON(b).overdue).length,
      totalMembers: db.members.length,
      students: db.members.filter(m => m.type === 'student').length,
      teachers: db.members.filter(m => m.type === 'teacher').length,
    };
  }),
  books: (params = {}) => run(() => searchBooks(loadDB(), params).map(pub)),
  book: id => run(() => pub(bookJSON(findBook(loadDB(), id)))),
  categories: () => run(() => [...new Set(loadDB().books.map(b => b.category))].sort()),

  // auth
  me: () => run(() => {
    const s = adminSession();
    return s ? { admin: true, username: s.u } : { admin: false };
  }),
  lock: () => run(() => {
    const w = lockLeft();
    return { locked: w > 0, retryAfter: w };
  }),
  login: (username, password) => run(() => {
    const wait = lockLeft();
    if (wait > 0) throw fail(429, 'Too many failed attempts', { retryAfter: wait });
    if (username === DEMO_USER && password === DEMO_PASS) {
      store.del(ATTEMPT_KEY);
      store.set(LOGIN_KEY, JSON.stringify({ u: username, exp: Date.now() + SESSION_MS }));
      return { ok: true, username };
    }
    const a = attemptsState();
    a.count++;
    if (a.count >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MS;
    store.set(ATTEMPT_KEY, JSON.stringify(a));
    if (a.count >= MAX_ATTEMPTS) throw fail(429, 'Too many failed attempts', { retryAfter: LOCK_MS / 1000 });
    throw fail(401, 'Wrong username or password', { attemptsLeft: MAX_ATTEMPTS - a.count });
  }),
  logout: () => run(() => { store.del(LOGIN_KEY); return { ok: true }; }),

  // admin only
  adminBooks: (params = {}) => run(() => { needAdmin(); return searchBooks(loadDB(), params); }),
  members: () => run(() => { needAdmin(); return loadDB().members.map(memberInfo); }),
  member: id => run(() => {
    needAdmin();
    const db = loadDB();
    const m = findMember(db, id);
    return { ...memberInfo(m), borrowedBooks: m.borrowed.map(bid => bookJSON(findBook(db, bid))) };
  }),

  addBook: b => run(() => {
    needAdmin();
    if (!b.title || !b.author) throw fail(400, 'Title and author are required');
    const db = loadDB();
    const book = {
      id: nextId('B', db.books), title: String(b.title).trim(), author: String(b.author).trim(),
      category: String(b.category || '').trim() || 'General', year: b.year,
      description: String(b.description || '').trim(), issuedTo: null, dueDate: null,
    };
    db.books.push(book);
    saveDB(db);
    return bookJSON(book);
  }),
  updateBook: (id, b) => run(() => {
    needAdmin();
    const db = loadDB();
    const book = findBook(db, id);
    if (b.title !== undefined) {
      if (!String(b.title).trim()) throw fail(400, 'Title cannot be empty');
      book.title = String(b.title).trim();
    }
    if (b.author !== undefined) {
      if (!String(b.author).trim()) throw fail(400, 'Author cannot be empty');
      book.author = String(b.author).trim();
    }
    if (b.category !== undefined) book.category = String(b.category).trim() || 'General';
    if (b.year !== undefined) book.year = b.year === '' ? undefined : b.year;
    if (b.description !== undefined) book.description = String(b.description).trim();
    saveDB(db);
    return bookJSON(book);
  }),
  deleteBook: id => run(() => {
    needAdmin();
    const db = loadDB();
    const book = findBook(db, id);
    if (book.issuedTo) throw fail(409, `"${book.title}" is issued. Return it before deleting.`);
    db.books = db.books.filter(x => x.id !== id);
    saveDB(db);
    return { message: `"${book.title}" deleted` };
  }),

  addMember: m => run(() => {
    needAdmin();
    if (!m.name || !m.email) throw fail(400, 'Name and email are required');
    const type = m.type === 'teacher' ? 'teacher' : 'student';
    const db = loadDB();
    const member = {
      id: nextId(type === 'teacher' ? 'T' : 'S', db.members), type,
      name: String(m.name).trim(), email: String(m.email).trim(),
      detail: String(m.detail || '').trim(), borrowed: [],
    };
    db.members.push(member);
    saveDB(db);
    return memberInfo(member);
  }),
  updateMember: (id, m) => run(() => {
    needAdmin();
    const db = loadDB();
    const member = findMember(db, id);
    if (m.name !== undefined) {
      if (!String(m.name).trim()) throw fail(400, 'Name cannot be empty');
      member.name = String(m.name).trim();
    }
    if (m.email !== undefined) {
      if (!String(m.email).trim()) throw fail(400, 'Email cannot be empty');
      member.email = String(m.email).trim();
    }
    if (m.detail !== undefined) member.detail = String(m.detail).trim();
    saveDB(db);
    return memberInfo(member);
  }),
  deleteMember: id => run(() => {
    needAdmin();
    const db = loadDB();
    const member = findMember(db, id);
    if (member.borrowed.length) {
      throw fail(409, `${member.name} still has ${member.borrowed.length} book(s). Return them first.`);
    }
    db.members = db.members.filter(x => x.id !== id);
    saveDB(db);
    return { message: `${member.name} deleted` };
  }),

  issue: (memberId, bookId) => run(() => {
    needAdmin();
    const db = loadDB();
    const member = findMember(db, memberId);
    const book = findBook(db, bookId);
    const r = RULES[member.type];
    if (book.issuedTo) throw fail(409, `"${book.title}" is already issued`);
    if (member.borrowed.length >= r.limit) {
      throw fail(403, `${member.name} (${r.type}) has reached the limit of ${r.limit} books`);
    }
    book.issuedTo = member.id;
    book.dueDate = new Date(Date.now() + r.days * DAY).toISOString();
    member.borrowed.push(book.id);
    saveDB(db);
    return { message: `"${book.title}" issued to ${member.name}`, book: bookJSON(book), member: memberInfo(member) };
  }),
  returnBook: (memberId, bookId) => run(() => {
    needAdmin();
    const db = loadDB();
    const member = findMember(db, memberId);
    const book = findBook(db, bookId);
    if (!member.borrowed.includes(book.id)) {
      throw fail(400, `${member.name} has not borrowed "${book.title}"`);
    }
    book.issuedTo = null;
    book.dueDate = null;
    member.borrowed = member.borrowed.filter(x => x !== book.id);
    saveDB(db);
    return { message: `"${book.title}" returned by ${member.name}`, book: bookJSON(book), member: memberInfo(member) };
  }),
};