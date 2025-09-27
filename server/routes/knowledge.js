const express = require("express");
const { getDatabase } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Helpers (simple and reusable)
const runQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const getQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const getAllQuery = (query, params = []) =>
  new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

// Public routes
// List knowledge with optional search/category + simple pagination
router.get("/", async (req, res) => {
  try {
    const { search = "", category = "", page = 1, limit = 10 } = req.query;
    const params = [];
    let where = [];

    if (category) {
      where.push("category = ?");
      params.push(category);
    }
    if (search) {
      where.push("(title LIKE ? OR content LIKE ? OR keywords LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    let query = `SELECT k.*, u.name AS created_by_name, u.email AS created_by_email
                 FROM knowledge k
                 JOIN users u ON k.created_by = u.id`;
    if (where.length) query += " WHERE " + where.join(" AND ");
    query += " ORDER BY helpful_count DESC, created_at DESC LIMIT ? OFFSET ?";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);

    const items = await getAllQuery(query, params);

    // Total count for pagination
    let countQuery = "SELECT COUNT(*) AS total FROM knowledge";
    const countParams = [];
    if (where.length) {
      countQuery += " WHERE " + where.join(" AND ");
      // reuse same filters without limit/offset
      for (const p of params.slice(0, params.length - 2)) countParams.push(p);
    }
    const totalRow = await getQuery(countQuery, countParams);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRow?.total || 0,
        totalPages: Math.ceil((totalRow?.total || 0) / limitNum),
      },
    });
  } catch (err) {
    console.error("Get knowledge error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch knowledge" });
  }
});

// Get single article
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const row = await getQuery(
      `SELECT k.*, u.name AS created_by_name, u.email AS created_by_email
       FROM knowledge k
       JOIN users u ON k.created_by = u.id
       WHERE k.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error("Get knowledge by id error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch knowledge" });
  }
});

// Mark as helpful (public)
router.post("/:id/helpful", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getQuery("SELECT id, helpful_count FROM knowledge WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });
    await runQuery("UPDATE knowledge SET helpful_count = helpful_count + 1 WHERE id = ?", [id]);
    res.json({ success: true, message: "Thank you for your feedback!", helpful_count: (existing.helpful_count || 0) + 1 });
  } catch (err) {
    console.error("Mark helpful error:", err);
    res.status(500).json({ success: false, message: "Failed to update helpful count" });
  }
});

// Protected routes
router.use(authenticateToken);

// Create article
router.post("/", async (req, res) => {
  try {
    const { title, content, keywords = "", category = "general" } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }
    const result = await runQuery(
      "INSERT INTO knowledge (title, content, keywords, category, created_by) VALUES (?, ?, ?, ?, ?)",
      [title.trim(), content.trim(), keywords.trim(), category.trim(), req.user.userId]
    );
    const created = await getQuery("SELECT * FROM knowledge WHERE id = ?", [result.id]);
    res.status(201).json({ success: true, message: "Article created", data: created });
  } catch (err) {
    console.error("Create knowledge error:", err);
    res.status(500).json({ success: false, message: "Failed to create knowledge" });
  }
});

// Update article
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, keywords, category } = req.body;

    const existing = await getQuery("SELECT * FROM knowledge WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    // Only creator or admin can edit
    if (existing.created_by !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const fields = [];
    const params = [];
    if (title !== undefined) { fields.push("title = ?"); params.push(title.trim()); }
    if (content !== undefined) { fields.push("content = ?"); params.push(content.trim()); }
    if (keywords !== undefined) { fields.push("keywords = ?"); params.push(keywords.trim()); }
    if (category !== undefined) { fields.push("category = ?"); params.push(category.trim()); }
    if (!fields.length) {
      return res.status(400).json({ success: false, message: "No valid fields provided" });
    }
    params.push(id);
    await runQuery(`UPDATE knowledge SET ${fields.join(", ")} WHERE id = ?`, params);

    const updated = await getQuery("SELECT * FROM knowledge WHERE id = ?", [id]);
    res.json({ success: true, message: "Article updated", data: updated });
  } catch (err) {
    console.error("Update knowledge error:", err);
    res.status(500).json({ success: false, message: "Failed to update knowledge" });
  }
});

// Delete article
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getQuery("SELECT * FROM knowledge WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    if (existing.created_by !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await runQuery("DELETE FROM knowledge WHERE id = ?", [id]);
    res.json({ success: true, message: "Article deleted" });
  } catch (err) {
    console.error("Delete knowledge error:", err);
    res.status(500).json({ success: false, message: "Failed to delete knowledge" });
  }
});

module.exports = router;
