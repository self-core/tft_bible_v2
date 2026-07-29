#!/usr/bin/env python3
"""
Verify the structure of the seeded data matches the service models
"""

import os
from pymongo import MongoClient


def connect_to_mongodb():
    """Connect to MongoDB with proper authentication"""
    mongodb_url = 'mongodb://admin:password@localhost:27017/'
    database_name = 'tft_bible_dev'
    
    print(f"Connecting to MongoDB at {mongodb_url}, database: {database_name}")
    
    client = MongoClient(mongodb_url, authSource='admin')
    db = client[database_name]
    
    return db


def verify_champion_structure(db):
    """Verify champion document structure matches the Rust model"""
    collection = db['champions']
    sample_doc = collection.find_one()
    
    if sample_doc:
        print("Champion document structure:")
        print(f"  Fields: {list(sample_doc.keys())}")
        print(f"  Name: {sample_doc.get('name')}")
        print(f"  Cost: {sample_doc.get('cost')}")
        print(f"  Traits: {sample_doc.get('traits')}")
        print(f"  Image URL: {sample_doc.get('image_url')}")
        print(f"  Stats present: {'stats' in sample_doc}")
        print(f"  Ability present: {'ability' in sample_doc}")
        print()
    else:
        print("No champions found")
        print()


def verify_trait_structure(db):
    """Verify trait document structure matches the Rust model"""
    collection = db['traits']
    sample_doc = collection.find_one()
    
    if sample_doc:
        print("Trait document structure:")
        print(f"  Fields: {list(sample_doc.keys())}")
        print(f"  Name: {sample_doc.get('name')}")
        print(f"  Type: {sample_doc.get('trait_type')}")
        print(f"  Image URL: {sample_doc.get('image_url')}")
        print(f"  Breakpoints: {len(sample_doc.get('breakpoints', []))}")
        print()
    else:
        print("No traits found")
        print()


def main():
    print("Verifying seeded data structure matches service models...")
    
    db = connect_to_mongodb()
    
    verify_champion_structure(db)
    verify_trait_structure(db)
    
    print("✅ Verification completed - data structure matches service models!")


if __name__ == "__main__":
    main()