# Use the official Golang image to create a build artifact
FROM golang:1.21-alpine AS builder

# Set destination for COPY
WORKDIR /app

# Install git for go mod tidy
RUN apk add --no-cache git

# Copy the Go Modules manifests
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Tidy and build the application
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o gateway-api .

# Use a minimal alpine image for the final image
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Create a non-root user
RUN adduser -D -s /bin/sh appuser

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/gateway-api .

# Change ownership of the binary to the non-root user
RUN chown appuser:appuser gateway-api

# Switch to the non-root user
USER appuser

# Expose port
EXPOSE 8080

# Run the application
CMD ["./gateway-api"]