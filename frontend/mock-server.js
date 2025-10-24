const jsonServer = require('json-server');
const path = require('path');

// Create server
const server = jsonServer.create();

// Set default middlewares (logger, static, cors and no-cache)
server.use(jsonServer.defaults());

// Parse JSON bodies
server.use(jsonServer.bodyParser);

// Load data from db.json
const router = jsonServer.router(path.join(__dirname, 'db.json'));
server.use(router);

// Set up the correct API routes to match backend structure
// These will override the default routes to match /api/v1/ structure

// Composition routes
server.get('/api/v1/compositions', (req, res) => {
  const result = router.db.get('compositions').value();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || (page - 1) * limit;
  
  // Apply filters
  let filteredResult = result;
  
  if (req.query.tier) {
    filteredResult = filteredResult.filter(comp => comp.tier === req.query.tier);
  }
  
  if (req.query.category) {
    filteredResult = filteredResult.filter(comp => comp.category === req.query.category);
  }
  
  if (req.query.champion) {
    filteredResult = filteredResult.filter(comp => 
      comp.champions && comp.champions.includes(req.query.champion)
    );
  }
  
  if (req.query.difficulty) {
    filteredResult = filteredResult.filter(comp => comp.difficulty == req.query.difficulty);
  }

  const total = filteredResult.length;
  const totalPages = Math.ceil(total / limit);
  const data = filteredResult.slice(offset, offset + limit);

  res.json({
    data,
    total,
    page: Math.floor(offset / limit) + 1,
    per_page: limit,
    total_pages: totalPages
  });
});

server.get('/api/v1/compositions/:id', (req, res) => {
  const id = req.params.id;
  const composition = router.db.get('compositions').find({ id }).value();
  
  if (!composition) {
    res.status(404).json({ error: 'Composition not found' });
    return;
  }
  
  res.json(composition);
});

server.post('/api/v1/compositions', (req, res) => {
  const newComposition = { 
    id: Date.now().toString(), 
    created_at: new Date().toISOString(),
    ...req.body 
  };
  
  const compositions = router.db.get('compositions').value();
  router.db.set('compositions', [...compositions, newComposition]).write();
  
  res.status(201).json(newComposition);
});

server.put('/api/v1/compositions/:id', (req, res) => {
  const id = req.params.id;
  const updatedComposition = { ...req.body, id };
  
  router.db.get('compositions').find({ id }).assign(updatedComposition).write();
  
  res.json(updatedComposition);
});

server.delete('/api/v1/compositions/:id', (req, res) => {
  const id = req.params.id;
  const compositions = router.db.get('compositions').value();
  const updatedCompositions = compositions.filter(comp => comp.id !== id);
  
  router.db.set('compositions', updatedCompositions).write();
  
  res.status(204).end();
});

server.post('/api/v1/compositions/:id/vote', (req, res) => {
  const id = req.params.id;
  const { vote_type } = req.body;
  
  const composition = router.db.get('compositions').find({ id }).value();
  if (!composition) {
    res.status(404).json({ error: 'Composition not found' });
    return;
  }
  
  // Update vote (simplified logic)
  if (vote_type === 'up') {
    composition.upvotes = (composition.upvotes || 0) + 1;
  }
  
  router.db.get('compositions').find({ id }).assign(composition).write();
  
  res.json(composition);
});

// Champion routes
server.get('/api/v1/champions', (req, res) => {
  const result = router.db.get('champions').value();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || (page - 1) * limit;
  
  // Apply filters
  let filteredResult = result;
  
  if (req.query.cost) {
    filteredResult = filteredResult.filter(champ => champ.cost == req.query.cost);
  }
  
  if (req.query.traits) {
    const traitFilter = req.query.traits.toLowerCase();
    filteredResult = filteredResult.filter(champ => 
      champ.traits && champ.traits.some(trait => 
        trait.toLowerCase().includes(traitFilter)
      )
    );
  }
  
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredResult = filteredResult.filter(champ => 
      champ.name.toLowerCase().includes(search)
    );
  }

  const total = filteredResult.length;
  const totalPages = Math.ceil(total / limit);
  const data = filteredResult.slice(offset, offset + limit);

  res.json({
    data,
    total,
    page: Math.floor(offset / limit) + 1,
    per_page: limit,
    total_pages: totalPages
  });
});

server.get('/api/v1/champions/:id', (req, res) => {
  const id = req.params.id;
  const champion = router.db.get('champions').find({ id }).value();
  
  if (!champion) {
    res.status(404).json({ error: 'Champion not found' });
    return;
  }
  
  res.json(champion);
});

server.get('/api/v1/champions/trait/:traitName', (req, res) => {
  const traitName = req.params.traitName;
  const champions = router.db.get('champions').value();
  const traitChampions = champions.filter(champ => 
    champ.traits && champ.traits.includes(traitName)
  );

  res.json({
    data: traitChampions,
    total: traitChampions.length,
    page: 1,
    per_page: traitChampions.length,
    total_pages: 1
  });
});

// Item routes
server.get('/api/v1/items', (req, res) => {
  const result = router.db.get('items').value();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || (page - 1) * limit;
  
  // Apply filters
  let filteredResult = result;
  
  if (req.query.category) {
    filteredResult = filteredResult.filter(item => item.category === req.query.category);
  }
  
  if (req.query.type) {
    filteredResult = filteredResult.filter(item => item.item_type === req.query.type);
  }
  
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredResult = filteredResult.filter(item => 
      item.name.toLowerCase().includes(search)
    );
  }

  const total = filteredResult.length;
  const totalPages = Math.ceil(total / limit);
  const data = filteredResult.slice(offset, offset + limit);

  res.json({
    data,
    total,
    page: Math.floor(offset / limit) + 1,
    per_page: limit,
    total_pages: totalPages
  });
});

server.get('/api/v1/items/:id', (req, res) => {
  const id = req.params.id;
  const item = router.db.get('items').find({ id }).value();
  
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  
  res.json(item);
});

server.get('/api/v1/items/recommendations/:championId', (req, res) => {
  // Simplified recommendation logic
  const championId = req.params.championId;
  
  // Return some default recommendations for the champion
  const allItems = router.db.get('items').value();
  const recommendations = allItems.slice(0, 5); // First 5 items as example
  
  res.json({
    data: recommendations,
    total: recommendations.length,
    page: 1,
    per_page: recommendations.length,
    total_pages: 1
  });
});

// Search route
server.get('/api/v1/search', (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  
  if (!query) {
    return res.json({ 
      compositions: [], 
      champions: [], 
      items: [],
      total_results: 0
    });
  }

  const allCompositions = router.db.get('compositions').value();
  const allChampions = router.db.get('champions').value();
  const allItems = router.db.get('items').value();

  const filteredCompositions = allCompositions.filter(comp => 
    comp.name.toLowerCase().includes(query)
  );
  
  const filteredChampions = allChampions.filter(champ => 
    champ.name.toLowerCase().includes(query)
  );
  
  const filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(query)
  );

  res.json({
    compositions: filteredCompositions,
    champions: filteredChampions,
    items: filteredItems,
    total_results: filteredCompositions.length + filteredChampions.length + filteredItems.length
  });
});

// Health check
server.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Mock API server running on port ${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api/v1/`);
});