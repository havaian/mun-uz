const express = require('express');
const router = express.Router();
const EventsController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, query, validationResult } = require('express-validator');

// Get all events
router.get('/',
    [
        query('status').optional().isIn(['draft', 'active', 'completed'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await EventsController.getAllEvents(req, res);
    }
);

// Get event by ID
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid event ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await EventsController.getEventById(req, res);
    }
);

// Create new event
router.post('/',
    authenticate,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('startDate').isISO8601().withMessage('Start date must be a valid date'),
        body('endDate').isISO8601().withMessage('End date must be a valid date')
            .custom((value, { req }) => {
                if (new Date(value) <= new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('status').optional().isIn(['draft', 'active', 'completed'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await EventsController.createEvent(req, res);
    }
);

// Update event
router.put('/:id',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid event ID'),
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
        body('endDate').optional().isISO8601().withMessage('End date must be a valid date')
            .custom((value, { req }) => {
                if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('status').optional().isIn(['draft', 'active', 'completed'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await EventsController.updateEvent(req, res);
    }
);

// Delete event
router.delete('/:id',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid event ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await EventsController.deleteEvent(req, res);
    }
);

module.exports = router;