const mongoose = require('mongoose');

// Define Vote Schema (as a subdocument)
const voteSchema = new mongoose.Schema({
    countryName: {
        type: String,
        required: true
    },
    vote: {
        type: String,
        enum: ['yes', 'no', 'abstain'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Define Voting Schema
const votingSchema = new mongoose.Schema({
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
        enum: ['simple', 'roll-call'],
        required: true
    },
    target: {
        type: String,
        enum: ['resolution', 'amendment', 'procedure'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'target'
    },
    requiredMajority: {
        type: String,
        enum: ['simple', 'qualified'],
        required: true
    },
    votes: [voteSchema],
    result: {
        type: String,
        enum: ['accepted', 'rejected', null],
        default: null
    }
}, { timestamps: true });

// Create model
const Voting = mongoose.model('Voting', votingSchema);

class VotingsModel {
    async getVotingsForCommittee(committeeId) {
        return Voting.find({ committeeId }).sort({ createdAt: -1 });
    }

    async getVotingsForSession(sessionId) {
        return Voting.find({ sessionId }).sort({ createdAt: -1 });
    }

    async getVotingById(id) {
        return Voting.findById(id);
    }

    async createVoting(votingData) {
        // Set initial values
        votingData.votes = [];
        votingData.result = null;

        const newVoting = new Voting(votingData);
        await newVoting.save();
        return newVoting;
    }

    async submitVote(id, countryName, vote) {
        const voting = await Voting.findById(id);

        // Check if country has already voted
        const existingVoteIndex = voting.votes.findIndex(v => v.countryName === countryName);

        // If already voted, update vote
        if (existingVoteIndex !== -1) {
            voting.votes[existingVoteIndex].vote = vote;
            voting.votes[existingVoteIndex].timestamp = new Date();
        } else {
            // Otherwise, add new vote
            voting.votes.push({
                countryName,
                vote,
                timestamp: new Date()
            });
        }

        await voting.save();
        return voting;
    }

    async finalizeVoting(id, result) {
        return Voting.findByIdAndUpdate(
            id,
            {
                result
            },
            { new: true }
        );
    }

    async getActiveVotingForCommittee(committeeId) {
        return Voting.findOne({
            committeeId,
            result: null
        });
    }
}

module.exports = new VotingsModel();