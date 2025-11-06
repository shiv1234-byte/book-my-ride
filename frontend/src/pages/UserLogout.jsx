import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserDataContext } from '../context/UserContext';

const UserLogout = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);

  useEffect(() => {
    const performLogout = async () => {
      const token = localStorage.getItem('token');
      
      console.log('🔴 LOGOUT: Starting logout process');
      console.log('🔴 LOGOUT: Token:', token);
      
      try {
        await axios.get(
          `${import.meta.env.VITE_BASE_URL}/users/logout`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        console.log('🔴 LOGOUT: Backend API call successful');
      } catch (err) {
        console.log('🔴 LOGOUT: Backend API failed (but continuing):', err.message);
      }
      
      // Always clear local data
      localStorage.removeItem('token');
      console.log('🔴 LOGOUT: Token removed from localStorage');
      
      setUser(null);
      console.log('🔴 LOGOUT: User context cleared');
      
      console.log('🔴 LOGOUT: Redirecting to /login');
      navigate('/login');
    };
    
    performLogout();
  }, [navigate, setUser]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Logging out...</p>
    </div>
  );
};

export default UserLogout;
