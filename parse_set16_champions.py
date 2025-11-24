#!/usr/bin/env python3
"""
Parse Set 16 champion data from tactics.tools HTML
"""

import json
import re
from typing import Dict, List, Any

def extract_champion_data(html_file: str) -> List[Dict[str, Any]]:
    """Extract champion data from HTML file"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the __NEXT_DATA__ script tag
    pattern = r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        print("Could not find __NEXT_DATA__ script tag")
        return []

    json_str = match.group(1)

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        return []

    # Navigate to the units data
    try:
        units_data = data['props']['pageProps']['units']
        print(f"Found {len(units_data)} units")

        champions = []
        for unit_key, unit_data in units_data.items():
            # Convert to our format
            champion = {
                "id": unit_key.replace('TFT16_', '').lower(),
                "name": unit_data.get('name', ''),
                "cost": unit_data.get('cost', 1),
                "traits": unit_data.get('traits', []),
                "health": unit_data.get('stats', {}).get('health', 100),
                "attack_damage": unit_data.get('stats', {}).get('attackDamage', 10),
                "abilities": [unit_data.get('ability', {}).get('name', '')] if unit_data.get('ability') else [],
                "ability_damage": unit_data.get('ability', {}).get('damage', '') if unit_data.get('ability') else '',
                "ability_description": unit_data.get('ability', {}).get('description', '') if unit_data.get('ability') else '',
                "recommended_items": unit_data.get('items', []),
                "tier": "B",  # Default tier
                "icon_url": f"https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/{unit_data.get('id', 0)}.png"
            }
            champions.append(champion)

        return champions

    except KeyError as e:
        print(f"Could not navigate to units data: {e}")
        return []

def main():
    champions = extract_champion_data('set16_units.html')

    if champions:
        print(f"Extracted {len(champions)} champions")

        # Save to JSON file
        with open('set16_champions.json', 'w', encoding='utf-8') as f:
            json.dump(champions, f, indent=2, ensure_ascii=False)

        print("Saved to set16_champions.json")
    else:
        print("No champions extracted")

if __name__ == "__main__":
    main()