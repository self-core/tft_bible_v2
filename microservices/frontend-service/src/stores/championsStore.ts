import { create } from 'zustand';
import { ChampionSummary, ChampionQuery, PaginatedResponse } from '../lib/api';
import { championsApi } from '../lib/api';

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
      const response = await championsApi.getChampions(params);
      const data: PaginatedResponse<ChampionSummary> = response.data;
      
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
      const response = await championsApi.getChampionById(id);
      const data = response.data;
      
      // Update the specific champion in the list if it exists
      const updatedChampions = get().champions.map(champ => 
        champ.id === id ? { ...champ, ...data } : champ
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