const AuthModel = require('./model');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class AuthController {
    async login(req, res) {
        const { username, password } = req.body;

        try {
            // Find the user
            const user = await AuthModel.findUserByUsername(username);

            // Check if user exists and password is correct
            if (!user || !(await AuthModel.validatePassword(user, password))) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // User is found and password is valid, create token
            const token = this.generateToken(user);

            // Update user with new token
            await AuthModel.updateUserToken(user._id, token);

            // Generate JWT token for session
            const jwtToken = jwt.sign({
                id: user._id,
                username: user.username,
                committeeId: user.committeeId,
                role: user.role,
            }, process.env.JWT_SECRET);

            // Return the token and user information
            return res.json({
                token: jwtToken,
                user: {
                    id: user._id,
                    username: user.username,
                    committeeId: user.committeeId,
                    role: user.role,
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async delegateAuth(req, res) {
        const { token } = req.body;

        try {
            // Find the delegate by token
            const user = await AuthModel.findUserByToken(token);

            if (!user || user.role !== 'delegate') {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Generate JWT token for session
            const jwtToken = jwt.sign({
                id: user._id,
                username: user.username,
                role: user.role,
                countryName: user.countryName,
                committeeId: user.committeeId
            }, process.env.JWT_SECRET);

            // Return the token and user information
            return res.json({
                token: jwtToken,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    countryName: user.countryName,
                    committeeId: user.committeeId
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async logout(req, res) {
        try {
            // Get user ID from JWT token
            const userId = new ObjectId(req.user.id);

            // Update user to remove token
            await AuthModel.logoutUser(userId);

            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    generateToken(user) {
        // Generate a random token for delegates
        return crypto.randomBytes(16).toString('hex');
    }

    async generateAdminToken(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { username } = req.params;

            // Find the user
            const user = await AuthModel.findUserByUsername(username);
            if (!user || (user.role !== 'admin' && user.role !== 'presidium')) {
                return res.status(404).json({ error: 'User not found or not eligible for token' });
            }

            // Generate a new token
            const token = this.generateToken(user);
            await AuthModel.updateUserToken(user._id, token);

            // Return the token
            return res.json({
                username: user.username,
                role: user.role,
                token
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AuthController();