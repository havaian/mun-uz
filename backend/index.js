const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { connectToDatabase } = require('./db');
const websocketService = require('./src/websocket/service');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB
connectToDatabase();

const seedDatabase = require('./src/seeds');

// After connecting to the database:
seedDatabase().then(() => {
  console.log('Database seeded, starting server...');
  // Continue with server startup
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // In production, set to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Setup WebSocket with Socket.IO
const io = websocketService.setupSocketIO(server);

// Register routes
app.use('/api/auth', require('./src/auth/routes'));
app.use('/api/events', require('./src/events/routes'));
app.use('/api/committees', require('./src/committees/routes'));
app.use('/api/sessions', require('./src/sessions/routes'));
app.use('/api/resolutions', require('./src/resolutions/routes'));
app.use('/api/amendments', require('./src/amendments/routes'));
app.use('/api/votings', require('./src/votings/routes'));
app.use('/api/statistics', require('./src/statistics/routes'));
app.use('/api/countries', require('./src/countries/routes'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export for testing purposes
module.exports = { app, server };