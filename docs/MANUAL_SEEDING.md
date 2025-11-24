# Manual Database Seeding Guide

This document explains how to manually seed the MongoDB database with Set 16 (Lore & Legends) data for the TFT Bible application.

## Overview

The TFT Bible application includes a manual seeding tool that allows you to populate your MongoDB database with accurate Set 16 data. This is useful in the following scenarios:

- Initial setup of a fresh database
- Restoring data after a database reset
- Adding missing Set 16 content to an existing database
- Development and testing environments

## Prerequisites

Before running the manual seeder, ensure you have:

- Rust and Cargo installed (version 1.90 or later)
- MongoDB database accessible and running
- Environment variables configured (MONGODB_URL and DATABASE_NAME)

## Running the Manual Seeder

### 1. Build and Run Locally

```bash
# Navigate to the backend directory
cd backend

# Build and run the manual seeder
cargo run --bin manual_seed
```

### 2. Run in Docker (Recommended)

If you're using the Docker setup, you can execute the manual seeder inside the backend container:

```bash
# From the project root directory
docker exec -it tft_bible_v2-tft-backend-1 bash

# Inside the container
./manual_seed
```

Or if the container isn't running yet:
```bash
# Build the container with the updated code first
docker-compose build tft-backend

# Run the container with the seed command override
docker-compose run --rm tft-backend ./manual_seed
```

### 3. Using Cargo Directly in Docker

```bash
# Build and run the seeding directly (if the container is built)
docker-compose exec tft-backend cargo run --bin manual_seed
```

## What the Seeder Does

The manual seeder will:

1. Connect to your MongoDB instance using the configured credentials
2. Create the "Lore & Legends" (Set 16) entry in the sets collection
3. Populate the traits collection with Set 16 region traits (Demacia, Noxus, Void, Ionia, Bilgewater, Cultist)
4. Add Set 16 champions (Kai'Sa, Sylas, Azir, Aatrox) with their complete stats and abilities
5. Insert Set 16 items with their properties and effects
6. Add Set 16 augments including Team-Up Augments, Ascendant Charms, and region-specific augments

The seeder is designed to be idempotent - if data already exists for Set 16, it will skip creating duplicates and notify you of this.

## Environment Variables

The seeder uses the same environment variables as the main application:

- `MONGODB_URL`: Connection string for your MongoDB instance (default: mongodb://localhost:27017)
- `DATABASE_NAME`: Name of the database to use (default: tft_bible_dev)

Make sure these are set in your environment or .env file before running the seeder.

## Troubleshooting

### Common Issues

**Connection Error**: If you get a connection error, verify that:
- MongoDB is running and accessible
- The MONGODB_URL is correct
- The network configuration allows connections between containers (if using Docker)

**Permission Error**: If you get permission errors, make sure:
- The database user has read/write permissions
- The database exists and is accessible

**Duplicate Data**: If the seeder reports skipping data, this is intentional - it prevents duplicate entries.

### Verification

After running the seeder, you can verify that the data was correctly inserted by:

1. Connecting to your MongoDB instance
2. Checking that the following collections have Set 16 data:
   - `sets` collection contains "Lore & Legends"
   - `champions`, `traits`, `items`, and `augments` collections have Set 16 entries

## Rollback

If you need to remove Set 16 data to reseed, you can manually delete the records by:

```javascript
// In MongoDB shell
db.champions.deleteMany({"set_id": ObjectId("<set_id_of_lore_legends>"}})
db.traits.deleteMany({"set_id": ObjectId("<set_id_of_lore_legends>")})
db.items.deleteMany({"set_id": ObjectId("<set_id_of_lore_legends>")})
db.augments.deleteMany({"set_id": ObjectId("<set_id_of_lore_legends>")})
```

Note: This is rarely necessary as the seeder is designed to prevent duplicates.

## Notes

- The seeder will not overwrite existing Set 16 data, only skip it
- For performance, the seeder processes collections in dependency order
- The seeder includes Set 16's unique mechanics like Unlockables and Team-Up Augments
- All data is based on information from TFT Academy for accuracy