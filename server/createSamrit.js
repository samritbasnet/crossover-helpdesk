// Create Samrit User Script
const { User } = require("./models");
const bcrypt = require("bcryptjs");

const createSamrit = async () => {
  try {
    console.log("👤 Creating Samrit Basnet account...");

    // Delete existing user if any
    await User.destroy({ where: { email: "samrit@test.com" } });

    // Create the user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "Samrit Basnet",
      email: "samrit@test.com",
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
createSamrit()
  .then(() => {
    console.log("✅ User creation process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ User creation failed:", error);
    process.exit(1);
  });
