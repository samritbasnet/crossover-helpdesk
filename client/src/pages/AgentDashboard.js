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
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../services/api";

const AgentDashboard = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();

  // State for tickets and UI
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for filters
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });

  // Load all tickets for agents
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTickets();
      // Handle the response structure from our backend
      // Backend returns: { success: true, data: { tickets: [...], total: X, page: Y, totalPages: Z } }
      setTickets(response.data?.tickets || []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on current filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = !filters.status || ticket.status === filters.status;
    const matchesPriority =
      !filters.priority || ticket.priority === filters.priority;
    const matchesSearch =
      !filters.search ||
      ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.user?.name.toLowerCase().includes(filters.search.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "error";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "urgent":
        return "error";
      default:
        return "default";
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      search: "",
    });
  };

  // Get ticket statistics
  const getStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    };
  };

  const stats = getStats();

  // Redirect if not an agent
  if (!isAgent()) {
    navigate("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
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
            Welcome back, {user?.name}! Manage support tickets
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadTickets}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tickets
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
                    borderRadius: "50%",
                    backgroundColor: "error.main",
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
                    borderRadius: "50%",
                    backgroundColor: "warning.main",
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
                    borderRadius: "50%",
                    backgroundColor: "success.main",
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
                    borderRadius: "50%",
                    backgroundColor: "error.dark",
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

      {/* Filters */}
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
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
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
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange("priority", e.target.value)}
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
              sx={{ height: "56px" }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets Table */}
      <Paper elevation={2}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            All Tickets ({filteredTickets.length})
          </Typography>
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
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {tickets.length === 0
                        ? "No tickets found"
                        : "No tickets match your filters"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {ticket.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {ticket.user?.name || "Unknown"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Schedule sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/ticket/${ticket.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(`/agent/ticket/${ticket.id}/update`)
                            }
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
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
