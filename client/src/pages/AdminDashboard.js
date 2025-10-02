// Admin Dashboard - Full system overview and management
import {
  Assignment,
  AssignmentInd,
  Delete,
  Edit,
  Group,
  MoreVert,
  Person,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/common/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../services/api";
import {
  formatDateTime,
  getPriorityColor,
  getStatusColor,
} from "../utils/helpers";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState({});
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ticketsResponse, agentsResponse] =
        await Promise.all([
          ticketsAPI.getDashboardStats(),
          ticketsAPI.getTickets(),
          ticketsAPI.getAgents(),
        ]);

      setStats(statsResponse.data.stats);
      setTickets(ticketsResponse.data.tickets || []);
      setAgents(agentsResponse.data.agents || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    try {
      await ticketsAPI.assignTicket(selectedTicket.id, selectedAgent);
      setAssignDialogOpen(false);
      setAnchorEl(null);
      setSelectedTicket(null);
      setSelectedAgent("");
      loadDashboardData(); // Refresh data
    } catch (err) {
      setError(err.message || "Failed to assign ticket");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await ticketsAPI.deleteTicket(ticketId);
        loadDashboardData(); // Refresh data
      } catch (err) {
        setError(err.message || "Failed to delete ticket");
      }
    }
  };

  const handleMenuClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTicket(null);
  };

  const openAssignDialog = () => {
    setAssignDialogOpen(true);
    setSelectedAgent(selectedTicket?.assigned_to || "");
    handleMenuClose();
  };

  // Statistics cards
  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      <ErrorMessage error={error} />

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Tickets"
            value={stats.totalTickets || 0}
            icon={<Assignment fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Open Tickets"
            value={stats.openTickets || 0}
            icon={<TrendingUp fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="In Progress"
            value={stats.inProgressTickets || 0}
            icon={<AssignmentInd fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Resolved"
            value={stats.resolvedTickets || 0}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon={<Person fontSize="large" />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Agents"
            value={stats.totalAgents || 0}
            icon={<Group fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/admin/users")}
          sx={{ mr: 2 }}
        >
          Manage Users
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/admin/agents")}
          sx={{ mr: 2 }}
        >
          Manage Agents
        </Button>
        <Button variant="outlined" onClick={() => navigate("/knowledge")}>
          Knowledge Base
        </Button>
        <Button variant="contained" onClick={() => navigate("/create-ticket")}>
          Create Ticket
        </Button>
      </Box>

      {/* All Tickets Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Tickets
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell>
                      <Button
                        variant="text"
                        onClick={() => navigate(`/ticket/${ticket.id}`)}
                        sx={{ textAlign: "left", p: 0, textTransform: "none" }}
                      >
                        <Typography variant="body2" noWrap>
                          {ticket.title}
                        </Typography>
                      </Button>
                    </TableCell>
                    <TableCell>{ticket.user_name}</TableCell>
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
                      />
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_to_name || "Unassigned"}
                    </TableCell>
                    <TableCell>{formatDateTime(ticket.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, ticket)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
      >
        <DialogTitle>Assign Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Assign ticket #{selectedTicket?.id}: {selectedTicket?.title}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              label="Select Agent"
            >
              <MenuItem value="">Unassigned</MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignTicket} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/ticket/${selectedTicket?.id}`)}>
          <Edit sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={openAssignDialog}>
          <AssignmentInd sx={{ mr: 1 }} />
          Assign Ticket
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteTicket(selectedTicket?.id)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete Ticket
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminDashboard;
