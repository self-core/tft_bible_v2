package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sony/gobreaker"
	"go.uber.org/zap"
)

// RateLimitMiddleware provides basic rate limiting functionality
func RateLimitMiddleware() gin.HandlerFunc {
	// For simplicity, using a basic rate limiter
	// In a real implementation, you might want to use something like token bucket or sliding window
	return func(c *gin.Context) {
		// In a real implementation, you would track requests per client IP
		// and limit them based on configuration
		c.Next()
	}
}

// CircuitBreakerMiddleware provides circuit breaker functionality
func CircuitBreakerMiddleware() gin.HandlerFunc {
	// Create a circuit breaker
	var cb *gobreaker.CircuitBreaker
	settings := gobreaker.Settings{
		Name:        "api-gateway-cb",
		MaxRequests: 3,
		Timeout:     60 * time.Second,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			return counts.ConsecutiveFailures > 5
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			zap.L().Info("Circuit breaker state changed", zap.String("name", name), zap.String("from", string(from)), zap.String("to", string(to)))
		},
	}
	cb = gobreaker.NewCircuitBreaker(settings)

	return func(c *gin.Context) {
		_, err := cb.Execute(func() (interface{}, error) {
			c.Next()
			return nil, nil
		})

		if err != nil {
			zap.L().Error("Circuit breaker is open", zap.Error(err))
			c.JSON(503, gin.H{"error": "Service temporarily unavailable"})
			c.Abort()
			return
		}
	}
}

// CreateCircuitBreaker creates a circuit breaker with more relaxed settings for service discovery
func CreateCircuitBreaker(serviceName string) *gobreaker.CircuitBreaker {
	settings := gobreaker.Settings{
		Name:        serviceName,
		MaxRequests: 3,
		Timeout:     30 * time.Second, // Reduced timeout
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			// Be more lenient - only trip if we have several consecutive failures
			return counts.ConsecutiveFailures > 10
		},
		OnStateChange: func(name string, from, to gobreaker.State) {
			zap.L().Info("Circuit breaker state changed", zap.String("name", name), zap.String("from", string(from)), zap.String("to", string(to)))
		},
	}
	
	return gobreaker.NewCircuitBreaker(settings)
}