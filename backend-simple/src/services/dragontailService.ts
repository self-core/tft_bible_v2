import fs from 'fs';
import path from 'path';
import { ISetChampion, ISetData, ITrait, IItem } from '../interfaces';
import { ChampionModel } from '../models/Champion';
import { TraitModel } from '../models/Trait';
import { ItemModel } from '../models/Item';
import { SetModel } from '../models/Set';

interface DragontailChampion {
  name: string;
  id: number;
  key: string;
  cost: number;
  traits: string[];
  stats: {
    hp: number;
    mana: number;
    damage: number;
    [key: string]: number;
  };
  ability: {
    name: string;
    variables?: Record<string, number[]>;
    [key: string]: any;
  };
  icon: string;
  squareIcon: string;
  splash: string;
}

interface DragontailTrait {
  name: string;
  id: string;
  key: string;
  description: string;
  [key: string]: any;
}

interface DragontailItem {
  id: number;
  name: string;
  desc: string;
  icon: string;
  from?: number[];
  to?: number[];
  [key: string]: any;
}

interface TFTChampion {
  name: string;
  cost: number;
  traits: string[];
  stats: {
    hp: number;
    mana: number;
    damage: number;
  };
  ability: {
    name: string;
    variables: Record<string, number[]>;
  };
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
}

interface TFTSetData {
  champions: TFTChampion[];
  traits: DragontailTrait[];
  items: DragontailItem[];
}

class DragontailService {
  private dragontailPath: string;
  private tftData: TFTSetData | null = null;

  constructor() {
    // Try to locate the dragontail data - this may need adjustment based on the actual environment
    const defaultPath = path.join('C:', 'Users', 'puppets', 'Documents', 'League of Legends', 'dragontail-15.24.1', '15.24.1', 'data', 'en_US');

    // If running in Docker, we use the mounted volume path
    const dockerPath = path.join('/app', 'dragontail-data', '15.24.1', 'data', 'en_US');

    if (fs.existsSync(dockerPath)) {
      this.dragontailPath = dockerPath;
    } else if (fs.existsSync(defaultPath)) {
      this.dragontailPath = defaultPath;
    } else {
      // Fallback to a relative path if the absolute path doesn't exist
      this.dragontailPath = path.join(process.cwd(), 'dragontail-data', '15.24.1', 'data', 'en_US');

      // If dragontail data is not available anywhere, we'll use embedded data
      console.warn('Dragontail data not found at any expected location. Using embedded data only.');
    }
  }

  async initialize(): Promise<void> {
    try {
      // First, try to load data from MongoDB
      const set16 = await SetModel.findOne({ setId: 16 });

      if (set16) {
        // Data already exists in database, load it
        console.log('Loading Set 16 data from MongoDB');
        await this.loadTFTDataFromDB();
      } else {
        // Check if dragontail data is accessible
        const championsPath = path.join(this.dragontailPath, 'tft-champion.json');
        if (fs.existsSync(championsPath)) {
          // Data doesn't exist in database, load from dragontail and persist to DB
          console.log('Loading Set 16 data from dragontail and persisting to MongoDB');
          await this.loadTFTDataAndPersist();
        } else {
          // Dragontail data is not available, initialize with empty data to use embedded fallback
          console.log('Dragontail data not available, using embedded data only');
          this.tftData = null;
        }
      }
    } catch (error) {
      console.error('Failed to initialize dragontail service:', error);
      console.log('Falling back to embedded data');
      // If dragontail data is not available, we'll use the embedded data
      this.tftData = null;
    }
  }

