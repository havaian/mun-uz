const fastify = require('fastify')({ logger: true });
const path = require('path');
require('dotenv').config();
const { connectToDatabase } = require('./db');
const websocketService = require('./websocket/service');

// Register plugins
fastify.register(require('@fastify/cors'), {
    origin: '*', // In production, set to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
});

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/'
});

fastify.register(require('@fastify/websocket'), {
    options: {
        maxPayload: 1048576, // 1MB
        clientTracking: true
    }
});

// Register WebSocket routes
fastify.register(websocketService.websocketRoute);

// Register Swagger
fastify.register(require('@fastify/swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'MUN.UZ API',
            description: 'API for Model UN platform',
            version: '1.0.0'
        },
        externalDocs: {
            url: 'https://mun.uz',
            description: 'Find more info here'
        },
        host: 'mun.uz',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json']
    },
    exposeRoute: true
});

// Authentication hook
fastify.decorate('authenticate', async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
    }
});

// Make WebSocket service available in routes
fastify.decorate('websocket', websocketService);

// Register routes
fastify.register(require('./auth/routes'), { prefix: '/api/auth' });
fastify.register(require('./events/routes'), { prefix: '/api/events' });
fastify.register(require('./committees/routes'), { prefix: '/api/committees' });
fastify.register(require('./sessions/routes'), { prefix: '/api/sessions' });
fastify.register(require('./resolutions/routes'), { prefix: '/api/resolutions' });
fastify.register(require('./amendments/routes'), { prefix: '/api/amendments' });
fastify.register(require('./votings/routes'), { prefix: '/api/votings' });
fastify.register(require('./statistics/routes'), { prefix: '/api/statistics' });

// Health check route
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
});

// Start the server
const start = async () => {
    try {
        // Connect to MongoDB
        await connectToDatabase();

        await fastify.listen({
            port: process.env.PORT || 3000,
            host: '0.0.0.0'
        });

        console.log(`Server is running on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();