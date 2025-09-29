// Agent Dashboard - Main page for support agents to manage tickets
import {
  Assignment,
  Edit,
  FilterList,
  Person,
  Refresh,
  Schedule,
  Search,
  Visibility,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { ticketsAPI } from '../services/api';

// Skeleton loading component
const LoadingSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton variant="text" /></TableCell>
    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
    <TableCell><Skeleton variant="text" width="30%" /></TableCell>
    <TableCell><Skeleton variant="text" width="30%" /></TableCell>
    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={80} height={36} /></TableCell>
  </TableRow>
);

const AgentDashboard = () => {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const navigate = useNavigate();

  // State management
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch tickets from API
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ticketsAPI.getTickets();
      setTickets(response.data || []);
    } catch (err) {
      setError('Failed to load tickets. Please try again later.');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tickets on component mount
  useEffect(() => {
    if (isAgent()) {
      loadTickets();
    }
  }, [isAgent, loadTickets]);

  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await ticketsAPI.updateTicket(ticketId, { status: newStatus });
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
    } catch (err) {
      setError('Failed to update ticket status');
      console.error('Error updating ticket:', err);
    }
  };

  // Handle quick reply
  const handleQuickReply = async (ticketId, message) => {
    if (!message?.trim()) return;

    try {
      await ticketsAPI.addComment(ticketId, { content: message });
      await loadTickets();
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  // Filter tickets based on current filters
  const filteredTickets = useMemo(() =>
    tickets.filter(ticket => {
      const matchesStatus = !filters.status || ticket.status === filters.status;
      const matchesPriority = !filters.priority || ticket.priority === filters.priority;
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = !filters.search ||
        ticket.subject?.toLowerCase().includes(searchTerm) ||
        ticket.title?.toLowerCase().includes(searchTerm) ||
        ticket.description?.toLowerCase().includes(searchTerm) ||
        ticket.user?.name?.toLowerCase().includes(searchTerm);

      return matchesStatus && matchesPriority && matchesSearch;
    }),
    [tickets, filters]
  );

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status color for UI chips
  const getStatusColor = (status) => {
    const statusColors = {
      open: 'error',
      in_progress: 'warning',
      closed: 'success',
      resolved: 'success',
    };
    return statusColors[status] || 'default';
  };

  // Get priority color for UI chips
  const getPriorityColor = (priority) => {
    const priorityColors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error',
    };
    return priorityColors[priority] || 'default';
  };

  // Calculate ticket statistics
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  }), [tickets]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setPage(0); // Reset to first page when filters change
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      search: '',
    });
    setPage(0);
  };

  // Handle refresh action
  const handleRefresh = () => {
    loadTickets();
  };

  // Handle quick reply prompt
  const promptQuickReply = (ticketId) => {
    const message = prompt('Enter your response:');
    if (message) {
      handleQuickReply(ticketId, message);
    }
  };

  // Redirect if not an agent
  if (!isAgent()) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Agent Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Welcome back, {user?.name || 'Agent'}! Manage support tickets
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={() => navigate('/tickets/new')}
          >
            New Ticket
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6">{stats.open}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'warning.main',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6">{stats.inProgress}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6">{stats.resolved}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'error.dark',
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="h6">{stats.urgent}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Urgent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search tickets"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              placeholder="Search by title, description, or user..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
              sx={{ height: '56px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tickets Table */}
      <Paper elevation={2}>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
            All Tickets ({filteredTickets.length})
          </Typography>
          <TablePagination
            component="div"
            count={filteredTickets.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows:"
            sx={{ width: 'auto', m: 0 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill().map((_, index) => <LoadingSkeleton key={index} />)
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {tickets.length === 0
                        ? 'No tickets found'
                        : 'No tickets match your filters'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {ticket.subject || ticket.title || 'No Title'}
                        </Typography>
                        {ticket.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {ticket.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Person sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {ticket.user?.name || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status?.replace('_', ' ') || 'Unknown'}
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.priority || 'Unknown'}
                          color={getPriorityColor(ticket.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Schedule sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {ticket.createdAt
                              ? new Date(ticket.createdAt).toLocaleDateString()
                              : 'Unknown'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/tickets/${ticket.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                            <>
                              <Tooltip title="Quick Reply">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => promptQuickReply(ticket.id)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>

                              {ticket.status === 'open' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                >
                                  Start
                                </Button>
                              )}

                              {ticket.status === 'in_progress' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                >
                                  Resolve
                                </Button>
                              )}
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AgentDashboard;
