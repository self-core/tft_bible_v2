use rdkafka::{
    config::ClientConfig,
    producer::{FutureProducer, FutureRecord},
    util::Timeout,
    error::KafkaError,
};
use serde_json;
use std::time::Duration;

use super::types::QueueMessage;

pub struct MessageProducer {
    producer: FutureProducer,
}

impl MessageProducer {
    pub fn new(config: ClientConfig) -> Result<Self, rdkafka::error::KafkaError> {
        let producer = config
            .create()
            .expect("Failed to create Kafka producer");
        
        Ok(Self { producer })
    }

    pub async fn send_message(&self, message: &QueueMessage) -> Result<(), KafkaError> {
        let payload = serde_json::to_string(message).map_err(|e| {
            KafkaError::ConsumerInstallationError(format!("Serialization error: {}", e))
        })?;

        let record = FutureRecord::to(message.topic())
            .payload(&payload)
            .key(&format!("key_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()));

        self.producer.send(record, Timeout::After(Duration::from_secs(1))).await.map(|_| ()).map_err(|(err, _)| err)
    }

    pub async fn send_batch(&self, messages: Vec<&QueueMessage>) -> Result<(), KafkaError> {
        for message in messages {
            self.send_message(message).await?;
        }
        Ok(())
    }
}