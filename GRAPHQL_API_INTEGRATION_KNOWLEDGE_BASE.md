# GraphQL API Integration Knowledge Base

## Overview
This document provides comprehensive information about the GraphQL API implementation in the TFT Bible v2 project, including schema definitions, resolvers, and client-side usage patterns.

## GraphQL Schema

### Query Types
- `health`: Returns a simple health check string
- `champions(limit: Int)`: Fetches a list of champions with optional limit
- `champion(id: String!)`: Fetches a specific champion by ID
- `traits`: Fetches all available traits
- `items`: Fetches all available items
- `sets`: Fetches all TFT sets
- `compositions(limit: Int, offset: Int)`: Fetches paginated list of compositions
- `composition(id: String!)`: Fetches a specific composition by ID

### Mutation Types
- `trait_tracker(input: TraitTrackerInput!)`: Calculates optimal path to achieve target traits
- `create_composition(input: CreateCompositionInput!)`: Creates a new composition
- `update_composition(id: String!, input: UpdateCompositionInput!)`: Updates an existing composition
- `delete_composition(id: String!)`: Deletes a composition

## Schema Definitions

### Trait Tracker
The trait tracker feature allows users to find the optimal path to acquire target traits:
```
input TraitTrackerInput {
  target_traits: [TraitRequirement!]!
  current_traits: [CurrentTraitInput]
}

input TraitRequirement {
  trait_name: String!
  required_count: Int!
}

input CurrentTraitInput {
  name: String!
  count: Int!
}

type TraitTrackerResponse {
  path: [TraitPath!]!
  efficiency: Float!
}

type TraitPath {
  champion: ChampionType!
  traits_gained: [String!]!
  cost: Int!
  efficiency: Float!
}
```

### Composition Management
Compositions can be created, updated, and deleted through the GraphQL API:
```
input CreateCompositionInput {
  name: String!
  description: String!
  category: String!
  tags: [String!]!
  champions: [CompositionChampionInput!]!
  augments: [String!]!
  positioning: String
  gameplan: String
  meta: CompositionMetaInput!
  matchups: String
}

input UpdateCompositionInput {
  name: String!
  description: String!
  category: String!
  tags: [String!]!
  champions: [CompositionChampionInput!]!
  augments: [String!]!
  positioning: String
  gameplan: String
  meta: CompositionMetaInput!
  matchups: String
}

input CompositionChampionInput {
  champion_id: String!
  star_level: Int!
  items: [String!]!
  position: PositionInput!
  is_core: Boolean!
}

input PositionInput {
  x: Int!
  y: Int!
}

input CompositionMetaInput {
  tier: String!
  difficulty: Int!
  cost: String!
  patch: String!
  playstyle: String!
  winrate: Float!
  avg_placement: Float!
  playrate: Float!
  contest_rate: Float!
}
```

## Backend Implementation

### Core Components
- `src/graphql/schema.rs`: Defines all GraphQL types, queries, and mutations
- `src/graphql/resolvers.rs`: Implements the resolver logic for all queries and mutations
- `src/services/`: Business logic services that GraphQL resolvers depend on
- `src/models.rs`: Internal data models that are converted to GraphQL types

### Database Integration
All GraphQL resolvers connect to MongoDB through the services layer, which provides:
- Type-safe database operations
- Proper error handling
- Efficient data fetching with indexes
- Data validation before storage

### Resolver Implementation Details

#### Trait Tracker Resolver
The trait tracker resolver:
1. Fetches all champions and traits from the database
2. Converts GraphQL input types to internal service types
3. Calls the trait tracker service algorithm
4. Converts the internal result back to GraphQL types
5. Returns the optimal path with efficiency metrics

#### Composition Resolvers
The composition resolvers handle CRUD operations:
- **Query**: Fetches compositions with pagination and filtering
- **Create**: Creates new compositions with validation
- **Update**: Updates existing compositions with authorization
- **Delete**: Removes compositions with authorization

## Frontend Implementation

### Client Setup
The frontend uses Apollo Client for GraphQL operations:
```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: createHttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache()
});
```

### Query and Mutation Patterns
The frontend follows these patterns:
1. Define GraphQL operations using `gql` template literals
2. Use Apollo hooks (`useQuery`, `useMutation`, `useSubscription`)
3. Handle loading and error states appropriately
4. Update local UI state based on mutation results

### Common Operations
#### Getting Started with Queries
```typescript
import { useQuery, gql } from '@apollo/client';

const GET_CHAMPIONS = gql`
  query GetChampions($limit: Int) {
    champions(limit: $limit) {
      id
      name
      cost
      traits
    }
  }
`;

function ChampionList() {
  const { loading, error, data } = useQuery(GET_CHAMPIONS, {
    variables: { limit: 10 }
  });
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return (
    <div>
      {data.champions.map(champion => (
        <div key={champion.id}>{champion.name}</div>
      ))}
    </div>
  );
}
```

#### Working with Mutations
```typescript
import { useMutation, gql } from '@apollo/client';

const CREATE_COMPOSITION = gql`
  mutation CreateComposition($input: CreateCompositionInput!) {
    createComposition(input: $input) {
      id
      name
      description
    }
  }
`;

function CreateCompositionForm() {
  const [createComposition, { loading, error }] = useMutation(CREATE_COMPOSITION);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await createComposition({
        variables: {
          input: {
            name: "My Composition",
            description: "A sample composition",
            // ... other fields
          }
        }
      });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

## Best Practices for Future Development

### Adding New Mutations/Queries
1. Define the schema in `src/graphql/schema.rs`
2. Implement the resolver in `src/graphql/resolvers.rs`
3. Add the operation to the frontend GraphQL file
4. Use the operation in the appropriate component
5. Update this documentation

### Error Handling
- Use appropriate GraphQL error types in resolvers
- Handle loading states in the frontend
- Provide meaningful error messages to users
- Log errors for debugging in the backend

### Performance Considerations
- Use proper database indexing
- Implement pagination for large datasets
- Optimize queries to avoid over-fetching
- Use Apollo Client's caching effectively

### Security
- Always validate input parameters
- Implement proper authentication where needed
- Sanitize user inputs
- Prevent injection attacks

## Testing GraphQL API

### Backend Testing
- Unit tests for individual resolvers
- Integration tests for API endpoints
- Mock database operations for faster testing

### Frontend Testing
- Component tests with GraphQL mocks
- End-to-end tests for critical workflows
- Mock Apollo Client for isolated component testing

## Troubleshooting Common Issues

### Schema Mismatch
- Ensure frontend and backend schemas are in sync
- Check type conversions between internal models and GraphQL types
- Verify field names match between client and server

### Database Connection Issues
- Verify MongoDB connection string in environment variables
- Check database indexing for performance issues
- Review connection pooling configuration

### Apollo Client Caching Issues
- Verify cache updates after mutations
- Use `refetchQueries` or `update` functions when needed
- Implement proper cache invalidation strategies

This knowledge base should be updated whenever significant changes are made to the GraphQL API implementation.