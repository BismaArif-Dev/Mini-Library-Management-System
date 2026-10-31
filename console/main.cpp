#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

// ---------- chhote helper functions ----------
static string upper(string s) {
    transform(s.begin(), s.end(), s.begin(),
              [](unsigned char c) { return toupper(c); });
    return s;
}

static string readLine(const string& prompt) {
    cout << prompt;
    string s;
    if (!getline(cin, s)) exit(0);
    return s;
}

static int readInt(const string& prompt) {
    string s = readLine(prompt);
    try { return stoi(s); } catch (...) { return -1; }
}

static string fit(const string& s, size_t n) {
    return s.size() <= n ? s : s.substr(0, n - 2) + "..";
}

static string makeId(char prefix, int n) {
    ostringstream o;
    o << prefix << setw(3) << setfill('0') << n;
    return o.str();
}

// ================= Book =================
class Book {
    string id, title, author;
    string issuedTo;   // khali = available
    int dueDay;

public:
    Book(const string& id, const string& title, const string& author)
        : id(id), title(title), author(author), issuedTo(""), dueDay(0) {}

    const string& getId() const { return id; }
    const string& getTitle() const { return title; }
    const string& getAuthor() const { return author; }
    const string& getIssuedTo() const { return issuedTo; }
    int getDueDay() const { return dueDay; }
    bool isIssued() const { return !issuedTo.empty(); }

    void issue(const string& memberId, int today, int loanDays) {
        issuedTo = memberId;
        dueDay = today + loanDays;
    }
    void giveBack() {
        issuedTo.clear();
        dueDay = 0;
    }
};

// ================= Member (abstract) =================
class Member {
protected:
    string id, name;
    vector<string> borrowed;

public:
    Member(const string& id, const string& name) : id(id), name(name) {}
    virtual ~Member() {}

    // Pure virtual functions: har subclass ko inhe override karna ZAROORI hai
    virtual int getBorrowLimit() const = 0;
    virtual int getLoanDays() const = 0;
    virtual string getType() const = 0;

    const string& getId() const { return id; }
    const string& getName() const { return name; }
    const vector<string>& getBorrowed() const { return borrowed; }
    int borrowedCount() const { return (int)borrowed.size(); }

    // Runtime polymorphism: asal object (Student/Teacher) ka limit use hota hai
    bool canBorrow() const { return borrowedCount() < getBorrowLimit(); }

    bool hasBook(const string& bookId) const {
        return find(borrowed.begin(), borrowed.end(), bookId) != borrowed.end();
    }
    void addBook(const string& bookId) { borrowed.push_back(bookId); }
    void removeBook(const string& bookId) {
        borrowed.erase(remove(borrowed.begin(), borrowed.end(), bookId), borrowed.end());
    }
};

// ================= StudentMember =================
class StudentMember : public Member {
public:
    StudentMember(const string& id, const string& name) : Member(id, name) {}
    int getBorrowLimit() const override { return 3; }
    int getLoanDays() const override { return 14; }
    string getType() const override { return "Student"; }
};

// ================= TeacherMember =================
class TeacherMember : public Member {
public:
    TeacherMember(const string& id, const string& name) : Member(id, name) {}
    int getBorrowLimit() const override { return 5; }
    int getLoanDays() const override { return 30; }
    string getType() const override { return "Teacher"; }
};

// ================= Library =================
class Library {
    vector<Book> books;
    vector<unique_ptr<Member>> members;   // base class ke pointers
    int today = 1;
    int nextBook = 1, nextStudent = 1, nextTeacher = 1;

public:
    Library() {
        const char* data[][2] = {
            {"Clean Code", "Robert C. Martin"},
            {"The Pragmatic Programmer", "Hunt and Thomas"},
            {"Introduction to Algorithms", "Thomas H. Cormen"},
            {"Design Patterns", "Erich Gamma et al."},
            {"The C++ Programming Language", "Bjarne Stroustrup"},
            {"Atomic Habits", "James Clear"},
            {"Sapiens", "Yuval Noah Harari"},
            {"A Brief History of Time", "Stephen Hawking"},
            {"The Alchemist", "Paulo Coelho"},
            {"1984", "George Orwell"},
            {"Thinking, Fast and Slow", "Daniel Kahneman"},
            {"Discrete Mathematics", "Kenneth H. Rosen"},
        };
        for (auto& d : data) addBook(d[0], d[1], false);
        addMember(false, "Ayesha Khan", false);
        addMember(false, "Hamza Ali", false);
        addMember(true, "Dr. Sara Ahmed", false);
        addMember(true, "Prof. Imran Malik", false);
    }

    int getToday() const { return today; }
    void advanceDays(int n) { today += n; }

    Book* findBook(const string& id) {
        for (auto& b : books)
            if (b.getId() == upper(id)) return &b;
        return nullptr;
    }
    Member* findMember(const string& id) {
        for (auto& m : members)
            if (m->getId() == upper(id)) return m.get();
        return nullptr;
    }

    void addBook(const string& title, const string& author, bool say = true) {
        string id = makeId('B', nextBook++);
        books.emplace_back(id, title, author);
        if (say) cout << "Book added with ID " << id << ".\n";
    }

    void addMember(bool teacher, const string& name, bool say = true) {
        unique_ptr<Member> m;
        if (teacher) m = make_unique<TeacherMember>(makeId('T', nextTeacher++), name);
        else         m = make_unique<StudentMember>(makeId('S', nextStudent++), name);
        if (say) {
            cout << m->getType() << " added with ID " << m->getId()
                 << " (limit " << m->getBorrowLimit() << " books, "
                 << m->getLoanDays() << " days).\n";
        }
        members.push_back(std::move(m));
    }

