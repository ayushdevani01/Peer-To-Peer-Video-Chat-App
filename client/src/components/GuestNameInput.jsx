import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
} from '@mui/material';  
import { useAuth } from '../context/AuthContext';

const GuestNameInput = () => {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const validateName = (name) => {
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.length > 50) {
      return 'Name must be less than 50 characters';
    }
    
    const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!validPattern.test(name)) {
      return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = displayName.trim();
    const validationError = validateName(trimmedName);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    const sessionId = uuidv4();
    
    const guestSession = {
      type: 'guest',
      sessionId,
      displayName: trimmedName,
      createdAt: Date.now(),
    };

    sessionStorage.setItem('guestSession', JSON.stringify(guestSession));

    loginAsGuest(trimmedName);
  };

  const handleChange = (e) => {
    setDisplayName(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Enter Your Name
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Choose a display name for your guest session. This will be visible to other participants.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ width: '100%' }}
        >
          <TextField
            fullWidth
            label="Display Name"
            variant="outlined"
            value={displayName}
            onChange={handleChange}
            placeholder="Enter your name"
            autoFocus
            sx={{ mb: 3 }}
            helperText="2-50 characters, letters, numbers, spaces, hyphens, and underscores only"
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{
              py: 2,
              fontSize: '1.1rem',
              textTransform: 'none',
            }}
          >
            Continue
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/')}
            sx={{
              mt: 2,
              textTransform: 'none',
            }}
          >
            Back to Home
          </Button>
        </Box>

        <Alert severity="info" sx={{ width: '100%', mt: 4 }}>
          <Typography variant="body2">
            <strong>Guest Session:</strong> Your data will be automatically deleted when you close your browser window.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default GuestNameInput;
