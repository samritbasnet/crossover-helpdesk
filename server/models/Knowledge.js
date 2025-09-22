const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Knowledge Model - Defines what a knowledge base article looks like
const Knowledge = sequelize.define(
  "Knowledge",
  {
    // Primary key - unique identifier for each article
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Article title
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
      validate: {
        len: [1, 200], // Must be between 1 and 200 characters
      },
    },

    // Article content (the main text)
    content: {
      type: DataTypes.TEXT,
      allowNull: false, // Required field
      validate: {
        len: [1, 5000], // Must be between 1 and 5000 characters
      },
    },

    // Keywords for searching (stored as comma-separated text)
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true, // Optional field
      // Convert array to comma-separated string when saving
      get() {
        const keywords = this.getDataValue("keywords");
        return keywords ? keywords.split(",") : [];
      },
      // Convert comma-separated string to array when reading
      set(keywords) {
        this.setDataValue(
          "keywords",
          Array.isArray(keywords) ? keywords.join(",") : keywords
        );
      },
    },

    // Category of the article
    category: {
      type: DataTypes.ENUM(
        "general",
        "technical",
        "billing",
        "account",
        "other"
      ),
      defaultValue: "general", // Default category
      allowNull: false,
    },

    // Who created this article (links to users table)
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false, // Required field
      references: {
        model: "users", // Links to users table
        key: "id", // Links to user's ID
      },
    },

    // How many people found this article helpful
    helpfulCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Start at 0
    },
  },
  {
    timestamps: true,
    tableName: "knowledge_base",
  }
);

module.exports = Knowledge;
