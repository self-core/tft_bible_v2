import { apolloClient } from './apolloClient'; // Use the same instance as defined in App
import { GET_CHAMPIONS, GET_COMPOSITIONS, GET_COMPOSITION, CREATE_COMPOSITION, UPDATE_COMPOSITION, DELETE_COMPOSITION } from './graphql';
import { gql } from '@apollo/client';

// Interface definitions matching GraphQL responses
export interface GraphQLChampion {
  id: string;
  name: string;
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
  image: string;
}

export interface GraphQLComposition {
  id: string;
  name: string;
  description: string;
  category: string;
  champions: Array<{
    champion: {
      id: string;
      name: string;
      cost: number;
      traits: string[];
    };
    starLevel: number;
    items: string[];
    position: {
      x: number;
      y: number;
    };
    isCore: boolean;
  }>;
  augments: {
    preferred: string[];
    acceptable?: string[];
  };
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
        variables: variables || {}
      });
      return response;
    } catch (error) {
      console.error('GraphQL Error - getChampions:', error);
      throw error;
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
        }
      });
      return response;
    } catch (error) {
      console.error('GraphQL Error - getCompositions:', error);
      throw error;
    }
  },

  getCompositionById: async (id: string) => {
    try {
      const response = await apolloClient.query({
        query: GET_COMPOSITION,
        variables: { id }
      });
      return response;
    } catch (error) {
      console.error(`GraphQL Error - getCompositionById(${id}):`, error);
      throw error;
    }
  },

  createComposition: async (input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_COMPOSITION,
        variables: {
          input
        }
      });
      return response;
    } catch (error) {
      console.error('GraphQL Error - createComposition:', error);
      throw error;
    }
  },

  updateComposition: async (id: string, input: any) => {
    try {
      const response = await apolloClient.mutate({
        mutation: UPDATE_COMPOSITION,
        variables: {
          id,
          input
        }
      });
      return response;
    } catch (error) {
      console.error(`GraphQL Error - updateComposition(${id}):`, error);
      throw error;
    }
  },

  deleteComposition: async (id: string) => {
    try {
      const response = await apolloClient.mutate({
        mutation: DELETE_COMPOSITION,
        variables: { id }
      });
      return response;
    } catch (error) {
      console.error(`GraphQL Error - deleteComposition(${id}):`, error);
      throw error;
    }
  }
};