import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link} from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Container,
} from '@mui/material';

const Register = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { success, error: authError } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        if (onClose) onClose();
        // Navigation is handled by AuthContext
      } else if (authError) {
        setError(authError);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Create a new account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Or{' '}
          <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
            sign in to your account
          </Link>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            helperText="Minimum 6 characters"
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5, textTransform: 'none' }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Register;
