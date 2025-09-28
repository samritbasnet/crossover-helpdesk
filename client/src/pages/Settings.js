// pages/Settings.js - User settings page
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import EmailPreferences from '../components/User/EmailPreferences';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account preferences and notifications
        </Typography>
      </Box>

      {/* User Info */}
      <Box 
        sx={{ 
          background: 'white', 
          borderRadius: 2, 
          p: 3, 
          mb: 3,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          👤 Account Information
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography><strong>Name:</strong> {user?.name}</Typography>
          <Typography><strong>Email:</strong> {user?.email}</Typography>
          <Typography><strong>Role:</strong> {user?.role}</Typography>
        </Box>
      </Box>

      {/* Email Preferences */}
      <EmailPreferences />

      {/* Future settings can be added here */}
      <Box 
        sx={{ 
          background: '#f5f5f5', 
          borderRadius: 2, 
          p: 3, 
          textAlign: 'center',
          color: '#666'
        }}
      >
        <Typography variant="body2">
          More settings coming soon! 🚀
        </Typography>
      </Box>
    </Container>
  );
};

export default Settings;
