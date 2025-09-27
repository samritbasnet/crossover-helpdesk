// User Dashboard - Main page for regular users
import { Add, Support } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";
import StatsCard from "../components/common/StatsCard";
import TicketCard from "../components/common/TicketCard";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user's tickets
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ticketsAPI.getTickets();
      // Backend returns: { success: true, tickets: [...], pagination: {...}, stats: {...} }
      setTickets(response.tickets || []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Loading message="Loading your tickets..." />
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
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your support tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/create-ticket")}
          size="large"
        >
          New Ticket
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={Support}
            title="Total Tickets"
            value={tickets.length}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={Support}
            title="Open Tickets"
            value={tickets.filter((t) => t.status === "open").length}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={Support}
            title="In Progress"
            value={tickets.filter((t) => t.status === "in-progress").length}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={Support}
            title="Resolved"
            value={tickets.filter((t) => t.status === "resolved").length}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Recent Tickets */}
      <Typography variant="h5" component="h2" gutterBottom>
        Your Recent Tickets
      </Typography>

      <ErrorMessage error={error} />

      {tickets.length === 0 ? (
        <EmptyState
          icon={Support}
          title="No tickets yet"
          description="Create your first support ticket to get started"
          actionLabel="Create Ticket"
          onAction={() => navigate("/create-ticket")}
        />
      ) : (
        <Grid container spacing={2}>
          {tickets.slice(0, 6).map((ticket) => (
            <Grid item xs={12} md={6} key={ticket.id}>
              <TicketCard ticket={ticket} />
            </Grid>
          ))}
        </Grid>
      )}

      {tickets.length > 6 && (
        <Box textAlign="center" mt={3}>
          <Button variant="outlined" onClick={() => navigate("/tickets")}>
            View All Tickets
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default UserDashboard;
