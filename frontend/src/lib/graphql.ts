// src/lib/graphql.ts
import { gql } from 'graphql-tag';

// Query to get all champions
export const GET_CHAMPIONS = gql`
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
`;

// Query to get all traits
export const GET_TRAITS = gql`
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
`;

// Mutation to get trait tracker path
export const GET_TRAIT_TRACKER = gql`
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
`;

// Query for health check
export const GET_HEALTH = gql`
  query GetHealth {
    health
  }
`;