📌 Crossover Helpdesk

A simple full‑stack helpdesk built with React (client) and Node.js/Express + SQLite (server).

🚀 Features

- Ticket creation and management
- JWT authentication (user, agent, admin)
- Knowledge Base (SQLite, simple CRUD)
- Clean, junior‑friendly code structure

🗂 Project Structure

```
crossover-helpdesk/
├── client/        # React frontend
└── server/        # Express backend (sqlite3)
```

🔧 Quick Start

1) **Server Setup**

```bash
cd server
npm install
cp .env.example .env  # Copy environment template
# Edit .env file with your settings
npm run dev           # starts at http://localhost:3000
```

2) **Client Setup**

```bash
cd client
npm install
cp .env.example .env  # Copy environment template
# Edit .env file with your API URL
npm start             # opens http://localhost:3001 (CRA default)
```

3) **First Time Setup**

```bash
# The database will be created automatically
# Default admin user will be created on first run
# Or create a user via the signup page
```

📄 Environment Variables

Server (`server/.env`):

```
PORT=3000
JWT_SECRET=change-me
```

Client (`client/.env`):

```
REACT_APP_API_BASE=http://localhost:3000/api
```

🛣 API Endpoints (short list)

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/verify`
- Tickets: `GET/POST /api/tickets`, `GET/PUT/DELETE /api/tickets/:id` (requires Bearer token)
- Knowledge: `GET /api/knowledge`, `GET /api/knowledge/:id`, `POST /api/knowledge/:id/helpful`, `POST/PUT/DELETE /api/knowledge` (protected)

⚙️ Scripts

Server (inside `server/`):

- `npm run dev` → start backend (nodemon)
- `npm start` → start backend

Client (inside `client/`):

- `npm start` → start React dev server
- `npm run build` → production build

🛠 Tech Stack

- Frontend: React, Axios, MUI
- Backend: Node.js, Express, sqlite3
- Auth: JWT

📚 Documentation

- **API Documentation**: See [API.md](./API.md) for complete endpoint documentation
- **Environment Setup**: Use `.env.example` files as templates
- **Database**: SQLite database created automatically on first run

🚀 Deployment

**Production Deployment:**

1) **Server (Node.js hosting)**
```bash
cd server
npm install --production
cp .env.example .env
# Set production environment variables
npm start
```

2) **Client (Static hosting)**
```bash
cd client
cp .env.example .env
# Set REACT_APP_API_BASE to your production API URL
npm run build
# Deploy the 'build' folder to your static host
```

**Docker Deployment:**
```bash
# Build and run with Docker Compose (if docker-compose.yml exists)
docker-compose up --build
```

🔧 Development

**Available Scripts:**
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

**Code Quality:**
- ESLint configured for consistent code style
- Prettier for code formatting
- Zero warnings/errors in production build

✅ Features

- **Authentication**: JWT-based with role management (user/agent/admin)
- **Ticket Management**: Full CRUD with status tracking and assignment
- **Knowledge Base**: Self-service articles with search and voting
- **User Management**: Profile management and role-based permissions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Handling**: Comprehensive error states and network error recovery
- **Professional UI**: Material-UI components with consistent theming

🛡️ Security

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Role-based access control
- SQL injection prevention with parameterized queries

📊 Performance

- Lightweight SQLite database
- Efficient pagination for large datasets
- Optimized React components with proper state management
- Lazy loading and code splitting ready
- Production-optimized builds
