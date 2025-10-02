// Email Service - Simple email notifications
const nodemailer = require("nodemailer");

// Create a test account for development
let transporter;

const initEmailService = async () => {
  try {
    // Create a test account for development
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log(
      "Email service initialized with test account:",
      testAccount.user
    );
    return true;
  } catch (error) {
    console.error("Failed to initialize email service:", error);
    return false;
  }
};

// Send ticket resolution notification
const sendTicketResolvedNotification = async (ticket, user, resolvedBy) => {
  try {
    if (!transporter) {
      console.log("Email service not initialized, skipping notification");
      return false;
    }

    const mailOptions = {
      from: '"Helpdesk System" <noreply@helpdesk.com>',
      to: user.email,
      subject: `Ticket #${ticket.id} has been resolved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Ticket Resolved</h2>
          <p>Hello ${user.name},</p>
          <p>Your ticket has been resolved by our support team.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> #${ticket.id}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Status:</strong> <span style="color: green;">Resolved</span></p>
            <p><strong>Resolved by:</strong> ${resolvedBy.name}</p>
            <p><strong>Resolved at:</strong> ${new Date().toLocaleString()}</p>
            ${
              ticket.resolution_notes
                ? `<p><strong>Resolution Notes:</strong> ${ticket.resolution_notes}</p>`
                : ""
            }
          </div>

          <p>Thank you for using our helpdesk system!</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Ticket resolution email sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("Failed to send ticket resolution email:", error);
    return false;
  }
};

// Send ticket creation notification
const sendTicketCreatedNotification = async (ticket, user) => {
  try {
    if (!transporter) {
      console.log("Email service not initialized, skipping notification");
      return false;
    }

    const mailOptions = {
      from: '"Helpdesk System" <noreply@helpdesk.com>',
      to: user.email,
      subject: `Ticket #${ticket.id} created successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Ticket Created</h2>
          <p>Hello ${user.name},</p>
          <p>Your support ticket has been created successfully.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Ticket Details:</h3>
            <p><strong>Ticket ID:</strong> #${ticket.id}</p>
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Status:</strong> <span style="color: orange;">Open</span></p>
            <p><strong>Created at:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>Our support team will review your ticket and get back to you soon.</p>
          <p>Thank you for using our helpdesk system!</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Ticket creation email sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("Failed to send ticket creation email:", error);
    return false;
  }
};

module.exports = {
  initEmailService,
  sendTicketResolvedNotification,
  sendTicketCreatedNotification,
};
