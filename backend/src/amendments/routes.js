const express = require('express');
const router = express.Router();
const AmendmentsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get amendments for resolution
router.get('/resolutions/:resolutionId/amendments',
    [
        param('resolutionId').isMongoId().withMessage('Invalid resolution ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AmendmentsController.getAmendmentsForResolution(req, res);
    }
);

// Get amendment by ID
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid amendment ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AmendmentsController.getAmendmentById(req, res);
    }
);

// Create new amendment
router.post('/',
    authenticate,
    [
        body('resolutionId').isMongoId().withMessage('Invalid resolution ID'),
        body('authors').optional().isArray(),
        body('actionType').isIn(['delete', 'modify', 'add']).withMessage('Invalid action type'),
        body('resolutionPart').isIn(['operative', 'preamble']).withMessage('Invalid resolution part'),
        body('pointNumber').optional().isInt({ min: 1 })
            .custom((value, { req }) => {
                if (['delete', 'modify'].includes(req.body.actionType) && !value) {
                    throw new Error('Point number is required for delete or modify actions');
                }
                return true;
            }),
        body('newPointAfter').optional().isInt({ min: 0 })
            .custom((value, { req }) => {
                if (req.body.actionType === 'add' && value === undefined) {
                    throw new Error('New point after is required for add action');
                }
                return true;
            }),
        body('content').optional()
            .custom((value, { req }) => {
                if (['modify', 'add'].includes(req.body.actionType) && !value) {
                    throw new Error('Content is required for modify or add actions');
                }
                return true;
            })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AmendmentsController.createAmendment(req, res);
    }
);

// Review amendment
router.put('/:id/review',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid amendment ID'),
        body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AmendmentsController.reviewAmendment(req, res);
    }
);

module.exports = router;