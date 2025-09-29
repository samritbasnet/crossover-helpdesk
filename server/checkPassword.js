const bcrypt = require('bcryptjs');

const storedHash = '$2b$10$xz44aZ8Xdr8cgkSkWb355.4s7Vw51Ec.g3qYvMxofrvMEP9lNxEFC';
const password = 'admin123';

bcrypt.compare(password, storedHash, (err, result) => {
  if (err) {
    console.error('Error comparing passwords:', err);
    return;
  }
  console.log('Password match:', result);
});
