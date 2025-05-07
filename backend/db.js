const mongoose = require('mongoose');
require('dotenv').config();

// Define connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create schemas and models
    await setupSchemas();
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Setup schemas and create indexes
async function setupSchemas() {
  // Create indexes on collections equivalent to the original code
  // This is separate from schema definition, but ensures the same indexes exist
  
  const db = mongoose.connection.db;
  
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('users').createIndex({ token: 1 });
  await db.collection('committees').createIndex({ eventId: 1 });
  await db.collection('sessions').createIndex({ committeeId: 1 });
  await db.collection('resolutions').createIndex({ committeeId: 1 });
  await db.collection('amendments').createIndex({ resolutionId: 1 });
  await db.collection('votings').createIndex({ committeeId: 1 });
  await db.collection('votings').createIndex({ sessionId: 1 });
  await db.collection('activities').createIndex({ committeeId: 1 });
  await db.collection('activities').createIndex({ sessionId: 1 });
  await db.collection('activities').createIndex({ countryName: 1 });
  
  console.log('Database indexes created');
}

// Graceful disconnection
async function closeConnection() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

module.exports = {
  connectToDatabase,
  closeConnection,
  mongoose
};