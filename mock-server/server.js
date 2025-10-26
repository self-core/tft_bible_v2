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
const augmentIconsPath = path.join(__dirname, 'augment-icons.json');
const championIcons = JSON.parse(fs.readFileSync(championIconsPath, 'utf8'));
const itemIcons = JSON.parse(fs.readFileSync(itemIconsPath, 'utf8'));
const augmentIcons = JSON.parse(fs.readFileSync(augmentIconsPath, 'utf8'));

// Utility function to get champion icon URL
const getChampionIconUrl = (championId) => {
  return championIcons[championId] || `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
};

// Utility function to get item icon URL
const getItemIconUrl = (itemId) => {
  return itemIcons[itemId] || `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/${itemId}.png`;
};

// Utility function to get augment icon URL
const getAugmentIconUrl = (augmentId) => {
  return augmentIcons[augmentId] || `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/${augmentId}.png`;
};

// Mock augments data
const mockAugments = [
  {
    id: 'big_shot_heart',
    name: 'Big Shot Heart',
    category: 'Trait',
    description: 'Your team gains 15% Attack Damage. Gain a Jinx.',
    tier: 'S',
    priority: 95,
    is_unique: true,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1001.png'
  },
  {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    category: 'Offensive',
    description: 'Your units deal 20% more damage to enemies with more than 1800 maximum HP',
    tier: 'A',
    priority: 85,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1002.png'
  },
  {
    id: 'tactical_resupply',
    name: 'Tactical Resupply',
    category: 'Utility',
    description: 'Gain 2 random completed items',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1003.png'
  },
  {
    id: 'deadeye_support',
    name: 'Deadeye Support',
    category: 'Trait',
    description: 'Your Deadeye champions gain 20% Attack Speed',
    tier: 'B',
    priority: 70,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1004.png'
  },
  {
    id: 'cybernetic_implants',
    name: 'Cybernetic Implants',
    category: 'Defensive',
    description: 'Your champions with items gain 100 Health and 10% Attack Damage',
    tier: 'C',
    priority: 65,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1005.png'
  },
  {
    id: 'thrill_of_the_hunt',
    name: 'Thrill of the Hunt',
    category: 'Utility',
    description: 'Your team gains 20 Mana after scoring a takedown',
    tier: 'C',
    priority: 60,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1006.png'
  },
  {
    id: 'dominator_soul',
    name: 'Dominator Soul',
    category: 'Trait',
    description: 'Gain a Dominator Emblem and 200 Health',
    tier: 'A',
    priority: 80,
    is_unique: true,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1007.png'
  },
  {
    id: 'tank_tower',
    name: 'Tank Tower',
    category: 'Defensive',
    description: 'Your tanks gain 30 Armor and Magic Resist',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1008.png'
  },
  {
    id: 'stand_united',
    name: 'Stand United',
    category: 'Defensive',
    description: 'Your team gains 100 Health and 10% Attack Damage per trait active',
    tier: 'S',
    priority: 90,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1009.png'
  },
  {
    id: 'bruiser_heart',
    name: 'Bruiser Heart',
    category: 'Trait',
    description: 'Gain a Bruiser Emblem and 15% Attack Damage',
    tier: 'B',
    priority: 75,
    is_unique: true,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1010.png'
  },
  {
    id: 'skirmisher_embrace',
    name: 'Skirmisher Embrace',
    category: 'Trait',
    description: 'Your Skirmishers gain 20% Attack Speed and 15% Critical Strike Chance',
    tier: 'A',
    priority: 80,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1011.png'
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    category: 'Defensive',
    description: 'When an ally dies, nearby allies gain 20% Attack Damage and 10% Attack Speed',
    tier: 'B',
    priority: 70,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1012.png'
  },
  {
    id: 'blade_master_unity',
    name: 'Blade Master Unity',
    category: 'Trait',
    description: 'Your Blade Masters gain 25% Attack Damage and 15% Critical Strike Chance',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1013.png'
  },
  {
    id: 'featherweights',
    name: 'Featherweights',
    category: 'Utility',
    description: 'Your 1-cost and 2-cost champions gain 20% Attack Speed and Move Speed',
    tier: 'C',
    priority: 65,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1014.png'
  },
  {
    id: 'ascension',
    name: 'Ascension',
    category: 'Utility',
    description: 'After 15 seconds of combat, your units deal 30% more damage',
    tier: 'A',
    priority: 85,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1015.png'
  },
  {
    id: 'emperor_soul',
    name: 'Emperor Soul',
    category: 'Trait',
    description: 'Gain an Emperor Emblem and 20% Spell Damage',
    tier: 'A',
    priority: 80,
    is_unique: true,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1016.png'
  },
  {
    id: 'giant_slayer_plus',
    name: 'Giant Slayer+',
    category: 'Offensive',
    description: 'Your units deal 30% more damage to enemies with more than 1800 maximum HP',
    tier: 'S',
    priority: 90,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1017.png'
  },
  {
    id: 'spell_battery',
    name: 'Spell Battery',
    category: 'Utility',
    description: 'After casting their Ability, your units gain 10 Mana',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1018.png'
  },
  {
    id: 'mage_unity',
    name: 'Mage Unity',
    category: 'Trait',
    description: 'Your Mages gain 25% Spell Damage and 15% Cast Speed',
    tier: 'A',
    priority: 80,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1019.png'
  },
  {
    id: 'steady_presence',
    name: 'Steady Presence',
    category: 'Defensive',
    description: 'Your units gain 20 Armor and Magic Resist for each different trait active',
    tier: 'B',
    priority: 70,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1020.png'
  },
  //   icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1012.png'
  // },
  // const mockTraits = [
  {
    id: 'blade_master_unity',
    name: 'Blade Master Unity',
    category: 'Trait',
    description: 'Your Blade Masters gain 25% Attack Damage and 15% Critical Strike Chance',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1013.png'
  },
  {
    id: 'featherweights',
    name: 'Featherweights',
    category: 'Utility',
    description: 'Your 1-cost and 2-cost champions gain 20% Attack Speed and Move Speed',
    tier: 'C',
    priority: 65,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1014.png'
  },
  {
    id: 'ascension',
    name: 'Ascension',
    category: 'Utility',
    description: 'After 15 seconds of combat, your units deal 30% more damage',
    tier: 'A',
    priority: 85,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1015.png'
  },
  {
    id: 'emperor_soul',
    name: 'Emperor Soul',
    category: 'Trait',
    description: 'Gain an Emperor Emblem and 20% Spell Damage',
    tier: 'A',
    priority: 80,
    is_unique: true,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1016.png'
  },
  {
    id: 'giant_slayer_plus',
    name: 'Giant Slayer+',
    category: 'Offensive',
    description: 'Your units deal 30% more damage to enemies with more than 1800 maximum HP',
    tier: 'S',
    priority: 90,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1017.png'
  },
  {
    id: 'spell_battery',
    name: 'Spell Battery',
    category: 'Utility',
    description: 'After casting their Ability, your units gain 10 Mana',
    tier: 'B',
    priority: 75,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1018.png'
  },
  {
    id: 'mage_unity',
    name: 'Mage Unity',
    category: 'Trait',
    description: 'Your Mages gain 25% Spell Damage and 15% Cast Speed',
    tier: 'A',
    priority: 80,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1019.png'
  },
  {
    id: 'steady_presence',
    name: 'Steady Presence',
    category: 'Defensive',
    description: 'Your units gain 20 Armor and Magic Resist for each different trait active',
    tier: 'B',
    priority: 70,
    is_unique: false,
    icon_url: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/augment-icons/1020.png'
  }
];

// Extend the db object with augments
db.augments = mockAugments;
//db.traits = mockTraits;

// API endpoints for augments
app.get('/api/v1/augments', (req, res) => {
  // Enhance augments with icon urls
  const enhancedAugments = db.augments.map(augment => ({
    ...augment,
    icon_url: getAugmentIconUrl(augment.id) || null
  }));
  const result = getPaginatedResults(enhancedAugments, req.query);
  res.json(result);
});

app.get('/api/v1/augments/:id', (req, res) => {
  const augment = db.augments.find(a => a.id === req.params.id);
  if (augment) {
    const enhancedAugment = {
      ...augment,
      icon_url: getAugmentIconUrl(augment.id) || null
    };
    res.json(enhancedAugment);
  } else {
    res.status(404).json({ error: 'Augment not found' });
  }
});

// Utility function to get champion icon URL
// const getChampionIconUrl = (championId) => {
//   return championIcons[championId] || `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
// };

// Utility function to get item icon URL
// const getItemIconUrl = (itemId) => {
//   return itemIcons[itemId] || `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/item-icons/${itemId}.png`;
// };

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
      icon_url: getChampionIconUrl(c.id) || null
    })) : []
  }));
  
  const result = getPaginatedResults(compositionSummaries, req.query);
  res.json(result);
});

