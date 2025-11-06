import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';

const UserSignup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(UserDataContext);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        const newUser = {
            fullname: { firstname: firstName, lastname: lastName },
            email,
            password,
        };
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/users/register`,
                newUser
            );
            if (response.status === 201) {
                const data = response.data;
                setUser(data.user);
                localStorage.setItem('token', data.token);
                navigate('/home');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
            setEmail('');
            setFirstName('');
            setLastName('');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
                <form onSubmit={submitHandler}>
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1 font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-1 font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <p className="mt-4 text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Login here
                    </Link>
                </p>
                <p className="mt-6 text-xs text-gray-500 text-center">
                    This site is protected by reCAPTCHA and the{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                        Google Privacy Policy
                    </a>
                    {' '}and{' '}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
                        Terms of Service
                    </a>{' '}apply.
                </p>
            </div>
        </div>
    );
};

export default UserSignup;
