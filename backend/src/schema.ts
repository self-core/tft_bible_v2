import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date

  type Champion {
    id: ID!
    name: String!
    cost: Int!
    traits: [String!]!
    stats: ChampionStats!
    ability: Ability!
    imageUrl: String
    splashUrl: String
    iconUrl: String
  }

  type ChampionStats {
    hp: Int!
    mana: Int!
    damage: Int!
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

  type Position {
    row: Int!
    col: Int!
  }

  type BoardUnit {
    championId: String!
    position: Position!
    starLevel: Int!
    items: [String!]!
  }

  input PositionInput {
    row: Int!
    col: Int!
  }

  input BoardUnitInput {
    championId: String!
    position: PositionInput!
    starLevel: Int!
    items: [String!]!
  }

  input CreateCompositionInput {
    title: String!
    description: String!
    setId: Int!
    championIds: [String!]!
    units: [BoardUnitInput!]
    traitBonuses: [String!]!
    augmentRecommendations: [String!]!
    difficulty: String
    region: String
  }

  input UpdateCompositionInput {
    title: String
    description: String
    setId: Int
    championIds: [String!]
    units: [BoardUnitInput!]
    traitBonuses: [String!]
    augmentRecommendations: [String!]
    difficulty: String
    region: String
  }

  type Composition {
    id: ID!
    title: String!
    description: String!
    setId: Int!
    championIds: [String!]!
    units: [BoardUnit!]
    traitBonuses: [String!]!
    augmentRecommendations: [String!]!
    difficulty: String
    region: String
    createdAt: String
    updatedAt: String
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

  type Mutation {
    createComposition(input: CreateCompositionInput!): Composition!
    updateComposition(id: ID!, input: UpdateCompositionInput!): Composition!
    deleteComposition(id: ID!): Boolean!
  }

  type SearchResult {
    champions: [Champion!]!
    traits: [Trait!]!
    items: [Item!]!
    sets: [SetData!]!
    compositions: [Composition!]!
  }

  type MetaItem {
    itemId: String!
    count: Int!
  }

  type MetaChampion {
    championId: String!
    count: Int!
    pickRate: Float!
    items: [MetaItem!]!
  }

  type MetaTrait {
    key: String!
    breakpoint: Int!
    count: Int!
  }

  type MetaStats {
    matchesAnalyzed: Int!
    winRate: Float!
    top4Rate: Float!
    avgPlacement: Float!
    pickRate: Float!
  }

  type MetaComposition {
    id: ID!
    setId: Int!
    patchVersion: String!
    champions: [MetaChampion!]!
    traits: [MetaTrait!]!
    stats: MetaStats!
    playstyle: String!
    lastUpdated: String!
  }

  extend type Query {
    metaCompositions(setId: Int, patchVersion: String): [MetaComposition!]!
    metaComposition(id: ID!): MetaComposition
  }

  extend type Mutation {
    refreshMetaData(setId: Int!): Boolean!
  }

  # ── Riot API types ──────────────────────────────────────────

  type RiotSummoner {
    id: String!
    accountId: String!
    puuid: String!
    name: String!
    profileIconId: Int!
    revisionDate: Int!
    summonerLevel: Int!
  }

  type RiotMatchTrait {
    name: String!
    numUnits: Int!
    style: Int
  }

  type RiotMatchUnit {
    characterId: String!
    itemNames: [String!]!
    name: String!
    rarity: Int!
    tier: Int!
  }

  type RiotMatchParticipant {
    companion: String
    goldLeft: Int!
    lastRound: Int!
    level: Int!
    placement: Int!
    playersEliminated: Int!
    puuid: String!
    timeEliminated: String!
    totalDamageToPlayers: Int!
    traits: [RiotMatchTrait!]!
    units: [RiotMatchUnit!]!
  }

  type RiotMatchMetadata {
    dataVersion: String!
    matchId: String!
    participants: [String!]!
  }

  type RiotMatch {
    metadata: RiotMatchMetadata!
    info: RiotMatchInfo!
    participants: [RiotMatchParticipant!]!
  }

  type RiotMatchInfo {
    gameDatetime: Int!
    gameLength: Int!
    gameVersion: String!
    queueId: Int!
    tftGameType: String!
    tftSetCoreName: String!
    tftSetNumber: Int!
  }

  extend type Query {
    riotSummonerByPuuid(puuid: String!): RiotSummoner
    riotSummonerByName(name: String!): RiotSummoner
    riotMatchHistory(puuid: String!, start: Int, count: Int): [String!]!
    riotMatchDetail(matchId: String!): RiotMatch
  }
`;