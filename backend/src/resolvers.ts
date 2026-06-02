import { ISetChampion, ITrait, IItem, IComposition, ISetData } from './interfaces';
import { container } from './services/container';
import { SetDataService } from './services/SetDataService';
import { CompositionService } from './services/CompositionService';
import { MetaService } from './services/MetaService';
import { RiotApiClient } from './services/RiotApiClient';

// Initialize services from DI container
const apiKey = process.env.RIOT_API_KEY || '';
const setDataService = container.resolve(SetDataService);
setDataService.initialize();
const compositionService = container.resolve(CompositionService);
const metaService = container.resolve(MetaService);

const getRiotClient = () => {
  if (!apiKey) throw new Error('RIOT_API_KEY not configured');
  return new RiotApiClient({ apiKey });
};

const REGION = process.env.RIOT_REGION || 'AMERICAS';
const PLATFORM = process.env.RIOT_PLATFORM || 'NA1';

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
      const currentSet = await getCurrentSetDataFromDB();
      // In a real implementation, we'd look up the set by ID
      // For now, just return current set champions if setId matches
      if (setId === currentSet.setId) return currentSet.champions;
      return []; // Return empty array for other sets
    },
    champion: async (_: any, { id }: { id: string }) => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.champions.find((champ: ISetChampion) => champ.id === id);
    },
    traits: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.traits;
    },
    trait: async (_: any, { id }: { id: string }) => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.traits.find((trait: ITrait) => trait.key === id);
    },
    items: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.items;
    },
    item: async (_: any, { id }: { id: string }) => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.items.find((item: IItem) => item.id === id);
    },
    sets: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return [currentSet]; // Return all available sets
    },
    set: async (_: any, { setId }: { setId: number }) => {
      const currentSet = await getCurrentSetDataFromDB();
      // In a real implementation, we'd look up the set by ID
      if (setId === currentSet.setId) return currentSet;
      return null; // Return null if set is not found
    },
    augments: async () => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.augments;
    },
    augment: async (_: any, { id }: { id: string }) => {
      const currentSet = await getCurrentSetDataFromDB();
      return currentSet.augments.find((augment: any) => augment.id === id);
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

    // Riot API queries
    riotSummonerByPuuid: async (_: any, { puuid }: { puuid: string }) => {
      const client = getRiotClient();
      return client.request<any>(PLATFORM, `/tft/summoner/v1/summoners/by-puuid/${puuid}`);
    },
    riotSummonerByName: async (_: any, { name }: { name: string }) => {
      const client = getRiotClient();
      return client.request<any>(PLATFORM, `/tft/summoner/v1/summoners/by-name/${encodeURIComponent(name)}`);
    },
    riotMatchHistory: async (_: any, { puuid, start, count }: { puuid: string; start?: number; count?: number }) => {
      const client = getRiotClient();
      const params = new URLSearchParams();
      if (start !== undefined) params.set('start', String(start));
      if (count !== undefined) params.set('count', String(count));
      const query = params.toString() ? `?${params.toString()}` : '';
      return client.regionalRequest<string[]>(REGION, `/tft/match/v1/matches/by-puuid/${puuid}/ids${query}`);
    },
    riotMatchDetail: async (_: any, { matchId }: { matchId: string }) => {
      const client = getRiotClient();
      return client.regionalRequest<any>(REGION, `/tft/match/v1/matches/${matchId}`);
    },
  },
  Mutation: {
    createComposition: async (_: any, { input }: { input: any }) => {
      return compositionService.create(input);
    },
    updateComposition: async (_: any, { id, input }: { id: string, input: any }) => {
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