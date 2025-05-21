const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
require('dotenv').config();

// Store WebSocket connections by committee
const committeeConnections = new Map();

// Setup Socket.IO
function setupSocketIO(server) {
    const io = socketIo(server, {
        cors: {
            origin: '*', // In production, set to your frontend domain
            methods: ['GET', 'POST']
        }
    });

    // Middleware for authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.query.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            // Verify token
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    // Handle connections
    io.on('connection', (socket) => {
        const { committeeId } = socket.handshake.query;

        // If user is presidium, check if they're assigned to this committee
        if (socket.user.role === 'presidium' && socket.user.committeeId !== committeeId) {
            socket.emit('error', { message: 'Not authorized for this committee' });
            socket.disconnect();
            return;
        }

        // Add connection to the committee's connections list
        if (!committeeConnections.has(committeeId)) {
            committeeConnections.set(committeeId, new Map());
        }

        const committeeClients = committeeConnections.get(committeeId);
        committeeClients.set(socket.id, {
            user: socket.user,
            socket
        });

        // Send connection confirmation
        socket.emit('connected', {
            message: 'Connected to committee WebSocket',
            user: {
                username: socket.user.username,
                role: socket.user.role,
                countryName: socket.user.countryName
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const committeeClients = committeeConnections.get(committeeId);
            if (committeeClients) {
                committeeClients.delete(socket.id);

                // If no more connections, remove the committee
                if (committeeClients.size === 0) {
                    committeeConnections.delete(committeeId);
                }
            }
        });

        // Handle messages
        socket.on('ping', () => {
            socket.emit('pong');
        });
    });

    return io;
}

// Function to broadcast a message to all committee connections
function broadcastToCommittee(committeeId, message) {
    const committeeClients = committeeConnections.get(committeeId);
    if (!committeeClients) {
        return;
    }

    for (const [socketId, client] of committeeClients.entries()) {
        try {
            client.socket.emit(message.type, message);
        } catch (error) {
            console.error('Error sending message to client:', error);
        }
    }
}

// Function to broadcast a message to specific roles in a committee
function broadcastToRoles(committeeId, roles, message) {
    const committeeClients = committeeConnections.get(committeeId);
    if (!committeeClients) {
        return;
    }

    for (const [socketId, client] of committeeClients.entries()) {
        if (roles.includes(client.user.role)) {
            try {
                client.socket.emit(message.type, message);
            } catch (error) {
                console.error('Error sending message to client:', error);
            }
        }
    }
}

// Function to send a message to a specific country
function sendToCountry(committeeId, countryName, message) {
    const committeeClients = committeeConnections.get(committeeId);
    if (!committeeClients) {
        return;
    }

    for (const [socketId, client] of committeeClients.entries()) {
        if (client.user.role === 'delegate' && client.user.countryName === countryName) {
            try {
                client.socket.emit(message.type, message);
            } catch (error) {
                console.error('Error sending message to client:', error);
            }
        }
    }
}

// Notification functions for different events

// Session events
function notifySessionCreated(committeeId, session) {
    broadcastToCommittee(committeeId, {
        type: 'session_created',
        session
    });
}

function notifySessionUpdated(committeeId, session) {
    broadcastToCommittee(committeeId, {
        type: 'session_updated',
        session
    });
}

function notifySessionCompleted(committeeId, session) {
    broadcastToCommittee(committeeId, {
        type: 'session_completed',
        session
    });
}

// Mode changes
function notifyModeChanged(committeeId, mode, duration) {
    broadcastToCommittee(committeeId, {
        type: 'mode_changed',
        mode,
        duration
    });
}

// Roll call updates
function notifyRollCallUpdated(committeeId, presentCountries, quorum) {
    broadcastToCommittee(committeeId, {
        type: 'roll_call_updated',
        presentCountries,
        quorum
    });
}

// Timer events
function notifyTimerStarted(committeeId, timerType, duration, targetCountry = null) {
    const message = {
        type: 'timer_started',
        timerType,
        duration,
        startTime: new Date()
    };

    if (targetCountry) {
        message.targetCountry = targetCountry;
    }

    broadcastToCommittee(committeeId, message);
}

function notifyTimerEnded(committeeId, timerType, targetCountry = null) {
    const message = {
        type: 'timer_ended',
        timerType
    };

    if (targetCountry) {
        message.targetCountry = targetCountry;
    }

    broadcastToCommittee(committeeId, message);
}

// Speaker list events
function notifySpeakerAdded(committeeId, countryName, position) {
    broadcastToCommittee(committeeId, {
        type: 'speaker_added',
        countryName,
        position
    });
}

function notifySpeakerRemoved(committeeId, countryName) {
    broadcastToCommittee(committeeId, {
        type: 'speaker_removed',
        countryName
    });
}

function notifyCurrentSpeaker(committeeId, countryName, duration) {
    broadcastToCommittee(committeeId, {
        type: 'current_speaker',
        countryName,
        duration
    });
}

// Resolution events
function notifyResolutionSubmitted(committeeId, resolution) {
    broadcastToCommittee(committeeId, {
        type: 'resolution_submitted',
        resolution
    });
}

function notifyResolutionReviewed(committeeId, resolution) {
    broadcastToCommittee(committeeId, {
        type: 'resolution_reviewed',
        resolution
    });
}

function notifyWorkingDraftSelected(committeeId, resolution) {
    broadcastToCommittee(committeeId, {
        type: 'working_draft_selected',
        resolution
    });
}

// Amendment events
function notifyAmendmentSubmitted(committeeId, amendment) {
    broadcastToCommittee(committeeId, {
        type: 'amendment_submitted',
        amendment
    });
}

function notifyAmendmentReviewed(committeeId, amendment) {
    broadcastToCommittee(committeeId, {
        type: 'amendment_reviewed',
        amendment
    });
}

// Voting events
function notifyVotingStarted(committeeId, voting) {
    broadcastToCommittee(committeeId, {
        type: 'voting_started',
        voting
    });
}

function notifyVoteSubmitted(committeeId, countryName, votingId) {
    broadcastToCommittee(committeeId, {
        type: 'vote_submitted',
        countryName,
        votingId
    });
}

function notifyVotingResults(committeeId, voting, stats) {
    broadcastToCommittee(committeeId, {
        type: 'voting_results',
        voting,
        stats
    });
}

// Speaker list events
function notifySpeakerListUpdated(committeeId, speakerList) {
    broadcastToCommittee(committeeId, {
        type: 'speaker_list_updated',
        speakerList
    });
}

// Timer events (enhanced)
function notifyTimerCreated(committeeId, timer) {
    broadcastToCommittee(committeeId, {
        type: 'timer_created',
        timer
    });
}

function notifyTimerUpdated(committeeId, timer) {
    broadcastToCommittee(committeeId, {
        type: 'timer_updated',
        timer
    });
}

// Motion events
function notifyMotionProposed(committeeId, motion) {
    broadcastToCommittee(committeeId, {
        type: 'motion_proposed',
        motion
    });
}

function notifyMotionStatusUpdated(committeeId, motion) {
    broadcastToCommittee(committeeId, {
        type: 'motion_status_updated',
        motion
    });
}

// Message events
function notifyNewMessage(committeeId, recipientCountry, message) {
    if (message.isCommitteeWide) {
        broadcastToCommittee(committeeId, {
            type: 'new_message',
            message
        });
    } else {
        sendToCountry(committeeId, recipientCountry, {
            type: 'new_message',
            message
        });
    }
}

module.exports = {
    setupSocketIO,
    broadcastToCommittee,
    broadcastToRoles,
    sendToCountry,
    notifySessionCreated,
    notifySessionUpdated,
    notifySessionCompleted,
    notifyModeChanged,
    notifyRollCallUpdated,
    notifyTimerStarted,
    notifyTimerEnded,
    notifySpeakerAdded,
    notifySpeakerRemoved,
    notifyCurrentSpeaker,
    notifyResolutionSubmitted,
    notifyResolutionReviewed,
    notifyWorkingDraftSelected,
    notifyAmendmentSubmitted,
    notifyAmendmentReviewed,
    notifyVotingStarted,
    notifyVoteSubmitted,
    notifyVotingResults,
    notifySpeakerListUpdated,
    notifyTimerCreated,
    notifyTimerUpdated,
    notifyMotionProposed,
    notifyMotionStatusUpdated,
    notifyNewMessage
};