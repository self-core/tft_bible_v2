package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.etcd.io/etcd/client/v3"
	"gateway-api/config"
	"gateway-api/discovery"
	"gateway-api/utils"
	"github.com/sony/gobreaker"
)

// LoadBalancer interface for different load balancing strategies
type LoadBalancer interface {
	SelectInstance(instances []discovery.ServiceInstance) *discovery.ServiceInstance
}

// RoundRobinLoadBalancer implements round-robin load balancing
type RoundRobinLoadBalancer struct {
	nextIndex map[string]int
}

func NewRoundRobinLoadBalancer() *RoundRobinLoadBalancer {
	return &RoundRobinLoadBalancer{
		nextIndex: make(map[string]int),
	}
}

func (r *RoundRobinLoadBalancer) SelectInstance(instances []discovery.ServiceInstance) *discovery.ServiceInstance {
	if len(instances) == 0 {
		return nil
	}

	// Count healthy instances
	healthyInstances := []discovery.ServiceInstance{}
	for _, instance := range instances {
		if instance.Health == "Healthy" {
			healthyInstances = append(healthyInstances, instance)
		}
	}

	if len(healthyInstances) == 0 {
		// If no healthy instances, return the first one anyway
		return &instances[0]
	}

	// Use round-robin
	serviceKey := "default" // In a full implementation, we'd have a service-specific key
	index := r.nextIndex[serviceKey]
	if index >= len(healthyInstances) {
		index = 0
	}

	result := &healthyInstances[index]
	r.nextIndex[serviceKey] = (index + 1) % len(healthyInstances)

	return result
}

// Handler contains the dependencies for all handlers
type Handler struct {
	Discovery    *discovery.ServiceDiscovery
	Client       *clientv3.Client
	Config       *config.Config
	breakers     map[string]*gobreaker.CircuitBreaker
	loadBalancer LoadBalancer
	Metrics      *utils.MetricsCollector
}

// HealthHandler returns the health status of the gateway
func (h *Handler) HealthHandler(c *gin.Context) {
	// Perform basic health checks
	health := gin.H{
		"status":    "healthy",
		"service":   "gateway-api",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"checks": gin.H{
			"etcd_connection": h.checkEtcdHealth(),
		},
	}

	c.JSON(http.StatusOK, health)
}

// checkEtcdHealth performs a health check on the etcd connection
func (h *Handler) checkEtcdHealth() string {
	// Try to get a simple key from etcd to check connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.Client.Get(ctx, "health-check-key", clientv3.WithKeysOnly())
	if err != nil {
		log.Printf("Etcd health check failed: %v", err)
		return "unhealthy"
	}

	return "healthy"
}

// MetricsHandler provides metrics information about the gateway
func (h *Handler) MetricsHandler(c *gin.Context) {
	metrics := h.Metrics.GetMetrics()

	c.JSON(http.StatusOK, gin.H{
		"timestamp": time.Now().Format(time.RFC3339),
		"metrics":   metrics,
		"gateway_stats": gin.H{
			"total_circuit_breakers": len(h.breakers),
		},
	})
}

// DetailedHealthHandler provides detailed health information about the gateway and registered services
func (h *Handler) DetailedHealthHandler(c *gin.Context) {
	// Get all known services and their health status
	serviceNames := []string{"champion-service", "trait-service", "composition-service", "trait-tracker-service"}
	servicesHealth := make(map[string]interface{})

	for _, name := range serviceNames {
		instances, err := h.Discovery.DiscoverService(name)
		if err != nil {
			servicesHealth[name] = gin.H{
				"status": "error",
				"error":  err.Error(),
				"count":  0,
			}
		} else {
			healthyCount := 0
			for _, instance := range instances {
				if instance.Health == "Healthy" {
					healthyCount++
				}
			}

			status := "unhealthy"
			if len(instances) > 0 && healthyCount > 0 {
				status = "healthy"
			} else if len(instances) > 0 {
				status = "degraded"
			}

			servicesHealth[name] = gin.H{
				"status":       status,
				"total_count":  len(instances),
				"healthy_count": healthyCount,
				"instances":    instances,
			}
		}
	}

	healthInfo := gin.H{
		"status":    "healthy",
		"service":   "gateway-api",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "1.0.0",
		"etcd_status": h.checkEtcdHealth(),
		"registered_services": servicesHealth,
	}

	c.JSON(http.StatusOK, healthInfo)
}

