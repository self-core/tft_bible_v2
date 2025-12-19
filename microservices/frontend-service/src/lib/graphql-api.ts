import { apolloClient } from './apolloClient'; // Use the same instance as defined in App
import { GET_CHAMPIONS, GET_COMPOSITIONS, GET_COMPOSITION, CREATE_COMPOSITION, UPDATE_COMPOSITION, DELETE_COMPOSITION } from './graphql';
import { gql } from '@apollo/client';

// Interface definitions matching GraphQL responses
export interface GraphQLChampion {
  id: string;
  name: string;
  displayName?: string;
  cost: number;
  traits: string[];
  stats: {
    health: number;
    attackDamage: number;
  };
  ability: {
    name: string;
    description: string;
  };
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
}

export interface GraphQLComposition {
  id: string;
  name: string;
  description: string;
  category: string;
  champions: Array<{
    id: string;
    name: string;
    starLevel: number;
    position: {
      x: number;
      y: number;
    };
    items: string[];
    isCore: boolean;
    priority?: string;
    cost: number;
    traits: string[];
    health: number;
    attackDamage: number;
    abilityName: string;
    iconUrl?: string;
  }>;
  augments: {
    preferred: string[];
    acceptable?: string[];
    deprecated?: string[];
  };
  meta: {
    tier?: string;
    difficulty: number;
    cost?: string;
    patch?: string;
    playstyle?: string;
    winrate?: number;
    avgPlacement?: number;
    playrate?: number;
    contestRate?: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
  };
  views: number;
  favorites: number;
  comments: string[];
  isPublic: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  builderCode?: string;
}

export interface GraphQLResponse<T> {
  data: T;
}

// GraphQL API functions using Apollo Client directly
export const graphQLApi = {
  // Champion-related functions
  getChampions: async (variables?: { limit?: number }) => {
    try {
      const response = await apolloClient.query({
        query: GET_CHAMPIONS,
        variables: variables || {},
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

  getTraits: async (variables?: { type?: string; limit?: number; offset?: number }) => {
    try {
      const response = await apolloClient.query({
        query: GET_TRAITS,
        variables: variables || {},
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

  // Composition-related functions
  getCompositions: async (variables?: { limit?: number; offset?: number }) => {
    try {
      const response = await apolloClient.query({
        query: GET_COMPOSITIONS,
        variables: {
          limit: variables?.limit || 10,
          offset: variables?.offset || 0,
        },
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

  createComposition: async (input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_COMPOSITION,
        variables: {
          input
        },
        errorPolicy: 'all',
      });

      if (response.errors && response.errors.length > 0) {
        console.warn('GraphQL warnings for createComposition:', response.errors);
      }

      return response;
    } catch (error: any) {
      console.error('GraphQL Error - createComposition:', error.message || error);
      const formattedError = {
        message: error.message || 'Failed to create composition',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  updateComposition: async (id: string, input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: UPDATE_COMPOSITION,
        variables: {
          id,
          input
        },
        errorPolicy: 'all',
      });

      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for updateComposition(${id}):`, response.errors);
      }

      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - updateComposition(${id}):`, error.message || error);
      const formattedError = {
        message: error.message || 'Failed to update composition',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  },

  deleteComposition: async (id: string) => {
    try {
      const response = await apolloClient.mutate({
        mutation: DELETE_COMPOSITION,
        variables: { id },
        errorPolicy: 'all',
      });

      if (response.errors && response.errors.length > 0) {
        console.warn(`GraphQL warnings for deleteComposition(${id}):`, response.errors);
      }

      return response;
    } catch (error: any) {
      console.error(`GraphQL Error - deleteComposition(${id}):`, error.message || error);
      const formattedError = {
        message: error.message || 'Failed to delete composition',
        code: error.code || 'GRAPHQL_ERROR',
        details: error
      };
      throw formattedError;
    }
  }
};