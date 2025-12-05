# Service Discovery with etcd Implementation Plan

## Overview
This document outlines the plan to implement etcd as the service discovery mechanism for our microservices architecture, replacing the current manual service registration system.

## Current State
Currently, our microservices use static service names in configuration files and nginx configurations. This approach has several limitations:
- Services must be known at build/deployment time
- No automatic service health detection
- Manual configuration updates required when services change
- Difficult to scale services dynamically

## Goals
- Implement dynamic service discovery using etcd
- Enable automatic service registration and deregistration
- Support service health checks and monitoring
- Improve fault tolerance and reliability
- Enable dynamic scaling of services

## Solution Architecture

### 1. etcd Cluster Setup
- Deploy etcd as a cluster within our Docker network
- Configure persistent storage for service registry data
- Set up TLS encryption for security

### 2. Service Registration
- Each service registers itself with etcd at startup
- Registration includes:
  - Service name
  - Service host:port
  - Health check endpoint
  - Metadata (version, environment, etc.)

### 3. Service Discovery
- Services query etcd to discover other services
- Load balancing across multiple instances of the same service
- Failover capabilities when services become unavailable

### 4. Health Monitoring
- Implement TTL-based heartbeats for active services
- Automatic deregistration of unhealthy services
- Integration with circuit breaker patterns

## Implementation Steps

### Phase 1: Infrastructure Setup
1. Add etcd service to `docker-compose.yml`
2. Configure etcd cluster with persistence
3. Set up network connectivity between services

```yaml
etcd:
  image: gcr.io/etcd-development/etcd:v3.5.15
  container_name: etcd-server
  command: >
    /usr/local/bin/etcd
    --name etcd-server
    --data-dir /etcd-data
    --advertise-client-urls http://0.0.0.0:2379
    --listen-client-urls http://0.0.0.0:2379
    --listen-peer-urls http://0.0.0.0:2380
    --initial-advertise-peer-urls http://etcd-server:2380
    --initial-cluster-token etcd-cluster-1
    --initial-cluster etcd-server=http://etcd-server:2380
    --initial-cluster-state new
  ports:
    - "2379:2379"
    - "2380:2380"
  volumes:
    - etcd-data:/etcd-data
  networks:
    - tft-network
```

### Phase 2: Service Registration Module
1. Create a shared `discovery` module with etcd client
2. Implement service registration functions
3. Add graceful shutdown with service deregistration

### Phase 3: Service Discovery Integration
1. Modify gateway to use etcd for service discovery
2. Update all microservices to register with etcd
3. Implement service resolver functions

### Phase 4: Health Monitoring
1. Implement heartbeat mechanism with TTL
2. Create health check endpoints in each service
3. Set up monitoring for service failures

## Service Registration Interface
Each service should implement the following interface:

```rust
// In Rust
pub async fn register_service(name: &str, host: &str, port: u16) -> Result<String, Box<dyn std::error::Error>>;
pub async fn deregister_service(id: &str) -> Result<(), Box<dyn std::error::Error>>;
pub async fn discover_service(name: &str) -> Result<Vec<ServiceInstance>, Box<dyn std::error::Error>>;
```

## Service Discovery Integration
The gateway will use the discovery mechanism to route requests to appropriate services based on the path:

```rust
// In gateway/src/main.rs
async fn proxy_passthrough(
    Extension(service_finder): Extension<Arc<ServiceFinder>>,
    method: Method,
    uri: Uri,  
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response, StatusCode> {
    let path = uri.path();
    
    // Determine which service to route to based on path
    let service_name = match path {
        p if p.starts_with("/api/champions") => "champion-service",
        p if p.starts_with("/api/traits") => "trait-service", 
        p if p.starts_with("/api/compositions") => "composition-service",
        p if p.starts_with("/api/trait-tracker") => "trait-tracker-service",
        _ => return Err(StatusCode::NOT_FOUND),
    };
    
    // Discover the service endpoint
    let service_instances = service_finder.discover_service(service_name).await
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;
    
    if service_instances.is_empty() {
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }
    
    // Select an instance (simple round-robin or random selection)
    let selected_service = &service_instances[0];
    let target_url = format!("http://{}:{}{}", selected_service.host, selected_service.port, path);
    
    // Make the actual request to the target service
    // ... implementation details
}
```

## Benefits
- Dynamic service discovery without manual configuration
- Improved scalability and fault tolerance
- Better service health monitoring
- Easier service deployment and maintenance
- Automatic load balancing

## Security Considerations
- Enable TLS encryption for etcd communication
- Use authentication for etcd access
- Secure etcd endpoints within internal network only
- Regular backup of etcd data

## Testing Strategy
- Unit tests for service registration/deregistration
- Integration tests with actual etcd cluster
- Chaos engineering to test resilience
- Load testing to validate scalability

## Rollout Plan
1. Stage 1: Deploy etcd in development environment
2. Stage 2: Integrate discovery in a single service (e.g., champion-service)
3. Stage 3: Gradually migrate all services
4. Stage 4: Remove legacy service discovery mechanisms
5. Stage 5: Monitor performance and stability

## Timeline
- Week 1-2: Setup etcd infrastructure and basic discovery module
- Week 3-4: Integrate with gateway and one microservice
- Week 5-6: Full rollout to all services
- Week 7: Monitoring and optimization