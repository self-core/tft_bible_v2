import { apolloClient } from './apolloClient'; // Use the same instance as defined in App
import {
  GET_CHAMPIONS,
  GET_CHAMPION,
  GET_TRAITS,
  GET_TRAIT,
  GET_ITEMS,
  GET_ITEM,
  GET_AUGMENTS,
  GET_AUGMENT,
  GET_COMPOSITIONS,
  GET_COMPOSITION,
  SEARCH_ENTITIES
} from './graphql';

// Interface definitions matching GraphQL responses
export interface GraphQLChampion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
  abilityName?: string;
  abilityDescription?: string;
  abilityImageUrl?: string;
}

export interface GraphQLTraitTier {
  units: number;
  effect: string;
}

export interface GraphQLTrait {
  id: string;
  name: string;
  description: string;
  activeUnits: number[];
  imageUrl?: string;
  tiers: GraphQLTraitTier[];
}

export interface GraphQLItem {
  id: string;
  name: string;
  description: string;
  components: string[];
  imageUrl?: string;
  unique?: boolean;
  trait?: string;
}

export interface GraphQLAugment {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface GraphQLComposition {
  id: string;
  title: string;
  description: string;
  championIds: string[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}

export interface GraphQLEntitySearchResult {
  champions: GraphQLChampion[];
  traits: GraphQLTrait[];
  items: GraphQLItem[];
  compositions: GraphQLComposition[];
}

export interface GraphQLResponse<T> {
  data: T;
}

// GraphQL API functions using Apollo Client directly
export const graphQLApi = {
  // Champion-related functions
  getChampions: async () => {
    try {
      const response = await apolloClient.query({
        query: GET_CHAMPIONS,
        errorPolicy: 'all', // Include partial data even if some fields fail
      });

      // Check for GraphQL errors
      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for getChampions:', response.errors);
      }

      return response;
    } catch (error: any) {
      console.error('GraphQL Error - getChampions:', error.message || error);
      // Format error for frontend consumption
      const formattedError = {
        message: error.message || 'Failed to fetch champions',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
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
      const formattedError = {
        message: error.message || 'Failed to fetch champion',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  // Trait-related functions
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
      const formattedError = {
        message: error.message || 'Failed to fetch traits',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
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
      const formattedError = {
        message: error.message || 'Failed to fetch trait',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  // Item-related functions
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
      const formattedError = {
        message: error.message || 'Failed to fetch items',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
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
      const formattedError = {
        message: error.message || 'Failed to fetch item',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  // Augment-related functions
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
      const formattedError = {
        message: error.message || 'Failed to fetch augments',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
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
      const formattedError = {
        message: error.message || 'Failed to fetch augment',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  // Composition-related functions
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
      const formattedError = {
        message: error.message || 'Failed to fetch compositions',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
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
      const formattedError = {
        message: error.message || 'Failed to fetch composition',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  // Search function
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
      const formattedError = {
        message: error.message || 'Failed to search entities',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  }
};