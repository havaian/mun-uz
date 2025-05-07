const mongoose = require('mongoose');

// Define Session Schema
const sessionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    mode: {
        type: String,
        enum: ['formal', 'informal_moderated', 'informal_unmoderated', 'informal_consultation'],
        default: 'formal'
    },
    quorum: {
        type: Boolean,
        default: false
    },
    presentCountries: [{
        type: String
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    }
}, { timestamps: true });

// Create model
const Session = mongoose.model('Session', sessionSchema);

class SessionsModel {
    async getSessionsForCommittee(committeeId) {
        return Session.find({ committeeId }).sort({ number: 1 });
    }

    async getSessionById(id) {
        return Session.findById(id);
    }

    async getActiveSessionForCommittee(committeeId) {
        return Session.findOne({
            committeeId,
            status: 'active'
        });
    }

    async createSession(sessionData) {
        // Set initial values
        sessionData.status = 'active';
        sessionData.startTime = new Date();

        // Initialize presentCountries array if not provided
        if (!sessionData.presentCountries) {
            sessionData.presentCountries = [];
        }

        // Set quorum to false initially
        sessionData.quorum = false;

        const newSession = new Session(sessionData);
        await newSession.save();
        return newSession;
    }

    async updateSession(id, sessionData) {
        return Session.findByIdAndUpdate(
            id,
            sessionData,
            { new: true }
        );
    }

    async completeSession(id) {
        return Session.findByIdAndUpdate(
            id,
            {
                status: 'completed',
                endTime: new Date()
            },
            { new: true }
        );
    }

    async updateSessionMode(id, mode) {
        return Session.findByIdAndUpdate(
            id,
            {
                mode
            },
            { new: true }
        );
    }

    async updateRollCall(id, presentCountries) {
        // Calculate quorum - needs at least half of participants
        const quorum = presentCountries.length > 0;

        return Session.findByIdAndUpdate(
            id,
            {
                presentCountries,
                quorum
            },
            { new: true }
        );
    }

    async getSessionCount(committeeId) {
        return Session.countDocuments({ committeeId });
    }
}

module.exports = new SessionsModel();