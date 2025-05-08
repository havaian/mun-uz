const CommitteesModel = require('./model');
const qrcode = require('qrcode');
const PDFDocument = require('pdfkit');
const { getDb } = require('../../db');
const AuthModel = require('../auth/model');

class CommitteesController {
    async getAllCommittees(req, res) {
        try {
            const committees = await CommitteesModel.getAllCommittees();
            return res.json(committees);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getCommitteesForEvent(req, res) {
        try {
            const { eventId } = req.params;

            const committees = await CommitteesModel.getCommitteesForEvent(eventId);

            return res.json(committees);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeById(req, res) {
        try {
            const { id } = req.params;

            const committee = await CommitteesModel.getCommitteeById(id);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            return res.json(committee);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createCommittee(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const committeeData = req.body;

            const newCommittee = await CommitteesModel.createCommittee(committeeData);

            return res.status(201).json(newCommittee);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateCommittee(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;
            const committeeData = req.body;

            // Check if committee exists
            const existingCommittee = await CommitteesModel.getCommitteeById(id);
            if (!existingCommittee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (req.user.role === 'presidium' && req.user.committeeId !== id) {
                return res.status(403).json({ error: 'Forbidden - you can only update your assigned committee' });
            }

            // Update the committee
            await CommitteesModel.updateCommittee(id, committeeData);

            // Return the updated committee
            const updatedCommittee = await CommitteesModel.getCommitteeById(id);
            return res.json(updatedCommittee);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteCommittee(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { id } = req.params;

            // Check if committee exists
            const existingCommittee = await CommitteesModel.getCommitteeById(id);
            if (!existingCommittee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Delete the committee
            await CommitteesModel.deleteCommittee(id);

            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getCommitteeStatus(req, res) {
        try {
            const { id } = req.params;

            const status = await CommitteesModel.getCommitteeStatus(id);

            if (!status) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            return res.json(status);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async generateQRCodes(req, res) {
        try {
            // Check if user is admin or presidium
            if (req.user.role !== 'admin' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - admin or presidium access required' });
            }

            const { id } = req.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // If presidium, check if they are assigned to this committee
            if (req.user.role === 'presidium' && req.user.committeeId !== id) {
                return res.status(403).json({ error: 'Forbidden - you can only access your assigned committee' });
            }

            // Generate QR codes
            const qrData = await CommitteesModel.generateQRCodes(id);

            // Create PDF document
            const doc = new PDFDocument();

            // Set response headers for PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="committee_${id}_qrcodes.pdf"`);

            // Pipe PDF to response
            doc.pipe(res);

            // Add QR codes to PDF
            for (let i = 0; i < qrData.length; i++) {
                const country = qrData[i];
                const qrCodeDataUrl = await this.generateQRCodeDataUrl(country.token);

                // Add page for new country
                if (i > 0) {
                    doc.addPage();
                }

                // Add content to PDF
                doc.fontSize(24).text(`Committee: ${committee.name}`, { align: 'center' });
                doc.fontSize(18).text(`Country: ${country.name}`, { align: 'center' });
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

            // Finalize the PDF
            doc.end();

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
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

    async assignPresidium(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { id } = req.params;
            const { username, password } = req.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Check if username already exists
            const existingUser = await AuthModel.findUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({ error: 'Username already exists' });
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
            return res.json({
                success: true,
                user: newUser
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async removePresidium(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { id, username } = req.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Find user
            const user = await AuthModel.findUserByUsername(username);
            if (!user || user.role !== 'presidium' || user.committeeId !== id) {
                return res.status(404).json({ error: 'Presidium member not found in this committee' });
            }

            // Delete user
            const User = mongoose.model('User');
            await User.deleteOne({ _id: user._id });

            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CommitteesController();