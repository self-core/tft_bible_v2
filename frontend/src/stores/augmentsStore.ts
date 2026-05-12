import { create } from 'zustand';
import { graphQLApi, GraphQLAugment } from '../lib/graphql-api';

interface AugmentsState {
  augments: GraphQLAugment[];
  loading: boolean;
  error: string | null;

  fetchAugments: () => Promise<void>;
  fetchAugmentById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAugmentsStore = create<AugmentsState>((set, get) => ({
  augments: [],
  loading: false,
  error: null,

  fetchAugments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getAugments();
      set({ augments: response.data.augments, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch augments' });
    }
  },

  fetchAugmentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getAugmentById(id);
      const augment = response.data.augment;
      if (augment) {
        const updated = get().augments.map(a => a.id === id ? { ...a, ...augment } : a);
        set({ augments: updated, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch augment' });
    }
  },

  clearError: () => set({ error: null })
}));