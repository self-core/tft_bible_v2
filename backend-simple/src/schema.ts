import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date

  type Champion {
    id: ID!
    name: String!
    cost: Int!
    traits: [String!]!
    stats: [Stat!]!
    ability: Ability!
    imageUrl: String
    splashUrl: String
    iconUrl: String
  }

  type Stat {
    name: String!
    value: Float!
  }

  type Ability {
    name: String!
    variables: [AbilityVariable!]!
  }

  type AbilityVariable {
    name: String!
    values: [Float!]!
  }

  type Trait {
    key: String!
    name: String
    description: String
    breakpoints: [TraitBreakpoint!]!
  }

  type TraitBreakpoint {
    count: Int!
    bonus: String!
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

  type SetData {
    setId: Int!
    setName: String!
    champions: [Champion!]!
    traits: [Trait!]!
    items: [Item!]!
    augments: [Augment!]!
    mechanics: String
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
    setId: Int!
    championIds: [String!]!
    traitBonuses: [String!]!
    augmentRecommendations: [String!]!
    difficulty: String
    region: String
  }

  type Query {
    champions: [Champion!]!
    champion(id: ID!): Champion
    championsBySet(setId: Int!): [Champion!]!
    traits: [Trait!]!
    trait(id: String!): Trait
    items: [Item!]!
    item(id: ID!): Item
    sets: [SetData!]!
    set(setId: Int!): SetData
    augments: [Augment!]!
    augment(id: ID!): Augment
    compositions: [Composition!]!
    composition(id: ID!): Composition
    compositionsBySet(setId: Int!): [Composition!]!
    search(searchTerm: String!): SearchResult!
  }

  type SearchResult {
    champions: [Champion!]!
    traits: [Trait!]!
    items: [Item!]!
    sets: [SetData!]!
    compositions: [Composition!]!
  }
`;