// Create User Script - Add a specific user for testing
const { User } = require("./models");
const bcrypt = require("bcryptjs");

const createUser = async () => {
  try {
    console.log("👤 Creating user account for Samrit Basnet...");

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: "samrit@example.com" },
    });
    if (existingUser) {
      console.log("✅ User already exists:", existingUser.name);
      return;
    }

    // Create the user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "Samrit Basnet",
      email: "samrit@example.com",
      password: hashedPassword,
      role: "user",
    });

    console.log("✅ User created successfully:");
    console.log("Name:", user.name);
    console.log("Email:", user.email);
    console.log("Password: password123");
    console.log("Role:", user.role);
  } catch (error) {
    console.error("❌ Error creating user:", error);
  }
};

// Run the function
createUser()
  .then(() => {
    console.log("✅ User creation process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ User creation failed:", error);
    process.exit(1);
  });
