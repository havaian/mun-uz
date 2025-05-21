const MotionsModel = require('./model');
const SessionsModel = require('../sessions/model');
const StatisticsModel = require('../statistics/model');
const WebSocketService = require('../websocket/service');

class MotionsController {
    async getMotionsForSession(req, res) {
        try {
            const { sessionId } = req.params;

            const motions = await MotionsModel.getMotionsForSession(sessionId);

            return res.json(motions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getMotionById(req, res) {
        try {
            const { id } = req.params;

            const motion = await MotionsModel.getMotionById(id);

            if (!motion) {
                return res.status(404).json({ error: 'Motion not found' });
            }

            return res.json(motion);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createMotion(req, res) {
        try {
            // Check if user is a delegate or presidium
            if (req.user.role !== 'delegate' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - only delegates or presidium can propose motions' });
            }

            const motionData = req.body;

            // Check if session exists and is active
            const session = await SessionsModel.getSessionById(motionData.sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            if (session.status !== 'active') {
                return res.status(400).json({ error: 'Cannot propose motions in an inactive session' });
            }

            // Check if the user belongs to this session's committee
            if (req.user.committeeId !== session.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only propose motions in your assigned committee' });
            }

            // If user is a delegate, set the proposedBy field to their country
            if (req.user.role === 'delegate') {
                motionData.proposedBy = req.user.countryName;
            }

            // Calculate motion priority based on its type
            motionData.priority = MotionsModel.getMotionPriority(motionData.type);

            // Create the motion
            const newMotion = await MotionsModel.createMotion(motionData);

            // Record activity for statistics
            if (req.user.role === 'delegate') {
                await StatisticsModel.recordActivity({
                    committeeId: session.committeeId,
                    sessionId: session._id,
                    countryName: req.user.countryName,
                    activityType: 'proposal',
                    details: {
                        motionType: motionData.type,
                        motionId: newMotion._id
                    }
                });
            }

            // Notify all clients about the new motion
            WebSocketService.broadcastToCommittee(session.committeeId, {
                type: 'motion_proposed',
                motion: newMotion
            });

            return res.status(201).json(newMotion);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateMotionStatus(req, res) {
        try {
            // Check if user is presidium or admin
            if (req.user.role !== 'presidium' && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - only presidium can update motion status' });
            }

            const { id } = req.params;
            const { status, votingResults } = req.body;

            // Check if motion exists
            const motion = await MotionsModel.getMotionById(id);
            if (!motion) {
                return res.status(404).json({ error: 'Motion not found' });
            }

            // Check if the presidium is assigned to this motion's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== motion.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only update motions in your assigned committee' });
            }

            // Update the motion status
            const updatedMotion = await MotionsModel.updateMotionStatus(id, status, votingResults);

            // If motion is accepted and it's a caucus type, we may want to update the session mode
            if (status === 'accepted' &&
                ['moderated_caucus', 'unmoderated_caucus', 'consultation_of_the_whole'].includes(motion.type)) {

                let mode;
                switch (motion.type) {
                    case 'moderated_caucus':
                        mode = 'informal_moderated';
                        break;
                    case 'unmoderated_caucus':
                        mode = 'informal_unmoderated';
                        break;
                    case 'consultation_of_the_whole':
                        mode = 'informal_consultation';
                        break;
                }

                if (mode) {
                    await SessionsModel.updateSessionMode(motion.sessionId, mode);

                    // Notify about mode change
                    WebSocketService.notifyModeChanged(motion.committeeId, mode, motion.duration);
                }
            }

            // Notify all clients about the motion status update
            WebSocketService.broadcastToCommittee(motion.committeeId, {
                type: 'motion_status_updated',
                motion: updatedMotion
            });

            return res.json(updatedMotion);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getPendingMotions(req, res) {
        try {
            const { sessionId } = req.params;

            const pendingMotions = await MotionsModel.getPendingMotions(sessionId);

            return res.json(pendingMotions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async secondMotion(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can second motions' });
            }

            const { id } = req.params;

            // Check if motion exists
            const motion = await MotionsModel.getMotionById(id);
            if (!motion) {
                return res.status(404).json({ error: 'Motion not found' });
            }

            // Check if the motion already has a seconder
            if (motion.secondedBy) {
                return res.status(400).json({ error: 'Motion already has a seconder' });
            }

            // Check if the delegate is trying to second their own motion
            if (motion.proposedBy === req.user.countryName) {
                return res.status(400).json({ error: 'You cannot second your own motion' });
            }

            // Check if the delegate belongs to this motion's committee
            if (req.user.committeeId !== motion.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only second motions in your assigned committee' });
            }

            // Update the motion with the seconder
            const updatedMotion = await Motion.findByIdAndUpdate(
                id,
                { secondedBy: req.user.countryName },
                { new: true }
            );

            // Notify all clients about the motion update
            WebSocketService.broadcastToCommittee(motion.committeeId, {
                type: 'motion_seconded',
                motion: updatedMotion
            });

            return res.json(updatedMotion);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new MotionsController();