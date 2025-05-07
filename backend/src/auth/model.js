const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Define User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'presidium', 'delegate'],
        required: true
    },
    token: {
        type: String
    },
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee'
    },
    countryName: {
        type: String
    }
}, { timestamps: true });

// Create model
const User = mongoose.model('User', userSchema);

class AuthModel {
    async findUserByUsername(username) {
        return User.findOne({ username });
    }

    async findUserByToken(token) {
        return User.findOne({ token });
    }

    async createUser(userData) {
        // Hash password if provided
        if (userData.password) {
            userData.password = await bcryptjs.hash(userData.password, 10);
        }

        // Create new user
        const newUser = new User(userData);
        await newUser.save();

        return newUser;
    }

    async validatePassword(user, password) {
        if (!user || !user.password) return false;
        return bcryptjs.compare(password, user.password);
    }

    async updateUserToken(userId, token) {
        return User.findByIdAndUpdate(
            userId,
            {
                token,
                updatedAt: new Date()
            },
            { new: true }
        );
    }

    async logoutUser(userId) {
        return User.findByIdAndUpdate(
            userId,
            {
                token: null,
                updatedAt: new Date()
            },
            { new: true }
        );
    }
}

module.exports = new AuthModel();