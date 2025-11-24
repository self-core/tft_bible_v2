# GraphQL API Integration Knowledge Base

## Overview

This document provides comprehensive guidance for integrating with the TFT Bible GraphQL API. It covers schema definitions, usage patterns, common queries, and best practices for development.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Schema Definitions](#schema-definitions)
3. [Query Examples](#query-examples)
4. [Mutation Examples](#mutation-examples)
5. [Frontend Integration](#frontend-integration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### API Endpoint
- Development: `http://localhost:8080/graphql`
- Production: `https://api.tftbible.com/graphql`

### Required Dependencies
For frontend integration, you'll need:
- `@apollo/client`
- `graphql`

### Installation
```bash
npm install @apollo/client graphql
```

### Apollo Client Setup
```javascript
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

## Schema Definitions

### Core Types

#### Champion
```graphql
type Champion {
  id: String!
  name: String!
  cost: Int!
  traits: [String!]!
  stats: ChampionStats!
  ability: ChampionAbility!
  image: String
}
```

#### TraitTrackerResponse
```graphql
type TraitTrackerResponse {
  path: [TraitPath!]!
  efficiency: Float!
}
```

#### TraitPath
```graphql
type TraitPath {
  champion: Champion!
  traitsGained: [String!]!
  cost: Int!
  efficiency: Float!
}
```

### Root Query
```graphql
type Query {
  health: String!
  champions(limit: Int): [Champion!]!
  traits: [Trait!]!
  items: [Item!]!
}
```

### Root Mutation
```graphql
type Mutation {
  traitTracker(input: TraitTrackerInput!): TraitTrackerResponse!
}
```

### Input Types

#### TraitTrackerInput
```graphql
input TraitTrackerInput {
  targetTraits: [TraitRequirement!]!
  currentTraits: [CurrentTraitInput!]
}
```

#### TraitRequirement
```graphql
input TraitRequirement {
  traitName: String!
  requiredCount: Int!
}
```

#### CurrentTraitInput
```graphql
input CurrentTraitInput {
  name: String!
  count: Int!
}
```

## Query Examples

### Get All Champions
```graphql
query GetChampions($limit: Int) {
  champions(limit: $limit) {
    id
    name
    cost
    traits
    stats {
      health
      attackDamage
    }
    ability {
      name
      description
    }
    image
  }
}
```

### Get All Traits
```graphql
query GetTraits {
  traits {
    id
    name
    description
    traitType
    breakpoints {
      count
      description
      bonuses
    }
  }
}
```

### Health Check
```graphql
query GetHealth {
  health
}
```

## Mutation Examples

### Trait Tracker
```graphql
mutation GetTraitTracker($input: TraitTrackerInput!) {
  traitTracker(input: $input) {
    path {
      champion {
        id
        name
        cost
        traits
        stats {
          health
          attackDamage
        }
        ability {
          name
          description
        }
        image
      }
      traitsGained
      cost
      efficiency
    }
    efficiency
  }
}
```

### Example Variables
```json
{
  "input": {
    "targetTraits": [
      {
        "traitName": "Assassin",
        "requiredCount": 3
      },
      {
        "traitName": "Shapeshifter",
        "requiredCount": 2
      }
    ],
    "currentTraits": [
      {
        "name": "Assassin",
        "count": 1
      }
    ]
  }
}
```

## Frontend Integration

### Using React with Apollo
```jsx
import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CHAMPIONS, GET_TRAIT_TRACKER } from '../lib/graphql';

function TraitTrackerComponent() {
  const { data, loading, error } = useQuery(GET_CHAMPIONS, {
    variables: { limit: 100 }
  });

  const [getTraitTracker, { data: pathData, loading: pathLoading }] = 
    useMutation(GET_TRAIT_TRACKER);

  const handleTraitTracker = () => {
    const input = {
      targetTraits: [
        { traitName: "Assassin", requiredCount: 3 },
        { traitName: "Shapeshifter", requiredCount: 2 }
      ],
      currentTraits: [
        { name: "Assassin", count: 1 }
      ]
    };

    getTraitTracker({
      variables: {
        input
      }
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Trait Tracker</h1>
      <button onClick={handleTraitTracker}>Calculate Path</button>
      {pathData && (
        <div>
          <h2>Optimal Path</h2>
          {pathData.traitTracker.path.map((pathItem, index) => (
            <div key={index}>
              <p>Champion: {pathItem.champion.name}</p>
              <p>Traits: {pathItem.traitsGained.join(', ')}</p>
              <p>Cost: {pathItem.champion.cost}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Type Definitions for TypeScript
```typescript
// types.ts
export interface Champion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  stats: ChampionStats;
  ability: ChampionAbility;
  image?: string;
}

export interface ChampionStats {
  health: number;
  mana: number;
  startingMana: number;
  armor: number;
  magicResist: number;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  critChance: number;
  critMultiplier: number;
}

export interface ChampionAbility {
  name: string;
  description: string;
  type: string;
  targeting: string;
  damageType: string;
}
```

## Best Practices

### 1. Efficient Queries
- Always specify only the fields you need to minimize payload size
- Use variables for dynamic values instead of string interpolation
- Consider pagination for large data sets

### 2. Error Handling
- Implement proper error handling for both network and GraphQL errors
- Use Apollo's error states to provide user feedback
- Consider implementing retry mechanisms for failed requests

### 3. Caching
- Leverage Apollo Client's caching capabilities
- Use appropriate cache policies (cache-first, network-only, etc.)
- Implement cache updates for mutations when needed

### 4. Performance
- Use fragments to avoid duplicate field requests
- Batch queries when possible
- Consider using Apollo Link for advanced request handling

## Common Use Cases

### Use Case 1: Trait Tracker for Set 16
**Objective:** Find the shortest path to acquire 5 region traits to unlock Ryze

**Query:**
```graphql
mutation {
  traitTracker(input: {
    targetTraits: [
      { traitName: "Noxus", requiredCount: 5 }
      { traitName: "Demacia", requiredCount: 5 }
      { traitName: "Piltover", requiredCount: 5 }
      { traitName: "Ionia", requiredCount: 5 }
      { traitName: "Shadow Isles", requiredCount: 5 }
    ]
  }) {
    path {
      champion { name, cost, traits }
      efficiency
    }
    efficiency
  }
}
```

### Use Case 2: Quest Augment Requirement
**Objective:** Find optimal path to activate 8 bronze trait actives

**Query:**
```graphql
mutation {
  traitTracker(input: {
    targetTraits: [
      { traitName: "Brawler", requiredCount: 2 }
      { traitName: "Assassin", requiredCount: 2 }
      { traitName: "Duelist", requiredCount: 2 }
      { traitName: "Mage", requiredCount: 2 }
    ]
  }) {
    path {
      champion { name, cost, traits }
      traitsGained
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Network Error
**Symptoms:** `Network error: Failed to fetch`
**Solutions:**
- Check if the GraphQL server is running
- Verify the correct URL is configured
- Ensure CORS is properly configured

#### 2. Schema Mismatch
**Symptoms:** Field not found or type mismatch errors
**Solutions:**
- Update your queries to match the current schema
- Run introspection query to get latest schema: `npx get-graphql-schema http://localhost:8080/graphql`

#### 3. Authorization Issues
**Symptoms:** Unauthorized or forbidden responses
**Solutions:**
- Ensure proper JWT token is provided in headers
- Check token expiration status
- Verify API key if required

### Debugging Tools

#### GraphQL Playground
Access the GraphQL Playground at: `http://localhost:8080/graphql`

This provides:
- Interactive schema documentation
- Query testing environment
- Real-time error feedback

#### Apollo Client DevTools
Install browser extension for:
- Query/mutation inspection
- Cache visualization
- Performance metrics

## Migration Notes

### From REST to GraphQL
1. Replace REST endpoints with GraphQL operations
2. Use fragments for consistent data shapes
3. Leverage GraphQL's type system for better validation
4. Update error handling to handle GraphQL errors

### Common Migration Pattern
- REST: `/api/v1/champions?limit=20`
- GraphQL: `query { champions(limit: 20) { id name cost traits } }`

## Versioning

- API Version: 1.0.0
- GraphQL Schema Version: 1.0.0
- Last Updated: [Current Date]

## Support

For technical issues or questions:
- Check the GraphQL Playground schema documentation
- Review Apollo Client documentation
- Contact the development team for specific integration issues