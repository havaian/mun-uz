const mongoose = require('mongoose');

const timerSchema = new mongoose.Schema({
    committeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Committee',
        required: true
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    type: {
        type: String,
        enum: ['session', 'speaker', 'custom'],
        required: true
    },
    label: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    startTime: Date,
    pausedAt: Date,
    elapsedTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['idle', 'running', 'paused', 'finished'],
        default: 'idle'
    },
    targetCountry: String
}, { timestamps: true });

// Methods to manage timer states
timerSchema.methods.start = function () {
    if (this.status === 'idle' || this.status === 'paused') {
        this.status = 'running';
        this.startTime = new Date();
        if (this.pausedAt) {
            // If resuming from pause, adjust the start time
            this.startTime = new Date(Date.now() - this.elapsedTime * 1000);
            this.pausedAt = null;
        }
    }
    return this;
};

timerSchema.methods.pause = function () {
    if (this.status === 'running') {
        this.status = 'paused';
        this.pausedAt = new Date();
        this.elapsedTime = Math.floor((this.pausedAt - this.startTime) / 1000);
    }
    return this;
};

timerSchema.methods.reset = function () {
    this.status = 'idle';
    this.startTime = null;
    this.pausedAt = null;
    this.elapsedTime = 0;
    return this;
};

timerSchema.methods.finish = function () {
    this.status = 'finished';
    if (this.startTime) {
        const endTime = new Date();
        this.elapsedTime = Math.floor((endTime - this.startTime) / 1000);
    }
    return this;
};

timerSchema.methods.getRemainingTime = function () {
    if (this.status === 'idle') {
        return this.duration;
    }

    if (this.status === 'paused') {
        return this.duration - this.elapsedTime;
    }

    if (this.status === 'running' && this.startTime) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        return Math.max(0, this.duration - elapsed);
    }

    if (this.status === 'finished') {
        return 0;
    }

    return this.duration;
};

module.exports = mongoose.model('Timer', timerSchema);