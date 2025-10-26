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
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy the source code
COPY backend/src ./src

# Copy data files
COPY backend/scraped_compositions.json ./scraped_compositions.json

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

# Copy data files for seeding
COPY tft_champion_data.json /app/tft_champion_data.json
COPY tft_trait_data.json /app/tft_trait_data.json
COPY tft_item_data.json /app/tft_item_data.json
COPY tft_augments_data.json /app/tft_augments_data.json
COPY scraped_compositions.json /app/scraped_compositions.json

# Expose the port the app runs on
EXPOSE 8080

# Copy the entrypoint script
COPY backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set the entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Set the default command to run the application
CMD ["./backend"]