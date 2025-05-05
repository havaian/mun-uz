const { getDb } = require('../../db');
const { ObjectId } = require('mongodb');

class SessionsModel {
    constructor() {
        this.collection = getDb().collection('sessions');
    }

    async getSessionsForCommittee(committeeId) {
        return this.collection.find({
            committeeId: new ObjectId(committeeId)
        }).sort({ number: 1 }).toArray();
    }

    async getSessionById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async getActiveSessionForCommittee(committeeId) {
        return this.collection.findOne({
            committeeId: new ObjectId(committeeId),
            status: 'active'
        });
    }

    async createSession(sessionData) {
        // Convert committeeId to ObjectId
        if (sessionData.committeeId && typeof sessionData.committeeId === 'string') {
            sessionData.committeeId = new ObjectId(sessionData.committeeId);
        }

        // Add timestamps
        sessionData.createdAt = new Date();
        sessionData.updatedAt = new Date();
        sessionData.startTime = new Date();

        // Set initial status to active
        sessionData.status = 'active';

        // Initialize presentCountries array if not provided
        if (!sessionData.presentCountries) {
            sessionData.presentCountries = [];
        }

        // Set quorum to false initially
        sessionData.quorum = false;

        const result = await this.collection.insertOne(sessionData);
        return { ...sessionData, _id: result.insertedId };
    }

    async updateSession(id, sessionData) {
        // Update timestamp
        sessionData.updatedAt = new Date();

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: sessionData }
        );
    }

    async completeSession(id) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: 'completed',
                    endTime: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }

    async updateSessionMode(id, mode) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    mode,
                    updatedAt: new Date()
                }
            }
        );
    }

    async updateRollCall(id, presentCountries) {
        // Calculate quorum - needs at least half of participants
        const quorum = presentCountries.length > 0;

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    presentCountries,
                    quorum,
                    updatedAt: new Date()
                }
            }
        );
    }

    async getSessionCount(committeeId) {
        return this.collection.countDocuments({ committeeId: new ObjectId(committeeId) });
    }
}

module.exports = new SessionsModel();