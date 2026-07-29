const { MongoClient, ObjectId } = require('mongodb');

// Connect to MongoDB and seed compositions
async function seedCompositions() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Use the same connection string as in the docker-compose
    const client = new MongoClient('mongodb://admin:password@localhost:27017/?authSource=admin');
    await client.connect();
    
    const db = client.db('tft_compositions_db');
    const collection = db.collection('compositions');
    
    // Sample compositions data based on popular TFT compositions
    const compositions = [
      {
        "_id": new ObjectId(),
        "name": "Hyper Carry",
        "description": "A popular hyper carry composition focused on dealing massive damage with multiple carries.",
        "category": "Hyper Carry",
        "tags": ["carry", "damage", "late game"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Prioritize core units with items. Reroll early for 2-star carries.",
        "meta": {
          "tier": "S",
          "difficulty": 3,
          "cost": "Flexible",
          "patch": "14.23",
          "playstyle": "Carry",
          "winrate": 62.3,
          "avgPlacement": 2.8,
          "playrate": 25.2,
          "contestRate": 15.1
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 1245,
          "downvotes": 89
        },
        "views": 12847,
        "favorites": 842,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "This comp is very strong in current meta!",
            "createdAt": new Date(),
            "updatedAt": new Date()
          },
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Don't forget to pivot early if you don't get good item luck.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Melee Hyper Carry",
        "description": "A hyper carry composition built around melee units with high damage output.",
        "category": "Melee Hyper Carry", 
        "tags": ["melee", "carry", "damage"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 2 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 2 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 3 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 3 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 1 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on building items for the front-line carries.",
        "meta": {
          "tier": "A",
          "difficulty": 4,
          "cost": "Late",
          "patch": "14.23",
          "playstyle": "Melee Carry",
          "winrate": 58.7,
          "avgPlacement": 3.2,
          "playrate": 18.4,
          "contestRate": 8.7
        },
        "matchups": {
          "vs_early_game": "Neutral",
          "vs_control": "Unfavorable", 
          "vs_other_carry": "Neutral"
        },
        "votes": {
          "upvotes": 867,
          "downvotes": 123
        },
        "views": 9632,
        "favorites": 542,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Works best when you get lucky with early items.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Sorcerer Control",
        "description": "A control composition utilizing sorcerer units for mana manipulation and crowd control.",
        "category": "Control",
        "tags": ["control", "sorcerer", "crowd control"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on controlling the backline with crowd control abilities.",
        "meta": {
          "tier": "B",
          "difficulty": 4,
          "cost": "Flexible",
          "patch": "14.23",
          "playstyle": "Control",
          "winrate": 55.1,
          "avgPlacement": 3.7,
          "playrate": 12.8,
          "contestRate": 5.3
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 623,
          "downvotes": 156
        },
        "views": 7218,
        "favorites": 387,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Requires good positioning to work effectively.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Cavalier Prestige",
        "description": "A prestige composition using Cavalier units with high durability and burst potential.",
        "category": "Prestige",
        "tags": ["cavalier", "prestige", "tank"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 3 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 1 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on building tank items for the Cavaliers and positioning properly.",
        "meta": {
          "tier": "A",
          "difficulty": 3,
          "cost": "Mid",
          "patch": "14.23",
          "playstyle": "Tank",
          "winrate": 59.4,
          "avgPlacement": 3.1,
          "playrate": 15.9,
          "contestRate": 7.4
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 789,
          "downvotes": 98
        },
        "views": 8432,
        "favorites": 496,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Great for when you have good starting items for tank builds.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Jewel Mage",
        "description": "A composition based on Jewel Mages that provide powerful mana manipulation and control.",
        "category": "Mage",
        "tags": ["mage", "control", "jewel"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on controlling mana resources and ability usage of opponents.",
        "meta": {
          "tier": "S-",
          "difficulty": 4,
          "cost": "Late",
          "patch": "14.23",
          "playstyle": "Control",
          "winrate": 61.8,
          "avgPlacement": 2.9,
          "playrate": 20.3,
          "contestRate": 12.1
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 1024,
          "downvotes": 76
        },
        "views": 11245,
        "favorites": 723,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Very strong composition but requires precise execution.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Ranged Hyper Carry",
        "description": "A hyper carry composition focused on ranged units with high damage from the backline.",
        "category": "Ranged Carry",
        "tags": ["ranged", "carry", "damage"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Position carries safely in the backline and focus on building damage items.",
        "meta": {
          "tier": "A+",
          "difficulty": 3,
          "cost": "Flexible",
          "patch": "14.23",
          "playstyle": "Ranged Carry",
          "winrate": 60.2,
          "avgPlacement": 3.0,
          "playrate": 22.7,
          "contestRate": 14.3
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Neutral"
        },
        "votes": {
          "upvotes": 976,
          "downvotes": 84
        },
        "views": 10567,
        "favorites": 678,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Great for players who prefer to play safe in the backline.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Shield Scholar",
        "description": "A composition combining Shield units for durability and Scholar units for mana generation.",
        "category": "Support",
        "tags": ["shield", "scholar", "tank", "mana"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 3 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 1 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on building tank items for durability and positioning units to maximize shield effects.",
        "meta": {
          "tier": "B",
          "difficulty": 3,
          "cost": "Mid",
          "patch": "14.23",
          "playstyle": "Tank Control",
          "winrate": 54.8,
          "avgPlacement": 3.8,
          "playrate": 10.2,
          "contestRate": 4.7
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Unfavorable"
        },
        "votes": {
          "upvotes": 453,
          "downvotes": 167
        },
        "views": 5321,
        "favorites": 234,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Good for when you need a more defensive approach.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Assassin Hyper Carry",
        "description": "A composition combining Assassins for burst damage with Carry units for sustained output.",
        "category": "Assassin",
        "tags": ["assassin", "burst", "carry"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 2 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 2 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on positioning Assassins to target enemy carries and burst them down quickly.",
        "meta": {
          "tier": "A-",
          "difficulty": 4,
          "cost": "Flexible",
          "patch": "14.23",
          "playstyle": "Burst",
          "winrate": 57.9,
          "avgPlacement": 3.3,
          "playrate": 16.7,
          "contestRate": 9.2
        },
        "matchups": {
          "vs_early_game": "Neutral",
          "vs_control": "Unfavorable",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 732,
          "downvotes": 112
        },
        "views": 8123,
        "favorites": 456,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Requires precise positioning to work effectively.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Cannoneer Control",
        "description": "A composition utilizing Cannoneer units for high area damage and control.",
        "category": "Cannoneer",
        "tags": ["cannoneer", "aoe", "control"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on positioning Cannoneers safely in the backline and maximizing their area damage.",
        "meta": {
          "tier": "B+",
          "difficulty": 3,
          "cost": "Late",
          "patch": "14.23",
          "playstyle": "AOE Damage",
          "winrate": 56.3,
          "avgPlacement": 3.5,
          "playrate": 13.8,
          "contestRate": 6.9
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Neutral"
        },
        "votes": {
          "upvotes": 645,
          "downvotes": 128
        },
        "views": 7421,
        "favorites": 398,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "Great for when you can get early game safety.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": false,
        "createdAt": new Date(),
        "updatedAt": new Date()
      },
      {
        "_id": new ObjectId(),
        "name": "Star Guardian Mage",
        "description": "A composition combining Star Guardian units for mana manipulation with Mage units for high damage.",
        "category": "Mage",
        "tags": ["mage", "star guardian", "mana"],
        "champions": [
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 3, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 2, "y": 1 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 4, "y": 1 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 1, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 1,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 5, "y": 2 },
            "isCore": false
          },
          {
            "championId": new ObjectId(),
            "starLevel": 3,
            "items": [new ObjectId(), new ObjectId(), new ObjectId()],
            "position": { "x": 0, "y": 3 },
            "isCore": true
          },
          {
            "championId": new ObjectId(),
            "starLevel": 2,
            "items": [new ObjectId(), new ObjectId()],
            "position": { "x": 6, "y": 3 },
            "isCore": false
          }
        ],
        "augments": {
          "preferred": [new ObjectId(), new ObjectId(), new ObjectId()],
          "acceptable": [new ObjectId(), new ObjectId()],
          "avoid": [new ObjectId()]
        },
        "positioning": null,
        "gameplan": "Focus on building AP items for Mages and positioning Star Guardians for synergy.",
        "meta": {
          "tier": "S-",
          "difficulty": 4,
          "cost": "Late",
          "patch": "14.23",
          "playstyle": "Mana Control",
          "winrate": 61.5,
          "avgPlacement": 2.9,
          "playrate": 19.4,
          "contestRate": 11.6
        },
        "matchups": {
          "vs_early_game": "Favorable",
          "vs_control": "Neutral",
          "vs_other_carry": "Favorable"
        },
        "votes": {
          "upvotes": 987,
          "downvotes": 73
        },
        "views": 11876,
        "favorites": 789,
        "comments": [
          {
            "id": new ObjectId(),
            "userId": new ObjectId(),
            "content": "One of the strongest compositions in the current meta.",
            "createdAt": new Date(),
            "updatedAt": new Date()
          }
        ],
        "isPublic": true,
        "isVerified": true,
        "isFeatured": true,
        "createdAt": new Date(),
        "updatedAt": new Date()
      }
    ];

    console.log(`Inserting ${compositions.length} sample compositions...`);
    
    // Drop the collection and reinsert fresh data
    await collection.drop().catch(() => {}); // Ignore error if collection doesn't exist
    
    const result = await collection.insertMany(compositions);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} compositions into the database`);
    console.log("Sample compositions have been added to the database.");
    
    // Verify the data was inserted
    const count = await collection.countDocuments();
    console.log(`Total compositions in database: ${count}`);
    
    await client.close();
    console.log('Connection to MongoDB closed');
  } catch (error) {
    console.error('Error seeding compositions:', error);
  }
}

// Run the seeding function
seedCompositions();