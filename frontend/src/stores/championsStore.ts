import { create } from 'zustand';
import { api, Champion } from '../lib/api';

interface ChampionsState {
  champions: Champion[];
  loading: boolean;
  error: string | null;

  fetchChampions: () => Promise<void>;
  fetchChampionById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useChampionsStore = create<ChampionsState>((set, get) => ({
  champions: [],
  loading: false,
  error: null,

  fetchChampions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getChampions();
      set({
        champions: response.data.champions,
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
      const response = await api.getChampionById(id);
      const champion = response.data.champion;
      if (champion) {
        const updated = get().champions.map(champ =>
          champ.id === id ? { ...champ, ...champion } : champ
        );
        set({ champions: updated, loading: false });
      } else {
        set({ loading: false });
      }
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
