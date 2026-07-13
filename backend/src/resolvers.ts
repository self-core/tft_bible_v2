import { ISetChampion, ITrait, IItem, IComposition, ISetData } from './interfaces';
import { container } from './services/container';
import { SetDataService } from './services/SetDataService';
import { CompositionService } from './services/CompositionService';
import { MetaService } from './services/MetaService';
import { RiotApiClient } from './services/RiotApiClient';

// Initialize services from DI container
const setDataService = container.resolve(SetDataService);
setDataService.initialize();
const compositionService = container.resolve(CompositionService);
const metaService = container.resolve(MetaService);
const riotClient = container.resolve(RiotApiClient);

import { SetModel } from './models/Set';

const REGION = process.env.RIOT_REGION || 'AMERICAS';
const PLATFORM = process.env.RIOT_PLATFORM || 'NA1';

const getAllSetIds = async (): Promise<number[]> => {
  const sets = await SetModel.find({}).select('setId').lean();
  return sets.map((s: any) => s.setId).sort((a: number, b: number) => b - a);
};

// Async function to get the current set data from database
const getCurrentSetDataFromDB = async (): Promise<ISetData> => {
  return await setDataService.getSetData();
};

// Define the resolvers following the new Set-based architecture
export const resolvers = {
  Query: {
    champions: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.champions;
    },
    championsBySet: async (_: any, { setId }: { setId: number }) => {
      try {
        const setData = await setDataService.getSetData(setId);
        return setData.champions;
      } catch {
        return [];
      }
    },
    champion: async (_: any, { id }: { id: string }) => {
      const match = id.match(/^TFT(\d+)_/i);
      if (match) {
        const setId = parseInt(match[1], 10);
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.champions.find((champ: ISetChampion) => champ.id === id);
          if (found) return found;
        } catch {}
      }
      const allIds = await getAllSetIds();
      for (const setId of allIds) {
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.champions.find((champ: ISetChampion) => champ.id === id);
          if (found) return found;
        } catch {}
      }
      return null;
    },
    traits: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.traits;
    },
    trait: async (_: any, { id }: { id: string }) => {
      const allIds = await getAllSetIds();
      for (const setId of allIds) {
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.traits.find((trait: ITrait) => trait.key === id);
          if (found) return found;
        } catch {}
      }
      return null;
    },
    items: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.items;
    },
    item: async (_: any, { id }: { id: string }) => {
      const match = id.match(/^TFT(\d+)_/i);
      if (match) {
        const setId = parseInt(match[1], 10);
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.items.find((item: IItem) => item.id === id);
          if (found) return found;
        } catch {}
      }
      const allIds = await getAllSetIds();
      for (const setId of allIds) {
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.items.find((item: IItem) => item.id === id);
          if (found) return found;
        } catch {}
      }
      return null;
    },
    sets: async () => {
      const allIds = await getAllSetIds();
      const sets: ISetData[] = [];
      for (const id of allIds) {
        try {
          const s = await setDataService.getSetData(id);
          sets.push(s);
        } catch {}
      }
      return sets;
    },
    set: async (_: any, { setId }: { setId: number }) => {
      try {
        return await setDataService.getSetData(setId);
      } catch {
        return null;
      }
    },
    augments: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.augments;
    },
    augment: async (_: any, { id }: { id: string }) => {
      const allIds = await getAllSetIds();
      for (const setId of allIds) {
        try {
          const setData = await setDataService.getSetData(setId);
          const found = setData.augments.find((augment: any) => augment.id === id);
          if (found) return found;
        } catch {}
      }
      return null;
    },
    activeSet: async () => {
      const activeSetDoc = await SetModel.findOne({ status: 'active' }).lean();
      if (!activeSetDoc) return null;
      return await setDataService.getSetData(activeSetDoc.setId);
    },
    compositions: () => compositionService.getAll(),
    compositionsBySet: (_: any, { setId }: { setId: number }) => {
      return compositionService.getBySet(setId);
    },
    composition: (_: any, { id }: { id: string }) => compositionService.getById(id),
    search: async (_: any, { searchTerm }: { searchTerm: string }) => {
      const currentSet = await getCurrentSetDataFromDB();
      const term = searchTerm.toLowerCase();

      const filteredChampions = currentSet.champions.filter((champ: ISetChampion) =>
        champ.name.toLowerCase().includes(term) ||
        champ.traits.some((trait: string) => trait.toLowerCase().includes(term))
      );

      const filteredTraits = currentSet.traits.filter((trait: ITrait) =>
        trait.name?.toLowerCase().includes(term) ||
        trait.description?.toLowerCase().includes(term) ||
        trait.key.toLowerCase().includes(term)
      );

      const filteredItems = currentSet.items.filter((item: IItem) =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );

      const filteredSets = [currentSet].filter((set: ISetData) =>
        set.setName.toLowerCase().includes(term)
      );

      const filteredCompositions = await compositionService.search(term);

      return {
        champions: filteredChampions,
        traits: filteredTraits,
        items: filteredItems,
        sets: filteredSets,
        compositions: filteredCompositions
      };
    },
    metaCompositions: async (_: any, { setId, patchVersion }: { setId?: number; patchVersion?: string }) => {
      return metaService.getMetaCompositions(setId, patchVersion);
    },
    metaComposition: async (_: any, { id }: { id: string }) => {
      return metaService.getMetaCompositionById(id);
    },

    // Riot API queries (shared client with rate limiting)
    riotSummonerByPuuid: async (_: any, { puuid }: { puuid: string }) => {
      return riotClient.request<any>(PLATFORM, `/tft/summoner/v1/summoners/by-puuid/${puuid}`);
    },
    riotSummonerByName: async (_: any, { name }: { name: string }) => {
      return riotClient.request<any>(PLATFORM, `/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`);
    },
    riotMatchHistory: async (_: any, { puuid, start, count }: { puuid: string; start?: number; count?: number }) => {
      const params = new URLSearchParams();
      if (start !== undefined) params.set('start', String(start));
      if (count !== undefined) params.set('count', String(count));
      const query = params.toString() ? `?${params.toString()}` : '';
      return riotClient.regionalRequest<string[]>(REGION, `/tft/match/v1/matches/by-puuid/${puuid}/ids${query}`);
    },
    riotMatchDetail: async (_: any, { matchId }: { matchId: string }) => {
      return riotClient.regionalRequest<any>(REGION, `/tft/match/v1/matches/${matchId}`);
    },
  },
  Mutation: {
    createComposition: async (_: any, { input }: { input: any }) => {
      const setData = await setDataService.getSetData(input.setId);
      if (setData.status === 'archived') {
        throw new Error(`Cannot create compositions for archived set ${input.setId}`);
      }
      return compositionService.create(input);
    },
    updateComposition: async (_: any, { id, input }: { id: string, input: any }) => {
      const composition = await compositionService.getById(id);
      if (composition) {
        const setData = await setDataService.getSetData(composition.setId);
      if (setData.status === 'archived') {
          throw new Error(`Cannot edit compositions for archived set ${composition.setId}`);
        }
      }
      const result = await compositionService.update(id, input);
      if (!result) throw new Error(`Composition with id ${id} not found`);
      return result;
    },
    deleteComposition: async (_: any, { id }: { id: string }) => {
      return compositionService.delete(id);
    },
    refreshMetaData: async (_: any, { setId }: { setId: number }) => {
      await metaService.refreshMetaData(setId);
      return true;
    },
  }
};