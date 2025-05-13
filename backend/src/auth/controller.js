const AuthModel = require('./model');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const findCountryByToken = (committees, token) => {
    if (!committees || !Array.isArray(committees) || committees.length === 0) {
        console.log("No committees found or invalid committees array");
        return null;
    }

    // Loop through each committee
    for (const committee of committees) {
        // Check if countries array exists
        if (committee.countries && Array.isArray(committee.countries)) {
            // Find the country with matching token
            const country = committee.countries.find(country => country.token === token);

            if (country) {
                return {
                    committee: committee,
                    country: country
                };
            }
        }
    }

    // If no match found
    return null;
}

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
            // Find committee and country by token
            const Committee = mongoose.model('Committee');

            // Find committee that has a country with the provided token
            const committees = await Committee.find({});
            const result = findCountryByToken(committees, token);

            if (!result) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Extract the committee and country from the result
            const { committee, country } = result;

            // Check if a delegate user already exists
            const User = mongoose.model('User');
            let user = await User.findOne({
                role: 'delegate',
                committeeId: committee._id,
                countryName: country.name
            });

            // If no user exists, create one
            if (!user) {
                user = new User({
                    username: `delegate_${committee._id}_${country.name}`.replace(/\s+/g, '_'),
                    role: 'delegate',
                    token: token,
                    committeeId: committee._id,
                    countryName: country.name
                });
                await user.save();
            } else {
                // Update token if user exists
                user.token = token;
                await user.save();
            }

            // Generate JWT token for session
            const jwtToken = jwt.sign({
                id: user._id,
                username: user.username,
                role: 'delegate',
                countryName: country.name,
                committeeId: committee._id
            }, process.env.JWT_SECRET);

            // Return the token and user information
            return res.json({
                token: jwtToken,
                user: {
                    id: user._id,
                    username: user.username,
                    role: 'delegate',
                    countryName: country.name,
                    committeeId: committee._id
                }
            });
        } catch (error) {
            console.error('Delegate auth error:', error);
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