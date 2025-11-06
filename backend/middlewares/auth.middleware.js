
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const captainModel = require('../models/captain.model');
const blackListTokenModel = require('../models/blacklistToken.model');

const getToken = (req) => req.cookies.token || req.headers.authorization?.split(' ')[1];


module.exports.authUser = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    const isBlacklisted = await blackListTokenModel.findOne({ token });
    if (isBlacklisted) return res.status(401).json({ message: 'Unauthorized: Token blacklisted' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded._id);
    if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error('User Auth Error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};


module.exports.authCaptain = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    const isBlacklisted = await blackListTokenModel.findOne({ token });
    if (isBlacklisted) return res.status(401).json({ message: 'Unauthorized: Token blacklisted' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const captain = await captainModel.findById(decoded._id);
    if (!captain) return res.status(401).json({ message: 'Unauthorized: Captain not found' });

    req.captain = captain;
    next();
  } catch (err) {
    console.error('Captain Auth Error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