  private async loadTFTDataFromDB(): Promise<void> {
    try {
      // Load Set 16 data from database
      const set16 = await SetModel.findOne({ setId: 16 }).exec();
      if (!set16) {
        throw new Error('Set 16 not found in database');
      }

      // Load champions by IDs
      const championIds = set16.champions;
      const champions = await ChampionModel.find({ id: { $in: championIds } }).exec();

      // Load traits by keys
      const traitKeys = set16.traits;
      const traits = await TraitModel.find({ key: { $in: traitKeys } }).exec();

      // Load items by IDs
      const itemIds = set16.items;
      const items = await ItemModel.find({ id: { $in: itemIds } }).exec();

      this.tftData = {
        champions: champions.map(doc => ({
          name: doc.name,
          cost: doc.cost,
          traits: doc.traits,
          stats: {
            hp: doc.stats.hp || 0,
            mana: doc.stats.mana || 0,
            damage: doc.stats.damage || 0
          },
          ability: doc.ability,
          imageUrl: doc.imageUrl,
          splashUrl: doc.splashUrl,
          iconUrl: doc.iconUrl
        })),
        traits: traits.map(doc => ({
          key: doc.key,
          name: doc.name || '',
          description: doc.description || '',
          breakpoints: doc.breakpoints,
          id: doc.key,  // Adding the required id field
        })),
        items: items.map(doc => ({
          id: parseInt(doc.id) || 0, // Convert string ID to number
          name: doc.name,
          desc: doc.description,
          icon: doc.imageUrl || '',
          from: doc.components as any,
          to: [] // This might need to be populated differently
        }))
      };

      console.log('Set 16 data loaded from MongoDB successfully');
    } catch (error) {
      console.error('Failed to load Set 16 data from MongoDB:', error);
      throw error;
    }
  }

