const Timer = require('./model');
const WebSocketService = require('../websocket/service');

// Get all timers for a session
exports.getTimers = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const timers = await Timer.find({ sessionId });

        res.status(200).json(timers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new timer
exports.createTimer = async (req, res) => {
    try {
        const { committeeId, sessionId, type, duration, label, targetCountry } = req.body;

        const timer = new Timer({
            committeeId,
            sessionId,
            type,
            duration,
            label: label || '',
            targetCountry
        });

        await timer.save();

        WebSocketService.notifyCommittee(committeeId, 'timerCreated', timer);

        res.status(201).json(timer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Start a timer
exports.startTimer = async (req, res) => {
    try {
        const { timerId } = req.params;

        const timer = await Timer.findById(timerId);

        if (!timer) {
            return res.status(404).json({ message: 'Timer not found' });
        }

        timer.start();
        await timer.save();

        WebSocketService.notifyCommittee(timer.committeeId, 'timerStarted', {
            timerId: timer._id,
            remainingTime: timer.getRemainingTime()
        });

        res.status(200).json(timer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Pause a timer
exports.pauseTimer = async (req, res) => {
    try {
        const { timerId } = req.params;

        const timer = await Timer.findById(timerId);

        if (!timer) {
            return res.status(404).json({ message: 'Timer not found' });
        }

        timer.pause();
        await timer.save();

        WebSocketService.notifyCommittee(timer.committeeId, 'timerPaused', {
            timerId: timer._id,
            remainingTime: timer.getRemainingTime()
        });

        res.status(200).json(timer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset a timer
exports.resetTimer = async (req, res) => {
    try {
        const { timerId } = req.params;

        const timer = await Timer.findById(timerId);

        if (!timer) {
            return res.status(404).json({ message: 'Timer not found' });
        }

        timer.reset();
        await timer.save();

        WebSocketService.notifyCommittee(timer.committeeId, 'timerReset', {
            timerId: timer._id,
            remainingTime: timer.getRemainingTime()
        });

        res.status(200).json(timer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a timer
exports.deleteTimer = async (req, res) => {
    try {
        const { timerId } = req.params;

        const timer = await Timer.findById(timerId);

        if (!timer) {
            return res.status(404).json({ message: 'Timer not found' });
        }

        await Timer.deleteOne({ _id: timerId });

        WebSocketService.notifyCommittee(timer.committeeId, 'timerDeleted', {
            timerId: timer._id
        });

        res.status(200).json({ message: 'Timer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get remaining time for a timer
exports.getRemainingTime = async (req, res) => {
    try {
        const { timerId } = req.params;

        const timer = await Timer.findById(timerId);

        if (!timer) {
            return res.status(404).json({ message: 'Timer not found' });
        }

        const remainingTime = timer.getRemainingTime();

        res.status(200).json({ timerId: timer._id, remainingTime });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};