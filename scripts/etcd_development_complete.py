#!/usr/bin/env python3
"""
Comprehensive script to handle etcd service discovery development
and update the Trello board as we work on tasks.
"""

import os
import sys
import requests
import json
from typing import Dict, Any, List

def load_env():
    """Load environment variables from .env file."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"\'')
    else:
        print("Warning: .env file not found")

def get_trello_board_lists(api_key: str, token: str, board_id: str) -> List[Dict[str, Any]]:
    """Get all lists from a Trello board."""
    url = f"https://api.trello.com/1/boards/{board_id}/lists"
    
    params = {
        'key': api_key,
        'token': token
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error getting board lists: {response.status_code} - {response.text}")
        return []

def get_trello_list_cards(api_key: str, token: str, list_id: str) -> List[Dict[str, Any]]:
    """Get all cards in a specific list."""
    url = f"https://api.trello.com/1/lists/{list_id}/cards"
    
    params = {
        'key': api_key,
        'token': token
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error getting list cards: {response.status_code} - {response.text}")
        return []

def move_card_to_list(api_key: str, token: str, card_id: str, list_id: str) -> bool:
    """Move a card to a different list."""
    url = f"https://api.trello.com/1/cards/{card_id}"
    
    params = {
        'key': api_key,
        'token': token,
        'idList': list_id
    }
    
    response = requests.put(url, params=params)
    
    if response.status_code == 200:
        print(f"✅ Moved card to new list")
        return True
    else:
        print(f"❌ Error moving card: {response.status_code} - {response.text}")
        return False

def create_etcd_service_files():
    """Create the necessary files for etcd service discovery implementation."""
    
    # Create directory structure if it doesn't exist
    os.makedirs("microservices/etcd-service/src", exist_ok=True)
    
    # Create Cargo.toml for the etcd service
    cargo_toml_content = '''[package]
name = "etcd-service"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
axum = { version = "0.7", features = ["macros", "ws"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower-http = { version = "0.5", features = ["cors"] }
etcd-client = "0.14"
tracing = "0.1"
tracing-subscriber = "0.3"
config = "0.14"
uuid = { version = "1.0", features = ["v4"] }
common = { path = "../common" }

[dev-dependencies]
tokio-test = "0.4"
'''
    
    with open("microservices/etcd-service/Cargo.toml", "w", encoding='utf-8') as f:
        f.write(cargo_toml_content)
    
    # Create main.rs for etcd service
    main_rs_content = '''use axum::{
    extract::{Path, State},
    http::{Method, StatusCode},
    middleware,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use etcd_client::{Client, PutOptions, GetOptions, DeleteOptions};
use common::service_discovery::{ServiceInstance, ServiceRegistry};

// Service state
#[derive(Clone)]
struct AppState {
    etcd_client: Arc<RwLock<Option<etcd_client::Client>>>,
    service_registry: Arc<ServiceRegistry>,
}

#[derive(Deserialize, Serialize, Debug)]
struct RegisterRequest {
    service: ServiceInstance,
}

#[derive(Deserialize, Serialize, Debug)]
struct DiscoverRequest {
    service_name: String,
}

#[derive(Deserialize, Serialize, Debug)]
struct DiscoverResponse {
    instances: Vec<ServiceInstance>,
}

// Health check for the service
async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "etcd-service",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Register a service with etcd
async fn register_service(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        let mut client = client.clone();
        
        // Serialize the service instance to JSON
        let service_data = serde_json::to_string(&request.service)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // Create a key for the service
        let key = format!("/services/{}/{}", request.service.name, request.service.id);
        
        // Store the service in etcd with TTL
        let options = PutOptions::new().with_lease(30); // 30 second lease
        
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        kv_client.put(key, service_data, Some(options)).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // Also register with our service registry
        state.service_registry.register_service(request.service).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        Ok(Json(serde_json::json!({
            "success": true,
            "message": "Service registered successfully"
        })))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

// Discover services by name
async fn discover_service(
    State(state): State<AppState>,
    Path(service_name): Path<String>,
) -> Result<Json<DiscoverResponse>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        // Create the prefix key for the service
        let prefix = format!("/services/{}/", service_name);
        
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let resp = kv_client.get(prefix, Some(GetOptions::new().with_prefix())).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let mut instances = Vec::new();
        for kv in resp.kvs() {
            if let Ok(service_instance) = serde_json::from_slice::<ServiceInstance>(kv.value()) {
                instances.push(service_instance);
            }
        }
        
        Ok(Json(DiscoverResponse {
            instances
        }))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

// Deregister a service
async fn deregister_service(
    State(state): State<AppState>,
    Path(service_id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = state.etcd_client.read().await.clone();
    if let Some(client) = client {
        // Delete the service from etcd
        let mut kv_client = client.kv_client().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        // For simplicity, we'll do a prefix delete of all services with this ID
        // In practice, we might want to be more specific
        let resp = kv_client.delete(service_id, None).await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
        Ok(Json(serde_json::json!({
            "success": true,
            "message": "Service deregistered",
            "deleted_count": resp.deleted_kvs()
        })))
    } else {
        Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Connect to etcd
    let endpoints = std::env::var("ETCD_ENDPOINTS").unwrap_or_else(|_| "localhost:2379".to_string());
    let client = etcd_client::Client::connect(&[endpoints.as_str()], None).await?;
    
    // Create application state
    let app_state = AppState {
        etcd_client: Arc::new(RwLock::new(Some(client))),
        service_registry: Arc::new(ServiceRegistry::new()),
    };

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/register", post(register_service))
        .route("/discover/:service_name", get(discover_service))
        .route("/deregister/:service_id", post(deregister_service));

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8005".to_string()).parse()?;
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🚀 Etcd Service listening on port {}", port);

    axum::serve(listener, app).await?;
    
    Ok(())
}
'''
    
    with open("microservices/etcd-service/src/main.rs", "w", encoding='utf-8') as f:
        f.write(main_rs_content)
    
    # Create Dockerfile for the etcd service
    dockerfile_content = '''# Use Rust Alpine image
FROM rust:1.70-alpine as builder

# Install dependencies
RUN apk add --no-cache musl-dev

# Set working directory
WORKDIR /usr/src/etcd-service

# Copy the Cargo files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src
RUN echo "fn main(){println!(\"dummy\");}" > src/main.rs

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
'''
    
    with open("microservices/etcd-service/Dockerfile", "w", encoding='utf-8') as f:
        f.write(dockerfile_content)
    
    # Create docker-compose configuration
    docker_compose_content = '''  etcd-service:
    build:
      context: ./microservices/etcd-service
      dockerfile: Dockerfile
    container_name: etcd-service
    ports:
      - "8005:8005"
    environment:
      - RUST_LOG=debug
      - ETCD_ENDPOINTS=etcd:2379
      - DATABASE_URL=mongodb://mongo:27017
      - DATABASE_NAME=tft_bible_dev
      - PORT=8005
    depends_on:
      - etcd
      - mongo
    networks:
      - tft-network

  etcd:
    image: gcr.io/etcd-development/etcd:v3.5.15
    container_name: etcd-server
    command: >
      /usr/local/bin/etcd
      --name etcd-server
      --data-dir /etcd-data
      --advertise-client-urls http://0.0.0.0:2379
      --listen-client-urls http://0.0.0.0:2379
      --listen-peer-urls http://0.0.0.0:2380
      --initial-advertise-peer-urls http://etcd-server:2380
      --initial-cluster-token etcd-cluster-1
      --initial-cluster etcd-server=http://etcd-server:2380
      --initial-cluster-state new
    ports:
      - "2379:2379"
      - "2380:2380"
    volumes:
      - etcd-data:/etcd-data
    networks:
      - tft-network

volumes:
  etcd-data:
'''
    
    with open("microservices/etcd-service/docker-compose-addition.txt", "w", encoding='utf-8') as f:
        f.write(docker_compose_content)
    
    print("✅ Created etcd service files")
    print("📁 Files created:")
    print("   - microservices/etcd-service/Cargo.toml")
    print("   - microservices/etcd-service/src/main.rs")
    print("   - microservices/etcd-service/Dockerfile")
    print("   - microservices/etcd-service/docker-compose-addition.txt")

def update_trello_progress(api_key: str, token: str, board_id: str):
    """Update the Trello board to mark a task as in progress."""
    # Get lists in the board
    lists = get_trello_board_lists(api_key, token, board_id)
    if not lists:
        print("❌ Could not get board lists")
        return
    
    # Find the 'Backlog', 'In Progress' lists
    backlog_list = next((l for l in lists if l['name'] == 'Backlog'), None)
    in_progress_list = next((l for l in lists if l['name'] == 'In Progress'), None)
    
    if not backlog_list or not in_progress_list:
        print("❌ Could not find required lists")
        return
    
    # Get cards in the backlog that are etcd related
    cards = get_trello_list_cards(api_key, token, backlog_list['id'])
    etcd_cards = [card for card in cards if 'etcd' in card['name'].lower()]
    
    if etcd_cards:
        # Move the first etcd card to 'In Progress'
        card_to_move = etcd_cards[0]
        print(f"📋 Moving card to 'In Progress': {card_to_move['name'][:50]}...")
        
        success = move_card_to_list(api_key, token, card_to_move['id'], in_progress_list['id'])
        
        if success:
            print(f"✅ Successfully moved '{card_to_move['name'][:50]}...' to 'In Progress'")
        else:
            print(f"❌ Failed to move card")
    else:
        print("❌ No etcd cards found in backlog")

def main():
    """Main function to start etcd development process."""
    print("🚀 Starting development on the etcd service discovery plan...")
    
    # Load environment
    load_env()
    
    # Get Trello credentials
    api_key = os.environ.get("TRELLO_API_KEY")
    token = os.environ.get("TRELLO_TOKEN")
    
    if not api_key or not token:
        print("❌ Trello credentials not found in environment")
        return
    
    # Board ID from the previous script execution
    board_id = "6933f7825f9e85b7e4ca7001"
    
    # Create the necessary files for implementation
    create_etcd_service_files()
    
    # Update Trello board to mark progress
    update_trello_progress(api_key, token, board_id)
    
    print(f"\n✅ Setup complete!")
    print("📁 Created etcd service files in microservices/etcd-service/")
    print(f"📊 Trello board updated: https://trello.com/b/{board_id}")
    print("🔧 You can now start implementing the etcd service discovery features")
    print("🔄 As you complete tasks, move them from 'In Progress' to 'Done' on Trello")

if __name__ == "__main__":
    main()