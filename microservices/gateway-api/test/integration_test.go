package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// TestServiceInstance represents a service instance for testing
type TestServiceInstance struct {
	ID      string            `json:"id"`
	Name    string            `json:"name"`
	Host    string            `json:"host"`
	Port    string            `json:"port"`
	Health  string            `json:"health"`
	Meta    map[string]string `json:"meta,omitempty"`
}

// TestServiceRegistration tests service registration functionality
func TestServiceRegistration() {
	fmt.Println("Testing service registration...")
	
	// Register a test service
	testInstance := TestServiceInstance{
		ID:      "test-service-1",
		Name:    "test-service",
		Host:    "localhost",
		Port:    "8081",
		Health:  "Healthy",
		Meta:    map[string]string{"version": "1.0.0", "environment": "test"},
	}
	
	jsonData, err := json.Marshal(testInstance)
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return
	}
	
	resp, err := http.Post("http://localhost:8080/register", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error registering service: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Registration response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	if resp.StatusCode == 200 {
		fmt.Println("✓ Service registration test passed")
	} else {
		fmt.Println("✗ Service registration test failed")
	}
}

// TestServiceDiscovery tests service discovery functionality
func TestServiceDiscovery() {
	fmt.Println("\nTesting service discovery...")
	
	resp, err := http.Get("http://localhost:8080/discover/test-service")
	if err != nil {
		fmt.Printf("Error discovering service: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Discovery response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	if resp.StatusCode == 200 {
		fmt.Println("✓ Service discovery test passed")
	} else {
		fmt.Println("✗ Service discovery test failed")
	}
}

// TestHealthCheck tests health check functionality
func TestHealthCheck() {
	fmt.Println("\nTesting health check...")
	
	resp, err := http.Get("http://localhost:8080/health")
	if err != nil {
		fmt.Printf("Error checking health: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Health response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	if resp.StatusCode == 200 {
		fmt.Println("✓ Health check test passed")
	} else {
		fmt.Println("✗ Health check test failed")
	}
}

// TestDetailedHealthCheck tests detailed health check functionality
func TestDetailedHealthCheck() {
	fmt.Println("\nTesting detailed health check...")
	
	resp, err := http.Get("http://localhost:8080/detailed-health")
	if err != nil {
		fmt.Printf("Error checking detailed health: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Detailed health response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	if resp.StatusCode == 200 {
		fmt.Println("✓ Detailed health check test passed")
	} else {
		fmt.Println("✗ Detailed health check test failed")
	}
}

// TestMetricsEndpoint tests metrics endpoint functionality
func TestMetricsEndpoint() {
	fmt.Println("\nTesting metrics endpoint...")
	
	resp, err := http.Get("http://localhost:8080/metrics")
	if err != nil {
		fmt.Printf("Error getting metrics: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Metrics response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	if resp.StatusCode == 200 {
		fmt.Println("✓ Metrics endpoint test passed")
	} else {
		fmt.Println("✗ Metrics endpoint test failed")
	}
}

// TestProxyFunctionality tests proxy functionality
func TestProxyFunctionality() {
	fmt.Println("\nTesting proxy functionality...")
	
	// Try to call an endpoint that should be proxied
	// This will fail if no backend services are running, but we can still test the proxy mechanism
	resp, err := http.Get("http://localhost:8080/api/champions")
	if err != nil {
		fmt.Printf("Error making proxy request: %v\n", err)
		return
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %v\n", err)
		return
	}
	
	fmt.Printf("Proxy response: %s (Status: %d)\n", string(body), resp.StatusCode)
	
	fmt.Println("✓ Proxy functionality test completed (note: this may return 503 if no backend services are running)")
}

// RunAllTests runs all functionality tests
func RunAllTests() {
	fmt.Println("Starting comprehensive tests for gateway API...")
	fmt.Println("Note: These tests assume the gateway is running on http://localhost:8080")
	fmt.Println("Make sure to start the gateway before running these tests\n")
	
	TestHealthCheck()
	TestDetailedHealthCheck()
	TestMetricsEndpoint()
	TestServiceRegistration()
	TestServiceDiscovery()
	TestProxyFunctionality()
	
	fmt.Println("\nAll tests completed!")
}

func main() {
	RunAllTests()
	
	// Wait a bit before exiting to allow for goroutines to finish
	time.Sleep(1 * time.Second)
}