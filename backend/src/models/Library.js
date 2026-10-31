const fs = require('fs');
const path = require('path');
const Book = require('./Book');
const StudentMember = require('./StudentMember');
const TeacherMember = require('./TeacherMember');
const { seedBooks, seedMembers } = require('../seed');

const DATA_FILE = path.join(__dirname, '../../data/library.json');

class LibraryError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class Library {
  constructor() {
    this.books = new Map();
    this.members = new Map();
    this.#load();
  }

  // ---------- helpers ----------
  #nextId(prefix, map) {
    const nums = [...map.keys()].map(k => parseInt(k.slice(1), 10));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return prefix + String(next).padStart(3, '0');
  }

  #createMember(type, id, name, email, detail) {
    if (type === 'student') return new StudentMember(id, name, email, detail);
    if (type === 'teacher') return new TeacherMember(id, name, email, detail);
    throw new LibraryError(400, "Member type must be 'student' or 'teacher'");
  }

  #save() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const data = {
      books: [...this.books.values()].map(b => b.toJSON()),
      members: [...this.members.values()].map(m => ({
        type: m.getType().toLowerCase(),
        id: m.id, name: m.name, email: m.email, detail: m.detail,
        borrowed: m.borrowedBookIds,
      })),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  #load() {
    if (!fs.existsSync(DATA_FILE)) {
      seedBooks.forEach(b => this.books.set(b.id, new Book(b)));
      seedMembers.forEach(m => {
        this.members.set(m.id, this.#createMember(m.type, m.id, m.name, m.email, m.detail));
      });
      this.#save();
      return;
    }
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    raw.books.forEach(b => this.books.set(b.id, new Book(b)));
    raw.members.forEach(m => {
      const member = this.#createMember(m.type, m.id, m.name, m.email, m.detail);
      m.borrowed.forEach(id => member.addBook(id));
      this.members.set(m.id, member);
    });
  }

  // ---------- books ----------
  getBook(id) {
    const book = this.books.get(id);
    if (!book) throw new LibraryError(404, `Book ${id} not found`);
    return book;
  }

  searchBooks({ search = '', category = '', available = '' } = {}) {
    const q = search.toLowerCase();
    return [...this.books.values()]
      .filter(b => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .filter(b => !category || b.category.toLowerCase() === category.toLowerCase())
      .filter(b => available === '' || (available === 'true') === !b.isIssued)
      .map(b => b.toJSON());
  }

  addBook({ title, author, category, year, description }) {
    if (!title || !author) throw new LibraryError(400, 'Title and author are required');
    const id = this.#nextId('B', this.books);
    const book = new Book({ id, title, author, category: category || 'General', year, description });
    this.books.set(id, book);
    this.#save();
    return book.toJSON();
  }

  getCategories() {
    return [...new Set([...this.books.values()].map(b => b.category))].sort();
  }

  // ---------- members ----------
  getMember(id) {
    const member = this.members.get(id);
    if (!member) throw new LibraryError(404, `Member ${id} not found`);
    return member;
  }

  addMember({ type, name, email, detail }) {
    if (!name || !email) throw new LibraryError(400, 'Name and email are required');
    const prefix = type === 'teacher' ? 'T' : 'S';
    const sameType = new Map([...this.members].filter(([k]) => k.startsWith(prefix)));
    const id = this.#nextId(prefix, sameType);
    const member = this.#createMember(type, id, name, email, detail);
    this.members.set(id, member);
    this.#save();
    return member.getInfo();
  }

  // ---------- issue / return ----------
  issueBook(memberId, bookId) {
    const member = this.getMember(memberId);
    const book = this.getBook(bookId);

    if (book.isIssued) {
      throw new LibraryError(409, `"${book.title}" is already issued`);
    }
    if (!member.canBorrow()) {
      throw new LibraryError(
        403,
        `${member.name} (${member.getType()}) has reached the limit of ${member.getBorrowLimit()} books`
      );
    }

    book.issue(member.id, member.getLoanDays());
    member.addBook(book.id);
    this.#save();
    return { message: `"${book.title}" issued to ${member.name}`, book: book.toJSON(), member: member.getInfo() };
  }

  returnBook(memberId, bookId) {
    const member = this.getMember(memberId);
    const book = this.getBook(bookId);

    if (!member.hasBook(book.id)) {
      throw new LibraryError(400, `${member.name} has not borrowed "${book.title}"`);
    }

    book.giveBack();
    member.removeBook(book.id);
    this.#save();
    return { message: `"${book.title}" returned by ${member.name}`, book: book.toJSON(), member: member.getInfo() };
  }
  // ---------- edit / delete ----------
  updateBook(id, { title, author, category, year, description }) {
    const book = this.getBook(id);
    if (title !== undefined) {
      if (!String(title).trim()) throw new LibraryError(400, 'Title cannot be empty');
      book.title = String(title).trim();
    }
    if (author !== undefined) {
      if (!String(author).trim()) throw new LibraryError(400, 'Author cannot be empty');
      book.author = String(author).trim();
    }
    if (category !== undefined) book.category = String(category).trim() || 'General';
    if (year !== undefined) book.year = year === '' ? undefined : year;
    if (description !== undefined) book.description = String(description).trim();
    this.#save();
    return book.toJSON();
  }

  deleteBook(id) {
    const book = this.getBook(id);
    if (book.isIssued) {
      throw new LibraryError(409, `"${book.title}" is issued. Return it before deleting.`);
    }
    this.books.delete(id);
    this.#save();
    return { message: `"${book.title}" deleted` };
  }

  updateMember(id, { name, email, detail }) {
    const member = this.getMember(id);
    if (name !== undefined) {
      if (!String(name).trim()) throw new LibraryError(400, 'Name cannot be empty');
      member.name = String(name).trim();
    }
    if (email !== undefined) {
      if (!String(email).trim()) throw new LibraryError(400, 'Email cannot be empty');
      member.email = String(email).trim();
    }
    if (detail !== undefined) member.detail = String(detail).trim();
    this.#save();
    return member.getInfo();
  }

  deleteMember(id) {
    const member = this.getMember(id);
    if (member.borrowedCount > 0) {
      throw new LibraryError(409, `${member.name} still has ${member.borrowedCount} book(s). Return them first.`);
    }
    this.members.delete(id);
    this.#save();
    return { message: `${member.name} deleted` };
  }
  // ---------- status ----------
  getStats() {
    const books = [...this.books.values()];
    return {
      totalBooks: books.length,
      issued: books.filter(b => b.isIssued).length,
      available: books.filter(b => !b.isIssued).length,
      overdue: books.filter(b => b.toJSON().overdue).length,
      totalMembers: this.members.size,
      students: [...this.members.values()].filter(m => m.getType() === 'Student').length,
      teachers: [...this.members.values()].filter(m => m.getType() === 'Teacher').length,
    };
  }
}

module.exports = { Library, LibraryError };