const express = require('express');
const fs = require('fs');
const path = require('path');
var cors = require('cors')
const app = express();
const PORT = 8080;

app.use(cors({
  origin: 'http://localhost:3000' // Replace with your React app's origin
}));

// Middleware for JSON parsing
app.use(express.json());

// Read the database
const dbPath = path.join(__dirname, 'db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Helper function to get paginated results
function getPaginatedResults(data, query) {
  const limit = parseInt(query.limit) || 10;
  const offset = parseInt(query.offset) || 0;

  const total = data.length;
  const total_pages = Math.ceil(total / limit);
  const page = Math.floor(offset / limit) + 1;

  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    total,
    page,
    per_page: limit,
    total_pages
  };
}

// API endpoints
app.get('/api/v1/compositions', (req, res) => {
  const result = getPaginatedResults(db.compositions, req.query);
  res.json(result);
});

app.get('/api/v1/champions', (req, res) => {
  const result = getPaginatedResults(db.champions, req.query);
  res.json(result);
});

app.get('/api/v1/items', (req, res) => {
  const result = getPaginatedResults(db.items, req.query);
  res.json(result);
});

// Individual item endpoints
app.get('/api/v1/compositions/:id', (req, res) => {
  const composition = db.compositions.find(c => c.id === req.params.id);
  if (composition) {
    res.json(composition);
  } else {
    res.status(404).json({ error: 'Composition not found' });
  }
});

app.get('/api/v1/champions/:id', (req, res) => {
  const champion = db.champions.find(c => c.id === req.params.id);
  if (champion) {
    res.json(champion);
  } else {
    res.status(404).json({ error: 'Champion not found' });
  }
});

app.get('/api/v1/items/:id', (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});