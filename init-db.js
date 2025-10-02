const { initDatabase } = require("./server/utils/dbInit");

async function initializeDatabase() {
  try {
    console.log("🚀 Starting database initialization...");

    const success = await initDatabase();

    if (success) {
      console.log("\n🎉 Database initialization completed successfully!");
      console.log("You can now start the application with: npm run dev\n");
      console.log("Test accounts created:");
      console.log("  Admin: admin@helpdesk.com / admin123");
      console.log("  Agent: agent@helpdesk.com / agent123");
      console.log("  User:  user@helpdesk.com / user123");
    } else {
      console.error("❌ Database initialization failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
