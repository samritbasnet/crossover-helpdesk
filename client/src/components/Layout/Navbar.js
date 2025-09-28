// Navigation Component - Top navigation bar
import {
  AccountCircle,
  Article,
  Dashboard,
  Logout,
  Settings,
  Support,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAgent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Handle menu open/close
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
    handleClose();
  };

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];

    const baseItems = [
      {
        label: "Dashboard",
        path: isAgent() ? "/agent-dashboard" : "/dashboard",
        icon: <Dashboard />,
      },
      { label: "Knowledge Base", path: "/knowledge", icon: <Article /> },
    ];

    if (isAgent()) {
      baseItems.splice(1, 0, {
        label: "Tickets",
        path: "/tickets",
        icon: <Support />,
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          HelpDesk System
        </Typography>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Navigation Links */}
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor:
                    location.pathname === item.path
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                }}
              >
                {item.label}
              </Button>
            ))}

            {/* User Menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user.name} ({user.role})
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
