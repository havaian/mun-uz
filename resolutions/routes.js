const ResolutionsController = require('./controller');
const Joi = require('joi');

// Define routes for resolutions module
async function routes(fastify, options) {
    // Get resolutions for committee
    fastify.route({
        method: 'GET',
        url: '/committees/:committeeId/resolutions',
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
                            title: { type: 'string' },
                            content: { type: 'string' },
                            authors: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                            submissionTime: { type: 'string', format: 'date-time' },
                            reviewTime: { type: 'string', format: 'date-time' },
                            reviewComments: { type: 'string' },
                            isWorkingDraft: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: ResolutionsController.getResolutionsForCommittee.bind(ResolutionsController)
    });

    // Get resolution by ID
    fastify.route({
        method: 'GET',
        url: '/resolutions/:id',
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
                        title: { type: 'string' },
                        content: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                        submissionTime: { type: 'string', format: 'date-time' },
                        reviewTime: { type: 'string', format: 'date-time' },
                        reviewComments: { type: 'string' },
                        isWorkingDraft: { type: 'boolean' },
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
        handler: ResolutionsController.getResolutionById.bind(ResolutionsController)
    });

    // Create new resolution
    fastify.route({
        method: 'POST',
        url: '/resolutions',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                committeeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                title: Joi.string().required(),
                content: Joi.string().required(),
                authors: Joi.array().items(Joi.string()).required().min(1)
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                        submissionTime: { type: 'string', format: 'date-time' },
                        isWorkingDraft: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        minRequired: { type: 'number' }
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
        handler: ResolutionsController.createResolution.bind(ResolutionsController)
    });

    // Review resolution
    fastify.route({
        method: 'PUT',
        url: '/resolutions/:id/review',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                status: Joi.string().valid('accepted', 'rejected').required(),
                reviewComments: Joi.string().allow('', null)
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        title: { type: 'string' },
                        content: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                        submissionTime: { type: 'string', format: 'date-time' },
                        reviewTime: { type: 'string', format: 'date-time' },
                        reviewComments: { type: 'string' },
                        isWorkingDraft: { type: 'boolean' },
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
        handler: ResolutionsController.reviewResolution.bind(ResolutionsController)
    });

    // Set as working draft
    fastify.route({
        method: 'PUT',
        url: '/resolutions/:id/working',
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
                        title: { type: 'string' },
                        content: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                        submissionTime: { type: 'string', format: 'date-time' },
                        reviewTime: { type: 'string', format: 'date-time' },
                        reviewComments: { type: 'string' },
                        isWorkingDraft: { type: 'boolean' },
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
        handler: ResolutionsController.setAsWorkingDraft.bind(ResolutionsController)
    });

    // Confirm co-authorship
    fastify.route({
        method: 'PUT',
        url: '/resolutions/:id/co-author',
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
                        title: { type: 'string' },
                        content: { type: 'string' },
                        authors: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        status: { type: 'string', enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'] },
                        submissionTime: { type: 'string', format: 'date-time' },
                        reviewTime: { type: 'string', format: 'date-time' },
                        reviewComments: { type: 'string' },
                        isWorkingDraft: { type: 'boolean' },
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
        handler: ResolutionsController.confirmCoAuthor.bind(ResolutionsController)
    });
}

module.exports = routes;