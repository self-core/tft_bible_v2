pub mod circuit_breaker;
pub mod service_discovery;
pub mod trello;

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::time::Duration;
    use tokio::time::sleep;

    #[tokio::test]
    async fn test_circuit_breaker_states() {
        use crate::circuit_breaker::{CircuitBreaker, State as CircuitState};

        // Create a circuit breaker with low thresholds for testing
        let circuit_breaker = CircuitBreaker::new(2, Duration::from_millis(100));

        // Initially should be closed
        assert_eq!(*circuit_breaker.state().await, CircuitState::Closed);

        // Fail twice to open the circuit
        let _ = circuit_breaker.call(|| async { Result::<(), ()>::Err(()) }).await;
        let _ = circuit_breaker.call(|| async { Result::<(), ()>::Err(()) }).await;

        // Should be open now
        assert_eq!(*circuit_breaker.state().await, CircuitState::Open);

        // Wait for reset timeout
        sleep(Duration::from_millis(150)).await;

        // Should transition to half-open
        assert_eq!(*circuit_breaker.state().await, CircuitState::HalfOpen);
    }

    #[tokio::test]
    async fn test_service_registry_operations() {
        use crate::service_discovery::ServiceRegistry;

        let registry = ServiceRegistry::new();
        
        // Register a service instance
        let instance = crate::service_discovery::ServiceInstance {
            id: "test-instance".to_string(),
            name: "test-service".to_string(),
            host: "localhost".to_string(),
            port: 8080,
            health: crate::service_discovery::ServiceHealth::Healthy,
            metadata: HashMap::new(),
        };

        // Register the service
        registry.register_service(instance.clone()).await.unwrap();

        // Retrieve the service
        let retrieved_instances = registry.get_service_instances("test-service").await;
        assert_eq!(retrieved_instances.len(), 1);
        assert_eq!(retrieved_instances[0].id, "test-instance");
    }
}