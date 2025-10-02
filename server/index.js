// Server Setup - Simple and Clean
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { initializeDatabase, closeDatabase } = require("./config/database");
const { initDatabase } = require("./utils/dbInit");
const { initEmailService } = require("./services/emailService");

const PORT = process.env.PORT || 3000;
const app = express();

// Simple CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.get("/", (req, res) => {
  res.json({
    message: "Crossover Helpdesk API",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: "SQLite" });
});

// API endpoints
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/users", require("./routes/users"));
app.use("/api/knowledge", require("./routes/knowledge"));

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const startServer = async () => {
  try {
    console.log("Starting server...");

    // Initialize database
    await initializeDatabase();
    console.log("✅ Database connected");

    // Initialize email service
    await initEmailService();
    console.log("✅ Email service ready");

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await closeDatabase();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
startServer();
