const seedBooks = [
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

const seedMembers = [
  { id: 'S001', type: 'student', name: 'Ayesha Khan', email: 'ayesha@campus.edu', detail: 'BS Computer Science' },
  { id: 'S002', type: 'student', name: 'Hamza Ali', email: 'hamza@campus.edu', detail: 'BS Software Engineering' },
  { id: 'T001', type: 'teacher', name: 'Dr. Sara Ahmed', email: 'sara@campus.edu', detail: 'Department of Computer Science' },
  { id: 'T002', type: 'teacher', name: 'Prof. Imran Malik', email: 'imran@campus.edu', detail: 'Department of Mathematics' },
];

module.exports = { seedBooks, seedMembers };