// RegisterServiceHandler handles service registration requests
func (h *Handler) RegisterServiceHandler(c *gin.Context) {
	var rawPayload map[string]interface{}
	if err := c.ShouldBindJSON(&rawPayload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
		return
	}

	// Map the payload to our ServiceInstance struct
	var instance discovery.ServiceInstance

	// Extract fields from the payload
	if id, ok := rawPayload["id"]; ok {
		if idStr, ok := id.(string); ok {
			instance.ID = idStr
		}
	}
	if name, ok := rawPayload["name"]; ok {
		if nameStr, ok := name.(string); ok {
			instance.Name = nameStr
		}
	}
	if host, ok := rawPayload["host"]; ok {
		if hostStr, ok := host.(string); ok {
			instance.Host = hostStr
		}
	}
	if port, ok := rawPayload["port"]; ok {
		// Handle both string and numeric port values
		switch v := port.(type) {
		case string:
			instance.Port = v
		case float64:
			instance.Port = fmt.Sprintf("%.0f", v)
		case int:
			instance.Port = fmt.Sprintf("%d", v)
		default:
			instance.Port = "0"
		}
	}
	if health, ok := rawPayload["health"]; ok {
		if healthStr, ok := health.(string); ok {
			instance.Health = healthStr
		} else {
			instance.Health = "Healthy" // default value
		}
	}
	if meta, ok := rawPayload["metadata"]; ok {
		if metaMap, ok := meta.(map[string]interface{}); ok {
			instance.Meta = make(map[string]string)
			for k, v := range metaMap {
				if vStr, ok := v.(string); ok {
					instance.Meta[k] = vStr
				} else {
					instance.Meta[k] = fmt.Sprintf("%v", v)
				}
			}
		}
	} else if meta, ok := rawPayload["meta"]; ok {
		if metaMap, ok := meta.(map[string]interface{}); ok {
			instance.Meta = make(map[string]string)
			for k, v := range metaMap {
				if vStr, ok := v.(string); ok {
					instance.Meta[k] = vStr
				} else {
					instance.Meta[k] = fmt.Sprintf("%v", v)
				}
			}
		}
	}

	// Set the updated time
	instance.Updated = time.Now()

	// Verify required fields
	if instance.ID == "" || instance.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Service ID and Name are required fields",
		})
		return
	}

	// Register the service instance in etcd
	if err := h.Discovery.RegisterService(instance); err != nil {
		log.Printf("Failed to register service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Also register health check endpoint if provided
	if healthCheckURL, ok := rawPayload["healthCheckUrl"].(string); ok {
		go h.startHealthMonitoring(instance.Name, instance.ID, healthCheckURL)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Service registered successfully",
		"service":      instance.Name,
		"instanceId":   instance.ID,
		"registeredAt": instance.Updated.Format(time.RFC3339),
	})
}

// startHealthMonitoring starts monitoring a service's health
func (h *Handler) startHealthMonitoring(serviceName, instanceID, healthCheckURL string) {
	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			healthy := h.checkServiceHealth(healthCheckURL)
			if !healthy {
				log.Printf("Service %s (ID: %s) is unhealthy, updating status", serviceName, instanceID)

				// Update service health status in etcd
				h.updateServiceHealth(serviceName, instanceID, "Unhealthy")
			} else {
				// Update service health status in etcd
				h.updateServiceHealth(serviceName, instanceID, "Healthy")
			}
		}
	}
}

// checkServiceHealth performs a health check on a service
func (h *Handler) checkServiceHealth(healthCheckURL string) bool {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(healthCheckURL)
	if err != nil {
		log.Printf("Health check failed for %s: %v", healthCheckURL, err)
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 200 && resp.StatusCode < 300
}

// updateServiceHealth updates the health status of a service instance
func (h *Handler) updateServiceHealth(serviceName, instanceID, healthStatus string) {
	// Use the dedicated method in ServiceDiscovery
	if err := h.Discovery.UpdateServiceHealth(serviceName, instanceID, healthStatus); err != nil {
		log.Printf("Failed to update service health in etcd: %v", err)
	}
}

// DiscoverServiceHandler handles service discovery requests
func (h *Handler) DiscoverServiceHandler(c *gin.Context) {
	serviceName := c.Param("service_name")
	instances, err := h.Discovery.DiscoverService(serviceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Discovery request for service '%s': found %d instances", serviceName, len(instances))
	for i, instance := range instances {
		log.Printf("  Instance %d: ID=%s, Host=%s, Port=%s", i, instance.ID, instance.Host, instance.Port)
	}

	c.JSON(http.StatusOK, gin.H{
		"instances": instances,
	})
}

// BaseInfoHandler provides information about the gateway and available services
func (h *Handler) BaseInfoHandler(c *gin.Context) {
	// Get all known services by trying common service names
	serviceNames := []string{"champion-service", "trait-service", "composition-service", "trait-tracker-service"}
	servicesStatus := make(map[string]interface{})

	for _, name := range serviceNames {
		instances, err := h.Discovery.DiscoverService(name)
		if err != nil {
			servicesStatus[name] = gin.H{
				"status": "error",
				"error":  err.Error(),
				"count":  0,
			}
		} else {
			servicesStatus[name] = gin.H{
				"status":    "available",
				"count":     len(instances),
				"instances": instances,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"service":      "gateway-api",
		"status":       "running",
		"version":      "1.0.0",
		"uptime":       time.Now().Format(time.RFC3339),
		"endpoint_info": gin.H{
			"health":     "/health - Health check endpoint",
			"register":   "/register - Register services",
			"discover":   "/discover/{service_name} - Discover services",
			"graphql":    "/graphql - GraphQL endpoint (POST) and playground (GET)",
			"proxy":      "/api/*path - Proxy to registered services",
		},
		"registered_services": servicesStatus,
		"graphql_available":   true,
		"graphql_url":         "/graphql",
	})
}

// ProxyHandler handles proxying requests to backend services
func (h *Handler) ProxyHandler(c *gin.Context) {
	startTime := time.Now()
	path := c.Request.URL.Path

	// Determine service based on path
	serviceName := h.determineService(path)

	// Discover all service instances
	instances, err := h.Discovery.DiscoverService(serviceName)
	if err != nil || len(instances) == 0 {
		h.Metrics.RecordFailedRequest(serviceName)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "No service instances available"})
		return
	}

	// Use load balancer to select instance
	instance := h.loadBalancer.SelectInstance(instances)
	if instance == nil {
		h.Metrics.RecordFailedRequest(serviceName)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "No service instance available"})
		return
	}

	// Create target URL
	targetPath := h.extractServicePath(path, serviceName)
	targetURL := fmt.Sprintf("http://%s:%s%s", instance.Host, instance.Port, targetPath)

	// Perform request with circuit breaker
	breaker := h.getCircuitBreaker(serviceName)

	result, err := breaker.Execute(func() (interface{}, error) {
		return h.makeProxyRequest(targetURL, c.Request)
	})

	duration := time.Since(startTime)

	if err != nil {
		log.Printf("Proxy request failed: %v", err)
		h.Metrics.RecordFailedRequest(serviceName)

		// Update health status to unhealthy on failure
		if instance != nil {
			h.updateServiceHealth(serviceName, instance.ID, "Unhealthy")
		}
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}

	response := result.(*http.Response)
	defer response.Body.Close()

	// Update health status to healthy on success
	if instance != nil {
		h.updateServiceHealth(serviceName, instance.ID, "Healthy")
	}

	// Record successful request with metrics
	h.Metrics.RecordRequest(serviceName, duration)

	// Copy response headers
	for key, values := range response.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	c.Status(response.StatusCode)

	// Copy response body
	body, err := io.ReadAll(response.Body)
	if err != nil {
		log.Printf("Failed to read response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response body"})
		return
	}

	c.Writer.Write(body)
}

