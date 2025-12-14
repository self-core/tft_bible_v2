package config

import (
	"fmt"
	"os"
)

// Config holds the application configuration
type Config struct {
	Port          string
	EtcdEndpoint  string
	ServiceTTL    int64
	ServiceName   string
	ServiceHost   string
	ServicePort   string
	JWTSecret     string
	CORSDomain    string
	RateLimit     int
}

// LoadConfig loads the configuration from environment variables
func LoadConfig() *Config {
	// Set default values
	cfg := &Config{
		Port:         getEnv("PORT", "8080"),
		EtcdEndpoint: getEnv("ETCD_ENDPOINT", "etcd:2379"),
		ServiceTTL:   parseInt64Env("SERVICE_TTL", 300), // 300 seconds (5 minutes) TTL - for development environment
		ServiceName:  getEnv("SERVICE_NAME", "gateway-api"),
		ServiceHost:  getEnv("SERVICE_HOST", "gateway-api"),
		ServicePort:  getEnv("PORT", "8080"),
		JWTSecret:    getEnv("JWT_SECRET", "default-secret-change-in-production"),
		CORSDomain:   getEnv("CORS_DOMAIN", "*"),
		RateLimit:    parseIntEnv("RATE_LIMIT", 1000), // requests per minute
	}

	return cfg
}

// parseIntEnv retrieves an environment variable and parses it to int
func parseIntEnv(key string, defaultValue int) int {
	if value := getEnv(key, ""); value != "" {
		var parsedValue int
		fmt.Sscanf(value, "%d", &parsedValue)
		return parsedValue
	}
	return defaultValue
}

// parseInt64Env retrieves an environment variable and parses it to int64
func parseInt64Env(key string, defaultValue int64) int64 {
	if value := getEnv(key, ""); value != "" {
		var parsedValue int64
		fmt.Sscanf(value, "%d", &parsedValue)
		return parsedValue
	}
	return defaultValue
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}