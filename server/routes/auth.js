const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public routes (no authentication required)
router.post("/signup", signup);
router.post("/login", login);

// Protected route to get current user info
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
