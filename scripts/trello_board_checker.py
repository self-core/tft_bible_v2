#!/usr/bin/env python3
"""
Trello Current Items Viewer
This script checks existing items on the TFT Bible Trello board
"""

import os
import requests
import json
from typing import List, Dict, Any

# Trello API configuration
TRELLO_API_KEY = os.getenv('TRELLO_API_KEY')
TRELLO_TOKEN = os.getenv('TRELLO_TOKEN')
BOARD_ID = "6933f7825f9e85b7e4ca7001"  # From the shared board link

class TrelloBoardChecker:
    def __init__(self, api_key: str, token: str, board_id: str):
        self.api_key = api_key
        self.token = token
        self.board_id = board_id
        self.base_url = "https://api.trello.com/1"
        
    def get_board_cards(self) -> List[Dict[str, Any]]:
        """Get all cards in the board"""
        url = f"{self.base_url}/boards/{self.board_id}/cards"
        params = {
            'key': self.api_key,
            'token': self.token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_board_lists(self) -> List[Dict[str, Any]]:
        """Get all lists in the board"""
        url = f"{self.base_url}/boards/{self.board_id}/lists"
        params = {
            'key': self.api_key,
            'token': self.token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def print_board_summary(self):
        """Print a summary of the board contents"""
        lists = self.get_board_lists()
        cards = self.get_board_cards()
        
        print(f"Board: TFT Bible Project Plans")
        print(f"Lists: {len(lists)}")
        print(f"Cards: {len(cards)}")
        print("\nLists in the board:")
        for list_item in lists:
            print(f"  - {list_item['name']} (ID: {list_item['id']})")
        
        print("\nCards in the board:")
        for card in cards:
            list_name = [l['name'] for l in lists if l['id'] == card['idList']][0]
            print(f"  - {card['name']} [List: {list_name}]")
            if card['desc']:
                print(f"    Description: {card['desc'][:100]}...")

def main():
    """
    Main function to check existing Trello board items
    """
    if not TRELLO_API_KEY or not TRELLO_TOKEN:
        print("Error: TRELLO_API_KEY and TRELLO_TOKEN environment variables must be set")
        print("Please visit https://trello.com/app-key to get your API key")
        return

    # Initialize Trello checker
    trello_checker = TrelloBoardChecker(
        api_key=TRELLO_API_KEY,
        token=TRELLO_TOKEN,
        board_id=BOARD_ID
    )

    # Print board summary
    print("Checking current Trello board items...")
    trello_checker.print_board_summary()

if __name__ == "__main__":
    main()