import {
  ArrowBack,
  Assignment,
  CheckCircle,
  Edit,
  Person,
  Schedule,
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
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ticketsAPI } from "../../services/api";
import {
  formatDateTime,
  getPriorityColor,
  getStatusColor,
} from "../../utils/helpers";
import ErrorMessage from "../common/ErrorMessage";
import Loading from "../common/Loading";

const TicketDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [updateData, setUpdateData] = useState({
    status: "",
    priority: "",
    resolution_notes: "",
  });
  const [assignData, setAssignData] = useState({
    assignedTo: "",
  });

  useEffect(() => {
    loadTicketDetails();
    loadAgents();
  }, [loadTicketDetails]);

  const loadTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTicket(id);
      setTicket(response.data.ticket);
      setUpdateData({
        status: response.data.ticket.status,
        priority: response.data.ticket.priority,
        resolution_notes: response.data.ticket.resolution_notes || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAgents = async () => {
    try {
      const response = await ticketsAPI.getAgents();
      setAgents(response.data.agents);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      await ticketsAPI.updateTicket(id, updateData);
      setUpdateDialogOpen(false);
      loadTicketDetails(); // Refresh ticket details
    } catch (err) {
      setError(err.message || "Failed to update ticket");
    }
  };

  const handleAssignTicket = async () => {
    try {
      await ticketsAPI.assignTicket(id, assignData.assignedTo);
      setAssignDialogOpen(false);
      loadTicketDetails(); // Refresh ticket details
    } catch (err) {
      setError(err.message || "Failed to assign ticket");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Box p={3}>
        <ErrorMessage error={error} />
        <Button
          onClick={() => navigate("/dashboard")}
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box p={3}>
        <Typography variant="h6">Ticket not found</Typography>
        <Button
          onClick={() => navigate("/dashboard")}
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Ticket #{ticket.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Ticket Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {ticket.title}
              </Typography>

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={ticket.status}
                  color={getStatusColor(ticket.status)}
                  size="small"
                />
                <Chip
                  label={ticket.priority}
                  color={getPriorityColor(ticket.priority)}
                  size="small"
                />
                {ticket.category && (
                  <Chip
                    label={ticket.category}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              <Typography variant="body1" paragraph>
                {ticket.description}
              </Typography>

              {ticket.resolution_notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Resolution Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2">
                      {ticket.resolution_notes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ticket Info & Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ticket Information
              </Typography>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  <Person sx={{ mr: 1, verticalAlign: "middle" }} />
                  Created by: {ticket.user_name}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                  Created: {formatDateTime(ticket.created_at)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  <Assignment sx={{ mr: 1, verticalAlign: "middle" }} />
                  Assigned to: {ticket.assigned_to_name || "Unassigned"}
                </Typography>
              </Box>

              {ticket.resolved_at && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <CheckCircle sx={{ mr: 1, verticalAlign: "middle" }} />
                    Resolved: {formatDateTime(ticket.resolved_at)}
                  </Typography>
                </Box>
              )}

              {/* Action Buttons */}
              <Box mt={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Edit />}
                  onClick={() => setUpdateDialogOpen(true)}
                  sx={{ mb: 1 }}
                >
                  Update Ticket
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Assignment />}
                  onClick={() => setAssignDialogOpen(true)}
                >
                  Assign Ticket
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Update Ticket Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Ticket #{ticket.id}</DialogTitle>
        <DialogContent>
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
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={updateData.priority}
              onChange={(e) =>
                setUpdateData({ ...updateData, priority: e.target.value })
              }
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateTicket} variant="contained">
            Update Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Ticket #{ticket.id}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign to Agent</InputLabel>
            <Select
              value={assignData.assignedTo}
              onChange={(e) =>
                setAssignData({ ...assignData, assignedTo: e.target.value })
              }
              label="Assign to Agent"
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
            Assign Ticket
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketDetailsView;
