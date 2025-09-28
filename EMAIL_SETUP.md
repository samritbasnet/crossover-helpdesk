# 📧 Email Notifications Setup Guide

This guide explains how to configure email notifications for the Crossover Helpdesk system.

## 🚀 Quick Setup

### 1. Gmail Configuration (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set Environment Variables**:
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### 2. Alternative: SendGrid (Production Recommended)

1. **Sign up for SendGrid** (free tier available)
2. **Get your API key** from SendGrid dashboard
3. **Set Environment Variables**:
   ```bash
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com
   ```

## 📋 Environment Variables

Add these to your `.env` file in the `server/` directory:

```bash
# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OR SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

## 🎯 Email Notification Types

The system sends emails for these events:

### 📝 **Ticket Created**
- **Trigger**: When a user creates a new ticket
- **Recipients**: Ticket creator
- **Content**: Ticket details, ID, priority, description

### 🔄 **Ticket Updated**
- **Trigger**: When ticket status, priority, or details change
- **Recipients**: Ticket creator
- **Content**: What changed, who made the change

### ✅ **Ticket Resolved**
- **Trigger**: When ticket status changes to "resolved"
- **Recipients**: Ticket creator
- **Content**: Resolution details, resolved by whom

### 👤 **Ticket Assigned**
- **Trigger**: When a ticket is assigned to an agent
- **Recipients**: Both ticket creator and assigned agent
- **Content**: Assignment details, agent information

## ⚙️ User Preferences

Users can control their email notifications through the Settings page:

- **🔔 All Notifications**: Receive all email types
- **⚡ Important Only**: Only resolved and assignment notifications
- **🔕 No Notifications**: Disable all email notifications

## 🛠️ Development & Testing

### Local Testing
```bash
# Start the server with email configuration
cd server
npm install
# Add your email credentials to .env
npm run dev
```

### Testing Email Templates
The system will log email attempts to the console when EMAIL_USER/EMAIL_PASS are not configured, allowing you to test the flow without sending actual emails.

## 🚀 Production Deployment

### Render.com Setup
1. Go to your Render service dashboard
2. Add environment variables:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password
3. Redeploy the service

### Netlify Setup
No additional configuration needed for the frontend.

## 🎨 Email Templates

The system includes beautiful HTML email templates with:
- Professional styling and branding
- Responsive design for mobile devices
- Color-coded priority and status indicators
- Clear call-to-action sections

## 🔧 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Ensure 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check EMAIL_USER and EMAIL_PASS are correct

2. **"No response from server"**
   - Verify environment variables are set
   - Check server logs for detailed error messages

3. **Emails not sending**
   - Check console logs for email service status
   - Verify recipient email addresses are valid
   - Ensure user email preferences allow notifications

### Debug Mode
Set `LOG_LEVEL=debug` in your environment to see detailed email logs.

## 📊 Email Analytics

The system logs all email attempts with:
- Timestamp
- Recipient
- Email type
- Success/failure status
- Error details (if any)

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use App Passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor email logs** for suspicious activity
5. **Use SendGrid** for production environments

## 🎉 Features

- ✅ Beautiful HTML email templates
- ✅ User preference management
- ✅ Multiple email provider support
- ✅ Graceful fallback when email is disabled
- ✅ Comprehensive logging
- ✅ Mobile-responsive design
- ✅ Professional branding

## 📞 Support

If you encounter issues with email setup:
1. Check the server logs for detailed error messages
2. Verify your email provider settings
3. Test with a simple email first
4. Review the troubleshooting section above

---

**Note**: Email notifications are optional. The system works perfectly without email configuration - notifications will simply be logged to the console instead of being sent.
