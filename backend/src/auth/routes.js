const express = require('express');
const router = express.Router();
const AuthController = require('./controller');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');

// Login route for admin/presidium
router.post('/login',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AuthController.login(req, res);
    }
);

router.get('/token/:username', authenticate, async (req, res) => {
    await AuthController.generateAdminToken(req, res);
});

// Login route for delegates (via token)
router.post('/delegate',
    [
        body('token').notEmpty().withMessage('Token is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        await AuthController.delegateAuth(req, res);
    }
);

// Logout route
router.post('/logout', authenticate, async (req, res) => {
    await AuthController.logout(req, res);
});

module.exports = router;