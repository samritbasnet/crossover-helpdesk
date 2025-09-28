// index.js - Complete server setup
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Allow all origins for now
app.use((req, res, next) => {
  // Log incoming requests for debugging
  console.log(`Incoming ${req.method} request to ${req.path} from origin: ${req.headers.origin}`);
  
  // Allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
});

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
