// config/database.js - Simple database setup
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "helpdesk.db");
let db = null;

// Initialize database connection
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Database connection failed:", err.message);
        reject(err);
      } else {
        console.log("✅ Database connected successfully");
        createTables()
          .then(() => {
            console.log("✅ Database tables ready");
            resolve(db);
          })
          .catch(reject);
      }
    });
  });
};

// Create all database tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    // Users table with all necessary fields
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'agent', 'admin')),
        email_notifications TEXT DEFAULT 'all' CHECK(email_notifications IN ('all', 'important', 'none')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tickets table
    const ticketsTable = `
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in-progress', 'resolved', 'closed')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        category TEXT DEFAULT 'general',
        user_id INTEGER NOT NULL,
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (assigned_to) REFERENCES users (id)
      )
    `;

    // Comments table
    const commentsTable = `
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    // Knowledge base table
    const knowledgeTable = `
      CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT DEFAULT '',
        category TEXT DEFAULT 'general',
        helpful_count INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;

    // Create tables in sequence
    db.serialize(() => {
      db.run(usersTable, handleError("users table"));
      db.run(ticketsTable, handleError("tickets table"));
      db.run(commentsTable, handleError("comments table"));
      db.run(knowledgeTable, (err) => {
        if (err) {
          console.error("❌ Error creating knowledge table:", err.message);
          reject(err);
        } else {
          console.log("✅ Knowledge table created/verified");
          resolve();
        }
      });
    });
  });
};

// Simple error handler for table creation
const handleError = (tableName) => (err) => {
  if (err) {
    console.error(`❌ Error creating ${tableName}:`, err.message);
  } else {
    console.log(`✅ ${tableName} created/verified`);
  }
};

// Get database instance
const getDatabase = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve) => {
    if (db) {
      db.close(() => {
        console.log("✅ Database connection closed");
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
