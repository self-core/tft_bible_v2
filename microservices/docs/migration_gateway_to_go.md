# Migration Plan: Gateway Service from Rust to Go

## Overview
This document outlines the plan to migrate the current gateway service implemented in Rust to Go. This will address the ongoing issues with the Rust/Axum combination and provide better maintainability.

## Current State Analysis

### Challenges with Current Rust Implementation
- Complex async handling with Axum leading to hard-to-debug issues
- Pre-compile hooks causing CI/CD pipeline failures
- Difficulty managing async closures with circuit breaker patterns
- Limited ecosystem for service mesh features compared to Go solutions
- Higher complexity in handling service discovery with etcd

### Benefits of Go for Gateway Service
- Mature ecosystem for microservices (Gin, Echo, Go-kit)
- Better tooling for service discovery and load balancing
- Extensive etcd integration with client libraries
- Strong concurrency support (goroutines)
- Built-in HTTP server capabilities
- Better error handling patterns for service gateway responsibilities
- More predictable compilation behavior

## Migration Goals
- Replace Rust gateway with a Go-based API Gateway
- Maintain all current functionality (GraphQL, REST proxy, service discovery)
- Improve stability and maintainability
- Enhance performance for proxy operations
- Better integration with etcd for service discovery
- Simplify the CI/CD pipeline

## Architecture Overview

### Go Gateway Structure
```
gateway/
├── main.go
├── handlers/
│   ├── graphql.go
│   ├── proxy.go
│   └── health.go
├── discovery/
│   └── etcd.go
├── middleware/
│   ├── logger.go
│   ├── cors.go
│   └── circuitbreaker.go
├── config/
│   └── config.go
└── utils/
    └── helpers.go
```

## Implementation Plan

### Phase 1: Setup and Basic Structure
1. Create new Go module for gateway
2. Set up the basic HTTP server structure
3. Implement configuration loading
4. Add etcd client setup

```go
// main.go basic structure
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    
    "github.com/gin-gonic/gin"
    "go.etcd.io/etcd/client/v3"
)

func main() {
    // Load configuration
    config := loadConfig()
    
    // Setup etcd client
    etcdClient, err := clientv3.New(clientv3.Config{
        Endpoints: []string{config.EtcdEndpoint},
    })
    if err != nil {
        log.Fatal("Failed to connect to etcd:", err)
    }
    defer etcdClient.Close()
    
    // Setup router
    r := gin.Default()
    
    // Setup middleware
    r.Use(loggerMiddleware())
    r.Use(corsMiddleware())
    
    // Register routes
    registerRoutes(r, etcdClient, config)
    
    // Setup graceful shutdown
    server := &http.Server{
        Addr:    ":" + config.Port,
        Handler: r,
    }
    
    go func() {
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed to start: %v", err)
        }
    }()
    
    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := server.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

### Phase 2: Service Discovery Integration
1. Implement etcd-based service registration
2. Add service lookup functionality
3. Create service health checking mechanism

```go
// discovery/etcd.go
package discovery

import (
    "context"
    "encoding/json"
    "time"
    
    "go.etcd.io/etcd/client/v3"
)

type ServiceInstance struct {
    ID      string    `json:"id"`
    Name    string    `json:"name"`
    Host    string    `json:"host"`
    Port    int       `json:"port"`
    Health  string    `json:"health"`
    Updated time.Time `json:"updated"`
}

type ServiceDiscovery struct {
    client *clientv3.Client
    ttl    int64
}

func NewServiceDiscovery(cli *clientv3.Client, ttl int64) *ServiceDiscovery {
    return &ServiceDiscovery{
        client: cli,
        ttl:    ttl,
    }
}

func (sd *ServiceDiscovery) RegisterService(instance ServiceInstance) error {
    key := fmt.Sprintf("/services/%s/%s", instance.Name, instance.ID)
    value, err := json.Marshal(instance)
    if err != nil {
        return err
    }
    
    lease, err := sd.client.Grant(context.Background(), sd.ttl)
    if err != nil {
        return err
    }
    
    _, err = sd.client.Put(context.Background(), key, string(value), clientv3.WithLease(lease.ID))
    if err != nil {
        return err
    }
    
    return nil
}

