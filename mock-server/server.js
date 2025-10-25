// server.js
const jsonServer = require('json-server');
const express = require('express');

const server = express();
const router = jsonServer.router('db.json'); // Your JSON data file
const middlewares = jsonServer.defaults();

// Apply JSON Server defaults middleware
server.use(middlewares);

// Mount JSON Server router with a prefix
// All requests to /api/v1 will be handled by JSON Server
server.use('/api/v1', router);

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`JSON Server with prefix running on http://localhost:${PORT}/api/v1`);
});