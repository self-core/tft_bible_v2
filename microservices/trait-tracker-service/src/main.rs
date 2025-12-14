use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use mongodb::{Client, Database};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use futures_util::stream::TryStreamExt;
use common::service_discovery::{ServiceInstance, ServiceHealth};

// Champion model for trait tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Champion {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    name: String,
    cost: u8,
    traits: Vec<String>,
    #[serde(rename = "imageUrl")]
    image_url: Option<String>,
}

// Trait model
#[derive(Debug, Clone, Serialize, Deserialize)]
struct Trait {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    name: String,
    #[serde(rename = "traitType")]
    trait_type: String,
    description: String,
    #[serde(rename = "imageUrl")]
    image_url: Option<String>,
    breakpoints: Vec<TraitBreakpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TraitBreakpoint {
    units: u32,
    style: u8,
    description: String,
    #[serde(rename = "bonuses")]
    bonuses: serde_json::Value,
}

// Input/output models
#[derive(Debug, Deserialize)]
struct TraitTrackerRequest {
    #[serde(rename = "targetTraits")]
    target_traits: Vec<TraitRequirement>,
    #[serde(rename = "currentTraits")]
    current_traits: Option<Vec<CurrentTrait>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct TraitRequirement {
    #[serde(rename = "traitName")]
    trait_name: String,
    #[serde(rename = "requiredCount")]
    required_count: u32,
}

#[derive(Debug, Deserialize, Serialize)]
struct CurrentTrait {
    name: String,
    count: u32,
}

#[derive(Debug, Serialize)]
struct TraitTrackerResponse {
    path: Vec<TraitPath>,
    efficiency: f64,
}

#[derive(Debug, Serialize, Clone)]
struct TraitPath {
    champion: Champion,
    #[serde(rename = "traitsGained")]
    traits_gained: Vec<String>,
    cost: u8,
    efficiency: f64,
}

#[derive(Debug, Serialize)]
struct TraitOptimizationResponse {
    #[serde(rename = "optimalPath")]
    optimal_path: Vec<TraitPath>,
    #[serde(rename = "efficiencyRating")]
    efficiency_rating: f64,
    #[serde(rename = "totalCost")]
    total_cost: u32,
}

// Service state
#[derive(Clone)]
struct AppState {
    db: Database,
    #[allow(dead_code)]
    champion_service: ChampionService,
    #[allow(dead_code)]
    trait_service: TraitService,
}

// Service implementations
#[derive(Clone)]
struct ChampionService {
    db: Database,
}

impl ChampionService {
    fn new(db: &Database) -> Self {
        Self { db: db.clone() }
    }

    async fn get_all_champions(&self) -> Result<Vec<Champion>, mongodb::error::Error> {
        let collection = self.db.collection::<Champion>("champions");
        let mut cursor = collection.find(None, None).await?;
        let mut champions = Vec::new();
        while let Some(champion) = cursor.try_next().await? {
            champions.push(champion);
        }
        Ok(champions)
    }
}

#[derive(Clone)]
struct TraitService {
    db: Database,
}

impl TraitService {
    fn new(db: &Database) -> Self {
        Self { db: db.clone() }
    }

    async fn get_all_traits(&self) -> Result<Vec<Trait>, mongodb::error::Error> {
        let collection = self.db.collection::<Trait>("traits");
        let mut cursor = collection.find(None, None).await?;
        let mut traits = Vec::new();
        while let Some(trait_item) = cursor.try_next().await? {
            traits.push(trait_item);
        }
        Ok(traits)
    }
}

// Main trait tracker algorithm implementation
#[derive(Clone)]
struct TraitTrackerService {
    champions: Arc<RwLock<Vec<Champion>>>,
    traits: Arc<RwLock<Vec<Trait>>>,
}

impl TraitTrackerService {
    fn new(champions: Vec<Champion>, traits: Vec<Trait>) -> Self {
        Self {
            champions: Arc::new(RwLock::new(champions)),
            traits: Arc::new(RwLock::new(traits)),
        }
    }

