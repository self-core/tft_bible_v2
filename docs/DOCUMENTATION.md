# TFT Bible - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Setup and Development](#setup-and-development)
4. [API Documentation](#api-documentation)
5. [Frontend Components](#frontend-components)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Future Enhancements](#future-enhancements)

## Project Overview

The TFT Bible is a comprehensive Teamfight Tactics companion application built with Rust and modern web technologies. It's designed to help players discover, build, and optimize their TFT compositions, especially with support for the upcoming Lore & Legends (Set 16) scheduled for release on December 3rd, 2025.

### Features
- Team composition builder with drag-and-drop functionality
- Champion and trait information
- Set-specific data management
- User-generated compositions
- API for TFT data from Riot Games
- Modern, responsive UI

## Architecture

### Tech Stack
- **Backend**: Rust with Axum web framework
- **Frontend**: React with TypeScript
- **Database**: MongoDB
- **Message Queue**: Kafka
- **Containerization**: Docker & Docker Compose
- **CI/CD**: Jenkins
- **UI Framework**: Tailwind CSS with custom components
- **State Management**: React Query for data fetching

### Project Structure
```
tft_bible_v2/
├── backend/                    # Rust backend
│   ├── src/
│   │   ├── handlers/          # API route handlers
│   │   ├── services/          # Business logic services
│   │   ├── models.rs          # Data models and DTOs
│   │   ├── errors.rs          # Error types
│   │   ├── config.rs          # Configuration
│   │   ├── router.rs          # API routing
│   │   ├── seed.rs            # Database seeding
│   │   └── main.rs            # Application entry point
│   ├── tests/                 # Test suite
│   ├── Cargo.toml             # Rust dependencies
│   └── Dockerfile             # Docker build
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   └── Builder/       # TFT team builder
│   │   ├── pages/             # React pages
│   │   ├── lib/               # API client
│   │   └── types.ts           # TypeScript types
│   ├── package.json           # NPM dependencies
│   └── Dockerfile             # Docker build
├── jenkins/                   # CI/CD configuration
├── docker-compose.yml         # Development environment
└── README.md                  # Project overview
```

## Setup and Development

### Prerequisites
- Docker and Docker Compose
- Git
- Rust (for local development without Docker)
- Node.js (for local frontend development without Docker)

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://gitlab.com/puppets-dev/tft_bible_v2.git
   cd tft_bible_v2
   ```

2. Start the development environment:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the Rust backend in a Docker container
   - Build the React frontend in a Docker container
   - Start MongoDB with development data
   - Start Kafka for message queuing
   - Enable hot reloading for development

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health check: http://localhost:8080/api/v1/health
   - MongoDB: localhost:27017 (admin/password)

## API Documentation

### Authentication
Most endpoints don't require authentication. However, endpoints for creating/updating compositions will require authentication when implemented.

### Base URL
`http://localhost:8080/api/v1`

### Endpoints

#### Sets
- `GET /sets` - List all sets
- `GET /sets/active` - Get currently active set
- `GET /sets/{id}` - Get set by ID
- `GET /sets/name/{name}` - Get set by name

#### Compositions
- `GET /compositions` - List compositions with filtering
- `GET /compositions/{id}` - Get composition by ID
- `POST /compositions` - Create composition (requires auth)
- `PUT /compositions/{id}` - Update composition (requires auth)
- `DELETE /compositions/{id}` - Delete composition (requires auth)
- `POST /compositions/{id}/vote` - Vote on composition

#### Champions
- `GET /champions` - List champions with filtering
- `GET /champions/{id}` - Get champion by ID
- `GET /champions/trait/{trait}` - Get champions by trait

#### Traits
- `GET /traits` - List traits with filtering
- `GET /traits/{name}` - Get trait by name

#### Items
- `GET /items` - List items with filtering
- `GET /items/{id}` - Get item by ID
- `GET /items/recommendations/{champion_id}` - Get item recommendations

#### Search
- `GET /search?q=query` - Search across all entities

#### Health
- `GET /health` - API health check

#### Riot API Integration
- `GET /riot/summoner/{identifier}` - Get summoner data directly
- `GET /riot/match-history/{puuid}` - Get match history directly
- `GET /riot/match/{match_id}` - Get match details directly
- `POST /riot/queue/summoner/{identifier}` - Queue summoner fetch
- `POST /riot/queue/match-history/{puuid}` - Queue match history fetch

## Frontend Components

### Builder Component
The core feature of the application is the team builder component that allows users to:
- Select champions from a specific set
- Place champions on the TFT game board
- Visualize active traits
- Save and share compositions
- Calculate composition stats

### File Structure
```
src/components/Builder/
├── Builder.tsx       # Main builder component with enhanced UI/UX
├── types.ts          # TypeScript types for the builder
```

### State Management
- Board state: 4x7 grid for champions
- Bench state: 9 slots for spare champions
- Set selection: Filter champions and traits by TFT set
- Trait calculation: Dynamically calculates active traits based on placed champions

## CI/CD Pipeline

The project uses Jenkins for continuous integration and deployment with the following stages:

1. **Checkout**: Pulls source code from repository
2. **Build Backend**: Builds the Rust backend Docker image
3. **Build Frontend**: Builds the React frontend Docker image
4. **Run Tests**: Runs both backend and frontend tests in parallel
5. **Security Scan**: Scans Docker images for vulnerabilities
6. **Build and Push Images**: Builds final images and pushes to Docker registry (main branch only)
7. **Deploy to Dev**: Deploys to development environment (main branch only)
8. **Deploy to Production**: Manual approval gate for production deployment (main branch only)

### Files
- `Jenkinsfile`: Pipeline definition
- `jenkins/`: CI/CD configuration files
- `jenkins/docker-compose-cicd.yml`: Jenkins and registry setup

## Deployment

### Environment Variables

#### Backend
```bash
# Database
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tft_bible_dev

# Server
PORT=8080

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# Riot API
RIOT_API_KEY=your-riot-api-key
```

#### Frontend
```bash
VITE_API_URL=http://localhost:8080
```

### Docker Compose
The application is fully containerized with Docker Compose for easy deployment:

- Backend service with Rust application
- Frontend service with React application
- MongoDB for data storage
- Kafka with Zookeeper for message queuing
- All services configured to work together

## Testing

### Backend Tests
- Unit tests for service layer
- Integration tests for API endpoints
- Mock services for external dependencies
- Run with: `cargo test`

### Frontend Tests
- Component tests with React Testing Library
- API integration tests
- Run with: `npm test`

## Future Enhancements

1. **Auth System**: User authentication and authorization
2. **Admin Panel**: Content management for compositions, champions, and traits
3. **Advanced Search**: More sophisticated search capabilities
4. **User Profiles**: Personalized experience with saved compositions
5. **Match Analysis**: Integration with live match data
6. **Mobile Optimization**: Enhanced mobile experience
7. **Real-time Updates**: WebSocket support for live updates
8. **Analytics Dashboard**: Usage statistics and insights
9. **Content Moderation**: Community management tools
10. **Set Migration Tools**: Automated data updates for new sets

## Release Schedule

The application is designed to support the upcoming Lore & Legends (Set 16) release on December 3rd, 2025. The architecture allows for easy migration to new sets through:

1. Set-specific data models
2. Flexible champion/trait/item schemas
3. Automated data seeding process
4. Set filtering in the API and UI

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.