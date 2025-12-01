# Use the official Rust image as the base image
FROM rustlang/rust:nightly as builder

# Copy the entire workspace
COPY . .

# Build the specific service
RUN cargo build --release --bin champion-service

# Create a new image to run the application
FROM debian:bookworm-slim

# Install SSL certificates and other dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /target/release/champion-service /usr/local/bin/champion-service

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app-user
USER app-user

# Expose port
EXPOSE 8000

# Run the application
CMD ["champion-service"]