func (sd *ServiceDiscovery) DiscoverService(name string) ([]ServiceInstance, error) {
    key := fmt.Sprintf("/services/%s/", name)
    resp, err := sd.client.Get(context.Background(), key, clientv3.WithPrefix())
    if err != nil {
        return nil, err
    }
    
    var instances []ServiceInstance
    for _, kv := range resp.Kvs {
        var instance ServiceInstance
        if err := json.Unmarshal(kv.Value, &instance); err != nil {
            continue // Skip malformed entries
        }
        instances = append(instances, instance)
    }
    
    return instances, nil
}
```

### Phase 3: Proxy Implementation
1. Implement the HTTP proxy functionality
2. Add circuit breaker pattern
3. Create routing based on service discovery

```go
// handlers/proxy.go
package handlers

import (
    "fmt"
    "io"
    "net/http"
    "strings"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/sony/gobreaker"
)

func (h *Handler) ProxyHandler(c *gin.Context) {
    path := c.Request.URL.Path
    
    // Determine service based on path
    serviceName := determineService(path)
    
    // Discover service instances
    instances, err := h.discovery.DiscoverService(serviceName)
    if err != nil || len(instances) == 0 {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Service not available"})
        return
    }
    
    // Select instance (simple round-robin)
    instance := instances[0] // For simplicity, pick first available
    
    // Create target URL
    targetURL := fmt.Sprintf("http://%s:%d%s", instance.Host, instance.Port, path)
    
    // Perform request with circuit breaker
    breaker := h.getCircuitBreaker(serviceName)
    
    result, err := breaker.Execute(func() (interface{}, error) {
        return h.makeProxyRequest(targetURL, c.Request)
    })
    
    if err != nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
        return
    }
    
    response := result.(*http.Response)
    
    // Copy response headers
    for key, values := range response.Header {
        for _, value := range values {
            c.Header(key, value)
        }
    }
    
    c.Status(response.StatusCode)
    
    // Copy response body
    body, _ := io.ReadAll(response.Body)
    c.Writer.Write(body)
}

func determineService(path string) string {
    switch {
    case strings.HasPrefix(path, "/api/champions"):
        return "champion-service"
    case strings.HasPrefix(path, "/api/traits"):
        return "trait-service"
    case strings.HasPrefix(path, "/api/compositions"):
        return "composition-service"
    case strings.HasPrefix(path, "/api/trait-tracker"):
        return "trait-tracker-service"
    default:
        return "unknown-service"
    }
}
```

### Phase 4: GraphQL Endpoint
1. Implement GraphQL endpoint using a Go GraphQL library (e.g., gqlgen)
2. Integrate with underlying services via service discovery

### Phase 5: Testing and Validation
1. Unit tests for all components
2. Integration tests with etcd
3. Load testing to verify performance
4. Comparison with current Rust implementation

## Migration Strategy

### Option 1: Parallel Deployment
1. Deploy Go gateway alongside Rust gateway
2. Gradually shift traffic to Go gateway
3. Verify functionality and performance
4. Decommission Rust gateway

### Option 2: Direct Replacement
1. Prepare Go gateway implementation
2. Stop Rust gateway
3. Deploy Go gateway
4. Verify all functionality

Recommended: Option 1 for safer migration.

## Dependencies
- gin framework for routing
- etcd client v3 for service discovery
- gobreaker for circuit breaker pattern
- gqlgen for GraphQL (if needed)
- zap or logrus for logging
- viper for configuration

## Timeline
- Week 1: Setup Go environment and basic structure
- Week 2: Implement service discovery integration
- Week 3: Develop proxy functionality
- Week 4: Add GraphQL and remaining features
- Week 5: Testing and validation
- Week 6: Parallel deployment preparation

## Risk Mitigation
- Maintain both versions during transition
- Thorough testing before production deployment
- Rollback plan if issues arise
- Comprehensive logging and monitoring
- Performance benchmarks comparison

## Success Metrics
- Zero downtime during migration
- Equal or improved performance characteristics
- Maintained functionality
- Simplified build and deployment process
- Better maintainability