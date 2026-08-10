import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ensureValidSession } from '../../services/authService';
import DriverOnlineMonitor from './DriverOnlineMonitor';

const SESSION_CHECK_INTERVAL_MS = 10 * 60 * 1000;

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const isValid = await ensureValidSession();
      if (!isMounted) return;

      if (!isValid) {
        navigate('/login');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }

      setIsChecking(false);
    };

    validateSession();

    const intervalId = window.setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  if (isChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {children}
      <DriverOnlineMonitor />
    </>
  );
};

export default AuthGuard;
