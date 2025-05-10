const express = require('express');
const router = express.Router();
const CommitteesController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get all committees
router.get('/', async (req, res) => {
    await CommitteesController.getAllCommittees(req, res);
});

// Get committees for event
router.get('/event/:eventId',
    [
        param('eventId').isMongoId().withMessage('Invalid event ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.getCommitteesForEvent(req, res);
    }
);

// Get committee by ID
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.getCommitteeById(req, res);
    }
);

// Create new committee
router.post('/',
    authenticate,
    [
        body('eventId').isMongoId().withMessage('Invalid event ID'),
        body('name').notEmpty().withMessage('Name is required'),
        body('type').isIn(['GA', 'SC', 'other']).withMessage('Type must be GA, SC, or other'),
        body('status').optional().isIn(['setup', 'active', 'completed']),
        body('minResolutionAuthors').optional().isInt({ min: 1 }),
        body('countries').optional().isArray()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.createCommittee(req, res);
    }
);

// Update committee
router.put('/:id',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID'),
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('type').optional().isIn(['GA', 'SC', 'other']).withMessage('Type must be GA, SC, or other'),
        body('status').optional().isIn(['setup', 'active', 'completed']),
        body('minResolutionAuthors').optional().isInt({ min: 1 }),
        body('countries').optional().isArray()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.updateCommittee(req, res);
    }
);

// Delete committee
router.delete('/:id',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.deleteCommittee(req, res);
    }
);

// Get committee status
router.get('/:id/status',
    [
        param('id').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.getCommitteeStatus(req, res);
    }
);

// Generate QR codes for committee
router.get('/:id/qrcodes',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.generateQRCodes(req, res);
    }
);

// Assign presidium to committee
router.post('/:id/presidium',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID'),
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.assignPresidium(req, res);
    }
);

// Remove presidium from committee
router.delete('/:id/presidium/:username',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID'),
        param('username').notEmpty().withMessage('Username is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.removePresidium(req, res);
    }
);

router.get('/:id/presidium',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await CommitteesController.getPresidiumMembers(req, res);
    }
);

module.exports = router;