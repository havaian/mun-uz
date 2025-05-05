const SessionsController = require('./controller');
const Joi = require('joi');

// Define routes for sessions module
async function routes(fastify, options) {
    // Get sessions for committee
    fastify.route({
        method: 'GET',
        url: '/committee/:committeeId',
        schema: {
            params: {
                committeeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            committeeId: { type: 'string' },
                            number: { type: 'number' },
                            status: { type: 'string', enum: ['active', 'completed'] },
                            mode: { type: 'string', enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'] },
                            quorum: { type: 'boolean' },
                            presentCountries: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            startTime: { type: 'string', format: 'date-time' },
                            endTime: { type: 'string', format: 'date-time' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: SessionsController.getSessionsForCommittee.bind(SessionsController)
    });

    // Get session by ID
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
                        committeeId: { type: 'string' },
                        number: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'completed'] },
                        mode: { type: 'string', enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'] },
                        quorum: { type: 'boolean' },
                        presentCountries: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
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
        handler: SessionsController.getSessionById.bind(SessionsController)
    });

    // Create new session
    fastify.route({
        method: 'POST',
        url: '/committees/:committeeId/sessions',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                committeeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                presentCountries: Joi.array().items(Joi.string()).default([])
            }).default({}),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        number: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'completed'] },
                        mode: { type: 'string', enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'] },
                        quorum: { type: 'boolean' },
                        presentCountries: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        startTime: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                409: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        activeSessionId: { type: 'string' }
                    }
                }
            }
        },
        handler: SessionsController.createSession.bind(SessionsController)
    });

    // Update session mode
    fastify.route({
        method: 'PUT',
        url: '/:id/mode',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                mode: Joi.string().valid('formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation').required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        number: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'completed'] },
                        mode: { type: 'string', enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'] },
                        quorum: { type: 'boolean' },
                        presentCountries: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
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
        handler: SessionsController.updateSessionMode.bind(SessionsController)
    });

    // Update roll call
    fastify.route({
        method: 'PUT',
        url: '/:id/roll-call',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                presentCountries: Joi.array().items(Joi.string()).required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        number: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'completed'] },
                        mode: { type: 'string', enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'] },
                        quorum: { type: 'boolean' },
                        presentCountries: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
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
        handler: SessionsController.updateRollCall.bind(SessionsController)
    });

    // Complete session
    fastify.route({
        method: 'PUT',
        url: '/:id/complete',
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
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
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
        handler: SessionsController.completeSession.bind(SessionsController)
    });
}

module.exports = routes;