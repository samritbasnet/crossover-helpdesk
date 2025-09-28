// index.js - Complete server setup
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', // React dev server default port
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:5173', // Vite default port
  'https://crossover-ticket.netlify.app', // Production frontend
  'https://crossover-helpdesk.onrender.com' // Production backend (if needed)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic health check route
app.get("/", (req, res) => {
  res.json({
    message: "Crossover Helpdesk Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Ticket routes
app.use("/api/tickets", require("./routes/tickets"));

// User routes
app.use("/api/users", require("./routes/users"));

// Knowledge routes (SQLite-based)
app.use("/api/knowledge", require("./routes/knowledge"));

// Test route to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Start server function
const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(
        `✅ CORS enabled for: http://localhost:3000, http://localhost:3001, http://localhost:5173`
      );
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("🔄 Shutting down server gracefully...");
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
