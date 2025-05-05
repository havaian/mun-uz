const StatisticsController = require('./controller');
const Joi = require('joi');

// Define routes for statistics module
async function routes(fastify, options) {
    // Record an activity
    fastify.route({
        method: 'POST',
        url: '/activities',
        preHandler: fastify.authenticate,
        schema: {
            body: Joi.object({
                committeeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                sessionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
                countryName: Joi.string().required(),
                activityType: Joi.string().valid('speech', 'resolution', 'amendment', 'vote', 'proposal').required(),
                duration: Joi.number().integer().min(0).when('activityType', {
                    is: 'speech',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                details: Joi.object().optional()
            }).required(),
            response: {
                201: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        committeeId: { type: 'string' },
                        sessionId: { type: 'string' },
                        countryName: { type: 'string' },
                        activityType: { type: 'string' },
                        duration: { type: 'number' },
                        timestamp: { type: 'string', format: 'date-time' },
                        details: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        },
        handler: StatisticsController.recordActivity.bind(StatisticsController)
    });

    // Get committee statistics
    fastify.route({
        method: 'GET',
        url: '/committees/:committeeId/statistics',
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
                            speeches: { type: 'number' },
                            speechDuration: { type: 'number' },
                            resolutions: { type: 'number' },
                            amendments: { type: 'number' },
                            votes: { type: 'number' },
                            totalActivities: { type: 'number' }
                        }
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
        handler: StatisticsController.getCommitteeStatistics.bind(StatisticsController)
    });

    // Get delegate statistics
    fastify.route({
        method: 'GET',
        url: '/committees/:committeeId/delegates/:countryName/statistics',
        schema: {
            params: {
                committeeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
                countryName: { type: 'string' }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        countryName: { type: 'string' },
                        summary: {
                            type: 'object',
                            properties: {
                                totalActivities: { type: 'number' },
                                speeches: { type: 'number' },
                                speechDuration: { type: 'number' },
                                resolutions: { type: 'number' },
                                amendments: { type: 'number' },
                                votes: { type: 'number' }
                            }
                        },
                        recentActivities: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    committeeId: { type: 'string' },
                                    sessionId: { type: 'string' },
                                    countryName: { type: 'string' },
                                    activityType: { type: 'string' },
                                    duration: { type: 'number' },
                                    timestamp: { type: 'string', format: 'date-time' },
                                    details: { type: 'object' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    updatedAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
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
        handler: StatisticsController.getDelegateStatistics.bind(StatisticsController)
    });

    // Get committee summary
    fastify.route({
        method: 'GET',
        url: '/committees/:committeeId/summary',
        schema: {
            params: {
                committeeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        committeeInfo: {
                            type: 'object',
                            properties: {
                                _id: { type: 'string' },
                                name: { type: 'string' },
                                type: { type: 'string' },
                                status: { type: 'string' },
                                countryCount: { type: 'number' }
                            }
                        },
                        activitySummary: {
                            type: 'object',
                            properties: {
                                totalActivities: { type: 'number' },
                                activityBreakdown: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            _id: { type: 'string' },
                                            count: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        },
                        countrySummary: {
                            type: 'object',
                            properties: {
                                totalCountries: { type: 'number' },
                                mostActive: {
                                    type: 'object',
                                    properties: {
                                        _id: { type: 'string' },
                                        speeches: { type: 'number' },
                                        speechDuration: { type: 'number' },
                                        resolutions: { type: 'number' },
                                        amendments: { type: 'number' },
                                        votes: { type: 'number' },
                                        totalActivities: { type: 'number' }
                                    }
                                },
                                countryBreakdown: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            _id: { type: 'string' },
                                            speeches: { type: 'number' },
                                            speechDuration: { type: 'number' },
                                            resolutions: { type: 'number' },
                                            amendments: { type: 'number' },
                                            votes: { type: 'number' },
                                            totalActivities: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        },
                        sessionSummary: {
                            type: 'object',
                            properties: {
                                totalSessions: { type: 'number' },
                                completedSessions: { type: 'number' },
                                activeSessions: { type: 'number' }
                            }
                        },
                        documentSummary: {
                            type: 'object',
                            properties: {
                                totalResolutions: { type: 'number' },
                                acceptedResolutions: { type: 'number' },
                                workingDrafts: { type: 'number' },
                                totalAmendments: { type: 'number' },
                                acceptedAmendments: { type: 'number' }
                            }
                        },
                        votingSummary: {
                            type: 'object',
                            properties: {
                                totalVotings: { type: 'number' },
                                acceptedItems: { type: 'number' },
                                rejectedItems: { type: 'number' }
                            }
                        }
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
        handler: StatisticsController.getCommitteeSummary.bind(StatisticsController)
    });

    // Export committee statistics as PDF
    fastify.route({
        method: 'GET',
        url: '/committees/:committeeId/export',
        preHandler: fastify.authenticate,
        schema: {
            params: {
                committeeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
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
        handler: StatisticsController.exportCommitteeStatistics.bind(StatisticsController)
    });
}

module.exports = routes;