// config/database.js - MySQL database setup
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'crossover_user',
  password: process.env.DB_PASSWORD || 'AppSecurePassword123!',
  database: process.env.DB_NAME || 'crossover_helpdesk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    return false;
  }
};

// Export the MySQL helper functions
module.exports = {
  // Initialize the database connection
  async initializeDatabase() {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to MySQL database');
    }
    return true;
  },
  
  // Get the database connection (for compatibility with existing code)
  getDatabase() {
    return pool;
  },
  
  // Helper functions for database operations
  async runQuery(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },
  
  async getQuery(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },
  
  async getAllQuery(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows || [];
  },
  
  // Close the database connection
  async closeDatabase() {
    await pool.end();
    return true;
  },
  
  // Alias for compatibility
  query: (sql, params) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return pool.execute(sql, params).then(([rows]) => rows);
    }
    return pool.execute(sql, params).then(([result]) => result);
  },
  
  getOne: (sql, params) => pool.execute(sql, params).then(([rows]) => rows[0] || null),
  
  execute: (sql, params) => pool.execute(sql, params).then(([result]) => result)
};
