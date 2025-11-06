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
        console.log(`✅ Client connected: ${socket.id}`);

        // User or captain joins after login
        socket.on('join', async ({ userId, userType }) => {
            if (!userId || !userType) {
                console.log('⚠️ Join event missing userId or userType');
                return;
            }

            try {
                if (userType === 'user') {
                    const user = await userModel.findByIdAndUpdate(
                        userId, 
                        { socketId: socket.id },
                        { new: true }
                    );
                    if (user) {
                        console.log(`✅ User ${userId} joined with socket ${socket.id}`);
                    } else {
                        console.log(`❌ User ${userId} not found in database`);
                    }
                } else if (userType === 'captain') {
                    const captain = await captainModel.findByIdAndUpdate(
                        userId, 
                        { socketId: socket.id },
                        { new: true }
                    );
                    if (captain) {
                        console.log(`✅ Captain ${userId} joined with socket ${socket.id}`);
                        console.log(`📊 Captain current location:`, captain.location);
                    } else {
                        console.log(`❌ Captain ${userId} not found in database`);
                    }
                }
            } catch (err) {
                console.error('❌ Error in join event:', err.message);
            }
        });

        // Captain updates location
        socket.on('update-location-captain', async ({ userId, location }) => {
            if (!location || !location.lat || !location.lng) {
                console.log('⚠️ Invalid location data received:', location);
                return socket.emit('error', { message: 'Invalid location data' });
            }

            try {
                console.log(`📍 Updating captain ${userId} location:`, location);
                
                const updatedCaptain = await captainModel.findByIdAndUpdate(
                    userId,
                    {
                        $set: {
                            'location.lat': location.lat,
                            'location.lng': location.lng,
                        }
                    },
                    { new: true, runValidators: false }
                );

                if (updatedCaptain) {
                    console.log(`✅ Captain ${userId} location SAVED to DB:`, {
                        lat: updatedCaptain.location?.lat,
                        lng: updatedCaptain.location?.lng,
                        socketId: updatedCaptain.socketId
                    });
                } else {
                    console.log(`❌ Captain ${userId} not found in database`);
                }
            } catch (err) {
                console.error('❌ Error updating captain location:', err.message);
                console.error('Full error:', err);
            }
        });

        // Driver accepts ride (optional)
        socket.on('driver:acceptRide', async ({ rideId, captainId, userSocketId }) => {
            console.log(`🚗 Captain ${captainId} accepted ride ${rideId}`);

            // Notify the user directly
            if (userSocketId) {
                io.to(userSocketId).emit('user:rideAccepted', { rideId, captainId });
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    if (io) {
        console.log(`📤 Sending ${messageObject.event} to socket ${socketId}`);
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('❌ Socket.io not initialized.');
    }
};

module.exports = { initializeSocket, sendMessageToSocketId };
