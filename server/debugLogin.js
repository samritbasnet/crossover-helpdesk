// Debug Login Script
const { User } = require("./models");
const bcrypt = require("bcryptjs");

const debugLogin = async () => {
  try {
    console.log("🔍 Debugging login for samrit@test.com...");

    // Find user
    const user = await User.findOne({ where: { email: "samrit@test.com" } });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", user.name);
    console.log("📧 Email:", user.email);
    console.log("🔑 Password hash:", user.password);

    // Test password comparison
    const isMatch = await bcrypt.compare("password123", user.password);
    console.log("🔐 Password match:", isMatch);

    if (isMatch) {
      console.log("✅ Login should work!");
    } else {
      console.log("❌ Password doesn't match");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
};

// Run the function
debugLogin()
  .then(() => {
    console.log("✅ Debug completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });
