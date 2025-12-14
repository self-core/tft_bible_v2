package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var logger *zap.Logger

// InitLogger initializes the logger
func InitLogger() {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	logger, _ = config.Build()
}

// LoggerToFile creates a middleware that logs to a file
func LoggerToFile() gin.HandlerFunc {
	InitLogger()
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		end := time.Now()
		latency := end.Sub(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log := logger.With(
			zap.String("clientIP", clientIP),
			zap.String("method", method),
			zap.String("path", path),
			zap.Int("statusCode", statusCode),
			zap.Duration("latency", latency),
			zap.String("userAgent", c.Request.UserAgent()),
			zap.Int("bodySize", c.Writer.Size()),
		)

		if len(c.Errors) > 0 {
			// Convert gin errors to regular Go errors for zap
			errs := make([]error, len(c.Errors))
			for i, ginErr := range c.Errors {
				errs[i] = ginErr.Err
			}
			log.Error("Request error", zap.Errors("errors", errs))
		} else {
			if statusCode >= 400 {
				log.Warn("Request completed with error status", zap.Int("status", statusCode))
			} else {
				log.Info("Request completed")
			}
		}
	}
}