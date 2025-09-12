// const rideModel = require('../models/ride.model');
// const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');

// Simple haversine fallback (distance in meters)
function haversineDistance(p1, p2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371e3; // metres
  const φ1 = toRad(p1.lat);
  const φ2 = toRad(p2.lat);
  const Δφ = toRad(p2.lat - p1.lat);
  const Δλ = toRad(p2.lon - p1.lon);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getFare(pickup, destination) {
  if (!pickup || !destination) {
    throw new Error('Pickup and destination are required');
  }

  // Try to get distance & time from map service
  let distanceTime;
  try {
    distanceTime = await mapService.getDistanceTime(pickup, destination);
  } catch (err) {
    console.error('mapService error', err);
    distanceTime = null;
  }

  // Fallback: compute haversine if mapService fails
  if (!distanceTime || !distanceTime.distance || !distanceTime.duration) {
    const [pLng, pLat] =
      typeof pickup === 'string'
        ? pickup.split(',').map(Number)
        : [pickup.lng, pickup.lat];
    const [dLng, dLat] =
      typeof destination === 'string'
        ? destination.split(',').map(Number)
        : [destination.lng, destination.lat];

    const distMeters = haversineDistance(
      { lat: pLat, lon: pLng },
      { lat: dLat, lon: dLng }
    );

    distanceTime = {
      distance: { value: distMeters },
      duration: { value: (distMeters / 1000 / 40) * 60 } // assume avg 40 km/h
    };
  }

  const baseFare = { auto: 30, car: 50, moto: 20 };
  const perKmRate = { auto: 10, car: 15, moto: 8 };
  const perMinuteRate = { auto: 2, car: 3, moto: 1.5 };

  const distanceKm = distanceTime.distance.value / 1000;
  const durationMin = distanceTime.duration.value / 60;

  return {
    auto: Math.round(
      baseFare.auto + distanceKm * perKmRate.auto + durationMin * perMinuteRate.auto
    ),
    car: Math.round(
      baseFare.car + distanceKm * perKmRate.car + durationMin * perMinuteRate.car
    ),
    moto: Math.round(
      baseFare.moto + distanceKm * perKmRate.moto + durationMin * perMinuteRate.moto
    )
  };
}
module.exports.getFare = getFare;

// OTP that works on older Node
function getOtp(num) {
  const min = Math.pow(10, num - 1);
  const max = Math.pow(10, num) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min + '';
}

// create ride
module.exports.createRide = async ({ user, pickup, destination, vehicleType }) => {
  if (!user || !pickup || !destination || !vehicleType) {
    throw new Error('All fields are required');
  }

  const fare = await getFare(pickup, destination);

  const ride = await rideModel.create({
    user,
    pickup,
    destination,
    otp: getOtp(6),
    fare: fare[vehicleType],
    status: 'pending'
  });

  return ride;
};

// confirm ride
module.exports.confirmRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error('Ride id is required');
  }

  await rideModel.findOneAndUpdate(
    { _id: rideId },
    { status: 'accepted', captain: captain._id }
  );

  const ride = await rideModel
    .findOne({ _id: rideId })
    .populate('user')
    .populate('captain')
    .select('+otp');

  if (!ride) throw new Error('Ride not found');

  return ride;
};

// start ride
module.exports.startRide = async ({ rideId, otp, captain }) => {
  if (!rideId || !otp) {
    throw new Error('Ride id and OTP are required');
  }

  const ride = await rideModel
    .findOne({ _id: rideId })
    .populate('user')
    .populate('captain')
    .select('+otp');

  if (!ride) throw new Error('Ride not found');
  if (ride.status !== 'accepted') throw new Error('Ride not accepted');
  if (ride.otp !== otp) throw new Error('Invalid OTP');

  await rideModel.findOneAndUpdate({ _id: rideId }, { status: 'ongoing' });

  return ride;
};

// end ride
module.exports.endRide = async ({ rideId, captain }) => {
  if (!rideId) throw new Error('Ride id is required');

  const ride = await rideModel
    .findOne({ _id: rideId, captain: captain._id })
    .populate('user')
    .populate('captain')
    .select('+otp');

  if (!ride) throw new Error('Ride not found');
  if (ride.status !== 'ongoing') throw new Error('Ride not ongoing');

  await rideModel.findOneAndUpdate({ _id: rideId }, { status: 'completed' });

  return ride;
};