// determineService determines which service to route to based on the path
func (h *Handler) determineService(path string) string {
	switch {
	case strings.HasPrefix(path, "/api/champions"), strings.HasPrefix(path, "/api/v1/champions"):
		return "champion-service"
	case strings.HasPrefix(path, "/api/traits"), strings.HasPrefix(path, "/api/v1/traits"):
		return "trait-service"
	case strings.HasPrefix(path, "/api/compositions"), strings.HasPrefix(path, "/api/v1/compositions"):
		return "composition-service"
	case strings.HasPrefix(path, "/api/trait-tracker"), strings.HasPrefix(path, "/api/v1/trait-tracker"):
		return "trait-tracker-service"
	default:
		return "unknown-service"
	}
}

// extractServicePath extracts the actual service-specific path from the full path
func (h *Handler) extractServicePath(fullPath, serviceName string) string {
	// Handle both /api/ and /api/v1/ prefixes
	switch serviceName {
	case "champion-service":
		if strings.HasPrefix(fullPath, "/api/v1/champions") {
			return strings.TrimPrefix(fullPath, "/api/v1/champions")
		}
		return strings.TrimPrefix(fullPath, "/api/champions")
	case "trait-service":
		if strings.HasPrefix(fullPath, "/api/v1/traits") {
			return strings.TrimPrefix(fullPath, "/api/v1/traits")
		}
		return strings.TrimPrefix(fullPath, "/api/traits")
	case "composition-service":
		if strings.HasPrefix(fullPath, "/api/v1/compositions") {
			return strings.TrimPrefix(fullPath, "/api/v1/compositions")
		}
		return strings.TrimPrefix(fullPath, "/api/compositions")
	case "trait-tracker-service":
		if strings.HasPrefix(fullPath, "/api/v1/trait-tracker") {
			return strings.TrimPrefix(fullPath, "/api/v1/trait-tracker")
		}
		return strings.TrimPrefix(fullPath, "/api/trait-tracker")
	default:
		return fullPath
	}
}

// makeProxyRequest performs the actual HTTP request to the target service
func (h *Handler) makeProxyRequest(targetURL string, originalRequest *http.Request) (interface{}, error) {
	// Create a new request with the same method and body
	body, err := io.ReadAll(originalRequest.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read request body: %w", err)
	}

	req, err := http.NewRequest(originalRequest.Method, targetURL, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Copy headers
	for key, values := range originalRequest.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Make the request
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}

	return resp, nil
}

// getCircuitBreaker gets or creates a circuit breaker for a service
func (h *Handler) getCircuitBreaker(serviceName string) *gobreaker.CircuitBreaker {
	if h.breakers == nil {
		h.breakers = make(map[string]*gobreaker.CircuitBreaker)
	}

	if cb, exists := h.breakers[serviceName]; exists {
		return cb
	}

	// Create new circuit breaker
	settings := gobreaker.Settings{
		Name:        serviceName,
		MaxRequests: 3,
		Timeout:     60 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures > 3
		},
	}
	
	cb := gobreaker.NewCircuitBreaker(settings)
	h.breakers[serviceName] = cb
	
	return cb
}

