# Trello Integration for TFT Bible Project

## Overview

This document describes the Trello integration for the TFT Bible project, which allows automatic creation and management of Trello boards for tracking development progress and managing the project knowledge base.

## Setup

### Trello API Credentials

To use the Trello integration, you need to configure API credentials in your environment:

1. Get your Trello API key from: https://trello.com/app-key
2. Generate a token by visiting: `https://trello.com/1/authorize?key=YOUR_API_KEY&name=TFT+Bible+App&expiration=never&response_type=token&scope=read,write`
3. Add these to your `.env` file:

```env
TRELLO_API_KEY=your_api_key_here
TRELLO_TOKEN=your_token_here
```

## API Endpoints

### Create a Board

`POST /api/v1/trello/board`

Request body:
```json
{
  "name": "TFT Bible Development Board"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "board_id": "board_id_here",
    "board_name": "TFT Bible Development Board"
  },
  "message": "Board created successfully",
  "errors": null
}
```

### Setup Board Structure

`POST /api/v1/trello/board/{board_id}/setup`

This endpoint creates the standard lists for the TFT Bible project:
- Backlog
- Sprint Planning
- To Do
- In Progress
- Code Review
- Testing
- Done
- Knowledge Base
- Blocked

### Import Project Tasks

`POST /api/v1/trello/board/{board_id}/import-tasks`

This endpoint imports tasks from the project's TASK_LIST.md into the "Backlog" list on the specified board.

## Board Structure

The Trello board is organized into the following lists:

- **Backlog**: All tasks that need to be done
- **Sprint Planning**: Tasks being considered for the current sprint
- **To Do**: Tasks assigned for the current sprint but not yet started
- **In Progress**: Tasks currently being worked on
- **Code Review**: Tasks completed and awaiting review
- **Testing**: Tasks in testing phase
- **Done**: Completed tasks
- **Knowledge Base**: Important documentation and insights
- **Blocked**: Tasks that are currently blocked by dependencies

## Usage Example

1. Create a board: `POST /api/v1/trello/board` with name "TFT Bible Sprint 1"
2. Set up the structure: `POST /api/v1/trello/board/{board_id}/setup`
3. Import tasks: `POST /api/v1/trello/board/{board_id}/import-tasks`

## Integration with Project Tasks

The system will automatically import tasks from the existing TASK_LIST.md file in the project root, categorizing them by priority and phase. The tasks include:

- Database integration tasks
- Authentication system implementation
- API enhancements
- Frontend development tasks
- System integration tasks
- Advanced features
- Quality and maintenance tasks

## Notes

- The integration uses the Trello REST API to create boards, lists, and cards
- All tasks from the project's task list are imported with appropriate priority labels
- The system checks for required environment variables on startup
- If Trello credentials are not configured, the endpoints will return an error