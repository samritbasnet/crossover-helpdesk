// Reusable statistics card component
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import React from 'react';

const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = 'primary',
  onClick 
}) => {
  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 3 } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center">
          {Icon && <Icon color={color} sx={{ mr: 2, fontSize: 32 }} />}
          <Box>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
