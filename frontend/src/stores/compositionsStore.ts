import { create } from 'zustand';
import { Composition, CompositionSummary, CompositionQuery, PaginatedResponse } from '../lib/api';
import { graphQLApi, GraphQLComposition } from '../lib/graphql-api';

interface CompositionsState {
  compositions: CompositionSummary[];
  currentComposition: Composition | null;
  currentCompositionId: string | null;
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

const BOARD_COLS = 7;

function autoAssignPositions(championIds: string[], championDetails: Record<string, any>): { x: number; y: number }[] {
  const occupied = new Set<string>();
  const positions: { x: number; y: number }[] = [];

  const getPos = (row: number, col: number) => `${row},${col}`;

  for (const champId of championIds) {
    const champ = championDetails[champId];
    const cost = champ?.cost || 1;

    let placed = false;
    let row: number;

    if (cost >= 4) {
      row = 3;
    } else if (cost >= 3) {
      row = 1;
    } else if (cost === 1) {
      row = 0;
    } else {
      row = 2;
    }

    for (let c = 0; c < BOARD_COLS; c++) {
      const key = getPos(row, c);
      if (!occupied.has(key)) {
        occupied.add(key);
        positions.push({ x: c, y: row });
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const key = getPos(r, c);
          if (!occupied.has(key)) {
            occupied.add(key);
            positions.push({ x: c, y: r });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }

    if (!placed) {
      positions.push({ x: -1, y: -1 });
    }
  }

  return positions;
}

export const useCompositionsStore = create<CompositionsState>((set, get) => ({
  compositions: [],
  currentComposition: null,
  currentCompositionId: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchCompositions: async (params?: CompositionQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getCompositions();

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
    const prevId = get().currentCompositionId;
    if (prevId === id && get().currentComposition) {
      return;
    }
    set({ loading: true, error: null, currentComposition: null, currentCompositionId: id });
    try {
      const response = await graphQLApi.getCompositionById(id);
      const graphqlData = response.data.composition;

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

      const champIds: string[] = graphqlData.championIds || [];
      const positions = autoAssignPositions(champIds, championDetails);

      const data: Composition = {
        id: graphqlData.id,
        set_id: `set_${graphqlData.setId}`,
        name: graphqlData.title,
        description: graphqlData.description,
        category: 'General',
        tags: [],
        champions: champIds.map((champId: string, idx: number) => {
          const champData = championDetails[champId];
          const pos = positions[idx] || { x: -1, y: -1 };
          return champData ? {
            id: champData.id,
            name: champData.name,
            star_level: 1,
            position: pos,
            items: [],
            is_core: idx < 3,
            priority: idx < 3 ? 'high' : 'medium',
            cost: champData.cost,
            traits: champData.traits,
            health: champData.stats?.hp || 800,
            attack_damage: champData.stats?.damage || 50,
            ability_name: champData.ability?.name || 'TBD',
            icon_url: champData.iconUrl || ''
          } : {
            id: champId,
            name: champId,
            star_level: 1,
            position: pos,
            items: [],
            is_core: false,
            priority: 'medium',
            cost: 0,
            traits: [],
            health: 800,
            attack_damage: 50,
            ability_name: 'TBD',
            icon_url: ''
          };
        }) || [],
        augments: {
          preferred: graphqlData.augmentRecommendations || [],
          acceptable: []
        },
        meta: {
          tier: 'S',
          difficulty: 3,
          cost: 'mid',
          patch: '14.5',
          playstyle: 'aggro',
          winrate: 50.0,
          avg_placement: 2.5,
          playrate: 10.0,
          contest_rate: 5.0,
        },
        votes: { upvotes: 10, downvotes: 0 },
        views: 100,
        favorites: 5,
        comments: [],
        is_public: true,
        is_verified: false,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        builder_code: '',
      };

      set({ currentComposition: data, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch composition by ID:', error);
      set({ loading: false, error: error.message || 'Failed to fetch composition', currentCompositionId: null });
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
    set({ currentComposition: null, currentCompositionId: null });
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