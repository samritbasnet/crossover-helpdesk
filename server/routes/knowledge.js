const express = require("express");
const router = express.Router();
const {
  createKnowledge,
  getKnowledge,
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
  markHelpful,
} = require("../controllers/knowledgeController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public routes (no authentication required)
router.get("/", getKnowledge); // Get all knowledge articles with search
router.get("/:id", getKnowledgeById); // Get single knowledge article
router.post("/:id/helpful", markHelpful); // Mark article as helpful

// Protected routes (authentication required)
router.use(authenticateToken);

router.post("/", createKnowledge); // Create new knowledge article
router.put("/:id", updateKnowledge); // Update knowledge article
router.delete("/:id", deleteKnowledge); // Delete knowledge article

module.exports = router;
