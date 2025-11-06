import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CaptainDetails from '../components/CaptainDetails';
import RidePopUp from '../components/RidePopUp';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import axios from 'axios';
import logo2 from './logo2.png';

const CaptainHome = () => {
    const [ridePopupPanel, setRidePopupPanel] = useState(false);
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
    const [ride, setRide] = useState(null);

    const ridePopupPanelRef = useRef(null);
    const confirmRidePopupPanelRef = useRef(null);

    const { socket } = useContext(SocketContext);
    const { captain } = useContext(CaptainDataContext);
    const navigate = useNavigate();

    // Logout handler
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
        } catch (err) {
            console.error('Logout error:', err.response?.data || err.message);
        } finally {
            localStorage.removeItem('token');
            navigate('/captain-login');
        }
    };

    // Join captain socket room and update location
    useEffect(() => {
        if (!captain?._id || !socket) return;

        console.log('✅ Captain joining socket room:', captain._id);
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain',
        });

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    console.log('📍 Updating captain location:', {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                    socket.emit('update-location-captain', {
                        userId: captain._id,
                        location: {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                        },
                    });
                });
            }
        };

        updateLocation();
        const interval = setInterval(updateLocation, 10000);

        return () => clearInterval(interval);
    }, [captain, socket]);

    // Listen for new ride requests
    useEffect(() => {
        if (!socket) {
            console.log('❌ No socket available');
            return;
        }

        console.log('🎧 Setting up new-ride listener...');
        console.log('Socket ID:', socket.id);

        // Listen to ALL socket events for debugging
        socket.onAny((event, ...args) => {
            console.log('📡 Socket event received:', event, args);
        });

        const handleNewRide = (data) => {
            console.log('🚗 NEW RIDE HANDLER TRIGGERED!');
            console.log('Ride data:', data);
            setRide(data);
            setRidePopupPanel(true);
            alert('🚗 New ride received! Check console.');
        };

        socket.on('new-ride', handleNewRide);

        console.log('✅ new-ride listener attached');

        return () => {
            console.log('🧹 Cleaning up socket listeners');
            socket.offAny();
            socket.off('new-ride', handleNewRide);
        };
    }, [socket]);

    // Accept ride
    const acceptRide = async () => {
        if (!ride) return;

        try {
            console.log('✅ Accepting ride:', ride.rideId || ride._id);

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
                {
                    rideId: ride.rideId || ride._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            console.log('✅ Ride accepted:', response.data);
            setRidePopupPanel(false);
            setConfirmRidePopupPanel(true);
        } catch (err) {
            console.error('❌ Accept ride error:', err);
            alert(err.response?.data?.message || 'Could not accept ride');
        }
    };

    // Ignore ride
    const ignoreRide = () => {
        console.log('❌ Ride ignored');
        setRidePopupPanel(false);
        setRide(null);
    };

    // GSAP animations
    useGSAP(() => {
        if (!ridePopupPanelRef.current) return;
        gsap.to(ridePopupPanelRef.current, {
            transform: ridePopupPanel ? 'translateY(0)' : 'translateY(100%)',
        });
    }, [ridePopupPanel]);

    useGSAP(() => {
        if (!confirmRidePopupPanelRef.current) return;
        gsap.to(confirmRidePopupPanelRef.current, {
            transform: confirmRidePopupPanel ? 'translateY(0)' : 'translateY(100%)',
        });
    }, [confirmRidePopupPanel]);

    // Loading state
    if (!captain?._id) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading captain data...</p>
            </div>
        );
    }

    return (
        <div className="h-screen">
            {/* Header with logo and logout */}
            <div className="fixed p-6 top-0 flex items-center justify-between w-screen z-10">
                <img className="w-16" src={logo2} alt="logo" />
                <button
                    onClick={handleLogout}
                    className="h-10 w-10 bg-white flex items-center justify-center rounded-full"
                >
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </button>
            </div>

            {/* Map */}
            <div className="h-3/5">
                <img
                    className="h-full w-full object-cover"
                    src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
                    alt="Map"
                />
            </div>

            {/* Captain Details */}
            <div className="h-2/5 p-6">
                <CaptainDetails />
            </div>

            {/* Ride Popup Panel */}
            <div
                ref={ridePopupPanelRef}
                className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
            >
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={acceptRide}
                    ignoreRide={ignoreRide}
                />
            </div>

            {/* Confirm Ride Popup Panel */}
            <div
                ref={confirmRidePopupPanelRef}
                className="fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
            >
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    setRidePopupPanel={setRidePopupPanel}
                />
            </div>
        </div>
    );
};

export default CaptainHome;
