// config/database.js - Simple database setup
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "helpdesk.db");
let db = null;

// Helper function to run database queries
const runQuery = (query, params = []) => {
  console.log("Executing runQuery:", query, "with params:", params);
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(query, params, function (err) {
      if (err) {
        console.error("Database runQuery error:", err.message);
        console.error("Query:", query);
        console.error("Params:", params);
        reject(err);
      } else {
        console.log("runQuery success, lastID:", this.lastID, "changes:", this.changes);
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(query, params, (err, row) => {
      if (err) {
        console.error("Database getQuery error:", err.message);
        console.error("Query:", query);
        console.error("Params:", params);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const getAllQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Database getAllQuery error:", err.message);
        console.error("Query:", query);
        console.error("Params:", params);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

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
const createTables = async () => {
  return new Promise((resolve, reject) => {
    // In development, drop tables if they exist
    const dropTables = `
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS tickets;
      DROP TABLE IF EXISTS knowledge_base;
    `;
    // Execute drop tables in development
    if (process.env.NODE_ENV !== 'production') {
      db.serialize(() => {
        db.exec(dropTables, (err) => {
          if (err) {
            console.warn('Warning: Could not drop tables:', err.message);
          } else {
            console.log('Dropped existing tables for fresh start');
          }
        });
      });
    }

    // Users table with all necessary fields
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'agent', 'admin')),
        email_verified BOOLEAN DEFAULT 0,
        email_notifications TEXT DEFAULT 'all',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    // Error handler for database operations
    const handleError = (tableName) => (err) => {
      if (err) {
        console.error(`❌ Error creating ${tableName}:`, err.message);
        throw err;
      }
    };

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
          // Create default admin user
          createDefaultAdmin().then(() => {
            resolve();
          }).catch(reject);
        }
      });
    });
  });
};

// Create default admin user
const createDefaultAdmin = () => {
  return new Promise((resolve, reject) => {
    // Check if admin already exists
    db.get("SELECT id FROM users WHERE email = ?", ["admin@helpdesk.com"], (err, row) => {
      if (err) {
        console.error("Error checking for existing admin:", err.message);
        reject(err);
        return;
      }

      if (row) {
        console.log("✅ Default admin user already exists");
        resolve();
        return;
      }

      // Create default admin user
      const bcrypt = require("bcrypt");
      bcrypt.hash("admin", 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing admin password:", err.message);
          reject(err);
          return;
        }

        db.run(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["System Admin", "admin@helpdesk.com", hashedPassword, "admin"],
          function(err) {
            if (err) {
              console.error("Error creating default admin:", err.message);
              reject(err);
            } else {
              console.log("✅ Default admin user created with ID:", this.lastID);
              resolve();
            }
          }
        );
      });
    });
  });
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
  runQuery,
  getQuery,
  getAllQuery,
};
