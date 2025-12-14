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

      // Transform GraphQL data to match expected format
      const graphqlData = response.data.compositions;
      const data: PaginatedResponse<CompositionSummary> = {
        data: graphqlData.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
          description: comp.description,
          category: comp.category,
          tier: 'S', // Placeholder - would come from GraphQL schema
          difficulty: 3, // Placeholder
          winrate: 50.0, // Placeholder
          views: 100, // Placeholder
          upvotes: 10, // Placeholder
          champions: comp.champions?.map((champ: any) => ({
            id: champ.champion.id,
            name: champ.champion.name,
            cost: champ.champion.cost,
            traits: champ.champion.traits,
            icon_url: '' // Placeholder
          })) || []
        })),
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

      // Transform GraphQL data to match expected Composition format
      const data: Composition = {
        id: graphqlData.id,
        set_id: 'tbd', // Would come from GraphQL schema
        name: graphqlData.name,
        description: graphqlData.description,
        category: graphqlData.category,
        tags: [], // Would come from GraphQL schema
        champions: graphqlData.champions.map((champ: any) => ({
          id: champ.champion.id,
          name: champ.champion.name,
          star_level: champ.starLevel,
          position: champ.position,
          items: champ.items,
          is_core: champ.isCore,
          priority: 'medium', // Placeholder
          cost: champ.champion.cost,
          traits: champ.champion.traits,
          health: 800, // Placeholder
          attack_damage: 50, // Placeholder
          ability_name: 'TBD', // Placeholder
          icon_url: '' // Placeholder
        })),
        augments: {
          preferred: graphqlData.augments?.preferred || [],
          acceptable: graphqlData.augments?.acceptable || []
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
  
  clearError: () => {
    set({ error: null });
  }
}));