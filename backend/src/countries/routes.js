const express = require('express');
const router = express.Router();
const CountriesController = require('./controller');
const { param, query, validationResult } = require('express-validator');

// Get all countries
router.get('/', async (req, res) => {
    await CountriesController.getAllCountries(req, res);
});

// Get country by ISO code
router.get('/:code',
    [
        param('code').isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CountriesController.getCountryByCode(req, res);
    }
);

// Search countries by name
router.get('/search',
    [
        query('query').optional()
    ],
    async (req, res) => {
        await CountriesController.searchCountries(req, res);
    }
);

module.exports = router;