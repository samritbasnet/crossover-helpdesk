// Reusable ticket card component
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getPriorityColor, getStatusColor, truncateText } from '../../utils/helpers';

const TicketCard = ({ ticket, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(ticket);
    } else {
      navigate(`/ticket/${ticket.id}`);
    }
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
        height: '100%',
      }}
      onClick={handleClick}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="h6" component="h3" noWrap sx={{ flex: 1, mr: 1 }}>
            {ticket.title}
          </Typography>
          <Box display="flex" gap={1} flexShrink={0}>
            <Chip
              label={ticket.status}
              color={getStatusColor(ticket.status)}
              size="small"
            />
            <Chip
              label={ticket.priority}
              color={getPriorityColor(ticket.priority)}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {truncateText(ticket.description, 120)}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(ticket.created_at)}
          </Typography>
          {ticket.user_name && (
            <Typography variant="caption" color="text.secondary">
              By: {ticket.user_name}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TicketCard;
