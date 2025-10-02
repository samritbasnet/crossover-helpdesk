# 🎫 Crossover Helpdesk System

A modern, full-stack helpdesk system built with **React.js** and **Node.js** featuring role-based access control, email notifications, and a clean, intuitive interface.

## ✨ Features

### 🔐 **Role-Based Access Control**

- **Admin**: Full system management, ticket assignment, user/agent management
- **Agent**: Ticket resolution, assignment management, customer support
- **User**: Ticket creation, status tracking, knowledge base access

### 🎯 **Core Functionality**

- **Ticket Management**: Create, assign, resolve, and track support tickets
- **Email Notifications**: Automated emails for ticket creation, assignment, and resolution
- **Knowledge Base**: Searchable articles and documentation
- **Dashboard Analytics**: Role-specific statistics and insights
- **Real-time Updates**: Live status updates and notifications

### 🛡️ **Security & Validation**

- JWT-based authentication
- Input validation and sanitization
- Role-based route protection
- Secure password hashing with bcrypt

## 🏗️ **Architecture**

```
crossover-helpdesk/
├── client/                 # React.js Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API communication
│   │   ├── context/       # State management
│   │   └── utils/         # Helper functions
│   └── package.json
├── server/                 # Node.js Backend
│   ├── controllers/       # Business logic
│   ├── routes/           # API endpoints
│   ├── middleware/       # Authentication & validation
│   ├── services/         # Email service
│   ├── config/          # Database configuration
│   └── utils/           # Database initialization
└── README.md
```

## 🚀 **Quick Start**

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd crossover-helpdesk
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd ../client
   npm install
   ```

4. **Start the server**

   ```bash
   cd ../server
   npm start
   # Server will run on http://localhost:3000
   ```

5. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm start
   # Client will run on http://localhost:3001
   ```

## 🔑 **Default Credentials**

The system comes with pre-configured test accounts:

| Role      | Email                | Password   | Description        |
| --------- | -------------------- | ---------- | ------------------ |
| **Admin** | `admin@helpdesk.com` | `admin123` | Full system access |
| **Agent** | `agent@helpdesk.com` | `agent123` | Ticket resolution  |
| **User**  | `user@helpdesk.com`  | `user123`  | Basic user access  |

## 📱 **User Interface**

### **Admin Dashboard**

- 📊 System statistics and analytics
- 🎫 All tickets overview with assignment controls
- 👥 User and agent management
- 📧 Email notification management

### **Agent Dashboard**

- 🎯 Assigned tickets and resolution tools
- 📈 Personal performance metrics
- 🏆 Ticket history and achievements
- ⚡ Quick actions for common tasks

### **User Dashboard**

- 📝 Create and manage personal tickets
- 📊 Track ticket status and progress
- 🔍 Access knowledge base
- 📧 Email preference settings

## 🔧 **API Endpoints**

### **Authentication**

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### **Tickets**

- `GET /api/tickets` - Get tickets (role-filtered)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `PUT /api/tickets/:id/assign` - Assign ticket (admin only)
- `PUT /api/tickets/:id/take` - Take ticket (agent only)
- `DELETE /api/tickets/:id` - Delete ticket

### **Dashboard**

- `GET /api/tickets/stats` - Get role-specific statistics
- `GET /api/tickets/agents` - Get available agents (admin only)

### **Knowledge Base**

- `GET /api/knowledge` - Get all articles
- `GET /api/knowledge/:id` - Get article details

## 🗄️ **Database Schema**

### **Users Table**

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'agent', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Tickets Table**

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  user_id INTEGER NOT NULL,
  assigned_to INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

### **Knowledge Base Table**

```sql
CREATE TABLE knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📧 **Email Notifications**

The system uses **Ethereal Email** for development testing:

- 📬 Ticket creation notifications
- 🎯 Assignment notifications to agents
- ✅ Resolution notifications to users
- 📧 All emails are sent to test accounts for development

## 🛠️ **Development**

### **Code Structure**

- **Clean Architecture**: Separation of concerns between UI, business logic, and data
- **Modular Components**: Reusable React components with clear props
- **Consistent Styling**: Material-UI for consistent design system
- **Error Handling**: Comprehensive error handling and user feedback
- **Type Safety**: PropTypes and input validation throughout

### **Key Technologies**

- **Frontend**: React.js, Material-UI, Axios, React Router
- **Backend**: Node.js, Express.js, SQLite3, JWT, bcrypt
- **Email**: Nodemailer with Ethereal Email
- **Development**: Hot reloading, ESLint, development tools

### **Environment Variables**

Create a `.env` file in the server directory:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

## 🧪 **Testing**

### **Manual Testing**

1. **Login Flow**: Test with all three user roles
2. **Ticket Creation**: Create tickets as a user
3. **Assignment**: Assign tickets as an admin
4. **Resolution**: Resolve tickets as an agent
5. **Notifications**: Check email notifications in Ethereal

### **API Testing with cURL**

```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@helpdesk.com", "password": "admin123"}'

# Get dashboard stats
curl -X GET http://localhost:3000/api/tickets/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 **Production Deployment**

### **Server Deployment**

1. Set production environment variables
2. Configure real SMTP email service
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up process manager (PM2)

### **Client Deployment**

1. Build production bundle: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Configure environment variables
4. Set up CDN for assets

## 📝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:

- 📧 Email: support@helpdesk.com
- 📖 Documentation: [Wiki](wiki-url)
- 🐛 Issues: [GitHub Issues](issues-url)

---

**Built with ❤️ for modern helpdesk management**
