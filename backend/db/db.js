
const mongoose = require('mongoose');
async function connectToDb() {
  try {
    if (!process.env.DB_CONNECT) {
      throw new Error('❌ Missing DB_CONNECT in environment variables');
    }
    await mongoose.connect(process.env.DB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
}
module.exports = connectToDb;
