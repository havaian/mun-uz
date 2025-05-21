const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get speaker list for a session
router.get('/sessions/:sessionId/speaker-list', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        await controller.getSpeakerList(req, res);
    }
);

// Create a new speaker list
router.post('/speaker-list', 
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user is admin or presidium
        if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
            return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
        }
        
        await controller.createSpeakerList(req, res);
    }
);

// Add a speaker to the list
router.post('/sessions/:sessionId/speaker-list', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID'),
        body('countryName').notEmpty().withMessage('Country name is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user is presidium
        if (req.user.role !== 'presidium' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - presidium access required' });
        }
        
        await controller.addSpeaker(req, res);
    }
);

// Remove a speaker from the list
router.delete('/sessions/:sessionId/speaker-list/:countryName', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID'),
        param('countryName').notEmpty().withMessage('Country name is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user is presidium
        if (req.user.role !== 'presidium' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - presidium access required' });
        }
        
        await controller.removeSpeaker(req, res);
    }
);

// Move to the next speaker
router.put('/sessions/:sessionId/speaker-list/next', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user is presidium
        if (req.user.role !== 'presidium' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - presidium access required' });
        }
        
        await controller.nextSpeaker(req, res);
    }
);

// Move a speaker to the end of the list
router.put('/sessions/:sessionId/speaker-list/:countryName/move-to-end', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID'),
        param('countryName').notEmpty().withMessage('Country name is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user is presidium
        if (req.user.role !== 'presidium' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden - presidium access required' });
        }
        
        await controller.moveToEnd(req, res);
    }
);

module.exports = router;