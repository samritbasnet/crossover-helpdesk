// Network error handler component
import { Refresh, Wifi } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
} from '@mui/material';
import React from 'react';

const NetworkError = ({ 
  onRetry, 
  title = 'Connection Error',
  message = 'Unable to connect to the server. Please check your internet connection and try again.',
  showRetry = true 
}) => {
  return (
    <Alert 
      severity="error" 
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': { width: '100%' }
      }}
    >
      <AlertTitle>{title}</AlertTitle>
      
      <Box display="flex" alignItems="center" mb={2}>
        <Wifi sx={{ mr: 1, color: 'error.main' }} />
        <Typography variant="body2">
          {message}
        </Typography>
      </Box>

      {showRetry && onRetry && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={onRetry}
          sx={{ mt: 1 }}
        >
          Try Again
        </Button>
      )}
    </Alert>
  );
};

export default NetworkError;
