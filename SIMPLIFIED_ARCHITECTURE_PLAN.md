# Simplified Architecture Plan - TFT Bible

## Overview
Moving from a complex microservices architecture to a simplified single backend architecture for easier deployment and maintenance.

## Current Architecture Problems
- Too many moving parts (Rust services, Go gateway, etcd, MongoDB cluster)
- Complex Docker Compose setup with multiple dependencies
- Difficult to deploy to platforms like Vercel or Railway
- High resource usage
- Complex debugging and maintenance

## New Architecture Design

### Backend (Single Service)
- **Technology**: Node.js with TypeScript
- **Framework**: Apollo Server with Express
- **Database**: Single MongoDB connection or in-memory data for MVP
- **GraphQL Schema**: Unified schema covering all TFT data
- **Deployment**: Optimized for Vercel Serverless Functions or Railway

### Frontend
- **Current React frontend remains unchanged**
- Minor updates to connect to single backend endpoint
- Maintains existing component structure and functionality

### Data Model
- Champion data: name, cost, traits, image_url, abilities
- Trait data: name, description, image_url, active_units
- Item data: name, components, effects, image_url
- Composition data: champion_list, trait_list, title, description

### API Design
- Single GraphQL endpoint at `/api/graphql`
- Queries for all data types: champions, traits, items, compositions
- Subscriptions for real-time updates (optional)
- REST fallback endpoints if needed for Vercel compatibility

### Deployment Strategy
- **Vercel Option**: Serverless functions for GraphQL API
- **Railway Option**: Single container with Node.js app
- Environment variables for database connection
- Static hosting for frontend assets

## Implementation Steps

### Phase 1: Backend Setup
1. Create new Node.js project with Apollo Server
2. Define GraphQL schema
3. Implement resolvers with mock data initially
4. Add MongoDB connection if needed

### Phase 2: Data Migration
1. Extract data from current microservices format
2. Transform to simplified structure
3. Load data into new backend
4. Implement data seeding mechanism

### Phase 3: Frontend Integration
1. Update GraphQL endpoint URL
2. Test all frontend functionality with new backend
3. Adjust any queries that don't match new schema

### Phase 4: Deployment
1. Configure for Vercel or Railway
2. Set up CI/CD pipeline
3. Deploy and test live application

## Advantages of New Architecture
- Simpler development and debugging
- Easier deployment to cloud platforms
- Lower infrastructure costs
- Reduced complexity for maintenance
- Faster iteration cycles
- Better suited for Vercel/Railway deployment