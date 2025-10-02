// config/database.js - SQLite database setup
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

// Database file path
const dbPath = path.join(__dirname, "..", "helpdesk.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Test the database connection
const testConnection = async () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT 1 as test", (err, row) => {
      if (err) {
        console.error("Error testing database connection:", err);
        reject(err);
      } else {
        console.log("Successfully connected to SQLite database");
        resolve(true);
      }
    });
  });
};

// Export the SQLite helper functions
module.exports = {
  // Initialize the database connection
  async initializeDatabase() {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to SQLite database");
    }
    return true;
  },

  // Get the database connection
  getDatabase() {
    return db;
  },

  // Helper functions for database operations
  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ insertId: this.lastID, affectedRows: this.changes });
        }
      });
    });
  },

  async getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },

  async getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  // Close the database connection
  async closeDatabase() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Database connection closed");
          resolve(true);
        }
      });
    });
  },

  // Alias for compatibility
  query: (sql, params) => {
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    });
  },

  getOne: (sql, params) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    }),

  execute: (sql, params) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    }),
};