// GraphQLHandler handles GraphQL requests by routing them to the appropriate backend service
func (h *Handler) GraphQLHandler(c *gin.Context) {
	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON request",
		})
		return
	}

	// Extract the query string
	queryStr, ok := requestData["query"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing or invalid query field",
		})
		return
	}

	// Determine which service should handle this query
	serviceName := h.determineGraphQLService(queryStr)

	// Get healthy service instance
	instance, err := h.Discovery.GetHealthyServiceInstance(serviceName)
	if err != nil || instance == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "No healthy service instances available",
			"name": serviceName,
		})
		return
	}

	// Create target URL to the backend service's GraphQL endpoint
	targetURL := fmt.Sprintf("http://%s:%s/graphql", instance.Host, instance.Port)

	// Forward the request to the backend service
	result, err := h.forwardGraphQLRequest(targetURL, c.Request)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Send response back to client
	c.Data(http.StatusOK, "application/json", result)
}

// determineGraphQLService determines which backend service should handle a GraphQL query
func (h *Handler) determineGraphQLService(query string) string {
	query = strings.ToLower()

	// Pattern matching for different services
	if strings.Contains(query, "champion") && !strings.Contains(query, "trait") && !strings.Contains(query, "composit") {
		return "champion-service"
	} else if strings.Contains(query, "trait") && !strings.Contains(query, "champion") && !strings.Contains(query, "composit") {
		return "trait-service"
	} else if strings.Contains(query, "composition") || strings.Contains(query, "board") || strings.Contains(query, "team") {
		return "composition-service"
	} else if strings.Contains(query, "tracker") || strings.Contains(query, "progression") {
		return "trait-tracker-service"
	}

	// Default to champion service if we can't determine
	return "champion-service"
}

// forwardGraphQLRequest forwards a GraphQL request to a backend service
func (h *Handler) forwardGraphQLRequest(targetURL string, originalRequest *http.Request) ([]byte, error) {
	// Create a new request with the same body and headers
	body, err := io.ReadAll(originalRequest.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read request body: %w", err)
	}

	req, err := http.NewRequest(originalRequest.Method, targetURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Copy headers
	for key, values := range originalRequest.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Perform the request to the backend
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to forward request to backend: %w", err)
	}
	defer resp.Body.Close()

	// Return response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return responseBody, nil
}

