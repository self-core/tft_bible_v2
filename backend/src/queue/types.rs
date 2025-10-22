use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum QueueMessage {
    FetchMatchHistory {
        puuid: String,
        start: Option<i32>,
        count: Option<i32>,
    },
    FetchMatchDetails {
        match_id: String,
    },
    FetchSummonerData {
        summoner_identifier: String, // could be puuid, summoner id, or summoner name
        search_type: SummonerSearchType,
    },
    ProcessTournamentData {
        tournament_code: String,
    },
    RefreshTftSets {},
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SummonerSearchType {
    Puuid,
    SummonerId,
    SummonerName,
}

impl QueueMessage {
    pub fn topic(&self) -> &'static str {
        match self {
            QueueMessage::FetchMatchHistory { .. } => "tft.fetch.match_history",
            QueueMessage::FetchMatchDetails { .. } => "tft.fetch.match_details",
            QueueMessage::FetchSummonerData { .. } => "tft.fetch.summoner",
            QueueMessage::ProcessTournamentData { .. } => "tft.process.tournament",
            QueueMessage::RefreshTftSets { .. } => "tft.refresh.sets",
        }
    }
}