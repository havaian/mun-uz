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

            // Create PDF document with high-quality settings
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                autoFirstPage: true,
                compress: false, // Disable compression for higher quality
                info: {
                    Title: `QR Codes for ${committee.name}`,
                    Author: 'MUN.UZ Platform',
                    Subject: 'Delegate QR Codes',
                    Keywords: 'QR, MUN, delegate',
                    Creator: 'MUN.UZ Platform'
                }
            });

            // Set response headers for PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="committee_${id}_qrcodes.pdf"`);

            // Pipe PDF to response
            doc.pipe(res);

            // Add header with committee name
            doc.font('Helvetica-Bold').fontSize(16).text(`Committee: ${committee.name}`, { align: 'center' });
            doc.moveDown(0.5);

            // Configuration for grid layout
            const pageWidth = 595.28; // A4 width in points
            const pageHeight = 841.89; // A4 height in points
            const margin = 40;
            const contentWidth = pageWidth - (2 * margin);
            const contentHeight = pageHeight - (2 * margin) - 60; // 60 for header and footer

            const qrCodesPerRow = 3;
            const qrCodesPerColumn = 4;
            const qrCodesPerPage = qrCodesPerRow * qrCodesPerColumn;

            // Calculate QR code size - make it larger for better quality
            const qrCodeWidth = Math.floor(contentWidth / qrCodesPerRow) - 20; // More spacing
            const qrCodeHeight = Math.floor((contentHeight / qrCodesPerColumn) - 40); // 40 for country name and spacing
            const qrCodeSize = Math.min(qrCodeWidth, qrCodeHeight);

            // Calculate total pages needed
            const totalPages = Math.ceil(qrData.length / qrCodesPerPage);

            let currentPage = 1;

            // Loop through all countries
            for (let i = 0; i < qrData.length; i++) {
                // Check if we need a new page
                if (i > 0 && i % qrCodesPerPage === 0) {
                    // Add page number at the bottom
                    doc.font('Helvetica').fontSize(10).text(`Page ${currentPage} of ${totalPages}`, margin, pageHeight - 30, {
                        align: 'center',
                        width: contentWidth
                    });

                    // Add a new page
                    doc.addPage();
                    currentPage++;

                    // Add header with committee name on new page
                    doc.font('Helvetica-Bold').fontSize(16).text(`Committee: ${committee.name}`, { align: 'center' });
                    doc.moveDown(0.5);
                }

                const pagePosition = i % qrCodesPerPage;
                const row = Math.floor(pagePosition / qrCodesPerRow);
                const col = pagePosition % qrCodesPerRow;

                // Center QR codes in their cells with more spacing
                const xPos = margin + (col * (contentWidth / qrCodesPerRow)) + ((contentWidth / qrCodesPerRow - qrCodeSize) / 2);
                const yPos = margin + 50 + (row * (contentHeight / qrCodesPerColumn)) + ((contentHeight / qrCodesPerColumn - qrCodeSize - 40) / 2);

                const country = qrData[i];

                // Generate high-quality QR code
                const qrCodeDataUrl = await this.generateHighQualityQRCode(country.token, process.env.PROJECT_URL);

                // Add QR code with high quality
                doc.image(qrCodeDataUrl, xPos, yPos, { width: qrCodeSize, height: qrCodeSize });

                // Add country name below QR code with better formatting
                doc.font('Helvetica-Bold').fontSize(12).text(country.name, xPos, yPos + qrCodeSize + 10, {
                    width: qrCodeSize,
                    align: 'center'
                });
            }

            // Add page number at the bottom of the last page
            doc.font('Helvetica').fontSize(10).text(`Page ${currentPage} of ${totalPages}`, margin, pageHeight - 30, {
                align: 'center',
                width: contentWidth
            });

            // Finalize the PDF
            doc.end();

        } catch (error) {
            console.error('Error generating QR codes:', error);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }

    async generateHighQualityQRCode(token, baseUrl) {
        // Create a complete login URL instead of just the token
        const loginUrl = `${baseUrl}/delegate/direct-login?token=${token}`;
        
        return new Promise((resolve, reject) => {
            // Use the highest possible settings for quality
            qrcode.toDataURL(loginUrl, {
                errorCorrectionLevel: 'H', // Highest error correction level
                type: 'image/png',          // Use PNG for better quality
                quality: 1.0,              // Highest quality
                margin: 2,                 // Slightly larger margin for better scanning
                scale: 10,                 // Much larger scale for printing
                color: {
                    dark: '#000000',       // Pure black for better contrast
                    light: '#FFFFFF'       // Pure white for better contrast
                }
            }, (err, url) => {
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

    async getPresidiumMembers(req, res) {
        try {
            const { id } = req.params;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(id);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Find presidium members assigned to this committee
            const User = require('mongoose').model('User'); // or however you access your User model
            const presidiumMembers = await User.find({
                role: 'presidium',
                committeeId: id
            }).select('-password');  // Exclude password field

            return res.json(presidiumMembers);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Get committee for logged in presidium
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
    */
    async getMyCommittee(req, res) {
        try {
            // Check if user is presidium
            if (req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - presidium access required' });
            }

            const { committeeId } = req.user;

            // Get the committee that the presidium is assigned to
            const committee = await CommitteesModel.getCommitteeById(committeeId);

            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            return res.json(committee);
        } catch (error) {
            console.error('Error in getMyCommittee:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CommitteesController();