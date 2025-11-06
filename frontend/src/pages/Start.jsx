import React from 'react';
import { Link } from 'react-router-dom';
import logo3 from './logo3.png';
import bg from './homepage_bg.png'

const Start = () => {
    return (
        <div>
            <div
                className="h-screen pt-8 flex justify-between flex-col w-full bg-cover bg-center"
  style={{ backgroundImage: `url(${bg})` }}
>
                <img
                    className="w-16 ml-8"
                    src={logo3}
                    alt="Uber Logo"
                />
                <div className="bg-white pb-7 py-4 px-4">
                    <h2 className="text-[30px] font-semibold">Get Started with Uber</h2>
                    <Link
                        to="/login"
                        className="flex items-center justify-center w-full bg-black text-white py-3 rounded-lg mt-5"
                    >
                        Continue
                    </Link>
                </div>
            </div>
        </div>
    );  // ✅ FIXED: Added complete return statement
};

export default Start;
