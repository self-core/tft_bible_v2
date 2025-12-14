# ETCD Service Discovery Implementation Guide

## Overview
This document provides a comprehensive guide to the ETCD-based service discovery implementation within the TFT Bible v2 microservices architecture.

## Current State
- ETCD service has been implemented and integrated into the Docker infrastructure
- Services can register and discover each other through ETCD
- ETCD provides distributed key-value storage for service endpoints
- Provides high availability and consistency for service discovery

## Architecture Components

### 1. ETCD Server
- Container: `etcd-server` 
- Image: `gcr.io/etcd-development/etcd:v3.5.15`
- Ports: 2379 (client), 2380 (peer)
- Uses persistent volumes for data storage

### 2. ETCD Service (Rust Implementation)
- Handles service registration and discovery
- Provides API endpoints for other services to interact with ETCD
- Handles health checks and lease management

### 3. Service Registration Process
- Each microservice registers itself with ETCD at startup
- Service information includes name, host, port, health status
- Uses TTL leases to ensure service registry stays current
- Automatic deregistration when services go down

## Key Features

### 1. Distributed Consistency
- ETCD uses Raft consensus algorithm for strong consistency
- Multiple nodes can be added for high availability
- Consistent service registry across all nodes

### 2. Watch Mechanism
- Services can watch for changes in service registry
- Automatic updates when services come online or go offline
- Real-time service discovery without polling

### 3. Lease Management
- TTL-based service registration
- Automatic cleanup of stale service entries
- Heartbeat mechanism to maintain service health status

## API Endpoints

### Registration
- `POST /register` - Register a service instance with ETCD
- Request body: `{ "service": { ... } }`

### Discovery
- `GET /discover/:service_name` - Find all instances of a service

### Deregistration
- `POST /deregister/:service_id` - Remove a service from the registry

## Integration with Existing Services

### Environment Variables
- `ETCD_ENDPOINTS` - Comma-separated list of ETCD endpoints
- `SERVICE_HOST` - The service's Docker container name
- `GATEWAY_URL` - The API gateway endpoint

### Client Libraries
- Rust: `etcd-client = "0.14"`
- Uses async/await for efficient service discovery
- Built-in retry and connection management

## Security Considerations

### Network Security
- ETCD communication limited to internal Docker network
- No external access to ETCD endpoints
- All services run within the same isolated network

### Authentication
- ETCD authentication can be enabled in production
- TLS encryption for etcd communication (future enhancement)

## Migration Path

### From In-Memory Registry to ETCD
1. Deploy ETCD cluster
2. Update service configuration to use ETCD endpoints
3. Update service registration code to use ETCD
4. Test service discovery functionality
5. Gradually migrate services to ETCD-based discovery

## Performance Considerations

### Consistency vs Performance
- ETCD provides strong consistency which may have performance implications
- Read-heavy workloads benefit from ETCD's caching
- Write-heavy registration requires careful lease management

### Scaling ETCD
- Single node for development
- 3-5 nodes for production clusters
- Separate cluster from application services for performance

## Troubleshooting

### Common Issues
1. Service registration fails - Check ETCD endpoint connectivity
2. Service discovery returns no results - Verify service names match
3. Service goes stale - Check TTL lease and heartbeat configuration

### Debugging Commands
```bash
# Check ETCD status
docker exec etcd-server etcdctl endpoint status

# List registered services
docker exec etcd-server etcdctl get /services/ --prefix
```

## Future Enhancements

### 1. Advanced Health Checks
- HTTP health check endpoints for services
- Automatic deregistration of unhealthy services
- Custom health check logic per service

### 2. Load Balancing Integration
- Integration with gateway load balancing algorithms
- Weighted service selection based on health/capacity
- Circuit breaker integration

### 3. Monitoring and Metrics
- ETCD cluster health metrics
- Service registration/deregistration events
- Performance metrics for service discovery

## Deployment Checklist

- [ ] ETCD cluster deployed and healthy
- [ ] All services configured with correct ETCD endpoints
- [ ] Service registration code updated to use ETCD
- [ ] Service discovery code updated to use ETCD
- [ ] Tests passing for service registration and discovery
- [ ] Monitoring and alerting configured