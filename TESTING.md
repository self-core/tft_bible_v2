# TFT Bible - Testing Strategy and Quality Metrics

## Overview
This document outlines the testing strategy, implementation, and quality metrics for the TFT Bible application. The goal is to ensure the application is robust, reliable, and ready for the December 3rd release of Lore & Legends (Set 16).

## Testing Strategy

### Testing Types
1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test interactions between components/modules
3. **End-to-End (E2E) Tests** - Test complete user workflows
4. **API Tests** - Test backend endpoints
5. **UI Tests** - Test frontend components and interactions

### Quality Metrics
- Code coverage: Target 80%+ for critical components
- Performance: API response times < 500ms
- Accessibility: WCAG 2.1 AA compliance
- Security: No critical vulnerabilities

## Backend Testing (Rust)

### Unit Tests
Located in `backend/tests/unit/`

Testing individual service functions:
- ChampionService
- TraitService
- SetService
- CompositionService
- Riot APIClient

### Integration Tests
Located in `backend/tests/integration/`

Testing API endpoints:
- Sets endpoints
- Champions endpoints
- Traits endpoints
- Compositions endpoints
- Health check endpoint

### Test Commands
```bash
# Run all tests
cargo test

# Run tests with coverage
cargo tarpaulin --out Html

# Run specific test
cargo test test_champion_service
```

### Example Test Structure
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio;

    #[tokio::test]
    async fn test_get_champions() {
        // Test implementation
    }
}
```

## Frontend Testing (React)

### Unit Tests
Located in `frontend/src/__tests__/` or alongside components

Testing individual component functions and hooks:
- Builder component rendering
- State management functions
- API service functions
- Utility functions

### Component Tests
Using React Testing Library:
- Component rendering
- User interactions
- State changes
- API mocks

### Example Test Implementation
```typescript
// Example test for the Builder component
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '../components/Builder/Builder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests
    },
  },
});

describe('Builder Component', () => {
  beforeEach(() => {
    // Mock API responses
    jest.spyOn(require('../lib/api'), 'api').mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({
        data: [],
      }),
    }));
  });

  test('renders the builder component', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
  });
});
```

## API Testing

### Endpoint Tests
Testing all API endpoints for:
- Correct HTTP status codes
- Valid response structures
- Error handling
- Input validation

### Tools
- `cargo test` for Rust backend
- `jest` for frontend API tests
- Postman collections for manual testing

## Quality Metrics Implementation

### Code Coverage
```bash
# Backend coverage
cargo install cargo-tarpaulin
cargo tarpaulin --out Html

# Frontend coverage
npm test -- --coverage
```

### Linting
```bash
# Backend linting
cargo clippy

# Frontend linting
npm run lint
```

### Formatting
```bash
# Backend formatting
cargo fmt

# Frontend formatting
npm run format  # If configured
```

## Testing Implementation

### Backend Tests
Let's implement a basic test structure in the backend:

```rust
// backend/tests/unit/champion_service_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::champions::ChampionService;
    use mongodb::{Client, Database};
    use tokio;

    async fn setup_test_db() -> Database {
        let client = Client::with_uri_str("mongodb://localhost:27017").await.unwrap();
        client.database("tft_test")
    }

    #[tokio::test]
    async fn test_get_champions() {
        let db = setup_test_db().await;
        let service = ChampionService::new(&db);
        
        let result = service.get_all_champions(&Default::default()).await;
        assert!(result.is_ok());
    }
}
```

### Frontend Tests
Let's implement a basic test for the Builder component:

```typescript
// frontend/src/components/Builder/__tests__/Builder.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mock, vi } from 'vitest';
import Builder from '../Builder';

// Mock the API
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Builder Component', () => {
  beforeEach(() => {
    (require('../../../lib/api').api.get as Mock).mockResolvedValue({
      data: [],
    });
  });

  test('renders the builder component with loading state', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders the builder component with data', async () => {
    (require('../../../lib/api').api.get as Mock).mockResolvedValueOnce({
      data: [
        { id: 'set1', name: 'Lore & Legends', version: '15.1' }
      ],
    }).mockResolvedValueOnce({
      data: [
        { id: 'champ1', name: 'Ahri', cost: 2, traits: ['Sorcerer'], image: '/ahri.jpg' }
      ],
    }).mockResolvedValueOnce({
      data: [
        { id: 'trait1', name: 'Sorcerer', tiers: [{ minUnits: 3, maxUnits: 5, style: 1 }] }
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TFT Team Builder')).toBeInTheDocument();
    });
  });
});
```

## Test Coverage Goals

### Backend Coverage Targets
- Core services: 90%+
- API handlers: 85%+
- Models: 80%+
- Utilities: 75%+

### Frontend Coverage Targets
- Components: 85%+
- Services: 80%+
- Hooks: 85%+
- Utils: 75%+

## Continuous Testing

### CI Integration
Tests run automatically in the Jenkins pipeline:
1. Unit tests run in parallel
2. Coverage reports generated
3. Fail builds if coverage falls below threshold
4. Security scans performed

### Local Development
- Pre-commit hooks run basic tests
- Fast feedback for developers
- Integration with IDE testing

## Testing Tools and Libraries

### Backend (Rust)
- `tokio::test` - Async testing
- `serde_json` - JSON testing
- `assert_json_diff` - JSON comparison
- `rstest` - Parameterized tests (if needed)

### Frontend (React)
- Vitest - Fast test runner
- React Testing Library - Component testing
- MSW (Mock Service Worker) - API mocking
- React Hook Testing Library - Hook testing
- Playwright - E2E testing (future)

## Performance Testing

### Backend Performance Tests
- Endpoint response times
- Database query performance
- Concurrent request handling
- Memory usage

### Frontend Performance Tests
- Component render times
- Bundle size optimization
- API call efficiency
- Memory leaks

## Security Testing

### Backend
- Input validation tests
- Authentication bypass attempts
- SQL injection prevention
- Rate limiting verification

### Frontend
- XSS prevention tests
- Sanitized output rendering
- Secure API communication
- Environment variable protection

## Accessibility Testing

- Automated checks with axe-core
- Keyboard navigation verification
- Screen reader compatibility
- Color contrast compliance

## Documentation Tests

- Example code snippets tested
- API documentation verified
- Configuration examples validated
- Deployment instructions tested