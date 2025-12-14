use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub struct TrelloClient {
    api_key: String,
    token: String,
    client: reqwest::Client,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TrelloBoard {
    pub id: Option<String>,
    pub name: String,
    pub desc: Option<String>,
    pub closed: Option<bool>,
    pub id_organization: Option<String>,
    pub id_board_source: Option<String>,
    pub keep_from_source: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TrelloList {
    pub id: Option<String>,
    pub name: String,
    pub id_board: String,
    pub pos: Option<f64>,
    pub closed: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TrelloCard {
    pub id: Option<String>,
    pub name: String,
    pub desc: Option<String>,
    pub id_list: String,
    pub id_members: Option<Vec<String>>,
    pub id_labels: Option<Vec<String>>,
    pub due: Option<String>, // ISO 8601 date string
    pub pos: Option<f64>,
    pub closed: Option<bool>,
}

#[derive(Debug)]
pub struct TrelloService {
    client: TrelloClient,
}

#[derive(Debug)]
pub struct ProjectTask {
    pub name: String,
    pub description: String,
    pub priority: String,  // "high", "medium", "low"
    pub due: Option<String>,
}

impl TrelloClient {
    pub fn new(api_key: &str, token: &str) -> Self {
        // In the .env file, TRELLO_API_KEY is actually the token
        // So we'll use the token parameter as the API key and the API key as the token
        // Wait, that's not right. Let me check the actual structure:
        // The Trello URL format is: https://api.trello.com/1/boards?key=API_KEY&token=OAUTH_TOKEN
        // So api_key should come from TRELLO_API_KEY, and token should come from TRELLO_TOKEN
        // But based on your previous message, TRELLO_API_KEY IS the token
        // This means TRELLO_TOKEN is not needed

        // Actually, based on the format, the URL is: https://api.trello.com/1/boards?key=API_KEY&token=OAUTH_TOKEN
        // So we DO need both the API key AND the token
        // The API key is from the app (from trello.com/app-key)
        // The token is the user's authentication token
        Self {
            api_key: api_key.to_string(),
            token: token.to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn build_url(&self, endpoint: &str) -> String {
        format!("https://api.trello.com/1{}?key={}&token={}", endpoint, self.api_key, self.token)
    }

    pub async fn create_board(&self, board: &TrelloBoard) -> Result<TrelloBoard, Box<dyn std::error::Error>> {
        let mut params = HashMap::new();
        params.insert("name", board.name.clone());

        if let Some(desc) = &board.desc {
            params.insert("desc", desc.clone());
        }

        if let Some(id_org) = &board.id_organization {
            params.insert("idOrganization", id_org.clone());
        }

        let url = self.build_url("/boards/");

        let response = self.client
            .post(&url)
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Trello API error: {}", response.status()).into());
        }

        let created_board: TrelloBoard = response
            .json()
            .await?;

        Ok(created_board)
    }

    pub async fn create_list(&self, list: &TrelloList) -> Result<TrelloList, Box<dyn std::error::Error>> {
        let mut params = HashMap::new();
        params.insert("name", list.name.clone());
        params.insert("idBoard", list.id_board.clone());

        if let Some(pos) = list.pos {
            params.insert("pos", pos.to_string());
        }

        let url = self.build_url("/lists/");

        let response = self.client
            .post(&url)
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Trello API error: {}", response.status()).into());
        }

        let created_list: TrelloList = response
            .json()
            .await?;

        Ok(created_list)
    }

    pub async fn create_card(&self, card: &TrelloCard) -> Result<TrelloCard, Box<dyn std::error::Error>> {
        let mut params = HashMap::new();
        params.insert("name", card.name.clone());
        params.insert("idList", card.id_list.clone());

        if let Some(desc) = &card.desc {
            params.insert("desc", desc.clone());
        }

        if let Some(due) = &card.due {
            params.insert("due", due.clone());
        }

        if let Some(pos) = card.pos {
            params.insert("pos", pos.to_string());
        }

        let url = self.build_url("/cards/");

        let response = self.client
            .post(&url)
            .form(&params)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Trello API error: {}", response.status()).into());
        }

        let created_card: TrelloCard = response
            .json()
            .await?;

        Ok(created_card)
    }

    pub async fn get_board_lists(&self, board_id: &str) -> Result<Vec<TrelloList>, Box<dyn std::error::Error>> {
        let url = self.build_url(&format!("/boards/{}/lists", board_id));

        let response = self.client
            .get(&url)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Trello API error: {}", response.status()).into());
        }

        let lists: Vec<TrelloList> = response
            .json()
            .await?;

        Ok(lists)
    }

    pub async fn get_list_cards(&self, list_id: &str) -> Result<Vec<TrelloCard>, Box<dyn std::error::Error>> {
        let url = self.build_url(&format!("/lists/{}/cards", list_id));

        let response = self.client
            .get(&url)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Trello API error: {}", response.status()).into());
        }

        let cards: Vec<TrelloCard> = response
            .json()
            .await?;

        Ok(cards)
    }
}

