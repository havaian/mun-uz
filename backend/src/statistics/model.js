const mongoose = require('mongoose');

// Define Activity Schema
const activitySchema = new mongoose.Schema({
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
    countryName: {
        type: String,
        required: true
    },
    activityType: {
        type: String,
        enum: ['speech', 'resolution', 'amendment', 'vote', 'proposal'],
        required: true
    },
    duration: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Create model
const Activity = mongoose.model('Activity', activitySchema);

class StatisticsModel {
    async recordActivity(activityData) {
        // Set timestamp
        activityData.timestamp = new Date();

        const newActivity = new Activity(activityData);
        await newActivity.save();
        return newActivity;
    }

    async getCommitteeStatistics(committeeId) {
        return Activity.aggregate([
            {
                $match: { committeeId: mongoose.Types.ObjectId(committeeId) }
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
        ]);
    }

    async getDelegateStatistics(committeeId, countryName) {
        return Activity.find({
            committeeId,
            countryName
        }).sort({ timestamp: -1 });
    }

    async getActivityBreakdown(committeeId) {
        return Activity.aggregate([
            {
                $match: { committeeId: mongoose.Types.ObjectId(committeeId) }
            },
            {
                $group: {
                    _id: "$activityType",
                    count: { $sum: 1 }
                }
            }
        ]);
    }

    async getCommitteeSummary(committeeId) {
        try {
            const [
                activityStats,
                countryStats,
                sessionCount,
                activeSessionsCount,
                resolutionCount,
                acceptedResolutionsCount,
                workingDraftsCount,
                amendmentCount,
                acceptedAmendmentsCount,
                votingCount,
                acceptedVotingsCount,
                rejectedVotingsCount
            ] = await Promise.all([
                this.getActivityBreakdown(committeeId),
                this.getCommitteeStatistics(committeeId),
                mongoose.model('Session').countDocuments({ committeeId }),
                mongoose.model('Session').countDocuments({ committeeId, status: 'active' }),
                mongoose.model('Resolution').countDocuments({ committeeId }),
                mongoose.model('Resolution').countDocuments({ committeeId, status: 'accepted' }),
                mongoose.model('Resolution').countDocuments({ committeeId, isWorkingDraft: true }),
                mongoose.model('Amendment').countDocuments({ committeeId }),
                mongoose.model('Amendment').countDocuments({ committeeId, status: 'accepted' }),
                mongoose.model('Voting').countDocuments({ committeeId }),
                mongoose.model('Voting').countDocuments({ committeeId, result: 'accepted' }),
                mongoose.model('Voting').countDocuments({ committeeId, result: 'rejected' })
            ]);

            // Get committee info
            const committee = await mongoose.model('Committee').findById(committeeId);

            // Compile summary
            return {
                committeeInfo: committee ? {
                    _id: committee._id,
                    name: committee.name,
                    type: committee.type,
                    status: committee.status,
                    countryCount: committee.countries ? committee.countries.length : 0
                } : null,
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
                    totalSessions: sessionCount,
                    completedSessions: sessionCount - activeSessionsCount,
                    activeSessions: activeSessionsCount
                },
                documentSummary: {
                    totalResolutions: resolutionCount,
                    acceptedResolutions: acceptedResolutionsCount,
                    workingDrafts: workingDraftsCount,
                    totalAmendments: amendmentCount,
                    acceptedAmendments: acceptedAmendmentsCount
                },
                votingSummary: {
                    totalVotings: votingCount,
                    acceptedItems: acceptedVotingsCount,
                    rejectedItems: rejectedVotingsCount
                }
            };
        } catch (error) {
            console.error('Error in getCommitteeSummary:', error);
            throw error;
        }
    }
}

module.exports = new StatisticsModel();