const { Ticket, User } = require("../models");
const {
  sendSuccess,
  sendError,
  handleDatabaseError,
} = require("../utils/helpers");

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    // Step 1: Get data from request
    const { title, description, priority } = req.body;
    const userId = req.user.id; // From authentication middleware

    // Step 2: Create ticket in database
    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium", // Default to medium if not specified
      userId,
    });

    // Step 3: Get the ticket with user information
    const ticketWithUser = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
    });

    // Step 4: Send success response
    sendSuccess(res, "Ticket created successfully", ticketWithUser, 201);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// Get all tickets (with role-based filtering)
exports.getTickets = async (req, res) => {
  try {
    // Step 1: Get query parameters and user info
    const { status, priority, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Step 2: Set up filtering based on user role
    let whereClause = {};

    // Regular users can only see their own tickets
    if (userRole === "user") {
      whereClause.userId = userId;
    }
    // Agents can see all tickets (no additional filter needed)

    // Step 3: Add status and priority filters if provided
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    // Step 4: Calculate pagination
    const offset = (page - 1) * limit;

    // Step 5: Get tickets from database
    const tickets = await Ticket.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "assignedAgent",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]], // Newest tickets first
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Step 6: Send response with pagination info
    const responseData = {
      tickets: tickets.rows,
      total: tickets.count,
      page: parseInt(page),
      totalPages: Math.ceil(tickets.count / limit),
    };

    sendSuccess(res, "Tickets retrieved successfully", responseData);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// Get a single ticket
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = { id };

    // Regular users can only see their own tickets
    if (userRole === "user") {
      whereClause.userId = userId;
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "assignedAgent",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
    });
  }
};

// Update ticket (agents can update status, users can update their own tickets)
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      resolutionNotes,
      assignedAgentId,
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = { id };

    // Regular users can only update their own tickets (and only certain fields)
    if (userRole === "user") {
      whereClause.userId = userId;
    }

    const ticket = await Ticket.findOne({ where: whereClause });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Prepare update data based on user role
    const updateData = {};

    if (userRole === "user") {
      // Users can only update title, description, and priority
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
    } else if (userRole === "agent") {
      // Agents can update everything
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      if (assignedAgentId) updateData.assignedAgentId = assignedAgentId;
    }

    await ticket.update(updateData);

    // Fetch updated ticket with relations
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "assignedAgent",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
};

// Delete ticket (users can delete their own tickets, agents can delete any)
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = { id };

    // Regular users can only delete their own tickets
    if (userRole === "user") {
      whereClause.userId = userId;
    }

    const ticket = await Ticket.findOne({ where: whereClause });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await ticket.destroy();

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};
