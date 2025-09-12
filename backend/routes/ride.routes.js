const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create a ride request (User)
router.post(
  '/create',
  authMiddleware.authUser,
  body('pickup')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Invalid pickup address'),
  body('destination')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Invalid destination address'),
  body('vehicleType')
    .isString()
    .isIn(['auto', 'car', 'moto'])
    .withMessage('Invalid vehicle type'),
  rideController.createRide
);

// Get fare for pickup & destination (User)
router.get(
  '/get-fare',
  authMiddleware.authUser,
  query('pickup')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Invalid pickup address'),
  query('destination')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Invalid destination address'),
  rideController.getFare
);

// Captain confirms a ride
router.post(
  '/confirm',
  authMiddleware.authCaptain,
  body('rideId').isMongoId().withMessage('Invalid ride id'),
  rideController.confirmRide
);

// Start a ride (changed from GET to POST to match controller)
router.post(
  '/start-ride',
  authMiddleware.authCaptain,
  body('rideId').isMongoId().withMessage('Invalid ride id'),
  body('otp')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('Invalid OTP'),
  rideController.startRide
);

// End a ride
router.post(
  '/end-ride',
  authMiddleware.authCaptain,
  body('rideId').isMongoId().withMessage('Invalid ride id'),
  rideController.endRide
);

module.exports = router;
