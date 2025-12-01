# TFT Bible v2 - Microservices Architecture

A comprehensive Teamfight Tactics (TFT) companion application built with Rust and modern web technologies using a microservices architecture.

## 🏗️ Architecture

- **Architecture**: Microservices with API Gateway pattern
- **Backend Services**: Multiple Rust services communicating via REST APIs
- **API Gateway**: Centralized routing and cross-cutting concerns
- **Database**: MongoDB for data persistence
- **Service Discovery**: Dynamic service registration and discovery
- **Circuit Breaker**: Resilience pattern for handling service failures
- **Trello Integration**: Project management and task tracking
- **Testing**: Comprehensive unit, integration, and E2E tests
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

### Run Backend Tests in Docker

```bash
# Run all backend tests
docker-compose exec tft-backend cargo test

# Run with coverage
docker-compose exec tft-backend cargo tarpaulin --ignore-tests --out Html

# Run specific test
docker-compose exec tft-backend cargo test test_champion_service
```

### Run Frontend Tests

```bash
# Run all frontend tests
docker-compose exec tft-frontend npm test

# Run tests with coverage
docker-compose exec tft-frontend npm test -- --coverage
```

### Test Structure

- **Backend Unit Tests**: `backend/tests/` - Service layer and business logic testing
- **Frontend Component Tests**: `frontend/src/components/Builder/__tests__/` - UI component testing
- **API Integration Tests**: Coming soon - End-to-end API endpoint validation

### Quality Metrics

- **Code Coverage**: Target 80%+ for critical components
- **Performance**: API response times < 500ms
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Regular vulnerability scans

See full testing documentation in [TESTING.md](TESTING.md).

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

## 🚀 Beta Release - December 3rd, 2025

We're excited to announce that TFT Bible will be entering its beta phase in time for the release of **Lore & Legends (Set 16)** on **December 3rd, 2025**!

### Beta Features
- Interactive TFT team builder with support for Lore & Legends champions and traits
- Modern, responsive UI optimized for composition building
- Comprehensive champion and trait data
- Set management system for easy updates
- Full Docker containerization for easy deployment

### How to Try the Beta
1. Clone the repository
2. Set up environment variables (see `.env.prod.example`)
3. Run with production compose: `docker-compose -f docker-compose.prod.yml up -d`

### Beta Testing Period
- **Start**: November 25, 2025
- **Target Release**: December 3, 2025
- **Feedback**: Issues and suggestions welcome via GitLab issues

## 🔄 Current Status

- ✅ Mock services implemented
- ✅ API endpoints wired
- ✅ Comprehensive test suite
- ✅ Docker development environment
- ✅ Beta-ready frontend with builder component
- ✅ Lore & Legends (Set 16) support
- ✅ CI/CD pipeline with Jenkins
- ✅ Trello integration for project management
- 🚧 Authentication system (planned for post-beta)
- ⚠️ MongoDB integration (beta with mock data)