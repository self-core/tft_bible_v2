use rdkafka::{
    config::ClientConfig,
    consumer::{StreamConsumer, Consumer, CommitMode},
    message::Message,
    Message as KafkaMessage,
};
use serde_json;
use tokio::task;
use mongodb::Database;
use std::sync::Arc;

use super::types::QueueMessage;
use crate::riot_api::RiotApiClient;

pub struct MessageConsumer {
    consumer: StreamConsumer,
    db: Database,
    riot_client: Option<RiotApiClient>,
}

impl MessageConsumer {
    pub fn new(config: ClientConfig, db: Database, riot_client: Option<RiotApiClient>) -> Result<Self, rdkafka::error::KafkaError> {
        let consumer: StreamConsumer = config
            .set("group.id", "tft_api_consumer_group")
            .set("enable.partition.eof", "false")
            .set("session.timeout.ms", "6000")
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "earliest")
            .create()?;

        Ok(Self { 
            consumer,
            db,
            riot_client,
        })
    }

    pub fn start_consuming(&self, topics: &[&str]) -> Result<(), rdkafka::error::KafkaError> {
        self.consumer.subscribe(topics)?;

        log::info!("Starting Kafka consumer for topics: {:?}", topics);

        loop {
            match self.consumer.recv() {
                Err(e) => log::error!("Kafka error: {}", e),
                Ok(m) => {
                    match serde_json::from_slice::<QueueMessage>(m.payload().unwrap()) {
                        Ok(message) => {
                            log::info!("Received message: {:?}", message);
                            
                            // Handle the message in a separate task to avoid blocking
                            let consumer_clone = self.consumer.clone();
                            let db_clone = self.db.clone();
                            let riot_client_clone = self.riot_client.clone();
                            
                            task::spawn(async move {
                                Self::process_message(message, db_clone, riot_client_clone).await;
                                
                                // Commit message after processing
                                if let Err(e) = consumer_clone.commit_message(&m, CommitMode::Async) {
                                    log::error!("Failed to commit message: {}", e);
                                }
                            });
                        }
                        Err(e) => {
                            log::error!("Failed to deserialize message: {}", e);
                        }
                    }
                }
            }
        }
    }

    async fn process_message(message: QueueMessage, db: Database, riot_client: Option<RiotApiClient>) {
        if let Some(client) = riot_client {
            match message {
                QueueMessage::FetchMatchHistory { puuid, start, count } => {
                    log::info!("Processing FetchMatchHistory for PUUID: {}, start: {:?}, count: {:?}", puuid, start, count);
                    
                    match client.get_match_ids_by_puuid(&puuid, start, count).await {
                        Ok(match_list) => {
                            log::info!("Successfully fetched {} matches for PUUID: {}", match_list.match_ids.len(), puuid);
                            
                            // Queue individual match detail fetches
                            for match_id in match_list.match_ids {
                                let match_fetch_msg = super::types::QueueMessage::FetchMatchDetails {
                                    match_id,
                                };
                                
                                // In a real implementation, we'd send this to a producer
                                // For now, we'll just log it
                                log::info!("Would queue match detail fetch for: {}", match_fetch_msg.topic());
                            }
                        },
                        Err(e) => {
                            log::error!("Failed to fetch match history for PUUID {}: {}", puuid, e);
                        }
                    }
                },
                QueueMessage::FetchMatchDetails { match_id } => {
                    log::info!("Processing FetchMatchDetails for match: {}", match_id);
                    
                    match client.get_match_by_id(&match_id).await {
                        Ok(match_data) => {
                            log::info!("Successfully fetched match data: {}", match_data.metadata.match_id);
                            
                            // TODO: Save match data to database
                            Self::save_match_to_db(&db, &match_data).await;
                        },
                        Err(e) => {
                            log::error!("Failed to fetch match details for {}: {}", match_id, e);
                        }
                    }
                },
                QueueMessage::FetchSummonerData { summoner_identifier, search_type } => {
                    log::info!("Processing FetchSummonerData for {} using {:?}", summoner_identifier, search_type);
                    
                    let result = match search_type {
                        super::types::SummonerSearchType::Puuid => {
                            client.get_summoner_by_puuid(&summoner_identifier).await
                        },
                        super::types::SummonerSearchType::SummonerId => {
                            client.get_summoner_by_summoner_id(&summoner_identifier).await
                        },
                        super::types::SummonerSearchType::SummonerName => {
                            client.get_summoner_by_name(&summoner_identifier).await
                        },
                    };
                    
                    match result {
                        Ok(summoner) => {
                            log::info!("Successfully fetched summoner: {}", summoner.name);
                            
                            // TODO: Save summoner data to database
                            Self::save_summoner_to_db(&db, &summoner).await;
                        },
                        Err(e) => {
                            log::error!("Failed to fetch summoner data for {}: {}", summoner_identifier, e);
                        }
                    }
                },
                QueueMessage::ProcessTournamentData { tournament_code } => {
                    log::info!("Processing ProcessTournamentData for tournament: {}", tournament_code);
                    // TODO: Implement actual tournament data processing logic
                },
                QueueMessage::RefreshTftSets {} => {
                    log::info!("Processing RefreshTftSets");
                    // TODO: Implement actual TFT sets refresh logic
                },
            }
        } else {
            log::error!("Riot API client not available for processing message");
        }
    }

    async fn save_summoner_to_db(db: &Database, summoner: &crate::riot_api::SummonerDto) {
        use crate::models::RiotSummoner;
        use chrono::Utc;
        use bson::oid::ObjectId;

        let collection = db.collection::<RiotSummoner>("riot_summoners");
        
        // Create our internal summoner model from the Riot API data
        let summoner_doc = RiotSummoner {
            id: Some(ObjectId::new()),
            summoner_id: summoner.id.clone(),
            account_id: summoner.account_id.clone(),
            puuid: summoner.puuid.clone(),
            name: summoner.name.clone(),
            profile_icon_id: summoner.profile_icon_id,
            revision_date: {
                // Convert the Riot timestamp to chrono::DateTime
                let secs = summoner.revision_date / 1000; // Riot timestamp is in milliseconds
                let nsecs = ((summoner.revision_date % 1000) * 1_000_000) as u32;
                chrono::DateTime::from_timestamp(secs, nsecs).unwrap_or_else(|| Utc::now())
            },
            summoner_level: summoner.summoner_level,
            region: "eun1".to_string(), // Default region - this would come from the config in a real implementation
            last_updated: Utc::now(),
            created_at: Utc::now(),
        };

        match collection.replace_one(
            mongodb::bson::doc! { "puuid": &summoner_doc.puuid },
            &summoner_doc,
            mongodb::options::ReplaceOptions::builder().upsert(true).build(),
        ).await {
            Ok(result) => {
                if result.upserted_id.is_some() {
                    log::info!("New summoner saved to database: {}", summoner_doc.name);
                } else {
                    log::info!("Existing summoner updated in database: {}", summoner_doc.name);
                }
            },
            Err(e) => {
                log::error!("Failed to save summoner to database: {}", e);
            }
        }
    }

    async fn save_match_to_db(db: &Database, match_data: &crate::riot_api::MatchDto) {
        use crate::models::{RiotMatch, RiotMatchParticipant, RiotMatchTrait, RiotMatchUnit};
        use chrono::Utc;
        use bson::oid::ObjectId;

        let collection = db.collection::<RiotMatch>("riot_matches");
        
        // Convert the Riot match data to our internal model
        let participants: Vec<RiotMatchParticipant> = match_data.info.participants.iter().map(|p| {
            let traits: Vec<RiotMatchTrait> = p.traits.iter().map(|t| RiotMatchTrait {
                name: t.name.clone(),
                num_units: t.num_units,
                style: t.style,
            }).collect();
            
            let units: Vec<RiotMatchUnit> = p.units.iter().map(|u| RiotMatchUnit {
                character_id: u.character_id.clone(),
                item_names: u.item_names.clone(),
                name: u.name.clone(),
                rarity: u.rarity,
                tier: u.tier,
                is_alternative: false, // Would need more context to determine this
            }).collect();
            
            RiotMatchParticipant {
                puuid: p.puuid.clone(),
                companion: serde_json::to_string(&p.companion).unwrap_or_default(),
                gold_left: p.gold_left,
                last_round: p.last_round.clone(),
                level: p.level,
                placement: p.placement,
                players_eliminated: p.players_eliminated,
                time_eliminated: p.time_eliminated.clone(),
                total_damage_to_players: p.total_damage_to_players,
                traits,
                units,
                summoner_id: None, // Will be populated later when we link to summoners
            }
        }).collect();

        let match_doc = RiotMatch {
            id: Some(ObjectId::new()),
            match_id: match_data.metadata.match_id.clone(),
            data_version: match_data.metadata.data_version.clone(),
            game_datetime: {
                // Convert Riot timestamp to chrono::DateTime
                let secs = match_data.info.game_datetime / 1000; // Riot timestamp is in milliseconds
                let nsecs = ((match_data.info.game_datetime % 1000) * 1_000_000) as u32;
                chrono::DateTime::from_timestamp(secs, nsecs).unwrap_or_else(|| Utc::now())
            },
            game_length: match_data.info.game_length,
            game_version: match_data.info.game_version.clone(),
            queue_id: match_data.info.queue_id,
            tft_game_type: match_data.info.tft_game_type.clone(),
            tft_set_core_name: match_data.info.tft_set_core_name.clone(),
            tft_set_number: match_data.info.tft_set_number,
            participants,
            region: "eun1".to_string(), // Default region
            fetched_at: Utc::now(),
            created_at: Utc::now(),
        };

        match collection.replace_one(
            mongodb::bson::doc! { "match_id": &match_doc.match_id },
            &match_doc,
            mongodb::options::ReplaceOptions::builder().upsert(true).build(),
        ).await {
            Ok(result) => {
                if result.upserted_id.is_some() {
                    log::info!("New match saved to database: {}", match_doc.match_id);
                } else {
                    log::info!("Existing match updated in database: {}", match_doc.match_id);
                }
            },
            Err(e) => {
                log::error!("Failed to save match to database: {}", e);
            }
        }
    }

    pub fn create_stream(&self) -> rdkafka::consumer::StreamConsumer {
        self.consumer.clone()
    }
}