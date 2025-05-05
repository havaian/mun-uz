const CommitteesController = require('./controller');
const Joi = require('joi');

// Define routes for committees module
async function routes(fastify, options) {
    // Get all committees
    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            eventId: { type: 'string' },
                            name: { type: 'string' },
                            type: { type: 'string' },
                            status: { type: 'string' },
                            minResolutionAuthors: { type: 'number' },
                            countries: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        isPermanentMember: { type: 'boolean' },
                                        hasVetoRight: { type: 'boolean' },
                                        token: { type: 'string' }
                                    }
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: CommitteesController.getAllCommittees.bind(CommitteesController)
    });

    // Get committees for event
    fastify.route({
        method: 'GET',
        url: '/event/:eventId',
        schema: {
            params: {
                eventId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            eventId: { type: 'string' },
                            name: { type: 'string' },
                            type: { type: 'string' },
                            status: { type: 'string' },
                            minResolutionAuthors: { type: 'number' },
                            countries: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        isPermanentMember: { type: 'boolean' },
                                        hasVetoRight: { type: 'boolean' },
                                        token: { type: 'string' }
                                    }
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        },
        handler: CommitteesController.getCommitteesForEvent.bind(CommitteesController)
    });

    // Get committee by ID
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
                        eventId: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        status: { type: 'string' },
                        minResolutionAuthors: { type: 'number' },
                        countries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    isPermanentMember: { type: 'boolean' },
                                    hasVetoRight: { type: 'boolean' },
                                    token: { type: 'string' }
                                }
                            }
                        },
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
        handler: CommitteesController.getCommitteeById.bind(CommitteesController)
    });

    // Create new committee
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                eventId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                name: Joi.string().required(),
                type: Joi.string().valid('GA', 'SC', 'other').required(),
                status: Joi.string().valid('setup', 'active', 'completed').default('setup'),
                minResolutionAuthors: Joi.number().integer().min(1).default(3),
                countries: Joi.array().items(
                    Joi.object({
                        name: Joi.string().required(),
                        isPermanentMember: Joi.boolean().default(false),
                        hasVetoRight: Joi.boolean().default(false)
                    })
                ).default([])
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        eventId: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        status: { type: 'string' },
                        minResolutionAuthors: { type: 'number' },
                        countries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    isPermanentMember: { type: 'boolean' },
                                    hasVetoRight: { type: 'boolean' },
                                    token: { type: 'string' }
                                }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        handler: CommitteesController.createCommittee.bind(CommitteesController)
    });

    // Update committee
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
                type: Joi.string().valid('GA', 'SC', 'other'),
                status: Joi.string().valid('setup', 'active', 'completed'),
                minResolutionAuthors: Joi.number().integer().min(1),
                countries: Joi.array().items(
                    Joi.object({
                        name: Joi.string().required(),
                        isPermanentMember: Joi.boolean().default(false),
                        hasVetoRight: Joi.boolean().default(false),
                        token: Joi.string()
                    })
                )
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        eventId: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        status: { type: 'string' },
                        minResolutionAuthors: { type: 'number' },
                        countries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    isPermanentMember: { type: 'boolean' },
                                    hasVetoRight: { type: 'boolean' },
                                    token: { type: 'string' }
                                }
                            }
                        },
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
        handler: CommitteesController.updateCommittee.bind(CommitteesController)
    });

    // Delete committee
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
        handler: CommitteesController.deleteCommittee.bind(CommitteesController)
    });

    // Get committee status
    fastify.route({
        method: 'GET',
        url: '/:id/status',
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
                        type: { type: 'string' },
                        status: { type: 'string' },
                        countryCount: { type: 'number' }
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
        handler: CommitteesController.getCommitteeStatus.bind(CommitteesController)
    });

    // Generate QR codes for committee
    fastify.route({
        method: 'GET',
        url: '/:id/qrcodes',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'string',
                    format: 'binary'
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: CommitteesController.generateQRCodes.bind(CommitteesController)
    });

    // Assign presidium to committee
    fastify.route({
        method: 'POST',
        url: '/:id/presidium',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            body: Joi.object({
                username: Joi.string().required(),
                password: Joi.string().required()
            }).required(),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                _id: { type: 'string' },
                                username: { type: 'string' },
                                role: { type: 'string' },
                                committeeId: { type: 'string' }
                            }
                        }
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
                        error: { type: 'string' }
                    }
                }
            }
        },
        handler: CommitteesController.assignPresidium.bind(CommitteesController)
    });

    // Remove presidium from committee
    fastify.route({
        method: 'DELETE',
        url: '/:id/presidium/:username',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                username: { type: 'string' }
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
        handler: CommitteesController.removePresidium.bind(CommitteesController)
    });
}

module.exports = routes;