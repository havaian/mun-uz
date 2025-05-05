const EventsModel = require('./model');

class EventsController {
    async getAllEvents(request, reply) {
        try {
            // Get filter options from query parameters
            const filter = {};
            if (request.query.status) {
                filter.status = request.query.status;
            }

            const events = await EventsModel.getAllEvents(filter);
            return events;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async getEventById(request, reply) {
        try {
            const { id } = request.params;

            const event = await EventsModel.getEventById(id);

            if (!event) {
                return reply.code(404).send({ error: 'Event not found' });
            }

            return event;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async createEvent(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const eventData = request.body;

            // Set initial status if not provided
            if (!eventData.status) {
                eventData.status = 'draft';
            }

            const newEvent = await EventsModel.createEvent(eventData);

            return reply.code(201).send(newEvent);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async updateEvent(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const { id } = request.params;
            const eventData = request.body;

            // Check if event exists
            const existingEvent = await EventsModel.getEventById(id);
            if (!existingEvent) {
                return reply.code(404).send({ error: 'Event not found' });
            }

            // Update the event
            await EventsModel.updateEvent(id, eventData);

            // Return the updated event
            const updatedEvent = await EventsModel.getEventById(id);
            return updatedEvent;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }

    async deleteEvent(request, reply) {
        try {
            // Check if user is admin
            if (request.user.role !== 'admin') {
                return reply.code(403).send({ error: 'Forbidden - admin access required' });
            }

            const { id } = request.params;

            // Check if event exists
            const existingEvent = await EventsModel.getEventById(id);
            if (!existingEvent) {
                return reply.code(404).send({ error: 'Event not found' });
            }

            // Delete the event
            await EventsModel.deleteEvent(id);

            return { success: true };
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new EventsController();