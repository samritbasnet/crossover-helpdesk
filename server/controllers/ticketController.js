// controllers/ticketController.js - Ticket business logic
const { getDatabase } = require("../config/database");

// Helper functions for database operations
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

const getAllQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = "medium",
      category = "general",
    } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters long",
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters long",
      });
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority. Must be one of: low, medium, high, urgent",
      });
    }

    // Create ticket
    const result = await runQuery(
      "INSERT INTO tickets (title, description, priority, category, user_id) VALUES (?, ?, ?, ?, ?)",
      [title.trim(), description.trim(), priority, category.trim(), userId]
    );

    // Get the created ticket with user info
    const ticket = await getQuery(
      `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket. Please try again.",
    });
  }
};

// Get all tickets with filtering and pagination
const getTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build the main query
    let query = `
      SELECT t.*,
             u.name as user_name,
             u.email as user_email,
             a.name as assigned_to_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
    `;

    let params = [];
    let conditions = [];

    // Role-based access control
    if (userRole !== "admin") {
      conditions.push("t.user_id = ?");
      params.push(parseInt(userId));
    }

    // Add filters
    if (status) {
      conditions.push("t.status = ?");
      params.push(status);
    }

    if (priority) {
      conditions.push("t.priority = ?");
      params.push(priority);
    }

    if (category && category !== "all") {
      conditions.push("t.category = ?");
      params.push(category);
    }

    // Search functionality
    if (search) {
      conditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Sorting
    const validSortFields = [
      "created_at",
      "updated_at",
      "title",
      "status",
      "priority",
    ];
    const validSortOrders = ["ASC", "DESC"];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    query += ` ORDER BY t.${sortField} ${sortDirection}`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const tickets = await getAllQuery(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM tickets t";
    let countParams = [];
    let countConditions = [];

    // Apply same filters for count
    if (userRole !== "admin") {
      countConditions.push("t.user_id = ?");
      countParams.push(parseInt(userId));
    }

    if (status) {
      countConditions.push("t.status = ?");
      countParams.push(status);
    }

    if (priority) {
      countConditions.push("t.priority = ?");
      countParams.push(priority);
    }

    if (category && category !== "all") {
      countConditions.push("t.category = ?");
      countParams.push(category);
    }

    if (search) {
      countConditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (countConditions.length > 0) {
      countQuery += " WHERE " + countConditions.join(" AND ");
    }

    const totalResult = await getQuery(countQuery, countParams);
    const total = totalResult.total;

    // Get summary statistics (for dashboard)
    let statsQuery = "SELECT status, COUNT(*) as count FROM tickets";
    let statsParams = [];

    if (userRole !== "admin") {
      statsQuery += " WHERE user_id = ?";
      statsParams.push(parseInt(userId));
    }

    statsQuery += " GROUP BY status";
    const stats = await getAllQuery(statsQuery, statsParams);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {}),
      filters: {
        status,
        priority,
        category,
        search,
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tickets. Please try again.",
    });
  }
};

// Get a single ticket by ID
const getTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate ticket ID
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await getQuery(
      `
      SELECT t.*,
             u.name as user_name,
             u.email as user_email,
             a.name as assigned_to_name,
             a.email as assigned_to_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `,
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check access permissions
    if (
      userRole !== "admin" &&
      ticket.user_id !== parseInt(userId) &&
      ticket.assigned_to !== parseInt(userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own tickets.",
      });
    }

    // Get comments for this ticket
    const comments = await getAllQuery(
      `
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `,
      [ticketId]
    );

    res.json({
      success: true,
      ticket: {
        ...ticket,
        comments,
      },
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket. Please try again.",
    });
  }
};

// Update a ticket
const updateTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { title, description, status, priority, category, assigned_to } =
      req.body;

    // Validate ticket ID
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Check if ticket exists
    const ticket = await getQuery("SELECT * FROM tickets WHERE id = ?", [
      ticketId,
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check permissions - Debug logging
    console.log("Permission check:", {
      userRole,
      userId,
      ticketUserId: ticket.user_id,
      ticketAssignedTo: ticket.assigned_to,
      userIdType: typeof userId,
      ticketUserIdType: typeof ticket.user_id
    });

    const canEdit =
      userRole === "admin" ||
      ticket.user_id === parseInt(userId) ||
      ticket.assigned_to === parseInt(userId);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit your own tickets.",
      });
    }

    // Build update query dynamically
    let updateFields = [];
    let params = [];

    // Regular users can update these fields
    if (title !== undefined && title.trim().length >= 3) {
      updateFields.push("title = ?");
      params.push(title.trim());
    }

    if (description !== undefined && description.trim().length >= 10) {
      updateFields.push("description = ?");
      params.push(description.trim());
    }

    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high", "urgent"];
      if (validPriorities.includes(priority)) {
        updateFields.push("priority = ?");
        params.push(priority);
      }
    }

    if (category !== undefined) {
      updateFields.push("category = ?");
      params.push(category.trim());
    }

    // Only admins and assigned users can change status and assignment
    if (userRole === "admin" || ticket.assigned_to === userId) {
      if (status !== undefined) {
        const validStatuses = ["open", "in-progress", "resolved", "closed"];
        if (validStatuses.includes(status)) {
          updateFields.push("status = ?");
          params.push(status);
        }
      }

      if (assigned_to !== undefined && userRole === "admin") {
        updateFields.push("assigned_to = ?");
        params.push(assigned_to || null);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Always update the timestamp
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(ticketId);

    const updateQuery = `UPDATE tickets SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await runQuery(updateQuery, params);

    // Get updated ticket
    const updatedTicket = await getQuery(
      `
      SELECT t.*,
             u.name as user_name,
             u.email as user_email,
             a.name as assigned_to_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `,
      [ticketId]
    );

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket. Please try again.",
    });
  }
};

// Delete a ticket
const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate ticket ID
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Check if ticket exists
    const ticket = await getQuery("SELECT * FROM tickets WHERE id = ?", [
      ticketId,
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check permissions - only admin or ticket owner can delete
    if (userRole !== "admin" && ticket.user_id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only administrators or ticket owners can delete tickets.",
      });
    }

    // Delete associated comments first (foreign key constraint)
    await runQuery("DELETE FROM ticket_comments WHERE ticket_id = ?", [
      ticketId,
    ]);

    // Delete the ticket
    await runQuery("DELETE FROM tickets WHERE id = ?", [ticketId]);

    res.json({
      success: true,
      message: "Ticket and associated comments deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket. Please try again.",
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
};
