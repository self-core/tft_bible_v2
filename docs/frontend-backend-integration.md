# Frontend-Backend Integration via GraphQL Gateway

This document provides a comprehensive overview of how the frontend connects to backend services through the GraphQL API gateway.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  Gateway API     │───▶│ Champion Service│
│   (React)       │    │    (Go)          │    │   (Rust)        │
└─────────────────┘    ├──────────────────┤    ├─────────────────┤
                       │ Trait Service    │───▶│ Trait Service   │
                       │    (Rust)        │    │   (Rust)        │
                       ├──────────────────┤    ├─────────────────┤
                       │ Composition      │───▶│ Composition     │
                       │    Service       │    │   Service       │
                       │    (Rust)        │    │   (Rust)        │
                       └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Service Dis.    │
                       │    (etcd)        │
                       └──────────────────┘
```

## Gateway Configuration

### Service Discovery
- The gateway uses etcd for service discovery
- Backend services register themselves with etcd upon startup
- The gateway queries etcd to discover available services
- Health checks are performed periodically to ensure service availability

### GraphQL Endpoint
- **Production**: `/graphql` (proxied through nginx)
- **Development**: `http://localhost:8080/graphql`
- **Vite Proxy**: All `/graphql` requests during development are proxied to the gateway

## Frontend Implementation

### GraphQL Client Setup
```typescript
// Apollo Client configuration
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const getGraphqlUrl = () => {
  const envUrl = import.meta.env.VITE_GRAPHQL_URL;
  if (envUrl) {
    return envUrl;
  }

  // Default to relative URL for Docker deployment
  return '/graphql';
};

const httpLink = createHttpLink({
  uri: getGraphqlUrl(),
});

// Auth link for adding headers if needed
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Environment Configuration
The frontend uses environment variables to configure the GraphQL endpoint:

- `VITE_GRAPHQL_URL`: The GraphQL endpoint URL (defaults to `/graphql`)
- `VITE_API_BASE_URL`: The backend API base URL (for direct API calls if needed)

During development, the Vite proxy handles forwarding to the gateway (see `vite.config.ts`).

### Query Examples

#### Getting Champions
```graphql
query GetChampions($limit: Int) {
  champions(limit: $limit) {
    id
    name
    displayName
    cost
    traits
    stats {
      health
      attackDamage
    }
    ability {
      name
      description
    }
    imageUrl
    iconUrl
  }
}
```

#### Getting Compositions
```graphql
query GetCompositions($limit: Int, $offset: Int) {
  compositions(limit: $limit, offset: $offset) {
    id
    name
    description
    category
    champions {
      id
      name
      starLevel
      position {
        x
        y
      }
      items
      isCore
      priority
      cost
      traits
      health
      attackDamage
      abilityName
      iconUrl
    }
    augments {
      preferred
      acceptable
      deprecated
    }
    meta {
      tier
      difficulty
      cost
      patch
      playstyle
      winrate
      avgPlacement
      playrate
      contestRate
    }
    votes {
      upvotes
      downvotes
    }
    views
    favorites
    comments
    isPublic
    isVerified
    isFeatured
    createdAt
    updatedAt
    builderCode
  }
}
```

## Gateway Implementation

### Request Routing
The gateway determines which backend service should handle a GraphQL query using pattern matching:

- `champion` queries → champion-service
- `trait` queries → trait-service
- `composition` queries → composition-service
- `tracker` queries → trait-tracker-service

### Circuit Breaker Pattern
The gateway implements circuit breakers using the `gobreaker` library to handle service failures gracefully:

- Opens after 3 consecutive failures
- Waits 60 seconds before attempting to close again
- Logs health status changes to etcd

### Load Balancing
The gateway uses round-robin load balancing to distribute requests across multiple instances of the same service.

## Testing the Integration

### Development Environment
1. Ensure all services are running (`docker-compose up` or individual services)
2. Access the frontend at `http://localhost:3000`
3. Verify API calls work by checking the browser's Network tab
4. The gateway endpoint should be accessible at `http://localhost:8080/graphql`

### Production Environment
1. Frontend assets are served by nginx
2. All API requests are proxied through nginx to the gateway
3. The gateway routes requests to appropriate backend services
4. Service discovery ensures requests go to healthy instances

## Error Handling

### Frontend Error Handling
- GraphQL requests include error policy set to 'all' to receive partial data
- All errors are formatted with message, code, and details
- Warnings are logged for GraphQL field errors, but data is still returned when possible

### Gateway Error Handling
- Circuit breakers prevent cascading failures
- Service health is monitored and updated in etcd
- Failed requests are logged with metrics collected

## Troubleshooting

### Common Issues

1. **Service Not Registered**: Check that the service is properly registering with etcd
2. **Connection Refused**: Verify that the target service is running and accessible
3. **Circuit Breaker Open**: Wait for the breaker to reset or check the target service health
4. **GraphQL Schema Mismatch**: Ensure the frontend queries match the service schemas

### Debugging Steps

1. Check service registration: `curl http://localhost:8080/detailed-health`
2. Verify service discovery: `curl http://localhost:8080/discover/champion-service`
3. Test direct service access (e.g., `curl http://localhost:8000/health`)
4. Check the service discovery portal: `http://localhost:8080/discovery-portal`

## Environment Variables

### Frontend (.env)
- `VITE_GRAPHQL_URL`: GraphQL endpoint (default: `/graphql`)
- `VITE_API_BASE_URL`: Base API URL (default: `http://localhost:8080`)

### Gateway
- `PORT`: Port to run the gateway (default: 8080)
- `ETCD_ENDPOINT`: etcd connection string (default: `etcd:2379`)
- `SERVICE_TTL`: Service TTL in etcd (default: 60 seconds)

## Performance Considerations

- The gateway caches service discovery lookups
- Circuit breakers prevent overwhelming failing services
- Load balancing distributes requests across multiple instances
- Response caching can be implemented at the gateway level if needed