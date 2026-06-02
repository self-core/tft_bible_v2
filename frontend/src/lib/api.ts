import { apolloClient } from './apolloClient';
import { gql } from 'graphql-tag';

// ===== GraphQL Query Documents =====

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

export const DELETE_COMPOSITION = gql`
  mutation DeleteComposition($id: ID!) {
    deleteComposition(id: $id)
  }
`;

// ===== Riot Query Documents =====

export const RIOT_SUMMONER_BY_PUUID = gql`
  query RiotSummonerByPuuid($puuid: String!) {
    riotSummonerByPuuid(puuid: $puuid) {
      id
      accountId
      puuid
      name
      profileIconId
      revisionDate
      summonerLevel
    }
  }
`;

export const RIOT_SUMMONER_BY_NAME = gql`
  query RiotSummonerByName($name: String!) {
    riotSummonerByName(name: $name) {
      id
      accountId
      puuid
      name
      profileIconId
      revisionDate
      summonerLevel
    }
  }
`;

export const RIOT_MATCH_HISTORY = gql`
  query RiotMatchHistory($puuid: String!, $start: Int, $count: Int) {
    riotMatchHistory(puuid: $puuid, start: $start, count: $count)
  }
`;

export const RIOT_MATCH_DETAIL = gql`
  query RiotMatchDetail($matchId: String!) {
    riotMatchDetail(matchId: $matchId) {
      metadata {
        dataVersion
        matchId
        participants
      }
      info {
        gameDatetime
        gameLength
        gameVersion
        queueId
        tftGameType
        tftSetCoreName
        tftSetNumber
      }
      participants {
        companion
        goldLeft
        lastRound
        level
        placement
        playersEliminated
        puuid
        timeEliminated
        totalDamageToPlayers
        traits {
          name
          numUnits
          style
        }
        units {
          characterId
          itemNames
          name
          rarity
          tier
        }
      }
    }
  }
`;

// ===== Types =====

export interface ChampionStats {
  hp: number;
  mana: number;
  damage: number;
}

export interface Stat {
  name: string;
  value: number;
}

export interface AbilityVariable {
  name: string;
  values: number[];
}

export interface Ability {
  name: string;
  variables: AbilityVariable[];
}

export interface Champion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  stats: ChampionStats;
  ability: Ability;
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
}

export interface TraitBreakpoint {
  count: number;
  bonus: string;
}

