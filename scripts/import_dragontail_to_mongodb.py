#!/usr/bin/env python3
"""
Import DDragon dragontail data to MongoDB
This script imports TFT champion, trait, item, and augment data from the dragontail files
into the MongoDB database.
"""

import json
import os
from pymongo import MongoClient
from typing import Dict, List, Any


def load_dragontail_data(base_path: str) -> Dict[str, Any]:
    """Load all dragontail data files"""
    data = {}
    
    # Define the data files to load
    files_to_load = {
        'champions': 'tft-champion.json',
        'traits': 'tft-trait.json',
        'items': 'tft-item.json',
        'augments': 'tft-augments.json'
    }
    
    for key, filename in files_to_load.items():
        file_path = os.path.join(base_path, '15.23.1', 'data', 'en_US', filename)
        print(f"Loading {filename}...")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
                data[key] = raw_data.get('data', {})
                print(f"  Loaded {len(data[key])} {key}")
        except FileNotFoundError:
            print(f"  File not found: {file_path}")
            data[key] = {}
        except json.JSONDecodeError as e:
            print(f"  JSON decode error in {filename}: {e}")
            data[key] = {}
    
    return data


def connect_to_mongodb():
    """Connect to MongoDB using environment variables or defaults"""
    # Check if using remote MongoDB Atlas
    mongodb_url_env = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
    database_name = os.getenv('DATABASE_NAME', 'tft_bible_dev')

    # Use local MongoDB for import if using remote in environment
    if 'cluster.mongodb.net' in mongodb_url_env or 'mongodb+srv' in mongodb_url_env:
        # Use local MongoDB with credentials from .env.example
        # Format: mongodb://username:password@host:port/database
        mongodb_url = 'mongodb://admin:password@localhost:27017/'
        database_name = 'tft_bible_dev'
    else:
        # Use environment settings but ensure it's for local MongoDB
        if 'localhost' in mongodb_url_env or '127.0.0.1' in mongodb_url_env:
            # Use credentials if connecting locally (as specified in docker-compose and .env.example)
            mongodb_url = 'mongodb://admin:password@localhost:27017/'
        else:
            mongodb_url = mongodb_url_env

    print(f"Connecting to MongoDB at {mongodb_url}, database: {database_name}")

    # Add authentication database parameter if using local MongoDB
    if 'admin:password' in mongodb_url:
        client = MongoClient(mongodb_url, authSource='admin')
    else:
        client = MongoClient(mongodb_url)

    db = client[database_name]

    return db


def transform_champion_data(raw_champions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw champion data to our format"""
    champions = []
    
    for key, raw_champion in raw_champions.items():
        # Skip tutorial champions for now, or handle them separately
        if 'Tutorial' in key:
            continue
            
        champion = {
            'id': raw_champion.get('id', key),
            'name': raw_champion.get('name', ''),
            'cost': raw_champion.get('tier', 1),
            'icon': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_champion.get('image', {}).get('full', '')}",
            'set': 'Set15' if 'TFT15_' in key else 'Set7' if 'TFT7_' in key else 'Tutorial',
            'api_id': key  # Keep the original API ID for reference
        }
        
        champions.append(champion)
    
    return champions


def transform_trait_data(raw_traits: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw trait data to our format"""
    traits = []
    
    for key, raw_trait in raw_traits.items():
        # Skip tutorial traits if needed, or handle them separately
        if 'Tutorial' in key:
            continue
            
        trait = {
            'id': raw_trait.get('id', key),
            'name': raw_trait.get('name', ''),
            'icon': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_trait.get('image', {}).get('full', '')}",
            'set': 'Set15' if 'TFT15_' in key else 'Set7' if 'TFT7_' in key else 'Tutorial',
            'api_id': key  # Keep the original API ID for reference
        }
        
        traits.append(trait)
    
    return traits


def transform_item_data(raw_items: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw item data to our format"""
    items = []
    
    for key, raw_item in raw_items.items():
        # Skip tutorial items if needed
        if 'Tutorial' in key:
            continue
            
        item = {
            'id': raw_item.get('id', key),
            'name': raw_item.get('name', ''),
            'icon': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_item.get('image', {}).get('full', '')}",
            'set': 'Set15' if 'TFT15_' in key else 'Set7' if 'TFT7_' in key else 'Tutorial',
            'api_id': key  # Keep the original API ID for reference
        }
        
        items.append(item)
    
    return items


def transform_augment_data(raw_augments: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw augment data to our format"""
    augments = []
    
    for key, raw_augment in raw_augments.items():
        # Skip tutorial augments if needed
        if 'Tutorial' in key:
            continue
            
        augment = {
            'id': raw_augment.get('id', key),
            'name': raw_augment.get('name', ''),
            'icon': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_augment.get('image', {}).get('full', '')}",
            'set': 'Set15' if 'TFT15_' in key else 'Set7' if 'TFT7_' in key else 'Tutorial',
            'api_id': key  # Keep the original API ID for reference
        }
        
        augments.append(augment)
    
    return augments


def import_to_mongodb(data: Dict[str, Any], db):
    """Import transformed data to MongoDB"""
    
    # Transform all data
    champions = transform_champion_data(data.get('champions', {}))
    traits = transform_trait_data(data.get('traits', {}))
    items = transform_item_data(data.get('items', {}))
    augments = transform_augment_data(data.get('augments', {}))
    
    # Import champions
    if champions:
        print(f"Importing {len(champions)} champions...")
        champions_collection = db['champions']
        champions_collection.delete_many({})  # Clear existing data
        result = champions_collection.insert_many(champions)
        print(f"  Inserted {len(result.inserted_ids)} champions")
    
    # Import traits
    if traits:
        print(f"Importing {len(traits)} traits...")
        traits_collection = db['traits']
        traits_collection.delete_many({})  # Clear existing data
        result = traits_collection.insert_many(traits)
        print(f"  Inserted {len(result.inserted_ids)} traits")
    
    # Import items
    if items:
        print(f"Importing {len(items)} items...")
        items_collection = db['items']
        items_collection.delete_many({})  # Clear existing data
        result = items_collection.insert_many(items)
        print(f"  Inserted {len(result.inserted_ids)} items")
    
    # Import augments
    if augments:
        print(f"Importing {len(augments)} augments...")
        augments_collection = db['augments']
        augments_collection.delete_many({})  # Clear existing data
        result = augments_collection.insert_many(augments)
        print(f"  Inserted {len(result.inserted_ids)} augments")


def main():
    # Define the path to dragontail data; adjust as needed
    dragontail_path = os.getenv('DRAGONTAIL_PATH', 'C:\\Users\\puppets\\Documents\\League of Legends\\dragontail-15.23.1')
    
    if not os.path.exists(dragontail_path):
        print(f"Dragontail path does not exist: {dragontail_path}")
        return
    
    print("Loading dragontail data...")
    data = load_dragontail_data(dragontail_path)
    
    print("\nConnecting to MongoDB...")
    db = connect_to_mongodb()
    
    print("\nImporting data to MongoDB...")
    import_to_mongodb(data, db)
    
    print("\nImport completed successfully!")


if __name__ == "__main__":
    main()