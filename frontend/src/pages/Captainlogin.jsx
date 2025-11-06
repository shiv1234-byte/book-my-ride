import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';
import logo2 from "./logo2.png";
const Captainlogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);  // ✅ Added loading state
    const { captain, setCaptain } = React.useContext(CaptainDataContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        const captainData = {
            email: email,
            password,
        };

        console.log('Login payload:', captainData);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/captains/login`,
                captainData
            );

            if (response.status === 200) {
                const data = response.data;
                setCaptain(data.captain);
                localStorage.setItem('token', data.token);
                navigate('/captain-home');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
            setEmail('');
            setPassword('');
        }
    };

    return (
        <div className="p-7 h-screen flex flex-col justify-between">
            <div>
                <img
                    className="w-20 mb-3"
                    src={logo2}
                    alt="Uber Captain Logo"
                />

                <form onSubmit={submitHandler}>
                    <h3 className="text-lg font-medium mb-2">What's your email</h3>
                    <input
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base"
                        type="email"
                        placeholder="email@example.com"
                    />

                    <h3 className="text-lg font-medium mb-2">Enter Password</h3>
                    <input
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base"
                        type="password"
                        placeholder="password"
                    />

                    <button
                        disabled={loading}
                        className="bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base disabled:bg-gray-400"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-center">
                    Join a fleet?{' '}
                    <Link to="/captain-signup" className="text-blue-600">
                        Register as a Captain
                    </Link>
                </p>
            </div>

            <div>
                <Link
                    to="/login"
                    className="bg-[#d5622d] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base"
                >
                    Sign in as User
                </Link>
            </div>
        </div>
    );
};

export default Captainlogin;
