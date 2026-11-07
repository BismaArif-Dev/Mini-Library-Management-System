const seedBooks = [
  // ---------- Programming ----------
  { id: "B001", title: "C++ How to Program", author: "Paul Deitel & Harvey Deitel", category: "Programming", year: 2014, description: "A step-by-step introduction to C++ with many worked examples." },
  { id: "B002", title: "Object-Oriented Programming in C++", author: "Robert Lafore", category: "Programming", year: 2001, description: "Teaches classes, inheritance and polymorphism in plain language." },
  { id: "B003", title: "The C++ Programming Language", author: "Bjarne Stroustrup", category: "Programming", year: 2013, description: "The language reference written by the creator of C++." },
  { id: "B004", title: "Data Structures and Algorithm Analysis in C++", author: "Mark Allen Weiss", category: "Programming", year: 2013, description: "Lists, trees, graphs and sorting, with analysis of how fast each one runs." },

  // ---------- Computer Science ----------
  { id: "B005", title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest & Stein", category: "Computer Science", year: 2009, description: "The standard university reference on algorithm design and analysis." },
  { id: "B006", title: "Operating System Concepts", author: "Silberschatz, Galvin & Gagne", category: "Computer Science", year: 2018, description: "Processes, memory, files and scheduling explained for students." },
  { id: "B007", title: "Database System Concepts", author: "Silberschatz, Korth & Sudarshan", category: "Computer Science", year: 2019, description: "Relational databases, SQL, design and transactions." },
  { id: "B008", title: "Computer Networking: A Top-Down Approach", author: "James F. Kurose & Keith W. Ross", category: "Computer Science", year: 2021, description: "Networks taught from the application layer down to the wire." },
  { id: "B009", title: "Software Engineering", author: "Ian Sommerville", category: "Computer Science", year: 2015, description: "How real software projects are planned, built, tested and maintained." },

  // ---------- Mathematics ----------
  { id: "B010", title: "Thomas' Calculus", author: "Joel Hass, Christopher Heil & Maurice Weir", category: "Mathematics", year: 2018, description: "Limits, derivatives, integrals and series with plenty of practice problems." },
  { id: "B011", title: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen", category: "Mathematics", year: 2018, description: "Logic, sets, counting and graphs, the maths behind computer science." },
  { id: "B012", title: "Linear Algebra and Its Applications", author: "David C. Lay, Steven R. Lay & Judi McDonald", category: "Mathematics", year: 2015, description: "Vectors, matrices and linear transformations, taught with applications." },
  { id: "B013", title: "Advanced Engineering Mathematics", author: "Erwin Kreyszig", category: "Mathematics", year: 2011, description: "Differential equations, Fourier series and complex analysis for engineers." },
  { id: "B014", title: "Probability and Statistics for Engineers and Scientists", author: "Walpole, Myers, Myers & Ye", category: "Mathematics", year: 2011, description: "Probability, distributions and statistical inference with worked examples." },

  // ---------- Psychology ----------
  { id: "B015", title: "Psychology", author: "David G. Myers", category: "Psychology", year: 2014, description: "A full introduction to the mind, behaviour and how psychologists study them." },
  { id: "B016", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Psychology", year: 2011, description: "Explains the two systems of thought that shape our judgments and decisions." },
  { id: "B017", title: "Man's Search for Meaning", author: "Viktor E. Frankl", category: "Psychology", year: 1946, description: "A psychiatrist reflects on finding purpose through suffering." },
  { id: "B018", title: "Emotional Intelligence", author: "Daniel Goleman", category: "Psychology", year: 1995, description: "Why understanding emotions matters as much as intelligence." },

  // ---------- Literature ----------
  { id: "B019", title: "Hamlet", author: "William Shakespeare", category: "Literature", year: 1603, description: "The Danish prince hesitates over revenge in Shakespeare's best known tragedy." },
  { id: "B020", title: "Pride and Prejudice", author: "Jane Austen", category: "Literature", year: 1813, description: "A sharp, witty novel about love, class and first impressions." },
  { id: "B021", title: "Things Fall Apart", author: "Chinua Achebe", category: "Literature", year: 1958, description: "A village in Nigeria faces the arrival of colonial rule." },
  { id: "B022", title: "Ice-Candy-Man", author: "Bapsi Sidhwa", category: "Literature", year: 1988, description: "The Partition of 1947 seen through the eyes of a young girl in Lahore." },
  { id: "B023", title: "The Reluctant Fundamentalist", author: "Mohsin Hamid", category: "Literature", year: 2007, description: "A Pakistani man tells his story to a stranger in a Lahore cafe." },

  // ---------- Islamic & Pakistan Studies ----------
  { id: "B024", title: "The Reconstruction of Religious Thought in Islam", author: "Muhammad Iqbal", category: "Islamic & Pakistan Studies", year: 1930, description: "Allama Iqbal's lectures on faith, philosophy and the modern world." },
  { id: "B025", title: "Muhammad: His Life Based on the Earliest Sources", author: "Martin Lings", category: "Islamic & Pakistan Studies", year: 1983, description: "A biography of the Prophet drawn from the earliest Islamic sources." },
  { id: "B026", title: "Islam: The Straight Path", author: "John L. Esposito", category: "Islamic & Pakistan Studies", year: 1988, description: "An overview of Islamic beliefs, history and the Muslim world." },
  { id: "B027", title: "Pakistan: A Modern History", author: "Ian Talbot", category: "Islamic & Pakistan Studies", year: 1998, description: "Pakistan's political and social history from independence onward." },

  // ---------- Science ----------
  { id: "B028", title: "Fundamentals of Physics", author: "Halliday, Resnick & Walker", category: "Science", year: 2013, description: "Mechanics, waves, electricity and modern physics for first-year students." },
  { id: "B029", title: "Chemistry: The Central Science", author: "Theodore L. Brown, H. Eugene LeMay et al.", category: "Science", year: 2017, description: "General chemistry from atoms and bonding to reactions and equilibrium." },
  { id: "B030", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", year: 1988, description: "From the Big Bang to black holes, explained for general readers." },
];

const seedMembers = [
  // ---------- Students (10) ----------
  { id: "S001", type: "student", name: "Ayesha Khan", email: "ayesha.khan@campus.edu", detail: "BS Computer Science" },
  { id: "S002", type: "student", name: "Hamza Ali", email: "hamza.ali@campus.edu", detail: "BS Software Engineering" },
  { id: "S003", type: "student", name: "Fatima Zahra", email: "fatima.zahra@campus.edu", detail: "BS Mathematics" },
  { id: "S004", type: "student", name: "Usman Tariq", email: "usman.tariq@campus.edu", detail: "BS Computer Science" },
  { id: "S005", type: "student", name: "Zainab Bukhari", email: "zainab.bukhari@campus.edu", detail: "BS Psychology" },
  { id: "S006", type: "student", name: "Ahmed Raza", email: "ahmed.raza@campus.edu", detail: "BS Software Engineering" },
  { id: "S007", type: "student", name: "Maryam Iqbal", email: "maryam.iqbal@campus.edu", detail: "BS English Literature" },
  { id: "S008", type: "student", name: "Bilal Hussain", email: "bilal.hussain@campus.edu", detail: "BS Physics" },
  { id: "S009", type: "student", name: "Hira Noor", email: "hira.noor@campus.edu", detail: "BS Computer Science" },
  { id: "S010", type: "student", name: "Omar Farooq", email: "omar.farooq@campus.edu", detail: "BS Mathematics" },

  // ---------- Teachers (5) ----------
  { id: "T001", type: "teacher", name: "Dr. Sara Ahmed", email: "sara.ahmed@campus.edu", detail: "Department of Computer Science" },
  { id: "T002", type: "teacher", name: "Prof. Imran Malik", email: "imran.malik@campus.edu", detail: "Department of Mathematics" },
  { id: "T003", type: "teacher", name: "Dr. Nadia Hussain", email: "nadia.hussain@campus.edu", detail: "Department of Psychology" },
  { id: "T004", type: "teacher", name: "Prof. Tariq Mehmood", email: "tariq.mehmood@campus.edu", detail: "Department of English" },
  { id: "T005", type: "teacher", name: "Dr. Farhan Siddiqui", email: "farhan.siddiqui@campus.edu", detail: "Department of Physics" },
];

module.exports = { seedBooks, seedMembers };