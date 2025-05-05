const { getDb } = require('../../db');
const { ObjectId } = require('mongodb');

class AmendmentsModel {
    constructor() {
        this.collection = getDb().collection('amendments');
    }

    async getAmendmentsForCommittee(committeeId) {
        return this.collection.find({
            committeeId: new ObjectId(committeeId)
        }).sort({ createdAt: -1 }).toArray();
    }

    async getAmendmentsForResolution(resolutionId) {
        return this.collection.find({
            resolutionId: new ObjectId(resolutionId)
        }).sort({
            // Sort by resolution part (operative first, then preamble)
            resolutionPart: 1,
            // Then by action type (delete first, modify, then add)
            actionType: 1,
            // Then by point number
            pointNumber: 1,
            // Then by new point after
            newPointAfter: 1
        }).toArray();
    }

    async getAmendmentById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async createAmendment(amendmentData) {
        // Convert IDs to ObjectId
        if (amendmentData.committeeId && typeof amendmentData.committeeId === 'string') {
            amendmentData.committeeId = new ObjectId(amendmentData.committeeId);
        }

        if (amendmentData.resolutionId && typeof amendmentData.resolutionId === 'string') {
            amendmentData.resolutionId = new ObjectId(amendmentData.resolutionId);
        }

        // Add timestamps
        amendmentData.createdAt = new Date();
        amendmentData.updatedAt = new Date();

        // Set initial status to pending
        amendmentData.status = 'pending';

        const result = await this.collection.insertOne(amendmentData);
        return { ...amendmentData, _id: result.insertedId };
    }

    async reviewAmendment(id, status) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );
    }

    async updateAmendment(id, amendmentData) {
        // Update timestamp
        amendmentData.updatedAt = new Date();

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: amendmentData }
        );
    }
}

module.exports = new AmendmentsModel();