const ResolutionsModel = require('./model');
const CommitteesModel = require('../committees/model');

class ResolutionsController {
    async getResolutionsForCommittee(request, reply) {
        try {
            const { committeeId } = request.params;

            const resolutions = await ResolutionsModel.getResolutionsForCommittee(committeeId);

            return resolutions;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getResolutionById(request, reply) {
        try {
            const { id } = request.params;

            const resolution = await ResolutionsModel.getResolutionById(id);

            if (!resolution) {
                return reply.code(404).send({ error: 'Resolution not found' });
            }

            return resolution;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createResolution(request, reply) {
        try {
            // Check if user is a delegate
            if (request.user.role !== 'delegate') {
                return reply.code(403).send({ error: 'Forbidden - only delegates can create resolutions' });
            }

            const resolutionData = request.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(resolutionData.committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Check if the delegate belongs to this committee
            if (request.user.committeeId !== resolutionData.committeeId) {
                return reply.code(403).send({ error: 'Forbidden - you can only create resolutions for your assigned committee' });
            }

            // Check if the delegate's country is in the authors list
            if (!resolutionData.authors.includes(request.user.countryName)) {
                return reply.code(400).send({ error: 'Your country must be included as an author' });
            }

            // Check if there are enough authors
            if (resolutionData.authors.length < committee.minResolutionAuthors) {
                return reply.code(400).send({
                    error: `Not enough authors. At least ${committee.minResolutionAuthors} required`,
                    minRequired: committee.minResolutionAuthors
                });
            }

            // Create new resolution
            const newResolution = await ResolutionsModel.createResolution(resolutionData);

            return reply.code(201).send(newResolution);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async reviewResolution(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;
            const { status, reviewComments } = request.body;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return reply.code(404).send({ error: 'Resolution not found' });
            }

            // If presidium, check if they are assigned to this resolution's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== resolution.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only review resolutions for your assigned committee' });
            }

            // Check if resolution is in draft status
            if (resolution.status !== 'draft') {
                return reply.code(400).send({ error: 'Resolution is not in draft status' });
            }

            // Update resolution
            await ResolutionsModel.reviewResolution(id, status, reviewComments);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return updatedResolution;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async setAsWorkingDraft(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return reply.code(404).send({ error: 'Resolution not found' });
            }

            // If presidium, check if they are assigned to this resolution's committee
            if (request.user.role === 'presidium' && request.user.committeeId !== resolution.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only manage resolutions for your assigned committee' });
            }

            // Check if resolution status is accepted
            if (resolution.status !== 'accepted') {
                return reply.code(400).send({ error: 'Only accepted resolutions can be set as working draft' });
            }

            // Set as working draft
            await ResolutionsModel.setAsWorkingDraft(id);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return updatedResolution;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async confirmCoAuthor(request, reply) {
        try {
            // Check if user is a delegate
            if (request.user.role !== 'delegate') {
                return reply.code(403).send({ error: 'Forbidden - only delegates can confirm co-authorship' });
            }

            const { id } = request.params;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return reply.code(404).send({ error: 'Resolution not found' });
            }

            // Check if the delegate belongs to the same committee as the resolution
            if (request.user.committeeId !== resolution.committeeId.toString()) {
                return reply.code(403).send({ error: 'Forbidden - you can only co-author resolutions in your assigned committee' });
            }

            // Check if resolution is still in draft status
            if (resolution.status !== 'draft') {
                return reply.code(400).send({ error: 'Cannot confirm co-authorship - resolution is no longer in draft status' });
            }

            // Add the delegate's country as co-author
            await ResolutionsModel.confirmCoAuthor(id, request.user.countryName);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return updatedResolution;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new ResolutionsController();