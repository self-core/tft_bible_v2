import { create } from 'zustand';
import { api, SetData } from '../lib/api';

interface SetsState {
  sets: SetData[];
  activeSetId: number | null;
  loading: boolean;
  error: string | null;
  fetchSets: () => Promise<void>;
  getActiveSet: () => SetData | undefined;
  isSetArchived: (setId: number) => boolean;
}

export const useSetsStore = create<SetsState>((set, get) => ({
  sets: [],
  activeSetId: null,
  loading: false,
  error: null,

  fetchSets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getSets();
      const setsData = response.data.sets;
      const activeSet = setsData.find((s: SetData) => s.status === 'active');
      set({
        sets: setsData,
        activeSetId: activeSet?.setId ?? setsData[0]?.setId ?? null,
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch sets' });
    }
  },

  getActiveSet: () => {
    const { sets, activeSetId } = get();
    return sets.find(s => s.setId === activeSetId);
  },

  isSetArchived: (setId: number) => {
    const set = get().sets.find(s => s.setId === setId);
    return set?.status === 'archived';
  },
}));
