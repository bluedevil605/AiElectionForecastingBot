const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config();

/**
 * DEEP DIAGNOSTICS: Write all status to a persistent log file
 * to catch silent exits in this terminal environment.
 */
const logFile = path.join(__dirname, 'server-debug.log');
function debugLog(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(logFile, line);
}

debugLog('--- SERVER STARTING ---');

// ─── GLOBAL ERROR HANDLERS ──────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    debugLog(`[UnhandledRejection] Reason: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (err) => {
    debugLog(`[UncaughtException] Error: ${err.stack}`);
});

process.on('exit', (code) => {
    debugLog(`[ProcessExit] Code: ${code}`);
});

process.on('SIGINT',  () => { debugLog('Received SIGINT');  process.exit(0); });
process.on('SIGTERM', () => { debugLog('Received SIGTERM'); process.exit(0); });

// ─── APP SETUP ─────────────────────────────────────────────────────────────
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes.',
        rate_limit: true
    }
});
app.use('/api/', apiLimiter);

try {
    const forecastRouter = require('./routes/forecast');
    const realtimeRouter = require('./routes/realtime');

    app.use('/api/forecast', forecastRouter);
    app.use('/api/realtime', realtimeRouter);
    debugLog('Routers loaded successfully.');
} catch (err) {
    debugLog(`Router Load Error: ${err.stack}`);
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    debugLog(`\nServer listening on port ${PORT}`);
    debugLog(`Health: http://localhost:${PORT}/api/health\n`);
});

server.on('error', (err) => {
    debugLog(`[ServerEvent:Error] ${err.stack}`);
});

server.on('close', () => {
    debugLog('[ServerEvent:Close] Server handle was closed.');
});

// Heartbeat removed as per Rule 4.