app.get('/api/v1/champions', (req, res) => {
  // Enhance champions with icon urls
  const enhancedChampions = db.champions.map(champ => ({
    ...champ,
    icon_url: getChampionIconUrl(champ.id) || null
  }));
  const result = getPaginatedResults(enhancedChampions, req.query);
  res.json(result);
});

app.get('/api/v1/items', (req, res) => {
  // Enhance items with icon urls
  const enhancedItems = db.items.map(item => ({
    ...item,
    icon_url: getItemIconUrl(item.id) || null
  }));
  const result = getPaginatedResults(enhancedItems, req.query);
  res.json(result);
});

app.get('/api/v1/compositions/:id', (req, res) => {
  const composition = db.compositions.find(c => c.id === req.params.id);
  if (composition) {
    // Enhance champions with icon urls
    const enhancedComposition = {
      ...composition,
      champions: composition.champions ? composition.champions.map(champion => ({
        ...champion,
        icon_url: getChampionIconUrl(champion.id) || null
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
      icon_url: getChampionIconUrl(champion.id) || null
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
      icon_url: getItemIconUrl(item.id) || null
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

// Asset endpoints for champions, items, and augments
app.get('/api/v1/assets/champions/:id', (req, res) => {
  const champion = db.champions.find(c => c.id === req.params.id);
  if (champion) {
    const assetInfo = {
      id: champion.id,
      name: champion.name,
      icon_url: getChampionIconUrl(champion.id) || null,
      image_url: champion.image || null,
    };
    res.json(assetInfo);
  } else {
    res.status(404).json({ error: 'Champion asset not found' });
  }
});

app.get('/api/v1/assets/items/:id', (req, res) => {
  const item = db.items.find(i => i.id === req.params.id);
  if (item) {
    const assetInfo = {
      id: item.id,
      name: item.name,
      icon_url: getItemIconUrl(item.id) || null,
      image_url: item.image || null,
    };
    res.json(assetInfo);
  } else {
    res.status(404).json({ error: 'Item asset not found' });
  }
});

app.get('/api/v1/assets/augments/:id', (req, res) => {
  const augment = db.augments.find(a => a.id === req.params.id);
  if (augment) {
    const assetInfo = {
      id: augment.id,
      name: augment.name,
      icon_url: getAugmentIconUrl(augment.id) || null,
      image_url: augment.image || null,
    };
    res.json(assetInfo);
  } else {
    res.status(404).json({ error: 'Augment asset not found' });
  }
});

// Bulk asset endpoints
app.get('/api/v1/assets/champions', (req, res) => {
  const championAssets = db.champions.map(champion => ({
    id: champion.id,
    name: champion.name,
    icon_url: getChampionIconUrl(champion.id) || null,
    image_url: champion.image || null,
  }));
  const result = getPaginatedResults(championAssets, req.query);
  res.json(result);
});

app.get('/api/v1/assets/items', (req, res) => {
  const itemAssets = db.items.map(item => ({
    id: item.id,
    name: item.name,
    icon_url: getItemIconUrl(item.id) || null,
    image_url: item.image || null,
  }));
  const result = getPaginatedResults(itemAssets, req.query);
  res.json(result);
});

app.get('/api/v1/assets/augments', (req, res) => {
  const augmentAssets = db.augments.map(augment => ({
    id: augment.id,
    name: augment.name,
    icon_url: getAugmentIconUrl(augment.id) || null,
    image_url: augment.image || null,
  }));
  const result = getPaginatedResults(augmentAssets, req.query);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});