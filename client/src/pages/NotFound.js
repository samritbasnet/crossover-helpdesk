// 404 Not Found Page
import { Home, Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === USER_ROLES.AGENT || user.role === USER_ROLES.ADMIN) {
      navigate('/agent-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 8,
        }}
      >
        {/* Large 404 */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '6rem', md: '8rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>

        {/* Error Message */}
        <Typography variant="h4" component="h1" gutterBottom color="text.primary">
          Page Not Found
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600 }}
        >
          Sorry, the page you're looking for doesn't exist. It might have been moved, 
          deleted, or you entered the wrong URL.
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Go to {user ? 'Dashboard' : 'Login'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Search />}
            onClick={() => navigate('/knowledge')}
          >
            Browse Help Articles
          </Button>
        </Box>

        {/* Help Text */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.50', borderRadius: 2, maxWidth: 500 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Need help?</strong> Try searching our knowledge base or contact support 
            by creating a new ticket from your dashboard.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound;
