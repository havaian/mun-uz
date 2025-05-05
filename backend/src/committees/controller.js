const CommitteesModel = require('./model');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');
const { getDb } = require('../../db');
const AuthModel = require('../auth/model');

class CommitteesController {
    async getAllCommittees(request, reply) {
        try {
            const committees = await CommitteesModel.getAllCommittees();
            return committees;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCommitteesForEvent(request, reply) {
        try {
            const { eventId } = request.params;

            const committees = await CommitteesModel.getCommitteesForEvent(eventId);

            return committees;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeById(request, reply) {
        try {
            const { id } = request.params;

            const committee = await CommitteesModel.getCommitteeById(id);

            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            return committee;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createCommittee(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const committeeData = request.body;

            const newCommittee = await CommitteesModel.createCommittee(committeeData);

            return reply.code(201).send(newCommittee);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async updateCommittee(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;
            const committeeData = request.body;

            // Check if committee exists
            const existingCommittee = await CommitteesModel.getCommitteeById(id);
            if (!existingCommittee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (request.user.role === 'presidium' && request.user.committeeId !== id) {
                return reply.code(403).send({ error: 'Forbidden - you can only update your assigned committee' });
            }

            // Update the committee
            await CommitteesModel.updateCommittee(id, committeeData);

            // Return the updated committee
            const updatedCommittee = await CommitteesModel.getCommitteeById(id);
            return updatedCommittee;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async deleteCommittee(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const { id } = request.params;

            // Check if committee exists
            const existingCommittee = await CommitteesModel.getCommitteeById(id);
            if (!existingCommittee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Delete the committee
            await CommitteesModel.deleteCommittee(id);

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeStatus(request, reply) {
        try {
            const { id } = request.params;

            const status = await CommitteesModel.getCommitteeStatus(id);

            if (!status) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            return status;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async generateQRCodes(request, reply) {
        try {
            // Check if user is admin or presidium
            if (request.user.role !== 'admin' && request.user.role !== 'presidium') {
                return reply.code(403).send({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (request.user.role === 'presidium' && request.user.committeeId !== id) {
                return reply.code(403).send({ error: 'Forbidden - you can only access your assigned committee' });
            }

            // Generate QR codes
            const qrData = await CommitteesModel.generateQRCodes(id);

            // Create PDF document
            const doc = new PDFDocument();

            // Add QR codes to PDF
            for (let i = 0; i < qrData.length; i++) {
                const country = qrData[i];
                const qrCodeDataUrl = await this.generateQRCodeDataUrl(country.token);

                // Add page for new country
                if (i > 0) {
                    doc.addPage();
                }

                // Add content to PDF
                doc.fontSize(24).text(committee.name, { align: 'center' });
                doc.fontSize(18).text(country.name, { align: 'center' });
                doc.moveDown();

                // Add QR code image
                doc.image(qrCodeDataUrl, {
                    fit: [250, 250],
                    align: 'center',
                    valign: 'center'
                });

                doc.moveDown();
                doc.fontSize(12).text('Scan this QR code to access the MUN platform', { align: 'center' });
            }

            // Create buffer
            return new Promise((resolve, reject) => {
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);

                    // Set response headers
                    reply.header('Content-Type', 'application/pdf');
                    reply.header('Content-Disposition', `attachment; filename="committee_${id}_qrcodes.pdf"`);

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

    async generateQRCodeDataUrl(data) {
        return new Promise((resolve, reject) => {
            qrcode.toDataURL(data, (err, url) => {
                if (err) reject(err);
                else resolve(url);
            });
        });
    }

    async assignPresidium(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const { id } = request.params;
            const { username, password } = request.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Check if username already exists
            const existingUser = await AuthModel.findUserByUsername(username);
            if (existingUser) {
                return reply.code(409).send({ error: 'Username already exists' });
            }

            // Create presidium user
            const presidiumUser = {
                username,
                password,
                role: 'presidium',
                committeeId: id
            };

            const newUser = await AuthModel.createUser(presidiumUser);

            // Return success but not password
            delete newUser.password;
            return {
                success: true,
                user: newUser
            };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async removePresidium(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const { id, username } = request.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return reply.code(404).send({ error: 'Committee not found' });
            }

            // Find user
            const user = await AuthModel.findUserByUsername(username);
            if (!user || user.role !== 'presidium' || user.committeeId !== id) {
                return reply.code(404).send({ error: 'Presidium member not found in this committee' });
            }

            // Delete user
            const usersCollection = getDb().collection('users');
            await usersCollection.deleteOne({ _id: user._id });

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CommitteesController();