    void issueBook(const string& memberId, const string& bookId) {
        Member* m = findMember(memberId);
        Book* b = findBook(bookId);
        if (!m) { cout << "Member not found.\n"; return; }
        if (!b) { cout << "Book not found.\n"; return; }
        if (b->isIssued()) {
            cout << "\"" << b->getTitle() << "\" is already issued.\n";
            return;
        }
        if (!m->canBorrow()) {
            cout << m->getName() << " (" << m->getType()
                 << ") has reached the limit of " << m->getBorrowLimit() << " books.\n";
            return;
        }
        b->issue(m->getId(), today, m->getLoanDays());
        m->addBook(b->getId());
        cout << "\"" << b->getTitle() << "\" issued to " << m->getName()
             << ". Due on day " << b->getDueDay() << ".\n";
    }

    void returnBook(const string& memberId, const string& bookId) {
        Member* m = findMember(memberId);
        Book* b = findBook(bookId);
        if (!m) { cout << "Member not found.\n"; return; }
        if (!b) { cout << "Book not found.\n"; return; }
        if (!m->hasBook(b->getId())) {
            cout << m->getName() << " has not borrowed \"" << b->getTitle() << "\".\n";
            return;
        }
        bool late = today > b->getDueDay();
        b->giveBack();
        m->removeBook(b->getId());
        cout << "\"" << b->getTitle() << "\" returned by " << m->getName()
             << (late ? " (it was overdue)." : ".") << "\n";
    }

    void showBooks() const {
        cout << "\nToday is day " << today << "\n";
        cout << left << setw(6) << "ID" << setw(32) << "Title"
             << setw(24) << "Author" << "Status\n";
        cout << string(86, '-') << "\n";
        for (const auto& b : books) {
            cout << left << setw(6) << b.getId() << setw(32) << fit(b.getTitle(), 30)
                 << setw(24) << fit(b.getAuthor(), 22);
            if (!b.isIssued()) cout << "Available";
            else {
                cout << "Issued to " << b.getIssuedTo() << ", due day " << b.getDueDay();
                if (today > b.getDueDay()) cout << " (OVERDUE)";
            }
            cout << "\n";
        }
    }

    void showMembers() const {
        cout << "\n" << left << setw(6) << "ID" << setw(24) << "Name"
             << setw(10) << "Type" << "Borrowed\n";
        cout << string(52, '-') << "\n";
        for (const auto& m : members) {
            // Virtual calls: har object apna type aur limit batata hai
            cout << left << setw(6) << m->getId() << setw(24) << fit(m->getName(), 22)
                 << setw(10) << m->getType()
                 << m->borrowedCount() << "/" << m->getBorrowLimit() << "\n";
        }
    }

    void showMemberStatus(const string& memberId) {
        Member* m = findMember(memberId);
        if (!m) { cout << "Member not found.\n"; return; }
        cout << "\n" << m->getName() << " (" << m->getType() << ", " << m->getId() << ")\n";
        cout << "Borrowed: " << m->borrowedCount() << " of " << m->getBorrowLimit()
             << " books, loan period " << m->getLoanDays() << " days\n";
        cout << (m->canBorrow() ? "Can borrow more books.\n"
                                : "Limit reached. Must return a book first.\n");
        for (const auto& bid : m->getBorrowed()) {
            const Book* b = findBook(bid);
            if (!b) continue;
            cout << "  - " << b->getId() << "  " << b->getTitle()
                 << "  (due day " << b->getDueDay()
                 << (today > b->getDueDay() ? ", OVERDUE" : "") << ")\n";
        }
    }
};

// ================= main: menu =================
int main() {
    Library lib;
    cout << "=== CampusShelf: Mini Library Management System ===\n";

    while (true) {
        cout << "\n1. Show all books\n"
             << "2. Show all members\n"
             << "3. Member status\n"
             << "4. Issue a book\n"
             << "5. Return a book\n"
             << "6. Add a book\n"
             << "7. Add a member\n"
             << "8. Move calendar forward (to test overdue)\n"
             << "0. Exit\n";
        int choice = readInt("Choose: ");

        switch (choice) {
            case 1: lib.showBooks(); break;
            case 2: lib.showMembers(); break;
            case 3: lib.showMemberStatus(readLine("Member ID (e.g. S001): ")); break;
            case 4: {
                string m = readLine("Member ID: ");
                string b = readLine("Book ID: ");
                lib.issueBook(m, b);
                break;
            }
            case 5: {
                string m = readLine("Member ID: ");
                string b = readLine("Book ID: ");
                lib.returnBook(m, b);
                break;
            }
            case 6: {
                string t = readLine("Title: ");
                string a = readLine("Author: ");
                if (t.empty() || a.empty()) cout << "Title and author are required.\n";
                else lib.addBook(t, a);
                break;
            }
            case 7: {
                string type = readLine("Type (s = student, t = teacher): ");
                string name = readLine("Full name: ");
                if (name.empty()) { cout << "Name is required.\n"; break; }
                if (type == "s" || type == "S") lib.addMember(false, name);
                else if (type == "t" || type == "T") lib.addMember(true, name);
                else cout << "Type must be s or t.\n";
                break;
            }
            case 8: {
                int n = readInt("Days to move forward: ");
                if (n > 0) { lib.advanceDays(n); cout << "Today is now day " << lib.getToday() << ".\n"; }
                else cout << "Enter a positive number.\n";
                break;
            }
            case 0: cout << "Goodbye!\n"; return 0;
            default: cout << "Invalid choice. Try again.\n";
        }
    }
}//g++ -std=c++17 -Wall main.cpp -o library.exe
// .\library.exe