# MySQL Migration Guide

This guide will help you migrate from SQLite to MySQL for the Crossover Helpdesk application.

## Prerequisites

1. MySQL Server installed and running
2. Node.js (v18 or higher)
3. npm or yarn

## Setup Instructions

### 1. Install Dependencies

Make sure you have all the required dependencies installed:

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory if you haven't already:

```bash
cp .env.example .env
```

Update the `.env` file with your MySQL database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=crossover_helpdesk
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Other configurations remain the same...
```

### 3. Create Database and Run Migrations

Run the migration script to create the database and tables:

```bash
npm run migrate
```

This will:
1. Create the database if it doesn't exist
2. Create all necessary tables
3. Set up a default admin user (email: admin@example.com, password: admin123)

### 4. Start the Server

```bash
npm start
# or for development
npm run dev
```

### 5. Verify the Setup

Visit the health check endpoint to verify the database connection:

```
GET http://localhost:3000/health
```

## Troubleshooting

### Connection Issues

1. **MySQL Server Not Running**:
   - Make sure MySQL server is running
   - Check if you can connect using MySQL client with the same credentials

2. **Access Denied**:
   - Verify the MySQL user has proper permissions
   - Try creating the database manually first:
     ```sql
     CREATE DATABASE crossover_helpdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     GRANT ALL PRIVILEGES ON crossover_helpdesk.* TO 'your_mysql_username'@'localhost';
     FLUSH PRIVILEGES;
     ```

3. **Port Already in Use**:
   - Make sure no other process is using port 3000 or your configured port
   - Change the `PORT` in `.env` if needed

### Data Migration

If you need to migrate existing data from SQLite to MySQL, you'll need to:

1. Export data from SQLite to CSV/JSON
2. Transform the data to match MySQL schema
3. Import into MySQL

## Reverting to SQLite

If you need to switch back to SQLite:

1. Change the database configuration back to SQLite in `config/database.js`
2. Remove MySQL configuration from `.env`
3. The application will automatically use SQLite if no MySQL configuration is provided

## Production Deployment

For production, make sure to:

1. Set proper database credentials
2. Enable SSL for MySQL connections if needed
3. Set up proper backups
4. Configure proper user permissions
5. Set `NODE_ENV=production` in your environment variables
