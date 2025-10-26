import { create } from 'zustand';
import { Composition, CompositionSummary, CompositionQuery, PaginatedResponse } from '../lib/api';
import { compositionsApi } from '../lib/api';

interface CompositionsState {
  compositions: CompositionSummary[];
  currentComposition: Composition | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  
  // Actions
  fetchCompositions: (params?: CompositionQuery) => Promise<void>;
  fetchCompositionById: (id: string) => Promise<void>;
  createComposition: (data: any) => Promise<void>;
  updateComposition: (id: string, data: any) => Promise<void>;
  deleteComposition: (id: string) => Promise<void>;
  clearCurrentComposition: () => void;
  clearError: () => void;
}

export const useCompositionsStore = create<CompositionsState>((set, get) => ({
  compositions: [],
  currentComposition: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
  
  fetchCompositions: async (params?: CompositionQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await compositionsApi.getCompositions(params);
      const data: PaginatedResponse<CompositionSummary> = response.data;
      
      set({
        compositions: data.data,
        totalPages: data.total_pages,
        currentPage: data.page,
        totalItems: data.total,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch compositions'
      });
    }
  },
  
  fetchCompositionById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await compositionsApi.getCompositionById(id);
      const data: Composition = response.data;
      
      set({
        currentComposition: data,
        loading: false
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch composition'
      });
    }
  },
  
  createComposition: async (data: any) => {
    set({ loading: true, error: null });
    try {
      await compositionsApi.createComposition(data);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create composition'
      });
    }
  },
  
  updateComposition: async (id: string, data: any) => {
    set({ loading: true, error: null });
    try {
      await compositionsApi.updateComposition(id, data);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to update composition'
      });
    }
  },
  
  deleteComposition: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await compositionsApi.deleteComposition(id);
      set({ loading: false });
      // Refresh compositions list
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to delete composition'
      });
    }
  },
  
  clearCurrentComposition: () => {
    set({ currentComposition: null });
  },
  
  clearError: () => {
    set({ error: null });
  }
}));