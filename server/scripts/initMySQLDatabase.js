// scripts/initMySQLDatabase.js - MySQL database initialization script
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Database name
const DATABASE_NAME = process.env.DB_NAME || 'crossover_helpdesk';

const initializeDatabase = async () => {
  let connection;

  try {
    console.log('Connecting to MySQL server...');
    // First connect without specifying database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log(`Creating database '${DATABASE_NAME}' if it doesn't exist...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\``);
    console.log(`✓ Database '${DATABASE_NAME}' ready`);

    // Switch to the database
    await connection.execute(`USE \`${DATABASE_NAME}\``);
    console.log(`✓ Using database '${DATABASE_NAME}'`);

    // Drop existing tables (for clean setup)
    console.log('Dropping existing tables if they exist...');
    await connection.execute('DROP TABLE IF EXISTS tickets');
    await connection.execute('DROP TABLE IF EXISTS knowledge_base');
    await connection.execute('DROP TABLE IF EXISTS users');
    console.log('✓ Existing tables dropped');

    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE users (
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
    console.log('✓ Created users table');

    // Create tickets table
    console.log('Creating tickets table...');
    await connection.execute(`
      CREATE TABLE tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        user_id INT NOT NULL,
        assigned_to INT,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_user_id (user_id),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✓ Created tickets table');

    // Create knowledge_base table
    console.log('Creating knowledge_base table...');
    await connection.execute(`
      CREATE TABLE knowledge_base (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        keywords TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_category (category),
        INDEX idx_created_by (created_by),
        FULLTEXT idx_content_search (title, content, keywords)
      )
    `);
    console.log('✓ Created knowledge_base table');

    // Create default users
    console.log('Creating default users...');

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const [adminResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['System Administrator', 'admin@helpdesk.com', adminPassword, 'admin']
    );
    console.log('✓ Created admin user (ID:', adminResult.insertId, ')');

    // Agent users
    const agent1Password = await bcrypt.hash('agent123', 12);
    const [agent1Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['John Smith', 'agent@helpdesk.com', agent1Password, 'agent']
    );
    console.log('✓ Created agent user (ID:', agent1Result.insertId, ')');

    const agent2Password = await bcrypt.hash('agent456', 12);
    const [agent2Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Sarah Johnson', 'sarah@helpdesk.com', agent2Password, 'agent']
    );
    console.log('✓ Created second agent user (ID:', agent2Result.insertId, ')');

    // Regular users
    const user1Password = await bcrypt.hash('user123', 12);
    const [user1Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Test User', 'user@helpdesk.com', user1Password, 'user']
    );
    console.log('✓ Created test user (ID:', user1Result.insertId, ')');

    const user2Password = await bcrypt.hash('demo123', 12);
    const [user2Result] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Demo User', 'demo@helpdesk.com', user2Password, 'user']
    );
    console.log('✓ Created demo user (ID:', user2Result.insertId, ')');

    // Create sample tickets
    console.log('Creating sample tickets...');

    const sampleTickets = [
      {
        title: 'Cannot access my account',
        description: 'I am unable to log into my account. Getting "invalid credentials" error even with the correct password. This started happening after the system maintenance yesterday.',
        status: 'open',
        priority: 'high',
        user_id: user1Result.insertId
      },
      {
        title: 'Email notifications not working',
        description: 'I am not receiving email notifications for ticket updates. Please check my notification settings.',
        status: 'in_progress',
        priority: 'medium',
        user_id: user2Result.insertId,
        assigned_to: agent1Result.insertId
      },
      {
        title: 'Slow system performance',
        description: 'The helpdesk system has been very slow today. Pages are taking 10-15 seconds to load.',
        status: 'resolved',
        priority: 'low',
        user_id: user1Result.insertId,
        assigned_to: agent2Result.insertId,
        resolution_notes: 'Performance issue was resolved by optimizing database queries.',
        resolved_at: new Date()
      },
      {
        title: 'Feature request: Dark mode',
        description: 'Could you please add a dark mode option to the helpdesk interface? It would be easier on the eyes during long work sessions.',
        status: 'open',
        priority: 'low',
        user_id: user2Result.insertId
      }
    ];

    for (const ticket of sampleTickets) {
      await connection.execute(`
        INSERT INTO tickets (title, description, status, priority, user_id, assigned_to, resolution_notes, resolved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ticket.title,
        ticket.description,
        ticket.status,
        ticket.priority,
        ticket.user_id,
        ticket.assigned_to || null,
        ticket.resolution_notes || null,
        ticket.resolved_at || null
      ]);
    }
    console.log('✓ Created', sampleTickets.length, 'sample tickets');

    // Create sample knowledge base articles
    console.log('Creating sample knowledge base articles...');

    const kbArticles = [
      {
        title: 'How to Reset Your Password',
        content: `To reset your password:

1. Go to the login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for a reset link
5. Click the link and enter your new password
6. Your password has been reset!

If you don't receive the email within 5 minutes, check your spam folder.`,
        category: 'Account Management',
        keywords: 'password reset, login, forgot password, account access',
        created_by: adminResult.insertId
      },
      {
        title: 'How to Create a Support Ticket',
        content: `Creating a support ticket is easy:

1. Log into your account
2. Click "Create New Ticket"
3. Fill in the title and description
4. Select the appropriate priority level
5. Click "Submit"

Your ticket will be assigned to an available agent and you'll receive email notifications about updates.`,
        category: 'Getting Started',
        keywords: 'create ticket, new ticket, support request, help',
        created_by: agent1Result.insertId
      },
      {
        title: 'Understanding Ticket Priority Levels',
        content: `We use four priority levels for tickets:

**Urgent**: System is down or completely unusable
**High**: Major functionality is broken
**Medium**: Minor issues that don't prevent work
**Low**: Feature requests, cosmetic issues

Please select the appropriate priority to help us address your issue quickly.`,
        category: 'Support Process',
        keywords: 'priority, urgent, high, medium, low, ticket classification',
        created_by: agent2Result.insertId
      }
    ];

    for (const article of kbArticles) {
      await connection.execute(`
        INSERT INTO knowledge_base (title, content, category, keywords, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [article.title, article.content, article.category, article.keywords, article.created_by]);
    }
    console.log('✓ Created', kbArticles.length, 'knowledge base articles');

    console.log('\n🎉 MySQL database initialization completed successfully!');
    console.log(`📊 Database: ${DATABASE_NAME}`);
    console.log('🏠 Host:', process.env.DB_HOST || 'localhost');
    console.log('\n👤 Default login credentials:');
    console.log('   Admin: admin@helpdesk.com / admin123');
    console.log('   Agent: agent@helpdesk.com / agent123');
    console.log('   Agent: sarah@helpdesk.com / agent456');
    console.log('   User:  user@helpdesk.com / user123');
    console.log('   User:  demo@helpdesk.com / demo123');
    console.log('\n📝 Sample data created:');
    console.log('   - 5 users (1 admin, 2 agents, 2 regular users)');
    console.log('   - 4 sample tickets');
    console.log('   - 3 knowledge base articles');

  } catch (error) {
    console.error('❌ Error initializing MySQL database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
    process.exit(0);
  }
};

initializeDatabase();