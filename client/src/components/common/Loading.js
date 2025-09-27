// Reusable loading component
import { Box, CircularProgress, Typography } from '@mui/material';
import React from 'react';

const Loading = ({ message = 'Loading...', size = 40, minHeight = '400px' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
