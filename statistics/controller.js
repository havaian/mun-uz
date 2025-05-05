const StatisticsModel = require('./model');
const CommitteesModel = require('../committees/model');
const PDFDocument = require('pdfkit');

class StatisticsController {
    async recordActivity(request, reply) {
        try {
            // Only admin and presidium can record activities
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const activityData = request.body;

            // If presidium, check if they are assigned to this committee
            if (request.user.role === 'presidium' && request.user.committeeId !== activityData.committeeId) {
                return reply.code(403).send({ error: 'Forbidden - you can only record activities for your assigned committee' });
            }

            // Record the activity
            const newActivity = await StatisticsModel.recordActivity(activityData);

            return reply.code(201).send(newActivity);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeStatistics(request, reply) {
        try {
            const { committeeId } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Get committee statistics
            const stats = await StatisticsModel.getCommitteeStatistics(committeeId);

            return stats;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getDelegateStatistics(request, reply) {
        try {
            const { committeeId, countryName } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Check if country exists in committee
            const countryExists = committee.countries.some(c => c.name === countryName);
            if (!countryExists) {
                return reply.code(404).send({ error: 'Country not found in this committee' });
            }

            // Get delegate statistics
            const stats = await StatisticsModel.getDelegateStatistics(committeeId, countryName);

            // Summarize statistics
            const speechCount = stats.filter(a => a.activityType === 'speech').length;
            const speechDuration = stats.filter(a => a.activityType === 'speech').reduce((acc, curr) => acc + (curr.duration || 0), 0);
            const resolutionCount = stats.filter(a => a.activityType === 'resolution').length;
            const amendmentCount = stats.filter(a => a.activityType === 'amendment').length;
            const voteCount = stats.filter(a => a.activityType === 'vote').length;

            return {
                countryName,
                summary: {
                    totalActivities: stats.length,
                    speeches: speechCount,
                    speechDuration,
                    resolutions: resolutionCount,
                    amendments: amendmentCount,
                    votes: voteCount
                },
                recentActivities: stats.slice(0, 10) // Return most recent 10 activities
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeSummary(request, reply) {
        try {
            const { committeeId } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(committeeId);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Get committee summary
            const summary = await StatisticsModel.getCommitteeSummary(committeeId);

            // Add committee info
            summary.committeeInfo = {
                _id: committee._id,
                name: committee.name,
                type: committee.type,
                status: committee.status,
                countryCount: committee.countries.length
            };

            return summary;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async exportCommitteeStatistics(request, reply) {
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
                return reply.code(403).send({ error: 'Forbidden - you can only export statistics for your assigned committee' });
            }

            // Get committee statistics
            const stats = await StatisticsModel.getCommitteeStatistics(committeeId);

            // Get committee summary
            const summary = await StatisticsModel.getCommitteeSummary(committeeId);

            // Create PDF document
            const doc = new PDFDocument();

            // Add content to PDF
            doc.fontSize(24).text(`Committee Statistics: ${committee.name}`, { align: 'center' });
            doc.moveDown();

            // Add summary statistics
            doc.fontSize(18).text('Summary Statistics');
            doc.moveDown();

            doc.fontSize(12).text(`Total Sessions: ${summary.sessionSummary.totalSessions}`);
            doc.fontSize(12).text(`Total Resolutions: ${summary.documentSummary.totalResolutions}`);
            doc.fontSize(12).text(`Total Amendments: ${summary.documentSummary.totalAmendments}`);
            doc.fontSize(12).text(`Total Votings: ${summary.votingSummary.totalVotings}`);
            doc.moveDown();

            // Add country statistics
            doc.fontSize(18).text('Country Statistics');
            doc.moveDown();

            // Create table headers
            const tableHeaders = ['Country', 'Speeches', 'Speech Duration', 'Resolutions', 'Amendments', 'Votes', 'Total'];
            const tableX = 50;
            let tableY = doc.y;
            const columnWidth = (doc.page.width - 100) / tableHeaders.length;

            // Draw headers
            tableHeaders.forEach((header, i) => {
                doc.fontSize(10).text(header, tableX + (i * columnWidth), tableY, { width: columnWidth, align: 'center' });
            });

            tableY += 20;

            // Draw data rows
            stats.forEach((country, i) => {
                const rowY = tableY + (i * 20);

                doc.fontSize(10).text(country._id, tableX, rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(country.speeches.toString(), tableX + columnWidth, rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(`${country.speechDuration} sec`, tableX + (2 * columnWidth), rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(country.resolutions.toString(), tableX + (3 * columnWidth), rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(country.amendments.toString(), tableX + (4 * columnWidth), rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(country.votes.toString(), tableX + (5 * columnWidth), rowY, { width: columnWidth, align: 'center' });
                doc.fontSize(10).text(country.totalActivities.toString(), tableX + (6 * columnWidth), rowY, { width: columnWidth, align: 'center' });
            });

            // Create buffer
            return new Promise((resolve, reject) => {
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);

                    // Set response headers
                    reply.header('Content-Type', 'application/pdf');
                    reply.header('Content-Disposition', `attachment; filename="committee_${committeeId}_statistics.pdf"`);

                    resolve(pdfBuffer);
                });
                doc.on('error', reject);

                // Finalize the PDF
                doc.end();
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new StatisticsController();