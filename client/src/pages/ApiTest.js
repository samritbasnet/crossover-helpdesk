import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, TextField, Button, Box, CircularProgress, Alert } from '@mui/material';
import { authAPI } from '../services/api';

const ApiTest = () => {
  const [email, setEmail] = useState('admin@helpdesk.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await authAPI.login({ email, password });
      setResult({
        status: 'success',
        message: 'Login successful!',
        data: response.data
      });
    } catch (err) {
      setError({
        message: err.message || 'Login failed',
        status: err.status,
        url: err.url
      });
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          API Connection Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page helps test the connection to the backend API.
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 3 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Test Login'}
            </Button>
            
            <Typography variant="caption">
              Using endpoint: {process.env.REACT_APP_API_BASE || '/api'}/auth/login
            </Typography>
          </Box>
        </Box>

        {result && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <strong>Success!</strong> {result.message}
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <strong>Error {error.status || ''}:</strong> {error.message}
            {error.url && (
              <div>
                <strong>URL:</strong> {error.url}
              </div>
            )}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ApiTest;
