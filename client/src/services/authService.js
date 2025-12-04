const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/auth`
  : 'http://localhost:5000/api/auth';


const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };


  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  if (config.body) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {

      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.message || err.msg).join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;

  } catch (error) {
    console.error('API request failed:', error);
    console.error('Full error details:', error.message);
    throw error;
  }
};

export const login = async (email, password) => {
  const response = await apiRequest('/login', {
    method: 'POST',
    body: { email, password },
  });

  return {
    user: {
      id: response.data._id,
      name: response.data.name,
      email: response.data.email,
    },
    token: response.data.token,
  };
};

export const register = async (userData) => {
  const response = await apiRequest('/register', {
    method: 'POST',
    body: userData,
  });

  return {
    user: {
      id: response.data._id,
      name: response.data.name,
      email: response.data.email,
    },
    token: response.data.token,
  };
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  const response = await apiRequest('/profile');
  return {
    id: response.data._id,
    name: response.data.name,
    email: response.data.email,
  };
};


