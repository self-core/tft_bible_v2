# TFT Bible - Microservices Architecture

## Overview

The TFT Bible project has been refactored from a monolithic architecture to a microservices architecture to improve scalability, maintainability, and development velocity. This document describes the current microservices architecture and how to work with it.

## Architecture Overview

The system is composed of the following services:

### Core Services
- **Gateway Service**: API gateway that routes requests to appropriate services and handles cross-cutting concerns like authentication, rate limiting, and logging
- **Champion Service**: Manages champion data, statistics, and abilities
- **Trait Service**: Handles trait information and breakpoints
- **Composition Service**: Manages team compositions and user-generated content
- **Trait Tracker Service**: Provides optimal trait pathfinding and recommendations

### Shared Components
- **Common Module**: Shared utilities including circuit breakers, service discovery, and Trello integration
- **Data Models**: Shared data structures across services

## Service Communication

Services communicate via:
1. **REST APIs** - For synchronous communication between services
2. **Service Discovery** - Using a centralized registry for service location
3. **Circuit Breaker Pattern** - For resilience against service failures
4. **Trello Integration** - For project management and task tracking

## Running the System

### Prerequisites
- Docker and Docker Compose
- Rust toolchain
- MongoDB (or Docker for MongoDB)

### Environment Variables
Create a `.env` file in the microservices directory with the following variables:

```bash
# Database configuration
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=tft_bible_dev

# API Configuration
PORT=8080
GATEWAY_PORT=8080

# Trello Integration
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token

# JWT Configuration
JWT_SECRET=your_jwt_secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Running with Docker Compose

```bash
# Navigate to the microservices directory
cd microservices

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### Individual Services

You can also run services individually:

```bash
# Run a specific service
cd champion-service
cargo run

# Build and run in release mode
cargo run --release
```

## API Endpoints

All requests should go through the API Gateway running on port 8080:

- `GET /api/health` - System health check
- `GET /api/v1/champions` - Get all champions
- `GET /api/v1/champions/{id}` - Get champion by ID
- `GET /api/v1/traits` - Get all traits
- `POST /api/v1/compositions` - Create a new composition
- `GET /api/v1/compositions` - Get all compositions
- `POST /api/v1/trait-tracker` - Get optimal trait path
- `POST /api/v1/trello/board` - Create Trello board for project management

## Service Architecture Details

### Gateway Service
The gateway service handles:
- Request routing to appropriate microservices
- Authentication and authorization
- Rate limiting
- Request/response logging
- Circuit breaker implementation
- Cross-origin resource sharing (CORS)

### Champion Service
Manages:
- Champion information (name, cost, traits, stats, abilities)
- Champion search and filtering
- Champion data retrieval

### Trait Service
Handles:
- Trait information and breakpoints
- Trait relationships with champions
- Trait combination algorithms

### Composition Service
Manages:
- Team compositions
- User-generated compositions
- Composition sharing and voting
- Composition import/export

### Trait Tracker Service
Provides:
- Optimal trait pathfinding
- Trait requirement calculations
- Champion recommendations based on traits

## Development Guidelines

### Adding New Services
1. Create a new directory in the microservices folder
2. Follow the same structure as other services
3. Add the service to the workspace in the root Cargo.toml
4. Add the service to docker-compose.yml
5. Register the service with the service discovery mechanism

### Code Standards
- Follow Rust naming conventions
- Use meaningful error messages
- Implement proper logging
- Add unit and integration tests
- Use async/await for I/O operations

### Testing
- Unit tests for business logic
- Integration tests for service endpoints
- E2E tests for complete flows across services
- Mock external dependencies where appropriate

## Monitoring and Logging

Each service implements structured logging using the `tracing` crate. Logs are formatted consistently across services to enable easy correlation and debugging.

## Future Improvements

- Implement distributed tracing
- Add metrics collection with Prometheus
- Enhance circuit breaker with more sophisticated algorithms
- Add caching layer for improved performance
- Implement gRPC for service-to-service communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Add tests for your changes
5. Submit a pull request with a descriptive title and detailed description

## Troubleshooting

### Common Issues
- **Service Discovery**: Ensure all services are properly registered and health-check endpoints are accessible
- **Database Connections**: Verify MongoDB is running and connection strings are correct
- **CORS**: Check if CORS settings allow requests from your frontend origin

### Service Health Checks
Each service exposes a `/health` endpoint that can be used to verify its status.

### Circuit Breaker States
Monitor circuit breaker states to identify failing services that may need attention.