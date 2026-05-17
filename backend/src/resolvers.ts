import { ISetChampion, ITrait, IItem, IComposition, ISetData } from './interfaces';
import { SetDataService } from './services/SetDataService';
import { CompositionService } from './services/CompositionService';

// Initialize services
const setDataService = new SetDataService();
setDataService.initialize();
const compositionService = new CompositionService();

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
    }
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
    }
  }
};