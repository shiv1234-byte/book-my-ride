import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

// ✅ FIXED: Initialize socket connection properly
const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Create socket connection
        const socketInstance = io(import.meta.env.VITE_BASE_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });

        // Basic connection logic
        socketInstance.on('connect', () => {
            console.log('✅ Connected to server:', socketInstance.id);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // ✅ FIXED: Pass socket to context value
    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
