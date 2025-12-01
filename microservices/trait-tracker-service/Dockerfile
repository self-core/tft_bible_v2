# Use the official Rust image as the base image
FROM rust:latest as builder

# Copy the entire workspace
COPY . .

# Build the specific service
RUN cargo build --release --bin trait-tracker-service

# Create the runtime image
FROM debian:bookworm-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /target/release/trait-tracker-service /usr/local/bin/trait-tracker-service

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app-user
USER app-user

# Expose the service port
EXPOSE 8003

# Command to run the application
CMD ["trait-tracker-service"]