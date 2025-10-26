import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for auth headers (when implemented)
api.interceptors.request.use((config) => {
  // Add auth token when available
  // const token = localStorage.getItem('auth_token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login when implemented)
      console.warn('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// API Types (matching backend models)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CompositionSummary {
  id: string;
  name: string;
  category: string;
  tier: string;
  difficulty: number;
  winrate: number;
  views: number;
  upvotes: number;
  author?: string;
  champion_count?: number;
  main_champions?: string[];
  created_at: string;
  builder_code?: string;
  champions?: Array<{
    id: string;
    name: string;
    cost: number;
    traits: string[];
    icon_url?: string;
  }>;
}

export interface ChampionInComposition {
  id: string;
  name: string;
  star_level: number;
  position: { x: number; y: number };
  items: string[];
  is_core: boolean;
  priority: string;
  cost: number;
  traits: string[];
  health: number;
  attack_damage: number;
  ability_name: string;
  icon_url?: string;
}

export interface CompositionAugments {
  preferred: (string | { name: string; description: string })[];
  acceptable?: (string | { name: string; description: string })[];
}

export interface Composition {
  id: string;
  set_id: string;
  author_id?: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  champions: ChampionInComposition[];
  augments: CompositionAugments;
  meta: {
    tier: string;
    difficulty: number;
    cost: string;
    patch: string;
    playstyle: string;
    winrate: number;
    avg_placement: number;
    playrate: number;
    contest_rate: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
  };
  views: number;
  favorites: number;
  comments: string[];
  is_public: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  builder_code?: string;
}

export interface ChampionSummary {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  health: number;
  attack_damage: number;
  ability_name: string;
  image_url?: string;
  icon_url?: string;
}

export interface ItemSummary {
  id: string;
  name: string;
  category: string;
  item_type: string;
  description: string;
  is_unique: boolean;
  priority: number;
  image_url?: string;
  icon_url?: string;
}

export interface AssetInfo {
  id: string;
  name: string;
  icon_url?: string;
  image_url?: string;
}

export interface AugmentSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  tier: string;
  priority: number;
  is_unique: boolean;
  icon_url?: string;
}

export interface CompositionQuery {
  set?: string;
  tier?: string;
  category?: string;
  champion?: string;
  difficulty?: number;
  patch?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  tags?: string;
}

export interface ChampionQuery {
  set?: string;
  cost?: number;
  traits?: string;
  limit?: number;
  search?: string;
}

export interface ItemQuery {
  set?: string;
  category?: string;
  type?: string;
  limit?: number;
  search?: string;
}

export interface AugmentQuery {
  set?: string;
  category?: string;
  tier?: string;
  limit?: number;
  search?: string;
}

export interface SearchQuery {
  q: string;
  type?: string;
  limit?: number;
  set_id?: string;
}

export interface AssetQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

// API Functions
export const compositionsApi = {
  getCompositions: (params?: CompositionQuery) =>
    api.get<PaginatedResponse<CompositionSummary>>('/api/v1/compositions', { params }),

  getCompositionById: (id: string) =>
    api.get(`/api/v1/compositions/${id}`),

  createComposition: (data: any) =>
    api.post('/api/v1/compositions', data),

  updateComposition: (id: string, data: any) =>
    api.put(`/api/v1/compositions/${id}`, data),

  deleteComposition: (id: string) =>
    api.delete(`/api/v1/compositions/${id}`),

  voteComposition: (id: string, voteType: string) =>
    api.post(`/api/v1/compositions/${id}/vote`, { vote_type: voteType }),
};

export const championsApi = {
  getChampions: (params?: ChampionQuery) =>
    api.get<PaginatedResponse<ChampionSummary>>('/api/v1/champions', { params }),

  getChampionById: (id: string) =>
    api.get(`/api/v1/champions/${id}`),

  getChampionsByTrait: (traitName: string) =>
    api.get(`/api/v1/champions/trait/${traitName}`),
};

export const itemsApi = {
  getItems: (params?: ItemQuery) =>
    api.get<PaginatedResponse<ItemSummary>>('/api/v1/items', { params }),

  getItemById: (id: string) =>
    api.get(`/api/v1/items/${id}`),

  getItemRecommendations: (championId: string) =>
    api.get(`/api/v1/items/recommendations/${championId}`),
};

export const augmentsApi = {
  getAugments: (params?: AugmentQuery) =>
    api.get<PaginatedResponse<AugmentSummary>>('/api/v1/augments', { params }),

  getAugmentById: (id: string) =>
    api.get(`/api/v1/augments/${id}`),
};

export const assetsApi = {
  getChampionAssets: (params?: AssetQuery) =>
    api.get<PaginatedResponse<AssetInfo>>('/api/v1/assets/champions', { params }),

  getChampionAssetById: (id: string) =>
    api.get(`/api/v1/assets/champions/${id}`),

  getItemAssets: (params?: AssetQuery) =>
    api.get<PaginatedResponse<AssetInfo>>('/api/v1/assets/items', { params }),

  getItemAssetById: (id: string) =>
    api.get(`/api/v1/assets/items/${id}`),

  getAugmentAssets: (params?: AssetQuery) =>
    api.get<PaginatedResponse<AssetInfo>>('/api/v1/assets/augments', { params }),

  getAugmentAssetById: (id: string) =>
    api.get(`/api/v1/assets/augments/${id}`),
};

export const searchApi = {
  search: (params: SearchQuery) =>
    api.get('/api/v1/search', { params }),
};

export const healthApi = {
  check: () => api.get('/api/v1/health'),
};