const express = require('express');
const router = express.Router();

router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // SSE intervals removed as per Rule 4.
    res.write(`data: ${JSON.stringify({ type: "connected", msg: "Gemini Realtime Stream Ready" })}\n\n`);

    req.on('close', () => {
        // Nothing to clear
    });
});

module.exports = router;
