import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date

  type Champion {
    id: ID!
    name: String!
    cost: Int!
    traits: [String!]!
    imageUrl: String
    splashUrl: String
    iconUrl: String
    abilityName: String
    abilityDescription: String
    abilityImageUrl: String
  }

  type Trait {
    id: ID!
    name: String!
    description: String!
    activeUnits: [Int!]!
    imageUrl: String
    tiers: [TraitTier!]!
  }

  type TraitTier {
    units: Int!
    effect: String!
  }

  type Item {
    id: ID!
    name: String!
    description: String!
    components: [String!]!
    imageUrl: String
    unique: Boolean
    trait: String
  }

  type Augment {
    id: ID!
    name: String!
    description: String!
    imageUrl: String
  }

  type Composition {
    id: ID!
    title: String!
    description: String!
    championIds: [String!]!
    traitBonuses: [String!]!
    augmentRecommendations: [String!]!
    difficulty: String
    region: String
  }

  type Query {
    champions: [Champion!]!
    champion(id: ID!): Champion
    traits: [Trait!]!
    trait(id: ID!): Trait
    items: [Item!]!
    item(id: ID!): Item
    augments: [Augment!]!
    augment(id: ID!): Augment
    compositions: [Composition!]!
    composition(id: ID!): Composition
    search(searchTerm: String!): SearchResult!
  }

  type SearchResult {
    champions: [Champion!]!
    traits: [Trait!]!
    items: [Item!]!
    compositions: [Composition!]!
  }
`;