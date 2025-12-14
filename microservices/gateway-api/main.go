package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.etcd.io/etcd/client/v3"
	"gateway-api/config"
	"gateway-api/discovery"
	"gateway-api/graph"
	"gateway-api/handlers"
	"gateway-api/middleware"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Setup etcd client
	etcdClient, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{cfg.EtcdEndpoint},
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		log.Fatal("Failed to connect to etcd:", err)
	}
	defer etcdClient.Close()

	// Initialize service discovery
	serviceDiscovery := discovery.NewServiceDiscovery(etcdClient, cfg.ServiceTTL)

	// Setup router
	r := gin.Default()

	// Setup middleware
	r.Use(middleware.LoggerToFile())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.RateLimitMiddleware())

	// Create handler instance with dependencies
	handler := handlers.NewHandler(serviceDiscovery, etcdClient, cfg)

	// Register routes
	registerRoutes(r, handler, cfg, serviceDiscovery)

	// Setup graceful shutdown
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("🚀 Gateway API starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}

func registerRoutes(r *gin.Engine, handler *handlers.Handler, config *config.Config, serviceDiscovery *discovery.ServiceDiscovery) {
	// Base info endpoint
	r.GET("/", handler.BaseInfoHandler)

	// Health check endpoints
	r.GET("/health", handler.HealthHandler)
	r.GET("/detailed-health", handler.DetailedHealthHandler)

	// Metrics endpoint
	r.GET("/metrics", handler.MetricsHandler)

	// Service discovery endpoints
	r.POST("/register", handler.RegisterServiceHandler)
	r.GET("/discover/:service_name", handler.DiscoverServiceHandler)

	// Register GraphQL routes with the handler instance
	graph.RegisterRoutes(r, serviceDiscovery, handler)

	// Swagger documentation endpoint
	r.GET("/swagger", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
	})

	// Swagger UI endpoints (these would typically be served from a static file server)
	// In a full implementation, you'd serve the actual Swagger UI files
	r.GET("/swagger/*any", func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Swagger UI not found"})
	})

	// Service Discovery Portal
	r.GET("/discovery", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/discovery-portal")
	})

	// Service Discovery Portal endpoint
	r.GET("/discovery-portal", handler.DiscoveryPortalHandler)

	// Catch-all proxy for API requests
	r.Any("/api/*path", handler.ProxyHandler)
}