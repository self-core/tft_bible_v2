import { create } from 'zustand';
import { Composition, CompositionSummary, CompositionQuery, PaginatedResponse } from '../lib/api';
import { graphQLApi, GraphQLComposition } from '../lib/graphql-api';

interface CompositionsState {
  compositions: CompositionSummary[];
  currentComposition: Composition | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  
  // Actions
  fetchCompositions: (params?: CompositionQuery) => Promise<void>;
  fetchCompositionsBySet: (setId: number, params?: CompositionQuery) => Promise<void>;
  fetchCompositionById: (id: string) => Promise<void>;
  createComposition: (data: any) => Promise<void>;
  updateComposition: (id: string, data: any) => Promise<void>;
  deleteComposition: (id: string) => Promise<void>;
  clearCurrentComposition: () => void;
  clearError: () => void;
}

export const useCompositionsStore = create<CompositionsState>((set, get) => ({
  compositions: [],
  currentComposition: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchCompositions: async (params?: CompositionQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getCompositions({
        limit: params?.limit || 12,
        offset: params?.offset || 0
      });

      // Get all champion IDs to fetch full champion data
      const allChampionIds: string[] = [];
      response.data.compositions.forEach((comp: any) => {
        if (comp.championIds) {
          allChampionIds.push(...comp.championIds);
        }
      });

      // Fetch all champions at once to get their details
      const championDetails: Record<string, any> = {};
      if (allChampionIds.length > 0) {
        const uniqueChampionIds = [...new Set(allChampionIds)];
        // Since we don't have a batch champion query, we'll need to fetch all champions
        // and create a lookup map
        try {
          const allChampionsResponse = await graphQLApi.getChampions();
          allChampionsResponse.data.champions.forEach((champ: any) => {
            championDetails[champ.id] = champ;
          });
        } catch (champError) {
          console.warn('Could not fetch all champions for composition mapping:', champError);
        }
      }

      // Transform GraphQL data to match expected format
      const graphqlData = response.data.compositions;
      const data: PaginatedResponse<CompositionSummary> = {
        data: graphqlData.map((comp: any) => {
          // Map champion IDs to actual champion objects
          const champions = comp.championIds?.map((champId: string) => {
            const champData = championDetails[champId];
            return champData ? {
              id: champData.id,
              name: champData.name,
              cost: champData.cost,
              traits: champData.traits,
              icon_url: champData.iconUrl || ''
            } : {
              id: champId,
              name: champId, // Fallback to ID if champion not found
              cost: 0, // Fallback
              traits: [], // Fallback
              icon_url: '' // Fallback
            };
          }) || [];

          return {
            id: comp.id,
            name: comp.title, // Using title from GraphQL schema
            description: comp.description,
            category: 'General', // Placeholder - would come from GraphQL schema
            tier: 'S', // Placeholder - would come from GraphQL schema
            difficulty: 3, // Placeholder
            winrate: 50.0, // Placeholder
            views: 100, // Placeholder
            upvotes: 10, // Placeholder
            champions
          };
        }),
        total: graphqlData.length,
        page: params?.offset || 0,
        per_page: params?.limit || 12,
        total_pages: Math.ceil(100 / (params?.limit || 12)) // Placeholder calculation
      };

      set({
        compositions: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch compositions:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch compositions'
      });
    }
  },
  
  fetchCompositionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getCompositionById(id);
      const graphqlData = response.data.composition;

      // Fetch all champions to get their details
      const championDetails: Record<string, any> = {};
      if (graphqlData.championIds && graphqlData.championIds.length > 0) {
        try {
          const allChampionsResponse = await graphQLApi.getChampions();
          allChampionsResponse.data.champions.forEach((champ: any) => {
            championDetails[champ.id] = champ;
          });
        } catch (champError) {
          console.warn('Could not fetch all champions for composition mapping:', champError);
        }
      }

      // Transform GraphQL data to match expected Composition format
      const data: Composition = {
        id: graphqlData.id,
        set_id: `set_${graphqlData.setId}`, // Using setId from GraphQL schema
        name: graphqlData.title, // Using title from GraphQL schema
        description: graphqlData.description,
        category: 'General', // Placeholder - would come from GraphQL schema
        tags: [], // Would come from GraphQL schema
        champions: graphqlData.championIds?.map((champId: string) => {
          const champData = championDetails[champId];
          return champData ? {
            id: champData.id,
            name: champData.name,
            star_level: 1, // Placeholder - would come from GraphQL schema
            position: { x: 0, y: 0 }, // Placeholder - would come from GraphQL schema
            items: [], // Placeholder - would come from GraphQL schema
            is_core: false, // Placeholder - would come from GraphQL schema
            priority: 'medium', // Placeholder
            cost: champData.cost,
            traits: champData.traits,
            health: 800, // Placeholder
            attack_damage: 50, // Placeholder
            ability_name: champData.ability?.name || 'TBD', // Placeholder
            icon_url: champData.iconUrl || '' // Placeholder
          } : {
            id: champId,
            name: champId, // Fallback to ID if champion not found
            star_level: 1, // Fallback
            position: { x: 0, y: 0 }, // Fallback
            items: [], // Fallback
            is_core: false, // Fallback
            priority: 'medium', // Fallback
            cost: 0, // Fallback
            traits: [], // Fallback
            health: 800, // Fallback
            attack_damage: 50, // Fallback
            ability_name: 'TBD', // Fallback
            icon_url: '' // Fallback
          };
        }) || [],
        augments: {
          preferred: graphqlData.augmentRecommendations || [], // Using augmentRecommendations from GraphQL schema
          acceptable: [] // Placeholder - would come from GraphQL schema
        },
        meta: {
          tier: 'S', // Placeholder
          difficulty: 3, // Placeholder
          cost: 'mid', // Placeholder
          patch: '14.5', // Placeholder
          playstyle: 'aggro', // Placeholder
          winrate: 50.0, // Placeholder
          avg_placement: 2.5, // Placeholder
          playrate: 10.0, // Placeholder
          contest_rate: 5.0, // Placeholder
        },
        votes: {
          upvotes: 10, // Placeholder
          downvotes: 0 // Placeholder
        },
        views: 100, // Placeholder
        favorites: 5, // Placeholder
        comments: [], // Placeholder
        is_public: true, // Placeholder
        is_verified: false, // Placeholder
        is_featured: false, // Placeholder
        created_at: new Date().toISOString(), // Placeholder
        updated_at: new Date().toISOString(), // Placeholder
        builder_code: '', // Placeholder
      };

      set({
        currentComposition: data,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch composition by ID:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch composition'
      });
    }
  },
  
  createComposition: async (input: any) => {
    set({ loading: true, error: null });
    try {
      await graphQLApi.createComposition(input);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create composition'
      });
    }
  },

  updateComposition: async (id: string, input: any) => {
    set({ loading: true, error: null });
    try {
      await graphQLApi.updateComposition(id, input);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to update composition'
      });
    }
  },

  deleteComposition: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await graphQLApi.deleteComposition(id);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to delete composition'
      });
    }
  },
  
  clearCurrentComposition: () => {
    set({ currentComposition: null });
  },
  
  fetchCompositionsBySet: async (setId: number, params?: CompositionQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getCompositionsBySet(setId);

      // Get all champion IDs to fetch full champion data
      const allChampionIds: string[] = [];
      response.data.compositionsBySet.forEach((comp: any) => {
        if (comp.championIds) {
          allChampionIds.push(...comp.championIds);
        }
      });

      // Fetch all champions at once to get their details
      const championDetails: Record<string, any> = {};
      if (allChampionIds.length > 0) {
        try {
          const allChampionsResponse = await graphQLApi.getChampions();
          allChampionsResponse.data.champions.forEach((champ: any) => {
            championDetails[champ.id] = champ;
          });
        } catch (champError) {
          console.warn('Could not fetch all champions for composition mapping:', champError);
        }
      }

      // Transform GraphQL data to match expected format
      const graphqlData = response.data.compositionsBySet;
      const data: PaginatedResponse<CompositionSummary> = {
        data: graphqlData.map((comp: any) => {
          // Map champion IDs to actual champion objects
          const champions = comp.championIds?.map((champId: string) => {
            const champData = championDetails[champId];
            return champData ? {
              id: champData.id,
              name: champData.name,
              cost: champData.cost,
              traits: champData.traits,
              icon_url: champData.iconUrl || ''
            } : {
              id: champId,
              name: champId, // Fallback to ID if champion not found
              cost: 0, // Fallback
              traits: [], // Fallback
              icon_url: '' // Fallback
            };
          }) || [];

          return {
            id: comp.id,
            name: comp.title, // Using title from GraphQL schema
            description: comp.description,
            category: 'General', // Placeholder - would come from GraphQL schema
            tier: 'S', // Placeholder - would come from GraphQL schema
            difficulty: 3, // Placeholder
            winrate: 50.0, // Placeholder
            views: 100, // Placeholder
            upvotes: 10, // Placeholder
            champions
          };
        }),
        total: graphqlData.length,
        page: params?.offset || 0,
        per_page: params?.limit || 12,
        total_pages: Math.ceil(100 / (params?.limit || 12)) // Placeholder calculation
      };

      set({
        compositions: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch compositions by set:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch compositions by set'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));