// config/database.js - MySQL database setup
const mysql = require('mysql2/promise');
const { query, getOne, execute, testConnection, initializeDatabase } = require('./mysql-config');

// Export the MySQL helper functions
module.exports = {
  // Initialize the database connection and create tables if they don't exist
  async initializeDatabase() {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to MySQL database');
    }
    
    await initializeDatabase();
    return true;
  },
  
  // Get a database connection (for compatibility with existing code)
  getDatabase() {
    return {
      run: async (sql, params, callback) => {
        try {
          const result = await execute(sql, params);
          callback(null, { lastID: result.insertId, changes: result.affectedRows });
        } catch (error) {
          callback(error);
        }
      },
      
      get: async (sql, params, callback) => {
        try {
          const row = await getOne(sql, params);
          callback(null, row);
        } catch (error) {
          callback(error);
        }
      },
      
      all: async (sql, params, callback) => {
        try {
          const rows = await query(sql, params);
          callback(null, rows);
        } catch (error) {
          callback(error);
        }
      }
    };
  },
  
  // Helper functions for database operations
  runQuery: async (sql, params = []) => {
    try {
      const result = await execute(sql, params);
      return { id: result.insertId, changes: result.affectedRows };
    } catch (error) {
      console.error('Database runQuery error:', error);
      throw error;
    }
  },
  
  getQuery: async (sql, params = []) => {
    try {
      return await getOne(sql, params);
    } catch (error) {
      console.error('Database getQuery error:', error);
      throw error;
    }
  },
  
  getAllQuery: async (sql, params = []) => {
    try {
      return await query(sql, params);
    } catch (error) {
      console.error('Database getAllQuery error:', error);
      throw error;
    }
  },
  
  // Close the database connection pool
  async closeDatabase() {
    const { pool } = require('./mysql-config');
    await pool.end();
  }
};
