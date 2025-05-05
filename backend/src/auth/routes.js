const AuthController = require('./controller');
const Joi = require('joi');

// Define routes for auth module
async function routes(fastify, options) {
    // Login route for admin/presidium
    fastify.route({
        method: 'POST',
        url: '/login',
        schema: {
            body: Joi.object({
                username: Joi.string().required(),
                password: Joi.string().required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                role: { type: 'string' }
                            }
                        }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: AuthController.login.bind(AuthController)
    });

    // Login route for delegates (via token)
    fastify.route({
        method: 'POST',
        url: '/delegate',
        schema: {
            body: Joi.object({
                token: Joi.string().required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                role: { type: 'string' },
                                countryName: { type: 'string' },
                                committeeId: { type: 'string' }
                            }
                        }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: AuthController.delegateAuth.bind(AuthController)
    });

    // Logout route
    fastify.route({
        method: 'POST',
        url: '/logout',
        preHandler: fastify.authenticate,
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' }
                    }
                }
            }
        },
        handler: AuthController.logout.bind(AuthController)
    });
}

module.exports = routes;