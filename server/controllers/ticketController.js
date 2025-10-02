// Ticket Controller - Simplified business logic
const {
  runQuery,
  getQuery,
  getAllQuery,
  getDatabase,
} = require("../config/database");
const {
  sendTicketCreatedNotification,
  sendTicketResolvedNotification,
  sendTicketAssignedNotification,
} = require("../services/emailService");

// Constants for validation
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["open", "in-progress", "resolved", "closed"];
const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 10;

/**
 * Create a new ticket
 * @param {Object} req - Request object with title, description, priority
 * @param {Object} res - Response object
 */
const createTicket = async (req, res) => {
  try {
    const { title, description, priority = "medium" } = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (title.trim().length < MIN_TITLE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters long`,
      });
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`,
      });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(
          ", "
        )}`,
      });
    }

    // Create ticket
    const result = await runQuery(
      "INSERT INTO tickets (title, description, priority, user_id) VALUES (?, ?, ?, ?)",
      [title.trim(), description.trim(), priority, userId]
    );

    // Get created ticket with user info
    const ticket = await getQuery(
      `SELECT t.*, u.name as user_name, u.email as user_email
        FROM tickets t
        JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    // Send email notification (don't fail if email fails)
    try {
      await sendTicketCreatedNotification(ticket, {
        name: ticket.user_name,
        email: ticket.user_email,
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError.message);
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

/**
 * Get all tickets with filtering and pagination
 * @param {Object} req - Request object with query parameters
 * @param {Object} res - Response object
 */
const getTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      assigned,
      page = 1,
      limit = 10,
      search = "",
    } = req.query;
    const { userId, role: userRole } = req.user;

    // Build base query
    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email, a.name as assigned_to_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
    `;

    let params = [];
    let conditions = [];

    // Role-based access control
    if (userRole === "user") {
      conditions.push("t.user_id = ?");
      params.push(userId);
    }

    // Add filters
    if (status) conditions.push("t.status = ?"), params.push(status);
    if (priority) conditions.push("t.priority = ?"), params.push(priority);
    if (category && category !== "all")
      conditions.push("t.category = ?"), params.push(category);
    if (assigned !== undefined) {
      if (assigned === "true" || assigned === true) {
        if (userRole === "agent") {
          // For agents, show only tickets assigned to them
          conditions.push("t.assigned_to = ?");
          params.push(userId);
        } else {
          // For admin, show all assigned tickets
          conditions.push("t.assigned_to IS NOT NULL");
        }
      } else if (assigned === "false" || assigned === false) {
        conditions.push("t.assigned_to IS NULL");
      }
    }
    if (search) {
      conditions.push("(t.title LIKE ? OR t.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    // Apply conditions
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Add sorting and pagination
    query += " ORDER BY t.created_at DESC";
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    // Execute queries
    const tickets = await getAllQuery(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM tickets t";
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    const countResult = await getQuery(countQuery, params.slice(0, -2)); // Remove pagination params
    const total = countResult?.total || 0;

    res.json({
      success: true,
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tickets",
    });
  }
};

/**
 * Get a single ticket by ID
 * @param {Object} req - Request object with ticket ID
 * @param {Object} res - Response object
 */
const getTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { userId, role: userRole } = req.user;

    // Validate ticket ID
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    // Get ticket with user info
    const ticket = await getQuery(
      `SELECT t.*, u.name as user_name, u.email as user_email,
              a.name as assigned_to_name, a.email as assigned_to_email
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.id = ?`,
      [ticketId]
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check access permissions
    const canAccess =
      userRole === "admin" ||
      ticket.user_id === userId ||
      ticket.assigned_to === userId;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      ticket: { ...ticket, comments: [] }, // Comments feature not implemented yet
    });
  } catch (error) {
    console.error("Get ticket error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket",
    });
  }
};

/**
 * Update a ticket
 * @param {Object} req - Request object with ticket ID and update data
 * @param {Object} res - Response object
 */
const updateTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { userId, role: userRole } = req.user;
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

    // Check permissions
    const canEdit =
      userRole === "admin" ||
      userRole === "agent" ||
      ticket.user_id === userId ||
      ticket.assigned_to === userId;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Build update fields
    let updateFields = [];
    let params = [];

    // Basic fields any authorized user can update
    if (title !== undefined && title.trim().length >= MIN_TITLE_LENGTH) {
      updateFields.push("title = ?");
      params.push(title.trim());
    }

    if (
      description !== undefined &&
      description.trim().length >= MIN_DESCRIPTION_LENGTH
    ) {
      updateFields.push("description = ?");
      params.push(description.trim());
    }

    if (priority !== undefined && VALID_PRIORITIES.includes(priority)) {
      updateFields.push("priority = ?");
      params.push(priority);
    }

    if (category !== undefined) {
      updateFields.push("category = ?");
      params.push(category.trim());
    }

    // Status and assignment (admin/agent only)
    if (userRole === "admin" || userRole === "agent") {
      if (status !== undefined && VALID_STATUSES.includes(status)) {
        if (status === "resolved" && !resolution_notes) {
          return res.status(400).json({
            success: false,
            message: "Resolution notes are required when resolving a ticket",
          });
        }
        updateFields.push("status = ?");
        params.push(status);

        if (status === "resolved") {
          updateFields.push("resolved_at = CURRENT_TIMESTAMP");
          updateFields.push("resolution_notes = ?");
          params.push(resolution_notes);
        }
      }

      if (assigned_to !== undefined) {
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

    // Add timestamp and execute update
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    params.push(ticketId);

    await runQuery(
      `UPDATE tickets SET ${updateFields.join(", ")} WHERE id = ?`,
      params
    );

    // Get updated ticket
    const updatedTicket = await getQuery(
      `SELECT t.*, u.name as user_name, u.email as user_email, a.name as assigned_to_name
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
       WHERE t.id = ?`,
      [ticketId]
    );

    // Send email notification if resolved
    if (status === "resolved") {
      try {
        await sendTicketResolvedNotification(
          updatedTicket,
          { name: updatedTicket.user_name, email: updatedTicket.user_email },
          { name: req.user.name || "Support Agent", email: req.user.email }
        );
      } catch (emailError) {
        console.error("Email notification failed:", emailError.message);
      }
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
};

/**
 * Delete a ticket
 * @param {Object} req - Request object with ticket ID
 * @param {Object} res - Response object
 */
const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { userId, role: userRole } = req.user;

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

    // Check permissions (admin or ticket owner only)
    if (userRole !== "admin" && ticket.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete the ticket
    await runQuery("DELETE FROM tickets WHERE id = ?", [ticketId]);

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};

/**
 * Agent assigns ticket to themselves
 * @param {Object} req - Request object with ticket ID
 * @param {Object} res - Response object
 */
const takeTicket = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { userId, role: userRole } = req.user;

    // Only agents can take tickets
    if (userRole !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Only agents can take tickets",
      });
    }

    // Get ticket details
    const ticket = await getQuery("SELECT * FROM tickets WHERE id = ?", [
      ticketId,
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check if ticket is already assigned
    if (ticket.assigned_to) {
      // Check if it's assigned to the current agent
      if (ticket.assigned_to === userId) {
        return res.status(400).json({
          success: false,
          message: "You have already taken this ticket",
        });
      }

      // Get the assigned agent's name
      const assignedAgent = await getQuery(
        "SELECT name FROM users WHERE id = ?",
        [ticket.assigned_to]
      );

      const agentName = assignedAgent ? assignedAgent.name : "another agent";

      return res.status(400).json({
        success: false,
        message: `Ticket is already assigned to ${agentName}`,
        assignedToName: agentName,
      });
    }

    // Assign ticket to current agent
    await runQuery(
      "UPDATE tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [userId, ticketId]
    );

    res.json({
      success: true,
      message: "Ticket assigned to you successfully",
    });
  } catch (error) {
    console.error("Take ticket error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
    });
  }
};

/**
 * Assign ticket to an agent (admin only)
 * @param {Object} req - Request object with ticket ID and agent ID
 * @param {Object} res - Response object
 */
const assignTicket = async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { assignedTo } = req.body;
    const { userId, role: userRole } = req.user;

    // Only admin can assign tickets
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can assign tickets",
      });
    }

    // Get ticket details
    const ticket = await getQuery("SELECT * FROM tickets WHERE id = ?", [
      ticketId,
    ]);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    let agent = null;
    let user = null;

    // Check if ticket is already assigned to a different agent
    if (ticket.assigned_to && ticket.assigned_to != assignedTo) {
      const currentAgent = await getQuery(
        "SELECT name FROM users WHERE id = ?",
        [ticket.assigned_to]
      );
      const currentAgentName = currentAgent ? currentAgent.name : "another agent";
      
      return res.status(400).json({
        success: false,
        message: `Ticket is already assigned to ${currentAgentName}. Please unassign first if you want to reassign.`,
        alreadyAssignedTo: currentAgentName,
      });
    }

    // Verify agent exists and is actually an agent
    if (assignedTo) {
      agent = await getQuery(
        "SELECT * FROM users WHERE id = ? AND role = 'agent'",
        [assignedTo]
      );

      if (!agent) {
        return res.status(400).json({
          success: false,
          message: "Invalid agent ID",
        });
      }

      // Get user details for email notification
      user = await getQuery("SELECT name FROM users WHERE id = ?", [
        ticket.user_id,
      ]);
    }

    // Update ticket assignment
    await runQuery(
      "UPDATE tickets SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [assignedTo || null, ticketId]
    );

    // Send email notification to agent if ticket was assigned
    if (assignedTo && agent && user) {
      try {
        await sendTicketAssignedNotification(ticket, agent, user);
      } catch (emailError) {
        console.error(
          "Failed to send assignment notification:",
          emailError.message
        );
        // Don't fail the request if email fails
      }
    }

    // Prepare response with agent name
    const responseMessage = assignedTo
      ? `Ticket assigned successfully to ${agent.name}`
      : "Ticket unassigned successfully";

    res.json({
      success: true,
      message: responseMessage,
      assignedTo: assignedTo ? agent.name : null,
    });
  } catch (error) {
    console.error("Assign ticket error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to assign ticket",
    });
  }
};

/**
 * Get all agents for ticket assignment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAgents = async (req, res) => {
  try {
    const { role: userRole } = req.user;

    // Only admin can get agent list
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const agents = await getAllQuery(
      "SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY name"
    );

    res.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error("Get agents error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve agents",
    });
  }
};

/**
 * Get dashboard statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDashboardStats = async (req, res) => {
  try {
    const { userId, role: userRole } = req.user;

    let stats = {};

    if (userRole === "admin") {
      // Admin sees all stats
      const totalTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets"
      );
      const openTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'open'"
      );
      const inProgressTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'in-progress'"
      );
      const resolvedTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'"
      );
      const totalUsers = await getQuery(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
      );
      const totalAgents = await getQuery(
        "SELECT COUNT(*) as count FROM users WHERE role = 'agent'"
      );

      stats = {
        totalTickets: totalTickets.count,
        openTickets: openTickets.count,
        inProgressTickets: inProgressTickets.count,
        resolvedTickets: resolvedTickets.count,
        totalUsers: totalUsers.count,
        totalAgents: totalAgents.count,
      };
    } else if (userRole === "agent") {
      // Agent sees tickets assigned to them or unassigned
      const myTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ?",
        [userId]
      );
      const unassignedTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE assigned_to IS NULL"
      );
      const myResolvedTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ? AND status = 'resolved'",
        [userId]
      );

      stats = {
        myTickets: myTickets.count,
        unassignedTickets: unassignedTickets.count,
        myResolvedTickets: myResolvedTickets.count,
      };
    } else {
      // User sees only their tickets
      const myTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE user_id = ?",
        [userId]
      );
      const myOpenTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND status = 'open'",
        [userId]
      );
      const myResolvedTickets = await getQuery(
        "SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND status = 'resolved'",
        [userId]
      );

      stats = {
        myTickets: myTickets.count,
        myOpenTickets: myOpenTickets.count,
        myResolvedTickets: myResolvedTickets.count,
      };
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
    });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  takeTicket,
  getAgents,
  getDashboardStats,
};
