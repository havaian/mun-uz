const CountriesController = require('./controller');

// Define routes for countries module
async function routes(fastify, options) {
    // Get all countries
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
                            name: { type: 'string' },
                            code: { type: 'string' }
                        }
                    }
                }
            }
        },
        handler: CountriesController.getAllCountries.bind(CountriesController)
    });

    // Get country by ISO code
    fastify.route({
        method: 'GET',
        url: '/:code',
        schema: {
            params: {
                code: { type: 'string', minLength: 2, maxLength: 2 }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        code: { type: 'string' }
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
        handler: CountriesController.getCountryByCode.bind(CountriesController)
    });

    // Search countries by name
    fastify.route({
        method: 'GET',
        url: '/search',
        schema: {
            querystring: {
                query: { type: 'string' }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            code: { type: 'string' }
                        }
                    }
                }
            }
        },
        handler: CountriesController.searchCountries.bind(CountriesController)
    });
}

module.exports = routes;