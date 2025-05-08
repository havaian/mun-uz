const express = require('express');
const router = express.Router();
const SessionsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get sessions for committee
router.get('/committee/:committeeId', 
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.getSessionsForCommittee(req, res);
    }
);

// Get session by ID
router.get('/:id', 
    [
        param('id').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.getSessionById(req, res);
    }
);

// Create new session
router.post('/committees/:committeeId/sessions', 
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('presentCountries').optional().isArray()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.createSession(req, res);
    }
);

// Update session mode
router.put('/:id/mode', 
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid session ID'),
        body('mode').isIn(['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'])
            .withMessage('Invalid mode')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.updateSessionMode(req, res);
    }
);

// Update roll call
router.put('/:id/roll-call', 
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid session ID'),
        body('presentCountries').isArray().withMessage('Present countries must be an array')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.updateRollCall(req, res);
    }
);

// Complete session
router.put('/:id/complete', 
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        await SessionsController.completeSession(req, res);
    }
);

module.exports = router;