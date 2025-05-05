const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

class EventsModel {
    constructor() {
        this.collection = getDb().collection('events');
    }

    async getAllEvents(filter = {}) {
        return this.collection.find(filter).sort({ startDate: -1 }).toArray();
    }

    async getEventById(id) {
        return this.collection.findOne({ _id: new ObjectId(id) });
    }

    async createEvent(eventData) {
        // Add timestamps
        eventData.createdAt = new Date();
        eventData.updatedAt = new Date();

        // Convert dates to Date objects if they're strings
        if (typeof eventData.startDate === 'string') {
            eventData.startDate = new Date(eventData.startDate);
        }
        if (typeof eventData.endDate === 'string') {
            eventData.endDate = new Date(eventData.endDate);
        }

        const result = await this.collection.insertOne(eventData);
        return { ...eventData, _id: result.insertedId };
    }

    async updateEvent(id, eventData) {
        // Update timestamp
        eventData.updatedAt = new Date();

        // Convert dates to Date objects if they're strings
        if (typeof eventData.startDate === 'string') {
            eventData.startDate = new Date(eventData.startDate);
        }
        if (typeof eventData.endDate === 'string') {
            eventData.endDate = new Date(eventData.endDate);
        }

        return this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: eventData }
        );
    }

    async deleteEvent(id) {
        return this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = new EventsModel();