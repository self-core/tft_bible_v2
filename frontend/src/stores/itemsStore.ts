import { create } from 'zustand';
import { ItemSummary, ItemQuery, PaginatedResponse } from '../lib/api';
import { itemsApi } from '../lib/api';

interface ItemsState {
  items: ItemSummary[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  
  // Actions
  fetchItems: (params?: ItemQuery) => Promise<void>;
  fetchItemById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchItems: async (params?: ItemQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await itemsApi.getItems(params);
      const data: PaginatedResponse<ItemSummary> = response.data;
      
      set({
        items: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch items'
      });
    }
  },
  
  fetchItemById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await itemsApi.getItemById(id);
      const data = response.data;
      
      // Update the specific item in the list if it exists
      const updatedItems = get().items.map(item => 
        item.id === id ? { ...item, ...data } : item
      );
      
      set({
        items: updatedItems,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch item'
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));