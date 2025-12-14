#!/usr/bin/env python3
"""
Fix MongoDB field naming to match Rust service expectations
Converts snake_case fields to camelCase to match the serde rename attributes in Rust models
"""

import os
from pymongo import MongoClient
from typing import Any, Dict


def connect_to_mongodb():
    """Connect to MongoDB with proper authentication"""
    mongodb_url = 'mongodb://admin:password@localhost:27017/'
    database_name = 'tft_champions_db'
    
    print(f"Connecting to MongoDB at {mongodb_url}, database: {database_name}")
    
    client = MongoClient(mongodb_url, authSource='admin')
    db = client[database_name]
    
    return db


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    if not snake_str or '_' not in snake_str:
        return snake_str
    parts = snake_str.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])


def convert_nested_object(obj: Any) -> Any:
    """Recursively convert all snake_case keys to camelCase in a nested structure"""
    if isinstance(obj, dict):
        new_dict = {}
        for key, value in obj.items():
            new_key = snake_to_camel(key)
            new_dict[new_key] = convert_nested_object(value)
        return new_dict
    elif isinstance(obj, list):
        return [convert_nested_object(item) for item in obj]
    else:
        return obj


def fix_champion_fields(db):
    """Update champion documents to use camelCase field names"""
    champions_collection = db['champions']
    
    # Get all champions
    champions = list(champions_collection.find({}))
    print(f"Found {len(champions)} champions to update")
    
    if not champions:
        print("No champions found to update")
        return
    
    # Update each champion with proper field naming
    updated_count = 0
    for champion in champions:
        # Convert the entire champion document
        updated_champion = convert_nested_object(champion)
        
        # Update the document in the database
        champions_collection.update_one(
            {'_id': champion['_id']},
            {'$set': updated_champion}
        )
        updated_count += 1
    
    print(f"Updated {updated_count} champions with camelCase fields")


def fix_trait_fields(db):
    """Update trait documents to use camelCase field names"""
    traits_collection = db['traits']
    
    # Get all traits
    traits = list(traits_collection.find({}))
    print(f"Found {len(traits)} traits to update")
    
    if not traits:
        print("No traits found to update")
        return
    
    # Update each trait with proper field naming
    updated_count = 0
    for trait in traits:
        # Convert the entire trait document
        updated_trait = convert_nested_object(trait)
        
        # Update the document in the database
        traits_collection.update_one(
            {'_id': trait['_id']},
            {'$set': updated_trait}
        )
        updated_count += 1
    
    print(f"Updated {updated_count} traits with camelCase fields")


def main():
    print("Fixing MongoDB field naming to match Rust service expectations...")
    print("Converting snake_case fields to camelCase...")
    
    db = connect_to_mongodb()
    
    # Fix champion fields
    fix_champion_fields(db)
    
    # Fix trait fields
    fix_trait_fields(db)
    
    print("✅ Field naming fixes applied successfully!")
    print("Champions and traits now use camelCase field names to match Rust serde expectations.")


if __name__ == "__main__":
    main()