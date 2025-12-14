#!/usr/bin/env python3
"""
Trello Backlog Management Script
This script adds backlog items to the TFT Bible Trello board
"""

import os
import requests
import json
from typing import List, Dict, Any
import sys

def load_env_vars():
    """Load environment variables from .env file"""
    try:
        # Read the .env file and parse it
        env_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        with open(env_file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    os.environ[key] = value
    except Exception as e:
        print(f"Could not load .env file: {e}")

# Load environment variables
load_env_vars()

# Trello API configuration
TRELLO_API_KEY = os.getenv('TRELLO_API_KEY')
TRELLO_TOKEN = os.getenv('TRELLO_TOKEN')
BOARD_ID = "6933f7825f9e85b7e4ca7001"  # From the shared board link

class TrelloBacklogManager:
    def __init__(self, api_key: str, token: str, board_id: str):
        self.api_key = api_key
        self.token = token
        self.board_id = board_id
        self.base_url = "https://api.trello.com/1"

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

    def find_list_by_name(self, list_name: str) -> Dict[str, Any]:
        """Find a list by its name"""
        lists = self.get_board_lists()
        for list_item in lists:
            if list_item['name'].lower() == list_name.lower():
                return list_item
        return None

    def get_cards_in_list(self, list_id: str) -> List[Dict[str, Any]]:
        """Get all cards in a specific list"""
        url = f"{self.base_url}/lists/{list_id}/cards"
        params = {
            'key': self.api_key,
            'token': self.token
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def get_current_backlog_items(self) -> List[Dict[str, Any]]:
        """Get all current backlog items from the 'Backlog' list"""
        backlog_list = self.find_list_by_name('Backlog')
        if backlog_list:
            return self.get_cards_in_list(backlog_list['id'])
        else:
            # If there's no backlog list, get all cards in the board
            return self.get_board_cards()

    def create_card(self, list_id: str, title: str, description: str = "") -> Dict[str, Any]:
        """Create a card in a specific list"""
        url = f"{self.base_url}/cards"
        params = {
            'key': self.api_key,
            'token': self.token,
            'idList': list_id,
            'name': title,
            'desc': description
        }

        response = requests.post(url, params=params)
        response.raise_for_status()
        return response.json()

    def add_backlog_items(self, new_items: List[Dict[str, str]]):
        """Add multiple backlog items to the 'Backlog' list, avoiding duplicates"""
        backlog_list = self.find_list_by_name('Backlog')
        if not backlog_list:
            print("Backlog list not found. Creating 'Backlog' list...")
            backlog_list = self.create_list('Backlog')

        # Get existing backlog items to avoid duplicates
        existing_cards = self.get_current_backlog_items()
        existing_titles = {card['name'].lower() for card in existing_cards}

        added_cards = []
        skipped_items = []

        for item in new_items:
            if item['title'].lower() in existing_titles:
                print(f"Skipping duplicate item: {item['title']}")
                skipped_items.append(item['title'])
            else:
                try:
                    card = self.create_card(
                        list_id=backlog_list['id'],
                        title=item['title'],
                        description=item.get('description', '')
                    )
                    added_cards.append(card)
                    print(f"Added backlog item: {item['title']}")
                except Exception as e:
                    print(f"Failed to add backlog item '{item['title']}': {e}")

        return added_cards, skipped_items

    def create_list(self, list_name: str) -> Dict[str, Any]:
        """Create a new list in the board"""
        url = f"{self.base_url}/lists"
        params = {
            'key': self.api_key,
            'token': self.token,
            'idBoard': self.board_id,
            'name': list_name
        }

        response = requests.post(url, params=params)
        response.raise_for_status()
        return response.json()

def main():
    """
    Main function to add backlog items to Trello
    """
    if not TRELLO_API_KEY or not TRELLO_TOKEN:
        print("Error: TRELLO_API_KEY and TRELLO_TOKEN must be set in the .env file.")
        sys.exit(1)

    # Define technical backlog items to add (focusing on architecture items, not QA)
    # Note: QA items are typically already tracked separately
    backlog_items = [
        {
            "title": "ETCD Service Discovery Implementation",
            "description": "Implement ETCD as the primary service discovery mechanism for microservices. Replace in-memory registry with distributed ETCD registry."
        },
        {
            "title": "Gateway Circuit Breaker Enhancement",
            "description": "Improve circuit breaker implementation in API gateway with better fallback strategies and monitoring."
        },
        {
            "title": "Kubernetes Migration Strategy",
            "description": "Plan migration from Docker Compose to Kubernetes for production deployment with proper orchestration."
        },
        {
            "title": "Service Mesh Implementation",
            "description": "Implement service mesh for better service-to-service communication, security, and observability."
        },
        {
            "title": "Advanced Monitoring and Observability",
            "description": "Implement comprehensive monitoring with Prometheus, Grafana, and distributed tracing with Jaeger."
        },
        {
            "title": "Authentication and Authorization System",
            "description": "Implement JWT-based authentication and role-based authorization across all services."
        },
        {
            "title": "Database Sharding Strategy",
            "description": "Implement database sharding for better scalability as the application grows."
        },
        {
            "title": "Separate Docker Compose Files Strategy",
            "description": "Implement separate docker-compose files for faster development: one for infrastructure (etcd, mongodb, redis), one for backend services, one for frontend. This allows building and running only changed services without rebuilding everything."
        },
        {
            "title": "Gateway Migration to Go",
            "description": "Migrate from current Rust gateway to Go-based gateway for better performance, easier service discovery integration, and improved ecosystem compatibility. Plan the migration while maintaining current functionality."
        }
    ]

    # Initialize Trello manager
    trello_manager = TrelloBacklogManager(
        api_key=TRELLO_API_KEY,
        token=TRELLO_TOKEN,
        board_id=BOARD_ID
    )

    # Get current backlog items
    print("Fetching current backlog items...")
    current_backlog_items = trello_manager.get_current_backlog_items()
    print(f"Found {len(current_backlog_items)} existing backlog items.")

    if current_backlog_items:
        print("\nCurrent backlog items:")
        for item in current_backlog_items:
            print(f"  - {item['name']}")

    print("\nAdding new backlog items to Trello...")
    added_cards, skipped_items = trello_manager.add_backlog_items(backlog_items)
    print(f"\nSuccessfully added {len(added_cards)} new backlog items to Trello.")
    if skipped_items:
        print(f"Skipped {len(skipped_items)} duplicate items.")

    # Print summary of all backlog items now
    print("\nUpdated backlog summary:")
    updated_backlog_items = trello_manager.get_current_backlog_items()
    print(f"Total backlog items: {len(updated_backlog_items)}")
    for item in updated_backlog_items:
        print(f"  - {item['name']}")

if __name__ == "__main__":
    main()