const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');

// Create a new ride
module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    console.log('🚗 Creating ride:', { pickup, destination, vehicleType, userId: req.user._id });

    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType
    });

    console.log('✅ Ride created:', ride._id);

    // Send response immediately
    res.status(201).json(ride);

    // Broadcast to nearby captains (async, don't block response)
    try {
      let pickupCoordinates;
      
      // Check if pickup is already in "lat,lng" format
      if (typeof pickup === 'string' && pickup.includes(',')) {
        const [lat, lng] = pickup.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          pickupCoordinates = { lat, lng };
        }
      }
      
      // Otherwise, try to geocode the address
      if (!pickupCoordinates) {
        pickupCoordinates = await mapService.getAddressCoordinate(pickup);
      }

      if (
        !pickupCoordinates ||
        typeof pickupCoordinates.lat !== 'number' ||
        typeof pickupCoordinates.lng !== 'number'
      ) {
        console.warn('⚠️ Invalid coordinates for pickup:', pickup);
        return;
      }

      console.log('📍 Pickup coordinates:', pickupCoordinates);

      // Find nearby captains
      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        pickupCoordinates.lat,
        pickupCoordinates.lng,
        10 // radius in km
      );

      console.log(`📢 Found ${captainsInRadius.length} captains nearby`);

      if (captainsInRadius.length === 0) {
        console.log('⚠️ No captains available in the area');
        return;
      }

      // Get ride with populated user data
      const rideWithUser = await rideModel
        .findById(ride._id)
        .populate('user');

      // Send ride request to all nearby captains
      const broadcastPromises = captainsInRadius.map((captain) => {
        if (!captain.socketId) {
          console.log(`⚠️ Captain ${captain._id} has no socketId`);
          return Promise.resolve();
        }

        console.log(`📤 Sending ride to captain ${captain._id} (socket: ${captain.socketId})`);
        
        return sendMessageToSocketId(captain.socketId, {
          event: 'new-ride',
          data: {
            rideId: rideWithUser._id,
            pickup: rideWithUser.pickup,
            destination: rideWithUser.destination,
            fare: rideWithUser.fare,
            vehicleType: rideWithUser.vehicleType,
            otp: rideWithUser.otp,
            user: {
              name: rideWithUser.user.fullname.firstname + ' ' + rideWithUser.user.fullname.lastname,
              phone: rideWithUser.user.email
            }
          }
        });
      });

      await Promise.all(broadcastPromises);
      console.log('✅ Ride broadcasted to all nearby captains');

    } catch (innerErr) {
      console.error('❌ Broadcast to captains failed:', innerErr.message);
    }
  } catch (err) {
    console.error('❌ createRide error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create ride' });
  }
};

// Get fare estimate
module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    console.log('💰 Calculating fare:', { pickup, destination });

    // Parse coordinates properly (format: "lat,lng")
    const [pickupLat, pickupLng] = pickup.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);

    if ([pickupLat, pickupLng, destLat, destLng].some((v) => isNaN(v))) {
      console.error('❌ Invalid coordinates:', { pickup, destination });
      return res.status(400).json({ 
        message: 'Invalid pickup/destination coordinates. Format should be "lat,lng"' 
      });
    }

    const fare = await rideService.getFare(
      { lat: pickupLat, lng: pickupLng },
      { lat: destLat, lng: destLng }
    );

    console.log('✅ Fare calculated:', fare);
    return res.status(200).json(fare);
  } catch (err) {
    console.error('❌ getFare error:', err);
    return res.status(500).json({ message: err.message || 'Failed to calculate fare' });
  }
};

// Captain confirms ride
module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    console.log('✅ Captain confirming ride:', { rideId, captainId: req.captain._id });

    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain._id
    });

    // Notify user that ride was confirmed
    if (ride.user && ride.user.socketId) {
      console.log('📤 Notifying user about ride confirmation');
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-confirmed',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('❌ confirmRide error:', err);
    return res.status(500).json({ message: err.message || 'Failed to confirm ride' });
  }
};

// Captain starts ride
module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.body;

  try {
    console.log('🚀 Starting ride:', { rideId, otp, captainId: req.captain._id });

    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain._id
    });

    // Notify user that ride has started
    if (ride.user && ride.user.socketId) {
      console.log('📤 Notifying user that ride started');
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-started',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('❌ startRide error:', err);
    return res.status(500).json({ message: err.message || 'Failed to start ride' });
  }
};

// Captain ends ride
module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    console.log('🏁 Ending ride:', { rideId, captainId: req.captain._id });

    const ride = await rideService.endRide({
      rideId,
      captain: req.captain._id
    });

    // Notify user that ride has ended
    if (ride.user && ride.user.socketId) {
      console.log('📤 Notifying user that ride ended');
      sendMessageToSocketId(ride.user.socketId, {
        event: 'ride-ended',
        data: ride
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.error('❌ endRide error:', err);
    return res.status(500).json({ message: err.message || 'Failed to end ride' });
  }
};
