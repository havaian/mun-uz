const mongoose = require('mongoose');
const crypto = require('crypto');

// Define Country Schema (as a subdocument)
const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    isPermanentMember: {
        type: Boolean,
        default: false
    },
    hasVetoRight: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    }
});

// Define Committee Schema
const committeeSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['GA', 'SC', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['setup', 'active', 'completed'],
        default: 'setup'
    },
    minResolutionAuthors: {
        type: Number,
        default: 3
    },
    countries: [countrySchema]
}, { timestamps: true });

// Create model
const Committee = mongoose.model('Committee', committeeSchema);

class CommitteesModel {
    async getAllCommittees(filter = {}) {
        return Committee.find(filter);
    }

    async getCommitteesForEvent(eventId) {
        return Committee.find({ eventId });
    }

    async getCommitteeById(id) {
        return Committee.findById(id);
    }

    async createCommittee(committeeData) {
        // Generate tokens for countries if they exist
        if (committeeData.countries && Array.isArray(committeeData.countries)) {
            committeeData.countries = committeeData.countries.map(country => ({
                ...country,
                token: this.generateToken()
            }));
        } else {
            committeeData.countries = [];
        }

        const newCommittee = new Committee(committeeData);
        await newCommittee.save();
        return newCommittee;
    }

    async updateCommittee(id, committeeData) {
        return Committee.findByIdAndUpdate(
            id,
            committeeData,
            { new: true }
        );
    }

    async deleteCommittee(id) {
        return Committee.findByIdAndDelete(id);
    }

    async getCommitteeStatus(id) {
        const committee = await Committee.findById(id);

        if (!committee) {
            return null;
        }

        return {
            _id: committee._id,
            name: committee.name,
            type: committee.type,
            status: committee.status,
            countryCount: committee.countries ? committee.countries.length : 0
        };
    }

    async updateCountry(committeeId, countryName, updates) {
        return Committee.updateOne(
            {
                _id: committeeId,
                'countries.name': countryName
            },
            {
                $set: {
                    'countries.$': { ...updates },
                    updatedAt: new Date()
                }
            }
        );
    }

    async generateQRCodes(committeeId) {
        const committee = await Committee.findById(committeeId);

        if (!committee || !committee.countries) {
            return [];
        }

        // Return country data with tokens for QR code generation
        return committee.countries.map(country => ({
            name: country.name,
            token: country.token,
            committeeId: committee._id,
            committeeName: committee.name
        }));
    }

    generateToken() {
        return crypto.randomBytes(16).toString('hex');
    }
}

module.exports = new CommitteesModel();