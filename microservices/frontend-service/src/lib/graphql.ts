// src/lib/graphql.ts
import { gql } from 'graphql-tag';

// Query to get all champions
export const GET_CHAMPIONS = gql`
  query GetChampions($limit: Int) {
    champions(limit: $limit) {
      id
      name
      displayName
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
      imageUrl
      iconUrl
    }
  }
`;

// Query to get all traits
export const GET_TRAITS = gql`
  query GetTraits($type: String, $limit: Int, $offset: Int) {
    traits(type: $type, limit: $limit, offset: $offset) {
      id
      name
      description
      traitType
      tiers {
        minUnits
        maxUnits
        bonus
        bonusType
        bonusValueType
        bonusValue
        style
        statBonuses {
          statType
          value
          isPercent
        }
        percentIncreases
      }
      sets
      isActive
      isHidden
      displayImage
      iconUrl
      units
      updated
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

// Query to get all compositions
export const GET_COMPOSITIONS = gql`
  query GetCompositions($limit: Int, $offset: Int) {
    compositions(limit: $limit, offset: $offset) {
      id
      name
      description
      category
      champions {
        id
        name
        starLevel
        position {
          x
          y
        }
        items
        isCore
        priority
        cost
        traits
        health
        attackDamage
        abilityName
        iconUrl
      }
      augments {
        preferred
        acceptable
        deprecated
      }
      meta {
        tier
        difficulty
        cost
        patch
        playstyle
        winrate
        avgPlacement
        playrate
        contestRate
      }
      votes {
        upvotes
        downvotes
      }
      views
      favorites
      comments
      isPublic
      isVerified
      isFeatured
      createdAt
      updatedAt
      builderCode
    }
  }
`;

// Query to get a single composition by ID
export const GET_COMPOSITION = gql`
  query GetComposition($id: ID!) {
    compositionById(id: $id) {
      id
      name
      description
      category
      champions {
        id
        name
        starLevel
        position {
          x
          y
        }
        items
        isCore
        priority
        cost
        traits
        health
        attackDamage
        abilityName
        iconUrl
      }
      augments {
        preferred
        acceptable
        deprecated
      }
      meta {
        tier
        difficulty
        cost
        patch
        playstyle
        winrate
        avgPlacement
        playrate
        contestRate
      }
      votes {
        upvotes
        downvotes
      }
      views
      favorites
      comments
      isPublic
      isVerified
      isFeatured
      createdAt
      updatedAt
      builderCode
    }
  }
`;

// Mutation to create a composition
export const CREATE_COMPOSITION = gql`
  mutation CreateComposition($input: CreateCompositionInput!) {
    createComposition(input: $input) {
      id
      name
      description
      category
      champions {
        champion {
          id
          name
          cost
          traits
        }
        starLevel
        items
        position {
          x
          y
        }
        isCore
      }
      augments
    }
  }
`;

// Mutation to update a composition
export const UPDATE_COMPOSITION = gql`
  mutation UpdateComposition($id: String!, $input: UpdateCompositionInput!) {
    updateComposition(id: $id, input: $input) {
      id
      name
      description
      category
      champions {
        champion {
          id
          name
          cost
          traits
        }
        starLevel
        items
        position {
          x
          y
        }
        isCore
      }
      augments
    }
  }
`;

// Mutation to delete a composition
export const DELETE_COMPOSITION = gql`
  mutation DeleteComposition($id: String!) {
    deleteComposition(id: $id)
  }
`;