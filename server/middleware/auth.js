// middleware/auth.js - Simple authentication middleware
const jwt = require("jsonwebtoken");
const { getDatabase } = require("../config/database");

// Simple database query helper
const dbQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Main authentication middleware - checks JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    // No token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Verify JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
        error: jwtError.message
      });
    }

    // Check if user still exists in database
    let user;
    try {
      user = await dbQuery(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [decoded.userId]
      );
    } catch (dbError) {
      console.error('Database error during auth:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error verifying user account',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Continue to next middleware/route
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    // Handle different JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, continue
  } else {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }
};

// Check if user is admin or agent
const requireAgentOrAdmin = (req, res, next) => {
  if (req.user && ["admin", "agent"].includes(req.user.role)) {
    next(); // User has required role, continue
  } else {
    return res.status(403).json({
      success: false,
      message: "Agent or Admin access required.",
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAgentOrAdmin,
};
