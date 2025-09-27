// Reusable empty state component
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  iconSize = 64 
}) => {
  return (
    <Card>
      <CardContent>
        <Box textAlign="center" py={4}>
          {Icon && (
            <Icon 
              sx={{ 
                fontSize: iconSize, 
                color: 'text.secondary', 
                mb: 2 
              }} 
            />
          )}
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" mb={3}>
              {description}
            </Typography>
          )}
          {actionLabel && onAction && (
            <Button
              variant="contained"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
