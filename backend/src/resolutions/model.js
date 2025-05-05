const { getDb } = require('../../db');
const { ObjectId } = require('mongodb');

class ResolutionsModel {
    constructor() {
        this.collection = getDb().collection('resolutions');
    }

    async getResolutionsForCommittee(committeeId) {
        return this.collection.find({
            committeeId: new ObjectId(committeeId)
        }).sort({ submissionTime: -1 }).toArray();
    }

    async getResolutionById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async getWorkingDraftForCommittee(committeeId) {
        return this.collection.findOne({
            committeeId: new ObjectId(committeeId),
            isWorkingDraft: true
        });
    }

    async createResolution(resolutionData) {
        // Convert committeeId to ObjectId
        if (resolutionData.committeeId && typeof resolutionData.committeeId === 'string') {
            resolutionData.committeeId = new ObjectId(resolutionData.committeeId);
        }

        // Add timestamps
        resolutionData.createdAt = new Date();
        resolutionData.updatedAt = new Date();
        resolutionData.submissionTime = new Date();

        // Set initial status to draft
        resolutionData.status = 'draft';
        resolutionData.isWorkingDraft = false;

        const result = await this.collection.insertOne(resolutionData);
        return { ...resolutionData, _id: result.insertedId };
    }

    async reviewResolution(id, status, reviewComments) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status,
                    reviewComments,
                    reviewTime: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }

    async setAsWorkingDraft(id) {
        // First reset any existing working draft
        await this.collection.updateMany(
            { isWorkingDraft: true },
            { $set: { isWorkingDraft: false, updatedAt: new Date() } }
        );

        // Then set the new working draft
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isWorkingDraft: true,
                    status: 'working',
                    updatedAt: new Date()
                }
            }
        );
    }

    async updateResolution(id, resolutionData) {
        // Update timestamp
        resolutionData.updatedAt = new Date();

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: resolutionData }
        );
    }

    async confirmCoAuthor(id, countryName) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $addToSet: { authors: countryName },
                $set: { updatedAt: new Date() }
            }
        );
    }
}

module.exports = new ResolutionsModel();