# TFT Bible Backend - Riot API Integration

This document outlines the architecture and implementation of the Riot API integration for the TFT Bible project.

## Architecture Overview

The system implements a dual approach for fetching TFT data from the Riot Games API:

1. **Direct API Access** - For user-requested data that needs to be fetched immediately
2. **Message Queue System** - For background data fetching to populate the database proactively

## Components

### 1. Riot API Client (`src/riot_api/mod.rs`)

Handles communication with the Riot Games TFT API. The client supports:

- Fetching summoner information by PUUID, Summoner ID, or Summoner Name
- Fetching match history for a summoner
- Fetching detailed match information
- Proper header management (X-Riot-Token)

### 2. Message Queue System (`src/queue/`)

Built with Kafka for reliable and scalable background data processing:

- **Producer**: Queues data fetch requests
- **Consumer**: Processes queued requests and stores data in the database
- **Message Types**: Defined for different fetch operations

### 3. Data Models (`src/models.rs`)

New models added for storing Riot API data:

- `RiotSummoner`: Stores summoner information from the Riot API
- `RiotMatch`: Stores match data from the Riot API
- `RiotMatchParticipant`: Stores participant details within matches
- `RiotMatchTrait` and `RiotMatchUnit`: Detailed match components

### 4. TFT Data Service (`src/services/tft_data_service.rs`)

Central service that provides:

- Direct API access methods
- Message queue integration
- Unified interface for data operations

### 5. API Endpoints (`src/handlers/riot_data/mod.rs`)

New endpoints added:

#### Direct Fetch Endpoints:
- `GET /api/v1/riot/summoner/:identifier` - Get summoner data directly
- `GET /api/v1/riot/match-history/:puuid` - Get match history directly  
- `GET /api/v1/riot/match/:match_id` - Get match details directly

#### Queue Endpoints:
- `POST /api/v1/riot/queue/summoner/:identifier` - Queue summoner fetch
- `POST /api/v1/riot/queue/match-history/:puuid` - Queue match history fetch

## Configuration

### Environment Variables

- `RIOT_API_KEY`: Your Riot Games API key (kept secret, not in code)
- `KAFKA_URL`: Kafka broker URL (default: localhost:9092)

### Security

- API key is only stored in environment variables
- API key is never logged or exposed in responses
- All API calls include proper authentication headers

## Data Flow

### For User-Requested Data (Direct API)
1. User requests specific data through frontend
2. Frontend calls direct API endpoint
3. Backend fetches data directly from Riot API
4. Data is returned to user immediately
5. Optionally, data may be stored in DB for future use

### For Background Data Population (Message Queue)
1. Admin/automated process queues data fetch requests
2. Requests are stored in Kafka queue
3. Consumer processes requests asynchronously
4. Data is fetched from Riot API
5. Data is processed and stored in MongoDB
6. Data is available for future user requests

## Deployment

The system is fully containerized with Docker Compose:

- Backend service with Rust application
- MongoDB for data storage
- Kafka with Zookeeper for message queuing
- Frontend service
- All services configured to work together

## Rate Limiting Considerations

The message queue system allows for rate limiting and scheduling of API calls to comply with Riot's rate limits.