// DiscoveryPortalHandler serves the service discovery management portal
func (h *Handler) DiscoveryPortalHandler(c *gin.Context) {
	// Serve inline HTML for the service discovery portal
	portalHTML := `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFT Bible Service Discovery Management</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #4361ee;
            --secondary: #3f37c9;
            --success: #4cc9f0;
            --warning: #f72585;
            --danger: #e63946;
            --light: #f8f9fa;
            --dark: #212529;
        }

        body {
            background: linear-gradient(135deg, #f0f2f5, #d1d8e0);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .main-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            margin-top: 20px;
            margin-bottom: 20px;
            padding: 30px;
        }

        .card {
            border: none;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            overflow: hidden;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }

        .service-card {
            margin-bottom: 15px;
        }

        .service-status {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .status-healthy {
            background-color: #d4edda;
            color: #155724;
        }

        .status-unhealthy {
            background-color: #f8d7da;
            color: #721c24;
        }

        .status-degraded {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-unknown {
            background-color: #d1ecf1;
            color: #0c5460;
        }

        .metric-card {
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-radius: 15px;
        }

        .metric-value {
            font-size: 2.8rem;
            font-weight: bold;
            margin: 10px 0;
        }

        .metric-title {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .refresh-btn {
            background-color: var(--primary);
            border: none;
            color: white;
        }

        .refresh-btn:hover {
            background-color: var(--secondary);
        }

        .service-detail {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }

        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }

        .health-bar {
            height: 8px;
            background-color: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 15px 0;
        }

        .health-progress {
            height: 100%;
            background: linear-gradient(90deg, var(--success), #4361ee);
            transition: width 0.5s ease;
        }

        .nav-tabs .nav-link.active {
            background-color: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .nav-tabs .nav-link {
            color: var(--primary);
            font-weight: 500;
        }

        .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
        }

        .btn-primary:hover {
            background-color: var(--secondary);
            border-color: var(--secondary);
        }

        .service-info {
            margin-bottom: 5px;
        }

        .service-info strong {
            color: var(--primary);
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-network-wired me-2"></i>
                TFT Bible Service Discovery Portal
            </a>
            <div class="navbar-nav ms-auto">
                <span class="navbar-text">
                    <i class="fas fa-circle me-1 text-success"></i> System Healthy
                </span>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="main-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1><i class="fas fa-cloud me-3 text-primary"></i>Service Discovery Management</h1>
                <button id="refreshBtn" class="btn refresh-btn">
                    <i class="fas fa-sync-alt me-2"></i>Refresh
                </button>
            </div>

            <!-- Dashboard Metrics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value" id="totalServices">0</div>
                        <div class="metric-title">Total Services</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value" id="healthyServices">0</div>
                        <div class="metric-title">Healthy Services</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value" id="unhealthyServices">0</div>
                        <div class="metric-title">Unhealthy Services</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card metric-card">
                        <div class="metric-value" id="etcdStatus">N/A</div>
                        <div class="metric-title">ETCD Status</div>
                    </div>
                </div>
            </div>

            <!-- Tabs for different views -->
            <ul class="nav nav-tabs mb-4" id="managementTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="services-tab" data-bs-toggle="tab" data-bs-target="#services" type="button" role="tab">Services</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="discovery-tab" data-bs-toggle="tab" data-bs-target="#discovery" type="button" role="tab">Discovery</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="graphql-tab" data-bs-toggle="tab" data-bs-target="#graphql" type="button" role="tab">GraphQL</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="testing-tab" data-bs-toggle="tab" data-bs-target="#testing" type="button" role="tab">Testing</button>
                </li>
            </ul>

            <div class="tab-content" id="managementTabContent">
                <!-- Services Tab -->
                <div class="tab-pane fade show active" id="services" role="tabpanel">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-list me-2"></i>Registered Services</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row" id="servicesContainer">
                                        <!-- Services will be loaded here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Service Discovery Tab -->
                <div class="tab-pane fade" id="discovery" role="tabpanel">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-search me-2"></i>Discover Services</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="mb-3">
                                                <label class="form-label">Service Name</label>
                                                <input type="text" class="form-control" id="serviceNameInput" placeholder="Enter service name (e.g., champion-service)">
                                            </div>
                                            <button id="discoverBtn" class="btn btn-primary">
                                                <i class="fas fa-search me-2"></i>Discover Service
                                            </button>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="border p-3 rounded">
                                                <h6>Common Services:</h6>
                                                <ul class="list-unstyled">
                                                    <li><a href="#" class="service-link" data-service="champion-service">champion-service</a></li>
                                                    <li><a href="#" class="service-link" data-service="trait-service">trait-service</a></li>
                                                    <li><a href="#" class="service-link" data-service="composition-service">composition-service</a></li>
                                                    <li><a href="#" class="service-link" data-service="trait-tracker-service">trait-tracker-service</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="discoveryResult" class="mt-4">
                                        <!-- Discovery results will appear here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- GraphQL Tab -->
                <div class="tab-pane fade" id="graphql" role="tabpanel">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-code me-2"></i>GraphQL API Explorer</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <h6>GraphQL Query Editor</h6>
                                            <div class="mb-3">
                                                <textarea id="graphqlQuery" class="form-control" rows="8" placeholder="Enter your GraphQL query here...">query GetChampions {
  getChampions(limit: 10) {
    id
    name
    cost
    traits
    stats {
      health
      attackDamage
    }
  }
}</textarea>
                                            </div>
                                            <button id="executeQueryBtn" class="btn btn-success">
                                                <i class="fas fa-play me-2"></i>Execute Query
                                            </button>
                                        </div>
                                        <div class="col-md-4">
                                            <h6>Query Result</h6>
                                            <div id="graphqlResult" class="border p-3 rounded" style="height: 300px; overflow-y: auto;">
                                                <small class="text-muted">Results will appear here...</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-4">
                                        <h6>Example Queries</h6>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-outline-primary sample-query-btn" data-query='query { getChampions(limit: 5) { id, name, cost, traits } }'>
                                                Get Champions
                                            </button>
                                            <button class="btn btn-outline-primary sample-query-btn" data-query='query { getTraits { name, description } }'>
                                                Get Traits
                                            </button>
                                            <button class="btn btn-outline-primary sample-query-btn" data-query='query { getCompositions(limit: 3) { id, name, champions { champion { name, cost } } } }'>
                                                Get Compositions
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- API Testing Tab -->
                <div class="tab-pane fade" id="testing" role="tabpanel">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-vial me-2"></i>API Integration Tests</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6>Test Endpoints</h6>
                                            <div class="list-group">
                                                <button class="list-group-item list-group-item-action test-endpoint" data-path="/api/v1/champions" data-method="GET">
                                                    GET /api/v1/champions
                                                </button>
                                                <button class="list-group-item list-group-item-action test-endpoint" data-path="/api/v1/traits" data-method="GET">
                                                    GET /api/v1/traits
                                                </button>
                                                <button class="list-group-item list-group-item-action test-endpoint" data-path="/api/v1/compositions" data-method="GET">
                                                    GET /api/v1/compositions
                                                </button>
                                                <button class="list-group-item list-group-item-action test-endpoint" data-path="/health" data-method="GET">
                                                    GET /health
                                                </button>
                                                <button class="list-group-item list-group-item-action test-endpoint" data-path="/detailed-health" data-method="GET">
                                                    GET /detailed-health
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <h6>Test Results</h6>
                                            <div id="testResults" class="border p-3 rounded" style="height: 400px; overflow-y: auto;">
                                                <small class="text-muted">Test results will appear here...</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal for Service Details -->
    <div class="modal fade" id="serviceDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Service Instances</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="serviceDetailsContent">
                        <!-- Service details will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // API base URL
        const API_BASE = window.location.origin;

        // DOM Elements
        const totalServicesEl = document.getElementById('totalServices');
        const healthyServicesEl = document.getElementById('healthyServices');
        const unhealthyServicesEl = document.getElementById('unhealthyServices');
        const etcdStatusEl = document.getElementById('etcdStatus');
        const servicesContainer = document.getElementById('servicesContainer');
        const refreshBtn = document.getElementById('refreshBtn');
        const discoverBtn = document.getElementById('discoverBtn');
        const serviceNameInput = document.getElementById('serviceNameInput');
        const discoveryResult = document.getElementById('discoveryResult');
        const graphqlQuery = document.getElementById('graphqlQuery');
        const executeQueryBtn = document.getElementById('executeQueryBtn');
        const graphqlResult = document.getElementById('graphqlResult');
        const testResults = document.getElementById('testResults');

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
        });

        // Refresh button event
        refreshBtn.addEventListener('click', loadData);

        // Discovery button event
        discoverBtn.addEventListener('click', discoverService);

        // Sample service links
        document.querySelectorAll('.service-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                serviceNameInput.value = this.getAttribute('data-service');
                discoverService();
            });
        });

        // Sample query buttons
        document.querySelectorAll('.sample-query-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                graphqlQuery.value = this.getAttribute('data-query');
            });
        });

        // Execute GraphQL query
        executeQueryBtn.addEventListener('click', executeGraphQL);

        // Test endpoint buttons
        document.querySelectorAll('.test-endpoint').forEach(btn => {
            btn.addEventListener('click', function() {
                const path = this.getAttribute('data-path');
                const method = this.getAttribute('data-method');
                testEndpoint(path, method);
            });
        });

        // Load all data
        async function loadData() {
            try {
                // Load health data
                const response = await fetch(API_BASE + '/detailed-health');
                const data = await response.json();

                updateDashboardMetrics(data);
                renderServices(data.registered_services);
            } catch (error) {
                console.error('Error loading data:', error);
                alert('Failed to load service information. Please check your connection.');
            }
        }

        // Update dashboard metrics
        function updateDashboardMetrics(healthData) {
            const services = healthData.registered_services;
            const serviceNames = Object.keys(services);

            totalServicesEl.textContent = serviceNames.length;

            let healthyCount = 0;
            let unhealthyCount = 0;

            for (const serviceName in services) {
                const service = services[serviceName];
                if (service.status === 'healthy') {
                    healthyCount++;
                } else {
                    unhealthyCount++;
                }
            }

            healthyServicesEl.textContent = healthyCount;
            unhealthyServicesEl.textContent = unhealthyCount;

            etcdStatusEl.textContent = healthData.etcd_status.charAt(0).toUpperCase() + healthData.etcd_status.slice(1);
        }

        // Render services in the UI
        function renderServices(services) {
            servicesContainer.innerHTML = '';

            const serviceNames = Object.keys(services);

            if (serviceNames.length === 0) {
                servicesContainer.innerHTML =
                    '<div class="col-12">' +
                        '<div class="alert alert-info text-center">' +
                            '<i class="fas fa-info-circle me-2"></i> No services registered' +
                        '</div>' +
                    '</div>';
                return;
            }

            serviceNames.forEach(serviceName => {
                const service = services[serviceName];
                const status = service.status;
                const statusClass = getStatusClass(status);
                const statusText = getStatusText(status);

                const serviceCard = document.createElement('div');
                serviceCard.className = 'col-md-6 service-card';
                serviceCard.innerHTML =
                    '<div class="card">' +
                        '<div class="card-body">' +
                            '<div class="d-flex justify-content-between align-items-center mb-3">' +
                                '<h5 class="card-title mb-0">' + serviceName + '</h5>' +
                                '<span class="service-status ' + statusClass + '">' + statusText + '</span>' +
                            '</div>' +
                            '<div class="service-info">' +
                                '<strong>Healthy Count:</strong> ' + (service.healthy_count || 0) +
                            '</div>' +
                            '<div class="service-info">' +
                                '<strong>Total Count:</strong> ' + (service.total_count || 0) +
                            '</div>' +
                            '<div class="mb-3">' +
                                '<small class="text-muted">Instances: ' + (service.instances ? service.instances.length : 0) + '</small>' +
                            '</div>' +
                            '<div class="health-bar">' +
                                '<div class="health-progress" style="width: ' + (service.healthy_count && service.total_count ?
                                    (service.healthy_count / service.total_count) * 100 : 0) + '%"></div>' +
                            '</div>' +
                            '<button class="btn btn-outline-primary w-100 view-details" data-service="' + serviceName + '">' +
                                '<i class="fas fa-eye me-1"></i> View Instances' +
                            '</button>' +
                        '</div>' +
                    '</div>';

                servicesContainer.appendChild(serviceCard);

                // Add event listener to view details button
                serviceCard.querySelector('.view-details').addEventListener('click', () => {
                    showServiceDetails(serviceName, service);
                });
            });
        }

        // Show service details in modal
        function showServiceDetails(serviceName, service) {
            const modal = new bootstrap.Modal(document.getElementById('serviceDetailsModal'));
            const content = document.getElementById('serviceDetailsContent');

            if (!service.instances || service.instances.length === 0) {
                content.innerHTML =
                    '<div class="alert alert-warning">' +
                        '<i class="fas fa-exclamation-triangle me-2"></i> No instances found for service: ' + serviceName +
                    '</div>';
                modal.show();
                return;
            }

            let instancesHtml = '<h6>Instances for ' + serviceName + '</h6><hr>';
            service.instances.forEach((instance, index) => {
                const instanceStatusClass = getStatusClass(instance.health);
                const instanceStatusText = getStatusText(instance.health);

                instancesHtml +=
                    '<div class="service-detail">' +
                        '<div class="service-header">' +
                            '<h6>Instance #' + (index + 1) + ': ' + instance.id + '</h6>' +
                            '<span class="service-status ' + instanceStatusClass + '">' + instanceStatusText + '</span>' +
                        '</div>' +
                        '<div class="row">' +
                            '<div class="col-6">' +
                                '<strong>Name:</strong> ' + instance.name +
                            '</div>' +
                            '<div class="col-6">' +
                                '<strong>Host:Port:</strong> ' + instance.host + ':' + instance.port +
                            '</div>' +
                        '</div>' +
                        '<div class="row mt-2">' +
                            '<div class="col-12">' +
                                '<strong>Last Updated:</strong> ' + new Date(instance.updated).toLocaleString() +
                            '</div>' +
                        '</div>' +
                        '<div class="row mt-3">' +
                            '<div class="col-12">' +
                                '<button class="btn btn-sm btn-outline-success test-instance-btn" ' +
                                    'data-host="' + instance.host + '" ' +
                                    'data-port="' + instance.port + '">' +
                                    '<i class="fas fa-plug me-1"></i> Test Instance' +
                                '</button>' +
                                '<button class="btn btn-sm btn-outline-info health-check-btn" ' +
                                    'data-host="' + instance.host + '" ' +
                                    'data-port="' + instance.port + '">' +
                                    '<i class="fas fa-heartbeat me-1"></i> Health Check' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });

            content.innerHTML = instancesHtml;

            // Add event listeners for test buttons
            content.querySelectorAll('.test-instance-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const host = this.getAttribute('data-host');
                    const port = this.getAttribute('data-port');
                    // Test the instance directly
                    testInstance(host, port, '/health');
                });
            });

            content.querySelectorAll('.health-check-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const host = this.getAttribute('data-host');
                    const port = this.getAttribute('data-port');
                    testInstance(host, port, '/health');
                });
            });

            modal.show();
        }

        // Test individual instance
        async function testInstance(host, port, endpoint = '/health') {
            try {
                // Note: This won't work directly because of Docker networking,
                // but it demonstrates the functionality
                console.log('Testing instance: ' + host + ':' + port + endpoint);
                alert('Testing instance directly: ' + host + ':' + port + endpoint + '\\n(Actual network test would be performed here)');
            } catch (error) {
                console.error('Error testing instance:', error);
            }
        }

        // Discover service by name
        async function discoverService() {
            const serviceName = serviceNameInput.value.trim();
            if (!serviceName) {
                alert('Please enter a service name');
                return;
            }

            try {
                const response = await fetch(API_BASE + '/discover/' + serviceName);
                const data = await response.json();

                if (data.instances && data.instances.length > 0) {
                    let resultHtml = '<h5>Discovered instances for ' + serviceName + '</h5>';
                    resultHtml += '<div class="table-responsive">';
                    resultHtml += '<table class="table table-striped">';
                    resultHtml += '<thead><tr><th>ID</th><th>Host:Port</th><th>Health</th><th>Updated</th></tr></thead>';
                    resultHtml += '<tbody>';

                    data.instances.forEach(instance => {
                        const statusClass = getStatusClass(instance.health);
                        const statusText = getStatusText(instance.health);
                        const updated = new Date(instance.updated).toLocaleString();

                        resultHtml += '<tr>' +
                            '<td>' + instance.id + '</td>' +
                            '<td>' + instance.host + ':' + instance.port + '</td>' +
                            '<td><span class="service-status ' + statusClass + '">' + statusText + '</span></td>' +
                            '<td>' + updated + '</td>' +
                        '</tr>';
                    });

                    resultHtml += '</tbody></table></div>';
                    discoveryResult.innerHTML = resultHtml;
                } else {
                    discoveryResult.innerHTML =
                        '<div class="alert alert-info">' +
                            '<i class="fas fa-info-circle me-2"></i> No instances found for service: ' + serviceName +
                        '</div>';
                }
            } catch (error) {
                console.error('Error discovering service:', error);
                discoveryResult.innerHTML =
                    '<div class="alert alert-danger">' +
                        '<i class="fas fa-exclamation-triangle me-2"></i> Error discovering service: ' + error.message +
                    '</div>';
            }
        }

        // Execute GraphQL query
        async function executeGraphQL() {
            const query = graphqlQuery.value.trim();
            if (!query) {
                alert('Please enter a GraphQL query');
                return;
            }

            try {
                const response = await fetch(API_BASE + '/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query
                    })
                });

                const data = await response.json();

                graphqlResult.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                console.error('Error executing GraphQL query:', error);
                graphqlResult.innerHTML = '<div class="alert alert-danger">Error: ' + error.message + '</div>';
            }
        }

        // Test API endpoint
        async function testEndpoint(path, method = 'GET') {
            const timestamp = new Date().toLocaleTimeString();

            testResults.innerHTML +=
                '<div class="alert alert-info">' +
                    '<small>[' + timestamp + '] Testing ' + method + ' ' + path + '</small>' +
                '</div>';

            try {
                const startTime = Date.now();
                const response = await fetch(API_BASE + path, {
                    method: method
                });
                const endTime = Date.now();
                const duration = endTime - startTime;

                const data = await response.text();

                const resultHtml =
                    '<div class="alert ' + (response.ok ? 'alert-success' : 'alert-warning') + '">' +
                        '<small>' +
                            '<strong>Response:</strong> ' + response.status + ' ' + response.statusText + '<br>' +
                            '<strong>Time:</strong> ' + duration + 'ms<br>' +
                            '<strong>Content:</strong> ' + data.substring(0, 200) + (data.length > 200 ? '...' : '') +
                        '</small>' +
                    '</div>' +
                    '<hr>';

                testResults.innerHTML += resultHtml;
                testResults.scrollTop = testResults.scrollHeight;
            } catch (error) {
                console.error('Error testing endpoint:', error);

                const resultHtml =
                    '<div class="alert alert-danger">' +
                        '<small>' +
                            '<strong>Error:</strong> ' + error.message +
                        '</small>' +
                    '</div>' +
                    '<hr>';

                testResults.innerHTML += resultHtml;
                testResults.scrollTop = testResults.scrollHeight;
            }
        }

        // Helper functions for status
        function getStatusClass(status) {
            switch(status.toLowerCase()) {
                case 'healthy':
                    return 'status-healthy';
                case 'unhealthy':
                    return 'status-unhealthy';
                case 'degraded':
                    return 'status-degraded';
                default:
                    return 'status-unknown';
            }
        }

        function getStatusText(status) {
            switch(status.toLowerCase()) {
                case 'healthy':
                    return 'Healthy';
                case 'unhealthy':
                    return 'Unhealthy';
                case 'degraded':
                    return 'Degraded';
                default:
                    return 'Unknown';
            }
        }
    </script>
</body>
</html>
		`))
		return
	}

	c.Data(http.StatusOK, "text/html", []byte(htmlContent))
}


