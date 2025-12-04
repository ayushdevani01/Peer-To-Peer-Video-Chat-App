import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Modal, Alert } from '@mui/material';
import Login from './auth/Login';
import Register from './auth/Register';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();


  useEffect(() => {
    if (isAuthenticated) {
      const pendingRoom = sessionStorage.getItem('pendingRoomRedirect');
      console.log('LandingPage: User is authenticated');
      console.log('LandingPage: Checking pendingRoomRedirect:', pendingRoom);
      
      if (pendingRoom) {
        console.log('LandingPage: Redirecting to room:', pendingRoom);
        sessionStorage.removeItem('pendingRoomRedirect');
        navigate(pendingRoom);
      } else {
        console.log('LandingPage: No pending room, going to lobby');  
        navigate('/lobby');
      }
    }
  }, [isAuthenticated, navigate]);
  

  const handleGuestAccess = () => {
    navigate('/guest-name');
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Welcome to Video Chat
        </Typography>
        
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Connect with anyone, anywhere. Join or create meetings instantly.
        </Typography>


        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 400 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGuestAccess}
            sx={{
              py: 2,
              fontSize: '1.1rem',
              textTransform: 'none',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Continue as Guest
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => setShowLogin(true)}
              sx={{
                py: 2,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Login
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => setShowRegister(true)}
              sx={{
                py: 2,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Register
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Guest sessions are temporary and will be cleared when you close your browser.
        </Typography>
      </Box>

      {/* Login Modal */}
      <Modal
        open={showLogin}
        onClose={handleCloseModals}
        aria-labelledby="login-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Login onClose={handleCloseModals} />
        </Box>
      </Modal>

      {/* Register Modal */}
      <Modal
        open={showRegister}
        onClose={handleCloseModals}
        aria-labelledby="register-modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 500,
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Register onClose={handleCloseModals} />
        </Box>
      </Modal>
    </Container>
  );
};

export default LandingPage;
