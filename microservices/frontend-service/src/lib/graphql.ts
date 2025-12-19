// src/lib/graphql.ts
import { gql } from 'graphql-tag';

// Query to get all champions
export const GET_CHAMPIONS = gql`
  query GetChampions {
    champions {
      id
      name
      cost
      traits
      imageUrl
      splashUrl
      iconUrl
      abilityName
      abilityDescription
      abilityImageUrl
    }
  }
`;

// Query to get a champion by ID
export const GET_CHAMPION = gql`
  query GetChampion($id: ID!) {
    champion(id: $id) {
      id
      name
      cost
      traits
      imageUrl
      splashUrl
      iconUrl
      abilityName
      abilityDescription
      abilityImageUrl
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
      activeUnits
      imageUrl
      tiers {
        units
        effect
      }
    }
  }
`;

// Query to get a trait by ID
export const GET_TRAIT = gql`
  query GetTrait($id: ID!) {
    trait(id: $id) {
      id
      name
      description
      activeUnits
      imageUrl
      tiers {
        units
        effect
      }
    }
  }
`;

// Query to get all items
export const GET_ITEMS = gql`
  query GetItems {
    items {
      id
      name
      description
      components
      imageUrl
      unique
      trait
    }
  }
`;

// Query to get an item by ID
export const GET_ITEM = gql`
  query GetItem($id: ID!) {
    item(id: $id) {
      id
      name
      description
      components
      imageUrl
      unique
      trait
    }
  }
`;

// Query to get all augments
export const GET_AUGMENTS = gql`
  query GetAugments {
    augments {
      id
      name
      description
      imageUrl
    }
  }
`;

// Query to get an augment by ID
export const GET_AUGMENT = gql`
  query GetAugment($id: ID!) {
    augment(id: $id) {
      id
      name
      description
      imageUrl
    }
  }
`;

// Query to get all compositions
export const GET_COMPOSITIONS = gql`
  query GetCompositions {
    compositions {
      id
      title
      description
      championIds
      traitBonuses
      augmentRecommendations
      difficulty
      region
    }
  }
`;

// Query to get a single composition by ID
export const GET_COMPOSITION = gql`
  query GetComposition($id: ID!) {
    composition(id: $id) {
      id
      title
      description
      championIds
      traitBonuses
      augmentRecommendations
      difficulty
      region
    }
  }
`;

// Query to search all entities
export const SEARCH_ENTITIES = gql`
  query Search($searchTerm: String!) {
    search(searchTerm: $searchTerm) {
      champions {
        id
        name
        cost
        traits
        imageUrl
        abilityName
      }
      traits {
        id
        name
        description
      }
      items {
        id
        name
        description
      }
      compositions {
        id
        title
        description
      }
    }
  }
`;