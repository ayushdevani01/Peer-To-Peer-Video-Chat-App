import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              textDecoration: 'none',
            }}
          >
            VideoChat
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
            
            {isAuthenticated && (
              <Button
                component={RouterLink}
                to="/lobby"
                sx={{ textTransform: 'none' }}
              >
                Lobby
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Welcome, {user?.name}
              </Typography>
              <Button
                variant="contained"
                onClick={logout}
                sx={{ textTransform: 'none' }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                component={RouterLink}
                to="/login"
                sx={{ textTransform: 'none' }}
              >
                Sign in
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                sx={{ textTransform: 'none' }}
              >
                Sign up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
