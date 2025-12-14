#!/usr/bin/env python3
"""
Script to push project plans to Trello directly using the Trello API.
"""

import os
import requests
import json
import re
from typing import List, Dict, Any

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"\'')
    else:
        print("Warning: .env file not found")

def extract_tasks_from_md(content: str, plan_name: str) -> List[Dict[str, Any]]:
    """Extract tasks from markdown content."""
    tasks = []

    # Look for checklist items in markdown format
    checklist_pattern = r'- \[([ x])\]\s*(.*)'
    matches = re.findall(checklist_pattern, content)

    for status, task_desc in matches:
        priority = "medium"  # Default priority

        # Check for priority indicators in the task description
        if "high" in task_desc.lower() or "critical" in task_desc.lower() or "important" in task_desc.lower():
            priority = "high"
        elif "low" in task_desc.lower():
            priority = "low"

        tasks.append({
            "name": task_desc.strip(),
            "description": f"From {plan_name} plan",
            "priority": priority
        })

    # If no checklist items found, parse the content looking for structured tasks
    if not tasks:
        # Look for headers followed by lists of tasks
        lines = content.split('\n')
        current_section = "General"

        for line in lines:
            # Check for headers
            if line.strip().startswith('#') or line.strip().startswith('##') or line.strip().startswith('###'):
                current_section = line.strip().lstrip('# ')
                continue

            # Check for list items
            if line.strip().startswith('- ') or line.strip().startswith('* '):
                task_text = line.strip()[2:]  # Remove '- ' or '* '

                # Skip if it's just a continuation of previous item
                if not task_text or task_text.startswith(':') or task_text.startswith('-'):
                    continue

                priority = "medium"
                if "high" in task_text.lower() or "critical" in task_text.lower() or "important" in task_text.lower():
                    priority = "high"
                elif "low" in task_text.lower():
                    priority = "low"

                tasks.append({
                    "name": f"[{current_section}] {task_text[:60]}...",  # Truncate if too long
                    "description": f"From {plan_name} - Section: {current_section}\n\n{task_text}",
                    "priority": priority
                })

    # If still no tasks found, create a general task for the whole plan
    if not tasks:
        tasks.append({
            "name": f"Implement: {plan_name}",
            "description": content[:500] + "..." if len(content) > 500 else content,
            "priority": "medium"
        })

    return tasks

def create_trello_board(api_key: str, token: str, board_name: str) -> str:
    """Create a new Trello board directly using the Trello API."""
    url = f"https://api.trello.com/1/boards/"

    params = {
        'key': api_key,
        'token': token,
        'name': board_name,
        'desc': 'TFT Bible Project - Development and Progress Tracking',
        'defaultLists': 'false'  # We'll create our own lists
    }

    response = requests.post(url, params=params)

    if response.status_code == 200:
        board_data = response.json()
        board_id = board_data.get('id')
        print(f"✅ Board created successfully with ID: {board_id}")
        return board_id
    else:
        print(f"❌ Error creating board: {response.status_code} - {response.text}")
        return None

def setup_board_lists(api_key: str, token: str, board_id: str) -> Dict[str, str]:
    """Setup the standard board lists structure."""
    list_names = [
        "Backlog",
        "Sprint Planning",
        "To Do",
        "In Progress",
        "Code Review",
        "Testing",
        "Done",
        "Knowledge Base",
        "Blocked"
    ]

    created_lists = {}

    for i, list_name in enumerate(list_names):
        url = f"https://api.trello.com/1/lists"

        params = {
            'key': api_key,
            'token': token,
            'name': list_name,
            'idBoard': board_id,
            'pos': i  # Position in the list
        }

        response = requests.post(url, params=params)

        if response.status_code == 200:
            list_data = response.json()
            list_id = list_data.get('id')
            created_lists[list_name] = list_id
            print(f"  ✅ List created: {list_name} (ID: {list_id})")
        else:
            print(f"  ❌ Error creating list {list_name}: {response.status_code} - {response.text}")

    return created_lists

def create_card_in_list(api_key: str, token: str, list_id: str, card_name: str, card_desc: str):
    """Create a card in a specific list."""
    url = f"https://api.trello.com/1/cards"

    params = {
        'key': api_key,
        'token': token,
        'name': card_name,
        'desc': card_desc,
        'idList': list_id,
        'pos': 'bottom'  # Add to bottom of list
    }

    response = requests.post(url, params=params)

    if response.status_code == 200:
        card_data = response.json()
        card_id = card_data.get('id')
        print(f"    ✅ Card created: {card_name[:50]}... (ID: {card_id})")
        return card_id
    else:
        print(f"    ❌ Error creating card: {response.status_code} - {response.text}")
        return None

def main():
    """Main function to push all plans to Trello directly."""
    print("🚀 Starting Trello board creation and plan import...")

    # Load environment variables
    load_env()

    # Get API credentials from environment
    api_key = os.environ.get("TRELLO_API_KEY")
    token = os.environ.get("TRELLO_TOKEN")

    if not api_key:
        print("❌ TRELLO_API_KEY not found in environment")
        return

    if not token or token == "your_trello_token_here":
        print("❌ TRELLO_TOKEN not set or using placeholder. Please set a valid token.")
        print("To get a Trello token:")
        print("1. Go to https://trello.com/app-key")
        print("2. Get your API key")
        print("3. Generate a token by visiting:")
        print("   https://trello.com/1/authorize?key=YOUR_API_KEY&name=TFT+Bible+App&expiration=never&response_type=token&scope=read,write")
        return

    # Read the plan documents
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs")

    plan_files = {
        "etcd_service_discovery": os.path.join(docs_dir, "etcd_service_discovery.md"),
        "frontend_gateway_fix": os.path.join(docs_dir, "frontend_gateway_fix.md"),
        "migration_gateway_to_go": os.path.join(docs_dir, "migration_gateway_to_go.md")
    }

    plans = {}
    for plan_name, file_path in plan_files.items():
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                plans[plan_name] = content
            print(f"✅ Loaded {plan_name} plan")
        else:
            print(f"❌ Plan file not found: {file_path}")

    if not plans:
        print("❌ No plan files found, exiting.")
        return

    # Create a Trello board
    board_name = "TFT Bible - Project Plans"
    board_id = create_trello_board(api_key, token, board_name)

    if not board_id:
        print("❌ Failed to create Trello board, exiting.")
        return

    # Setup board structure
    print("📋 Setting up board lists...")
    lists = setup_board_lists(api_key, token, board_id)

    # Get the 'Backlog' list to add all tasks to
    backlog_list_id = lists.get("Backlog")
    if not backlog_list_id:
        print("❌ Backlog list not found, using first available list")
        backlog_list_id = next(iter(lists.values())) if lists else None

    if not backlog_list_id:
        print("❌ No lists available to add tasks to, exiting.")
        return

    # For each plan, extract tasks and add them to Trello
    for plan_name, content in plans.items():
        print(f"\n📋 Processing {plan_name} plan...")

        # Extract tasks from the markdown content
        tasks = extract_tasks_from_md(content, plan_name.replace('_', ' ').title())

        print(f"  Found {len(tasks)} tasks to create")

        # Create tasks in Trello
        for task in tasks:
            create_card_in_list(
                api_key,
                token,
                backlog_list_id,
                f"[{plan_name.replace('_', ' ').title()}] {task['name']}",
                task['description']
            )

    print(f"\n🎉 All plans have been pushed to Trello board: {board_name} (ID: {board_id})")
    print("You can view your board at: https://trello.com/b/" + board_id)


if __name__ == "__main__":
    main()