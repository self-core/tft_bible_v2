# Mock Server for TFT Bible

This is a mock API server for TFT Bible frontend development that simulates the real API endpoints.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. (Optional) Update the CORS origins in `.env` if needed:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## Running the server

Production mode:
```bash
npm start
```

Development mode (with auto-restart on changes):
```bash
npm run dev
```

The server will run on port 8080 by default.

## Endpoints

- GET `/api/v1/compositions` - Get paginated list of compositions
- GET `/api/v1/compositions/:id` - Get specific composition
- GET `/api/v1/champions` - Get paginated list of champions
- GET `/api/v1/champions/:id` - Get specific champion
- GET `/api/v1/items` - Get paginated list of items
- GET `/api/v1/items/:id` - Get specific item
- GET `/api/v1/health` - Health check

## CORS Configuration

The server allows CORS requests from:
- `http://localhost:3000` (Vite default)
- `http://localhost:5173` (common Vite port)
- Additional origins can be configured via the `CORS_ORIGIN` environment variable