// GraphQLPlaygroundHandler handles GraphQL playground
func (h *Handler) GraphQLPlaygroundHandler(c *gin.Context) {
	playgroundHTML := `
<!DOCTYPE html>
<html>
<head>
    <meta charset=utf-8>
    <title>GraphQL Playground</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react@1.7.27/build/static/css/index.css">
    <link rel="shortcut icon" href="https://cdn.jsdelivr.net/npm/graphql-playground-react@1.7.27/build/favicon.png">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: "Ubuntu", sans-serif;
            overflow: hidden;
        }
        #root {
            height: 100vh;
        }
    </style>
</head>
<body>
<div id="root">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: "Ubuntu", sans-serif;
            overflow: hidden;
            background: linear-gradient(145deg, #222244, #444466);
            color: white;
        }
    </style>
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
        <div style="text-align: center; max-width: 600px; padding: 20px;">
            <h1>GraphQL API</h1>
            <p>Welcome to the TFT Bible GraphQL API!</p>
            <p>Send your GraphQL queries to this endpoint using POST method.</p>
            <p>Visit <a href="/graphql">this page</a> via POST to interact with the API.</p>
            <h3>Available Queries:</h3>
            <ul style="text-align: left">
                <li>getChampions(limit: Int, offset: Int, cost: Int, trait: String)</li>
                <li>getChampionById(id: String!)</li>
                <li>getTraits(type: String, limit: Int)</li>
                <li>getCompositions()</li>
            </ul>
        </div>
    </div>
</div>
</body>
</html>
`
	c.Data(http.StatusOK, "text/html", []byte(playgroundHTML))
}

// Initialize the handler with a default load balancer
func NewHandler(discovery *discovery.ServiceDiscovery, client *clientv3.Client, config *config.Config) *Handler {
	return &Handler{
		Discovery:    discovery,
		Client:       client,
		Config:       config,
		breakers:     make(map[string]*gobreaker.CircuitBreaker),
		loadBalancer: NewRoundRobinLoadBalancer(),
		Metrics:      utils.NewMetricsCollector(),
	}
}

