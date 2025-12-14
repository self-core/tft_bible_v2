# TFT Bible v2 Microservices Architecture Documentation

## Overview
TFT Bible v2 is a comprehensive Teamfight Tactics companion application built with Rust and modern web technologies using a microservices architecture pattern.

## Architecture Pattern
- **API Gateway Pattern**: Centralized routing and cross-cutting concerns
- **Service Discovery**: Dynamic service registration and discovery using ETCD
- **Event-Driven Communication**: Asynchronous communication between services
- **Database Per Service**: Each service maintains its own database

## Core Services

### 1. API Gateway
- Centralized routing for all client requests
- Cross-cutting concerns like authentication, logging, rate limiting
- Service discovery and load balancing
- Circuit breaker pattern for resilience

### 2. Champion Service
- Manages champion data, stats, abilities
- Provides champion search and filtering
- Trait information for each champion
- REST API endpoints for champion operations

### 3. Trait Service  
- Manages trait definitions and breakpoints
- Trait type classification (Origin, Class, Unique)
- Trait search and filtering capabilities
- Trait composition information

### 4. Composition Service
- Manages TFT compositions and strategies
- Composition voting and rating system
- Augment recommendations
- Positioning and gameplan strategies

### 5. Trait Tracker Service
- Provides trait optimization algorithms
- Real-time trait tracking during games
- Champion trait recommendations
- Meta game analysis

## Infrastructure Components

### 1. ETCD Service Discovery
- Distributed key-value store for service discovery
- High availability and consistency
- Automatic service registration and deregistration
- Health checking and monitoring

### 2. Database Layer
- MongoDB for primary data storage
- Redis for caching and session storage
- Circuit breaker state management

### 3. Message Queue
- Kafka for asynchronous communication
- Event streaming between services
- Decoupled service communication

## Communication Patterns

### 1. Synchronous Communication
- HTTP/REST for direct service-to-service calls
- API Gateway routes to appropriate services
- Request/response pattern

### 2. Asynchronous Communication
- Kafka for event-driven communication
- Event sourcing for state changes
- Decoupled microservices interactions

## Security Model

### 1. Service-to-Service Security
- Internal network isolation
- Service mesh (planned future enhancement)
- Mutual TLS (planned future enhancement)

### 2. API Gateway Security
- JWT-based authentication
- Rate limiting and throttling
- API key management

## Resilience Patterns

### 1. Circuit Breaker
- Prevents cascade failures
- Automatic recovery mechanisms
- Fallback service implementations

### 2. Retry Logic
- Exponential backoff for failed requests
- Idempotent operations where possible
- Timeout management

### 3. Bulkhead Isolation
- Resource isolation between services
- Prevents resource exhaustion
- Independent failure domains

## Deployment Strategy

### 1. Container Orchestration
- Docker containers for all services
- Docker Compose for local development
- Kubernetes for production (planned)

### 2. Service Discovery Integration
- ETCD-based service registration
- Dynamic service discovery
- Load balancing across service instances

## Monitoring and Observability

### 1. Logging
- Structured logging with tracing IDs
- Centralized log aggregation
- Distributed tracing

### 2. Metrics
- Service health metrics
- Performance indicators
- Business metrics collection

### 3. Health Checks
- Service-specific health endpoints
- Dependency health checks
- Automated alerting

## Development Guidelines

### 1. Service Boundaries
- Single responsibility per service
- Domain-driven design principles
- Clear API contracts

### 2. Data Management
- Database per service pattern
- Event sourcing for audit trails
- Data consistency boundaries

## Technology Stack

### Backend Services
- **Language**: Rust
- **Web Framework**: Axum 
- **Database**: MongoDB
- **Message Queue**: Kafka
- **Service Discovery**: ETCD

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Caching**: Redis
- **Service Discovery**: ETCD

## Future Enhancements

### 1. Scaling Improvements
- Horizontal pod autoscaling
- Database sharding
- CDN for static assets

### 2. Advanced Service Mesh
- Service mesh implementation
- Advanced traffic management
- Security enhancements

### 3. Analytics and ML
- Machine learning for trait recommendations
- Predictive analytics
- Advanced composition analysis

### 4. Gateway Enhancement Strategies
- Consider migration to Go-based gateway for better ecosystem integration
- Enhanced service discovery capabilities
- Improved performance characteristics

### 5. Infrastructure Improvements
- Separate docker-compose files for different service groups (infrastructure, backend, frontend)
- Faster development cycles with selective builds
- Better resource isolation