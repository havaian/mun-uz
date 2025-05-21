const mongoose = require('mongoose');

const speakerListSchema = new mongoose.Schema({
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
    speakers: [{
        countryName: String,
        addedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['waiting', 'current', 'finished'],
            default: 'waiting'
        },
        speakingStartTime: Date,
        speakingEndTime: Date,
        duration: Number
    }],
    currentSpeakerIndex: {
        type: Number,
        default: -1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Utility methods for speaker list
speakerListSchema.methods.addSpeaker = function (countryName) {
    const existingIndex = this.speakers.findIndex(s =>
        s.countryName === countryName && s.status === 'waiting');

    if (existingIndex === -1) {
        this.speakers.push({ countryName, status: 'waiting' });
    }
    return this;
};

speakerListSchema.methods.removeSpeaker = function (countryName) {
    const index = this.speakers.findIndex(s =>
        s.countryName === countryName && s.status === 'waiting');

    if (index !== -1) {
        this.speakers.splice(index, 1);
    }
    return this;
};

speakerListSchema.methods.nextSpeaker = function () {
    if (this.currentSpeakerIndex !== -1 && this.speakers[this.currentSpeakerIndex]) {
        const current = this.speakers[this.currentSpeakerIndex];
        current.status = 'finished';
        current.speakingEndTime = new Date();

        if (current.speakingStartTime) {
            current.duration = Math.floor((current.speakingEndTime - current.speakingStartTime) / 1000);
        }
    }

    const nextIndex = this.speakers.findIndex(s => s.status === 'waiting');

    if (nextIndex !== -1) {
        this.currentSpeakerIndex = nextIndex;
        this.speakers[nextIndex].status = 'current';
        this.speakers[nextIndex].speakingStartTime = new Date();
    } else {
        this.currentSpeakerIndex = -1;
    }

    return this;
};

speakerListSchema.methods.getCurrentSpeaker = function () {
    if (this.currentSpeakerIndex !== -1 && this.speakers[this.currentSpeakerIndex]) {
        return this.speakers[this.currentSpeakerIndex];
    }
    return null;
};

speakerListSchema.methods.moveToEnd = function (countryName) {
    const index = this.speakers.findIndex(s =>
        s.countryName === countryName && s.status === 'waiting');

    if (index !== -1) {
        const speaker = this.speakers.splice(index, 1)[0];
        this.speakers.push(speaker);
    }
    return this;
};

module.exports = mongoose.model('SpeakerList', speakerListSchema);