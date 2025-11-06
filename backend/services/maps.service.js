const axios = require('axios');
const captainModel = require('../models/captain.model');

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; // put your token in .env

// 1. Address → Coordinates
module.exports.getAddressCoordinate = async (address) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const response = await axios.get(url);
    
    if (response.data.features && response.data.features.length > 0) {
      const [lng, lat] = response.data.features[0].geometry.coordinates;
      return {
        lat,
        lng,
        placeName: response.data.features[0].place_name
      };
    } else {
      throw new Error('Mapbox: No results found');
    }
  } catch (error) {
    console.error('getAddressCoordinate error:', error.response?.data || error.message);
    throw error;
  }
};

// 2. Distance & Duration between two points
module.exports.getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error('Origin and destination are required');
  }

  try {
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);
    
    const coords = `${originLng},${originLat};${destLng},${destLat}`;
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}&annotations=distance,duration`;
    
    const response = await axios.get(url);
    
    if (response.data.code === 'Ok') {
      return {
        distance: { value: response.data.distances[0][1] }, // in meters
        duration: { value: response.data.durations[0][1] }  // in seconds
      };
    } else {
      throw new Error('Mapbox Error: ' + response.data.code);
    }
  } catch (err) {
    console.error('getDistanceTime error:', err.response?.data || err.message);
    throw err;
  }
};

// 3. Autocomplete Place Suggestions
module.exports.getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error('Query input is required');
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?autocomplete=true&country=in&limit=5&access_token=${MAPBOX_TOKEN}`;
    const response = await axios.get(url);
    
    if (response.data.features) {
      return response.data.features; // array of features
    } else {
      throw new Error('Mapbox: no suggestions');
    }
  } catch (err) {
    console.error('getAutoCompleteSuggestions error:', err.response?.data || err.message);
    throw err;
  }
};

// 4. Get captains within radius (FIXED)
module.exports.getCaptainsInTheRadius = async (lat, lng, radius = 10) => {
  try {
    console.log(`🔍 Searching for captains near (${lat}, ${lng}) within ${radius}km`);

    // Find all captains with location data and active socket
    const captains = await captainModel.find({
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null },
      socketId: { $exists: true, $ne: null }
    });

    console.log(`📊 Total captains with location in DB: ${captains.length}`);

    // Filter captains within radius using Haversine formula
    const captainsInRadius = captains.filter((captain) => {
      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        captain.location.lat,
        captain.location.lng
      );
      console.log(`📏 Captain ${captain._id} (${captain.fullname.firstname}) distance: ${distance.toFixed(2)}km`);
      return distance <= radius;
    });

    console.log(`✅ Found ${captainsInRadius.length} captains within ${radius}km`);

    return captainsInRadius;
  } catch (err) {
    console.error('❌ Error in getCaptainsInTheRadius:', err);
    return [];
  }
};

// Helper: Calculate distance between two coordinates (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
