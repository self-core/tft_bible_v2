use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;
use std::future::Future;

#[derive(Debug, Clone)]
pub enum CircuitState {
    Closed,
    Open,
    HalfOpen,
}

#[derive(Debug, Clone)]
pub struct CircuitBreaker {
    state: Arc<Mutex<CircuitState>>,
    failure_count: Arc<Mutex<usize>>,
    last_failure_time: Arc<Mutex<Option<Instant>>>,
    max_failures: usize,
    reset_timeout: Duration,
}

#[derive(Debug)]
pub enum CircuitBreakerError<E> {
    Open,
    Inner(E),
}

impl CircuitBreaker {
    pub fn new(max_failures: usize, reset_timeout: Duration) -> Self {
        Self {
            state: Arc::new(Mutex::new(CircuitState::Closed)),
            failure_count: Arc::new(Mutex::new(0)),
            last_failure_time: Arc::new(Mutex::new(None)),
            max_failures,
            reset_timeout,
        }
    }

    pub async fn state(&self) -> CircuitState {
        self.state.lock().await.clone()
    }

    pub async fn call<F, Fut, T, E>(&self, operation: F) -> Result<T, CircuitBreakerError<E>>
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, E>>,
        E: std::error::Error + 'static,
    {
        let current_state = { self.state.lock().await.clone() };

        // Check if we should transition from Open to HalfOpen
        if matches!(current_state, CircuitState::Open) {
            let last_failure = { *self.last_failure_time.lock().await };
            if let Some(last_failure_time) = last_failure {
                if last_failure_time.elapsed() > self.reset_timeout {
                    *self.state.lock().await = CircuitState::HalfOpen;
                    return self.execute_operation(operation).await;
                } else {
                    return Err(CircuitBreakerError::Open);
                }
            } else {
                return Err(CircuitBreakerError::Open);
            }
        }

        self.execute_operation(operation).await
    }

    async fn execute_operation<F, Fut, T, E>(
        &self,
        operation: F,
    ) -> Result<T, CircuitBreakerError<E>>
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, E>>,
        E: std::error::Error + 'static,
    {
        // Get the current state inside the function to avoid duplicating the parameter
        let current_state = { self.state.lock().await.clone() };

        match current_state {
            CircuitState::Closed | CircuitState::HalfOpen => {
                match operation().await {
                    Ok(result) => {
                        // Reset on success if we're in half-open state
                        if matches!(current_state, CircuitState::HalfOpen) {
                            *self.state.lock().await = CircuitState::Closed;
                            *self.failure_count.lock().await = 0;
                            *self.last_failure_time.lock().await = None;
                        }
                        Ok(result)
                    }
                    Err(error) => {
                        // Increment failure counter
                        let mut failure_count = self.failure_count.lock().await;
                        *failure_count += 1;

                        if *failure_count >= self.max_failures {
                            // Transition to open state
                            *self.state.lock().await = CircuitState::Open;
                            *self.last_failure_time.lock().await = Some(Instant::now());
                        }

                        Err(CircuitBreakerError::Inner(error))
                    }
                }
            }
            CircuitState::Open => Err(CircuitBreakerError::Open),
        }
    }
}