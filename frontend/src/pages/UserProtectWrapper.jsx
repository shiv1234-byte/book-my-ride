import React, { useContext, useEffect, useState } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserProtectWrapper = ({ children }) => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const { user, setUser } = useContext(UserDataContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        axios
            .get(`${import.meta.env.VITE_BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((response) => {
                if (response.status === 200) {
                    console.log('✅ User profile loaded:', response.data);
                    setUser(response.data);  // ✅ FIXED: Use response.data directly (not response.data.user)
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                console.error('❌ Profile fetch error:', err.response?.data || err.message);
                localStorage.removeItem('token');
                navigate('/login');
            });
    }, [token, navigate, setUser]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default UserProtectWrapper;
