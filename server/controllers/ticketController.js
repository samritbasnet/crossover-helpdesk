// controllers/ticketController.js - Ticket business logic
const { getDatabase } = require("../config/database");
const {
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketResolved,
  notifyTicketAssigned,
  notifyAgentAssigned
} = require("../services/emailService");

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

    // Get the created ticket with user info including email preferences
    const ticket = await getQuery(
      `
      SELECT t.*, u.name as user_name, u.email as user_email, u.email_notifications
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `,
      [result.id]
    );

    // Send email notification to user
    try {
      const user = {
        name: ticket.user_name,
        email: ticket.user_email,
        email_notifications: ticket.email_notifications
      };
      await notifyTicketCreated(ticket, user);
      console.log(`📧 Ticket creation notification sent to ${user.email}`);
    } catch (emailError) {
      console.error('📧 Failed to send ticket creation notification:', emailError.message);
      // Don't fail the request if email fails
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
    if (userRole === "user") {
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
    if (userRole === "user") {
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

    if (userRole === "user") {
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
    const { title, description, status, priority, category, assigned_to, resolution_notes } =
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

    // Check permissions - Fixed logic
    const userIdNum = parseInt(userId);
    const ticketUserId = parseInt(ticket.user_id);
    const assignedToId = ticket.assigned_to ? parseInt(ticket.assigned_to) : null;
    
    const canEdit =
      userRole === "admin" ||
      ticketUserId === userIdNum ||
      (assignedToId && assignedToId === userIdNum);

    if (!canEdit) {
      console.log(`Permission denied for user ${userId} (${userRole}) trying to edit ticket ${ticketId} owned by ${ticket.user_id}`);
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

    // Only admins and assigned agents can change status and assignment
    if (userRole === "admin" || userRole === "agent" || ticket.assigned_to === userId) {
      if (status !== undefined) {
        const validStatuses = ["open", "in-progress", "resolved", "closed"];
        if (validStatuses.includes(status)) {
          // If resolving a ticket, require resolution notes
          if (status === 'resolved' && !resolution_notes) {
            return res.status(400).json({
              success: false,
              message: "Resolution notes are required when resolving a ticket",
            });
          }
          
          updateFields.push("status = ?");
          params.push(status);
          
          // If resolving, update resolved_at timestamp
          if (status === 'resolved') {
            updateFields.push("resolved_at = CURRENT_TIMESTAMP");
            updateFields.push("resolution_notes = ?");
            params.push(resolution_notes);
          }
        }
      }

      // Only admins can reassign tickets
      if (assigned_to !== undefined && (userRole === "admin" || userRole === "agent")) {
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

    // Get updated ticket with all user info including requester and assignee details
    const updatedTicket = await getQuery(
      `
      SELECT t.*,
             u.id as user_id,
             u.name as user_name,
             u.email as user_email,
             u.email_notifications as user_notifications,
             a.id as assigned_to_id,
             a.name as assigned_to_name,
             a.email as assigned_to_email,
             a.email_notifications as agent_notifications
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
        email: updatedTicket.user_email,
        email_notifications: updatedTicket.user_notifications
      };

      const changes = [];
      if (status && status !== ticket.status) changes.push(`Status changed to ${status}`);
      if (priority && priority !== ticket.priority) changes.push(`Priority changed to ${priority}`);
      
      // Handle assignment changes
      if (assigned_to !== undefined && assigned_to !== ticket.assigned_to) {
        if (assigned_to) {
          changes.push(`Assigned to ${updatedTicket.assigned_to_name}`);
          
          // Notify the newly assigned agent
          if (updatedTicket.assigned_to_id) {
            await notifyAgentAssigned(
              updatedTicket,
              { 
                id: updatedTicket.assigned_to_id,
                email: updatedTicket.assigned_to_email,
                name: updatedTicket.assigned_to_name,
                email_notifications: updatedTicket.agent_notifications
              },
              { 
                id: userId, 
                name: req.user.name, 
                email: req.user.email 
              }
            );
          }
        } else {
          changes.push('Ticket unassigned');
        }
      }

      // Handle resolution notification
      if (status === 'resolved') {
        await notifyTicketResolved(
          updatedTicket,
          ticketOwner,
          { 
            id: userId,
            name: req.user.name,
            email: req.user.email
          },
          resolution_notes
        );
        console.log(`📧 Resolution notification sent to ${ticketOwner.email}`);
      } 
      // Send general update notification if there were changes (but not for resolved tickets as they get special treatment)
      else if (changes.length > 0) {
        await notifyTicketUpdated(
          updatedTicket,
          ticketOwner,
          { 
            id: userId,
            name: req.user.name,
            email: req.user.email,
            role: userRole
          },
          changes
        );
        console.log(`📧 Ticket update notification sent to ${ticketOwner.email}`);
      }

    } catch (emailError) {
      console.error('📧 Failed to send ticket update notification:', emailError.message);
      // Don't fail the request if email fails
    }

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
