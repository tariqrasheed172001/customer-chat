// src/hooks/useTokenMonitization.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isTokenExpired = () => {
  const expiryTime = localStorage.getItem('tokenExpiry');
  if (!expiryTime) return true; // Treat as expired if no expiry time is found
  return Date.now() >= parseInt(expiryTime, 10);
};

const handleTokenExpiry = (navigate) => {
  if (isTokenExpired()) {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    navigate('/'); // Redirect to login page or handle token refresh
  }
};

const useContinuousTokenChecking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    handleTokenExpiry(navigate);

    // Optional: Set up an interval to periodically check token expiration
    const intervalId = setInterval(() => handleTokenExpiry(navigate), 60000); // Check every minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);
};

export default useContinuousTokenChecking;
