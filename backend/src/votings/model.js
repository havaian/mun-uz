const { getDb } = require('../../db');
const { ObjectId } = require('mongodb');

class VotingsModel {
    constructor() {
        this.collection = getDb().collection('votings');
    }

    async getVotingsForCommittee(committeeId) {
        return this.collection.find({
            committeeId: new ObjectId(committeeId)
        }).sort({ createdAt: -1 }).toArray();
    }

    async getVotingsForSession(sessionId) {
        return this.collection.find({
            sessionId: new ObjectId(sessionId)
        }).sort({ createdAt: -1 }).toArray();
    }

    async getVotingById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async createVoting(votingData) {
        // Convert IDs to ObjectId
        if (votingData.committeeId && typeof votingData.committeeId === 'string') {
            votingData.committeeId = new ObjectId(votingData.committeeId);
        }

        if (votingData.sessionId && typeof votingData.sessionId === 'string') {
            votingData.sessionId = new ObjectId(votingData.sessionId);
        }

        if (votingData.targetId && typeof votingData.targetId === 'string') {
            votingData.targetId = new ObjectId(votingData.targetId);
        }

        // Add timestamps
        votingData.createdAt = new Date();
        votingData.updatedAt = new Date();

        // Initialize votes array if not provided
        if (!votingData.votes) {
            votingData.votes = [];
        }

        // Result initially set to null
        votingData.result = null;

        const result = await this.collection.insertOne(votingData);
        return { ...votingData, _id: result.insertedId };
    }

    async submitVote(id, countryName, vote) {
        // Check if country has already voted
        const voting = await this.getVotingById(id);
        const existingVoteIndex = voting.votes.findIndex(v => v.countryName === countryName);

        // If already voted, update vote
        if (existingVoteIndex !== -1) {
            return this.collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        [`votes.${existingVoteIndex}.vote`]: vote,
                        [`votes.${existingVoteIndex}.timestamp`]: new Date(),
                        updatedAt: new Date()
                    }
                }
            );
        }

        // Otherwise, add new vote
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $push: {
                    votes: {
                        countryName,
                        vote,
                        timestamp: new Date()
                    }
                },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async finalizeVoting(id, result) {
        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    result,
                    updatedAt: new Date()
                }
            }
        );
    }

    async getActiveVotingForCommittee(committeeId) {
        return this.collection.findOne({
            committeeId: new ObjectId(committeeId),
            result: null
        });
    }
}

module.exports = new VotingsModel();