export interface Trait {
  key: string;
  name?: string;
  description?: string;
  breakpoints: TraitBreakpoint[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  components: string[];
  imageUrl?: string;
  unique?: boolean;
  trait?: string;
}

export interface SetData {
  setId: number;
  setName: string;
  champions: Champion[];
  traits: Trait[];
  items: Item[];
  augments: Augment[];
  mechanics?: string;
}

export interface Augment {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface Composition {
  id: string;
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}

export interface EntitySearchResult {
  champions: Champion[];
  traits: Trait[];
  items: Item[];
  sets: SetData[];
  compositions: Composition[];
}

export interface GraphQLResponse<T> {
  data: T;
}

export interface ChampionInComposition {
  id: string;
  name: string;
  star_level: number;
  position: { x: number; y: number };
  items: string[];
  is_core: boolean;
  priority: string;
  cost: number;
  traits: string[];
  health: number;
  attack_damage: number;
  ability_name: string;
  icon_url?: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotMatchTrait {
  name: string;
  numUnits: number;
  style?: number;
}

export interface RiotMatchUnit {
  characterId: string;
  itemNames: string[];
  name: string;
  rarity: number;
  tier: number;
}

export interface RiotMatchParticipant {
  companion?: string;
  goldLeft: number;
  lastRound: number;
  level: number;
  placement: number;
  playersEliminated: number;
  puuid: string;
  timeEliminated: string;
  totalDamageToPlayers: number;
  traits: RiotMatchTrait[];
  units: RiotMatchUnit[];
}

export interface RiotMatchMetadata {
  dataVersion: string;
  matchId: string;
  participants: string[];
}

export interface RiotMatchInfo {
  gameDatetime: number;
  gameLength: number;
  gameVersion: string;
  queueId: number;
  tftGameType: string;
  tftSetCoreName: string;
  tftSetNumber: number;
}

export interface RiotMatch {
  metadata: RiotMatchMetadata;
  info: RiotMatchInfo;
  participants: RiotMatchParticipant[];
}

// ===== API Object =====

export const api = {
  getChampions: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_CHAMPIONS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getChampions:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getChampions:', error.message || error);
      throw { message: error.message || 'Failed to fetch champions', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getChampionsBySet: async (setId: number) => {
    try {
      const response = await apolloClient.query({
        query: GET_CHAMPIONS_BY_SET,
        variables: { setId },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getChampionsBySet(${setId}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getChampionsBySet(${setId}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch champions by set', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getChampionById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_CHAMPION,
        variables: { id },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getChampionById(${id}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getChampionById(${id}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch champion', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getTraits: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_TRAITS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getTraits:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getTraits:', error.message || error);
      throw { message: error.message || 'Failed to fetch traits', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getTraitById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_TRAIT,
        variables: { id },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getTraitById(${id}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getTraitById(${id}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch trait', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getItems: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_ITEMS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getItems:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getItems:', error.message || error);
      throw { message: error.message || 'Failed to fetch items', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getItemById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_ITEM,
        variables: { id },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getItemById(${id}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getItemById(${id}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch item', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getSets: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_SETS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getSets:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getSets:', error.message || error);
      throw { message: error.message || 'Failed to fetch sets', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getSet: async (setId: number) => {
    try {
      const response = await apolloClient.query({
        query: GET_SET,
        variables: { setId },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getSet(${setId}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getSet(${setId}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch set', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getAugments: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_AUGMENTS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getAugments:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getAugments:', error.message || error);
      throw { message: error.message || 'Failed to fetch augments', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getAugmentById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_AUGMENT,
        variables: { id },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getAugmentById(${id}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getAugmentById(${id}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch augment', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getCompositions: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_COMPOSITIONS,
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getCompositions:', response.errors);
      }
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getCompositions:', error.message || error);
      throw { message: error.message || 'Failed to fetch compositions', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getCompositionsBySet: async (setId: number) => {
    try {
      const response = await apolloClient.query({
        query: GET_COMPOSITIONS_BY_SET,
        variables: { setId },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getCompositionsBySet(${setId}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getCompositionsBySet(${setId}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch compositions by set', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getCompositionById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_COMPOSITION,
        variables: { id },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for getCompositionById(${id}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - getCompositionById(${id}):`, error.message || error);
      throw { message: error.message || 'Failed to fetch composition', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  createComposition: async (input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_COMPOSITION,
        variables: { input },
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - createComposition:', error.message || error);
      throw error;
    }
  },

  updateComposition: async (id: string, input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: UPDATE_COMPOSITION,
        variables: { id, input },
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - updateComposition:', error.message || error);
      throw error;
    }
  },

  deleteComposition: async (id: string) => {
    try {
      const response = await apolloClient.mutate({
        mutation: DELETE_COMPOSITION,
        variables: { id },
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - deleteComposition:', error.message || error);
      throw error;
    }
  },

  searchEntities: async (searchTerm: string) => {
    try {
      const response = await apolloClient.query({
        query: SEARCH_ENTITIES,
        variables: { searchTerm },
        errorPolicy: 'all',
      });
      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for searchEntities(${searchTerm}):`, response.errors);
      }
      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - searchEntities(${searchTerm}):`, error.message || error);
      throw { message: error.message || 'Failed to search entities', code: error.code || 'GRAPHQL_ERROR', details: error };
    }
  },

  getRiotSummonerByPuuid: async (puuid: string) => {
    try {
      const response = await apolloClient.query({
        query: RIOT_SUMMONER_BY_PUUID,
        variables: { puuid },
        errorPolicy: 'all',
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getRiotSummonerByPuuid:', error.message || error);
      throw error;
    }
  },

  getRiotSummonerByName: async (name: string) => {
    try {
      const response = await apolloClient.query({
        query: RIOT_SUMMONER_BY_NAME,
        variables: { name },
        errorPolicy: 'all',
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getRiotSummonerByName:', error.message || error);
      throw error;
    }
  },

  getRiotMatchHistory: async (puuid: string, start?: number, count?: number) => {
    try {
      const response = await apolloClient.query({
        query: RIOT_MATCH_HISTORY,
        variables: { puuid, start, count },
        errorPolicy: 'all',
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getRiotMatchHistory:', error.message || error);
      throw error;
    }
  },

  getRiotMatchDetail: async (matchId: string) => {
    try {
      const response = await apolloClient.query({
        query: RIOT_MATCH_DETAIL,
        variables: { matchId },
        errorPolicy: 'all',
      });
      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getRiotMatchDetail:', error.message || error);
      throw error;
    }
  },
};
