const AmendmentsModel = require('./model');
const ResolutionsModel = require('../resolutions/model');

class AmendmentsController {
    async getAmendmentsForResolution(request, reply) {
        try {
            const { resolutionId } = request.params;

            const amendments = await AmendmentsModel.getAmendmentsForResolution(resolutionId);

            return amendments;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getAmendmentById(request, reply) {
        try {
            const { id } = request.params;

            const amendment = await AmendmentsModel.getAmendmentById(id);

            if (!amendment) {
                return reply.code(404).send({ error: 'Amendment not found' });
            }

            return amendment;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createAmendment(request, reply) {
        try {
            // Check if user is a delegate
            if (request.user.role !== 'delegate') {
                return reply.code(403).send({ error: 'Forbidden - only delegates can create amendments' });
            }

            const amendmentData = request.body;

            // Check if resolution exists and is a working draft
            const resolution = await ResolutionsModel.getResolutionById(amendmentData.resolutionId);
            if (!resolution) {
                return reply.code(404).send({ error: 'Resolution not found' });
            }

            // Ensure only amendments to working drafts are allowed
            if (!resolution.isWorkingDraft) {
                return reply.code(400).send({ error: 'Can only amend working draft resolutions' });
            }

            // Check if the delegate belongs to this resolution's committee
            if (request.user.committeeId !== resolution.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only amend resolutions in your assigned committee' });
            }

            // Set committeeId from the resolution
            amendmentData.committeeId = resolution.committeeId;

            // Add the delegate's country as author if not already in the authors list
            if (!amendmentData.authors) {
                amendmentData.authors = [];
            }

            if (!amendmentData.authors.includes(request.user.countryName)) {
                amendmentData.authors.push(request.user.countryName);
            }

            // Create new amendment
            const newAmendment = await AmendmentsModel.createAmendment(amendmentData);

            return reply.code(201).send(newAmendment);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async reviewAmendment(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;
            const { status } = request.body;

            // Check if amendment exists
            const amendment = await AmendmentsModel.getAmendmentById(id);
            if (!amendment) {
                return reply.code(404).send({ error: 'Amendment not found' });
            }

            // If presidium, check if they are assigned to this amendment's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== amendment.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only review amendments for your assigned committee' });
            }

            // Check if amendment is in pending status
            if (amendment.status !== 'pending') {
                return reply.code(400).send({ error: 'Amendment is not in pending status' });
            }

            // Update amendment
            await AmendmentsModel.reviewAmendment(id, status);

            // Return the updated amendment
            const updatedAmendment = await AmendmentsModel.getAmendmentById(id);
            return updatedAmendment;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AmendmentsController();