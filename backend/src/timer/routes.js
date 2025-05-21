const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get all timers for a session
router.get('/sessions/:sessionId/timers', 
    authenticate,
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        await controller.getTimers(req, res);
    }
);

// Create a new timer
router.post('/timers', 
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('sessionId').isMongoId().withMessage('Invalid session ID'),
        body('type').isIn(['session', 'speaker', 'custom']).withMessage('Invalid timer type'),
        body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer')
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
        
        await controller.createTimer(req, res);
    }
);

// Start a timer
router.put('/timers/:timerId/start', 
    authenticate,
    [
        param('timerId').isMongoId().withMessage('Invalid timer ID')
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
        
        await controller.startTimer(req, res);
    }
);

// Pause a timer
router.put('/timers/:timerId/pause', 
    authenticate,
    [
        param('timerId').isMongoId().withMessage('Invalid timer ID')
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
        
        await controller.pauseTimer(req, res);
    }
);

// Reset a timer
router.put('/timers/:timerId/reset', 
    authenticate,
    [
        param('timerId').isMongoId().withMessage('Invalid timer ID')
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
        
        await controller.resetTimer(req, res);
    }
);

// Delete a timer
router.delete('/timers/:timerId', 
    authenticate,
    [
        param('timerId').isMongoId().withMessage('Invalid timer ID')
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
        
        await controller.deleteTimer(req, res);
    }
);

// Get remaining time for a timer
router.get('/timers/:timerId/remaining', 
    authenticate,
    [
        param('timerId').isMongoId().withMessage('Invalid timer ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        await controller.getRemainingTime(req, res);
    }
);

module.exports = router;