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
      stats {
        hp
        mana
        damage
      }
      ability {
        name
        variables {
          name
          values
        }
      }
    }
  }
`;

// Query to get champions by set ID
export const GET_CHAMPIONS_BY_SET = gql`
  query GetChampionsBySet($setId: Int!) {
    championsBySet(setId: $setId) {
      id
      name
      cost
      traits
      imageUrl
      splashUrl
      iconUrl
      stats {
        hp
        mana
        damage
      }
      ability {
        name
        variables {
          name
          values
        }
      }
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
      stats {
        hp
        mana
        damage
      }
      ability {
        name
        variables {
          name
          values
        }
      }
    }
  }
`;

// Query to get all traits
export const GET_TRAITS = gql`
  query GetTraits {
    traits {
      key
      name
      description
      breakpoints {
        count
        bonus
      }
    }
  }
`;

// Query to get a trait by key
export const GET_TRAIT = gql`
  query GetTrait($id: String!) {
    trait(id: $id) {
      key
      name
      description
      breakpoints {
        count
        bonus
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

// Query to get all sets
export const GET_SETS = gql`
  query GetSets {
    sets {
      setId
      setName
      champions {
        id
        name
        cost
        traits
        stats {
          hp
          mana
          damage
        }
        ability {
          name
          variables {
            name
            values
          }
        }
      }
      traits {
        key
        name
        description
        breakpoints {
          count
          bonus
        }
      }
      items {
        id
        name
        description
        components
        imageUrl
        unique
        trait
      }
      augments {
        id
        name
        description
        imageUrl
      }
    }
  }
`;

// Query to get a specific set
export const GET_SET = gql`
  query GetSet($setId: Int!) {
    set(setId: $setId) {
      setId
      setName
      champions {
        id
        name
        cost
        traits
        stats {
          hp
          mana
          damage
        }
        ability {
          name
          variables {
            name
            values
          }
        }
      }
      traits {
        key
        name
        description
        breakpoints {
          count
          bonus
        }
      }
      items {
        id
        name
        description
        components
        imageUrl
        unique
        trait
      }
      augments {
        id
        name
        description
        imageUrl
      }
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
      setId
      championIds
      traitBonuses
      augmentRecommendations
      difficulty
      region
    }
  }
`;

// Query to get compositions by set ID
export const GET_COMPOSITIONS_BY_SET = gql`
  query GetCompositionsBySet($setId: Int!) {
    compositionsBySet(setId: $setId) {
      id
      title
      description
      setId
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
      setId
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
        stats {
          hp
          mana
          damage
        }
        ability {
          name
          variables {
            name
            values
          }
        }
      }
      traits {
        key
        name
        description
        breakpoints {
          count
          bonus
        }
      }
      items {
        id
        name
        description
      }
      sets {
        setId
        setName
      }
      compositions {
        id
        title
        description
        setId
      }
    }
  }
`;

// Mutation to create a composition
export const CREATE_COMPOSITION = gql`
  mutation CreateComposition($input: CreateCompositionInput!) {
    createComposition(input: $input) {
      id
      title
      description
      setId
      championIds
      traitBonuses
      augmentRecommendations
      difficulty
      region
    }
  }
`;

// Mutation to update a composition
export const UPDATE_COMPOSITION = gql`
  mutation UpdateComposition($id: ID!, $input: UpdateCompositionInput!) {
    updateComposition(id: $id, input: $input) {
      id
      title
      description
      setId
      championIds
      traitBonuses
      augmentRecommendations
      difficulty
      region
    }
  }
`;