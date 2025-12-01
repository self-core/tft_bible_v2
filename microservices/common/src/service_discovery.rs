use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use rand::seq::SliceRandom;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ServiceInstance {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub health: ServiceHealth,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum ServiceHealth {
    Healthy,
    Unhealthy,
    Unknown,
}

pub struct ServiceRegistry {
    services: Arc<RwLock<HashMap<String, Vec<ServiceInstance>>>>,
}

impl ServiceRegistry {
    pub fn new() -> Self {
        Self {
            services: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn register_service(&self, instance: ServiceInstance) -> Result<(), String> {
        let mut services = self.services.write().await;

        let service_instances = services.entry(instance.name.clone()).or_insert_with(Vec::new);

        // Check if instance already exists
        if service_instances.iter().any(|existing| existing.id == instance.id) {
            return Err("Service instance already registered".to_string());
        }

        service_instances.push(instance);

        Ok(())
    }

    pub async fn deregister_service(&self, service_name: &str, instance_id: &str) -> Result<(), String> {
        let mut services = self.services.write().await;

        if let Some(service_instances) = services.get_mut(service_name) {
            service_instances.retain(|instance| instance.id != instance_id);

            // If the service list is now empty, remove the entry completely
            if service_instances.is_empty() {
                services.remove(service_name);
            }

            Ok(())
        } else {
            Err("Service not found".to_string())
        }
    }

    pub async fn get_service_instances(&self, service_name: &str) -> Vec<ServiceInstance> {
        let services = self.services.read().await;

        services.get(service_name)
            .map(|instances| {
                instances.iter()
                    .filter(|instance| matches!(instance.health, ServiceHealth::Healthy))
                    .cloned()
                    .collect()
            })
            .unwrap_or_default()
    }

    pub async fn get_random_instance(&self, service_name: &str) -> Option<ServiceInstance> {
        let instances = self.get_service_instances(service_name).await;

        if instances.is_empty() {
            None
        } else {
            // Simple random selection (in production you might want a more sophisticated load balancing algorithm)
            let mut rng = rand::thread_rng();
            instances.choose(&mut rng).cloned()
        }
    }

    pub async fn update_service_health(&self, service_name: &str, instance_id: &str, health: ServiceHealth) -> Result<(), String> {
        let mut services = self.services.write().await;

        if let Some(service_instances) = services.get_mut(service_name) {
            if let Some(instance) = service_instances.iter_mut().find(|inst| inst.id == instance_id) {
                instance.health = health;
                Ok(())
            } else {
                Err("Service instance not found".to_string())
            }
        } else {
            Err("Service not found".to_string())
        }
    }
}

// Global registry instance
use lazy_static::lazy_static;

lazy_static! {
    static ref REGISTRY: ServiceRegistry = ServiceRegistry::new();
}

pub fn get_registry() -> &'static ServiceRegistry {
    &REGISTRY
}

// Health check endpoint for services to verify they're running
pub async fn health_check() -> String {
    "Service Registry is healthy".to_string()
}