import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const MeetingHistory = () => {
  const { meetingHistory, fetchMeetingHistory, userType } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userType === 'registered') {
      fetchMeetingHistory();
    }
  }, [userType]);

  const handleRejoin = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  if (userType !== 'registered') {
    return null;
  }

  if (!meetingHistory) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (meetingHistory.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No meeting history yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your past meetings will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Meeting History
      </Typography>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {meetingHistory.map((meeting) => (
          <ListItem key={meeting.roomId} sx={{ p: 0 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {meeting.roomName}
                      </Typography>
                      <Chip
                        label={meeting.role === 'owner' ? 'Owner' : 'Participant'}
                        size="small"
                        color={meeting.role === 'owner' ? 'primary' : 'default'}
                      />
                      {meeting.isActive && (
                        <Chip
                          label="Active"
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Last active: {formatDistanceToNow(new Date(meeting.lastActive), { addSuffix: true })}
                    </Typography>

                    {meeting.participantCount > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {meeting.participantCount} participant{meeting.participantCount !== 1 ? 's' : ''} currently in room
                      </Typography>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleRejoin(meeting.roomId)}
                    sx={{ textTransform: 'none' }}
                  >
                    Rejoin
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MeetingHistory;