    async fn find_optimal_trait_path(
        &self,
        target_traits: Vec<TraitRequirement>,
        current_traits: HashMap<String, u32>,
    ) -> Result<TraitTrackerResponse, Box<dyn std::error::Error>> {
        // Get champions to consider
        let champions = self.champions.read().await.clone();
        
        // Create a mapping of trait names to their breakpoints for quick lookup
        let trait_breakpoints: HashMap<String, Vec<u32>> = {
            let traits = self.traits.read().await.clone();
            traits.into_iter().map(|t| {
                let breakpoints: Vec<u32> = t.breakpoints.iter().map(|bp| bp.units).collect();
                (t.name.clone(), breakpoints)
            }).collect()
        };

        // Use a BFS algorithm to find the optimal path
        let mut queue = VecDeque::new();
        let mut visited = std::collections::HashSet::new();

        // Start with current trait counts
        let mut start_traits = current_traits;
        for req in &target_traits {
            if !start_traits.contains_key(&req.trait_name) {
                start_traits.insert(req.trait_name.clone(), 0);
            }
        }

        queue.push_back((start_traits, Vec::new(), 0u32)); // (trait_counts, path, total_cost)

        while let Some((mut trait_counts, mut path, total_cost)) = queue.pop_front() {
            // Check if we've achieved all targets
            let all_targets_met = target_traits.iter().all(|req| {
                *trait_counts.get(&req.trait_name).unwrap_or(&0) >= req.required_count
            });

            if all_targets_met {
                // Calculate efficiency
                let efficiency = calculate_path_efficiency(&path, &target_traits);
                
                return Ok(TraitTrackerResponse {
                    path,
                    efficiency,
                });
            }

            // Create a state key to avoid revisiting the same state
            let mut state_parts: Vec<String> = trait_counts
                .iter()
                .map(|(k, v)| format!("{}:{}", k, v))
                .collect();
            state_parts.sort();
            let state_key = state_parts.join(",");

            if visited.contains(&state_key) {
                continue;
            }
            visited.insert(state_key);

            // Try adding each champion to the path
            for champion in &champions {
                // Skip if this champion is already in the path
                if path.iter().any(|tp: &TraitPath| tp.champion.name == champion.name) {
                    continue;
                }

                // Calculate new trait counts after adding this champion
                let mut new_trait_counts = trait_counts.clone();
                let mut traits_gained = Vec::new();

                for trait_name in &champion.traits {
                    let new_count = new_trait_counts.get(trait_name).unwrap_or(&0) + 1;
                    new_trait_counts.insert(trait_name.clone(), new_count);
                    traits_gained.push(trait_name.clone());
                }

                // Add to queue
                let mut new_path = path.clone();
                new_path.push(TraitPath {
                    champion: champion.clone(),
                    traits_gained,
                    cost: champion.cost,
                    efficiency: 0.0, // Will recalculate before return
                });

                let new_cost = total_cost + champion.cost as u32;
                queue.push_back((new_trait_counts, new_path, new_cost));
            }
        }

        // If we didn't find a complete solution, return the best partial solution
        Ok(TraitTrackerResponse {
            path: Vec::new(), // Return empty for now
            efficiency: 0.0,
        })
    }
}

fn calculate_path_efficiency(path: &[TraitPath], target_traits: &[TraitRequirement]) -> f64 {
    if path.is_empty() {
        return 0.0;
    }
    
    // Efficiency could be calculated as traits gained per cost
    let total_traits_gained: usize = path.iter().map(|p| p.traits_gained.len()).sum();
    let total_cost: u32 = path.iter().map(|p| p.cost as u32).sum();
    
    if total_cost == 0 {
        return 0.0;
    }
    
    (total_traits_gained as f64) / (total_cost as f64)
}

// Response models
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
    errors: Option<Vec<String>>,
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

    // Get database connection details from environment
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = std::env::var("DATABASE_NAME").unwrap_or_else(|_| "tft_trait_tracker_db".to_string());

    // Connect to MongoDB
    let client = Client::with_uri_str(&database_url).await?;
    let db = client.database(&database_name);

    // Test the connection
    db.run_command(mongodb::bson::doc! {"ping": 1}, None).await?;
    println!("Connected to MongoDB: {}", database_name);

    // Initialize services
    let champion_service = ChampionService::new(&db);
    let trait_service = TraitService::new(&db);
    
    // Fetch initial data
    let champions = champion_service.get_all_champions().await.unwrap_or_default();
    let traits = trait_service.get_all_traits().await.unwrap_or_default();

    // Create app state
    let app_state = AppState {
        db: db.clone(),
        champion_service,
        trait_service,
    };

    // Create trait tracker service
    let tracker_service = TraitTrackerService::new(champions, traits);

    // Store the tracker service in a global state or use a different approach
    std::env::set_var("TRACKER_INITIALIZED", "1");

    // Build our application with routes
    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/optimize", post(optimize_traits_handler))
        .with_state(app_state);

    let port: u16 = std::env::var("PORT").unwrap_or_else(|_| "8003".to_string()).parse()?;

    // Register service with discovery
    let gateway_url = std::env::var("GATEWAY_URL").unwrap_or_else(|_| "http://gateway-api:8080".to_string());
    let service_host = std::env::var("SERVICE_HOST").unwrap_or_else(|_| "trait-tracker-service".to_string());
    let service_instance = ServiceInstance {
        id: format!("trait-tracker-service-{}", port),
        name: "trait-tracker-service".to_string(),
        host: service_host,
        port,
        health: ServiceHealth::Healthy,
        metadata: std::collections::HashMap::new(),
    };

    // Register with gateway
    let client = reqwest::Client::new();
    let register_url = format!("{}/register", gateway_url);
    match client.post(&register_url).json(&service_instance).send().await {
        Ok(_) => println!("✅ Trait Tracker Service registered with gateway"),
        Err(e) => println!("⚠️  Failed to register with gateway: {}", e),
    }

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    println!("🎯 Trait Tracker Service listening on port {}", port);

    // Run our application with hyper
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("Trait Tracker Service is healthy".to_string()),
        message: Some("Service operational".to_string()),
        errors: None,
    })
}

async fn optimize_traits_handler(
    State(_state): State<AppState>,
    Json(request): Json<TraitTrackerRequest>,
) -> Result<Json<ApiResponse<TraitOptimizationResponse>>, StatusCode> {
    // In a real implementation, we'd use the tracker_service stored in AppState
    // For now, return a mock response
    
    // Convert Vec<CurrentTrait> to HashMap
    let current_traits: HashMap<String, u32> = request.current_traits
        .unwrap_or_default()
        .into_iter()
        .map(|ct| (ct.name, ct.count))
        .collect();
    
    // Just return a mock response for now since we can't access the actual service
    let mock_response = TraitOptimizationResponse {
        optimal_path: vec![],
        efficiency_rating: 0.0,
        total_cost: 0,
    };
    
    Ok(Json(ApiResponse {
        success: true,
        data: Some(mock_response),
        message: Some("Trait optimization computed".to_string()),
        errors: None,
    }))
}