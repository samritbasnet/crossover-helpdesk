// routes/auth.js - Authentication routes for MySQL database
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { runQuery, getQuery, getAllQuery } = require("../config/database");

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "558c0827173df93a270c9f55ed776d6a";
const RESET_TOKEN_EXPIRY = '1h'; // 1 hour expiry for reset tokens

// Register endpoint - Only allows creating regular users
router.post("/register", async (req, res) => {
  console.log('=== REGISTRATION REQUEST START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { name, email, password, role = 'user' } = req.body;

    // Input validation
    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('Validation failed: Password too short');
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate role
    const validRoles = ['user', 'agent', 'admin'];
    if (!validRoles.includes(role)) {
      console.log('Validation failed: Invalid role');
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }

    // Check if user is trying to register as admin without proper permissions
    if (role === 'admin') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Admin registration denied: No auth header');
        return res.status(403).json({
          success: false,
          message: "Authentication required to create admin accounts"
        });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
        if (decoded.role !== 'admin') {
          console.log('Admin registration denied: Not an admin');
          return res.status(403).json({
            success: false,
            message: "Only administrators can create admin accounts"
          });
        }
      } catch (error) {
        console.log('Admin registration denied: Invalid token');
        return res.status(403).json({
          success: false,
          message: "Invalid or expired authentication token"
        });
      }
    }

    // Check if user already exists
    console.log('Checking if user exists...');
    let existingUser;
    try {
      existingUser = await getQuery(
        "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)",
        [email]
      );
      console.log('User exists check result:', existingUser ? 'User exists' : 'User does not exist');
    } catch (dbError) {
      console.error('Error checking existing user:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error while checking user existence',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(409).json({
        success: false,
        message: `An account with email "${existingUser.email}" already exists`,
      });
    }

    // Hash password
    console.log('Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return res.status(500).json({
        success: false,
        message: 'Error processing password',
      });
    }

    // Create user
    console.log('Creating user in database...');
    console.log('User data:', { name, email, role, hasPassword: !!hashedPassword });

    let result;
    try {
      result = await runQuery(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );

      console.log('User created successfully with ID:', result.id);
    } catch (dbError) {
      console.error('Database error during user creation:', {
        message: dbError.message,
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage
      });

      // Handle specific MySQL errors
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: 'Database not properly initialized. Please run database setup.',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }

      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Database schema error. Invalid column name.',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create user in database',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: result.id, email, role },
      process.env.JWT_SECRET || JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('Registration successful for user:', email);
    console.log('=== REGISTRATION REQUEST END ===');

    // Return token and user at the root level for the frontend
    const userResponse = {
      id: result.id,
      name,
      email,
      role,
    };

    // Return the response in the format expected by the frontend
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("Registration error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      errno: error.errno
    });

    const errorResponse = {
      success: false,
      message: "Internal server error during registration",
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = error.message;
      errorResponse.stack = error.stack;
    }

    console.log('=== REGISTRATION REQUEST END (ERROR) ===');
    res.status(500).json(errorResponse);
  }
});

// Login endpoint with secure authentication
router.post("/login", async (req, res) => {
  console.log('=== LOGIN REQUEST START ===');
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email (case-insensitive)
    console.log('Looking up user in database...');
    const user = await getQuery(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User role:', user.role);
      console.log('User ID:', user.id);
    }

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password comparison failed');
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('Login successful for:', email);
    console.log('=== LOGIN REQUEST END ===');

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
    console.error("Login error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...error
    });

    // More detailed error response in development
    const errorResponse = {
      success: false,
      message: "Internal server error",
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = error.message;
      errorResponse.stack = error.stack;
    }

    console.log('=== LOGIN REQUEST END (ERROR) ===');
    res.status(500).json(errorResponse);
  }
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);

    // Get user from database
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

// Request password reset
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const user = await getQuery("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      // Don't reveal if user doesn't exist for security
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRY }
    );

    // In a real app, send email with reset link
    console.log('Password reset token:', resetToken);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
    });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await runQuery("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      decoded.userId,
    ]);

    res.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
});

// Debug endpoint to check database status
router.get("/debug/database", async (req, res) => {
  try {
    // Check if users table exists
    const tables = await getAllQuery("SHOW TABLES LIKE 'users'");
    const tableExists = tables.length > 0;

    let schema = null;
    let userCount = 0;

    if (tableExists) {
      // Get table schema
      schema = await getAllQuery("DESCRIBE users");

      // Get user count
      const countResult = await getQuery("SELECT COUNT(*) as count FROM users");
      userCount = countResult.count;
    }

    res.json({
      success: true,
      database: {
        tableExists: tableExists,
        schema: schema,
        userCount: userCount,
        databaseType: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({
      success: false,
      message: "Error checking database status",
      error: error.message
    });
  }
});

// Test database connection endpoint
router.get("/debug/connection", async (req, res) => {
  try {
    const { testConnection } = require("../config/mysql-config");
    const isConnected = await testConnection();

    res.json({
      success: isConnected,
      message: isConnected ? "Database connection successful" : "Database connection failed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error testing database connection",
      error: error.message
    });
  }
});

module.exports = router;