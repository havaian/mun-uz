const express = require('express');
const router = express.Router();
const ResolutionsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get resolutions for committee
router.get('/committees/:committeeId/resolutions',
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.getResolutionsForCommittee(req, res);
    }
);

// Get resolution by ID
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid resolution ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.getResolutionById(req, res);
    }
);

// Create new resolution
router.post('/',
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('title').notEmpty().withMessage('Title is required'),
        body('content').notEmpty().withMessage('Content is required'),
        body('authors').isArray().withMessage('Authors must be an array').notEmpty().withMessage('At least one author is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.createResolution(req, res);
    }
);

// Review resolution
router.put('/:id/review',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid resolution ID'),
        body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
        body('reviewComments').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.reviewResolution(req, res);
    }
);

// Set as working draft
router.put('/:id/working',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid resolution ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.setAsWorkingDraft(req, res);
    }
);

// Confirm co-authorship
router.put('/:id/co-author',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid resolution ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.confirmCoAuthor(req, res);
    }
);

router.get('/committees/:committeeId/delegate-resolutions',
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.getDelegateResolutions(req, res);
    }
);

router.post('/structured',
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('title').notEmpty().withMessage('Title is required'),
        body('preambleClauses').isArray().withMessage('Preamble clauses must be an array'),
        body('operativeClauses').isArray().withMessage('Operative clauses must be an array'),
        body('authors').isArray().withMessage('Authors must be an array').notEmpty().withMessage('At least one author is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.createStructuredResolution(req, res);
    }
);

// Apply amendment to resolution
router.post('/:resolutionId/amendments/:amendmentId/apply',
    authenticate,
    [
        param('resolutionId').isMongoId().withMessage('Invalid resolution ID'),
        param('amendmentId').isMongoId().withMessage('Invalid amendment ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await ResolutionsController.applyAmendment(req, res);
    }
);

module.exports = router;