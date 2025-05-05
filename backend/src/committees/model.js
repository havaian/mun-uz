const { getDb } = require('../../db');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

class CommitteesModel {
    constructor() {
        this.collection = getDb().collection('committees');
    }

    async getAllCommittees(filter = {}) {
        return this.collection.find(filter).toArray();
    }

    async getCommitteesForEvent(eventId) {
        return this.collection.find({ eventId: new ObjectId(eventId) }).toArray();
    }

    async getCommitteeById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async createCommittee(committeeData) {
        // Convert eventId to ObjectId
        if (committeeData.eventId && typeof committeeData.eventId === 'string') {
            committeeData.eventId = new ObjectId(committeeData.eventId);
        }

        // Add timestamps
        committeeData.createdAt = new Date();
        committeeData.updatedAt = new Date();

        // Set initial status if not provided
        if (!committeeData.status) {
            committeeData.status = 'setup';
        }

        // Generate tokens for countries if they exist in the data
        if (committeeData.countries && Array.isArray(committeeData.countries)) {
            committeeData.countries = committeeData.countries.map(country => ({
                ...country,
                token: this.generateToken()
            }));
        } else {
            committeeData.countries = [];
        }

        const result = await this.collection.insertOne(committeeData);
        return { ...committeeData, _id: result.insertedId };
    }

    async updateCommittee(id, committeeData) {
        // Convert eventId to ObjectId if it's a string
        if (committeeData.eventId && typeof committeeData.eventId === 'string') {
            committeeData.eventId = new ObjectId(committeeData.eventId);
        }

        // Update timestamp
        committeeData.updatedAt = new Date();

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: committeeData }
        );
    }

    async deleteCommittee(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async getCommitteeStatus(id) {
        const committee = await this.getCommitteeById(id);

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
        return this.collection.updateOne(
            {
                _id: new ObjectId(committeeId),
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
        const committee = await this.getCommitteeById(committeeId);

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