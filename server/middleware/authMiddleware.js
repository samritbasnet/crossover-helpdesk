const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication Middleware - Checks if user is logged in
const authenticateToken = async (req, res, next) => {
  try {
    // Step 1: Get the token from the request header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extract "Bearer TOKEN"

    // Step 2: Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Step 3: Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Get user information from database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Step 5: Add user info to request (so other functions can use it)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Step 6: Allow the request to continue
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Role-based Middleware - Check if user is an agent
const requireAgent = (req, res, next) => {
  if (req.user.role !== "agent") {
    return res.status(403).json({
      success: false,
      message: "Agent access required",
    });
  }
  next();
};

// Role-based Middleware - Check if user is a regular user
const requireUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "User access required",
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAgent,
  requireUser,
};
