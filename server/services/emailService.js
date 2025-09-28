// services/emailService.js - Email notification service
const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Email configuration
const createTransporter = () => {
  if (!isEmailConfigured) {
    console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env to enable email notifications.');
    return null;
  }
  
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

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
  if (!isEmailConfigured) {
    console.warn('Email service not configured. Email not sent to:', to);
    return { success: false, message: 'Email service not configured' };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email transporter not initialized');
    return { success: false, message: 'Email service not available' };
  }

  try {
    const mailOptions = {
      from: `"Helpdesk System" <${process.env.EMAIL_USER}>`,
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
  return await sendEmail(
    user.email, 
    template.subject, 
    template.html, 
    'created', 
    user.email_notifications
  );
};

const notifyTicketUpdated = async (ticket, user, updatedBy, changes = null) => {
  const template = emailTemplates.ticketUpdated(ticket, user, updatedBy, changes);
  return await sendEmail(
    user.email, 
    template.subject, 
    template.html, 
    'updated', 
    user.email_notifications
  );
};

const notifyTicketResolved = async (ticket, user, resolvedBy, resolutionNotes = null) => {
  const template = emailTemplates.ticketResolved(ticket, user, resolvedBy, resolutionNotes);
  return await sendEmail(
    user.email,
    template.subject,
    template.html,
    'resolved',
    user.email_notifications
  );
};

const notifyTicketAssigned = async (ticket, user, assignedAgent) => {
  const template = emailTemplates.ticketAssigned(ticket, user, assignedAgent);
  return await sendEmail(
    user.email, 
    template.subject, 
    template.html, 
    'assigned', 
    user.email_notifications
  );
};

const notifyAgentAssigned = async (ticket, agent, assignedBy) => {
  // Check if agent has email notifications enabled
  if (agent.email_notifications === 'none') {
    console.log(`Skipping agent notification - email notifications disabled for agent ${agent.id}`);
    return { success: true, skipped: true };
  }

  const template = emailTemplates.ticketAssigned(ticket, agent, assignedBy);
  
  // Add assignment note
  const assignmentNote = `This ticket has been assigned to you by ${assignedBy.name} (${assignedBy.role}).`;
  template.html = template.html.replace(
    'Your ticket has been assigned',
    `${assignmentNote}<br><br>Ticket details:`
  );

  return await sendEmail(
    agent.email, 
    `[Agent] ${template.subject}`,
    template.html,
    'assigned',
    agent.email_notifications
  );
};

module.exports = {
  sendEmail,
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyTicketResolved,
  notifyTicketAssigned,
  notifyAgentAssigned
};
