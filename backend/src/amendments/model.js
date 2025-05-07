const mongoose = require('mongoose');

// Define Amendment Schema
const amendmentSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    resolutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resolution',
        required: true
    },
    authors: [{
        type: String
    }],
    pointNumber: {
        type: Number
    },
    newPointAfter: {
        type: Number
    },
    actionType: {
        type: String,
        enum: ['delete', 'modify', 'add'],
        required: true
    },
    content: {
        type: String
    },
    resolutionPart: {
        type: String,
        enum: ['operative', 'preamble'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Create model
const Amendment = mongoose.model('Amendment', amendmentSchema);

class AmendmentsModel {
    async getAmendmentsForCommittee(committeeId) {
        return Amendment.find({ committeeId }).sort({ createdAt: -1 });
    }

    async getAmendmentsForResolution(resolutionId) {
        return Amendment.find({ resolutionId }).sort({
            resolutionPart: 1,
            actionType: 1,
            pointNumber: 1,
            newPointAfter: 1
        });
    }

    async getAmendmentById(id) {
        return Amendment.findById(id);
    }

    async createAmendment(amendmentData) {
        // Set initial status to pending
        amendmentData.status = 'pending';

        const newAmendment = new Amendment(amendmentData);
        await newAmendment.save();
        return newAmendment;
    }

    async reviewAmendment(id, status) {
        return Amendment.findByIdAndUpdate(
            id,
            {
                status
            },
            { new: true }
        );
    }

    async updateAmendment(id, amendmentData) {
        return Amendment.findByIdAndUpdate(
            id,
            amendmentData,
            { new: true }
        );
    }
}

module.exports = new AmendmentsModel();