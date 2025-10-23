use std::sync::Arc;
use mongodb::Database;
use rdkafka::config::ClientConfig;

use crate::{
    config::Config,
    queue::{producer::MessageProducer, types::QueueMessage},
    riot_api::RiotApiClient,
    AppState,
};

pub struct TftDataService {
    pub db: Database,
    pub kafka_config: ClientConfig,
    pub config: Config,
    pub riot_client: Option<RiotApiClient>,
}

impl TftDataService {
    pub fn new(app_state: &AppState) -> Self {
        let riot_client = RiotApiClient::new(&app_state.config);
        
        TftDataService {
            db: app_state.db.clone(),
            kafka_config: app_state.kafka_config.clone(),
            config: app_state.config.clone(),
            riot_client,
        }
    }

    pub async fn start_message_producer(&self) -> MessageProducer {
        let producer_config = self.kafka_config
            .clone()
            .set("message.timeout.ms", "5000")
            .set("request.required.acks", "1");
        
        MessageProducer::new(producer_config).expect("Failed to create message producer")
    }

    pub async fn queue_summoner_fetch(&self, summoner_identifier: String, search_type: crate::queue::types::SummonerSearchType) {
        if let Some(ref riot_client) = self.riot_client {
            let producer = self.start_message_producer().await;
            let message = QueueMessage::FetchSummonerData {
                summoner_identifier,
                search_type,
            };
            
            if let Err(e) = producer.send_message(&message).await {
                log::error!("Failed to send summoner fetch message to queue: {}", e);
            } else {
                log::info!("Queued summoner fetch for: {}", message.topic());
            }
        } else {
            log::warn!("Riot API client not initialized, cannot queue summoner fetch");
        }
    }

    pub async fn queue_match_history_fetch(&self, puuid: String, start: Option<i32>, count: Option<i32>) {
        if let Some(ref riot_client) = self.riot_client {
            let producer = self.start_message_producer().await;
            let message = QueueMessage::FetchMatchHistory {
                puuid,
                start,
                count,
            };
            
            if let Err(e) = producer.send_message(&message).await {
                log::error!("Failed to send match history fetch message to queue: {}", e);
            } else {
                log::info!("Queued match history fetch for: {}", message.topic());
            }
        } else {
            log::warn!("Riot API client not initialized, cannot queue match history fetch");
        }
    }

    pub async fn queue_match_details_fetch(&self, match_id: String) {
        if let Some(ref riot_client) = self.riot_client {
            let producer = self.start_message_producer().await;
            let message = QueueMessage::FetchMatchDetails {
                match_id,
            };
            
            if let Err(e) = producer.send_message(&message).await {
                log::error!("Failed to send match details fetch message to queue: {}", e);
            } else {
                log::info!("Queued match details fetch for: {}", message.topic());
            }
        } else {
            log::warn!("Riot API client not initialized, cannot queue match details fetch");
        }
    }

    // Direct API calls (for user-requested data)
    pub async fn get_summoner_by_puuid(&self, puuid: &str) -> Option<crate::riot_api::SummonerDto> {
        if let Some(ref riot_client) = self.riot_client {
            match riot_client.get_summoner_by_puuid(puuid).await {
                Ok(summoner) => {
                    log::info!("Successfully fetched summoner by PUUID: {}", puuid);
                    Some(summoner)
                },
                Err(e) => {
                    log::error!("Failed to fetch summoner by PUUID {}: {}", puuid, e);
                    None
                }
            }
        } else {
            log::warn!("Riot API client not initialized");
            None
        }
    }

    pub async fn get_match_by_id(&self, match_id: &str) -> Option<crate::riot_api::MatchDto> {
        if let Some(ref riot_client) = self.riot_client {
            match riot_client.get_match_by_id(match_id).await {
                Ok(match_data) => {
                    log::info!("Successfully fetched match data: {}", match_id);
                    Some(match_data)
                },
                Err(e) => {
                    log::error!("Failed to fetch match by ID {}: {}", match_id, e);
                    None
                }
            }
        } else {
            log::warn!("Riot API client not initialized");
            None
        }
    }

    pub async fn get_match_ids_by_puuid(&self, puuid: &str, start: Option<i32>, count: Option<i32>) -> Option<crate::riot_api::MatchListDto> {
        if let Some(ref riot_client) = self.riot_client {
            match riot_client.get_match_ids_by_puuid(puuid, start, count).await {
                Ok(matches) => {
                    log::info!("Successfully fetched match list for PUUID: {}", puuid);
                    Some(matches)
                },
                Err(e) => {
                    log::error!("Failed to fetch match list for PUUID {}: {}", puuid, e);
                    None
                }
            }
        } else {
            log::warn!("Riot API client not initialized");
            None
        }
    }
}