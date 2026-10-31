const { saveAdmin } = require('./src/auth');

const [username, password] = process.argv.slice(2);

if (!username || !password || password.length < 8) {
  console.log('Use: node create-admin.js <username> <password>');
  console.log('Password kam az kam 8 characters ka ho.');
  process.exit(1);
}

saveAdmin(username, password);
console.log('Admin account saved:', username);