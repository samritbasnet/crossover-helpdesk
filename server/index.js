const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Middleware - These run on every request
app.use(cors()); // Allow frontend to connect from different ports
app.use(bodyParser.json()); // Parse JSON data from requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse form data

// Health check endpoint - Test if server is running
app.get("/", (req, res) => {
  res.json({
    message: "HelpDesk API Server is running!",
    version: "1.0.0",
    status: "active",
  });
});

// Database setup
const { testConnection, syncDatabase } = require("./config/database");
require("./models"); // Load all database models

// API Routes - Connect URLs to controller functions
app.use("/api/auth", require("./routes/auth")); // Authentication endpoints
app.use("/api/knowledge", require("./routes/knowledge")); // Knowledge base endpoints
app.use("/api/tickets", require("./routes/tickets")); // Ticket management endpoints

// Error handling middleware - Catches any errors in the application
app.use((err, req, res, next) => {
  console.log("Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler - When someone tries to access a route that doesn't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    // Step 1: Test database connection
    await testConnection();

    // Step 2: Create/update database tables
    await syncDatabase();

    // Step 3: Start listening for requests
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🎫 Ticket endpoints: http://localhost:${PORT}/api/tickets`);
      console.log(
        `📚 Knowledge endpoints: http://localhost:${PORT}/api/knowledge`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

// Start the server
startServer();
