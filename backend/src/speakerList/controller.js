const SpeakerList = require('./model');
const Activity = require('../statistics/model');
const WebSocketService = require('../websocket/service');

// Get speaker list for a session
exports.getSpeakerList = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const speakerList = await SpeakerList.findOne({ sessionId });

        if (!speakerList) {
            return res.status(404).json({ message: 'Speaker list not found' });
        }

        res.status(200).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new speaker list for a session
exports.createSpeakerList = async (req, res) => {
    try {
        const { committeeId, sessionId } = req.body;

        const existingList = await SpeakerList.findOne({ sessionId });
        if (existingList) {
            return res.status(400).json({ message: 'Speaker list already exists for this session' });
        }

        const speakerList = new SpeakerList({
            committeeId,
            sessionId
        });

        await speakerList.save();

        WebSocketService.notifyCommittee(committeeId, 'speakerListUpdated', speakerList);

        res.status(201).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a speaker to the list
exports.addSpeaker = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { countryName } = req.body;

        const speakerList = await SpeakerList.findOne({ sessionId });

        if (!speakerList) {
            return res.status(404).json({ message: 'Speaker list not found' });
        }

        speakerList.addSpeaker(countryName);
        await speakerList.save();

        WebSocketService.notifyCommittee(speakerList.committeeId, 'speakerAdded', {
            speakerList,
            countryName
        });

        res.status(200).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove a speaker from the list
exports.removeSpeaker = async (req, res) => {
    try {
        const { sessionId, countryName } = req.params;

        const speakerList = await SpeakerList.findOne({ sessionId });

        if (!speakerList) {
            return res.status(404).json({ message: 'Speaker list not found' });
        }

        speakerList.removeSpeaker(countryName);
        await speakerList.save();

        WebSocketService.notifyCommittee(speakerList.committeeId, 'speakerRemoved', {
            speakerList,
            countryName
        });

        res.status(200).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Move to the next speaker
exports.nextSpeaker = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const speakerList = await SpeakerList.findOne({ sessionId });

        if (!speakerList) {
            return res.status(404).json({ message: 'Speaker list not found' });
        }

        const currentSpeaker = speakerList.getCurrentSpeaker();

        speakerList.nextSpeaker();
        await speakerList.save();

        // Record activity for previous speaker if exists
        if (currentSpeaker && currentSpeaker.duration) {
            const activity = new Activity({
                committeeId: speakerList.committeeId,
                sessionId: speakerList.sessionId,
                countryName: currentSpeaker.countryName,
                activityType: 'speech',
                duration: currentSpeaker.duration
            });

            await activity.save();
        }

        // Get the new current speaker
        const newCurrentSpeaker = speakerList.getCurrentSpeaker();

        WebSocketService.notifyCommittee(speakerList.committeeId, 'currentSpeakerChanged', {
            speakerList,
            previousSpeaker: currentSpeaker ? currentSpeaker.countryName : null,
            currentSpeaker: newCurrentSpeaker ? newCurrentSpeaker.countryName : null
        });

        res.status(200).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Move a speaker to the end of the list
exports.moveToEnd = async (req, res) => {
    try {
        const { sessionId, countryName } = req.params;

        const speakerList = await SpeakerList.findOne({ sessionId });

        if (!speakerList) {
            return res.status(404).json({ message: 'Speaker list not found' });
        }

        speakerList.moveToEnd(countryName);
        await speakerList.save();

        WebSocketService.notifyCommittee(speakerList.committeeId, 'speakerListUpdated', speakerList);

        res.status(200).json(speakerList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};