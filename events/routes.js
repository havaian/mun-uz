const EventsController = require('./controller');
const Joi = require('joi');

// Define routes for events module
async function routes(fastify, options) {
    // Get all events
    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: {
                status: { type: 'string', enum: ['draft', 'active', 'completed'] }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            startDate: { type: 'string', format: 'date-time' },
                            endDate: { type: 'string', format: 'date-time' },
                            status: { type: 'string', enum: ['draft', 'active', 'completed'] },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: EventsController.getAllEvents.bind(EventsController)
    });

    // Get event by ID
    fastify.route({
        method: 'GET',
        url: '/:id',
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['draft', 'active', 'completed'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: EventsController.getEventById.bind(EventsController)
    });

    // Create new event
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().required(),
                startDate: Joi.date().iso().required(),
                endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
                status: Joi.string().valid('draft', 'active', 'completed').default('draft')
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['draft', 'active', 'completed'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        handler: EventsController.createEvent.bind(EventsController)
    });

    // Update event
    fastify.route({
        method: 'PUT',
        url: '/:id',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                name: Joi.string(),
                description: Joi.string(),
                startDate: Joi.date().iso(),
                endDate: Joi.date().iso(),
                status: Joi.string().valid('draft', 'active', 'completed')
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['draft', 'active', 'completed'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: EventsController.updateEvent.bind(EventsController)
    });

    // Delete event
    fastify.route({
        method: 'DELETE',
        url: '/:id',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: EventsController.deleteEvent.bind(EventsController)
    });
}

module.exports = routes;