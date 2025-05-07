const mongoose = require('mongoose');

// Define Resolution Schema
const resolutionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    authors: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['draft', 'reviewed', 'accepted', 'rejected', 'working'],
        default: 'draft'
    },
    submissionTime: {
        type: Date,
        default: Date.now
    },
    reviewTime: {
        type: Date
    },
    reviewComments: {
        type: String
    },
    isWorkingDraft: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create model
const Resolution = mongoose.model('Resolution', resolutionSchema);

class ResolutionsModel {
    async getResolutionsForCommittee(committeeId) {
        return Resolution.find({ committeeId }).sort({ submissionTime: -1 });
    }

    async getResolutionById(id) {
        return Resolution.findById(id);
    }

    async getWorkingDraftForCommittee(committeeId) {
        return Resolution.findOne({
            committeeId,
            isWorkingDraft: true
        });
    }

    async createResolution(resolutionData) {
        // Set initial values
        resolutionData.status = 'draft';
        resolutionData.isWorkingDraft = false;
        resolutionData.submissionTime = new Date();

        const newResolution = new Resolution(resolutionData);
        await newResolution.save();
        return newResolution;
    }

    async reviewResolution(id, status, reviewComments) {
        return Resolution.findByIdAndUpdate(
            id,
            {
                status,
                reviewComments,
                reviewTime: new Date()
            },
            { new: true }
        );
    }

    async setAsWorkingDraft(id) {
        // First reset any existing working draft
        await Resolution.updateMany(
            { isWorkingDraft: true },
            {
                isWorkingDraft: false,
                updatedAt: new Date()
            }
        );

        // Then set the new working draft
        return Resolution.findByIdAndUpdate(
            id,
            {
                isWorkingDraft: true,
                status: 'working'
            },
            { new: true }
        );
    }

    async updateResolution(id, resolutionData) {
        return Resolution.findByIdAndUpdate(
            id,
            resolutionData,
            { new: true }
        );
    }

    async confirmCoAuthor(id, countryName) {
        return Resolution.findByIdAndUpdate(
            id,
            {
                $addToSet: { authors: countryName }
            },
            { new: true }
        );
    }
}

module.exports = new ResolutionsModel();