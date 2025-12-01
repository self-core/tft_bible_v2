# Use the official Rust image as the base image
FROM rust:latest as builder

# Copy the entire workspace
COPY . .

# Build the specific service
RUN cargo build --release --bin gateway

# Create the runtime image
FROM debian:bookworm-slim

# Install SSL certificates and other dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /target/release/gateway /usr/local/bin/gateway

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app-user
USER app-user

# Expose the gateway port
EXPOSE 8080

# Run the application
CMD ["gateway"]