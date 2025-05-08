const ResolutionsModel = require('./model');
const CommitteesModel = require('../committees/model');

class ResolutionsController {
    async getResolutionsForCommittee(req, res) {
        try {
            const { committeeId } = req.params;

            const resolutions = await ResolutionsModel.getResolutionsForCommittee(committeeId);

            return res.json(resolutions);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getResolutionById(req, res) {
        try {
            const { id } = req.params;

            const resolution = await ResolutionsModel.getResolutionById(id);

            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            return res.json(resolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createResolution(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can create resolutions' });
            }

            const resolutionData = req.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(resolutionData.committeeId);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Check if the delegate belongs to this committee
            if (req.user.committeeId !== resolutionData.committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only create resolutions for your assigned committee' });
            }

            // Check if the delegate's country is in the authors list
            if (!resolutionData.authors.includes(req.user.countryName)) {
                return res.status(400).json({ error: 'Your country must be included as an author' });
            }

            // Check if there are enough authors
            if (resolutionData.authors.length < committee.minResolutionAuthors) {
                return res.status(400).json({
                    error: `Not enough authors. At least ${committee.minResolutionAuthors} required`,
                    minRequired: committee.minResolutionAuthors
                });
            }

            // Create new resolution
            const newResolution = await ResolutionsModel.createResolution(resolutionData);

            return res.status(201).json(newResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async reviewResolution(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;
            const { status, reviewComments } = req.body;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // If presidium, check if they are assigned to this resolution's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== resolution.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only review resolutions for your assigned committee' });
            }

            // Check if resolution is in draft status
            if (resolution.status !== 'draft') {
                return res.status(400).json({ error: 'Resolution is not in draft status' });
            }

            // Update resolution
            await ResolutionsModel.reviewResolution(id, status, reviewComments);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return res.json(updatedResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async setAsWorkingDraft(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // If presidium, check if they are assigned to this resolution's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== resolution.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only manage resolutions for your assigned committee' });
            }

            // Check if resolution status is accepted
            if (resolution.status !== 'accepted') {
                return res.status(400).json({ error: 'Only accepted resolutions can be set as working draft' });
            }

            // Set as working draft
            await ResolutionsModel.setAsWorkingDraft(id);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return res.json(updatedResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async confirmCoAuthor(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can confirm co-authorship' });
            }

            const { id } = req.params;

            // Check if resolution exists
            const resolution = await ResolutionsModel.getResolutionById(id);
            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // Check if the delegate belongs to the same committee as the resolution
            if (req.user.committeeId !== resolution.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only co-author resolutions in your assigned committee' });
            }

            // Check if resolution is still in draft status
            if (resolution.status !== 'draft') {
                return res.status(400).json({ error: 'Cannot confirm co-authorship - resolution is no longer in draft status' });
            }

            // Add the delegate's country as co-author
            await ResolutionsModel.confirmCoAuthor(id, req.user.countryName);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return res.json(updatedResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new ResolutionsController();