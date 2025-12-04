import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Divider, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import MeetingHistory from './MeetingHistory';
import { createRoom as createRoomService } from '../services/roomService';

const Lobby = () => {
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, userType, token, logout } = useAuth();
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }  

    setLoading(true);
    setError('');

    try {
      const guestSession = userType === 'guest' 
        ? sessionStorage.getItem('guestSession') 
        : null;

      const roomData = await createRoomService(
        roomName.trim(),
        userType,
        token,
        guestSession
      );

      // Navigate to the created room
      navigate(`/room/${roomData.roomId}`);
    } catch (err) {
      console.error('Create room error:', err);
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    navigate(`/room/${roomId.trim()}`);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '500px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Welcome, {user?.name || 'Guest'}!
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={logout}
              sx={{ textTransform: 'none' }}
            >
              {userType === 'registered' ? 'Logout' : 'End Session'}
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {userType === 'guest' 
              ? 'You are using a guest account. Your session will end when you close the browser.'
              : 'You are logged in. Your sessions are saved and accessible across devices.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Create Room Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Create New Meeting
            </Typography>
            <TextField
              label="Meeting Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Enter meeting name"
            />
            <Button
              variant="contained"
              fullWidth
              onClick={createRoom}
              disabled={loading}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          {/* Join Room Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Join Existing Meeting
            </Typography>
            <TextField
              label="Meeting ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Enter meeting ID"
            />
            <Button
              variant="outlined"
              fullWidth
              onClick={joinRoom}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Join Meeting
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Meeting History Sidebar (only for registered users) */}
      {userType === 'registered' && (
        <Box
          sx={{
            width: '400px',
            borderLeft: '1px solid #ddd',
            bgcolor: 'background.paper',
            overflowY: 'auto',
          }}
        >
          <MeetingHistory />
        </Box>
      )}
    </Box>
  );
};

export default Lobby;