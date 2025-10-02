# Crossover Helpdesk System

A full-stack helpdesk application built with React.js, Node.js, Express.js, and SQLite. This system provides a complete ticketing solution with user management, knowledge base, and role-based access control.

## 🚀 Features

### ✅ User Management

- JWT authentication (login/signup)
- Role-based access control (User, Agent, Admin)
- Password hashing with bcrypt
- Session management

### ✅ Ticket System

- Create tickets with title, description, priority
- View tickets with role-based filtering
- Update ticket status: Open → In Progress → Resolved
- Assign tickets to agents
- Add resolution notes
- Delete tickets (admin/owner only)

### ✅ Knowledge Base

- Browse articles by category
- Search articles by keywords
- Mark articles as helpful
- Create/edit articles (admin/creator only)

### ✅ Dashboard

- User dashboard: View submitted tickets
- Agent dashboard: Manage all tickets with filters
- Statistics and ticket counts
- Status-based filtering

## 🛠️ Tech Stack

- **Frontend**: React.js, Material-UI, SCSS
- **Backend**: Node.js, Express.js, REST APIs, JWT
- **Database**: SQLite
- **Authentication**: JWT tokens
- **Styling**: Material-UI components

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Initialize Database

```bash
# From the root directory
node init-db.js
```

This will create:

- SQLite database with all required tables
- Test users (admin, agent, regular user)
- Sample knowledge base articles

### 3. Start the Application

**Terminal 1 - Start Backend Server:**

```bash
cd server
npm start
```

Server runs on: http://localhost:3001

**Terminal 2 - Start Frontend:**

```bash
cd client
npm start
```

Frontend runs on: http://localhost:3000

## 👥 Test Accounts

| Role  | Email              | Password | Access                  |
| ----- | ------------------ | -------- | ----------------------- |
| Admin | admin@helpdesk.com | admin123 | Full system access      |
| Agent | agent@helpdesk.com | agent123 | Ticket management       |
| User  | user@helpdesk.com  | user123  | Create/view own tickets |

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Tickets

- `GET /api/tickets` - List tickets (with filters)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Knowledge Base

- `GET /api/knowledge` - List articles (with search)
- `GET /api/knowledge/:id` - Get article details
- `POST /api/knowledge` - Create article (authenticated)
- `PUT /api/knowledge/:id` - Update article (authenticated)
- `DELETE /api/knowledge/:id` - Delete article (authenticated)
- `POST /api/knowledge/:id/helpful` - Mark as helpful

## 📊 Database Schema

### Users Table

- id, name, email, password, role, created_at, updated_at

### Tickets Table

- id, title, description, status, priority, category, user_id, assigned_to, resolution_notes, resolved_at, created_at, updated_at

### Knowledge Base Table

- id, title, content, category, keywords, helpful_count, created_by, created_at, updated_at

## 🎨 Frontend Features

### Material-UI Components

- Modern, responsive design
- Professional helpdesk interface
- Consistent styling throughout

### Navigation

- Role-based menu items
- Protected routes
- Automatic redirects based on user role

### Forms

- Ticket creation with validation
- User registration/login
- Knowledge base article creation

## 🐛 Troubleshooting

### Server won't start

- Check if port 3001 is available
- Ensure all dependencies are installed
- Check database file permissions

### Frontend won't connect

- Verify server is running on port 3001
- Check browser console for CORS errors
- Ensure proxy configuration is correct

### Database errors

- Delete `server/helpdesk.db` and run `node init-db.js` again
- Check file permissions on database file

## 📁 Project Structure

```
crossover-helpdesk/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── package.json
├── init-db.js           # Database initialization
├── SETUP_INSTRUCTIONS.md # Detailed setup guide
└── README.md            # This file
```

## 🚀 Deployment

The application is ready for deployment to platforms like:

- Heroku
- Netlify (frontend) + Railway (backend)
- AWS
- DigitalOcean

For production deployment, ensure to:

1. Set environment variables
2. Use a production database (PostgreSQL recommended)
3. Configure CORS for your domain
4. Set up proper JWT secrets

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support or questions, please open an issue in the repository.

---

**Your helpdesk application is now fully functional and ready for use! 🎉**
