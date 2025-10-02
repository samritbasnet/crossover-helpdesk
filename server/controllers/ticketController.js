// controllers/ticketController.js - Ticket business logic
const {
  runQuery: dbRunQuery,
  getQuery: dbGetQuery,
  getAllQuery: dbGetAllQuery,
  getDatabase,
} = require("../config/database");
const { 
  sendTicketCreatedNotification, 
  sendTicketResolvedNotification 
} = require("../services/emailService");

// Helper functions for database operations
const runQuery = async (query, params = []) => {
  try {
    const result = await dbRunQuery(query, params);
    return {
      id: result.insertId,
      changes: result.affectedRows,
    };
  } catch (error) {
    console.error("Error in runQuery:", error);
    throw error;
  }
};

const getQuery = async (query, params = []) => {
  try {
    const row = await dbGetQuery(query, params);
    return row || null;
  } catch (error) {
    console.error("Error in getQuery:", error);
    throw error;
  }
};

const getAllQuery = async (query, params = []) => {
  try {
    const rows = await dbGetAllQuery(query, params);
    return rows || [];
  } catch (error) {
    console.error("Error in getAllQuery:", error);
    throw error;
  }
};

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const { title, description, priority = "medium" } = req.body;
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

    // Create ticket using direct database query
    const db = getDatabase();
    const result = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO tickets (title, description, priority, user_id) VALUES (?, ?, ?, ?)",
        [title.trim(), description.trim(), priority, userId],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });

    // Get the created ticket with user info including email preferences
    const ticket = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT t.*, u.name as user_name, u.email as user_email
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
        `,
        [result.id],
        (err, row) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    // Send email notification to user
    try {
      await sendTicketCreatedNotification(ticket, {
        name: ticket.user_name,
        email: ticket.user_email
      });
      console.log(`📧 Ticket creation notification sent to ${ticket.user_email}`);
    } catch (emailError) {
      console.error('📧 Failed to send ticket creation notification:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create ticket. Please try again.",
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
    if (userRole === "user") {
      conditions.push("t.user_id = ?");
      params.push(parseInt(userId));
    } else if (userRole === "agent") {
      // Agents can see all tickets
      // No additional conditions needed
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
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Add pagination to the query
    const paginatedQuery = `${query} LIMIT ${limitNum} OFFSET ${offset}`;

    // Execute query without passing limit/offset as parameters
    const tickets = await getAllQuery(paginatedQuery, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM tickets t";
    let countParams = [];

    // Apply same filters as the main query
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
      countParams = [...params]; // Create a copy of the params array
    }

    // Get the total count
    const countResult = await getQuery(countQuery, countParams);
    const total = countResult?.total || 0;

    // Get summary statistics (for dashboard)
    let statsQuery = "SELECT status, COUNT(*) as count FROM tickets t";
    let statsParams = [];
    let statsConditions = [];

    // Apply same filters as the main query
    if (userRole === "user") {
      statsConditions.push("t.user_id = ?");
      statsParams.push(parseInt(userId));
    }

    if (statsConditions.length > 0) {
      statsQuery += " WHERE " + statsConditions.join(" AND ");
    }

    statsQuery += " GROUP BY t.status";
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

    // TODO: Get comments for this ticket (when comments table is implemented)
    const comments = [];

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
    const {
      title,
      description,
      status,
      priority,
      category,
      assigned_to,
      resolution_notes,
    } = req.body;

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

    // Check permissions - Allow agents and admins to edit any ticket
    const userIdNum = parseInt(userId);
    const ticketUserId = parseInt(ticket.user_id);
    const assignedToId = ticket.assigned_to
      ? parseInt(ticket.assigned_to)
      : null;

    const canEdit =
      userRole === "admin" ||
      userRole === "agent" ||
      ticketUserId === userIdNum ||
      (assignedToId && assignedToId === userIdNum);

    if (!canEdit) {
      console.log(
        `Permission denied for user ${userId} (${userRole}) trying to edit ticket ${ticketId} owned by ${ticket.user_id}`
      );
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to edit this ticket.",
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

    // Only admins and assigned agents can change status and assignment
    if (
      userRole === "admin" ||
      userRole === "agent" ||
      ticket.assigned_to === userIdNum
    ) {
      if (status !== undefined) {
        const validStatuses = ["open", "in-progress", "resolved", "closed"];
        if (validStatuses.includes(status)) {
          // If resolving a ticket, require resolution notes
          if (status === "resolved" && !resolution_notes) {
            return res.status(400).json({
              success: false,
              message: "Resolution notes are required when resolving a ticket",
            });
          }

          updateFields.push("status = ?");
          params.push(status);

          // If resolving, update resolved_at timestamp
          if (status === "resolved") {
            updateFields.push("resolved_at = CURRENT_TIMESTAMP");
            updateFields.push("resolution_notes = ?");
            params.push(resolution_notes);
          }
        }
      }

      // Only admins can reassign tickets
      if (
        assigned_to !== undefined &&
        (userRole === "admin" || userRole === "agent")
      ) {
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

    try {
      await runQuery(updateQuery, params);
    } catch (error) {
      console.error("Error updating ticket:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update ticket",
        error: error.message,
      });
    }

    // Get updated ticket with all user info including requester and assignee details
    const updatedTicket = await getQuery(
      `
      SELECT t.*,
             u.id as user_id,
             u.name as user_name,
             u.email as user_email,
             a.id as assigned_to_id,
             a.name as assigned_to_name,
             a.email as assigned_to_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `,
      [ticketId]
    );

    // Get the user who made the update
    const updatedBy = await getQuery(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId]
    );

    // Send email notifications
    try {
      const ticketOwner = {
        id: updatedTicket.user_id,
        name: updatedTicket.user_name,
        email: updatedTicket.user_email
      };
      
      const resolvedBy = {
        id: userId,
        name: req.user.name || 'Support Agent',
        email: req.user.email
      };

      // Send resolution notification if ticket was resolved
      if (status === 'resolved') {
        await sendTicketResolvedNotification(updatedTicket, ticketOwner, resolvedBy);
        console.log(`📧 Ticket resolution notification sent to ${ticketOwner.email}`);
      } else {
        console.log(`📧 Ticket updated by user: ${req.user.email}`);
      }
    } catch (emailError) {
      console.error('📧 Failed to send email notification:', emailError.message);
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
    res.status(500).json({
      success: false,
      message: `Failed to update ticket: ${error.message}`,
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

    // TODO: Delete associated comments first (when comments table is implemented)
    // await runQuery("DELETE FROM ticket_comments WHERE ticket_id = ?", [ticketId]);

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
