// User management routes
const express = require("express");
const bcrypt = require("bcryptjs");
const { runQuery, getQuery, getAllQuery } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Update email notification preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email_notifications } = req.body;

    // Validate email notification preference
    const validPreferences = ["all", "important", "none"];
    if (!validPreferences.includes(email_notifications)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email notification preference. Must be one of: all, important, none",
      });
    }

    // Update user preferences
    await runQuery("UPDATE users SET email_notifications = ? WHERE id = ?", [
      email_notifications,
      userId,
    ]);

    // Get updated user info
    const user = await getQuery(
      "SELECT id, name, email, role, email_notifications FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Email preferences updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences. Please try again.",
    });
  }
});

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getQuery(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's ticket statistics
    const ticketStats = await getQuery(
      `
      SELECT
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
      FROM tickets
      WHERE user_id = ?
    `,
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        ticketStats: ticketStats || {
          total_tickets: 0,
          open_tickets: 0,
          in_progress_tickets: 0,
          resolved_tickets: 0,
          closed_tickets: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update current user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if email is already taken by another user
    const existingUser = await getQuery(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already taken",
      });
    }

    // Update user
    await runQuery(
      "UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, email, userId]
    );

    // Get updated user
    const updatedUser = await getQuery(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get current user with password
    const user = await getQuery("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await runQuery(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedNewPassword, userId]
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all users (admin only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { role, search, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
    `;

    let params = [];
    let conditions = [];

    // Add filters
    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }

    if (search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await getAllQuery(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM users";
    let countParams = [];

    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
      // Remove pagination params for count
      countParams = params.slice(0, -2);
    }

    const totalResult = await getQuery(countQuery, countParams);
    const total = totalResult.total;

    // Get ticket statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const ticketStats = await getQuery(
          `
          SELECT
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
          FROM tickets
          WHERE user_id = ?
        `,
          [user.id]
        );

        return {
          ...user,
          ticketStats: ticketStats || {
            total_tickets: 0,
            open_tickets: 0,
            in_progress_tickets: 0,
            resolved_tickets: 0,
            closed_tickets: 0,
          },
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get a single user by ID (admin only)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    // Users can view their own profile, admins can view any profile
    if (userRole !== "admin" && parseInt(targetUserId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await getQuery(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
      [targetUserId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's tickets
    const tickets = await getAllQuery(
      `
      SELECT id, title, status, priority, category, created_at, updated_at
      FROM tickets
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `,
      [targetUserId]
    );

    // Get user's ticket statistics
    const ticketStats = await getQuery(
      `
      SELECT
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
      FROM tickets
      WHERE user_id = ?
    `,
      [targetUserId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        recentTickets: tickets,
        ticketStats: ticketStats || {
          total_tickets: 0,
          open_tickets: 0,
          in_progress_tickets: 0,
          resolved_tickets: 0,
          closed_tickets: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user role (admin only)
router.put("/:id/role", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;
    const { role } = req.body;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Validate role
    const validRoles = ["user", "agent", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, agent, admin",
      });
    }

    // Prevent admin from changing their own role
    if (parseInt(targetUserId) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // Check if user exists
    const user = await getQuery("SELECT id, role FROM users WHERE id = ?", [
      targetUserId,
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update role
    await runQuery(
      "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [role, targetUserId]
    );

    // Get updated user
    const updatedUser = await getQuery(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
      [targetUserId]
    );

    res.json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete user (admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Prevent admin from deleting themselves
    if (parseInt(targetUserId) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Check if user exists
    const user = await getQuery("SELECT id FROM users WHERE id = ?", [
      targetUserId,
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has tickets
    const userTickets = await getQuery(
      "SELECT COUNT(*) as count FROM tickets WHERE user_id = ?",
      [targetUserId]
    );

    if (userTickets.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${userTickets.count} associated tickets. Please reassign or delete tickets first.`,
      });
    }

    // Delete user comments first
    await runQuery("DELETE FROM ticket_comments WHERE user_id = ?", [
      targetUserId,
    ]);

    // Delete user
    await runQuery("DELETE FROM users WHERE id = ?", [targetUserId]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get users for assignment dropdown (admin/agent only)
router.get("/list/agents", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    if (!["admin", "agent"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const agents = await getAllQuery(
      "SELECT id, name, email FROM users WHERE role IN ('admin', 'agent') ORDER BY name ASC"
    );

    res.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("Get agents error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
