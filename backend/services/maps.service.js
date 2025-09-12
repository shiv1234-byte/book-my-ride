const axios = require('axios');
const captainModel = require('../models/captain.model');

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN; // put your token in .env

// 1️⃣ Address → Coordinates
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

// 2️⃣ Distance & Duration between two points
// Pass origin and destination as "lat,lng" strings
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
        distance: response.data.distances[0][1], // in meters
        duration: response.data.durations[0][1]  // in seconds
      };
    } else {
      throw new Error(`Mapbox Error: ${response.data.code}`);
    }
  } catch (err) {
    console.error('getDistanceTime error:', err.response?.data || err.message);
    throw err;
  }
};

// 3️⃣ Autocomplete / Place Suggestions
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

// 4️⃣ Captains in the Radius (unchanged, still MongoDB)
module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
  // radius in km
  const captains = await captainModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6371] // [lng, lat] correct order for GeoJSON
      }
    }
  });

  return captains;
};
