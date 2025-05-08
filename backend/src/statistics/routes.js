const express = require('express');
const router = express.Router();
const StatisticsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Record an activity
router.post('/activities', 
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('sessionId').isMongoId().withMessage('Invalid session ID'),
        body('countryName').notEmpty().withMessage('Country name is required'),
        body('activityType').isIn(['speech', 'resolution', 'amendment', 'vote', 'proposal']).withMessage('Invalid activity type'),
        body('duration').optional().isInt({ min: 0 }),
        body('details').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await StatisticsController.recordActivity(req, res);
    }
);

// Get committee statistics
router.get('/committees/:committeeId/statistics', 
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await StatisticsController.getCommitteeStatistics(req, res);
    }
);

// Get delegate statistics
router.get('/committees/:committeeId/delegates/:countryName/statistics', 
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID'),
        param('countryName').notEmpty().withMessage('Country name is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await StatisticsController.getDelegateStatistics(req, res);
    }
);

// Get committee summary
router.get('/committees/:committeeId/summary', 
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await StatisticsController.getCommitteeSummary(req, res);
    }
);

// Export committee statistics as PDF
router.get('/committees/:committeeId/export', 
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await StatisticsController.exportCommitteeStatistics(req, res);
    }
);

module.exports = router;