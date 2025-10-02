// Email Service - Simple email notifications
const nodemailer = require("nodemailer");

// Constants for email configuration
const EMAIL_CONFIG = {
  FROM: '"Helpdesk System" <noreply@helpdesk.com>',
  SMTP_HOST: "smtp.ethereal.email",
  SMTP_PORT: 587,
  SMTP_SECURE: false,
};

// Email template styles
const EMAIL_STYLES = {
  container:
    "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;",
  header: "color: #1976d2;",
  ticketBox:
    "background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;",
  statusResolved: "color: green;",
  statusOpen: "color: orange;",
};

// Global transporter variable
let transporter;

/**
 * Initialize the email service with test account
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const initEmailService = async () => {
  try {
    console.log("Initializing email service...");

    // Create a test account for development
    const testAccount = await nodemailer.createTestAccount();

    // Create transporter using configuration constants
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.SMTP_HOST,
      port: EMAIL_CONFIG.SMTP_PORT,
      secure: EMAIL_CONFIG.SMTP_SECURE,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("✅ Email service initialized successfully");
    console.log(`📧 Test account: ${testAccount.user}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize email service:", error.message);
    return false;
  }
};

/**
 * Validate required fields for email sending
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmailData = (data, requiredFields) => {
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  return true;
};

/**
 * Send email using the configured transporter
 * @param {Object} mailOptions - Email options object
 * @param {string} emailType - Type of email being sent (for logging)
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendEmail = async (mailOptions, emailType) => {
  try {
    if (!transporter) {
      console.log("⚠️  Email service not initialized, skipping notification");
      return false;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ ${emailType} email sent successfully`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send ${emailType} email:`, error.message);
    return false;
  }
};

/**
 * Create HTML template for ticket resolution email
 * @param {Object} ticket - Ticket object
 * @param {Object} user - User object
 * @param {Object} resolvedBy - Agent who resolved the ticket
 * @returns {string} - HTML email template
 */
const createTicketResolvedTemplate = (ticket, user, resolvedBy) => {
  const resolutionNotes = ticket.resolution_notes
    ? `<p><strong>Resolution Notes:</strong> ${ticket.resolution_notes}</p>`
    : "";

  return `
    <div style="${EMAIL_STYLES.container}">
      <h2 style="${EMAIL_STYLES.header}">Ticket Resolved</h2>
      <p>Hello ${user.name},</p>
      <p>Your ticket has been resolved by our support team.</p>

      <div style="${EMAIL_STYLES.ticketBox}">
        <h3>Ticket Details:</h3>
        <p><strong>Ticket ID:</strong> #${ticket.id}</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Status:</strong> <span style="${
          EMAIL_STYLES.statusResolved
        }">Resolved</span></p>
        <p><strong>Resolved by:</strong> ${resolvedBy.name}</p>
        <p><strong>Resolved at:</strong> ${new Date().toLocaleString()}</p>
        ${resolutionNotes}
      </div>

      <p>Thank you for using our helpdesk system!</p>
      <p>Best regards,<br>Support Team</p>
    </div>
  `;
};

/**
 * Create HTML template for ticket creation email
 * @param {Object} ticket - Ticket object
 * @param {Object} user - User object
 * @returns {string} - HTML email template
 */
const createTicketCreatedTemplate = (ticket, user) => {
  return `
    <div style="${EMAIL_STYLES.container}">
      <h2 style="${EMAIL_STYLES.header}">Ticket Created</h2>
      <p>Hello ${user.name},</p>
      <p>Your support ticket has been created successfully.</p>

      <div style="${EMAIL_STYLES.ticketBox}">
        <h3>Ticket Details:</h3>
        <p><strong>Ticket ID:</strong> #${ticket.id}</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> <span style="${
          EMAIL_STYLES.statusOpen
        }">Open</span></p>
        <p><strong>Created at:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <p>Our support team will review your ticket and get back to you soon.</p>
      <p>Thank you for using our helpdesk system!</p>
      <p>Best regards,<br>Support Team</p>
    </div>
  `;
};

/**
 * Send ticket resolution notification email
 * @param {Object} ticket - Ticket object with id, title, resolution_notes
 * @param {Object} user - User object with name, email
 * @param {Object} resolvedBy - Agent object with name
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendTicketResolvedNotification = async (ticket, user, resolvedBy) => {
  // Validate required fields
  const requiredFields = ["id", "title"];
  const userRequiredFields = ["name", "email"];
  const agentRequiredFields = ["name"];

  if (
    !validateEmailData(ticket, requiredFields) ||
    !validateEmailData(user, userRequiredFields) ||
    !validateEmailData(resolvedBy, agentRequiredFields)
  ) {
    return false;
  }

  // Create email options
  const mailOptions = {
    from: EMAIL_CONFIG.FROM,
    to: user.email,
    subject: `Ticket #${ticket.id} has been resolved`,
    html: createTicketResolvedTemplate(ticket, user, resolvedBy),
  };

  // Send email using helper function
  return await sendEmail(mailOptions, "Ticket resolution");
};

/**
 * Send ticket creation notification email
 * @param {Object} ticket - Ticket object with id, title, priority
 * @param {Object} user - User object with name, email
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const sendTicketCreatedNotification = async (ticket, user) => {
  // Validate required fields
  const requiredFields = ["id", "title", "priority"];
  const userRequiredFields = ["name", "email"];

  if (
    !validateEmailData(ticket, requiredFields) ||
    !validateEmailData(user, userRequiredFields)
  ) {
    return false;
  }

  // Create email options
  const mailOptions = {
    from: EMAIL_CONFIG.FROM,
    to: user.email,
    subject: `Ticket #${ticket.id} created successfully`,
    html: createTicketCreatedTemplate(ticket, user),
  };

  // Send email using helper function
  return await sendEmail(mailOptions, "Ticket creation");
};

// Export all functions for use in other modules
module.exports = {
  // Main email functions
  initEmailService,
  sendTicketResolvedNotification,
  sendTicketCreatedNotification,

  // Helper functions (exported for testing purposes)
  validateEmailData,
  sendEmail,
  createTicketResolvedTemplate,
  createTicketCreatedTemplate,
};
