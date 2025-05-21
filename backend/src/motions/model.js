const mongoose = require('mongoose');

// Define Motion Schema
const motionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    type: {
        type: String,
        enum: [
            'moderated_caucus',
            'unmoderated_caucus',
            'consultation_of_the_whole',
            'adjournment',
            'suspension',
            'closure_of_debate',
            'roll_call_vote',
            'division_of_the_question',
            'introduction_of_draft_resolution',
            'introduction_of_amendment',
            'other'
        ],
        required: true
    },
    proposedBy: {
        type: String,
        required: true
    },
    secondedBy: {
        type: String
    },
    description: {
        type: String
    },
    duration: {
        type: Number // in seconds, for caucuses
    },
    speakerTime: {
        type: Number // individual speaker time for moderated caucuses
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },
    votingResults: {
        yes: {
            type: Number,
            default: 0
        },
        no: {
            type: Number,
            default: 0
        },
        abstain: {
            type: Number,
            default: 0
        }
    },
    priority: {
        type: Number, // for ordering motions by precedence
        default: 0
    }
}, { timestamps: true });

// Create model
const Motion = mongoose.model('Motion', motionSchema);

class MotionsModel {
    async getMotionsForSession(sessionId) {
        return Motion.find({ sessionId }).sort({ createdAt: -1 });
    }

    async getMotionById(id) {
        return Motion.findById(id);
    }

    async createMotion(motionData) {
        // Set initial values
        motionData.status = 'pending';

        const newMotion = new Motion(motionData);
        await newMotion.save();
        return newMotion;
    }

    async updateMotionStatus(id, status, votingResults = null) {
        const updateData = { status };

        if (votingResults) {
            updateData.votingResults = votingResults;
        }

        return Motion.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
    }

    async getPendingMotions(sessionId) {
        return Motion.find({
            sessionId,
            status: 'pending'
        }).sort({ priority: -1, createdAt: 1 });
    }

    // Get priority ordering for different motion types
    getMotionPriority(type) {
        const priorities = {
            'adjournment': 100,
            'suspension': 90,
            'closure_of_debate': 80,
            'roll_call_vote': 70,
            'division_of_the_question': 60,
            'unmoderated_caucus': 50,
            'moderated_caucus': 40,
            'consultation_of_the_whole': 30,
            'introduction_of_draft_resolution': 20,
            'introduction_of_amendment': 10,
            'other': 0
        };

        return priorities[type] || 0;
    }
}

module.exports = new MotionsModel();