import { create } from 'zustand';
import { api, Composition, ChampionInComposition } from '../lib/api';

interface CompositionsState {
  compositions: Composition[];
  currentComposition: (Composition & { champions: ChampionInComposition[]; meta: any; augments: any; votes: any; views: number; tags: string[]; category: string }) | null;
  currentCompositionId: string | null;
  loading: boolean;
  error: string | null;

  fetchCompositions: () => Promise<void>;
  fetchCompositionsBySet: (setId: number) => Promise<void>;
  fetchCompositionById: (id: string) => Promise<void>;
  createComposition: (data: any) => Promise<void>;
  updateComposition: (id: string, data: any) => Promise<void>;
  deleteComposition: (id: string) => Promise<void>;
  clearCurrentComposition: () => void;
  clearError: () => void;
}

const BOARD_COLS = 7;

function autoAssignPositions(championIds: string[], championDetails: Record<string, any>): { x: number; y: number }[] {
  const occupied = new Set<string>();
  const positions: { x: number; y: number }[] = [];

  const getPos = (row: number, col: number) => `${row},${col}`;

  for (const champId of championIds) {
    const champ = championDetails[champId];
    const cost = champ?.cost || 1;

    let placed = false;
    let row: number;

    if (cost >= 4) {
      row = 3;
    } else if (cost >= 3) {
      row = 1;
    } else if (cost === 1) {
      row = 0;
    } else {
      row = 2;
    }

    for (let c = 0; c < BOARD_COLS; c++) {
      const key = getPos(row, c);
      if (!occupied.has(key)) {
        occupied.add(key);
        positions.push({ x: c, y: row });
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          const key = getPos(r, c);
          if (!occupied.has(key)) {
            occupied.add(key);
            positions.push({ x: c, y: r });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }

    if (!placed) {
      positions.push({ x: -1, y: -1 });
    }
  }

  return positions;
}

export const useCompositionsStore = create<CompositionsState>((set, get) => ({
  compositions: [],
  currentComposition: null,
  currentCompositionId: null,
  loading: false,
  error: null,

  fetchCompositions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getCompositions();
      set({
        compositions: response.data.compositions,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch compositions:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch compositions'
      });
    }
  },

  fetchCompositionById: async (id: string) => {
    const prevId = get().currentCompositionId;
    if (prevId === id && get().currentComposition) {
      return;
    }
    set({ loading: true, error: null, currentComposition: null, currentCompositionId: id });
    try {
      const response = await api.getCompositionById(id);
      const graphqlData = response.data.composition;

      const championDetails: Record<string, any> = {};
      if (graphqlData.championIds && graphqlData.championIds.length > 0) {
        try {
          const allChampionsResponse = await api.getChampions();
          allChampionsResponse.data.champions.forEach((champ: any) => {
            championDetails[champ.id] = champ;
          });
        } catch (champError) {
          console.warn('Could not fetch all champions for composition mapping:', champError);
        }
      }

      const champIds: string[] = graphqlData.championIds || [];
      const positions = autoAssignPositions(champIds, championDetails);

      const champions: ChampionInComposition[] = champIds.map((champId: string, idx: number) => {
        const champData = championDetails[champId];
        const pos = positions[idx] || { x: -1, y: -1 };
        return champData ? {
          id: champData.id,
          name: champData.name,
          star_level: 1,
          position: pos,
          items: [],
          is_core: idx < 3,
          priority: idx < 3 ? 'high' : 'medium',
          cost: champData.cost,
          traits: champData.traits,
          health: champData.stats?.hp || 800,
          attack_damage: champData.stats?.damage || 50,
          ability_name: champData.ability?.name || 'TBD',
          icon_url: champData.iconUrl || ''
        } : {
          id: champId,
          name: champId,
          star_level: 1,
          position: pos,
          items: [],
          is_core: false,
          priority: 'medium',
          cost: 0,
          traits: [],
          health: 800,
          attack_damage: 50,
          ability_name: 'TBD',
          icon_url: ''
        };
      }) || [];

      const data = {
        ...graphqlData,
        champions,
        category: 'General',
        tags: [] as string[],
        augments: {
          preferred: graphqlData.augmentRecommendations || [],
          acceptable: [] as string[]
        },
        meta: {
          tier: 'S',
          difficulty: 3,
          cost: 'mid',
          patch: '14.5',
          playstyle: 'aggro',
          winrate: 50.0,
          avg_placement: 2.5,
          playrate: 10.0,
          contest_rate: 5.0,
        },
        votes: { upvotes: 10, downvotes: 0 },
        views: 100,
      };

      set({ currentComposition: data as any, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch composition by ID:', error);
      set({ loading: false, error: error.message || 'Failed to fetch composition', currentCompositionId: null });
    }
  },

  createComposition: async (input: any) => {
    set({ loading: true, error: null });
    try {
      await api.createComposition(input);
      set({ loading: false });
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create composition'
      });
    }
  },

  updateComposition: async (id: string, input: any) => {
    set({ loading: true, error: null });
    try {
      await api.updateComposition(id, input);
      set({ loading: false });
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
      await api.deleteComposition(id);
      set({ loading: false });
      get().fetchCompositions();
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to delete composition'
      });
    }
  },

  clearCurrentComposition: () => {
    set({ currentComposition: null, currentCompositionId: null });
  },

  fetchCompositionsBySet: async (setId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getCompositionsBySet(setId);
      set({
        compositions: response.data.compositionsBySet,
        loading: false
      });
    } catch (error: any) {
      console.error('Failed to fetch compositions by set:', error);
      set({
        loading: false,
        error: error.message || 'Failed to fetch compositions by set'
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
