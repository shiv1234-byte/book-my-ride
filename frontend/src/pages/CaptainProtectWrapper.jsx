import React, { useContext, useEffect, useState } from 'react';
import { CaptainDataContext } from '../context/CaptainContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CaptainProtectWrapper = ({ children }) => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const { captain, setCaptain } = useContext(CaptainDataContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            navigate('/captain-login');
            return;
        }

        axios
            .get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.status === 200) {
                    setCaptain(response.data.captain);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error('Profile fetch error:', err);
                localStorage.removeItem('token');
                navigate('/captain-login');
            });
    }, [token, navigate, setCaptain]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg">Loading...</p>
            </div>
        );  // ✅ FIXED: Added complete return statement
    }

    return <>{children}</>;  // ✅ FIXED: Added children render
};

export default CaptainProtectWrapper;
