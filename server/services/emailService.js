// services/emailService.js - Email notification service
const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For Gmail (you can also use SendGrid, Mailgun, etc.)
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
  });
};

// Email templates
const emailTemplates = {
  ticketCreated: (ticket, user) => ({
    subject: `New Ticket Created: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">New Support Ticket Created</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)}">${ticket.priority.toUpperCase()}</span></p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Created by:</strong> ${user.name} (${user.email})</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h4>Description:</h4>
          <p>${ticket.description}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">
          This ticket has been automatically assigned and will be reviewed by our support team.
        </p>
      </div>
    `
  }),

  ticketUpdated: (ticket, user, updatedBy, changes) => ({
    subject: `Ticket Updated: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Ticket Update Notification</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(ticket.status)}">${ticket.status.toUpperCase()}</span></p>
          <p><strong>Updated by:</strong> ${updatedBy.name} (${updatedBy.role})</p>
        </div>
        ${changes ? `
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
          <h4>Changes Made:</h4>
          <ul>
            ${changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        <p style="margin-top: 20px; color: #666;">
          You can view the full ticket details in your dashboard.
        </p>
      </div>
    `
  }),

  ticketResolved: (ticket, user, resolvedBy, resolutionNotes) => ({
    subject: `Ticket Resolved: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Ticket Resolved! 🎉</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Status:</strong> <span style="color: #4CAF50">RESOLVED</span></p>
          <p><strong>Resolved by:</strong> ${resolvedBy.name}</p>
        </div>
        ${resolutionNotes ? `
        <div style="background: #e8f5e8; padding: 20px; border: 1px solid #4CAF50; border-radius: 8px; margin: 20px 0;">
          <h4>Resolution Notes:</h4>
          <p>${resolutionNotes}</p>
        </div>
        ` : ''}
        <p style="margin-top: 20px; color: #666;">
          If you have any questions about this resolution, please don't hesitate to create a new ticket.
        </p>
      </div>
    `
  }),

  ticketAssigned: (ticket, user, assignedAgent) => ({
    subject: `Ticket Assigned: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Ticket Assigned</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Assigned to:</strong> ${assignedAgent.name}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">
          Your ticket has been assigned to a support agent and will be addressed soon.
        </p>
      </div>
    `
  })
};

// Helper functions for colors
const getPriorityColor = (priority) => {
  const colors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    urgent: '#E91E63'
  };
  return colors[priority] || '#666';
};

const getStatusColor = (status) => {
  const colors = {
    open: '#2196F3',
    'in-progress': '#FF9800',
    resolved: '#4CAF50',
    closed: '#666'
  };
  return colors[status] || '#666';
};

// Check user email preferences
const shouldSendEmail = (userPreference, emailType) => {
  if (userPreference === 'none') return false;
  if (userPreference === 'important') {
    // Only send important emails (resolved, assigned)
    return ['resolved', 'assigned'].includes(emailType);
  }
  return true; // 'all' preference
};

// Main email sending functions
const sendEmail = async (to, subject, html, emailType = 'general', userPreference = 'all') => {
  try {
    // Check user preferences first
    if (!shouldSendEmail(userPreference, emailType)) {
      console.log(`📧 Email skipped due to user preference (${userPreference}) for ${emailType} to:`, to);
      return { success: true, message: 'Email skipped due to user preference' };
    }

    // Skip sending emails if not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured, skipping notification to:', to);
      console.log('Subject:', subject);
      return { success: true, message: 'Email service not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Crossover Helpdesk" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully to:', to);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('📧 Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Notification functions
const notifyTicketCreated = async (ticket, user) => {
  const template = emailTemplates.ticketCreated(ticket, user);
  return await sendEmail(user.email, template.subject, template.html, 'created', user.email_notifications);
};

const notifyTicketUpdated = async (ticket, user, updatedBy, changes = null) => {
  const template = emailTemplates.ticketUpdated(ticket, user, updatedBy, changes);
  return await sendEmail(user.email, template.subject, template.html, 'updated', user.email_notifications);
};

const notifyTicketResolved = async (ticket, user, resolvedBy, resolutionNotes = null) => {
  const template = emailTemplates.ticketResolved(ticket, user, resolvedBy, resolutionNotes);
  return await sendEmail(user.email, template.subject, template.html, 'resolved', user.email_notifications);
};

const notifyTicketAssigned = async (ticket, user, assignedAgent) => {
  const template = emailTemplates.ticketAssigned(ticket, user, assignedAgent);
  return await sendEmail(user.email, template.subject, template.html, 'assigned', user.email_notifications);
};

// Notify agent about new ticket assignment
const notifyAgentAssigned = async (ticket, user, agent) => {
  const template = {
    subject: `New Ticket Assigned: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">New Ticket Assignment</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Ticket Details:</h3>
          <p><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)}">${ticket.priority.toUpperCase()}</span></p>
          <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h4>Description:</h4>
          <p>${ticket.description}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">
          Please review and respond to this ticket at your earliest convenience.
        </p>
      </div>
    `
  };
  
  return await sendEmail(agent.email, template.subject, template.html);
};

module.exports = {
  sendEmail,
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketResolved,
  notifyTicketAssigned,
  notifyAgentAssigned
};
