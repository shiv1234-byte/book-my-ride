const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // User or captain joins after login
    socket.on('join', async ({ userId, userType }) => {
      if (!userId || !userType) return;

      if (userType === 'user') {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === 'captain') {
        await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
      console.log(`${userType} ${userId} joined with socket ${socket.id}`);
    });

    // Captain updates location
    socket.on('update-location-captain', async ({ userId, location }) => {
      if (!location || !location.lat || !location.lng) {
        return socket.emit('error', { message: 'Invalid location data' });
      }

      await captainModel.findByIdAndUpdate(userId, {
        location: {
          lat: location.lat,
          lng: location.lng,
        },
      });
    });

    // Driver accepts ride (optional, but good to handle in socket)
    socket.on('driver:acceptRide', async ({ rideId, captainId, userSocketId }) => {
      console.log(`Captain ${captainId} accepted ride ${rideId}`);
      // Notify the user directly
      if (userSocketId) {
        io.to(userSocketId).emit('user:rideAccepted', { rideId, captainId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log('Socket.io not initialized.');
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
