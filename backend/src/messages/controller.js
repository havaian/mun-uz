const MessagesModel = require('./model');
const CommitteesModel = require('../committees/model');
const WebSocketService = require('../websocket/service');

class MessagesController {
    async getMessagesForCountry(req, res) {
        try {
            // Check if user is a delegate or presidium
            if (req.user.role !== 'delegate' && req.user.role !== 'presidium' && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - access denied' });
            }

            const { committeeId } = req.params;
            let countryName;

            // Get messages based on user role
            if (req.user.role === 'delegate') {
                countryName = req.user.countryName;

                // Check if delegate belongs to this committee
                if (req.user.committeeId !== committeeId) {
                    return res.status(403).json({ error: 'Forbidden - you can only access messages in your assigned committee' });
                }
            } else if (req.user.role === 'presidium') {
                countryName = req.query.countryName;

                // Check if presidium belongs to this committee
                if (req.user.committeeId !== committeeId) {
                    return res.status(403).json({ error: 'Forbidden - you can only access messages in your assigned committee' });
                }

                // If no countryName provided, get all committee-wide messages
                if (!countryName) {
                    const messages = await MessagesModel.getPresidiumMessages(committeeId);
                    return res.json(messages);
                }
            }

            const messages = await MessagesModel.getMessagesForCountry(committeeId, countryName);

            return res.json(messages);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getSentMessages(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can access sent messages' });
            }

            const { committeeId } = req.params;
            const { countryName } = req.user;

            // Check if delegate belongs to this committee
            if (req.user.committeeId !== committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only access messages in your assigned committee' });
            }

            const messages = await MessagesModel.getSentMessages(committeeId, countryName);

            return res.json(messages);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createMessage(req, res) {
        try {
            // Check if user is a delegate or presidium
            if (req.user.role !== 'delegate' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - only delegates and presidium can send messages' });
            }

            const messageData = req.body;

            // Check if committee exists
            const committee = await CommitteesModel.getCommitteeById(messageData.committeeId);
            if (!committee) {
                return res.status(404).json({ error: 'Committee not found' });
            }

            // Check if the user belongs to this committee
            if (req.user.committeeId !== messageData.committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only send messages in your assigned committee' });
            }

            // Set sender and message type based on user role
            if (req.user.role === 'delegate') {
                messageData.senderCountry = req.user.countryName;
                messageData.isFromPresidium = false;

                // Validate if recipient country exists in the committee
                if (!messageData.isCommitteeWide && !committee.countries.some(c => c.name === messageData.recipientCountry)) {
                    return res.status(400).json({ error: 'Recipient country not found in committee' });
                }
            } else if (req.user.role === 'presidium') {
                messageData.senderCountry = 'Presidium';
                messageData.isFromPresidium = true;
            }

            // Create the message
            const newMessage = await MessagesModel.createMessage(messageData);

            // Notify recipient or all delegates if committee-wide
            if (messageData.isCommitteeWide) {
                WebSocketService.broadcastToCommittee(messageData.committeeId, {
                    type: 'new_message',
                    message: newMessage
                });
            } else {
                WebSocketService.sendToCountry(messageData.committeeId, messageData.recipientCountry, {
                    type: 'new_message',
                    message: newMessage
                });
            }

            return res.status(201).json(newMessage);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async markAsRead(req, res) {
        try {
            // Check if user is a delegate or presidium
            if (req.user.role !== 'delegate' && req.user.role !== 'presidium') {
                return res.status(403).json({ error: 'Forbidden - access denied' });
            }

            const { id } = req.params;

            // Check if message exists
            const message = await MessagesModel.getMessageById(id);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            // Check if the user belongs to this message's committee
            if (req.user.committeeId !== message.committeeId.toString()) {
                return res.status(403).json({ error: 'Forbidden - you can only access messages in your assigned committee' });
            }

            // If delegate, check if they are the recipient
            if (req.user.role === 'delegate' &&
                message.recipientCountry !== req.user.countryName &&
                !message.isCommitteeWide) {
                return res.status(403).json({ error: 'Forbidden - you can only mark your own messages as read' });
            }

            // Mark message as read
            const updatedMessage = await MessagesModel.markAsRead(id);

            return res.json(updatedMessage);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getUnreadCount(req, res) {
        try {
            // Check if user is a delegate
            if (req.user.role !== 'delegate') {
                return res.status(403).json({ error: 'Forbidden - only delegates can check unread count' });
            }

            const { committeeId } = req.params;
            const { countryName } = req.user;

            // Check if delegate belongs to this committee
            if (req.user.committeeId !== committeeId) {
                return res.status(403).json({ error: 'Forbidden - you can only access messages in your assigned committee' });
            }

            const unreadCount = await MessagesModel.getUnreadCount(committeeId, countryName);

            return res.json({ unreadCount });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new MessagesController();