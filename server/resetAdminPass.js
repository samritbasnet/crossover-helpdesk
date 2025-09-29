const bcrypt = require('bcryptjs');
const { initializeDatabase, getDatabase } = require('./config/database');

// Initialize the database first
initializeDatabase()
  .then(() => {
    const db = getDatabase();
    const newPassword = 'admin123';
    const adminEmail = 'admin@helpdesk.com';

    // Hash the new password
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        process.exit(1);
      }
      
      // Update the admin password
      db.run(
        'UPDATE users SET password = ? WHERE email = ?',
        [hash, adminEmail],
        function(err) {
          if (err) {
            console.error('Error updating password:', err);
            process.exit(1);
          }
          
          console.log('Admin password updated successfully');
          console.log('New hash:', hash);
          
          // Verify the update
          db.get(
            'SELECT password FROM users WHERE email = ?',
            [adminEmail],
            (err, row) => {
              if (err) {
                console.error('Error fetching updated password:', err);
                process.exit(1);
              }
              
              console.log('Stored hash:', row.password);
              
              // Test the new password
              bcrypt.compare(newPassword, row.password, (err, result) => {
                if (err) {
                  console.error('Error comparing passwords:', err);
                  process.exit(1);
                }
                
                console.log('Password verification test:', result);
                process.exit(result ? 0 : 1);
              });
            }
          );
        }
      );
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
