const VotingsModel = require('./model');
const SessionsModel = require('../sessions/model');
const CommitteesModel = require('../committees/model');

class VotingsController {
    async getVotingById(req, res) {
        try {
            const { id } = req.params;

            const voting = await VotingsModel.getVotingById(id);

            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            return res.json(voting);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createVoting(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const votingData = req.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(votingData.committeeId);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (req.user.role === 'presidium' && req.user.committeeId !== votingData.committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only create votings for your assigned committee' });
            }

            // Check if there's an active session
            const session = await SessionsModel.getActiveSessionForCommittee(votingData.committeeId);
            if (!session) {
                return res.status(400).json({ error: 'No active session found for this committee' });
            }

            // Set sessionId from active session
            votingData.sessionId = session._id;

            // Check if there's already an active voting
            const activeVoting = await VotingsModel.getActiveVotingForCommittee(votingData.committeeId);
            if (activeVoting) {
                return res.status(409).json({
                    error: 'Committee already has an active voting',
                    activeVotingId: activeVoting._id
                });
            }

            // Create new voting
            const newVoting = await VotingsModel.createVoting(votingData);

            return res.status(201).json(newVoting);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async submitVote(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can vote' });
            }

            const { id } = req.params;
            const { vote } = req.body;

            // Check if voting exists
            const voting = await VotingsModel.getVotingById(id);
            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            // Check if the delegate belongs to this voting's committee
            if (req.user.committeeId !== voting.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only vote in your assigned committee' });
            }

            // Check if voting is still active
            if (voting.result !== null) {
                return res.status(400).json({ error: 'Voting is already closed' });
            }

            // Check if the current session is active
            const session = await SessionsModel.getSessionById(voting.sessionId);
            if (!session || session.status !== 'active') {
                return res.status(400).json({ error: 'Session is not active' });
            }

            // Check if delegate's country is present in the session
            if (!session.presentCountries.includes(req.user.countryName)) {
                return res.status(400).json({ error: 'Your country is not marked as present in the current session' });
            }

            // Special handling for Security Council veto
            if (voting.type === 'resolution' && committee.type === 'SC') {
                // Get the committee to check if the country has veto right
                const committee = await CommitteesModel.getCommitteeById(voting.committeeId);

                // Find the delegate's country in the committee's countries
                const delegateCountry = committee.countries.find(c => c.name === req.user.countryName);

                // If delegate has veto right and votes against, auto-reject the resolution
                if (delegateCountry && delegateCountry.hasVetoRight && vote === 'no') {
                    // Submit the vote
                    await VotingsModel.submitVote(id, req.user.countryName, vote);

                    // Finalize the voting as rejected due to veto
                    await VotingsModel.finalizeVoting(id, 'rejected');

                    // Return the updated voting
                    const updatedVoting = await VotingsModel.getVotingById(id);
                    return res.json({
                        ...updatedVoting.toObject(),
                        message: 'Resolution rejected due to permanent member veto'
                    });
                }
            }

            // Submit the vote
            await VotingsModel.submitVote(id, req.user.countryName, vote);

            // Return the updated voting
            const updatedVoting = await VotingsModel.getVotingById(id);
            return res.json(updatedVoting);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async finalizeVoting(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;

            // Check if voting exists
            const voting = await VotingsModel.getVotingById(id);
            if (!voting) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            // If presidium, check if they are assigned to this voting's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== voting.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only manage votings for your assigned committee' });
            }

            // Check if voting is still active
            if (voting.result !== null) {
                return res.status(400).json({ error: 'Voting is already closed' });
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
            return res.json({
                ...updatedVoting.toObject(),
                stats: {
                    totalVotes,
                    yesVotes,
                    noVotes,
                    abstainVotes,
                    result
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new VotingsController();