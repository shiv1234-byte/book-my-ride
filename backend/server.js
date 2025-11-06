// server.js

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
require('dotenv').config();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Initialize Socket.io (if implemented)
if (typeof initializeSocket === 'function') {
    initializeSocket(server);
    console.log('🧩 Socket.io initialized');
} else {
    console.warn('⚠️ initializeSocket not found or not a function');
}  // ✅ FIXED: Added closing brace

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unexpected crashes
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});
