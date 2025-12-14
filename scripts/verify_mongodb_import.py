#!/usr/bin/env python3
"""
Verify that dragontail data was properly imported into MongoDB
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


def verify_import(db):
    """Verify the data import"""
    collections = ['champions', 'traits', 'items', 'augments']
    
    print("\nVerifying MongoDB collections:")
    
    for collection_name in collections:
        collection = db[collection_name]
        count = collection.count_documents({})
        print(f"  {collection_name}: {count} documents")
        
        # Show a sample document
        if count > 0:
            sample_doc = collection.find_one()
            print(f"    Sample: {sample_doc.get('name', 'N/A')} (ID: {sample_doc.get('id', 'N/A')})")
        print()


def main():
    print("Verifying dragontail data import to MongoDB...")
    
    db = connect_to_mongodb()
    verify_import(db)
    
    print("Verification completed!")


if __name__ == "__main__":
    main()