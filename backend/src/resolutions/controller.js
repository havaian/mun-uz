const ResolutionsModel = require('./model');
const CommitteesModel = require('../committees/model');

class ResolutionsController {
    async getResolutionsForCommittee(req, res) {
        try {
            const { committeeId } = req.params;

            // Get user role from request
            const userRole = req.user ? req.user.role : null;

            // Fetch all resolutions for the committee
            const allResolutions = await ResolutionsModel.getResolutionsForCommittee(committeeId);

            // If user is a presidium or admin, filter out 'pending_coauthors' resolutions
            if (userRole === 'presidium' || userRole === 'admin') {
                const filteredResolutions = allResolutions.filter(
                    resolution => resolution.status !== 'pending_coauthors'
                );
                return res.json(filteredResolutions);
            }

            // Otherwise return all resolutions (for delegate view)
            return res.json(allResolutions);
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

            // Create the list of pending co-authors (all authors except the current delegate)
            const pendingCoAuthors = resolutionData.authors.filter(author => author !== req.user.countryName);

            // If there are no co-authors, set status to draft (ready for presidium)
            // Otherwise, set status to pending_coauthors
            if (pendingCoAuthors.length === 0) {
                resolutionData.status = 'draft';
                resolutionData.pendingCoAuthors = [];
            } else {
                resolutionData.status = 'pending_coauthors';
                resolutionData.pendingCoAuthors = pendingCoAuthors;
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

            // If accepting, check if it has the minimum required authors
            if (status === 'accepted') {
                const committee = await CommitteesModel.getCommitteeById(resolution.committeeId);
                if (resolution.authors.length < committee.minResolutionAuthors) {
                    return res.status(400).json({
                        error: `Not enough authors. At least ${committee.minResolutionAuthors} required. Currently has ${resolution.authors.length}.`,
                        minRequired: committee.minResolutionAuthors,
                        currentCount: resolution.authors.length
                    });
                }
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

            // Check if resolution is in pending_coauthors or draft status
            if (resolution.status !== 'pending_coauthors' && resolution.status !== 'draft') {
                return res.status(400).json({
                    error: 'Cannot confirm co-authorship - resolution is not in pending co-authors or draft status'
                });
            }

            // Check if the delegate's country is in the pendingCoAuthors list
            if (!resolution.pendingCoAuthors || !resolution.pendingCoAuthors.includes(req.user.countryName)) {
                return res.status(400).json({
                    error: 'Your country is not in the pending co-authors list for this resolution'
                });
            }

            // Remove the delegate's country from the pendingCoAuthors list
            const updatedPendingCoAuthors = resolution.pendingCoAuthors.filter(
                country => country !== req.user.countryName
            );

            // Update the resolution
            const updatedData = {
                pendingCoAuthors: updatedPendingCoAuthors
            };

            // If no more pending co-authors, change status to draft
            if (updatedPendingCoAuthors.length === 0) {
                updatedData.status = 'draft';
            }

            // Update the resolution in the database
            await ResolutionsModel.updateResolution(id, updatedData);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(id);
            return res.json(updatedResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getDelegateResolutions(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can access their resolutions' });
            }

            const { committeeId } = req.params;
            const { countryName } = req.user;

            // Check if delegate belongs to this committee
            if (req.user.committeeId !== committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only access resolutions for your assigned committee' });
            }

            // Get all resolutions for this committee
            const allResolutions = await ResolutionsModel.getResolutionsForCommittee(committeeId);

            // Filter to only show resolutions where the delegate is an author
            const delegateResolutions = allResolutions.filter(resolution =>
                resolution.authors.includes(countryName)
            );

            return res.json(delegateResolutions);
        } catch (error) {
            console.error('Error getting delegate resolutions:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createStructuredResolution(req, res) {
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

            // Create the list of pending co-authors (all authors except the current delegate)
            const pendingCoAuthors = resolutionData.authors.filter(author => author !== req.user.countryName);

            // If there are no co-authors, set status to draft (ready for presidium)
            // Otherwise, set status to pending_coauthors
            if (pendingCoAuthors.length === 0) {
                resolutionData.status = 'draft';
                resolutionData.pendingCoAuthors = [];
            } else {
                resolutionData.status = 'pending_coauthors';
                resolutionData.pendingCoAuthors = pendingCoAuthors;
            }

            // Create new resolution with structured content
            const newResolution = await ResolutionsModel.createStructuredResolution(resolutionData);

            return res.status(201).json(newResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Method to apply an amendment to a resolution
    async applyAmendment(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { resolutionId, amendmentId } = req.params;

            // Check if resolution and amendment exist
            const resolution = await ResolutionsModel.getResolutionById(resolutionId);
            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            const amendment = await AmendmentsModel.getAmendmentById(amendmentId);
            if (!amendment) {
                return res.status(404).json({ error: 'Amendment not found' });
            }

            // Check if amendment has been accepted
            if (amendment.status !== 'accepted') {
                return res.status(400).json({ error: 'Cannot apply a non-accepted amendment' });
            }

            // Check if resolution is the working draft
            if (!resolution.isWorkingDraft) {
                return res.status(400).json({ error: 'Amendment can only be applied to working draft' });
            }

            // Apply the amendment
            await ResolutionsModel.applyAmendment(resolutionId, amendment);

            // Return the updated resolution
            const updatedResolution = await ResolutionsModel.getResolutionById(resolutionId);
            return res.json(updatedResolution);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new ResolutionsController();