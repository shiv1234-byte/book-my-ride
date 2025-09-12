const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');

/**
 * Create a ride request from user
 */
module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    // 1️⃣ Create ride in DB
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType
    });

    // respond to user immediately
    res.status(201).json(ride);

    // 2️⃣ Broadcast to nearby captains asynchronously
    try {
      const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
      if (
        !pickupCoordinates ||
        typeof pickupCoordinates.lat !== 'number' ||
        typeof pickupCoordinates.lng !== 'number'
      ) {
        console.warn('Invalid coordinates for pickup:', pickup);
        return;
      }

      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        pickupCoordinates.lat,
        pickupCoordinates.lng,
        2 // radius in km
      );

      // populate user info before sending
      const rideWithUser = await rideModel
        .findById(ride._id)
        .populate('user');

      // send to each captain socket
      await Promise.all(
        captainsInRadius.map((captain) =>
          sendMessageToSocketId(captain.socketId, {
            event: 'new-ride',
            data: rideWithUser
          })
        )
      );
    } catch (innerErr) {
      console.error('Broadcast to captains failed:', innerErr.message);
    }
  } catch (err) {
    console.error('createRide error:', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Calculate fare for a pickup/destination pair
 */
module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const [pickupLng, pickupLat] = pickup.split(',').map(Number);
    const [destLng, destLat] = destination.split(',').map(Number);

    if ([pickupLng, pickupLat, destLng, destLat].some((v) => Number.isNaN(v))) {
      return res
        .status(400)
        .json({ message: 'Invalid pickup/destination coordinates' });
    }

    const fare = await rideService.getFare(
      { lat: pickupLat, lng: pickupLng },
      { lat: destLat, lng: destLng }
    );

    return res.status(200).json(fare);
  } catch (err) {
    console.error('getFare error:', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Captain confirms a ride
 */
module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain // added by your captain auth middleware
    });

    // Notify the user who booked
    if (ride.user && ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-confirmed',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('confirmRide error:', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Start a ride
 */
module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.body;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain
    });

    if (ride.user && ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-started',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('startRide error:', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * End a ride
 */
module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({
      rideId,
      captain: req.captain
    });

    if (ride.user && ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-ended',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('endRide error:', err);
    return res.status(500).json({ message: err.message });
  }
};
