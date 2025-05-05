const AuthModel = require('./model');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

class AuthController {
    async login(request, reply) {
        const { username, password } = request.body;

        try {
            // Find the user
            const user = await AuthModel.findUserByUsername(username);

            // Check if user exists and password is correct
            if (!user || !(await AuthModel.validatePassword(user, password))) {
                return reply.code(401).send({ error: 'Invalid username or password' });
            }

            // User is found and password is valid, create token
            const token = this.generateToken(user);

            // Update user with new token
            await AuthModel.updateUserToken(user._id, token);

            // Generate JWT token for session
            const jwt = await reply.jwtSign({
                id: user._id,
                username: user.username,
                role: user.role
            });

            // Return the token and user information
            return {
                token: jwt,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async delegateAuth(request, reply) {
        const { token } = request.body;

        try {
            // Find the delegate by token
            const user = await AuthModel.findUserByToken(token);

            if (!user || user.role !== 'delegate') {
                return reply.code(401).send({ error: 'Invalid token' });
            }

            // Generate JWT token for session
            const jwt = await reply.jwtSign({
                id: user._id,
                username: user.username,
                role: user.role,
                countryName: user.countryName,
                committeeId: user.committeeId
            });

            // Return the token and user information
            return {
                token: jwt,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    countryName: user.countryName,
                    committeeId: user.committeeId
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async logout(request, reply) {
        try {
            // Get user ID from JWT token
            const userId = new ObjectId(request.user.id);

            // Update user to remove token
            await AuthModel.logoutUser(userId);

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    generateToken(user) {
        // Generate a random token for delegates
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = new AuthController();