const express = require('express');
const router = express.Router();
const MotionsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get motions for session
router.get('/sessions/:sessionId/motions',
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.getMotionsForSession(req, res);
    }
);

// Get pending motions for session
router.get('/sessions/:sessionId/motions/pending',
    [
        param('sessionId').isMongoId().withMessage('Invalid session ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.getPendingMotions(req, res);
    }
);

// Get motion by ID
router.get('/motions/:id',
    [
        param('id').isMongoId().withMessage('Invalid motion ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.getMotionById(req, res);
    }
);

// Create new motion
router.post('/motions',
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('sessionId').isMongoId().withMessage('Invalid session ID'),
        body('type').isIn([
            'moderated_caucus',
            'unmoderated_caucus',
            'consultation_of_the_whole',
            'adjournment',
            'suspension',
            'closure_of_debate',
            'roll_call_vote',
            'division_of_the_question',
            'introduction_of_draft_resolution',
            'introduction_of_amendment',
            'other'
        ]).withMessage('Invalid motion type'),
        body('description').optional(),
        body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
        body('speakerTime').optional().isInt({ min: 0 }).withMessage('Speaker time must be a positive integer')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.createMotion(req, res);
    }
);

// Update motion status
router.put('/motions/:id/status',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid motion ID'),
        body('status').isIn(['accepted', 'rejected', 'expired']).withMessage('Status must be accepted, rejected, or expired'),
        body('votingResults').optional().isObject()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.updateMotionStatus(req, res);
    }
);

// Second a motion
router.put('/motions/:id/second',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid motion ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MotionsController.secondMotion(req, res);
    }
);

module.exports = router;