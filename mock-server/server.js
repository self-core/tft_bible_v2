const express = require('express');
const fs = require('fs');
const path = require('path');
var cors = require('cors')
const app = express();
const PORT = 8080;

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware for JSON parsing
app.use(express.json());

// Read the databases
const dbPath = path.join(__dirname, 'db.json');
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Read the icon mappings
const championIconsPath = path.join(__dirname, 'champion-icons.json');
const itemIconsPath = path.join(__dirname, 'item-icons.json');
const championIcons = JSON.parse(fs.readFileSync(championIconsPath, 'utf8'));
const itemIcons = JSON.parse(fs.readFileSync(itemIconsPath, 'utf8'));

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
  // Create summary versions of compositions for the list endpoint
  let filteredCompositions = [...db.compositions];
  
  // Apply filters based on query parameters
  const { tier, category, champion, difficulty } = req.query;
  
  if (tier) {
    filteredCompositions = filteredCompositions.filter(comp => 
      (comp.meta?.tier || comp.tier)?.toLowerCase() === tier.toLowerCase()
    );
  }
  
  if (category) {
    filteredCompositions = filteredCompositions.filter(comp => 
      comp.category?.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (champion) {
    filteredCompositions = filteredCompositions.filter(comp => 
      comp.champions && comp.champions.some(c => 
        c.name.toLowerCase().includes(champion.toLowerCase())
      )
    );
  }
  
  if (difficulty) {
    const difficultyNum = parseInt(difficulty);
    if (!isNaN(difficultyNum)) {
      filteredCompositions = filteredCompositions.filter(comp => 
        (comp.meta?.difficulty || comp.difficulty) === difficultyNum
      );
    }
  }
  
  // Create summary versions of filtered compositions
  const compositionSummaries = filteredCompositions.map(comp => ({
    id: comp.id,
    name: comp.name,
    category: comp.category,
    tier: comp.meta?.tier || comp.tier || 'C',
    difficulty: comp.meta?.difficulty || comp.difficulty || 1,
    winrate: comp.meta?.winrate || comp.winrate || 50,
    views: comp.views || 0,
    upvotes: comp.votes?.upvotes || comp.upvotes || 0,
    created_at: comp.created_at || new Date().toISOString(),
    builder_code: comp.builder_code,
    champions: comp.champions ? comp.champions.map(c => ({
      id: c.id,
      name: c.name,
      cost: c.cost,
      traits: c.traits,
      icon_url: championIcons[c.id] || null
    })) : []
  }));
  
  const result = getPaginatedResults(compositionSummaries, req.query);
  res.json(result);
});

app.get('/api/v1/champions', (req, res) => {
  // Enhance champions with icon urls
  const enhancedChampions = db.champions.map(champ => ({
    ...champ,
    icon_url: championIcons[champ.id] || null
  }));
  const result = getPaginatedResults(enhancedChampions, req.query);
  res.json(result);
});

app.get('/api/v1/items', (req, res) => {
  // Enhance items with icon urls
  const enhancedItems = db.items.map(item => ({
    ...item,
    icon_url: itemIcons[item.id] || null
  }));
  const result = getPaginatedResults(enhancedItems, req.query);
  res.json(result);
});

// Individual item endpoints
app.get('/api/v1/compositions/:id', (req, res) => {
  const composition = db.compositions.find(c => c.id === req.params.id);
  if (composition) {
    // Enhance champions with icon urls
    const enhancedComposition = {
      ...composition,
      champions: composition.champions ? composition.champions.map(champion => ({
        ...champion,
        icon_url: championIcons[champion.id] || null
      })) : []
    };
    res.json(enhancedComposition);
  } else {
    res.status(404).json({ error: 'Composition not found' });
  }
});

app.get('/api/v1/champions/:id', (req, res) => {
  const champion = db.champions.find(c => c.id === req.params.id);
  if (champion) {
    const enhancedChampion = {
      ...champion,
      icon_url: championIcons[champion.id] || null
    };
    res.json(enhancedChampion);
  } else {
    res.status(404).json({ error: 'Champion not found' });
  }
});

app.get('/api/v1/items/:id', (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (item) {
    const enhancedItem = {
      ...item,
      icon_url: itemIcons[item.id] || null
    };
    res.json(enhancedItem);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Search endpoint
app.get('/api/v1/search', (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.json({
      compositions: [],
      champions: [],
      items: []
    });
  }
  
  const searchTerm = q.toLowerCase();
  
  let results = {
    compositions: [],
    champions: [],
    items: []
  };
  
  if (!type || type === 'compositions') {
    results.compositions = db.compositions
      .filter(comp => 
        comp.name.toLowerCase().includes(searchTerm) ||
        comp.description.toLowerCase().includes(searchTerm) ||
        comp.category.toLowerCase().includes(searchTerm) ||
        comp.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        comp.champions.some(c => c.name.toLowerCase().includes(searchTerm))
      )
      .map(comp => ({
        id: comp.id,
        name: comp.name,
        category: comp.category,
        tier: comp.meta?.tier || comp.tier || 'C',
        difficulty: comp.meta?.difficulty || comp.difficulty || 1,
        winrate: comp.meta?.winrate || comp.winrate || 50,
        views: comp.views || 0,
        upvotes: comp.votes?.upvotes || comp.upvotes || 0,
        created_at: comp.created_at || new Date().toISOString(),
        builder_code: comp.builder_code,
        champions: comp.champions ? comp.champions.map(c => ({
          id: c.id,
          name: c.name,
          cost: c.cost,
          traits: c.traits
        })) : []
      }));
  }
  
  if (!type || type === 'champions') {
    results.champions = db.champions
      .filter(champ => 
        champ.name.toLowerCase().includes(searchTerm) ||
        champ.traits.some(trait => trait.toLowerCase().includes(searchTerm))
      )
      .map(champ => ({
        ...champ,
        icon_url: championIcons[champ.id] || null
      }));
  }
  
  if (!type || type === 'items') {
    results.items = db.items
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
      .map(item => ({
        ...item,
        icon_url: itemIcons[item.id] || null
      }));
  }
  
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});