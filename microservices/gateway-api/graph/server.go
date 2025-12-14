package graph

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gateway-api/discovery"
	"gateway-api/handlers"
)

// The handlers package already has the proper Handler struct and GraphQL methods
// We'll use the existing handlers package's registration functions

// RegisterRoutes registers the GraphQL endpoints with the router
func RegisterRoutes(r *gin.Engine, serviceDiscovery *discovery.ServiceDiscovery, handler *handlers.Handler) {
	// Use the handler instance that's already properly initialized by main.go
	// Register GraphQL endpoint - uses the handler's GraphQL methods
	r.POST("/graphql", handler.GraphQLHandler)
	r.GET("/graphql", handler.GraphQLPlaygroundHandler)

	// Register additional GraphQL-related routes if needed
	r.GET("/graphql/schema", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "GraphQL endpoint available at /graphql",
			"playground": "GraphQL playground available at GET /graphql",
		})
	})
}