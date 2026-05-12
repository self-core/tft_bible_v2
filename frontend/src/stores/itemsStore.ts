import { create } from 'zustand';
import { graphQLApi, GraphQLItem } from '../lib/graphql-api';

interface ItemsState {
  items: GraphQLItem[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchItemById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getItems();
      set({ items: response.data.items, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch items' });
    }
  },

  fetchItemById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await graphQLApi.getItemById(id);
      const item = response.data.item;
      if (item) {
        const updated = get().items.map(i => i.id === id ? { ...i, ...item } : i);
        set({ items: updated, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Failed to fetch item' });
    }
  },

  clearError: () => set({ error: null })
}));