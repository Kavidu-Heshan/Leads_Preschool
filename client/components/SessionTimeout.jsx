// components/SessionTimeout.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

const SessionTimeout = ({ children, timeoutMinutes = 30 }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    let timeoutId;
    
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        navigate('/childenroll');
        alert('Session expired. Please login again.');
      }, timeoutMinutes * 60 * 1000);
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });
    
    resetTimeout();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [navigate, timeoutMinutes]);
  
  return children;
};

export default SessionTimeout;