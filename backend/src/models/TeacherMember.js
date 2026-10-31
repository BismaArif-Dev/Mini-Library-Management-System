const Member = require('./Member');

class TeacherMember extends Member {
  getBorrowLimit() { return 5; }
  getLoanDays()    { return 30; }
  getType()        { return 'Teacher'; }
}

module.exports = TeacherMember;