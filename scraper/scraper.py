#!/usr/bin/env python3
"""
TFT Composition Data Scraper
Scrapes composition data from various TFT websites for development reference.
This script holds data in memory only and uses temporary files for debugging.
Temporary files are excluded from git via .gitignore.
"""

import requests
import json
import time
import tempfile
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError

class TFTDataScraper:
    def __init__(self, mongodb_url: str = "mongodb://mongodb:27017", db_name: str = "tft_bible_dev"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        # MongoDB connection
        self.mongodb_url = mongodb_url
        self.db_name = db_name
        self.client = None
        self.db = None
        self.compositions_collection = None

        # Create temp directory for debugging files
        self.temp_dir = tempfile.mkdtemp(prefix='tft_scraper_')

        # Connect to MongoDB
        self._connect_mongodb()

    def _connect_mongodb(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongodb_url, serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self.compositions_collection = self.db['compositions']

            # Create indexes for better performance
            self.compositions_collection.create_index([("name", 1)], unique=True)
            self.compositions_collection.create_index([("source", 1)])
            self.compositions_collection.create_index([("scraped_at", -1)])

            print(f"Connected to MongoDB: {self.db_name}")

        except ConnectionFailure as e:
            print(f"Failed to connect to MongoDB: {e}")
            print("Continuing without database persistence...")
        except Exception as e:
            print(f"Error setting up MongoDB: {e}")
            print("Continuing without database persistence...")

    def scrape_tft_academy(self) -> List[Dict[str, Any]]:
        """Scrape data from tftacademy.com"""
        try:
            url = "https://tftacademy.com/tierlist/comps"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            content = response.text

            # Try multiple patterns to find composition data
            patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*({.*?});',
                r'window\.__NUXT__\s*=\s*({.*?});',
                r'"comps"\s*:\s*(\[.*?\])',
                r'compositions"\s*:\s*(\[.*?\])',
                r'tierlist"\s*:\s*(\[.*?\])'
            ]

            for pattern in patterns:
                import re
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    try:
                        json_str = match.group(1)
                        data = json.loads(json_str)
                        print(f"Found TFT Academy data via pattern: {pattern[:30]}...")

                        if isinstance(data, list):
                            return self._extract_comps_from_academy_list(data)
                        elif isinstance(data, dict):
                            return self._extract_comps_from_academy(data)
                    except (json.JSONDecodeError, IndexError) as e:
                        print(f"Failed to parse data with pattern {pattern[:30]}...: {e}")
                        continue

            print("No composition data found in TFT Academy HTML")
            return []

        except requests.exceptions.RequestException as e:
            print(f"Network error scraping TFT Academy: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error scraping TFT Academy: {e}")
            return []

    def scrape_tactics_tools(self) -> List[Dict[str, Any]]:
        """Scrape data from tactics.tools"""
        try:
            url = "https://tactics.tools/team-compositions"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            content = response.text

            # Try multiple patterns to find composition data
            patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*({.*?});',
                r'window\.__NUXT__\s*=\s*({.*?});',
                r'"comps"\s*:\s*(\[.*?\])',
                r'compositions"\s*:\s*(\[.*?\])',
                r'teamCompositions"\s*:\s*(\[.*?\])'
            ]

            for pattern in patterns:
                import re
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    try:
                        json_str = match.group(1)
                        data = json.loads(json_str)
                        print(f"Found Tactics Tools data via pattern: {pattern[:30]}...")

                        if isinstance(data, list):
                            return self._extract_comps_from_tactics_tools_list(data)
                        elif isinstance(data, dict):
                            return self._extract_comps_from_tactics_tools(data)
                    except (json.JSONDecodeError, IndexError) as e:
                        print(f"Failed to parse data with pattern {pattern[:30]}...: {e}")
                        continue

            print("No composition data found in Tactics Tools HTML")
            return []

        except requests.exceptions.RequestException as e:
            print(f"Network error scraping Tactics Tools: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error scraping Tactics Tools: {e}")
            return []

    def scrape_meta_tft(self) -> List[Dict[str, Any]]:
        """Scrape data from metatft.com"""
        try:
            url = "https://www.metatft.com/comps"
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            content = response.text

            # Try multiple patterns to find composition data
            patterns = [
                r'window\.__INITIAL_STATE__\s*=\s*({.*?});',
                r'window\.__NUXT__\s*=\s*({.*?});',
                r'"comps"\s*:\s*(\[.*?\])',
                r'compositions"\s*:\s*(\[.*?\])',
                r'tierlist"\s*:\s*(\[.*?\])',
                r'meta"\s*:\s*(\[.*?\])'
            ]

            for pattern in patterns:
                import re
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    try:
                        json_str = match.group(1)
                        data = json.loads(json_str)
                        print(f"Found MetaTFT data via pattern: {pattern[:30]}...")

                        if isinstance(data, list):
                            return self._extract_comps_from_metatft_list(data)
                        elif isinstance(data, dict):
                            return self._extract_comps_from_metatft(data)
                    except (json.JSONDecodeError, IndexError) as e:
                        print(f"Failed to parse data with pattern {pattern[:30]}...: {e}")
                        continue

            print("No composition data found in MetaTFT HTML")
            return []

        except requests.exceptions.RequestException as e:
            print(f"Network error scraping MetaTFT: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error scraping MetaTFT: {e}")
            return []

    def _extract_comps_from_academy(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract composition data from TFT Academy structure"""
        compositions = []

        try:
            # Navigate through the data structure to find compositions
            if 'comps' in data:
                comps_data = data['comps']
                for comp in comps_data:
                    if isinstance(comp, dict):
                        compositions.append(self._normalize_comp_data(comp, 'tftacademy'))
        except Exception as e:
            print(f"Error extracting from TFT Academy data: {e}")

        return compositions

    def _extract_comps_from_academy_list(self, comps_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract composition data from TFT Academy comps list"""
        compositions = []

        for comp in comps_list:
            if isinstance(comp, dict):
                compositions.append(self._normalize_comp_data(comp, 'tftacademy'))

        return compositions

    def _extract_comps_from_metatft(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract composition data from MetaTFT structure"""
        compositions = []

        try:
            # Navigate through the data structure to find compositions
            if 'comps' in data:
                comps_data = data['comps']
                for comp in comps_data:
                    if isinstance(comp, dict):
                        compositions.append(self._normalize_comp_data(comp, 'metatft'))
        except Exception as e:
            print(f"Error extracting from MetaTFT data: {e}")

        return compositions

    def _extract_comps_from_metatft_list(self, comps_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract composition data from MetaTFT comps list"""
        compositions = []

        for comp in comps_list:
            if isinstance(comp, dict):
                compositions.append(self._normalize_comp_data(comp, 'metatft'))

        return compositions

    def _extract_comps_from_tactics_tools(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract composition data from Tactics Tools structure"""
        compositions = []

        try:
            # Navigate through the data structure to find compositions
            if 'comps' in data:
                comps_data = data['comps']
                for comp in comps_data:
                    if isinstance(comp, dict):
                        compositions.append(self._normalize_comp_data(comp, 'tactics.tools'))
        except Exception as e:
            print(f"Error extracting from Tactics Tools data: {e}")

        return compositions

    def _extract_comps_from_tactics_tools_list(self, comps_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract composition data from Tactics Tools comps list"""
        compositions = []

        for comp in comps_list:
            if isinstance(comp, dict):
                compositions.append(self._normalize_comp_data(comp, 'tactics.tools'))

        return compositions

    def _normalize_comp_data(self, comp: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Normalize composition data to a consistent format for MongoDB"""
        try:
            # Extract basic information
            name = comp.get('name', comp.get('title', 'Unknown Composition'))
            description = comp.get('description', comp.get('desc', ''))

            # Extract tier and stats
            tier = comp.get('tier', comp.get('rank', 'B'))
            if tier not in ['S', 'A', 'B', 'C', 'D']:
                tier = 'B'  # Default tier

            difficulty = comp.get('difficulty', comp.get('complexity', 2))
            if isinstance(difficulty, str):
                # Convert string difficulty to number
                diff_map = {'Easy': 1, 'Medium': 2, 'Hard': 3, 'Expert': 4}
                difficulty = diff_map.get(difficulty, 2)

            # Extract stats
            winrate = comp.get('winrate', comp.get('win_rate', 0.5))
            if isinstance(winrate, str) and '%' in winrate:
                winrate = float(winrate.strip('%')) / 100
            elif isinstance(winrate, str):
                try:
                    winrate = float(winrate)
                except:
                    winrate = 0.5

            avg_placement = comp.get('avg_placement', comp.get('placement', 4.0))
            playrate = comp.get('playrate', comp.get('pick_rate', 0.1))

            # Extract champions
            champions = []
            champs_data = comp.get('champions', comp.get('units', comp.get('champs', [])))
            if isinstance(champs_data, list):
                for champ in champs_data:
                    if isinstance(champ, dict):
                        champ_name = champ.get('name', champ.get('champion', 'Unknown'))
                        items = champ.get('items', champ.get('item_list', []))
                        position = champ.get('position', champ.get('pos', None))
                        champions.append({
                            'name': champ_name,
                            'items': items if isinstance(items, list) else [],
                            'position': position
                        })

            # Extract augments
            augments = comp.get('augments', comp.get('augment_list', []))
            if not isinstance(augments, list):
                augments = []

            # Extract traits
            traits = comp.get('traits', comp.get('trait_list', []))
            if not isinstance(traits, list):
                traits = []

            # Extract category and tags
            category = comp.get('category', comp.get('type', 'General'))
            tags = comp.get('tags', [])
            if not isinstance(tags, list):
                tags = []

            # Extract patch
            patch = comp.get('patch', comp.get('version', '15.23'))

            # Extract playstyle
            playstyle = comp.get('playstyle', comp.get('style', 'Balanced'))

            # Create MongoDB document
            doc = {
                '_id': str(uuid.uuid4()),  # Unique identifier
                'name': name,
                'description': description,
                'category': category,
                'tags': tags,
                'tier': tier,
                'difficulty': difficulty,
                'winrate': winrate,
                'avg_placement': avg_placement,
                'playrate': playrate,
                'patch': patch,
                'playstyle': playstyle,
                'champions': champions,
                'augments': augments,
                'traits': traits,
                'source': source,
                'source_url': self._get_source_url(source),
                'scraped_at': datetime.now(),
                'updated_at': datetime.now(),
                'is_active': True
            }

            return doc

        except Exception as e:
            print(f"Error normalizing comp data: {e}")
            return {}

    def _get_source_url(self, source: str) -> str:
        """Get the source URL for a given source"""
        url_map = {
            'tftacademy': 'https://tftacademy.com/tierlist/comps',
            'metatft': 'https://www.metatft.com/comps',
            'tactics.tools': 'https://tactics.tools/team-compositions'
        }
        return url_map.get(source, '')

    def create_sample_data(self) -> List[Dict[str, Any]]:
        """Create sample composition data for testing"""
        return [
            {
                "name": "Bastion Bruisers",
                "description": "Frontline focused comp with Bastion synergies",
                "category": "Frontline",
                "tags": ["beginner", "frontline"],
                "tier": "A",
                "difficulty": 2,
                "winrate": 0.53,
                "avg_placement": 3.9,
                "playrate": 0.12,
                "patch": "15.23",
                "playstyle": "Defensive",
                "champions": [
                    {"name": "Bastion", "items": ["Bloodthirster", "Dragon's Claw"]},
                    {"name": "Garen", "items": ["Edge of Night", "Warmog's Armor"]},
                    {"name": "Poppy", "items": ["Sterak's Gage", "Dragon's Claw"]}
                ],
                "augments": ["Bastion Heart", "Frontline Fighters"],
                "traits": ["Bastion", "Warrior", "Knight"]
            },
            {
                "name": "Luchador Reroll",
                "description": "Aggressive reroll around Luchador core",
                "category": "Reroll",
                "tags": ["aggressive", "reroll"],
                "tier": "S",
                "difficulty": 3,
                "winrate": 0.58,
                "avg_placement": 3.4,
                "playrate": 0.16,
                "patch": "15.23",
                "playstyle": "Aggressive",
                "champions": [
                    {"name": "Luchador", "items": ["Infinity Edge", "Guinsoo's Rageblade"]},
                    {"name": "Jinx", "items": ["Giant Slayer", "Runaan's Hurricane"]},
                    {"name": "Miss Fortune", "items": ["Bloodthirster", "Giant Slayer"]}
                ],
                "augments": ["Luchador Soul", "Reroll Economy"],
                "traits": ["Luchador", "Sharpshooter", "Multistriker"]
            }
        ]

    def clean_and_deduplicate(self, compositions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and deduplicate composition data"""
        cleaned = []

        for comp in compositions:
            # Skip empty/invalid compositions
            if not comp or not comp.get('name') or comp.get('name') == 'Unknown Composition':
                continue

            # Basic validation
            if not isinstance(comp.get('champions', []), list):
                comp['champions'] = []
            if not isinstance(comp.get('augments', []), list):
                comp['augments'] = []
            if not isinstance(comp.get('traits', []), list):
                comp['traits'] = []
            if not isinstance(comp.get('tags', []), list):
                comp['tags'] = []

            # Ensure numeric fields are valid
            comp['winrate'] = max(0.0, min(1.0, comp.get('winrate', 0.5)))
            comp['avg_placement'] = max(1.0, min(8.0, comp.get('avg_placement', 4.0)))
            comp['playrate'] = max(0.0, min(1.0, comp.get('playrate', 0.1)))
            comp['difficulty'] = max(1, min(5, comp.get('difficulty', 2)))

            cleaned.append(comp)

        # Remove duplicates based on name (case-insensitive)
        seen_names = set()
        deduplicated = []

        for comp in cleaned:
            name_key = comp['name'].lower().strip()
            if name_key not in seen_names:
                seen_names.add(name_key)
                deduplicated.append(comp)

        return deduplicated

    def persist_to_mongodb(self, compositions: List[Dict[str, Any]]) -> int:
        """Persist compositions to MongoDB with duplicate handling"""
        if self.compositions_collection is None:
            print("MongoDB not connected, skipping persistence")
            return 0

        persisted_count = 0
        updated_count = 0

        try:
            for comp in compositions:
                try:
                    # Try to insert new document
                    result = self.compositions_collection.insert_one(comp)
                    persisted_count += 1
                    print(f"Inserted new composition: {comp['name']}")

                except DuplicateKeyError:
                    # Update existing document
                    existing = self.compositions_collection.find_one({"name": comp["name"]})
                    if existing:
                        # Update with new data but keep original _id and scraped_at
                        update_data = comp.copy()
                        update_data['_id'] = existing['_id']
                        update_data['scraped_at'] = existing['scraped_at']
                        update_data['updated_at'] = datetime.now()

                        self.compositions_collection.replace_one(
                            {"_id": existing['_id']},
                            update_data
                        )
                        updated_count += 1
                        print(f"Updated existing composition: {comp['name']}")
                    else:
                        print(f"Duplicate key error but no existing document found for: {comp['name']}")

                except Exception as e:
                    print(f"Error persisting composition {comp.get('name', 'Unknown')}: {e}")

            print(f"MongoDB persistence complete: {persisted_count} inserted, {updated_count} updated")

        except Exception as e:
            print(f"Error during MongoDB persistence: {e}")

        return persisted_count + updated_count

    def save_to_temp_file(self, data: List[Dict[str, Any]], filename: str = "scraped_compositions.json"):
        """Save scraped data to temporary file for debugging (not committed to git)"""
        output = {
            "scraped_at": datetime.now().isoformat(),
            "sources": ["tftacademy.com", "metatft.com", "tactics.tools"],
            "total_compositions": len(data),
            "data": data
        }

        temp_path = os.path.join(self.temp_dir, filename)
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"Temporarily saved {len(data)} compositions to {temp_path} (for debugging only)")
        print(f"Note: This file is in a temporary directory and will be cleaned up automatically")

    def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir)
            print(f"Cleaned up temporary directory: {self.temp_dir}")
        except Exception as e:
            print(f"Warning: Could not clean up temp directory: {e}")

        # Close MongoDB connection
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

def main():
    scraper = TFTDataScraper()

    print("Starting TFT composition data scraping...")

    # Try different sources
    all_comps = []

    print("Scraping TFT Academy...")
    academy_data = scraper.scrape_tft_academy()
    all_comps.extend(academy_data)
    print(f"TFT Academy: {len(academy_data)} compositions")

    print("Scraping MetaTFT...")
    metatft_data = scraper.scrape_meta_tft()
    all_comps.extend(metatft_data)
    print(f"MetaTFT: {len(metatft_data)} compositions")

    print("Scraping Tactics Tools...")
    tactics_data = scraper.scrape_tactics_tools()
    all_comps.extend(tactics_data)
    print(f"Tactics Tools: {len(tactics_data)} compositions")

    # If no data scraped, use sample data
    if not all_comps:
        print("No data scraped from websites, using sample data...")
        all_comps = scraper.create_sample_data()

    # Clean and deduplicate data
    cleaned_comps = scraper.clean_and_deduplicate(all_comps)
    print(f"After cleaning: {len(cleaned_comps)} compositions")

    # Persist to MongoDB
    persisted_count = scraper.persist_to_mongodb(cleaned_comps)
    print(f"Persisted {persisted_count} compositions to MongoDB")

    # Save to temporary file for debugging
    scraper.save_to_temp_file(cleaned_comps)

    print(f"Scraping complete! Found {len(cleaned_comps)} unique compositions.")

    # Clean up temporary files
    scraper.cleanup_temp_files()

if __name__ == "__main__":
    main()