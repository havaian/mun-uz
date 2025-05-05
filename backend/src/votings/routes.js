const VotingsController = require('./controller');
const Joi = require('joi');

// Define routes for votings module
async function routes(fastify, options) {
    // Get voting by ID
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
                        sessionId: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'roll-call'] },
                        target: { type: 'string', enum: ['resolution', 'amendment', 'procedure'] },
                        targetId: { type: 'string' },
                        requiredMajority: { type: 'string', enum: ['simple', 'qualified'] },
                        votes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    countryName: { type: 'string' },
                                    vote: { type: 'string', enum: ['yes', 'no', 'abstain'] },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        result: { type: 'string', enum: ['accepted', 'rejected', null] },
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
        handler: VotingsController.getVotingById.bind(VotingsController)
    });

    // Create new voting
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                committeeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                type: Joi.string().valid('simple', 'roll-call').required(),
                target: Joi.string().valid('resolution', 'amendment', 'procedure').required(),
                targetId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).when('target', {
                    is: Joi.valid('resolution', 'amendment'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                requiredMajority: Joi.string().valid('simple', 'qualified').required()
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        sessionId: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'roll-call'] },
                        target: { type: 'string', enum: ['resolution', 'amendment', 'procedure'] },
                        targetId: { type: 'string' },
                        requiredMajority: { type: 'string', enum: ['simple', 'qualified'] },
                        votes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    countryName: { type: 'string' },
                                    vote: { type: 'string', enum: ['yes', 'no', 'abstain'] },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        result: { type: 'string', enum: ['accepted', 'rejected', null] },
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
                },
                409: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        activeVotingId: { type: 'string' }
                    }
                }
            }
        },
        handler: VotingsController.createVoting.bind(VotingsController)
    });

    // Submit vote
    fastify.route({
        method: 'POST',
        url: '/:id/vote',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                vote: Joi.string().valid('yes', 'no', 'abstain').required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        sessionId: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'roll-call'] },
                        target: { type: 'string', enum: ['resolution', 'amendment', 'procedure'] },
                        targetId: { type: 'string' },
                        requiredMajority: { type: 'string', enum: ['simple', 'qualified'] },
                        votes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    countryName: { type: 'string' },
                                    vote: { type: 'string', enum: ['yes', 'no', 'abstain'] },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        result: { type: 'string', enum: ['accepted', 'rejected', null] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        message: { type: 'string' }
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
        handler: VotingsController.submitVote.bind(VotingsController)
    });

    // Finalize voting
    fastify.route({
        method: 'PUT',
        url: '/:id/finalize',
        preHandler: fastify.authenticate,
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
                        sessionId: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'roll-call'] },
                        target: { type: 'string', enum: ['resolution', 'amendment', 'procedure'] },
                        targetId: { type: 'string' },
                        requiredMajority: { type: 'string', enum: ['simple', 'qualified'] },
                        votes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    countryName: { type: 'string' },
                                    vote: { type: 'string', enum: ['yes', 'no', 'abstain'] },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        result: { type: 'string', enum: ['accepted', 'rejected'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        stats: {
                            type: 'object',
                            properties: {
                                totalVotes: { type: 'number' },
                                yesVotes: { type: 'number' },
                                noVotes: { type: 'number' },
                                abstainVotes: { type: 'number' },
                                result: { type: 'string', enum: ['accepted', 'rejected'] }
                            }
                        }
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
        handler: VotingsController.finalizeVoting.bind(VotingsController)
    });
}

module.exports = routes;