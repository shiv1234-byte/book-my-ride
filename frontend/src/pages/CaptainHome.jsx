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
import logo7 from './logo2.png';

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [ride, setRide] = useState(null);

  const ridePopupPanelRef = useRef(null);
  const confirmRidePopupPanelRef = useRef(null);

  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout error:', err.response?.data || err.message);
    } finally {
      localStorage.removeItem('token');
      navigate('/captain-login');
    }
  };

  // Join socket & update location
  useEffect(() => {
    if (!captain?._id) return;

    // join room
    socket.emit('join', {
      userId: captain._id,
      userType: 'captain'
    });

    // send location every 10s
    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          socket.emit('update-location-captain', {
            userId: captain._id,
            location: {
              ltd: pos.coords.latitude,
              lng: pos.coords.longitude
            }
          });
        });
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 10000);
    return () => clearInterval(interval);
  }, [captain, socket]);

  // Listen for new rides from backend
  useEffect(() => {
    if (!socket) return;

    const handleNewRide = (data) => {
      setRide(data);
      setRidePopupPanel(true);
    };

    socket.on('new-ride', handleNewRide);
    return () => socket.off('new-ride', handleNewRide);
  }, [socket]);

  // Accept ride
  const acceptRide = async () => {
    if (!ride) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        { rideId: ride._id, captainId: captain._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // you could setConfirmRidePopupPanel(true) here if you want to show second popup
      setConfirmRidePopupPanel(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not accept ride');
    }
  };

  // Animations
  useGSAP(
    () => {
      if (!ridePopupPanelRef.current) return;
      gsap.to(ridePopupPanelRef.current, {
        transform: ridePopupPanel ? 'translateY(0)' : 'translateY(100%)'
      });
    },
    [ridePopupPanel]
  );

  useGSAP(
    () => {
      if (!confirmRidePopupPanelRef.current) return;
      gsap.to(confirmRidePopupPanelRef.current, {
        transform: confirmRidePopupPanel ? 'translateY(0)' : 'translateY(100%)'
      });
    },
    [confirmRidePopupPanel]
  );

  if (!captain?._id) return <div>Loading captain…</div>;

  return (
    <div className="h-screen">
      {/* Top bar */}
      <div className="fixed p-6 top-0 flex items-center justify-between w-screen">
        <img className="w-16" src={logo7} alt="Book My Ride Logo" />
        <button
          onClick={handleLogout}
          className="h-10 w-10 bg-white flex items-center justify-center rounded-full"
        >
          <i className="text-lg font-medium ri-logout-box-r-line"></i>
        </button>
      </div>

      {/* Map / animation */}
      <div className="h-3/5">
        <img
          className="h-full w-full object-cover"
          src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
          alt=""
        />
      </div>

      {/* Captain details */}
      <div className="h-2/5 p-6">
        <CaptainDetails />
      </div>

      {/* No ride message */}
      {!ride && (
        <div className="flex justify-center items-center h-32">
          <h2 className="text-xl font-semibold text-gray-600">
            No ride assigned yet.
          </h2>
        </div>
      )}

      {/* Ride popup */}
      {ride && (
        <div
          ref={ridePopupPanelRef}
          className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12"
        >
          <RidePopUp
            ride={ride}
            setRidePopupPanel={setRidePopupPanel}
            setConfirmRidePopupPanel={setConfirmRidePopupPanel}
            confirmRide={acceptRide}
          />
        </div>
      )}

      {/* Confirm ride popup */}
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
