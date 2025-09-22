// Seed Data Script - Create sample data for testing
const { User, Ticket, Knowledge } = require("./models");
const bcrypt = require("bcryptjs");

const seedData = async () => {
  try {
    console.log("🌱 Starting to seed database...");

    // First, sync the database to create tables
    const { sequelize } = require("./config/database");
    await sequelize.sync({ force: true });
    console.log("✅ Database tables created");

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const users = await User.bulkCreate([
      {
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        role: "user",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: hashedPassword,
        role: "user",
      },
      {
        name: "Support Agent",
        email: "agent@example.com",
        password: hashedPassword,
        role: "agent",
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "agent",
      },
    ]);

    console.log("✅ Created users:", users.length);

    // Create sample tickets
    const tickets = await Ticket.bulkCreate([
      {
        title: "Login Issues",
        description:
          "I'm having trouble logging into my account. I keep getting an error message saying 'Invalid credentials' even though I'm sure my password is correct.",
        priority: "high",
        status: "open",
        userId: users[0].id, // John Doe
      },
      {
        title: "Password Reset Not Working",
        description:
          "I tried to reset my password but I'm not receiving the reset email. I checked my spam folder and it's not there either.",
        priority: "medium",
        status: "in_progress",
        userId: users[1].id, // Jane Smith
        assignedAgentId: users[2].id, // Support Agent
      },
      {
        title: "Account Locked",
        description:
          "My account seems to be locked and I can't access any features. This happened after I tried to log in multiple times.",
        priority: "urgent",
        status: "resolved",
        resolutionNotes:
          "Account has been unlocked. User was advised to use the correct password and contact support if issues persist.",
        userId: users[0].id, // John Doe
        assignedAgentId: users[3].id, // Admin User
      },
      {
        title: "Feature Request - Dark Mode",
        description:
          "It would be great to have a dark mode option for the application. The current light theme is too bright for night usage.",
        priority: "low",
        status: "open",
        userId: users[1].id, // Jane Smith
      },
      {
        title: "Mobile App Crashes",
        description:
          "The mobile app keeps crashing when I try to view my tickets. This happens on both iOS and Android devices.",
        priority: "high",
        status: "in_progress",
        userId: users[0].id, // John Doe
        assignedAgentId: users[2].id, // Support Agent
      },
    ]);

    console.log("✅ Created tickets:", tickets.length);

    // Create sample knowledge articles
    const knowledgeArticles = await Knowledge.bulkCreate([
      {
        title: "How to Reset Your Password",
        content: `If you've forgotten your password, follow these steps:

1. Go to the login page
2. Click on "Forgot Password" link
3. Enter your email address
4. Check your email for reset instructions
5. Click the link in the email
6. Enter your new password twice
7. Click "Reset Password"

If you don't receive the email within 10 minutes, check your spam folder. If you still don't see it, contact support.`,
        keywords: ["password", "reset", "forgot", "login", "email"],
        category: "account",
        createdBy: users[2].id, // Support Agent
        helpfulCount: 15,
      },
      {
        title: "Common Login Issues and Solutions",
        content: `Here are the most common login issues and how to resolve them:

**Issue: "Invalid Credentials" Error**
- Make sure Caps Lock is off
- Check for typos in your email and password
- Try typing your password in a text editor first to verify it

**Issue: Account Locked**
- This happens after 5 failed login attempts
- Wait 15 minutes before trying again
- Contact support if the issue persists

**Issue: "User Not Found" Error**
- Verify you're using the correct email address
- Make sure you have an account (sign up if needed)
- Check if you're using the right domain`,
        keywords: [
          "login",
          "credentials",
          "locked",
          "error",
          "troubleshooting",
        ],
        category: "technical",
        createdBy: users[3].id, // Admin User
        helpfulCount: 23,
      },
      {
        title: "Understanding Ticket Priorities",
        content: `Our support system uses four priority levels:

**Low Priority**
- General questions
- Feature requests
- Non-urgent issues
- Response time: 2-3 business days

**Medium Priority**
- Minor issues that don't block work
- Account questions
- Response time: 1-2 business days

**High Priority**
- Important issues affecting work
- Security concerns
- Response time: Same day

**Urgent Priority**
- Critical issues blocking all work
- Security breaches
- Response time: Within 2 hours

Choose the appropriate priority when creating your ticket to help us serve you better.`,
        keywords: [
          "priority",
          "urgent",
          "high",
          "medium",
          "low",
          "response time",
        ],
        category: "general",
        createdBy: users[2].id, // Support Agent
        helpfulCount: 8,
      },
      {
        title: "Billing and Payment Information",
        content: `For billing and payment questions:

**Payment Methods**
- Credit cards (Visa, MasterCard, American Express)
- PayPal
- Bank transfers (for enterprise accounts)

**Billing Cycle**
- Monthly subscriptions renew on the same date each month
- Annual subscriptions renew on the anniversary date
- You'll receive an email 7 days before renewal

**Payment Issues**
- If your payment fails, you have 3 days to update your payment method
- Your account will be suspended after 7 days of failed payment
- Contact billing support for payment disputes

**Refunds**
- 30-day money-back guarantee for new subscriptions
- Prorated refunds for annual plans (contact support)
- No refunds for monthly plans after 7 days`,
        keywords: [
          "billing",
          "payment",
          "refund",
          "subscription",
          "credit card",
        ],
        category: "billing",
        createdBy: users[3].id, // Admin User
        helpfulCount: 12,
      },
    ]);

    console.log("✅ Created knowledge articles:", knowledgeArticles.length);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Login Credentials:");
    console.log("Users:");
    console.log("- john@example.com / password123 (User)");
    console.log("- jane@example.com / password123 (User)");
    console.log("Agents:");
    console.log("- agent@example.com / password123 (Agent)");
    console.log("- admin@example.com / password123 (Agent)");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
};

// Run the seed function
seedData()
  .then(() => {
    console.log("✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
