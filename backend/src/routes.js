const express = require('express');
const { Library, LibraryError } = require('./models/Library');
const auth = require('./auth');

const router = express.Router();
const library = new Library();

const h = fn => (req, res, next) => {
  try { res.json(fn(req, res)); } catch (e) { next(e); }
};
const created = fn => (req, res, next) => {
  try { res.status(201).json(fn(req, res)); } catch (e) { next(e); }
};

// Public ko member ki ID nahi dikhani
const publicBook = ({ issuedTo, ...rest }) => rest;

// Input ki lambai aur type check
const MAX = { title: 200, author: 150, category: 60, description: 1000, name: 100, email: 120, detail: 150 };
function guardBody(req, res, next) {
  const b = req.body || {};
  for (const [key, max] of Object.entries(MAX)) {
    if (b[key] !== undefined && (typeof b[key] !== 'string' || b[key].length > max)) {
      return res.status(400).json({ error: `${key} is invalid or too long (max ${max})` });
    }
  }
  if (b.year !== undefined && b.year !== '' && !(Number.isInteger(b.year) && b.year >= 1000 && b.year <= 2100)) {
    return res.status(400).json({ error: 'year must be a number between 1000 and 2100' });
  }
  next();
}

router.use(auth.sameOrigin);

// ================= PUBLIC (sirf dekhna) =================
router.get('/books', h(req => library.searchBooks(req.query).map(publicBook)));
router.get('/books/:id', h(req => publicBook(library.getBook(req.params.id).toJSON())));
router.get('/categories', h(() => library.getCategories()));
router.get('/stats', h(() => library.getStats()));

// ================= LOGIN =================
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', auth.me);
router.get('/auth/lock', auth.lockStatus);

// ================= ADMIN ONLY (iske neeche sab login mangta hai) =================
router.use(auth.requireAdmin);

// Books
router.get('/admin/books', h(req => library.searchBooks(req.query)));
router.post('/books', guardBody, created(req => library.addBook(req.body)));
router.put('/books/:id', guardBody, h(req => library.updateBook(req.params.id, req.body)));
router.delete('/books/:id', h(req => library.deleteBook(req.params.id)));

// Members
router.get('/members', h(() => [...library.members.values()].map(m => m.getInfo())));
router.get('/members/:id', h(req => {
  const member = library.getMember(req.params.id);
  const borrowedBooks = member.borrowedBookIds.map(id => library.getBook(id).toJSON());
  return { ...member.getInfo(), borrowedBooks };
}));
router.post('/members', guardBody, created(req => library.addMember(req.body)));
router.put('/members/:id', guardBody, h(req => library.updateMember(req.params.id, req.body)));
router.delete('/members/:id', h(req => library.deleteMember(req.params.id)));

// Issue / Return
router.post('/issue', h(req => library.issueBook(req.body.memberId, req.body.bookId)));
router.post('/return', h(req => library.returnBook(req.body.memberId, req.body.bookId)));
// Unknown API route
router.use((req, res) => res.status(404).json({ error: 'Not found' }));
// Error handler
router.use((err, req, res, next) => {
  if (err instanceof LibraryError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;