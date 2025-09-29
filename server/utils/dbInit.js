const { getConnection } = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  let connection;
  try {
    console.log('Initializing database...');
    connection = await getConnection();
    
    // Check if users table exists
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME || 'crossover_helpdesk']
    );

    if (tables.length === 0) {
      console.log('Database not initialized. Running setup...');
      await runSetup(connection);
    } else {
      console.log('Database already initialized');
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  } finally {
    if (connection) await connection.release();
  }
};

const runSetup = async (connection) => {
  try {
    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'agent', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )
    `);

    // Create other tables...

    // Create default admin user if not exists
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@helpdesk.com']);
    
    if (users.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      await connection.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['System Administrator', 'admin@helpdesk.com', adminPassword, 'admin']
      );
      console.log('✓ Created admin user');
    }

    // Add more default data as needed...
    
  } catch (error) {
    console.error('Error during database setup:', error);
    throw error;
  }
};

module.exports = { initDatabase };
