const express = require('express');
const router = express.Router();
const VotingsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get voting by ID
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid voting ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await VotingsController.getVotingById(req, res);
    }
);

// Create new voting
router.post('/',
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('type').isIn(['simple', 'roll-call']).withMessage('Type must be simple or roll-call'),
        body('target').isIn(['resolution', 'amendment', 'procedure']).withMessage('Target must be resolution, amendment, or procedure'),
        body('targetId').optional().isMongoId().withMessage('Invalid target ID')
            .custom((value, { req }) => {
                if (['resolution', 'amendment'].includes(req.body.target) && !value) {
                    throw new Error('Target ID is required for resolution or amendment targets');
                }
                return true;
            }),
        body('requiredMajority').isIn(['simple', 'qualified']).withMessage('Required majority must be simple or qualified')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await VotingsController.createVoting(req, res);
    }
);

// Submit vote
router.post('/:id/vote',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid voting ID'),
        body('vote').isIn(['yes', 'no', 'abstain']).withMessage('Vote must be yes, no, or abstain')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await VotingsController.submitVote(req, res);
    }
);

// Finalize voting
router.put('/:id/finalize',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid voting ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await VotingsController.finalizeVoting(req, res);
    }
);

module.exports = router;