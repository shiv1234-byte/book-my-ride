import React from 'react';

const LocationSearchPanel = ({ suggestions, setPickup, setDestination, activeField }) => {
    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') setPickup(suggestion);
        else setDestination(suggestion);
    };

    return (
        <div>
            {suggestions.map((elem) => (
                <div
                    key={elem.id}
                    onClick={() => handleSuggestionClick(elem)}
                    className="flex gap-4 border-2 p-3 border-gray-50 rounded-xl items-center my-2"
                >
                    <h2 className="bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full">
                        <i className="ri-map-pin-fill"></i>
                    </h2>
                    <h4 className="font-medium">{elem.place_name}</h4>
                </div>
            ))}
        </div>
    );
};

export default LocationSearchPanel;
