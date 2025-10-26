import { create } from 'zustand';
import { AugmentSummary, AugmentQuery, PaginatedResponse } from '../lib/api';
import { augmentsApi } from '../lib/api';

interface AugmentsState {
  augments: AugmentSummary[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  
  // Actions
  fetchAugments: (params?: AugmentQuery) => Promise<void>;
  fetchAugmentById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAugmentsStore = create<AugmentsState>((set, get) => ({
  augments: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchAugments: async (params?: AugmentQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await augmentsApi.getAugments(params);
      const data: PaginatedResponse<AugmentSummary> = response.data;
      
      set({
        augments: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch augments'
      });
    }
  },
  
  fetchAugmentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await augmentsApi.getAugmentById(id);
      const data: AugmentSummary = response.data;
      
      // Update the specific augment in the list if it exists
      const updatedAugments = get().augments.map(aug => 
        aug.id === id ? { ...aug, ...data } : aug
      );
      
      set({
        augments: updatedAugments,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch augment'
      });
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));