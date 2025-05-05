const AmendmentsController = require('./controller');
const Joi = require('joi');

// Define routes for amendments module
async function routes(fastify, options) {
    // Get amendments for resolution
    fastify.route({
        method: 'GET',
        url: '/resolutions/:resolutionId/amendments',
        schema: {
            params: {
                resolutionId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            committeeId: { type: 'string' },
                            resolutionId: { type: 'string' },
                            authors: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            pointNumber: { type: 'number' },
                            newPointAfter: { type: 'number' },
                            actionType: { type: 'string', enum: ['delete', 'modify', 'add'] },
                            content: { type: 'string' },
                            resolutionPart: { type: 'string', enum: ['operative', 'preamble'] },
                            status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: AmendmentsController.getAmendmentsForResolution.bind(AmendmentsController)
    });

    // Get amendment by ID
    fastify.route({
        method: 'GET',
        url: '/amendments/:id',
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
                        resolutionId: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        pointNumber: { type: 'number' },
                        newPointAfter: { type: 'number' },
                        actionType: { type: 'string', enum: ['delete', 'modify', 'add'] },
                        content: { type: 'string' },
                        resolutionPart: { type: 'string', enum: ['operative', 'preamble'] },
                        status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
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
        handler: AmendmentsController.getAmendmentById.bind(AmendmentsController)
    });

    // Create new amendment
    fastify.route({
        method: 'POST',
        url: '/amendments',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                resolutionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                authors: Joi.array().items(Joi.string()).default([]),
                pointNumber: Joi.number().integer().min(1).when('actionType', {
                    is: Joi.valid('delete', 'modify'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                newPointAfter: Joi.number().integer().min(0).when('actionType', {
                    is: 'add',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                actionType: Joi.string().valid('delete', 'modify', 'add').required(),
                content: Joi.string().when('actionType', {
                    is: Joi.valid('modify', 'add'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                resolutionPart: Joi.string().valid('operative', 'preamble').required()
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        resolutionId: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        pointNumber: { type: 'number' },
                        newPointAfter: { type: 'number' },
                        actionType: { type: 'string', enum: ['delete', 'modify', 'add'] },
                        content: { type: 'string' },
                        resolutionPart: { type: 'string', enum: ['operative', 'preamble'] },
                        status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
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
        handler: AmendmentsController.createAmendment.bind(AmendmentsController)
    });

    // Review amendment
    fastify.route({
        method: 'PUT',
        url: '/amendments/:id/review',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                status: Joi.string().valid('accepted', 'rejected').required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        resolutionId: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        pointNumber: { type: 'number' },
                        newPointAfter: { type: 'number' },
                        actionType: { type: 'string', enum: ['delete', 'modify', 'add'] },
                        content: { type: 'string' },
                        resolutionPart: { type: 'string', enum: ['operative', 'preamble'] },
                        status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
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
        handler: AmendmentsController.reviewAmendment.bind(AmendmentsController)
    });
}

module.exports = routes;