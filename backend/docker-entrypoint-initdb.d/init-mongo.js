// MongoDB initialization script for TFT Bible development
// This script runs when the MongoDB container starts for the first time

// Switch to the development database
db = db.getSiblingDB('tft_bible_dev');

// Create collections with indexes
db.createCollection('compositions');
db.createCollection('champions');
db.createCollection('items');
db.createCollection('augments');
db.createCollection('traits');
db.createCollection('sets');
db.createCollection('users');
db.createCollection('comments');

// Create indexes for better performance
db.compositions.createIndex({ "name": "text", "description": "text" });
db.compositions.createIndex({ "tier": 1, "difficulty": 1 });
db.compositions.createIndex({ "category": 1 });
db.compositions.createIndex({ "tags": 1 });
db.compositions.createIndex({ "isPublic": 1 });
db.compositions.createIndex({ "authorId": 1 });

db.champions.createIndex({ "name": "text" });
db.champions.createIndex({ "cost": 1 });
db.champions.createIndex({ "traits": 1 });
db.champions.createIndex({ "setId": 1 });

db.items.createIndex({ "name": "text", "description": "text" });
db.items.createIndex({ "category": 1 });
db.items.createIndex({ "itemType": 1 });
db.items.createIndex({ "setId": 1 });

db.augments.createIndex({ "name": "text" });
db.augments.createIndex({ "tier": 1 });
db.augments.createIndex({ "category": 1 });
db.augments.createIndex({ "setId": 1 });

db.traits.createIndex({ "name": "text" });
db.traits.createIndex({ "setId": 1 });

db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.comments.createIndex({ "compositionId": 1 });
db.comments.createIndex({ "authorId": 1 });

// Insert some sample data for development
db.sets.insertOne({
  name: "Set 14: Cosmic Odyssey",
  shortName: "14",
  version: "14.23",
  isActive: true,
  releaseDate: new Date("2025-01-15"),
  description: "Cosmic Odyssey brings new champions and mechanics",
  imageUrl: "https://example.com/set14.jpg",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ TFT Bible development database initialized successfully!");
print("📊 Collections created with indexes");
print("🌱 Sample data inserted");
print("🚀 Ready for development!");