impl TrelloService {
    pub fn new(api_key: &str, token: &str) -> Self {
        Self {
            client: TrelloClient::new(api_key, token),
        }
    }

    pub async fn create_tft_bible_board(&self, board_name: &str) -> Result<TrelloBoard, Box<dyn std::error::Error>> {
        let board = TrelloBoard {
            id: None,
            name: board_name.to_string(),
            desc: Some("TFT Bible Project - Development and Progress Tracking".to_string()),
            closed: None,
            id_organization: None,
            id_board_source: None,
            keep_from_source: None,
        };

        let created_board = self.client.create_board(&board).await?;
        Ok(created_board)
    }

    pub async fn setup_board_lists(&self, board_id: &str) -> Result<Vec<TrelloList>, Box<dyn std::error::Error>> {
        let list_names = vec![
            "Backlog",
            "Sprint Planning",
            "To Do",
            "In Progress",
            "Code Review",
            "Testing",
            "Done",
            "Knowledge Base",
            "Blocked"
        ];

        let mut created_lists = Vec::new();

        for (i, list_name) in list_names.iter().enumerate() {
            let list = TrelloList {
                id: None,
                name: list_name.to_string(),
                id_board: board_id.to_string(),
                pos: Some(i as f64),
                closed: None,
            };

            let created_list = self.client.create_list(&list).await?;
            created_lists.push(created_list);
        }

        Ok(created_lists)
    }

    pub async fn import_project_tasks(&self, board_id: &str, tasks: Vec<ProjectTask>) -> Result<(), Box<dyn std::error::Error>> {
        // Get the lists on the board
        let lists = self.client.get_board_lists(board_id).await?;

        // Find the "Backlog" list where we'll add project tasks
        let backlog_list = lists.iter()
            .find(|list| list.name == "Backlog")
            .ok_or("Backlog list not found")?;

        for (i, task) in tasks.iter().enumerate() {
            let card = TrelloCard {
                id: None,
                name: task.name.clone(),
                desc: Some(task.description.clone()),
                id_list: backlog_list.id.clone().unwrap_or_default(),
                id_members: None,
                id_labels: Some(vec![task.priority.clone()]), // Use priority as label
                due: task.due.clone(),
                pos: Some(i as f64),
                closed: None,
            };

            self.client.create_card(&card).await?;
        }

        Ok(())
    }

    pub fn get_default_tasks(&self) -> Vec<ProjectTask> {
        vec![
            ProjectTask {
                name: "Implement MongoDB integration for compositions".to_string(),
                description: "Replace mock data with actual MongoDB integration for compositions module".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement MongoDB integration for champions".to_string(),
                description: "Replace mock data with actual MongoDB integration for champions module".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement MongoDB integration for items".to_string(),
                description: "Replace mock data with actual MongoDB integration for items module".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement authentication system".to_string(),
                description: "Create JWT-based authentication system with user registration and login endpoints".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement frontend save functionality".to_string(),
                description: "Implement save functionality for compositions in the Builder component".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement augments module".to_string(),
                description: "Create backend endpoints and services for TFT augments".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement sets module".to_string(),
                description: "Create backend endpoints and services for TFT sets".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Riot API integration".to_string(),
                description: "Implement integration with Riot Games API for live data".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Implement voting API calls".to_string(),
                description: "Connect frontend voting functionality to backend API".to_string(),
                priority: "low".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Microservices architecture refactoring".to_string(),
                description: "Refactor monolith into microservices with proper communication protocols".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "TFT API Gateway implementation".to_string(),
                description: "Implement API gateway for request routing and cross-cutting concerns".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Service discovery and circuit breaker".to_string(),
                description: "Implement service discovery and circuit breaker patterns for resilience".to_string(),
                priority: "high".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Unit and E2E testing for microservices".to_string(),
                description: "Implement comprehensive testing for all microservices".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Docker and Kubernetes deployment".to_string(),
                description: "Containerize services and implement deployment orchestration".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Performance optimization and caching".to_string(),
                description: "Implement caching and performance optimization for high-load scenarios".to_string(),
                priority: "medium".to_string(),
                due: None,
            },
            ProjectTask {
                name: "Monitoring and observability setup".to_string(),
                description: "Implement logging, metrics, and distributed tracing".to_string(),
                priority: "low".to_string(),
                due: None,
            },
        ]
    }
}