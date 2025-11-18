# Use the official Rust image as the base image
FROM rust:1.90-slim AS builder

# Set the working directory
WORKDIR /app

# Install required packages for building
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the Cargo.toml and Cargo.lock files
COPY backend/Cargo.toml backend/Cargo.lock ./

# Copy the source code
COPY backend/src ./src

# Copy data files
COPY backend/scraped_compositions.json ./scraped_compositions.json

# Build both the main application and seed binary in release mode
RUN cargo build --release
RUN cargo build --release --bin seed

# Create a new stage for the runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -r -s /bin/false tftuser

# Set the working directory
WORKDIR /app

# Copy the compiled binaries from the builder stage
COPY --from=builder /app/target/release/backend /app/backend
COPY --from=builder /app/target/release/seed /app/seed

# Change ownership to non-root user
RUN chown tftuser:tftuser /app/backend /app/seed

# Switch to non-root user
USER tftuser

# Copy data files for seeding
COPY tft_champion_data.json /app/tft_champion_data.json
COPY tft_trait_data.json /app/tft_trait_data.json
COPY tft_item_data.json /app/tft_item_data.json
COPY tft_augments_data.json /app/tft_augments_data.json
COPY scraped_compositions.json /app/scraped_compositions.json

# Expose the port the app runs on
EXPOSE 8080

# Create a startup script that seeds the database if it's empty
RUN echo '#!/bin/bash\n\
echo "Ensuring MongoDB is ready..."\n\
sleep 10\n\
\n\
echo "Seeding database with initial data..." \n\
./seed\n\
\n\
echo "Starting the application..."\n\
exec "$@"' > /app/start.sh && chmod +x /app/start.sh

# Set the default command to run the startup script
CMD ["./start.sh", "./backend"]
