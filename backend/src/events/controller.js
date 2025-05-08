const EventsModel = require('./model');

class EventsController {
    async getAllEvents(req, res) {
        try {
            // Get filter options from query parameters
            const filter = {};
            if (req.query.status) {
                filter.status = req.query.status;
            }

            const events = await EventsModel.getAllEvents(filter);
            return res.json(events);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getEventById(req, res) {
        try {
            const { id } = req.params;

            const event = await EventsModel.getEventById(id);

            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            return res.json(event);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createEvent(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const eventData = req.body;

            // Set initial status if not provided
            if (!eventData.status) {
                eventData.status = 'draft';
            }

            const newEvent = await EventsModel.createEvent(eventData);

            return res.status(201).json(newEvent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateEvent(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { id } = req.params;
            const eventData = req.body;

            // Check if event exists
            const existingEvent = await EventsModel.getEventById(id);
            if (!existingEvent) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Update the event
            await EventsModel.updateEvent(id, eventData);

            // Return the updated event
            const updatedEvent = await EventsModel.getEventById(id);
            return res.json(updatedEvent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteEvent(req, res) {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden - admin access required' });
            }

            const { id } = req.params;

            // Check if event exists
            const existingEvent = await EventsModel.getEventById(id);
            if (!existingEvent) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Delete the event
            await EventsModel.deleteEvent(id);

            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new EventsController();