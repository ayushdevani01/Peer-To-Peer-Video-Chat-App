import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

const ShareLinkModal = ({ open, onClose, roomId, roomName }) => {
  const [copied, setCopied] = useState(false);
  
  const shareLink = `${window.location.origin}/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCloseCopiedSnackbar = () => {
    setCopied(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Share Meeting Link</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this link with others to invite them to join "{roomName}"
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              value={shareLink}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleCopy}
              startIcon={<ContentCopyIcon />}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Copy
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Anyone with this link can join the meeting
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={handleCloseCopiedSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseCopiedSnackbar} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareLinkModal;
