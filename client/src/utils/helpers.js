// Utility functions for common operations

// Format date consistently across the app
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get status color for tickets
export const getStatusColor = (status) => {
  const colors = {
    open: 'default',
    'in-progress': 'warning',
    resolved: 'success',
    closed: 'secondary',
  };
  return colors[status] || 'default';
};

// Get priority color for tickets
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    urgent: 'error',
  };
  return colors[priority] || 'default';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Handle API errors consistently
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Check if user has permission
export const hasPermission = (user, requiredRole) => {
  const roleHierarchy = { user: 1, agent: 2, admin: 3 };
  return roleHierarchy[user?.role] >= roleHierarchy[requiredRole];
};
