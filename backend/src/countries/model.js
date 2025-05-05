const countries = require('./data');

class CountriesModel {
    async getAllCountries() {
        // Return all countries
        return countries;
    }

    async getCountryByCode(code) {
        // Find country by ISO code (case insensitive)
        return countries.find(country => country.code.toLowerCase() === code.toLowerCase());
    }

    async searchCountries(query, language = 'en') {
        // Validate language parameter
        if (language !== 'en' && language !== 'ru') {
            language = 'en'; // Default to English if invalid language provided
        }

        // Search countries by name in specified language (case insensitive)
        const searchTerm = query.toLowerCase();
        return countries.filter(country =>
            country.name[language].toLowerCase().includes(searchTerm)
        );
    }
}

module.exports = new CountriesModel();