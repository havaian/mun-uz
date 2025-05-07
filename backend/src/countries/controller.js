const CountriesModel = require('./model');

class CountriesController {
    async getAllCountries(request, reply) {
        try {
            const countries = await CountriesModel.getAllCountries();
            return countries;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCountryByCode(request, reply) {
        try {
            const { code } = request.params;

            const country = await CountriesModel.getCountryByCode(code);

            if (!country) {
                return reply.code(404).send({ error: 'Country not found' });
            }

            return country;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async searchCountries(request, reply) {
        try {
            const { query, language } = request.query;

            if (!query || query.trim() === '') {
                // Return all countries if no query provided
                const countries = await CountriesModel.getAllCountries();
                return countries;
            }

            // Use the provided language or default to English
            const searchLanguage = language && ['en', 'ru'].includes(language) ? language : 'en';

            const results = await CountriesModel.searchCountries(query, searchLanguage);
            return results;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CountriesController();