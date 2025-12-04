import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as loginService, register as registerService, logout as logoutService, getCurrentUser } from '../services/authService';
import { getMeetingHistory as getMeetingHistoryService } from '../services/roomService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'guest' | 'registered' | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meetingHistory, setMeetingHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is logged in or not
  useEffect(() => {
    const checkAuth = async () => {
      try {
       
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
            setUserType('registered');
            console.log('User authenticated:', userData.name);
          } catch (error) {
            console.log('Token invalid or expired');
            localStorage.removeItem('token');
          }
        }

      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);



  // Check if there's a pending room redirect
  const handleRedirect = () => {
    navigate('/');
  };

  const loginAsGuest = (displayName) => {
    const guestSession = sessionStorage.getItem('guestSession');
    if (guestSession) {
      const guestData = JSON.parse(guestSession);
      setUser({
        id: guestData.sessionId,
        name: guestData.displayName,
        sessionId: guestData.sessionId,
      });
      setUserType('guest');
      setLoading(false);
      handleRedirect();
    
      return { success: true };
    }
    return { success: false, error: 'Guest session not found' };
  };

  const login = async (email, password) => {
    try {
      setError('');
      const { user: userData, token } = await loginService(email, password);
      localStorage.setItem('token', token);
      setUser(userData);
      setUserType('registered');
      
      console.log('Login successful:', userData.name);
      handleRedirect();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      return { success: false, error: err.message };
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const { user: newUser, token } = await registerService(userData);
      localStorage.setItem('token', token);
      setUser(newUser);
      setUserType('registered');
      
      console.log('Registration successful:', newUser.name);
      handleRedirect();

      return { success: true };
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
    setUserType(null);
    setMeetingHistory([]);
    navigate('/');
  };

  const fetchMeetingHistory = async () => {
    if (userType !== 'registered') {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const history = await getMeetingHistoryService(token);
      console.log('Meeting history fetched:', history);
      setMeetingHistory(history || []);
    } catch (error) {
      console.error('Failed to fetch meeting history:', error);
    }
  };

  const value = {
    user,
    userType,
    loading,
    error,
    meetingHistory,
    login,
    register,
    logout,
    loginAsGuest,
    fetchMeetingHistory,
    isAuthenticated: !!user,
    token: userType === 'registered' ? localStorage.getItem('token') : null,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
