const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        db = client.db();

        // Create indexes for better performance
        await createIndexes();

        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

async function createIndexes() {
    // Create indexes for collections to improve query performance
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
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase first.');
    }
    return db;
}

async function closeConnection() {
    await client.close();
    console.log('MongoDB connection closed');
}

module.exports = {
    connectToDatabase,
    getDb,
    closeConnection
};