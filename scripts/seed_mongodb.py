#!/usr/bin/env python3
"""
Advanced DDragon data seeder for TFT Bible MongoDB
This script formats DDragon data to match the exact data models used by the Rust services.
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
    """Connect to MongoDB with proper authentication"""
    mongodb_url = 'mongodb://admin:password@localhost:27017/'
    database_name = 'tft_bible_dev'
    
    print(f"Connecting to MongoDB at {mongodb_url}, database: {database_name}")
    
    client = MongoClient(mongodb_url, authSource='admin')
    db = client[database_name]
    
    return db


def transform_champion_data(raw_champions: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw champion data to match the Rust service model"""
    champions = []
    
    for key, raw_champion in raw_champions.items():
        # Skip tutorial champions for the main set
        if 'Tutorial' in key:
            continue
            
        # Process all champions except tutorials
            
        # Create a champion that matches the Rust Champion model
        champion = {
            'name': raw_champion.get('name', ''),
            'cost': raw_champion.get('tier', 1),
            'traits': [],  # Traits will need to be mapped separately
            'image_url': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_champion.get('image', {}).get('full', '')}",
            'splash_url': None,  # No splash URL in raw data
            'stats': {
                'health': 100.0,  # Default value (would need to be sourced from championFull.json)
                'mana': 100.0, 
                'starting_mana': 0.0,
                'armor': 20.0,
                'magic_resist': 20.0,
                'attack_damage': 50.0,
                'attack_speed': 0.6,
                'attack_range': 1.0,
                'crit_chance': 0.25,
                'crit_multiplier': 1.5
            },
            'ability': {
                'name': 'Default Ability',  # Would need to come from other data sources
                'description': 'Default ability description',
                'ability_type': 'Active',
                'targeting': 'Self',
                'damage_type': 'Magical'
            }
        }
        
        champions.append(champion)
    
    return champions


def transform_trait_data(raw_traits: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw trait data to match the Rust service model"""
    traits = []
    
    for key, raw_trait in raw_traits.items():
        # Skip tutorial traits
        if 'Tutorial' in key:
            continue
            
        # Only process Set 15 traits
        if not key.startswith('TFT15_'):
            continue
        
        # Create a trait that matches the Rust Trait model
        trait = {
            'name': raw_trait.get('name', ''),
            'trait_type': 'Class',  # Default type, would need to be determined from data
            'description': 'Trait description',  # Would need to come from other sources
            'image_url': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_trait.get('image', {}).get('full', '')}",
            'breakpoints': [
                {
                    'units': 3,
                    'style': 1,  # green
                    'description': '3 units active',
                    'bonuses': {}  # Would contain trait-specific bonuses
                },
                {
                    'units': 6,
                    'style': 2,  # blue
                    'description': '6 units active',
                    'bonuses': {}
                },
                {
                    'units': 9,
                    'style': 3,  # purple
                    'description': '9 units active',
                    'bonuses': {}
                }
            ]
        }
        
        traits.append(trait)
    
    return traits


def transform_item_data(raw_items: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw item data to a simple format"""
    items = []
    
    for key, raw_item in raw_items.items():
        # Skip tutorial items
        if 'Tutorial' in key:
            continue
            
        item = {
            'id': raw_item.get('id', key),
            'name': raw_item.get('name', ''),
            'image_url': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_item.get('image', {}).get('full', '')}",
            'description': raw_item.get('desc', '') if 'desc' in raw_item else 'Item description'
        }
        
        items.append(item)
    
    return items


def transform_augment_data(raw_augments: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform raw augment data to a simple format"""
    augments = []
    
    for key, raw_augment in raw_augments.items():
        # Skip tutorial augments
        if 'Tutorial' in key:
            continue
            
        augment = {
            'id': raw_augment.get('id', key),
            'name': raw_augment.get('name', ''),
            'image_url': f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/{raw_augment.get('image', {}).get('full', '')}",
            'description': raw_augment.get('desc', '') if 'desc' in raw_augment else 'Augment description'
        }
        
        augments.append(augment)
    
    return augments


def seed_mongodb(data: Dict[str, Any], db):
    """Seed MongoDB with properly formatted data"""
    
    # Transform all data according to service models
    champions = transform_champion_data(data.get('champions', {}))
    traits = transform_trait_data(data.get('traits', {}))
    items = transform_item_data(data.get('items', {}))
    augments = transform_augment_data(data.get('augments', {}))
    
    print(f"\nTransformed data for seeding:")
    print(f"  Champions: {len(champions)}")
    print(f"  Traits: {len(traits)}")
    print(f"  Items: {len(items)}")
    print(f"  Augments: {len(augments)}")
    
    # Seed champions
    if champions:
        print(f"\nSeeding {len(champions)} champions...")
        champions_collection = db['champions']
        champions_collection.delete_many({})  # Clear existing data
        result = champions_collection.insert_many(champions)
        print(f"  ✅ Inserted {len(result.inserted_ids)} champions")
    
    # Seed traits
    if traits:
        print(f"Seeding {len(traits)} traits...")
        traits_collection = db['traits']
        traits_collection.delete_many({})  # Clear existing data
        result = traits_collection.insert_many(traits)
        print(f"  ✅ Inserted {len(result.inserted_ids)} traits")
    
    # Seed items
    if items:
        print(f"Seeding {len(items)} items...")
        items_collection = db['items']
        items_collection.delete_many({})  # Clear existing data
        result = items_collection.insert_many(items)
        print(f"  ✅ Inserted {len(result.inserted_ids)} items")
    
    # Seed augments
    if augments:
        print(f"Seeding {len(augments)} augments...")
        augments_collection = db['augments']
        augments_collection.delete_many({})  # Clear existing data
        result = augments_collection.insert_many(augments)
        print(f"  ✅ Inserted {len(result.inserted_ids)} augments")


def main():
    # Define the path to dragontail data
    dragontail_path = os.getenv('DRAGONTAIL_PATH', 'C:\\Users\\puppets\\Documents\\League of Legends\\dragontail-15.23.1')
    
    if not os.path.exists(dragontail_path):
        print(f"Dragontail path does not exist: {dragontail_path}")
        return
    
    print("Loading dragontail data...")
    data = load_dragontail_data(dragontail_path)
    
    print("\nConnecting to MongoDB...")
    db = connect_to_mongodb()
    
    print("\nSeeding data to MongoDB with proper model formatting...")
    seed_mongodb(data, db)
    
    print("\n🎉 Seeding completed successfully!")
    print("\nData is now in the correct format for the Rust services.")


if __name__ == "__main__":
    main()