  private async loadTFTDataAndPersist(): Promise<void> {
    try {
      // Load data from dragontail files
      const rawTFTData = await this.loadRawTFTData();

      // Persist champions to database
      await ChampionModel.deleteMany({ id: { $in: rawTFTData.champions.map(c => `TFT16_${c.name.trim().replace(/\s+/g, '')}`) } });
      const championDocs = rawTFTData.champions.map(champ => ({
        id: `TFT16_${champ.name.trim().replace(/\s+/g, '')}`, // Generate a unique ID
        name: champ.name,
        cost: champ.cost,
        traits: champ.traits,
        stats: champ.stats,
        ability: champ.ability,
        imageUrl: champ.imageUrl,
        splashUrl: champ.splashUrl,
        iconUrl: champ.iconUrl
      }));
      await ChampionModel.insertMany(championDocs, { ordered: false }).catch(err => {
        // Ignore duplicate key errors, just means they already exist
        if (err.code !== 11000) {
          throw err;
        }
      });

      // Persist traits to database
      await TraitModel.deleteMany({ key: { $in: rawTFTData.traits.map(t => t.key) } });
      const traitDocs = rawTFTData.traits.map(trait => ({
        key: trait.key,
        name: trait.name,
        description: trait.description,
        breakpoints: trait.breakpoints
      }));
      await TraitModel.insertMany(traitDocs, { ordered: false }).catch(err => {
        // Ignore duplicate key errors
        if (err.code !== 11000) {
          throw err;
        }
      });

      // Persist items to database
      await ItemModel.deleteMany({ id: { $in: rawTFTData.items.map(i => i.id.toString()) } });
      const itemDocs = rawTFTData.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        components: item.components || [],
        imageUrl: item.imageUrl,
        unique: item.unique,
        trait: item.trait
      }));
      await ItemModel.insertMany(itemDocs, { ordered: false }).catch(err => {
        // Ignore duplicate key errors
        if (err.code !== 11000) {
          throw err;
        }
      });

      // Create or update the Set document
      const setDoc = {
        setId: 16,
        setName: "Lore & Legends",
        champions: rawTFTData.champions.map(c => `TFT16_${c.name.trim().replace(/\s+/g, '')}`),
        traits: rawTFTData.traits.map(t => t.key),
        items: rawTFTData.items.map(i => i.id),
        augments: [
          {
            id: 'arcane-nullifier',
            name: 'Arcane Nullifier',
            description: 'Combat start: Your units purge the enemies at the start of combat, causing them to take 25% more magic damage until they cast their ability.',
            imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
          },
          {
            id: 'backfoot',
            name: 'Backfoot',
            description: 'Combat start: Your highest-starred unit gains 30% Attack Speed and is immune to crowd control for 10 seconds.',
            imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
          },
          {
            id: 'balanced-diet',
            name: 'Balanced Diet',
            description: 'Every 4 exp gives 1 temporary item component. Gain 2 exp.',
            imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
          },
          {
            id: 'big-spear',
            name: 'Big Spear',
            description: 'Your units gain 25% Attack Range and 15% Attack Damage.',
            imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
          }
        ],
        mechanics: {}
      };

      await SetModel.findOneAndUpdate(
        { setId: 16 },
        setDoc,
        { upsert: true, new: true }
      );

      // Set the in-memory data
      this.tftData = rawTFTData;
      console.log('Set 16 data loaded from dragontail and persisted to MongoDB successfully');
    } catch (error) {
      console.error('Failed to load and persist Set 16 data:', error);
      throw error;
    }
  }

  private async loadRawTFTData(): Promise<TFTSetData> {
    // Look for SET16-specific files first, then fall back to generic files
    let championsPath = path.join(this.dragontailPath, 'tft-champion_Set16.json');
    let traitsPath = path.join(this.dragontailPath, 'tft-trait_Set16.json');
    let itemsPath = path.join(this.dragontailPath, 'tft-item_Set16.json');

    // Check if SET16-specific files exist
    let championsExists = fs.existsSync(championsPath);
    let traitsExists = fs.existsSync(traitsPath);
    let itemsExists = fs.existsSync(itemsPath);

    // If SET16 files don't exist, try generic files
    if (!championsExists) {
      const genericChampionsPath = path.join(this.dragontailPath, 'tft-champion.json');
      if (fs.existsSync(genericChampionsPath)) {
        championsPath = genericChampionsPath;
        championsExists = true;
      }
    }
    if (!traitsExists) {
      const genericTraitsPath = path.join(this.dragontailPath, 'tft-trait.json');
      if (fs.existsSync(genericTraitsPath)) {
        traitsPath = genericTraitsPath;
        traitsExists = true;
      }
    }
    if (!itemsExists) {
      const genericItemsPath = path.join(this.dragontailPath, 'tft-item.json');
      if (fs.existsSync(genericItemsPath)) {
        itemsPath = genericItemsPath;
        itemsExists = true;
      }
    }

    // Check if the files exist
    if (!championsExists || !traitsExists || !itemsExists) {
      throw new Error('TFT data files not found in dragontail directory');
    }

    // Read the files
    const championsRaw = fs.readFileSync(championsPath, 'utf8');
    const traitsRaw = fs.readFileSync(traitsPath, 'utf8');
    const itemsRaw = fs.readFileSync(itemsPath, 'utf8');

    // Parse the JSON
    const champions: Record<string, any> = JSON.parse(championsRaw);
    const traits: Record<string, any> = JSON.parse(traitsRaw);
    const items: Record<string, any> = JSON.parse(itemsRaw);

    // Process all entries in the dragontail data that look like champions
    // The dragontail data has the format: { "Maps/Shipping/Map22/Sets/TFTSet16/Shop/TFT16_Aatrox": { id: "TFT16_Aatrox", ... } }
    const tftChampions: TFTChampion[] = Object.entries(champions)
      .filter(([key, champ]: [string, any]) => {
        // Only include entries that are not top-level metadata fields
        // and are actual object entries
        return !['data', 'type', 'version'].includes(key) &&
               champ &&
               typeof champ === 'object';
      })
      .map(([key, champ]: [string, any]) => {
        // Extract champion data from the dragontail format
        const name = (champ.name || key.split('/').pop()?.replace('TFT16_', '') || '').trim();
        const cost = champ.tier || 1; // Use tier as cost in dragontail data
        const traits: string[] = []; // Traits are not directly available in this format

        // Extract stats - they might be in different formats
        const stats = {
          hp: 600, // Default value since not available in this format
          mana: 40, // Default value since not available in this format
          damage: 50 // Default value since not available in this format
        };

        // Extract ability information - not available in this format
        const ability = {
          name: 'Unknown Ability',
          variables: {}
        };

        // Construct image URLs using CommunityDragon from the image path
        const imageFullPath = champ.image?.full || '';
        const imageUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/tft-set16/${imageFullPath}`.replace('//', '/') : undefined;
        const iconUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/champion-portraits/${champ.image?.full}`.replace('//', '/') : undefined;
        const splashUrl = undefined; // Not available in this format

        return {
          name,
          cost,
          traits,
          stats,
          ability,
          imageUrl,
          splashUrl,
          iconUrl
        };
      })
      // Only include champions that have a valid name
      .filter(champ => champ.name && champ.name.trim().length > 0);

    // Process traits to match expected format
    const tftTraits = Object.entries(traits).map(([key, trait]: [string, any]) => {
      return {
        id: trait.id || trait.key || key || '',
        key: trait.key || key || trait.id || '',
        name: trait.name || trait.displayName || trait.key || key || '',
        description: trait.description || trait.desc || '',
        breakpoints: trait.breakpoints || trait.tiers || []
      };
    });

    // Process items to match expected format
    const tftItems = Object.entries(items).map(([key, item]: [string, any]) => {
      // Handle the dragontail data structure for items
      const itemId = item.id || key.split('/').pop() || '';
      const itemName = item.name || key.split('/').pop()?.replace('TFT_Item_', '').replace(/_/g, ' ') || 'Unknown Item';
      const itemDesc = item.description || item.desc || 'No description available';

      // Construct image URLs using CommunityDragon from the image path
      const imageFullPath = item.image?.full || '';
      const imageUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/${imageFullPath}`.replace('//', '/') : undefined;

      return {
        id: itemId,
        name: itemName,
        desc: itemDesc,
        icon: imageUrl || '',
        from: [], // Not available in this format
        to: [], // Not available in this format
        components: [], // Not available in this format
        imageUrl: imageUrl,
        unique: false, // Not available in this format
        trait: undefined // Not available in this format
      };
    });

    return {
      champions: tftChampions,
      traits: tftTraits,
      items: tftItems
    };
  }

  private async loadTFTData(): Promise<TFTSetData> {
    // Look for SET16-specific files first, then fall back to generic files
    let championsPath = path.join(this.dragontailPath, 'tft-champion_Set16.json');
    let traitsPath = path.join(this.dragontailPath, 'tft-trait_Set16.json');
    let itemsPath = path.join(this.dragontailPath, 'tft-item_Set16.json');

    // Check if SET16-specific files exist
    let championsExists = fs.existsSync(championsPath);
    let traitsExists = fs.existsSync(traitsPath);
    let itemsExists = fs.existsSync(itemsPath);

    // If SET16 files don't exist, try generic files
    if (!championsExists) {
      const genericChampionsPath = path.join(this.dragontailPath, 'tft-champion.json');
      if (fs.existsSync(genericChampionsPath)) {
        championsPath = genericChampionsPath;
        championsExists = true;
      }
    }
    if (!traitsExists) {
      const genericTraitsPath = path.join(this.dragontailPath, 'tft-trait.json');
      if (fs.existsSync(genericTraitsPath)) {
        traitsPath = genericTraitsPath;
        traitsExists = true;
      }
    }
    if (!itemsExists) {
      const genericItemsPath = path.join(this.dragontailPath, 'tft-item.json');
      if (fs.existsSync(genericItemsPath)) {
        itemsPath = genericItemsPath;
        itemsExists = true;
      }
    }

    // Check if the files exist
    if (!championsExists || !traitsExists || !itemsExists) {
      throw new Error('TFT data files not found in dragontail directory');
    }

    // Read the files
    const championsRaw = fs.readFileSync(championsPath, 'utf8');
    const traitsRaw = fs.readFileSync(traitsPath, 'utf8');
    const itemsRaw = fs.readFileSync(itemsPath, 'utf8');

    // Parse the JSON
    const champions: Record<string, any> = JSON.parse(championsRaw);
    const traits: Record<string, any> = JSON.parse(traitsRaw);
    const items: Record<string, any> = JSON.parse(itemsRaw);

    // Process all entries in the dragontail data that look like champions
    // The dragontail data has the format: { "Maps/Shipping/Map22/Sets/TFTSet16/Shop/TFT16_Aatrox": { id: "TFT16_Aatrox", ... } }
    const tftChampions: TFTChampion[] = Object.entries(champions)
      .filter(([key, champ]: [string, any]) => {
        // Only include entries that are not top-level metadata fields
        // and are actual object entries
        return !['data', 'type', 'version'].includes(key) &&
               champ &&
               typeof champ === 'object';
      })
      .map(([key, champ]: [string, any]) => {
        // Extract champion data from the dragontail format
        const name = (champ.name || key.split('/').pop()?.replace('TFT16_', '') || '').trim();
        const cost = champ.tier || 1; // Use tier as cost in dragontail data
        const traits: string[] = []; // Traits are not directly available in this format

        // Extract stats - they might be in different formats
        const stats = {
          hp: 600, // Default value since not available in this format
          mana: 40, // Default value since not available in this format
          damage: 50 // Default value since not available in this format
        };

        // Extract ability information - not available in this format
        const ability = {
          name: 'Unknown Ability',
          variables: {}
        };

        // Construct image URLs using CommunityDragon from the image path
        const imageFullPath = champ.image?.full || '';
        const imageUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/tft-set16/${imageFullPath}`.replace('//', '/') : undefined;
        const iconUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/champion-portraits/${champ.image?.full}`.replace('//', '/') : undefined;
        const splashUrl = undefined; // Not available in this format

        return {
          name,
          cost,
          traits,
          stats,
          ability,
          imageUrl,
          splashUrl,
          iconUrl
        };
      })
      // Only include champions that have a valid name
      .filter(champ => champ.name && champ.name.trim().length > 0);

    // Process traits to match expected format
    const tftTraits = Object.entries(traits).map(([key, trait]: [string, any]) => {
      return {
        id: trait.id || trait.key || key || '',
        key: trait.key || key || trait.id || '',
        name: trait.name || trait.displayName || trait.key || key || '',
        description: trait.description || trait.desc || '',
        breakpoints: trait.breakpoints || trait.tiers || []
      };
    });

    // Process items to match expected format
    const tftItems = Object.entries(items).map(([key, item]: [string, any]) => {
      // Handle the dragontail data structure for items
      const itemId = item.id || key.split('/').pop() || '';
      const itemName = item.name || key.split('/').pop()?.replace('TFT_Item_', '').replace(/_/g, ' ') || 'Unknown Item';
      const itemDesc = item.description || item.desc || 'No description available';

      // Construct image URLs using CommunityDragon from the image path
      const imageFullPath = item.image?.full || '';
      const imageUrl = imageFullPath ? `https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/${imageFullPath}`.replace('//', '/') : undefined;

      return {
        id: itemId,
        name: itemName,
        desc: itemDesc,
        icon: imageUrl || '',
        from: [], // Not available in this format
        to: [], // Not available in this format
        components: [], // Not available in this format
        imageUrl: imageUrl,
        unique: false, // Not available in this format
        trait: undefined // Not available in this format
      };
    });

    return {
      champions: tftChampions,
      traits: tftTraits,
      items: tftItems
    };
  }

  private extractAbilityVariables(ability: any): Record<string, number[]> {
    if (!ability) return {};
    
    // The variables structure can vary, so we need to handle different cases
    if (ability.abilityVariables) {
      return ability.abilityVariables;
    }
    
    if (ability.variables) {
      return ability.variables;
    }
    
    // Handle the case where variables are nested differently
    const result: Record<string, number[]> = {};
    
    // Look for damage values and other common variables
    if (ability.abilityProperty && typeof ability.abilityProperty === 'object') {
      for (const [key, value] of Object.entries(ability.abilityProperty)) {
        if (Array.isArray(value)) {
          result[key] = value as number[];
        } else if (typeof value === 'number') {
          result[key] = [value, value, value]; // Default to same value for all star levels
        }
      }
    }
    
    return result;
  }

  async getChampionsFromDB(): Promise<ISetChampion[]> {
    try {
      // Get the set data to get the champion IDs for this set
      const setData = await SetModel.findOne({ setId: 16 }).exec();
      if (!setData) {
        throw new Error('Set 16 not found in database');
      }

      // Load champions by IDs from the set document
      const championIds = setData.champions;
      const champions = await ChampionModel.find({ id: { $in: championIds } }).exec();

      return champions.map(doc => ({
        id: doc.id,
        name: doc.name,
        cost: doc.cost,
        traits: doc.traits,
        stats: {
          hp: doc.stats.hp || 0,
          mana: doc.stats.mana || 0,
          damage: doc.stats.damage || 0
        },
        ability: doc.ability,
        imageUrl: doc.imageUrl,
        splashUrl: doc.splashUrl,
        iconUrl: doc.iconUrl
      }));
    } catch (error) {
      console.error('Error fetching champions from database:', error);
      // Fallback to embedded data if database fetch fails
      return this.getEmbeddedChampions();
    }
  }

  getChampions(): ISetChampion[] {
    if (!this.tftData) {
      // Fallback to embedded data if dragontail data is not available
      return this.getEmbeddedChampions();
    }

    return this.tftData.champions.map((champ, index) => ({
      id: `TFT16_${champ.name.replace(/\s+/g, '')}`, // Generate a unique ID
      name: champ.name,
      cost: champ.cost,
      traits: champ.traits,
      stats: {
        hp: champ.stats.hp || 0,
        mana: champ.stats.mana || 0,
        damage: champ.stats.damage || 0
      },
      ability: champ.ability,
      imageUrl: champ.imageUrl,
      splashUrl: champ.splashUrl,
      iconUrl: champ.iconUrl
    }));
  }

  private getEmbeddedChampions(): ISetChampion[] {
    // Return the original embedded data as a fallback
    return [
      {
        id: 'TFT16_Ahri',
        name: 'Ahri',
        cost: 2,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 650, mana: 40, damage: 50 },
        ability: {
          name: 'Orb of Deception',
          variables: {
            Damage: [150, 225, 335],
            Mana: [30, 30, 30]
          }
        },
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103.png',
        splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/103/103000.jpg',
        iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/103-square.png'
      },
      {
        id: 'TFT16_Akali',
        name: 'Akali',
        cost: 3,
        traits: ['Ninja', 'Assassin'],
        stats: { hp: 700, mana: 60, damage: 70 },
        ability: {
          name: 'Five Point Strike',
          variables: {
            Damage: [300, 450, 675],
            Mana: [60, 60, 60]
          }
        },
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84.png',
        splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/84/84000.jpg',
        iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/84-square.png'
      },
      {
        id: 'TFT16_Ashe',
        name: 'Ashe',
        cost: 3,
        traits: ['Frost', 'Ranger'],
        stats: { hp: 650, mana: 70, damage: 65 },
        ability: {
          name: 'Enchanted Crystal Arrow',
          variables: {
            Damage: [500, 750, 1125],
            Mana: [70, 70, 70]
          }
        },
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22.png',
        splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/22/22000.jpg',
        iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/22-square.png'
      },
      {
        id: 'TFT16_Jinx',
        name: 'Jinx',
        cost: 4,
        traits: ['Arcane', 'Gunner'],
        stats: { hp: 750, mana: 80, damage: 75 },
        ability: {
          name: 'Super Mega Death Rocket!',
          variables: {
            Damage: [400, 600, 900],
            Mana: [80, 80, 80]
          }
        },
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222.png',
        splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/222/222000.jpg',
        iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/222-square.png'
      },
      {
        id: 'TFT16_Lux',
        name: 'Lux',
        cost: 3,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 650, mana: 60, damage: 45 },
        ability: {
          name: 'Final Spark',
          variables: {
            Damage: [350, 525, 788],
            Mana: [60, 60, 60]
          }
        },
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99.png',
        splashUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/99/99000.jpg',
        iconUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/99-square.png'
      }
    ];
  }

  async getTraitsFromDB(): Promise<ITrait[]> {
    try {
      // Get the set data to get the trait keys for this set
      const setData = await SetModel.findOne({ setId: 16 }).exec();
      if (!setData) {
        throw new Error('Set 16 not found in database');
      }

      // Load traits by keys from the set document
      const traitKeys = setData.traits;
      const traits = await TraitModel.find({ key: { $in: traitKeys } }).exec();

      return traits.map(doc => ({
        key: doc.key,
        name: doc.name,
        description: doc.description,
        breakpoints: doc.breakpoints
      }));
    } catch (error) {
      console.error('Error fetching traits from database:', error);
      // Fallback to embedded data if database fetch fails
      return this.getEmbeddedTraits();
    }
  }

  getTraits(): ITrait[] {
    if (!this.tftData) {
      return this.getEmbeddedTraits();
    }

    // Process traits from dragontail data
    return this.getEmbeddedTraits(); // For now, use embedded data for traits
  }

  private getEmbeddedTraits(): ITrait[] {
    return [
      {
        key: 'Arcane',
        name: 'Arcane',
        description: 'Arcane units gain mana whenever they deal or take damage.',
        breakpoints: [
          { count: 2, bonus: 'Arcane units gain 20 mana on hit' },
          { count: 4, bonus: 'Arcane units gain 40 mana on hit' },
          { count: 6, bonus: 'Arcane units gain 60 mana on hit' }
        ]
      },
      {
        key: 'Sorcerer',
        name: 'Sorcerer',
        description: 'Sorcerers gain bonus Ability Power. All allies have their Magic Resist reduced.',
        breakpoints: [
          { count: 3, bonus: 'Sorcerers gain 40% AP, 10% enemy MR reduction' },
          { count: 6, bonus: 'Sorcerers gain 70% AP, 20% enemy MR reduction' },
          { count: 9, bonus: 'Sorcerers gain 120% AP, 30% enemy MR reduction' }
        ]
      },
      {
        key: 'Ninja',
        name: 'Ninja',
        description: 'Ninjas gain Attack Damage and Ability Power. This trait is only active when you have exactly 1 or 4 unique Ninjas.',
        breakpoints: [
          { count: 1, bonus: 'Ninja gains 50% AD and 50 AP' },
          { count: 4, bonus: 'All Ninjas gain 50% AD and 50 AP' }
        ]
      },
      {
        key: 'Assassin',
        name: 'Assassin',
        description: 'Assassins leap to the enemy backline and gain Critical Strike Chance and Dodge Chance.',
        breakpoints: [
          { count: 2, bonus: 'Assassins gain 10% Crit Chance and Dodge Chance' },
          { count: 4, bonus: 'Assassins gain 25% Crit Chance and Dodge Chance' },
          { count: 6, bonus: 'Assassins gain 40% Crit Chance and Dodge Chance' }
        ]
      },
      {
        key: 'Ranger',
        name: 'Ranger',
        description: 'Rangers have a chance to double their attack speed for the next attack.',
        breakpoints: [
          { count: 2, bonus: 'Rangers have 30% chance to double attack speed' },
          { count: 4, bonus: 'Rangers have 60% chance to double attack speed' },
          { count: 6, bonus: 'Rangers have 90% chance to double attack speed' }
        ]
      }
    ];
  }

  async getItemsFromDB(): Promise<IItem[]> {
    try {
      // Get the set data to get the item IDs for this set
      const setData = await SetModel.findOne({ setId: 16 }).exec();
      if (!setData) {
        throw new Error('Set 16 not found in database');
      }

      // Load items by IDs from the set document
      const itemIds = setData.items;
      const items = await ItemModel.find({ id: { $in: itemIds } }).exec();

      return items.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        components: doc.components,
        imageUrl: doc.imageUrl,
        unique: doc.unique,
        trait: doc.trait
      }));
    } catch (error) {
      console.error('Error fetching items from database:', error);
      // Fallback to embedded data if database fetch fails
      return this.getEmbeddedItems();
    }
  }

  getItems(): IItem[] {
    if (!this.tftData) {
      return this.getEmbeddedItems();
    }

    // Process items from dragontail data
    return this.getEmbeddedItems(); // For now, use embedded data for items
  }

  private getEmbeddedItems(): IItem[] {
    return [
      {
        id: 'TFT16_BFSword',
        name: 'B.F. Sword',
        description: 'Attack Damage +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/bfsword.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_ChainVest',
        name: 'Chain Vest',
        description: 'Armor +25',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/chainvest.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_NeedlesslyLargeRod',
        name: 'Needlessly Large Rod',
        description: 'Ability Power +15',
        components: [],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/needlesslylargebow.png',
        unique: false,
        trait: undefined
      },
      {
        id: 'TFT16_EdgeOfNight',
        name: 'Edge of Night',
        description: 'Wearer dodges the first attack that would\'ve killed them, and is invulnerable for a short duration.',
        components: ['TFT16_BFSword', 'TFT16_ChainVest'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/guardianangel.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_InfinityEdge',
        name: 'Infinity Edge',
        description: 'Critical Strikes deal +100% damage. Critical Strike Chance +75%',
        components: ['TFT16_BFSword', 'TFT16_SparringGloves'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/infinityedge.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_RabadonsDeathcap',
        name: 'Rabadon\'s Deathcap',
        description: 'Ability Power +75%',
        components: ['TFT16_NeedlesslyLargeRod', 'TFT16_NeedlesslyLargeRod'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/rabadonsdeathcap.png',
        unique: true,
        trait: undefined
      },
      {
        id: 'TFT16_GiantSlayer',
        name: 'Giant Slayer',
        description: 'Attacks and abilities deal 25% more damage to enemies with more Maximum Health than the wearer.',
        components: ['TFT16_RecurveBow', 'TFT16_BFSword'],
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/standard/giantslayer.png',
        unique: false,
        trait: undefined
      }
    ];
  }

  async getSetDataFromDB(): Promise<ISetData> {
    try {
      const setData = await SetModel.findOne({ setId: 16 }).exec();
      if (!setData) {
        throw new Error('Set 16 not found in database');
      }

      const champions = await this.getChampionsFromDB();
      const traits = await this.getTraitsFromDB();
      const items = await this.getItemsFromDB();

      return {
        setId: setData.setId,
        setName: setData.setName,
        champions: champions,
        traits: traits,
        items: items,
        augments: setData.augments || this.getAugmentsForSet16(),
        mechanics: setData.mechanics || {}
      };
    } catch (error) {
      console.error('Error fetching set data from database:', error);
      // Fallback to in-memory data if database fetch fails
      return {
        setId: 16,
        setName: "Lore & Legends",
        champions: this.getChampions(),
        traits: this.getTraits(),
        items: this.getItems(),
        augments: this.getAugmentsForSet16(), // Use a method to get Set 16 specific augments
        mechanics: {}
      };
    }
  }

  getSetData(): ISetData {
    return {
      setId: 16,
      setName: "Lore & Legends",
      champions: this.getChampions(),
      traits: this.getTraits(),
      items: this.getItems(),
      augments: this.getAugmentsForSet16(), // Use a method to get Set 16 specific augments
      mechanics: {}
    };
  }

  private getAugmentsForSet16(): any[] {
    // Return Set 16 specific augments
    return [
      {
        id: 'arcane-nullifier',
        name: 'Arcane Nullifier',
        description: 'Combat start: Your units purge the enemies at the start of combat, causing them to take 25% more magic damage until they cast their ability.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      },
      {
        id: 'backfoot',
        name: 'Backfoot',
        description: 'Combat start: Your highest-starred unit gains 30% Attack Speed and is immune to crowd control for 10 seconds.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      },
      {
        id: 'balanced-diet',
        name: 'Balanced Diet',
        description: 'Every 4 exp gives 1 temporary item component. Gain 2 exp.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      },
      {
        id: 'big-spear',
        name: 'Big Spear',
        description: 'Your units gain 25% Attack Range and 15% Attack Damage.',
        imageUrl: 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/tft/item-icons/augments/harmony/harmony-ii.png'
      }
    ];
  }
}

export default new DragontailService();