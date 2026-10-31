const Member = require('./Member');

class StudentMember extends Member {
  getBorrowLimit() { return 3; }
  getLoanDays()    { return 14; }
  getType()        { return 'Student'; }
}

module.exports = StudentMember;