import { ISetChampion, ITrait, IItem, IComposition, ISetData } from './interfaces';
import dragontailService from './services/dragontailService';

// Initialize the dragontail service
dragontailService.initialize();

// Realistic data based on actual TFT data sources following the new Set-based architecture
let set16Data: ISetData;

// Function to get the current set data (either from dragontail or fallback)
const getCurrentSetData = (): ISetData => {
  return dragontailService.getSetData();
};

// Async function to get the current set data from database
const getCurrentSetDataFromDB = async (): Promise<ISetData> => {
  return await dragontailService.getSetDataFromDB();
};

const compositions: IComposition[] = [
  {
    id: 'hyper-carry',
    title: 'Hyper Carry',
    description: 'A popular hyper carry composition focused on dealing massive damage with multiple carries.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Jinx', 'TFT16_Ashe'],
    traitBonuses: ['Gunner: 4 units', 'Ranger: 2 units'],
    augmentRecommendations: ['arcane-nullifier', 'balanced-diet'],
    difficulty: 'Advanced',
    region: 'Runeterra'
  },
  {
    id: 'sorcerer-control',
    title: 'Sorcerer Control',
    description: 'A control composition utilizing sorcerer units for mana manipulation and crowd control.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Ahri', 'TFT16_Lux'],
    traitBonuses: ['Sorcerer: 4 units', 'Arcane: 2 units'],
    augmentRecommendations: ['backfoot', 'big-spear'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  },
  {
    id: 'ninja-assassin',
    title: 'Ninja Assassin',
    description: 'A burst damage composition combining Ninja and Assassin units for high damage and mobility.',
    setId: 16, // Set ID for this composition
    championIds: ['TFT16_Akali'],
    traitBonuses: ['Ninja: 1 unit', 'Assassin: 4 units'],
    augmentRecommendations: ['arcane-nullifier', 'backfoot'],
    difficulty: 'Intermediate',
    region: 'Runeterra'
  }
];

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
    compositions: () => compositions,
    compositionsBySet: (_: any, { setId }: { setId: number }) => {
      return compositions.filter((comp: IComposition) => comp.setId === setId);
    },
    composition: (_: any, { id }: { id: string }) => compositions.find((comp: IComposition) => comp.id === id),
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

      const filteredCompositions = compositions.filter((comp: IComposition) =>
        comp.title.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        comp.traitBonuses.some((bonus: string) => bonus.toLowerCase().includes(term))
      );

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
    createComposition: (_: any, { input }: { input: IComposition }) => {
      // Generate a unique ID for the new composition
      const newId = input.title.toLowerCase().replace(/\s+/g, '-');

      const newComposition: IComposition = {
        ...input,
        id: newId
      };

      compositions.push(newComposition);
      return newComposition;
    },
    updateComposition: (_: any, { id, input }: { id: string, input: Partial<IComposition> }) => {
      const index = compositions.findIndex(comp => comp.id === id);
      if (index === -1) {
        throw new Error(`Composition with id ${id} not found`);
      }

      compositions[index] = { ...compositions[index], ...input } as IComposition;
      return compositions[index];
    },
    deleteComposition: (_: any, { id }: { id: string }) => {
      const initialLength = compositions.length;
      const index = compositions.findIndex(comp => comp.id === id);
      if (index !== -1) {
        compositions.splice(index, 1);
      }
      return compositions.length < initialLength; // Return true if deletion occurred
    }
  }
};