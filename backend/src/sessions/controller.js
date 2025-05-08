const SessionsModel = require('./model');
const CommitteesModel = require('../committees/model');

class SessionsController {
    async getSessionsForCommittee(req, res) {
        try {
            const { committeeId } = req.params;

            const sessions = await SessionsModel.getSessionsForCommittee(committeeId);

            return res.json(sessions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getSessionById(req, res) {
        try {
            const { id } = req.params;

            const session = await SessionsModel.getSessionById(id);

            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            return res.json(session);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createSession(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { committeeId } = req.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(committeeId);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (req.user.role === 'presidium' && req.user.committeeId !== committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only manage your assigned committee' });
            }

            // Check if there is already an active session
            const activeSession = await SessionsModel.getActiveSessionForCommittee(committeeId);
            if (activeSession) {
                return res.status(409).json({ error: 'Committee already has an active session', activeSessionId: activeSession._id });
            }

            // Determine session number
            const sessionCount = await SessionsModel.getSessionCount(committeeId);
            const sessionNumber = sessionCount + 1;

            // Create new session
            const sessionData = {
                committeeId,
                number: sessionNumber,
                mode: 'formal', // Default mode is formal
                ...req.body
            };

            const newSession = await SessionsModel.createSession(sessionData);

            return res.status(201).json(newSession);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateSessionMode(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;
            const { mode } = req.body;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== session.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return res.status(400).json({ error: 'Session is not active' });
            }

            // Update session mode
            await SessionsModel.updateSessionMode(id, mode);

            // Return the updated session
            const updatedSession = await SessionsModel.getSessionById(id);
            return res.json(updatedSession);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateRollCall(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;
            const { presentCountries } = req.body;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== session.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return res.status(400).json({ error: 'Session is not active' });
            }

            // Update roll call
            await SessionsModel.updateRollCall(id, presentCountries);

            // Return the updated session
            const updatedSession = await SessionsModel.getSessionById(id);
            return res.json(updatedSession);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async completeSession(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== session.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return res.status(400).json({ error: 'Session is already completed' });
            }

            // Complete session
            await SessionsModel.completeSession(id);

            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new SessionsController();