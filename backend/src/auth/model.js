const { getDb } = require('../../db');
const bcrypt = require('bcrypt');

class AuthModel {
    constructor() {
        this.collection = getDb().collection('users');
    }

    async findUserByUsername(username) {
        return this.collection.findOne({ username });
    }

    async findUserByToken(token) {
        return this.collection.findOne({ token });
    }

    async createUser(userData) {
        // Hash password if provided
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        // Set creation timestamp
        userData.createdAt = new Date();
        userData.updatedAt = new Date();

        const result = await this.collection.insertOne(userData);
        return { ...userData, _id: result.insertedId };
    }

    async validatePassword(user, password) {
        if (!user || !user.password) return false;
        return bcrypt.compare(password, user.password);
    }

    async updateUserToken(userId, token) {
        return this.collection.updateOne(
            { _id: userId },
            {
                $set: {
                    token,
                    updatedAt: new Date()
                }
            }
        );
    }

    async logoutUser(userId) {
        return this.collection.updateOne(
            { _id: userId },
            {
                $set: {
                    token: null,
                    updatedAt: new Date()
                }
            }
        );
    }
}

module.exports = new AuthModel();