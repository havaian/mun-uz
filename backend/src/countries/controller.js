const CountriesModel = require('./model');

class CountriesController {
    async getAllCountries(req, res) {
        try {
            const countries = await CountriesModel.getAllCountries();
            return res.json(countries);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getCountryByCode(req, res) {
        try {
            const { code } = req.params;

            const country = await CountriesModel.getCountryByCode(code);

            if (!country) {
                return res.status(404).json({ error: 'Country not found' });
            }

            return res.json(country);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async searchCountries(req, res) {
        try {
            const { query, language } = req.query;

            if (!query || query.trim() === '') {
                // Return all countries if no query provided
                const countries = await CountriesModel.getAllCountries();
                return res.json(countries);
            }

            // Use the provided language or default to English
            const searchLanguage = language && ['en', 'ru'].includes(language) ? language : 'en';

            const results = await CountriesModel.searchCountries(query, searchLanguage);
            return res.json(results);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CountriesController();