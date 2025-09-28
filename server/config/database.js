// config/database.js - Database configuration and initialization
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "helpdesk.db");
let db = null;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
        reject(err);
      } else {
        console.log("✅ Connected to SQLite database");
        createTables()
          .then(() => resolve(db))
          .catch(reject);
      }
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        email_notifications TEXT DEFAULT 'all' CHECK(email_notifications IN ('all', 'important', 'none')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTicketsTable = `
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

    const createTicketCommentsTable = `
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

    // Knowledge base articles
    const createKnowledgeTable = `
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

    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error("Error creating users table:", err.message);
          reject(err);
        } else {
          console.log("✅ Users table created/verified");
        }
      });

      db.run(createTicketsTable, (err) => {
        if (err) {
          console.error("Error creating tickets table:", err.message);
          reject(err);
        } else {
          console.log("✅ Tickets table created/verified");
        }
      });

      db.run(createTicketCommentsTable, (err) => {
        if (err) {
          console.error("Error creating ticket_comments table:", err.message);
          reject(err);
        } else {
          console.log("✅ Ticket comments table created/verified");
          // Create knowledge table last
          db.run(createKnowledgeTable, (err) => {
            if (err) {
              console.error("Error creating knowledge table:", err.message);
              reject(err);
            } else {
              console.log("✅ Knowledge table created/verified");
              resolve();
            }
          });
        }
      });
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
};

const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error("Error closing database:", err.message);
          reject(err);
        } else {
          console.log("✅ Database connection closed");
          resolve();
        }
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
