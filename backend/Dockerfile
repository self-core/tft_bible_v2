# Use the official Rust image as the base image
FROM rust:1.90-slim AS builder

# Set the working directory
WORKDIR /app

# Install required packages for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the Cargo.toml and Cargo.lock files
COPY Cargo.toml Cargo.lock ./

# Copy the source code
COPY src ./src

# Copy data files
COPY scraped_compositions.json ./scraped_compositions.json

# Build the application in release mode
RUN cargo build --release

# Create a new stage for the runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/target/release/backend /app/backend

# Expose the port the app runs on
EXPOSE 8080

# Set the default command to run the application
CMD ["./backend"]