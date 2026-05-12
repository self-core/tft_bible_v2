import { create } from 'zustand';
import { ChampionSummary, ChampionQuery, PaginatedResponse } from '../lib/api';
import { graphQLApi } from '../lib/graphql-api';

interface ChampionsState {
  champions: ChampionSummary[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  
  // Actions
  fetchChampions: (params?: ChampionQuery) => Promise<void>;
  fetchChampionById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useChampionsStore = create<ChampionsState>((set, get) => ({
  champions: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchChampions: async (params?: ChampionQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getChampions();
      const graphqlData = response.data.champions;
      const limit = params?.limit || 50;

      const data: PaginatedResponse<ChampionSummary> = {
        data: graphqlData.slice(0, limit).map((champ: any) => ({
          id: champ.id,
          name: champ.name,
          display_name: champ.displayName || champ.name,
          cost: champ.cost,
          traits: champ.traits,
          health: champ.stats?.hp || 800,
          attack_damage: champ.stats?.damage || 50,
          ability_name: champ.ability?.name || '',
          image_url: champ.imageUrl || champ.iconUrl || '',
          splash_url: champ.splashUrl || '',
          rarity: 'common',
          release_version: '1.0',
          set_id: 'tft-set-1',
          is_enabled: true
        })),
        total: graphqlData.length,
        page: 1,
        per_page: limit,
        total_pages: Math.ceil(graphqlData.length / limit)
      };

      set({
        champions: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch champions'
      });
    }
  },

  fetchChampionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getChampions();
      const graphqlData = response.data.champions;

      const champion = graphqlData.find((champ: any) => champ.id === id);

      if (!champion) {
        throw new Error('Champion not found');
      }

      // Update the specific champion in the list if it exists
      const updatedChampions = get().champions.map(champ =>
        champ.id === id ? {
          ...champ,
          name: champion.name,
          display_name: champion.displayName || champion.name,
          cost: champion.cost,
          traits: champion.traits,
          health: champion.stats?.hp || 800,
          attack_damage: champion.stats?.damage || 50,
          ability_name: champion.ability?.name || '',
          image_url: champion.imageUrl || champion.iconUrl || '',
          splash_url: champion.splashUrl || '',
          release_version: champion.releaseVersion || '1.0',
          set_id: champion.setId || 'tft-set-1',
          is_enabled: champion.isEnabled ?? true
        } : champ
      );

      set({
        champions: updatedChampions,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch champion'
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));