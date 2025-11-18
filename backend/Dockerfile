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
COPY Cargo.toml Cargo.lock ./

# Copy the source code
COPY src ./src

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