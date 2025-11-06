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

    useEffect(() => {
        if (!user || !user._id || !socket) return;
        socket.emit('join', { userType: 'user', userId: user._id });
        console.log('✅ User joined socket room:', user._id);
    }, [user, socket]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('ride-confirmed', (ride) => {
            console.log('✅ Ride confirmed by driver:', ride);
            setVehicleFound(false);
            setWaitingForDriver(true);
            setRide(ride);
        });
        
        socket.on('ride-started', (ride) => {
            console.log('✅ Ride started:', ride);
            setWaitingForDriver(false);
            navigate('/riding', { state: { ride } });
        });
        
        return () => {
            socket.off('ride-confirmed');
            socket.off('ride-started');
        };
    }, [socket, navigate]);

    const handlePickupChange = async (e) => {
        setActiveField('pickup');
        const value = e.target.value;
        setPickup({ text: value });
        
        if (value.length < 3) return;
        
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
                {
                    params: { input: value },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );
            setPickupSuggestions(res.data);
        } catch (err) {
            console.error('Pickup suggestions error:', err);
        }
    };

    const handleDestinationChange = async (e) => {
        setActiveField('destination');
        const value = e.target.value;
        setDestination({ text: value });
        
        if (value.length < 3) return;
        
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
                {
                    params: { input: value },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );
            setDestinationSuggestions(res.data);
        } catch (err) {
            console.error('Destination suggestions error:', err);
        }
    };

    const findTrip = async () => {
    if (!pickup || !destination) {
        return alert('Please select both pickup and destination');
    }
    
    setVehiclePanel(true);
    setPanelOpen(false);
    
    try {
        let pickupParam, destinationParam;

        // ✅ FIXED: Properly format coordinates as "lat,lng"
        if (pickup.center && Array.isArray(pickup.center) && pickup.center.length === 2) {
            // Mapbox returns [lng, lat], we need "lat,lng"
            const lat = pickup.center[1];
            const lng = pickup.center[0];
            pickupParam = `${lat},${lng}`;
        } else if (pickup.place_name) {
            pickupParam = pickup.place_name;
        } else if (pickup.text) {
            pickupParam = pickup.text;
        } else {
            return alert('Invalid pickup location selected');
        }

        if (destination.center && Array.isArray(destination.center) && destination.center.length === 2) {
            const lat = destination.center[1];
            const lng = destination.center[0];
            destinationParam = `${lat},${lng}`;
        } else if (destination.place_name) {
            destinationParam = destination.place_name;
        } else if (destination.text) {
            destinationParam = destination.text;
        } else {
            return alert('Invalid destination location selected');
        }

        console.log('🚗 Getting fare for:', { 
            pickup: pickupParam, 
            destination: destinationParam 
        });

        const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
            {
                params: { 
                    pickup: pickupParam, 
                    destination: destinationParam 
                },
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}` 
                },
            }
        );

        console.log('✅ Fare calculated:', response.data);
        setFare(response.data);
    } catch (err) {
        console.error('Fare calculation error:', err.response?.data || err.message);
        alert(err.response?.data?.message || 'Unable to calculate fare. Please try different locations.');
        setVehiclePanel(false);
    }
};


    const createRide = async () => {
    try {
        let pickupParam, destinationParam;

        // ✅ FIXED: Properly format coordinates as "lat,lng"
        if (pickup.center && Array.isArray(pickup.center) && pickup.center.length === 2) {
            const lat = pickup.center[1];
            const lng = pickup.center[0];
            pickupParam = `${lat},${lng}`;
        } else if (pickup.place_name) {
            pickupParam = pickup.place_name;
        } else if (pickup.text) {
            pickupParam = pickup.text;
        } else {
            return alert('Invalid pickup location');
        }

        if (destination.center && Array.isArray(destination.center) && destination.center.length === 2) {
            const lat = destination.center[1];
            const lng = destination.center[0];
            destinationParam = `${lat},${lng}`;
        } else if (destination.place_name) {
            destinationParam = destination.place_name;
        } else if (destination.text) {
            destinationParam = destination.text;
        } else {
            return alert('Invalid destination');
        }

        console.log('🚗 Creating ride:', {
            pickup: pickupParam,
            destination: destinationParam,
            vehicleType,
        });

        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/rides/create`,
            {
                pickup: pickupParam,
                destination: destinationParam,
                vehicleType,
            },
            {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem('token')}` 
                },
            }
        );

        console.log('✅ Ride created successfully:', response.data);
    } catch (err) {
        console.error('Create ride error:', err.response?.data || err.message);
        alert(err.response?.data?.message || 'Unable to create ride. Please try again.');
    }
};

    

    useGSAP(() => {
        if (!panelRef.current || !panelCloseRef.current) return;
        gsap.to(panelRef.current, { 
            height: panelOpen ? '70%' : '0%', 
            padding: panelOpen ? 24 : 0 
        });
        gsap.to(panelCloseRef.current, { 
            opacity: panelOpen ? 1 : 0 
        });
    }, [panelOpen]);

    useGSAP(() => {
        if (!vehiclePanelRef.current) return;
        gsap.to(vehiclePanelRef.current, { 
            transform: vehiclePanel ? 'translateY(0)' : 'translateY(100%)' 
        });
    }, [vehiclePanel]);

    useGSAP(() => {
        if (!confirmRidePanelRef.current) return;
        gsap.to(confirmRidePanelRef.current, { 
            transform: confirmRidePanel ? 'translateY(0)' : 'translateY(100%)' 
        });
    }, [confirmRidePanel]);

    useGSAP(() => {
        if (!vehicleFoundRef.current) return;
        gsap.to(vehicleFoundRef.current, { 
            transform: vehicleFound ? 'translateY(0)' : 'translateY(100%)' 
        });
    }, [vehicleFound]);

    useGSAP(() => {
        if (!waitingForDriverRef.current) return;
        gsap.to(waitingForDriverRef.current, { 
            transform: waitingForDriver ? 'translateY(0)' : 'translateY(100%)' 
        });
    }, [waitingForDriver]);

    if (!user || !user._id) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg">Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="h-screen relative overflow-hidden">
            <img 
                className="w-16 absolute left-5 top-5 z-10" 
                src={logo2} 
                alt="Logo" 
            />
            
            <button 
                onClick={() => {
                    console.log('🟢 LOGOUT BUTTON CLICKED');
                    navigate('/users/logout');
                }}
                className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded font-bold transition hover:bg-red-700 z-50"
            >
                LogOut
            </button>
            
            <div className="h-screen w-screen">
                <img
                    className="h-full w-full object-cover"
                    src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
                    alt="Map"
                />
            </div>
            
            <div className="flex flex-col justify-end h-screen absolute top-0 w-full">
                <div className="h-[30%] p-6 bg-white relative">
                    <h5 
                        ref={panelCloseRef}
                        onClick={() => setPanelOpen(false)}
                        className="absolute opacity-0 right-6 top-6 text-2xl cursor-pointer"
                    >
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className="text-2xl font-semibold">Find a trip</h4>
                    <form onSubmit={e => { e.preventDefault(); findTrip(); }}>
                        <div className="line absolute h-16 w-1 top-[45%] left-10 bg-gray-700 rounded-full"></div>
                        <input
                            onClick={() => setPanelOpen(true)}
                            onChange={handlePickupChange}
                            value={pickup?.place_name || pickup?.text || ''}
                            className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-5"
                            type="text"
                            placeholder="Add a pick-up location"
                        />
                        <input
                            onClick={() => setPanelOpen(true)}
                            onChange={handleDestinationChange}
                            value={destination?.place_name || destination?.text || ''}
                            className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3"
                            type="text"
                            placeholder="Enter your destination"
                        />
                        <button
                            type="submit"
                            className="bg-[#111] text-white font-semibold mt-4 rounded-lg px-4 py-2 w-full text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!pickup || !destination}
                        >
                            Find Trip
                        </button>
                    </form>
                </div>
                
                <div ref={panelRef} className="bg-white h-0 overflow-hidden">
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
            
            <div ref={vehiclePanelRef} className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12">
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehiclePanel={setVehiclePanel}
                />
            </div>
            
            <div ref={confirmRidePanelRef} className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12">
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
            
            <div ref={vehicleFoundRef} className="fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12">
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup?.place_name || pickup?.text}
                    destination={destination?.place_name || destination?.text}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound}
                />
            </div>
            
            <div ref={waitingForDriverRef} className="fixed w-full z-10 bottom-0 bg-white px-3 py-6 pt-12">
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver
}
                    waitingForDriver={waitingForDriver}
                />
            </div>
        </div>
    );
};

export default Home;