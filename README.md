# CampusShelf: Mini Library Management System

A small integrated library system built with object-oriented design.
It manages books and two kinds of members (students and teachers),
with a web interface on top of a Node.js backend.

## Who can do what

| Role | Can do |
|---|---|
| Visitor (no login) | Browse and search the catalog, see which books are available |
| Admin (librarian) | Add, edit and delete books and members; issue and return books |

There is no sign-up page. There is a single admin account, created from
the command line. Members (students and teachers) do not log in; the
librarian issues books on their behalf.

## Borrowing rules

| Member  | Max books | Loan period |
|---------|-----------|-------------|
| Student | 3         | 14 days     |
| Teacher | 5         | 30 days     |

## How to run

```
cd backend
npm install
node create-admin.js <username> <password>
npm start
```

Open http://localhost:3000 and use "Staff login" to sign in.
The password must be at least 8 characters.

To reset the library data, stop the server and delete
`backend/data/library.json`. To reset the admin, run
`create-admin.js` again.

## Class design

```
Book

Member (abstract)
 ├── StudentMember
 └── TeacherMember

Library (manages Books and Members)
```

## OOP concepts and where they appear

| Concept | Where |
|---|---|
| Classes and objects | `Book`, `Member`, `StudentMember`, `TeacherMember`, `Library` in `backend/src/models/` |
| Constructors | Every class constructor, e.g. `Book` takes id, title, author, category, year |
| Encapsulation | Private fields `#issuedTo`, `#dueDate` in `Book` and `#borrowed` in `Member`, changed only through methods |
| Abstraction | `Member` cannot be instantiated directly (`new.target` check) |
| Inheritance | `StudentMember` and `TeacherMember` extend `Member` |
| Virtual functions | `getBorrowLimit()`, `getLoanDays()`, `getType()` are declared in `Member` and overridden in each subclass |
| Runtime polymorphism | `Member.canBorrow()` and `getInfo()` call the overridden methods of the actual object type |
| Object interaction | `Library.issueBook()` and `returnBook()` coordinate a `Book` and a `Member` |
| Conditions and counters | Limit checks, borrowed count, overdue check, stats counters |
| Status changes | A book moves between Available and Issued; a member's borrowed count changes |

## Security

- Passwords are hashed with scrypt and a random salt; the plain password is never stored.
- Sessions use a signed token in an HttpOnly, SameSite=Strict cookie that expires after 2 hours.
- Login is limited to 5 failed attempts per 15 minutes.
- All write and member endpoints require the admin session.
- Public endpoints do not reveal which member holds a book.
- Cross-site write requests are rejected, input length and type are checked, and basic security headers are set.
- Known limits: for a real deployment, serve over HTTPS and add the `Secure` cookie flag.

## Project structure

```
backend/
  server.js
  create-admin.js
  src/
    auth.js  routes.js  seed.js
    models/  Book  Member  StudentMember  TeacherMember  Library
  data/      library.json, admin.json, secret.key (created automatically)
frontend/
  index.html  catalog.html  login.html  admin.html
  css/  js/
```

## Tech

Node.js, Express, plain HTML, CSS and JavaScript. Data is stored in
`backend/data/library.json`.