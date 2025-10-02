// index.js - Complete server setup with MySQL
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  initializeDatabase,
  closeDatabase,
  getConnection,
} = require("./config/database");
const { initDatabase } = require("./utils/dbInit");
const { initEmailService } = require("./services/emailService");

// Import routes
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const userRoutes = require("./routes/users");

const PORT = process.env.PORT || 3000;
const app = express();

// CORS configuration
const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // Cache preflight request for 10 minutes
  optionsSuccessStatus: 204,
};

// Log CORS configuration for debugging
console.log(
  "CORS Configuration:",
  JSON.stringify(
    {
      ...corsOptions,
      origin: "dynamic based on whitelist",
      whitelist,
    },
    null,
    2
  )
);

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Logging middleware for development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} from ${
        req.headers.origin || "unknown origin"
      }`
    );
    console.log("Headers:", req.headers);
    next();
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", database: "SQLite" });
});

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

// Knowledge base routes
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
  let server;

  try {
    // Initialize database connection and schema
    console.log("🔄 Initializing database...");
    await initializeDatabase();

    // In production, ensure database schema is initialized
    if (process.env.NODE_ENV === "production") {
      console.log(
        "Running in production mode - initializing database schema..."
      );
      const dbInitialized = await initDatabase();
      if (!dbInitialized) {
        throw new Error("Failed to initialize database schema");
      }
    }

    console.log("✅ Database initialized successfully");

    // Initialize email service
    console.log("🔄 Initializing email service...");
    await initEmailService();
    console.log("✅ Email service initialized");

    // Start the server
    server = app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
      if (process.env.CORS_ORIGINS) {
        console.log(`✅ CORS enabled for: ${process.env.CORS_ORIGINS}`);
      } else {
        console.log(
          "⚠️  CORS is enabled for all origins (not recommended for production)"
        );
      }
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("\n🔄 Shutting down server gracefully...");

  try {
    // Close database connections
    console.log("🔒 Closing database connections...");
    await closeDatabase();
    console.log("✅ Database connections closed");

    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle various termination signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown().then(() => process.exit(1));
});

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
