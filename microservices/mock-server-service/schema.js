// mock-server/schema.js
const { buildSchema } = require('graphql');

// Create a schema
const schema = buildSchema(`
  type TraitCount {
    name: String!
    current: Int!
    target: Int!
    activeBreakpoints: [Int!]!
    upcomingBreakpoint: Int
  }

  type TraitRequirement {
    traitName: String!
    requiredCount: Int!
  }

  type ChampionStats {
    health: Float!
    mana: Float!
    startingMana: Float!
    armor: Float!
    magicResist: Float!
    attackDamage: Float!
    attackSpeed: Float!
    attackRange: Float!
    critChance: Float!
    critMultiplier: Float!
  }

  type ChampionAbility {
    name: String!
    description: String!
    type: String!
    targeting: String!
    damageType: String!
  }

  type Champion {
    id: String!
    name: String!
    cost: Int!
    traits: [String!]!
    stats: ChampionStats!
    ability: ChampionAbility!
    image: String
  }

  type TraitPath {
    champion: Champion!
    traitsGained: [String!]!
    cost: Int!
    efficiency: Float!
  }

  type TraitTrackerResponse {
    path: [TraitPath!]!
    efficiency: Float!
  }

  type Trait {
    id: String!
    name: String!
    description: String!
    traitType: String!
    breakpoints: [TraitBreakpoint!]!
  }

  type TraitBreakpoint {
    count: Int!
    description: String!
    bonuses: String! # In a real implementation, this would be a JSON object
  }

  type Item {
    id: String!
    name: String!
    description: String!
    itemType: String!
    category: String!
  }

  type Query {
    health: String!
    champions(limit: Int): [Champion!]!
    traits: [Trait!]!
    items: [Item!]!
  }

  input CurrentTraitInput {
    name: String!
    count: Int!
  }

  input TraitTrackerInput {
    targetTraits: [TraitRequirement!]!
    currentTraits: [CurrentTraitInput!]
  }

  type Mutation {
    traitTracker(input: TraitTrackerInput!): TraitTrackerResponse!
  }
`);

module.exports = schema;