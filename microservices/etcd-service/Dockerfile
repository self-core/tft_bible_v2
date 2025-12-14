# Use Rust Alpine image
FROM rust:1.70-alpine as builder

# Install dependencies
RUN apk add --no-cache musl-dev

# Set working directory
WORKDIR /usr/src/etcd-service

# Copy the Cargo files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src
RUN echo "fn main(){println!("dummy");}" > src/main.rs

# Build dependencies
RUN cargo build --release
RUN rm src/*.rs

# Copy actual source code
COPY src src/

# Build the application
RUN touch -a -m src/main.rs  # Workaround for cargo build caching
RUN cargo build --release

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /usr/src/etcd-service/target/release/etcd-service .

# Expose port
EXPOSE 8005

# Run the etcd-service binary
CMD ["./etcd-service"]
