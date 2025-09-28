// routes/auth.js - Authentication routes
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDatabase } = require("../config/database");

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Helper function to run database queries
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    console.log("=== SIGNUP REQUEST START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { name, email, password, role = "user" } = req.body;

    // Validation
    console.log("Validating input fields...");
    if (!name || !email || !password) {
      console.log("Validation failed: missing required fields");
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    console.log("Input validation passed");

    // Validate role
    const validRoles = ["user", "agent", "admin"];
    if (role && !validRoles.includes(role)) {
      console.log(`Role validation failed: ${role} not in ${validRoles}`);
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    console.log(`Role validation passed: ${role}`);

    // Check if user already exists (case-insensitive)
    console.log("Checking if user already exists...");
    const existingUser = await getQuery(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    if (existingUser) {
      console.log(`User already exists: ${existingUser.email}`);
      return res.status(409).json({
        success: false,
        message: `An account with email "${existingUser.email}" already exists. Please use a different email address or try logging in instead.`,
      });
    }

    console.log("User doesn't exist, proceeding with registration");

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Create user
    console.log(`Creating user with role: ${role}`);
    const finalRole = role || "user";
    const result = await runQuery(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, finalRole]
    );
    console.log(`User created successfully with ID: ${result.id}`);

    // Generate JWT token
    console.log("Generating JWT token...");
    const token = jwt.sign(
      { userId: result.id, email, role: finalRole },
      process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a",
      { expiresIn: "24h" }
    );
    console.log("JWT token generated successfully");

    console.log("=== SIGNUP REQUEST SUCCESS ===");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: result.id,
        name,
        email,
        role: finalRole,
      },
    });
  } catch (error) {
    console.error("=== SIGNUP REQUEST FAILED ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body was:", JSON.stringify(req.body, null, 2));

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await getQuery(
      "SELECT id, name, email, password, role FROM users WHERE email = ?",
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a");

    // Get fresh user data
    const user = await getQuery(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
