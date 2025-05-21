const mongoose = require('mongoose');

// Define Message Schema
const messageSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    senderCountry: {
        type: String,
        required: true
    },
    recipientCountry: {
        type: String
    },
    isFromPresidium: {
        type: Boolean,
        default: false
    },
    isCommitteeWide: {
        type: Boolean,
        default: false
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create model
const Message = mongoose.model('Message', messageSchema);

class MessagesModel {
    async getMessagesForCountry(committeeId, countryName) {
        return Message.find({
            committeeId,
            $or: [
                { recipientCountry: countryName },
                { isCommitteeWide: true }
            ]
        }).sort({ createdAt: -1 });
    }

    async getSentMessages(committeeId, senderCountry) {
        return Message.find({
            committeeId,
            senderCountry
        }).sort({ createdAt: -1 });
    }

    async getMessageById(id) {
        return Message.findById(id);
    }

    async createMessage(messageData) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        return newMessage;
    }

    async markAsRead(id) {
        return Message.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );
    }

    async getPresidiumMessages(committeeId) {
        return Message.find({
            committeeId,
            isFromPresidium: true
        }).sort({ createdAt: -1 });
    }

    async getUnreadCount(committeeId, countryName) {
        return Message.countDocuments({
            committeeId,
            $or: [
                { recipientCountry: countryName },
                { isCommitteeWide: true }
            ],
            isRead: false
        });
    }
}

module.exports = new MessagesModel();