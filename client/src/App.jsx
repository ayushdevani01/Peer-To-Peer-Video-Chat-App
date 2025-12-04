import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import { Box, Grid, Snackbar, Alert, Typography, TextField, Button, List, ListItem, ListItemText, LinearProgress, CircularProgress } from "@mui/material";
import Lobby from './components/Lobby';
import VideoPlayer from './components/VideoPlayer';
import ShareLinkModal from './components/ShareLinkModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation'; 

const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const PrivateRoute = React.lazy(() => import('./components/auth/PrivateRoute'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const GuestNameInput = React.lazy(() => import('./components/GuestNameInput'));


const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const AppContent = () => {
  const { isAuthenticated, userType, token, loading, user } = useAuth();
  const { roomId } = useParams();
  
  // Only Create socket if user is authenticated
  const socket = useMemo(() => {
    if (!isAuthenticated) return null;
    
    const authData = {};
    
    if (userType === 'registered' && token) {
      authData.token = token;
    } else if (userType === 'guest') {
      const guestSession = sessionStorage.getItem('guestSession');
      authData.guestSession = guestSession;
    }
    
    return io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: authData
    });
  }, [isAuthenticated, userType, token]);

  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const peerConnections = useRef({});
  const [progress, setProgress] = useState(100);



  if (loading) {
    return <LoadingSpinner />;
  }



  useEffect(() => {
    const initMedia = async () => {
      try {
        // Detect mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Optimize video quality for mobile
        const constraints = {
          video: {
            width: isMobile ? { ideal: 640 } : { ideal: 1280 },
            height: isMobile ? { ideal: 480 } : { ideal: 720 },
            frameRate: isMobile ? { ideal: 15 } : { ideal: 30 }
          },
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setMyStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }

    };
    initMedia();

  }, []);

  useEffect(() => {
    if (notification.open) {
      setProgress(100);
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prevProgress - 5; 
        });
      }, 100);
      // Logic : At Start progress is 100% it decreases 5% per 100ms so total 2 seconds.
      return () => {
        clearInterval(timer);
      };
    }
  }, [notification.open]);

  useEffect(() => {
    if (!socket || !myStream) return;

    const createPeerConnection = (socketID, username) => {
      if (peerConnections.current[socketID]) return;
      
      const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
    ],
  });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidates", { candidate: event.candidate, to: socketID });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({ ...prev, [socketID]: { stream: event.streams[0], username } }));
      };

      // Add connection quality monitoring
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state for ${socketID}:`, pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'failed') {
          console.log(`Connection failed for ${socketID}, attempting ICE restart`);
          // Attempt ICE restart
          pc.restartIce();
        }
        
        if (pc.iceConnectionState === 'disconnected') {
          console.log(`Connection disconnected for ${socketID}`);
          setNotification({ 
            open: true, 
            message: `Connection issue with ${username}` 
          });
        }
        
        if (pc.iceConnectionState === 'connected') {
          console.log(`Connection established with ${socketID}`);
        }
      };

      myStream.getTracks().forEach(track => pc.addTrack(track, myStream));
      peerConnections.current[socketID] = pc;
    };

    const callUser = async (socketID, username) => {
      createPeerConnection(socketID, username);
      const pc = peerConnections.current[socketID];
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { offer, to: socketID, username: user.name });
    };

    const handleExistingUsers = (users) => {
      users.forEach(u => callUser(u.id, u.username));
    };
    
    const handleUserJoined = ({ username }) => {
        setNotification({ open: true, message: `${username} joined the room.` });
    };

    const handleWebrtcOffer = async ({ offer, from, username }) => {
      createPeerConnection(from, username);
      const pc = peerConnections.current[from];
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { answer, to: from });
    };

    const handleWebrtcAnswer = async ({ answer, from }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleWebrtcIceCandidates = async ({ candidate, from }) => {
      const pc = peerConnections.current[from];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleUserLeft = ({ socketID }) => {
      if (peerConnections.current[socketID]) {
        peerConnections.current[socketID].close();
        delete peerConnections.current[socketID];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        const username = newStreams[socketID]?.username || 'A user';
        delete newStreams[socketID];
        setNotification({ open: true, message: `${username} left the room.` });
        return newStreams;
      });
    };

    const handleReceiveMessage = ({ message, username }) => {
      setMessages(prev => [...prev, { username, message }]);
      setNotification({ open: true, message: `${username}: ${message}` });
    };

    socket.on("existing-users", handleExistingUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("webrtc-offer", handleWebrtcOffer);
    socket.on("webrtc-answer", handleWebrtcAnswer);
    socket.on("webrtc-ice-candidates", handleWebrtcIceCandidates);
    socket.on("user-left", handleUserLeft);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("existing-users");
      socket.off("user-joined");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidates");
      socket.off("user-left");
      socket.off("receiveMessage");
      Object.values(peerConnections.current).forEach(pc => {
        pc.close();
      });
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      peerConnections.current = {};
      socket.disconnect();
    };
  }, [socket, myStream, user]);


  useEffect(() => {
    if (socket && myStream && roomId && user) {
      const userId = userType === 'registered' ? user.id : user.sessionId;
      const username = user.name;
      
      socket.emit("joinRoom", {
        roomId,
        roomName: `Room ${roomId}`,
        userId,
        username,
        userType,
        token: userType === 'registered' ? token : null,
      });
    }
  }, [socket, myStream, roomId, user, userType, token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && roomId && user) {
      socket.emit("message", { room: roomId, message: newMessage, username: user.name });
      setMessages(prev => [...prev, { username: user.name, message: newMessage }]);
      setNewMessage("");
    }
  };

  const handleCloseNotification = () => {
    setNotification({ open: false, message: '' });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Video Section */}
      <Box sx={{ flexGrow: 1, p: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          {/* My video */}
          <Grid item >
            {myStream && (
              <Box sx={{width:450, height:310}}>
                <VideoPlayer
                stream={myStream}
                isMuted={true}
                username={`${user.username} (You)`}
              />
              </Box>
              
            )}
          </Grid>

          {/* Remote videos */}
          {Object.entries(remoteStreams).map(([socketID, data]) => (
            <Grid item key={socketID}>
              {data.stream && (
                <Box sx={{ width: 450, height: 310 }}>
                  <VideoPlayer stream={data.stream} username={data.username} />
                </Box>
              )}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Chat Section */}
      <Box
        sx={{
          width: '20%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #ddd',
          bgcolor: 'white',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, flexShrink: 0, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Chat
          </Typography>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => setShowShareModal(true)}
            sx={{ textTransform: 'none' }}
          >
            Share Link
          </Button>
        </Box>

        {/* Messages List */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            px: 2,
            py: 1,
          }}
        >
          <List>
            {messages.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  bgcolor: index % 2 ? '#f5f5f5' : 'transparent',
                  borderRadius: '8px',
                  mb: 1,
                  p: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {msg.username}
                    </Typography>
                  }
                  secondary={msg.message}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Input */}
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            display: 'flex',
            p: 2,
            borderTop: '1px solid #e2e2e2ff',
            flexShrink: 0,
          }}
        >
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            label="Message"
            fullWidth
            size="small"
            variant="outlined"
          />
          <Button type="submit" variant="contained" sx={{ ml: 1 }}>
            Send
          </Button>
        </Box>
      </Box>
      {/* Snackbar for Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={2000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity="info"
          sx={{ width: "100%", position: "relative" }}
        >
          {notification.message}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ 
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0
            }}
          />
        </Alert>
      </Snackbar>

      {/* Share Link Modal */}
      <ShareLinkModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        roomId={roomId}
        roomName={`Room ${roomId}`}
      />
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/guest-name" element={<GuestNameInput />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes (require authentication - guest or registered) */}
            <Route
              path="/lobby"
              element={
                <PrivateRoute>
                  <Lobby />
                </PrivateRoute>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <PrivateRoute>
                  <AppContent />
                </PrivateRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;