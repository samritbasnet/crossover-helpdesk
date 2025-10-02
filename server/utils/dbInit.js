const { getDatabase } = require("../config/database");
const bcrypt = require("bcryptjs");

const initDatabase = async () => {
  const db = getDatabase();

  try {
    console.log("Initializing SQLite database...");

    // Create users table
    await new Promise((resolve, reject) => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create tickets table
    await new Promise((resolve, reject) => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          category TEXT DEFAULT 'general',
          user_id INTEGER NOT NULL,
          assigned_to INTEGER,
          resolution_notes TEXT,
          resolved_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create knowledge_base table
    await new Promise((resolve, reject) => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS knowledge_base (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT,
          keywords TEXT,
          helpful_count INTEGER DEFAULT 0,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Create indexes
    await new Promise((resolve, reject) => {
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id)",
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)",
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Check if admin user exists
    const adminUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        ["admin@helpdesk.com"],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!adminUser) {
      const adminPassword = await bcrypt.hash("admin123", 12);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          [
            "System Administrator",
            "admin@helpdesk.com",
            adminPassword,
            "admin",
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("✓ Created admin user (admin@helpdesk.com / admin123)");
    }

    // Create test agent
    const agentUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        ["agent@helpdesk.com"],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!agentUser) {
      const agentPassword = await bcrypt.hash("agent123", 12);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["Support Agent", "agent@helpdesk.com", agentPassword, "agent"],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("✓ Created agent user (agent@helpdesk.com / agent123)");
    }

    // Create test user
    const testUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE email = ?",
        ["user@helpdesk.com"],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!testUser) {
      const userPassword = await bcrypt.hash("user123", 12);
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["Test User", "user@helpdesk.com", userPassword, "user"],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log("✓ Created test user (user@helpdesk.com / user123)");
    }

    // Add some sample knowledge base articles
    const articleCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM knowledge_base", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (articleCount === 0) {
      const sampleArticles = [
        {
          title: "How to Reset Your Password",
          content:
            'To reset your password, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.',
          category: "Account Management",
          keywords: "password, reset, login, account",
        },
        {
          title: "Creating a Support Ticket",
          content:
            'To create a support ticket, log in to your account and click on "Create Ticket". Fill in the required information including title, description, and priority level.',
          category: "Getting Started",
          keywords: "ticket, create, support, help",
        },
        {
          title: "Understanding Ticket Priorities",
          content:
            "Tickets have three priority levels: Low (non-urgent issues), Medium (standard issues), and High (urgent issues requiring immediate attention).",
          category: "Ticket Management",
          keywords: "priority, urgent, ticket, levels",
        },
      ];

      for (const article of sampleArticles) {
        await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO knowledge_base (title, content, category, keywords, created_by) VALUES (?, ?, ?, ?, ?)",
            [
              article.title,
              article.content,
              article.category,
              article.keywords,
              1,
            ], // created by admin
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      console.log("✓ Created sample knowledge base articles");
    }

    console.log("✅ Database initialization completed successfully!");
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    return false;
  }
};

module.exports = { initDatabase };
