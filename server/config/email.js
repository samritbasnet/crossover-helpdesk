const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('express-handlebars');
require('dotenv').config();

console.log('Email configuration loading...');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Create a test account for development
async function createTestAccount() {
  if (process.env.NODE_ENV === 'production') return null;
  
  try {
    console.log('Creating test email account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test account created:', testAccount.user);
    return testAccount;
  } catch (error) {
    console.error('Failed to create test account:', error);
    return null;
  }
}

// Create transport with test account or production settings
async function createTransport() {
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await createTestAccount();
    if (testAccount) {
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        logger: true,
        debug: true
      });
    }
  }

  // Production transport
  console.log('Using production email settings');
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    logger: true,
    debug: process.env.NODE_ENV === 'development'
  });
}

// Initialize transport
let transporter;
createTransport().then(transport => {
  transporter = transport;
  return transporter.verify();
}).then(() => {
  console.log('SMTP Server is ready to take our messages');
}).catch(error => {
  console.error('Failed to initialize email transport:', error);
});

// Configure Handlebars
const hbs = handlebars.create({
  extname: '.handlebars',
  defaultLayout: false,
  partialsDir: [path.resolve('./server/views/emails/partials/')]
});

const sendTicketResolvedEmail = async (to, ticket) => {
  try {
    if (!to) {
      throw new Error('No recipient email address provided');
    }

    console.log(`\n=== Preparing to send resolution email ===`);
    console.log(`Ticket #${ticket.id} to ${to}`);
    console.log(`Resolution notes: ${ticket.resolution_notes || 'None'}`);
    
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    // Read the template file
    const templatePath = path.join(__dirname, '../views/emails/ticketResolved.handlebars');
    console.log(`Reading template from: ${templatePath}`);
    
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Compile the template
    const template = hbs.handlebars.compile(templateContent);
    console.log('Template compiled successfully');
    
    // Render the template with data
    const emailData = {
      ticketId: ticket.id,
      title: ticket.title,
      resolutionNotes: ticket.resolution_notes || 'No resolution notes provided.',
      resolvedAt: new Date().toLocaleString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@crossoverhelpdesk.com'
    };
    
    console.log('Rendering email with data:', JSON.stringify(emailData, null, 2));
    const html = template(emailData);

    const mailOptions = {
      from: `"Crossover Helpdesk" <${process.env.EMAIL_FROM || 'noreply@crossoverhelpdesk.com'}>`,
      to,
      subject: `[Ticket #${ticket.id}] Your support ticket has been resolved`,
      html: html,
      headers: {
        'X-Ticket-ID': ticket.id,
        'X-Notification-Type': 'ticket-resolved'
      }
    };

    console.log('\nSending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!html
    });

    console.log('Using transporter:', {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      user: transporter.options.auth.user
    });

    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ Message sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A (not using Ethereal in production)');
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendTicketResolvedEmail
};
