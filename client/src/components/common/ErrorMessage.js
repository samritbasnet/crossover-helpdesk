// Reusable error message component
import { Alert, AlertTitle } from '@mui/material';
import React from 'react';

const ErrorMessage = ({ 
  error, 
  title = 'Error', 
  severity = 'error', 
  sx = {} 
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unexpected error occurred';

  return (
    <Alert severity={severity} sx={{ mb: 2, ...sx }}>
      <AlertTitle>{title}</AlertTitle>
      {errorMessage}
    </Alert>
  );
};

export default ErrorMessage;
