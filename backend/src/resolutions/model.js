const mongoose = require('mongoose');

// Define Resolution Schema
const resolutionSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    authors: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending_coauthors', 'draft', 'reviewed', 'accepted', 'rejected', 'working'],
        default: 'pending_coauthors' // Change default to pending_coauthors
    },
    pendingCoAuthors: [{
        type: String
    }],
    submissionTime: {
        type: Date,
        default: Date.now
    },
    reviewTime: {
        type: Date
    },
    reviewComments: {
        type: String
    },
    isWorkingDraft: {
        type: Boolean,
        default: false
    },
    preambleClauses: [{
        content: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: true
        }
    }],
    operativeClauses: [{
        content: {
            type: String,
            required: true
        },
        number: {
            type: Number,
            required: true
        },
        subClauses: [{
            content: {
                type: String
            },
            letter: {
                type: String
            }
        }]
    }],
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

resolutionSchema.methods.parseToStructured = function () {
    // This method would parse the flat content into structured preamble and operative clauses
    // Implementation would depend on the specific format used in your content field
};

resolutionSchema.methods.generateFlatContent = function () {
    // This method would generate flat content from structured clauses
    let content = '';

    // Generate preamble clauses
    if (this.preambleClauses && this.preambleClauses.length > 0) {
        const sortedPreamble = [...this.preambleClauses].sort((a, b) => a.order - b.order);

        for (const clause of sortedPreamble) {
            content += `${clause.content},\n\n`;
        }
    }

    // Generate operative clauses
    if (this.operativeClauses && this.operativeClauses.length > 0) {
        const sortedOperative = [...this.operativeClauses].sort((a, b) => a.number - b.number);

        for (const clause of sortedOperative) {
            content += `${clause.number}. ${clause.content}`;

            // Add subclauses if they exist
            if (clause.subClauses && clause.subClauses.length > 0) {
                const sortedSubClauses = [...clause.subClauses].sort((a, b) =>
                    a.letter.localeCompare(b.letter));

                for (const subClause of sortedSubClauses) {
                    content += `\n  ${subClause.letter}) ${subClause.content}`;
                }
            }

            content += '\n\n';
        }
    }

    return content;
};

// Hook to ensure content field stays in sync with structured data
resolutionSchema.pre('save', function (next) {
    if (this.preambleClauses && this.operativeClauses) {
        this.content = this.generateFlatContent();
    }
    next();
});

// Create model
const Resolution = mongoose.model('Resolution', resolutionSchema);

class ResolutionsModel {
    async getResolutionsForCommittee(committeeId) {
        return Resolution.find({ committeeId }).sort({ submissionTime: -1 });
    }

    async getResolutionById(id) {
        return Resolution.findById(id);
    }

    async getWorkingDraftForCommittee(committeeId) {
        return Resolution.findOne({
            committeeId,
            isWorkingDraft: true
        });
    }

    async createResolution(resolutionData) {
        // Set initial values
        resolutionData.status = 'draft';
        resolutionData.isWorkingDraft = false;
        resolutionData.submissionTime = new Date();

        const newResolution = new Resolution(resolutionData);
        await newResolution.save();
        return newResolution;
    }

    async reviewResolution(id, status, reviewComments) {
        return Resolution.findByIdAndUpdate(
            id,
            {
                status,
                reviewComments,
                reviewTime: new Date()
            },
            { new: true }
        );
    }

    async setAsWorkingDraft(id) {
        // First reset any existing working draft
        await Resolution.updateMany(
            { isWorkingDraft: true },
            {
                isWorkingDraft: false,
                updatedAt: new Date()
            }
        );

        // Then set the new working draft
        return Resolution.findByIdAndUpdate(
            id,
            {
                isWorkingDraft: true,
                status: 'working'
            },
            { new: true }
        );
    }

    async updateResolution(id, resolutionData) {
        return Resolution.findByIdAndUpdate(
            id,
            resolutionData,
            { new: true }
        );
    }

    async confirmCoAuthor(id, countryName) {
        return Resolution.findByIdAndUpdate(
            id,
            {
                $addToSet: { authors: countryName }
            },
            { new: true }
        );
    }


    async createStructuredResolution(resolutionData) {
        // Ensure structured content fields are initialized
        if (!resolutionData.preambleClauses) {
            resolutionData.preambleClauses = [];
        }

        if (!resolutionData.operativeClauses) {
            resolutionData.operativeClauses = [];
        }

        // Generate the flat content from structured data
        const resolution = new Resolution(resolutionData);
        resolutionData.content = resolution.generateFlatContent();

        // Set initial values
        resolutionData.status = 'draft';
        resolutionData.isWorkingDraft = false;
        resolutionData.submissionTime = new Date();

        const newResolution = new Resolution(resolutionData);
        await newResolution.save();
        return newResolution;
    }

    // Add method to apply amendment to resolution
    async applyAmendment(resolutionId, amendment) {
        const resolution = await this.getResolutionById(resolutionId);

        if (!resolution) {
            throw new Error('Resolution not found');
        }

        if (amendment.resolutionPart === 'preamble') {
            this.applyPreambleAmendment(resolution, amendment);
        } else {
            this.applyOperativeAmendment(resolution, amendment);
        }

        // Regenerate flat content
        resolution.content = resolution.generateFlatContent();

        await resolution.save();
        return resolution;
    }

    applyPreambleAmendment(resolution, amendment) {
        if (amendment.actionType === 'delete') {
            // Remove the clause at the specified index
            resolution.preambleClauses = resolution.preambleClauses.filter(
                clause => clause.order !== amendment.pointNumber
            );

            // Reorder remaining clauses
            resolution.preambleClauses.forEach(clause => {
                if (clause.order > amendment.pointNumber) {
                    clause.order -= 1;
                }
            });
        } else if (amendment.actionType === 'modify') {
            // Find and update the clause
            const clauseIndex = resolution.preambleClauses.findIndex(
                clause => clause.order === amendment.pointNumber
            );

            if (clauseIndex !== -1) {
                resolution.preambleClauses[clauseIndex].content = amendment.content;
            }
        } else if (amendment.actionType === 'add') {
            // Shift existing clauses
            resolution.preambleClauses.forEach(clause => {
                if (clause.order > amendment.newPointAfter) {
                    clause.order += 1;
                }
            });

            // Add new clause
            resolution.preambleClauses.push({
                content: amendment.content,
                order: amendment.newPointAfter + 1
            });
        }
    }

    applyOperativeAmendment(resolution, amendment) {
        if (amendment.actionType === 'delete') {
            // Remove the clause at the specified index
            resolution.operativeClauses = resolution.operativeClauses.filter(
                clause => clause.number !== amendment.pointNumber
            );

            // Renumber remaining clauses
            resolution.operativeClauses.forEach(clause => {
                if (clause.number > amendment.pointNumber) {
                    clause.number -= 1;
                }
            });
        } else if (amendment.actionType === 'modify') {
            // Find and update the clause
            const clauseIndex = resolution.operativeClauses.findIndex(
                clause => clause.number === amendment.pointNumber
            );

            if (clauseIndex !== -1) {
                resolution.operativeClauses[clauseIndex].content = amendment.content;
            }
        } else if (amendment.actionType === 'add') {
            // Shift existing clauses
            resolution.operativeClauses.forEach(clause => {
                if (clause.number > amendment.newPointAfter) {
                    clause.number += 1;
                }
            });

            // Add new clause
            resolution.operativeClauses.push({
                content: amendment.content,
                number: amendment.newPointAfter + 1,
                subClauses: []
            });
        }
    }
}

module.exports = new ResolutionsModel();