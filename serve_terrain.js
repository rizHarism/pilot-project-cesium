const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// 1. FIX: Add CORS headers to every response
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    console.log(`Requesting: ${req.url}`);
    next();
});

// 2. The Gzip Fix for .terrain files
app.get(/.*\.terrain$/, (req, res, next) => {
    res.set('Content-Encoding', 'gzip');
    res.set('Content-Type', 'application/octet-stream');
    next();
});

// 3. Serve the static files
app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`-------------------------------------------------`);
    console.log(`Terrain server running at http://localhost:${port}`);
    console.log(`CORS is enabled for all origins.`);
    console.log(`-------------------------------------------------`);
});