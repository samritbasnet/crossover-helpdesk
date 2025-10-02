// Agent Dashboard - Ticket management for support agents
import {
  Assignment,
  AssignmentInd,
  CheckCircle,
  Edit,
  MoreVert,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
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
  TextField,
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

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [stats, setStats] = useState({});
  const [myTickets, setMyTickets] = useState([]);
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    resolution_notes: "",
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, myTicketsResponse, unassignedResponse] =
        await Promise.all([
          ticketsAPI.getDashboardStats(),
          ticketsAPI.getTickets({ assigned: true }),
          ticketsAPI.getTickets({ assigned: false }),
        ]);

      setStats(statsResponse.data.stats);

      // Filter out resolved tickets from main table
      const activeTickets = (myTicketsResponse.data.tickets || []).filter(
        (ticket) => ticket.status !== "resolved" && ticket.status !== "closed"
      );
      setMyTickets(activeTickets);

      // Get resolved tickets for history
      const resolvedTickets = (myTicketsResponse.data.tickets || []).filter(
        (ticket) => ticket.status === "resolved" || ticket.status === "closed"
      );
      setResolvedTickets(resolvedTickets);

      setUnassignedTickets(unassignedResponse.data.tickets || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      if (!selectedTicket || !selectedTicket.id) {
        setError("No ticket selected for update");
        return;
      }

      // Validate resolution notes when resolving
      if (
        updateData.status === "resolved" &&
        !updateData.resolution_notes.trim()
      ) {
        setError("Resolution notes are required when resolving a ticket");
        return;
      }

      const response = await ticketsAPI.updateTicket(
        selectedTicket.id,
        updateData
      );

      // Show success message if ticket was resolved
      if (updateData.status === "resolved") {
        setSuccessMessage(
          `Thanks for fixing ${selectedTicket.user_name}'s ticket! 🎉`
        );
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      }

      setUpdateDialogOpen(false);
      setAnchorEl(null);
      setSelectedTicket(null);
      setUpdateData({ status: "", resolution_notes: "" });
      loadDashboardData(); // Refresh data
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    }
  };

  const handleTakeTicket = async (ticketId) => {
    try {
      const response = await ticketsAPI.takeTicket(ticketId);
      if (response.data.success) {
        loadDashboardData(); // Refresh data
      }
    } catch (err) {
      // Check if it's an already assigned error
      if (err.response?.data?.message?.includes("already assigned")) {
        const assignedAgentName =
          err.response?.data?.assignedToName || "another agent";
        setError(`This ticket is already taken by ${assignedAgentName}`);
      } else {
        setError(err.message || "Failed to take ticket");
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

  const openUpdateDialog = () => {
    if (!selectedTicket || !selectedTicket.id) {
      setError("No ticket selected for update");
      handleMenuClose();
      return;
    }
    setUpdateDialogOpen(true);
    setUpdateData({
      status: selectedTicket.status || "",
      resolution_notes: selectedTicket.resolution_notes || "",
    });
    // Close the menu but keep selectedTicket for the dialog
    setAnchorEl(null);
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
        Agent Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.name}
      </Typography>

      <ErrorMessage error={error} />

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="My Tickets"
            value={stats.myTickets || 0}
            icon={<Assignment fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Unassigned"
            value={stats.unassignedTickets || 0}
            icon={<AssignmentInd fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Resolved"
            value={stats.myResolvedTickets || 0}
            icon={<CheckCircle fontSize="large" />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/knowledge")}
          sx={{ mr: 2 }}
        >
          Knowledge Base
        </Button>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Focus on resolving tickets and helping users! 🎯
        </Typography>
      </Box>

      {/* My Assigned Tickets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            My Assigned Tickets
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
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myTickets.map((ticket) => (
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
                    <TableCell>{formatDateTime(ticket.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, ticket)}
                        id={`actions-menu-${ticket.id}`}
                        aria-label={`Actions menu for ticket ${ticket.id}`}
                        aria-haspopup="true"
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

      {/* Unassigned Tickets */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Unassigned Tickets
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unassignedTickets.map((ticket) => (
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
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(ticket.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleTakeTicket(ticket.id)}
                      >
                        Take Ticket
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Ticket History - Resolved Tickets */}
      {resolvedTickets.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎉 Ticket History - Resolved Tickets
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Great work! Here are the tickets you've successfully resolved.
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
                    <TableCell>Resolved</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolvedTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>
                        <Button
                          variant="text"
                          onClick={() => navigate(`/ticket/${ticket.id}`)}
                          sx={{
                            textAlign: "left",
                            p: 0,
                            textTransform: "none",
                          }}
                        >
                          <Typography variant="body2" noWrap>
                            {ticket.title}
                          </Typography>
                        </Button>
                      </TableCell>
                      <TableCell>{ticket.user_name}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<CheckCircle />}
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
                        {formatDateTime(
                          ticket.resolved_at || ticket.updated_at
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/ticket/${ticket.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Update Ticket Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => {
          setUpdateDialogOpen(false);
          setSelectedTicket(null);
          setUpdateData({ status: "", resolution_notes: "" });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Update ticket #{selectedTicket?.id || "Unknown"}:{" "}
            {selectedTicket?.title || "Unknown Ticket"}
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={updateData.status}
              onChange={(e) =>
                setUpdateData({ ...updateData, status: e.target.value })
              }
              label="Status"
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Resolution Notes"
            value={updateData.resolution_notes}
            onChange={(e) =>
              setUpdateData({ ...updateData, resolution_notes: e.target.value })
            }
            sx={{ mt: 2 }}
            placeholder="Add notes about the resolution..."
            required={updateData.status === "resolved"}
            error={
              updateData.status === "resolved" &&
              !updateData.resolution_notes.trim()
            }
            helperText={
              updateData.status === "resolved" &&
              !updateData.resolution_notes.trim()
                ? "Resolution notes are required when resolving a ticket"
                : ""
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUpdateDialogOpen(false);
              setSelectedTicket(null);
              setUpdateData({ status: "", resolution_notes: "" });
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateTicket} variant="contained">
            Update Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableAutoFocusItem
        MenuListProps={{
          "aria-labelledby": selectedTicket
            ? `actions-menu-${selectedTicket.id}`
            : "actions-menu",
        }}
      >
        <MenuItem onClick={() => navigate(`/ticket/${selectedTicket?.id}`)}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={openUpdateDialog}>
          <Edit sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgentDashboard;
