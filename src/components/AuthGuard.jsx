import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../services/authService';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const token = getAuthToken();
  
  if (!token) {
    return null; // Don't render anything while redirecting
  }

  return children;
};

export default AuthGuard;
