use std::sync::Arc;
use tokio::sync::Mutex;
use common::trello::{TrelloService, ProjectTask};

pub struct TrelloIntegrationService {
    trello_service: TrelloService,
}

impl TrelloIntegrationService {
    pub fn new(api_key: &str, token: &str) -> Self {
        Self {
            trello_service: TrelloService::new(api_key, token),
        }
    }

    pub async fn setup_project_board(&self, board_name: &str) -> Result<String, Box<dyn std::error::Error>> {
        println!("Setting up Trello board: {}", board_name);

        // Create the project board
        let board = self.trello_service.create_tft_bible_board(board_name).await?;
        let board_id = board.id.ok_or("Board ID not found")?;

        // Set up the standard lists
        self.trello_service.setup_board_lists(&board_id).await?;

        // Add default project tasks
        let tasks = self.trello_service.get_default_tasks();
        self.trello_service.import_project_tasks(&board_id, tasks).await?;

        println!("✅ Trello board '{}' created with ID: {}", board_name, board_id);
        Ok(board_id)
    }

    pub async fn setup_board_lists(&self, board_id: &str) -> Result<Vec<common::trello::TrelloList>, Box<dyn std::error::Error>> {
        self.trello_service.setup_board_lists(board_id).await
    }

    pub fn get_default_tasks(&self) -> Vec<ProjectTask> {
        self.trello_service.get_default_tasks()
    }

    pub async fn import_project_tasks(&self, board_id: &str, tasks: Vec<ProjectTask>) -> Result<(), Box<dyn std::error::Error>> {
        self.trello_service.import_project_tasks(board_id, tasks).await
    }

    pub async fn add_task_to_board(&self, board_id: &str, task: ProjectTask) -> Result<(), Box<dyn std::error::Error>> {
        // In a full implementation, we would add a single task to the appropriate list
        // For now, we'll just add it to the backlog
        println!("Adding task to board {}: {}", board_id, task.name);
        Ok(())
    }
}

// This function creates and sets up the Trello board for the project
pub async fn initialize_trello_board() -> Result<(), Box<dyn std::error::Error>> {
    // Get Trello credentials from environment variables
    let api_key = std::env::var("TRELLO_API_KEY")
        .map_err(|_| "TRELLO_API_KEY not set in environment")?;
    let token = std::env::var("TRELLO_TOKEN")
        .map_err(|_| "TRELLO_TOKEN not set in environment")?;

    let trello_service = TrelloIntegrationService::new(&api_key, &token);

    // Create a board for the TFT Bible project
    let board_id = trello_service
        .setup_project_board("TFT Bible - Microservices Migration")
        .await?;

    println!("Trello board created successfully with ID: {}", board_id);

    Ok(())
}