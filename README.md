# TFT Bible v2

A comprehensive Teamfight Tactics (TFT) companion application built with Rust and modern web technologies.

## 🏗️ Architecture

- **Backend**: Rust with Axum web framework
- **Database**: MongoDB for data persistence
- **Testing**: Comprehensive unit and integration tests
- **Development**: Docker-based development environment

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://gitlab.com/puppets-dev/tft_bible_v2.git
   cd tft_bible_v2
   ```

2. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the Rust backend in a Docker container
   - Start MongoDB with development data
   - Enable hot reloading for development

3. **Access the API**
   - API: http://localhost:8080
   - Health check: http://localhost:8080/api/v1/health
   - MongoDB: localhost:27017 (admin/password)

### Available Endpoints

#### Compositions
- `GET /api/v1/compositions` - List compositions with filtering
- `GET /api/v1/compositions/:id` - Get composition by ID
- `POST /api/v1/compositions` - Create composition (mock mode)
- `PUT /api/v1/compositions/:id` - Update composition (mock mode)
- `DELETE /api/v1/compositions/:id` - Delete composition (mock mode)
- `POST /api/v1/compositions/:id/vote` - Vote on composition (mock mode)

#### Champions
- `GET /api/v1/champions` - List champions with filtering
- `GET /api/v1/champions/:id` - Get champion by ID
- `GET /api/v1/champions/trait/:trait` - Get champions by trait

#### Items
- `GET /api/v1/items` - List items with filtering
- `GET /api/v1/items/:id` - Get item by ID
- `GET /api/v1/items/recommendations/:champion_id` - Get item recommendations

#### Search
- `GET /api/v1/search?q=query` - Search across all entities

#### Health
- `GET /api/v1/health` - API health check

## 🧪 Testing

### Run Tests in Docker

```bash
# Run all tests
docker-compose exec tft-backend cargo test

# Run with coverage
docker-compose exec tft-backend cargo tarpaulin --ignore-tests --out Html

# Run specific test
docker-compose exec tft-backend cargo test test_champion_service
```

### Test Structure

- **Unit Tests**: `backend/tests/unit/` - Service layer testing
- **Integration Tests**: `backend/tests/integration/` - API endpoint testing
- **Common**: `backend/tests/common/` - Test utilities and helpers

## 🛠️ Development

### Adding New Features

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and add tests
3. Run tests: `docker-compose exec tft-backend cargo test`
4. Commit and push: `git push origin feature/your-feature`
5. Create merge request to `dev` branch

### Code Quality

- **Linting**: `cargo clippy`
- **Formatting**: `cargo fmt`
- **Testing**: `cargo test`
- **Coverage**: `cargo tarpaulin`

### Environment Variables

```bash
# Database
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=tft_bible_dev

# Server
PORT=8080

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📁 Project Structure

```
tft_bible_v2/
├── backend/                    # Rust backend
│   ├── src/
│   │   ├── handlers/          # API route handlers
│   │   ├── services/          # Business logic services
│   │   ├── models.rs          # Data models and DTOs
│   │   ├── errors.rs          # Error types
│   │   ├── config.rs          # Configuration
│   │   └── main.rs            # Application entry point
│   ├── tests/                 # Test suite
│   │   ├── unit/             # Unit tests
│   │   ├── integration/      # Integration tests
│   │   └── common/           # Test utilities
│   ├── Dockerfile            # Docker build
│   ├── .dockerignore         # Docker ignore file
│   └── docker-entrypoint-initdb.d/  # MongoDB init scripts
├── docker-compose.yml        # Development environment
├── .github/workflows/        # CI/CD pipelines
└── CONTRIBUTING.md           # Development guidelines
```

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Current Status

- ✅ Mock services implemented
- ✅ API endpoints wired
- ✅ Comprehensive test suite
- ✅ Docker development environment
- ✅ CI/CD pipeline
- 🚧 MongoDB integration (planned)
- 🚧 Authentication system (planned)
- 🚧 Frontend application (planned)