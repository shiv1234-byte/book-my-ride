import React from 'react';

const LocationSearchPanel = ({
    suggestions,
    setPickup,
    setDestination,
    activeField,
    setPanelOpen
}) => {
    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') setPickup(suggestion);
        else setDestination(suggestion);

        // Hide the panel after selection
        setPanelOpen && setPanelOpen(false);
    };

    return (
        <div className="p-3">
            {suggestions && suggestions.map((item, idx) => (
                <div
                    key={idx}
                    onClick={() => handleSuggestionClick(item)}
                    className="flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start cursor-pointer"
                >
                    <h2 className="bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full">
                        <i className="ri-map-pin-fill"></i>
                    </h2>
                    <h4 className="font-medium">
                        {item.place_name || item.text || item}
                    </h4>
                </div>
            ))}
        </div>
    );
};

export default LocationSearchPanel;
