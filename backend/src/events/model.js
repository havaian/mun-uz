const mongoose = require('mongoose');

// Define Event Schema
const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed'],
        default: 'draft'
    }
}, { timestamps: true });

// Create model
const Event = mongoose.model('Event', eventSchema);

class EventsModel {
    async getAllEvents(filter = {}) {
        return Event.find(filter).sort({ startDate: -1 });
    }

    async getEventById(id) {
        return Event.findById(id);
    }

    async createEvent(eventData) {
        // Convert dates to Date objects if they're strings
        if (typeof eventData.startDate === 'string') {
            eventData.startDate = new Date(eventData.startDate);
        }
        if (typeof eventData.endDate === 'string') {
            eventData.endDate = new Date(eventData.endDate);
        }

        const newEvent = new Event(eventData);
        await newEvent.save();
        return newEvent;
    }

    async updateEvent(id, eventData) {
        // Convert dates to Date objects if they're strings
        if (typeof eventData.startDate === 'string') {
            eventData.startDate = new Date(eventData.startDate);
        }
        if (typeof eventData.endDate === 'string') {
            eventData.endDate = new Date(eventData.endDate);
        }

        return Event.findByIdAndUpdate(
            id,
            eventData,
            { new: true }
        );
    }

    async deleteEvent(id) {
        return Event.findByIdAndDelete(id);
    }
}

module.exports = new EventsModel();