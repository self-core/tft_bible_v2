import { create } from 'zustand';
import { api, Trait } from '../lib/api';

interface TraitsState {
  traits: Trait[];
  loading: boolean;
  error: string | null;

  fetchTraits: () => Promise<void>;
  fetchTraitById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTraitsStore = create<TraitsState>((set, get) => ({
  traits: [],
  loading: false,
  error: null,

  fetchTraits: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTraits();
      set({ traits: response.data.traits, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch traits' });
    }
  },

  fetchTraitById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTraitById(id);
      const trait = response.data.trait;
      if (trait) {
        const updated = get().traits.map(t => t.key === id ? { ...t, ...trait } : t);
        set({ traits: updated, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch trait' });
    }
  },

  clearError: () => set({ error: null })
}));
