const AmendmentsModel = require('./model');
const ResolutionsModel = require('../resolutions/model');

class AmendmentsController {
    async getAmendmentsForResolution(req, res) {
        try {
            const { resolutionId } = req.params;

            const amendments = await AmendmentsModel.getAmendmentsForResolution(resolutionId);

            return res.json(amendments);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getAmendmentById(req, res) {
        try {
            const { id } = req.params;

            const amendment = await AmendmentsModel.getAmendmentById(id);

            if (!amendment) {
                return res.status(404).json({ error: 'Amendment not found' });
            }

            return res.json(amendment);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createAmendment(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can create amendments' });
            }

            const amendmentData = req.body;

            // Check if resolution exists and is a working draft
            const resolution = await ResolutionsModel.getResolutionById(amendmentData.resolutionId);
            if (!resolution) {
                return res.status(404).json({ error: 'Resolution not found' });
            }

            // Ensure only amendments to working drafts are allowed
            if (!resolution.isWorkingDraft) {
                return res.status(400).json({ error: 'Can only amend working draft resolutions' });
            }

            // Check if the delegate belongs to this resolution's committee
            if (req.user.committeeId !== resolution.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only amend resolutions in your assigned committee' });
            }

            // Set committeeId from the resolution
            amendmentData.committeeId = resolution.committeeId;

            // Add the delegate's country as author if not already in the authors list
            if (!amendmentData.authors) {
                amendmentData.authors = [];
            }

            if (!amendmentData.authors.includes(req.user.countryName)) {
                amendmentData.authors.push(req.user.countryName);
            }

            // Create new amendment
            const newAmendment = await AmendmentsModel.createAmendment(amendmentData);

            return res.status(201).json(newAmendment);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async reviewAmendment(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;
            const { status } = req.body;

            // Check if amendment exists
            const amendment = await AmendmentsModel.getAmendmentById(id);
            if (!amendment) {
                return res.status(404).json({ error: 'Amendment not found' });
            }

            // If presidium, check if they are assigned to this amendment's committee
            if (req.user.role === 'presidium' && req.user.committeeId !== amendment.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only review amendments for your assigned committee' });
            }

            // Check if amendment is in pending status
            if (amendment.status !== 'pending') {
                return res.status(400).json({ error: 'Amendment is not in pending status' });
            }

            // Update amendment
            await AmendmentsModel.reviewAmendment(id, status);

            // Return the updated amendment
            const updatedAmendment = await AmendmentsModel.getAmendmentById(id);
            return res.json(updatedAmendment);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AmendmentsController();