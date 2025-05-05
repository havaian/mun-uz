const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

class StatisticsModel {
    constructor() {
        this.collection = getDb().collection('activities');
    }

    async recordActivity(activityData) {
        // Convert IDs to ObjectId
        if (activityData.committeeId && typeof activityData.committeeId === 'string') {
            activityData.committeeId = new ObjectId(activityData.committeeId);
        }

        if (activityData.sessionId && typeof activityData.sessionId === 'string') {
            activityData.sessionId = new ObjectId(activityData.sessionId);
        }

        // Add timestamps
        activityData.timestamp = new Date();
        activityData.createdAt = new Date();
        activityData.updatedAt = new Date();

        const result = await this.collection.insertOne(activityData);
        return { ...activityData, _id: result.insertedId };
    }

    async getCommitteeStatistics(committeeId) {
        const pipeline = [
            {
                $match: { committeeId: new ObjectId(committeeId) }
            },
            {
                $group: {
                    _id: "$countryName",
                    speeches: {
                        $sum: {
                            $cond: [{ $eq: ["$activityType", "speech"] }, 1, 0]
                        }
                    },
                    speechDuration: {
                        $sum: {
                            $cond: [{ $eq: ["$activityType", "speech"] }, "$duration", 0]
                        }
                    },
                    resolutions: {
                        $sum: {
                            $cond: [{ $eq: ["$activityType", "resolution"] }, 1, 0]
                        }
                    },
                    amendments: {
                        $sum: {
                            $cond: [{ $eq: ["$activityType", "amendment"] }, 1, 0]
                        }
                    },
                    votes: {
                        $sum: {
                            $cond: [{ $eq: ["$activityType", "vote"] }, 1, 0]
                        }
                    },
                    totalActivities: { $sum: 1 }
                }
            },
            {
                $sort: { totalActivities: -1 }
            }
        ];

        return this.collection.aggregate(pipeline).toArray();
    }

    async getDelegateStatistics(committeeId, countryName) {
        const pipeline = [
            {
                $match: {
                    committeeId: new ObjectId(committeeId),
                    countryName: countryName
                }
            },
            {
                $sort: { timestamp: -1 }
            }
        ];

        return this.collection.aggregate(pipeline).toArray();
    }

    async getActivityBreakdown(committeeId) {
        const pipeline = [
            {
                $match: { committeeId: new ObjectId(committeeId) }
            },
            {
                $group: {
                    _id: "$activityType",
                    count: { $sum: 1 }
                }
            }
        ];

        return this.collection.aggregate(pipeline).toArray();
    }

    async getCommitteeSummary(committeeId) {
        // Get committee activity statistics
        const activityStats = await this.getActivityBreakdown(committeeId);

        // Get country participation statistics
        const countryStats = await this.getCommitteeStatistics(committeeId);

        // Get session statistics from sessions collection
        const sessionsCollection = getDb().collection('sessions');
        const sessionStats = await sessionsCollection.find({
            committeeId: new ObjectId(committeeId)
        }).toArray();

        // Get resolution statistics from resolutions collection
        const resolutionsCollection = getDb().collection('resolutions');
        const resolutionStats = await resolutionsCollection.find({
            committeeId: new ObjectId(committeeId)
        }).toArray();

        // Get amendment statistics from amendments collection
        const amendmentsCollection = getDb().collection('amendments');
        const amendmentStats = await amendmentsCollection.find({
            committeeId: new ObjectId(committeeId)
        }).toArray();

        // Get voting statistics from votings collection
        const votingsCollection = getDb().collection('votings');
        const votingStats = await votingsCollection.find({
            committeeId: new ObjectId(committeeId)
        }).toArray();

        // Compile summary
        return {
            activitySummary: {
                totalActivities: activityStats.reduce((acc, curr) => acc + curr.count, 0),
                activityBreakdown: activityStats
            },
            countrySummary: {
                totalCountries: countryStats.length,
                mostActive: countryStats.length > 0 ? countryStats[0] : null,
                countryBreakdown: countryStats
            },
            sessionSummary: {
                totalSessions: sessionStats.length,
                completedSessions: sessionStats.filter(s => s.status === 'completed').length,
                activeSessions: sessionStats.filter(s => s.status === 'active').length
            },
            documentSummary: {
                totalResolutions: resolutionStats.length,
                acceptedResolutions: resolutionStats.filter(r => r.status === 'accepted').length,
                workingDrafts: resolutionStats.filter(r => r.isWorkingDraft).length,
                totalAmendments: amendmentStats.length,
                acceptedAmendments: amendmentStats.filter(a => a.status === 'accepted').length
            },
            votingSummary: {
                totalVotings: votingStats.length,
                acceptedItems: votingStats.filter(v => v.result === 'accepted').length,
                rejectedItems: votingStats.filter(v => v.result === 'rejected').length
            }
        };
    }
}

module.exports = new StatisticsModel();