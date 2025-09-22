const { Knowledge, User } = require("../models");
const { Op } = require("sequelize");

// Create a new knowledge article
exports.createKnowledge = async (req, res) => {
  try {
    const { title, content, keywords, category } = req.body;
    const createdBy = req.user.id;

    const knowledge = await Knowledge.create({
      title,
      content,
      keywords,
      category: category || "general",
      createdBy,
    });

    // Fetch the knowledge article with creator information
    const knowledgeWithCreator = await Knowledge.findByPk(knowledge.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Knowledge article created successfully",
      knowledge: knowledgeWithCreator,
    });
  } catch (error) {
    console.error("Create knowledge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create knowledge article",
    });
  }
};

// Get all knowledge articles with search functionality
exports.getKnowledge = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { keywords: { [Op.like]: `%${search}%` } },
      ];
    }

    const knowledge = await Knowledge.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
      order: [
        ["helpfulCount", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      knowledge: knowledge.rows,
      total: knowledge.count,
      page: parseInt(page),
      totalPages: Math.ceil(knowledge.count / limit),
    });
  } catch (error) {
    console.error("Get knowledge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch knowledge articles",
    });
  }
};

// Get a single knowledge article
exports.getKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await Knowledge.findByPk(id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: "Knowledge article not found",
      });
    }

    res.json({
      success: true,
      knowledge,
    });
  } catch (error) {
    console.error("Get knowledge by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch knowledge article",
    });
  }
};

// Update knowledge article
exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, keywords, category } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const knowledge = await Knowledge.findByPk(id);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: "Knowledge article not found",
      });
    }

    // Only the creator or an agent can update
    if (knowledge.createdBy !== userId && userRole !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this article",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (keywords) updateData.keywords = keywords;
    if (category) updateData.category = category;

    await knowledge.update(updateData);

    // Fetch updated knowledge with relations
    const updatedKnowledge = await Knowledge.findByPk(knowledge.id, {
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({
      success: true,
      message: "Knowledge article updated successfully",
      knowledge: updatedKnowledge,
    });
  } catch (error) {
    console.error("Update knowledge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update knowledge article",
    });
  }
};

// Delete knowledge article
exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const knowledge = await Knowledge.findByPk(id);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: "Knowledge article not found",
      });
    }

    // Only the creator or an agent can delete
    if (knowledge.createdBy !== userId && userRole !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this article",
      });
    }

    await knowledge.destroy();

    res.json({
      success: true,
      message: "Knowledge article deleted successfully",
    });
  } catch (error) {
    console.error("Delete knowledge error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete knowledge article",
    });
  }
};

// Mark knowledge article as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await Knowledge.findByPk(id);

    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: "Knowledge article not found",
      });
    }

    await knowledge.increment("helpfulCount");

    res.json({
      success: true,
      message: "Thank you for your feedback!",
      helpfulCount: knowledge.helpfulCount + 1,
    });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update helpful count",
    });
  }
};
