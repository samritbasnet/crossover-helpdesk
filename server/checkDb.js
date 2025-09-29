const { initializeDatabase, getDatabase } = require('./config/database');

// Initialize the database first
initializeDatabase().then(() => {
  const db = getDatabase();
  console.log('Database initialized. Checking schema...');

// Check if users table exists and show its structure
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='users';",
  (err, row) => {
    if (err) {
      console.error('Error checking users table:', err);
      process.exit(1);
    }
    
    if (!row) {
      console.error('Error: users table does not exist');
      process.exit(1);
    }
    
    console.log('✅ Users table exists');
    
    // Show table structure
    db.all("PRAGMA table_info(users);", (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err);
        process.exit(1);
      }
      
      console.log('\nUsers table structure:');
      console.table(columns);
      
      // Try to insert a test user
      const testEmail = `test-${Date.now()}@example.com`;
      db.run(
        'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
        ['Test User', testEmail, 'hashed_password', 'user', 1],
        function(err) {
          if (err) {
            console.error('Full error object:', JSON.stringify(err, null, 2));
          } else {
            console.log(`✅ Successfully inserted test user with ID: ${this.lastID}`);
            
            // Clean up
    db.run('DELETE FROM users WHERE email = ?', [testEmail], (err) => {
      if (err) console.error('Error cleaning up test user:', err);
      process.exit(0);
    });
          }
        }
      );
    }
  });
});
// Handle any uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
