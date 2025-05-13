const morgan = require('morgan');
const winston = require('winston');
const expressWinston = require('express-winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token for request body
morgan.token('req-body', (req) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return '{}';
    }
    try {
        const body = JSON.stringify(req.body);
        // Avoid logging sensitive information like passwords
        const sanitizedBody = body.replace(/"password":"[^"]*"/g, '"password":"[REDACTED]"');
        return sanitizedBody;
    } catch (error) {
        return '{"error": "Could not stringify request body"}';
    }
});

// Custom token for response body (requires response body capturing middleware)
morgan.token('res-body', (req, res) => {
    if (!res.body) {
        return '';
    }
    try {
        return typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    } catch (error) {
        return '{"error": "Could not stringify response body"}';
    }
});

// Custom token for request headers
morgan.token('req-headers', (req) => {
    try {
        const headers = { ...req.headers };

        // Redact sensitive headers
        if (headers.authorization) {
            headers.authorization = headers.authorization.replace(/Bearer .+/, 'Bearer [REDACTED]');
        }

        return JSON.stringify(headers);
    } catch (error) {
        return '{"error": "Could not stringify request headers"}';
    }
});

// Custom token for response headers
morgan.token('res-headers', (req, res) => {
    try {
        if (!res.getHeaders) {
            return '{}';
        }
        return JSON.stringify(res.getHeaders());
    } catch (error) {
        return '{"error": "Could not stringify response headers"}';
    }
});

// Custom token for file information
morgan.token('file-info', (req) => {
    try {
        if (req.file) {
            const { originalname, mimetype, size } = req.file;
            return JSON.stringify({ originalname, mimetype, size });
        }
        return '';
    } catch (error) {
        return '{"error": "Could not stringify file info"}';
    }
});

// Create the custom log format
const logFormat = [
    ':date[iso]',
    ':method :url',
    'HTTP/:http-version',
    ':status',
    ':response-time ms',
    'IP: :remote-addr',
    'User Agent: :user-agent',
    'Request Headers: :req-headers',
    'Request Body: :req-body',
    'Response Headers: :res-headers',
    'Response Body: :res-body',
    'File: :file-info'
].join(' | ');

// Response body capturing middleware
function captureResponseBody(req, res, next) {
    if (!res || !res.send) {
        return next();
    }

    const originalSend = res.send;

    res.send = function (body) {
        try {
            res.body = body;
        } catch (error) {
            console.error('Error capturing response body:', error);
        }
        return originalSend.call(this, body);
    };

    next();
}

// HTTP request logger middleware
const httpLogger = morgan(logFormat, {
    stream: fs.createWriteStream(path.join(logsDir, 'http.log'), { flags: 'a' })
});

// Console logger for development
const consoleLogger = morgan(logFormat);

// Winston logger configuration
const winstonLogger = expressWinston.logger({
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'errors.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    meta: true,
    expressFormat: true,
    colorize: false,
    dynamicMeta: (req, res) => {
        try {
            return {
                requestBody: req.body || {},
                responseBody: res.body || {},
                file: req.file || {}
            };
        } catch (error) {
            return {
                error: 'Failed to capture request/response metadata'
            };
        }
    }
});

// Configure request logging middleware
function setupLogging(app) {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
        try {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log(`Created logs directory at: ${logsDir}`);
        } catch (error) {
            console.error(`Failed to create logs directory: ${error.message}`);
        }
    }

    // Capture response body for logging - this must come before other middleware
    app.use(captureResponseBody);

    // Skip logging for health check endpoints
    const skipHealthCheck = (req, res) => {
        const url = req.originalUrl || req.url;
        return url === '/health' || url === '/api/health' ||
            url.startsWith('/health?') || url.startsWith('/api/health?');
    };

    // Development console logging
    if (process.env.NODE_ENV !== 'production') {
        app.use(morgan(logFormat, {
            skip: skipHealthCheck,
            stream: process.stdout
        }));
    }

    // File logging for all environments
    try {
        app.use(morgan(logFormat, {
            skip: skipHealthCheck,
            stream: fs.createWriteStream(path.join(logsDir, 'http.log'), { flags: 'a' })
        }));
    } catch (error) {
        console.error(`Error setting up HTTP logger: ${error.message}`);
    }

    // Winston logger for additional file logging
    try {
        app.use(expressWinston.logger({
            transports: [
                new winston.transports.File({
                    filename: path.join(logsDir, 'combined.log'),
                    maxsize: 10485760, // 10MB
                    maxFiles: 10,
                }),
                new winston.transports.File({
                    filename: path.join(logsDir, 'errors.log'),
                    level: 'error',
                    maxsize: 10485760, // 10MB
                    maxFiles: 10,
                })
            ],
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            meta: true,
            expressFormat: true,
            colorize: false,
            dynamicMeta: (req, res) => {
                try {
                    return {
                        requestBody: req.body || {},
                        responseBody: res.body || {},
                        file: req.file || {}
                    };
                } catch (error) {
                    return {
                        error: 'Failed to capture request/response metadata'
                    };
                }
            },
            // Skip health check endpoints
            skip: skipHealthCheck
        }));
    } catch (error) {
        console.error(`Error setting up Winston logger: ${error.message}`);
    }

    // Log errors
    try {
        app.use(expressWinston.errorLogger({
            transports: [
                new winston.transports.File({
                    filename: path.join(logsDir, 'errors.log'),
                    maxsize: 10485760, // 10MB
                    maxFiles: 10,
                })
            ],
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            // Skip health check endpoints
            skip: skipHealthCheck
        }));
    } catch (error) {
        console.error(`Error setting up error logger: ${error.message}`);
    }

    console.log('Request logging configured successfully');
}

module.exports = setupLogging;