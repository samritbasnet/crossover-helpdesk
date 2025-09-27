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

1) Server

```
cd server
npm install
cp .env.example .env  # if present (or create .env as below)
npm run dev            # starts at http://localhost:3000
```

2) Client

```
cd client
npm install
# optional: create .env and set REACT_APP_API_BASE=http://localhost:3000/api
npm start             # opens http://localhost:3000 for CRA, or 5173 for Vite
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

✅ Notes

- The backend uses a single lightweight database (SQLite) and simple helpers (`runQuery/getQuery/getAllQuery`) for clarity.
- Set `REACT_APP_API_BASE` in `client/.env` to point the client to the server.
