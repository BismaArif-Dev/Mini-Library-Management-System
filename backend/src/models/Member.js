class Member {
  #borrowed = [];

  constructor(id, name, email, detail = '') {
    if (new.target === Member) {
      throw new TypeError('Member is abstract and cannot be instantiated directly');
    }
    this.id = id;
    this.name = name;
    this.email = email;
    this.detail = detail;
  }

  // "Pure virtual" functions: har subclass ko inhe override karna ZAROORI hai
  getBorrowLimit() { throw new Error('getBorrowLimit() must be implemented'); }
  getLoanDays()    { throw new Error('getLoanDays() must be implemented'); }
  getType()        { throw new Error('getType() must be implemented'); }

  get borrowedBookIds() { return [...this.#borrowed]; }
  get borrowedCount()   { return this.#borrowed.length; }

  canBorrow() { return this.#borrowed.length < this.getBorrowLimit(); }

  addBook(bookId)    { this.#borrowed.push(bookId); }
  removeBook(bookId) { this.#borrowed = this.#borrowed.filter(id => id !== bookId); }
  hasBook(bookId)    { return this.#borrowed.includes(bookId); }

  // Runtime polymorphism: asal subclass ke overridden methods call hote hain
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      type: this.getType(),
      detail: this.detail,
      borrowLimit: this.getBorrowLimit(),
      loanDays: this.getLoanDays(),
      borrowedCount: this.borrowedCount,
      borrowedBookIds: this.borrowedBookIds,
      canBorrow: this.canBorrow(),
    };
  }
}

module.exports = Member;