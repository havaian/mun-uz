const VotingsModel = require('./model');
const SessionsModel = require('../sessions/model');
const CommitteesModel = require('../committees/model');

class VotingsController {
    async getVotingById(request, reply) {
        try {
            const { id } = request.params;

            const voting = await VotingsModel.getVotingById(id);

            if (!voting) {
                return reply.code(404).send({ error: 'Voting not found' });
            }

            return voting;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createVoting(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const votingData = request.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(votingData.committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (request.user.role === 'presidium' && request.user.committeeId !== votingData.committeeId) {
                return reply.code(403).send({ error: 'Forbidden - you can only create votings for your assigned committee' });
            }

            // Check if there's an active session
            const session = await SessionsModel.getActiveSessionForCommittee(votingData.committeeId);
            if (!session) {
                return reply.code(400).send({ error: 'No active session found for this committee' });
            }

            // Set sessionId from active session
            votingData.sessionId = session._id;

            // Check if there's already an active voting
            const activeVoting = await VotingsModel.getActiveVotingForCommittee(votingData.committeeId);
            if (activeVoting) {
                return reply.code(409).send({
                    error: 'Committee already has an active voting',
                    activeVotingId: activeVoting._id
                });
            }

            // Create new voting
            const newVoting = await VotingsModel.createVoting(votingData);

            return reply.code(201).send(newVoting);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async submitVote(request, reply) {
        try {
            // Check if user is a delegate
            if (request.user.role !== 'delegate') {
                return reply.code(403).send({ error: 'Forbidden - only delegates can vote' });
            }

            const { id } = request.params;
            const { vote } = request.body;

            // Check if voting exists
            const voting = await VotingsModel.getVotingById(id);
            if (!voting) {
                return reply.code(404).send({ error: 'Voting not found' });
            }

            // Check if the delegate belongs to this voting's committee
            if (request.user.committeeId !== voting.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only vote in your assigned committee' });
            }

            // Check if voting is still active
            if (voting.result !== null) {
                return reply.code(400).send({ error: 'Voting is already closed' });
            }

            // Check if the current session is active
            const session = await SessionsModel.getSessionById(voting.sessionId);
            if (!session || session.status !== 'active') {
                return reply.code(400).send({ error: 'Session is not active' });
            }

            // Check if delegate's country is present in the session
            if (!session.presentCountries.includes(request.user.countryName)) {
                return reply.code(400).send({ error: 'Your country is not marked as present in the current session' });
            }

            // Special handling for Security Council veto
            if (voting.type === 'resolution' && committee.type === 'SC') {
                // Get the committee to check if the country has veto right
                const committee = await CommitteesModel.getCommitteeById(voting.committeeId);

                // Find the delegate's country in the committee's countries
                const delegateCountry = committee.countries.find(c => c.name === request.user.countryName);

                // If delegate has veto right and votes against, auto-reject the resolution
                if (delegateCountry && delegateCountry.hasVetoRight && vote === 'no') {
                    // Submit the vote
                    await VotingsModel.submitVote(id, request.user.countryName, vote);

                    // Finalize the voting as rejected due to veto
                    await VotingsModel.finalizeVoting(id, 'rejected');

                    // Return the updated voting
                    const updatedVoting = await VotingsModel.getVotingById(id);
                    return {
                        ...updatedVoting,
                        message: 'Resolution rejected due to permanent member veto'
                    };
                }
            }

            // Submit the vote
            await VotingsModel.submitVote(id, request.user.countryName, vote);

            // Return the updated voting
            const updatedVoting = await VotingsModel.getVotingById(id);
            return updatedVoting;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async finalizeVoting(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;

            // Check if voting exists
            const voting = await VotingsModel.getVotingById(id);
            if (!voting) {
                return reply.code(404).send({ error: 'Voting not found' });
            }

            // If presidium, check if they are assigned to this voting's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== voting.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage votings for your assigned committee' });
            }

            // Check if voting is still active
            if (voting.result !== null) {
                return reply.code(400).send({ error: 'Voting is already closed' });
            }

            // Calculate results
            const { votes } = voting;
            const totalVotes = votes.length;
            const yesVotes = votes.filter(v => v.vote === 'yes').length;
            const noVotes = votes.filter(v => v.vote === 'no').length;
            const abstainVotes = votes.filter(v => v.vote === 'abstain').length;

            // Determine if voting passed
            let result;
            if (voting.requiredMajority === 'qualified') {
                // Need 2/3 majority of yes votes out of non-abstaining votes
                const nonAbstainVotes = yesVotes + noVotes;
                result = (nonAbstainVotes > 0 && yesVotes / nonAbstainVotes >= 2 / 3) ? 'accepted' : 'rejected';
            } else {
                // Need simple majority
                result = (yesVotes > noVotes) ? 'accepted' : 'rejected';
            }

            // Update voting with result
            await VotingsModel.finalizeVoting(id, result);

            // Return the updated voting with stats
            const updatedVoting = await VotingsModel.getVotingById(id);
            return {
                ...updatedVoting,
                stats: {
                    totalVotes,
                    yesVotes,
                    noVotes,
                    abstainVotes,
                    result
                }
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new VotingsController();