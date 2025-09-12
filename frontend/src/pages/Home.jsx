// src/pages/Home.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css';
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import logo2 from './logo2.png';

const Home = () => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState(null);
  const [ride, setRide] = useState(null);

  const vehiclePanelRef = useRef(null);
  const confirmRidePanelRef = useRef(null);
  const vehicleFoundRef = useRef(null);
  const waitingForDriverRef = useRef(null);
  const panelRef = useRef(null);
  const panelCloseRef = useRef(null);

  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

  // Join user room
  useEffect(() => {
    if (!user || !user._id) return;
    socket.emit("join", { userType: "user", userId: user._id });
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('ride-confirmed', (ride) => {
      setVehicleFound(false);
      setWaitingForDriver(true);
      setRide(ride);
    });

    socket.on('ride-started', ride => {
      setWaitingForDriver(false);
      navigate('/riding', { state: { ride } });
    });

    return () => {
      socket.off('ride-confirmed');
      socket.off('ride-started');
    };
  }, [socket]);

  const handlePickupChange = async (e) => {
    setActiveField('pickup');
    const value = e.target.value;
    setPickup({ text: value });
    if (value.length < 3) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: value },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPickupSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDestinationChange = async (e) => {
    setActiveField('destination');
    const value = e.target.value;
    setDestination({ text: value });
    if (value.length < 3) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
        params: { input: value },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDestinationSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ⬇️ updated to send coords if available
  const findTrip = async () => {
    if (!pickup || !destination) return alert("Select pickup and destination");
    setVehiclePanel(true);
    setPanelOpen(false);

    try {
      const pickupParam = pickup?.center
        ? pickup.center.join(',')
        : (pickup.place_name || pickup.text);

      const destinationParam = destination?.center
        ? destination.center.join(',')
        : (destination.place_name || destination.text);

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: {
          pickup: pickupParam,
          destination: destinationParam
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFare(response.data);
    } catch (err) {
      console.error("Fare calculation error:", err);
      alert("Unable to calculate fare");
    }
  };

  // ⬇️ updated to send coords if available
  const createRide = async () => {
    try {
      const pickupParam = pickup?.center
        ? pickup.center.join(',')
        : (pickup.place_name || pickup.text);

      const destinationParam = destination?.center
        ? destination.center.join(',')
        : (destination.place_name || destination.text);

      await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
        pickup: pickupParam,
        destination: destinationParam,
        vehicleType
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error("Create ride error:", err);
      alert("Unable to create ride");
    }
  };

  // GSAP animations for panels
  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.to(panelRef.current, { height: panelOpen ? '70%' : '0%', padding: panelOpen ? 24 : 0 });
    gsap.to(panelCloseRef.current, { opacity: panelOpen ? 1 : 0 });
  }, [panelOpen]);

  useGSAP(() => {
    gsap.to(vehiclePanelRef.current, { transform: vehiclePanel ? 'translateY(0)' : 'translateY(100%)' });
  }, [vehiclePanel]);

  useGSAP(() => {
    gsap.to(confirmRidePanelRef.current, { transform: confirmRidePanel ? 'translateY(0)' : 'translateY(100%)' });
  }, [confirmRidePanel]);

  useGSAP(() => {
    gsap.to(vehicleFoundRef.current, { transform: vehicleFound ? 'translateY(0)' : 'translateY(100%)' });
  }, [vehicleFound]);

  useGSAP(() => {
    gsap.to(waitingForDriverRef.current, { transform: waitingForDriver ? 'translateY(0)' : 'translateY(100%)' });
  }, [waitingForDriver]);

  if (!user || !user._id) return <div>Loading user...</div>;

  return (
    <div className='h-screen relative overflow-hidden'>
      <img className="w-32 absolute" src={logo2} alt="Book My Ride Logo" />
      <div className='h-screen w-screen'>
        <img className='h-full w-full object-cover' src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif" alt="" />
      </div>

      <div className='flex flex-col justify-end h-screen absolute top-0 w-full'>
        <div className='h-[30%] p-6 bg-white relative'>
          <h5 ref={panelCloseRef} onClick={() => setPanelOpen(false)} className='absolute opacity-0 right-6 top-6 text-2xl'>
            <i className="ri-arrow-down-wide-line"></i>
          </h5>
          <h4 className='text-2xl font-semibold'>Find a trip</h4>
          <form className='relative py-3'>
            <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
            <input
              onClick={() => setPanelOpen(true)}
              value={pickup?.text || ''}
              onChange={handlePickupChange}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
              type="text"
              placeholder='Add a pick-up location'
            />
            <input
              onClick={() => setPanelOpen(true)}
              value={destination?.text || ''}
              onChange={handleDestinationChange}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3'
              type="text"
              placeholder='Enter your destination'
            />
          </form>
          <button onClick={findTrip} className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full'>
            Find Trip
          </button>
        </div>

        <div ref={panelRef} className='bg-white h-0'>
          <LocationSearchPanel
            suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
            setPanelOpen={setPanelOpen}
            setVehiclePanel={setVehiclePanel}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        </div>
      </div>

      <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
        <VehiclePanel selectVehicle={setVehicleType} fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
      </div>

      <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <ConfirmRide
          createRide={createRide}
          pickup={pickup?.place_name || pickup?.text}
          destination={destination?.place_name || destination?.text}
          fare={fare}
          vehicleType={vehicleType}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehicleFound={setVehicleFound}
        />
      </div>

      <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
        <LookingForDriver
          pickup={pickup?.place_name || pickup?.text}
          destination={destination?.place_name || destination?.text}
          fare={fare}
          vehicleType={vehicleType}
          setVehicleFound={setVehicleFound}
        />
      </div>

      <div ref={waitingForDriverRef} className='fixed w-full z-10 bottom-0 bg-white px-3 py-6 pt-12'>
        <WaitingForDriver ride={ride} setVehicleFound={setVehicleFound} setWaitingForDriver={setWaitingForDriver} waitingForDriver={waitingForDriver} />
      </div>
    </div>
  );
};

export default Home;
