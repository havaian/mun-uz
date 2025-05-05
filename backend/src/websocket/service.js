const jwt = require('jsonwebtoken');
require('dotenv').config();

// Store WebSocket connections by committee
const committeeConnections = new Map();

// Set up WebSocket route
async function websocketRoute(fastify) {
    fastify.register(async function (fastify) {
        fastify.get('/ws/committees/:committeeId', { websocket: true }, (connection, req) => {
            const { committeeId } = req.params;

            // Authenticate the connection
            let user;
            try {
                // Get token from query parameter
                const token = req.query.token;
                if (!token) {
                    connection.socket.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
                    connection.socket.close();
                    return;
                }

                // Verify token
                user = jwt.verify(token, process.env.JWT_SECRET);

                // If user is presidium, check if they're assigned to this committee
                if (user.role === 'presidium' && user.committeeId !== committeeId) {
                    connection.socket.send(JSON.stringify({ type: 'error', message: 'Not authorized for this committee' }));
                    connection.socket.close();
                    return;
                }

                // Add connection to the committee's connections list
                if (!committeeConnections.has(committeeId)) {
                    committeeConnections.set(committeeId, new Map());
                }

                const committeeClients = committeeConnections.get(committeeId);
                committeeClients.set(connection.socket, {
                    user,
                    connection
                });

                // Send connection confirmation
                connection.socket.send(JSON.stringify({
                    type: 'connected',
                    message: 'Connected to committee WebSocket',
                    user: {
                        username: user.username,
                        role: user.role,
                        countryName: user.countryName
                    }
                }));

                // Handle disconnect
                connection.socket.on('close', () => {
                    const committeeClients = committeeConnections.get(committeeId);
                    if (committeeClients) {
                        committeeClients.delete(connection.socket);

                        // If no more connections, remove the committee
                        if (committeeClients.size === 0) {
                            committeeConnections.delete(committeeId);
                        }
                    }
                });

                // Handle messages
                connection.socket.on('message', (message) => {
                    try {
                        const data = JSON.parse(message.toString());

                        // Handle different message types
                        switch (data.type) {
                            case 'ping':
                                connection.socket.send(JSON.stringify({ type: 'pong' }));
                                break;

                            default:
                                // Ignore other message types
                                break;
                        }
                    } catch (error) {
                        fastify.log.error('WebSocket message error:', error);
                    }
                });
            } catch (error) {
                fastify.log.error('WebSocket authentication error:', error);
                connection.socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
                connection.socket.close();
            }
        });
    });
}

// Function to broadcast a message to all committee connections
function broadcastToCommittee(committeeId, message) {
    const committeeClients = committeeConnections.get(committeeId);
    if (!committeeClients) {
        return;
    }

    const messageString = JSON.stringify(message);

    for (const [socket, client] of committeeClients.entries()) {
        try {
            socket.send(messageString);
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

    const messageString = JSON.stringify(message);

    for (const [socket, client] of committeeClients.entries()) {
        if (roles.includes(client.user.role)) {
            try {
                socket.send(messageString);
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

    const messageString = JSON.stringify(message);

    for (const [socket, client] of committeeClients.entries()) {
        if (client.user.role === 'delegate' && client.user.countryName === countryName) {
            try {
                socket.send(messageString);
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

module.exports = {
    websocketRoute,
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
    notifyVotingResults
};