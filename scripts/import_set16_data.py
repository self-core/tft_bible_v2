#!/usr/bin/env python3
"""
Import Set 16 data to MongoDB
This script imports the Set 16 champion data from the JSON file into the MongoDB database
in the correct format expected by the backend service.
"""

import json
import os
from pymongo import MongoClient
from typing import Dict, List, Any


def connect_to_mongodb():
    """Connect to MongoDB with proper authentication"""
    # Use local MongoDB for import
    mongodb_url = 'mongodb://admin:password@localhost:27017/'

    print(f"Connecting to MongoDB at {mongodb_url}")

    client = MongoClient(mongodb_url, authSource='admin')

    return client


def transform_champion_data(raw_champions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform raw champion data to match the backend service model"""
    champions = []

    for raw_champion in raw_champions:
        # Create a champion that matches the backend ChampionModel
        champion = {
            "id": f"TFT16_{raw_champion['name'].replace(' ', '')}",  # Generate proper ID
            "name": raw_champion["name"],
            "cost": raw_champion["cost"],
            "traits": raw_champion["traits"],
            "stats": {
                "hp": raw_champion.get("health", 600),
                "mana": raw_champion.get("mana", 100),  # Default value
                "damage": raw_champion.get("attack_damage", 50)  # Default value
            },
            "ability": {
                "name": raw_champion.get("abilities", ["Unknown Ability"])[0] if raw_champion.get("abilities") else "Unknown Ability",
                "variables": {}  # Will populate with actual ability variables if available
            },
            "imageUrl": raw_champion.get("icon_url"),
            "splashUrl": None,  # Not available in the raw data
            "iconUrl": raw_champion.get("icon_url")
        }

        champions.append(champion)

    return champions


def transform_trait_data() -> List[Dict[str, Any]]:
    """Create trait data for Set 16 based on the champions' traits"""
    # Define the traits that appear in the champion data
    traits_info = {
        "Arcane": {
            "name": "Arcane",
            "description": "Arcane units gain mana whenever they deal or take damage.",
            "breakpoints": [
                {"count": 2, "bonus": "Arcane units gain 20 mana on hit"},
                {"count": 4, "bonus": "Arcane units gain 40 mana on hit"},
                {"count": 6, "bonus": "Arcane units gain 60 mana on hit"}
            ]
        },
        "Sorcerer": {
            "name": "Sorcerer",
            "description": "Sorcerers gain bonus Ability Power. All allies have their Magic Resist reduced.",
            "breakpoints": [
                {"count": 3, "bonus": "Sorcerers gain 40% AP, 10% enemy MR reduction"},
                {"count": 6, "bonus": "Sorcerers gain 70% AP, 20% enemy MR reduction"},
                {"count": 9, "bonus": "Sorcerers gain 120% AP, 30% enemy MR reduction"}
            ]
        },
        "Ninja": {
            "name": "Ninja",
            "description": "Ninjas gain Attack Damage and Ability Power. This trait is only active when you have exactly 1 or 4 unique Ninjas.",
            "breakpoints": [
                {"count": 1, "bonus": "Ninja gains 50% AD and 50 AP"},
                {"count": 4, "bonus": "All Ninjas gain 50% AD and 50 AP"}
            ]
        },
        "Assassin": {
            "name": "Assassin",
            "description": "Assassins leap to the enemy backline and gain Critical Strike Chance and Dodge Chance.",
            "breakpoints": [
                {"count": 2, "bonus": "Assassins gain 10% Crit Chance and Dodge Chance"},
                {"count": 4, "bonus": "Assassins gain 25% Crit Chance and Dodge Chance"},
                {"count": 6, "bonus": "Assassins gain 40% Crit Chance and Dodge Chance"}
            ]
        },
        "Ranger": {
            "name": "Ranger",
            "description": "Rangers have a chance to double their attack speed for the next attack.",
            "breakpoints": [
                {"count": 2, "bonus": "Rangers have 30% chance to double attack speed"},
                {"count": 4, "bonus": "Rangers have 60% chance to double attack speed"},
                {"count": 6, "bonus": "Rangers have 90% chance to double attack speed"}
            ]
        },
        "Gunner": {
            "name": "Gunner",
            "description": "Gunners' attacks can bounce to other targets, dealing less damage with each bounce.",
            "breakpoints": [
                {"count": 2, "bonus": "Gunners' attacks bounce to 1 additional target"},
                {"count": 4, "bonus": "Gunners' attacks bounce to 2 additional targets"},
                {"count": 6, "bonus": "Gunners' attacks bounce to 3 additional targets"}
            ]
        },
        "Invoker": {
            "name": "Invoker",
            "description": "Invoker units have their abilities treated as if they were cast by a higher-star unit.",
            "breakpoints": [
                {"count": 2, "bonus": "Invoker abilities are treated as if cast by 1-star higher unit"},
                {"count": 4, "bonus": "Invoker abilities are treated as if cast by 2-star higher unit"}
            ]
        },
        "Multistriker": {
            "name": "Multistriker",
            "description": "Multistriker units attack multiple enemies at once.",
            "breakpoints": [
                {"count": 2, "bonus": "Multistriker attacks 2 enemies"},
                {"count": 4, "bonus": "Multistriker attacks 3 enemies"},
                {"count": 6, "bonus": "Multistriker attacks 4 enemies"}
            ]
        },
        "Inventor": {
            "name": "Inventor",
            "description": "Inventors can build special items during combat.",
            "breakpoints": [
                {"count": 2, "bonus": "Inventors can build Tactician's Items"},
                {"count": 4, "bonus": "Inventors can build more advanced items"}
            ]
        }
    }

    traits = []
    for key, value in traits_info.items():
        trait = {
            "key": key,
            "name": value["name"],
            "description": value["description"],
            "breakpoints": value["breakpoints"]
        }
        traits.append(trait)

    return traits


def seed_mongodb(client, champions: List[Dict[str, Any]], traits: List[Dict[str, Any]]):
    """Seed MongoDB with Set 16 data"""
    
    # Access the database and collections
    db = client['tft_bible_dev']  # Using the same database as the backend
    champions_collection = db['champions']
    traits_collection = db['traits']
    sets_collection = db['sets']

    # Clear existing Set 16 data
    print("Clearing existing Set 16 data...")
    champions_collection.delete_many({"id": {"$regex": "^TFT16_"}})
    traits_collection.delete_many({"key": {"$regex": "^(Arcane|Sorcerer|Ninja|Assassin|Ranger|Gunner|Invoker|Multistriker|Inventor)"}})
    
    # Insert champions
    print(f"Inserting {len(champions)} champions...")
    if champions:
        champions_collection.insert_many(champions)
        print(f"  ✅ Inserted {len(champions)} champions")

    # Insert traits
    print(f"Inserting {len(traits)} traits...")
    if traits:
        traits_collection.insert_many(traits)
        print(f"  ✅ Inserted {len(traits)} traits")

    # Create or update the Set document
    set_doc = {
        "setId": 16,
        "setName": "Lore & Legends",
        "champions": [champion["id"] for champion in champions],
        "traits": [trait["key"] for trait in traits],
        "items": [],  # Will be populated later
        "augments": [
            {
                "id": "arcane-nullifier",
                "name": "Arcane Nullifier",
                "description": "Combat start: Your units purge the enemies at the start of combat, causing them to take 25% more magic damage until they cast their ability.",
                "imageUrl": "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png"
            },
            {
                "id": "backfoot",
                "name": "Backfoot",
                "description": "Combat start: Your highest-starred unit gains 30% Attack Speed and is immune to crowd control for 10 seconds.",
                "imageUrl": "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png"
            },
            {
                "id": "balanced-diet",
                "name": "Balanced Diet",
                "description": "Every 4 exp gives 1 temporary item component. Gain 2 exp.",
                "imageUrl": "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png"
            },
            {
                "id": "big-spear",
                "name": "Big Spear",
                "description": "Your units gain 25% Attack Range and 15% Attack Damage.",
                "imageUrl": "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png"
            }
        ],
        "mechanics": {}
    }

    print("Inserting/Updating Set 16 document...")
    sets_collection.replace_one(
        {"setId": 16},
        set_doc,
        upsert=True
    )
    print("  ✅ Set 16 document inserted/updated")


def main():
    # Load the Set 16 champion data
    with open('data/set16_champions.json', 'r', encoding='utf-8') as f:
        raw_champions = json.load(f)

    print(f"Loaded {len(raw_champions)} champions from set16_champions.json")

    # Transform the data to match the backend model
    champions = transform_champion_data(raw_champions)
    traits = transform_trait_data()

    print(f"Transformed data: {len(champions)} champions, {len(traits)} traits")

    # Connect to MongoDB
    client = connect_to_mongodb()

    # Seed the database
    seed_mongodb(client, champions, traits)

    print("\n🎉 Set 16 data import completed successfully!")


if __name__ == "__main__":
    main()