const express = require('express');
const router = express.Router();
const MessagesController = require('./controller');
const authenticate = require('../middleware/authenticate');
const { body, param, validationResult } = require('express-validator');

// Get messages for country
router.get('/committees/:committeeId/messages',
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MessagesController.getMessagesForCountry(req, res);
    }
);

// Get sent messages
router.get('/committees/:committeeId/messages/sent',
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MessagesController.getSentMessages(req, res);
    }
);

// Create new message
router.post('/messages',
    authenticate,
    [
        body('committeeId').isMongoId().withMessage('Invalid committee ID'),
        body('recipientCountry').optional().isString().withMessage('Recipient country must be a string'),
        body('content').notEmpty().withMessage('Content is required'),
        body('isCommitteeWide').optional().isBoolean().withMessage('isCommitteeWide must be a boolean')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MessagesController.createMessage(req, res);
    }
);

// Mark message as read
router.put('/messages/:id/read',
    authenticate,
    [
        param('id').isMongoId().withMessage('Invalid message ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MessagesController.markAsRead(req, res);
    }
);

// Get unread message count
router.get('/committees/:committeeId/messages/unread',
    authenticate,
    [
        param('committeeId').isMongoId().withMessage('Invalid committee ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await MessagesController.getUnreadCount(req, res);
    }
);

module.exports = router;