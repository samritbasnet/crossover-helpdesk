📌 Crossover Helpdesk

A full-stack helpdesk system built with React (client) and Node.js/Express (server).

🚀 Features

Ticket creation, assignment, and tracking

User authentication (agents & customers)

REST API backend with Express

Modern frontend UI with React

Easy local development setup

🗂 Project Structure
crossover-helpdesk/
├── client/ # React frontend
├── server/ # Express backend
└── README.md

🔧 Installation & Setup

1. Clone the repo
   git clone git@github.com:samritbasnet/crossover-helpdesk.git
   cd crossover-helpdesk

2. Setup server
   cd server
   npm install
   npm run dev # or npm start

Server runs at http://localhost:5000

3. Setup client
   cd client
   npm install
   npm start

Client runs at http://localhost:3000

⚙️ Available Scripts
Server (inside /server)

npm run dev → start backend with hot reload (nodemon)

npm start → start backend in production mode

Client (inside /client)

npm start → start React app

npm run build → build for production

📄 Environment Variables

Create a .env file inside server/:

PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret

🛠 Tech Stack

Frontend: React, Axios, Bootstrap/Tailwind (your choice)

Backend: Node.js, Express, MongoDB

Auth: JWT-based authentication

📌 Future Improvements

Role-based access control (admin, agent, user)

Email notifications

Analytics dashboard
