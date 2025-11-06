import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConfirmRidePopUp = (props) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (otp.length !== 6) {
            setError('OTP must be 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/start-ride`,
                {
                    rideId: props.ride?.rideId || props.ride?._id,
                    otp: otp,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.status === 200) {
                props.setConfirmRidePopupPanel(false);
                props.setRidePopupPanel(false);
                navigate('/captain-riding', { state: { ride: response.data } });
            }
        } catch (err) {
            console.error('Start Ride Error:', err);
            setError(err.response?.data?.message || 'Failed to start ride. Check OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h5
                className="p-1 text-center w-[93%] absolute top-0"
                onClick={() => {
                    props.setConfirmRidePopupPanel(false);
                    props.setRidePopupPanel(false);
                }}
            >
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            
            <h3 className="text-2xl font-semibold mb-5">
                Confirm this ride to Start
            </h3>
            
            <div className="flex items-center justify-between p-3 border-2 border-yellow-400 rounded-lg mt-4">
                <div className="flex items-center gap-3">
                    <img
                        className="h-12 rounded-full object-cover w-12"
                        src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg"
                        alt="User"
                    />
                    <h2 className="text-lg font-medium capitalize">
                        {props.ride?.user?.name || 'Passenger'}
                    </h2>
                </div>
                <h5 className="text-lg font-semibold">2.2 KM</h5>
            </div>
            
            <div className="flex gap-2 justify-between flex-col items-center">
                <div className="w-full mt-5">
                    <div className="flex items-center gap-5 p-3 border-b-2">
                        <i className="ri-map-pin-user-fill text-lg"></i>
                        <div>
                            <h3 className="text-lg font-medium">Pickup</h3>
                            <p className="text-sm -mt-1 text-gray-600">
                                {props.ride?.pickup || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 p-3 border-b-2">
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className="text-lg font-medium">Destination</h3>
                            <p className="text-sm -mt-1 text-gray-600">
                                {props.ride?.destination || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 p-3">
                        <i className="ri-currency-line text-lg"></i>
                        <div>
                            <h3 className="text-lg font-medium">
                                ₹{props.ride?.fare || '0'}
                            </h3>
                            <p className="text-sm -mt-1 text-gray-600">Cash</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 w-full">
                    <form onSubmit={submitHandler}>
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            type="text"
                            className="bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3"
                            placeholder="Enter OTP"
                            maxLength="6"
                            required
                        />

                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-5 text-lg flex justify-center bg-green-600 text-white font-semibold p-3 rounded-lg disabled:bg-gray-400"
                        >
                            {loading ? 'Starting...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                props.setConfirmRidePopupPanel(false);
                                props.setRidePopupPanel(false);
                            }}
                            className="w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConfirmRidePopUp;
