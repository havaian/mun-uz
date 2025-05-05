const SessionsModel = require('./model');
const CommitteesModel = require('../committees/model');

class SessionsController {
    async getSessionsForCommittee(request, reply) {
        try {
            const { committeeId } = request.params;

            const sessions = await SessionsModel.getSessionsForCommittee(committeeId);

            return sessions;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getSessionById(request, reply) {
        try {
            const { id } = request.params;

            const session = await SessionsModel.getSessionById(id);

            if (!session) {
                return reply.code(404).send({ error: 'Session not found' });
            }

            return session;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createSession(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { committeeId } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (request.user.role === 'presidium' && request.user.committeeId !== committeeId) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage your assigned committee' });
            }

            // Check if there is already an active session
            const activeSession = await SessionsModel.getActiveSessionForCommittee(committeeId);
            if (activeSession) {
                return reply.code(409).send({ error: 'Committee already has an active session', activeSessionId: activeSession._id });
            }

            // Determine session number
            const sessionCount = await SessionsModel.getSessionCount(committeeId);
            const sessionNumber = sessionCount + 1;

            // Create new session
            const sessionData = {
                committeeId,
                number: sessionNumber,
                mode: 'formal', // Default mode is formal
                ...request.body
            };

            const newSession = await SessionsModel.createSession(sessionData);

            return reply.code(201).send(newSession);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async updateSessionMode(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;
            const { mode } = request.body;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return reply.code(404).send({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== session.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return reply.code(400).send({ error: 'Session is not active' });
            }

            // Update session mode
            await SessionsModel.updateSessionMode(id, mode);

            // Return the updated session
            const updatedSession = await SessionsModel.getSessionById(id);
            return updatedSession;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async updateRollCall(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;
            const { presentCountries } = request.body;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return reply.code(404).send({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== session.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return reply.code(400).send({ error: 'Session is not active' });
            }

            // Update roll call
            await SessionsModel.updateRollCall(id, presentCountries);

            // Return the updated session
            const updatedSession = await SessionsModel.getSessionById(id);
            return updatedSession;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async completeSession(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;

            // Check if session exists
            const session = await SessionsModel.getSessionById(id);
            if (!session) {
                return reply.code(404).send({ error: 'Session not found' });
            }

            // If presidium, check if they are assigned to this session's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== session.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage sessions for your assigned committee' });
            }

            // Check if session is active
            if (session.status !== 'active') {
                return reply.code(400).send({ error: 'Session is already completed' });
            }

            // Complete session
            await SessionsModel.completeSession(id);

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new SessionsController();