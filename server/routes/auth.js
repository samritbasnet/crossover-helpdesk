// routes/auth.js - Authentication routes
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDatabase } = require("../config/database");

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a";

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
// Register endpoint - Only allows creating regular users
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = "user"; // Force role to be 'user' for all registrations

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Only allow user role for registration
    if (req.body.role && req.body.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create accounts with this role"
      });
    }

    // Check if user already exists
    const existingUser = await getQuery(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `An account with email "${existingUser.email}" already exists`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await runQuery(
      "INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, true)",
      [name, email, hashedPassword, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email, role },
      process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: result.id,
        name,
        email,
        role,
        email_verified: true
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Login endpoint with secure admin authentication
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email (case-insensitive)
    const user = await getQuery(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // For admin accounts, require additional security
    if (user.role === 'admin') {
      // Check for admin-specific environment variables or additional security measures
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword && password !== adminPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials",
        });
      }
    }
    
    // Check password for all users
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
