import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CaptainDataContext } from '../context/CaptainContext';

export const CaptainLogout = () => {
    const token = localStorage.getItem('token');  // ✅ FIXED: Changed from 'captain-token' to 'token'
    const navigate = useNavigate();
    const { setCaptain } = useContext(CaptainDataContext);

    useEffect(() => {
        const performLogout = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/captains/logout`,  // ✅ FIXED: Changed from VITE_API_URL to VITE_BASE_URL
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 200) {
                    localStorage.removeItem('token');
                    setCaptain(null);  // ✅ Clear captain from context
                    navigate('/captain-login');
                }
            } catch (err) {
                console.error('Logout error:', err);
                // Even if API fails, clear local data
                localStorage.removeItem('token');
                setCaptain(null);
                navigate('/captain-login');
            }
        };

        performLogout();
    }, []);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-lg">Logging out...</p>
        </div>
    );  // ✅ FIXED: Added complete return statement
};

export default CaptainLogout;
