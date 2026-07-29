# Trello Backlog Manager

This script allows you to add backlog items to the TFT Bible Trello board programmatically.

## Prerequisites

Before using this script, you need:
- Trello API key and token
- Python 3 installed

## Setup

1. Install required packages:
   ```bash
   pip install requests
   ```

2. Set up environment variables:
   ```bash
   export TRELLO_API_KEY="your_trello_api_key"
   export TRELLO_TOKEN="your_trello_token"
   ```

## Usage

Run the script to add backlog items to Trello:
```bash
python trello_backlog_manager.py
```

## Configuration

The script adds the following backlog items to the 'Backlog' list in your Trello board:

- ETCD Service Discovery Implementation
- Gateway Circuit Breaker Enhancement
- Kubernetes Migration
- Service Mesh Implementation
- Advanced Monitoring and Observability
- Authentication and Authorization System
- Database Sharding Strategy
- ML-Based Trait Recommendations
- Real-Time Game State Tracking
- Mobile App Development

## How to Get Trello API Credentials

1. Go to https://trello.com/app-key
2. Copy your API key
3. Generate a token using the provided URL
4. Set the environment variables as shown above

## Notes

- The script will create a 'Backlog' list if it doesn't exist
- All items are added with low priority by default
- Make sure your Trello token has write permissions to the board