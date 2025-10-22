use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::config::Config;

#[derive(Debug, Clone)]
pub struct RiotApiClient {
    client: reqwest::Client,
    api_key: String,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SummonerDto {
    pub id: String,
    pub account_id: String,
    pub puuid: String,
    pub name: String,
    pub profile_icon_id: i32,
    pub revision_date: i64,
    pub summoner_level: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchListDto {
    pub match_ids: Vec<String>,
    pub total: i32,
    pub start: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchDto {
    pub metadata: MatchMetadata,
    pub info: MatchInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchMetadata {
    pub data_version: String,
    pub match_id: String,
    pub participants: Vec<String>, // PUUIDs
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchInfo {
    #[serde(rename = "game_datetime")]
    pub game_datetime: i64,
    #[serde(rename = "game_length")]
    pub game_length: f64,
    #[serde(rename = "game_version")]
    pub game_version: String,
    #[serde(rename = "queue_id")]
    pub queue_id: i32,
    #[serde(rename = "tft_game_type")]
    pub tft_game_type: String,
    #[serde(rename = "tft_set_core_name")]
    pub tft_set_core_name: String,
    #[serde(rename = "tft_set_number")]
    pub tft_set_number: i32,
    pub participants: Vec<Participant>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Participant {
    pub companion: Companion,
    #[serde(rename = "gold_left")]
    pub gold_left: i32,
    #[serde(rename = "last_round")]
    pub last_round: String,
    pub level: i32,
    pub placement: i32,
    #[serde(rename = "players_eliminated")]
    pub players_eliminated: i32,
    pub puuid: String,
    #[serde(rename = "time_eliminated")]
    pub time_eliminated: String,
    #[serde(rename = "total_damage_to_players")]
    pub total_damage_to_players: i32,
    pub traits: Vec<Trait>,
    pub units: Vec<Unit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Companion {
    #[serde(rename = "content_ID")]
    pub content_id: String,
    #[serde(rename = "skin_ID")]
    pub skin_id: i32,
    #[serde(rename = "species_ID")]
    pub species_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Trait {
    pub name: String,
    #[serde(rename = "num_units")]
    pub num_units: i32,
    pub style: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Unit {
    #[serde(rename = "character_id")]
    pub character_id: String,
    #[serde(rename = "item_names")]
    pub item_names: Vec<String>,
    pub name: String,
    pub rarity: i32,
    pub tier: i32,
}

impl RiotApiClient {
    pub fn new(config: &Config) -> Option<Self> {
        if let Some(api_key) = &config.riot_api_key {
            Some(RiotApiClient {
                client: reqwest::Client::new(),
                api_key: api_key.clone(),
                base_url: "https://eun1.api.riotgames.com".to_string(), // Default region, can be configurable
            })
        } else {
            log::warn!("RIOT_API_KEY not provided, Riot API client not initialized");
            None
        }
    }

    async fn make_request(&self, endpoint: &str) -> Result<reqwest::Response, reqwest::Error> {
        let url = format!("{}{}", self.base_url, endpoint);
        log::debug!("Making request to: {}", url);

        self.client
            .get(&url)
            .header("X-Riot-Token", &self.api_key)
            .send()
            .await
    }

    pub async fn get_summoner_by_puuid(&self, puuid: &str) -> Result<SummonerDto, reqwest::Error> {
        let endpoint = format!("/tft/summoner/v1/summoners/by-puuid/{}", puuid);
        let response = self.make_request(&endpoint).await?;
        response.json::<SummonerDto>().await
    }

    pub async fn get_summoner_by_summoner_id(&self, summoner_id: &str) -> Result<SummonerDto, reqwest::Error> {
        let endpoint = format!("/tft/summoner/v1/summoners/by-summoner-id/{}", summoner_id);
        let response = self.make_request(&endpoint).await?;
        response.json::<SummonerDto>().await
    }

    pub async fn get_summoner_by_name(&self, name: &str) -> Result<SummonerDto, reqwest::Error> {
        let endpoint = format!("/tft/summoner/v1/summoners/by-name/{}", name);
        let response = self.make_request(&endpoint).await?;
        response.json::<SummonerDto>().await
    }

    pub async fn get_match_ids_by_puuid(
        &self,
        puuid: &str,
        start: Option<i32>,
        count: Option<i32>,
    ) -> Result<MatchListDto, reqwest::Error> {
        let mut endpoint = format!("/tft/match/v1/matches/by-puuid/{}/ids", puuid);
        
        let mut params = Vec::new();
        if let Some(start_val) = start {
            params.push(format!("start={}", start_val));
        }
        if let Some(count_val) = count {
            params.push(format!("count={}", count_val));
        }
        
        if !params.is_empty() {
            endpoint.push('?');
            endpoint.push_str(&params.join("&"));
        }

        let response = self.make_request(&endpoint).await?;
        response.json::<MatchListDto>().await
    }

    pub async fn get_match_by_id(&self, match_id: &str) -> Result<MatchDto, reqwest::Error> {
        let endpoint = format!("/tft/match/v1/matches/{}", match_id);
        let response = self.make_request(&endpoint).await?;
        response.json::<MatchDto>().await
    }

    pub fn with_region(mut self, region: &str) -> Self {
        // Update the base URL based on the region
        // For example: euw1.api.riotgames.com, na1.api.riotgames.com
        self.base_url = format!("https://{}.api.riotgames.com", region);
        self
    }
}