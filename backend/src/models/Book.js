class Book {
  #issuedTo = null;
  #dueDate = null;

  constructor({ id, title, author, category, year, description, issuedTo = null, dueDate = null }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.category = category;
    this.year = year;
    this.description = description || '';
    this.#issuedTo = issuedTo;
    this.#dueDate = dueDate;
  }

  get isIssued() { return this.#issuedTo !== null; }
  get issuedTo() { return this.#issuedTo; }
  get dueDate() { return this.#dueDate; }

  issue(memberId, loanDays) {
    this.#issuedTo = memberId;
    const due = new Date();
    due.setDate(due.getDate() + loanDays);
    this.#dueDate = due.toISOString();
  }

  giveBack() {
    this.#issuedTo = null;
    this.#dueDate = null;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      category: this.category,
      year: this.year,
      description: this.description,
      status: this.isIssued ? 'Issued' : 'Available',
      issuedTo: this.#issuedTo,
      dueDate: this.#dueDate,
      overdue: this.isIssued && new Date(this.#dueDate) < new Date(),
    };
  }
}

module.exports = Book;