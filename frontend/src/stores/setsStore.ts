import { create } from 'zustand';
import { api, SetData } from '../lib/api';

interface SetsState {
  sets: SetData[];
  loading: boolean;
  error: string | null;
  fetchSets: () => Promise<void>;
}

export const useSetsStore = create<SetsState>((set) => ({
  sets: [],
  loading: false,
  error: null,

  fetchSets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getSets();
      set({ sets: response.data.sets, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch sets' });
    }
  },
}));
