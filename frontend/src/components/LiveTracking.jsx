import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Make sure your Vite env var starts with VITE_
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const containerStyle = {
    width: '100%',
    height: '100%',
};

const LiveTracking = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [currentPosition, setCurrentPosition] = useState({
        lat: 28.6139, // default Delhi
        lng: 77.209,
    });

    // Initialize map once
    useEffect(() => {
        if (mapRef.current) return; // prevent multiple init

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [currentPosition.lng, currentPosition.lat],
            zoom: 15,
        });

        // add marker initially
        markerRef.current = new mapboxgl.Marker()
            .setLngLat([currentPosition.lng, currentPosition.lat])
            .addTo(mapRef.current);
    }, []);

    // Watch position changes
    useEffect(() => {
        const updatePos = (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });
        };

        navigator.geolocation.getCurrentPosition(updatePos);
        const watchId = navigator.geolocation.watchPosition(updatePos);

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Update marker & center when currentPosition changes
    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            markerRef.current.setLngLat([currentPosition.lng, currentPosition.lat]);
            mapRef.current.setCenter([currentPosition.lng, currentPosition.lat]);
        }
    }, [currentPosition]);

    return (
        <div ref={mapContainerRef} style={containerStyle} />
    );  
};

export default LiveTracking;
