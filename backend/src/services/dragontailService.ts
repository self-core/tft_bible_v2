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
      const champIds = rawTFTData.champions.map((c: TFTChampion) => `TFT16_${c.name.trim().replace(/\s+/g, '')}`);
      await ChampionModel.deleteMany({ id: { $in: champIds } });
      const championDocs = rawTFTData.champions.map((champ: TFTChampion) => ({
        id: `TFT16_${champ.name.trim().replace(/\s+/g, '')}`, // Construct ID from name like embedded data
        name: champ.name,
        cost: champ.cost,
        traits: champ.traits,
        stats: champ.stats,
        ability: champ.ability,
        imageUrl: champ.imageUrl,
        splashUrl: champ.splashUrl,
        iconUrl: champ.iconUrl
      }));
      await ChampionModel.insertMany(championDocs, { ordered: false }).catch((err: any) => {
        if (err.code !== 11000) throw err;
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

    // Read and parse the JSON files
    const championsFile = fs.readFileSync(championsPath, 'utf8');
    const traitsFile = fs.readFileSync(traitsPath, 'utf8');
    const itemsFile = fs.readFileSync(itemsPath, 'utf8');
    const championsJson: Record<string, any> = JSON.parse(championsFile);
    const traitsJson: Record<string, any> = JSON.parse(traitsFile);
    const itemsJson: Record<string, any> = JSON.parse(itemsFile);

    // Handle nested structure where data is under a 'data' key
    const championsData = championsJson.data || {};
    const traitsData = traitsJson.data || {};
    const itemsData = itemsJson.data || {};

    // Build a trait lookup from traits data for champion trait assignment
    // Traits have format: { id: "TFT16_Arcane", key: "Arcane", name: "Arcane", description: "..." }
    const traitKeyMap: Record<string, { key: string; name: string; desc: string }> = {};
    Object.entries(traitsData).forEach(([key, trait]: [string, any]) => {
      if (trait.key || trait.name) {
        const k = trait.key || key;
        traitKeyMap[k] = {
          key: k,
          name: trait.name || k,
          desc: trait.description || ''
        };
      }
    });

    // Process all entries in the dragontail data that look like champions
    // Filter for TFTSet16 specifically and ensure proper structure
    const tftChampions: TFTChampion[] = Object.entries(championsData)
      .filter(([key, champ]: [string, any]) => {
        return key.includes('TFTSet16') &&
               champ &&
               typeof champ === 'object' &&
               champ.id &&
               champ.name;
      })
      .map(([key, champ]: [string, any]) => {
        const name = champ.name || '';
        const champId = champ.id || key.split('/').pop() || '';
        const cost = champ.tier || champ.cost || 1;

        // Champion may have traits listed in its data
        const traits: string[] = champ.traits || [];

        // Extract stats
        const stats = {
          hp: champ.stats?.hp || 600,
          mana: champ.stats?.mana || 40,
          damage: champ.stats?.damage || 50
        };

        // Extract ability information
        const ability = {
          name: champ.ability?.name || champ.spellName || 'Unknown Ability',
          variables: champ.ability?.variables || champ.spellVariables || {}
        };

        // Build image URLs using CommunityDragon CDN
        const imageFullPath = champ.image?.full || '';
        const baseUrl = 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1';

        // Champion portrait icon (TFT style) - strip splash suffix from filename
        // e.g. "TFT16_Jinx_splash_centered_0.TFT_Set16.png" -> "TFT16_Jinx.png"
        const portraitName = imageFullPath
          ? imageFullPath.replace(/_splash_centered_\d+\.TFT_Set\d+\.png$/i, '.png')
          : '';
        const iconUrl = portraitName
          ? `${baseUrl}/tft/champion-portraits/${portraitName.toLowerCase()}`
          : undefined;

        // Champion splash (centered art)
        const splashUrl = imageFullPath
          ? `${baseUrl}/champion-splashes/tft-set16/${imageFullPath}`
          : undefined;

        // Full-size image (same as splash)
        const imageUrl = splashUrl;

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
    const tftTraits = Object.entries(traitsData)
      .filter(([key, trait]: [string, any]) => {
        // Filter for Set 16 traits
        return key.includes('TFTSet16') || key.includes('TFT16');
      })
      .map(([key, trait]: [string, any]) => {
        return {
          id: trait.id || trait.key || key || '',
          key: trait.key || key || trait.id || '',
          name: trait.name || trait.displayName || trait.key || key || '',
          description: trait.description || trait.desc || '',
          breakpoints: trait.breakpoints || trait.tiers || []
        };
      });

    // If no Set16 traits found, use embedded traits
    if (tftTraits.length === 0) {
      tftTraits.push(...this.getEmbeddedTraits().map(t => ({
        id: t.key,
        key: t.key,
        name: t.name || t.key,
        description: t.description || '',
        breakpoints: t.breakpoints
      })));
    }

    // Process items to match expected format
    const tftItems = Object.entries(itemsData)
      .filter(([key, item]: [string, any]) => {
        // Filter for Set 16 items
        return key.includes('Set16') || key.includes('Item');
      })
      .map(([key, item]: [string, any]) => {
        const itemId = item.id || key.split('/').pop() || '';
        const itemName = item.name || key.split('/').pop()?.replace(/TFT\d*_?Item_?/i, '').replace(/_/g, ' ') || 'Unknown Item';
        const itemDesc = item.description || item.desc || 'No description available';

        // Construct image URLs using CommunityDragon from the image path
        const imageFullPath = item.image?.full || '';
        const baseUrl = 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1';
        const imageUrl = imageFullPath
          ? `${baseUrl}/tft/item-icons/${imageFullPath.toLowerCase()}`
          : undefined;

        return {
          id: itemId,
          name: itemName,
          desc: itemDesc,
          icon: imageUrl || '',
          from: item.from || [],
          to: item.to || [],
          components: item.components || [],
          imageUrl: imageUrl,
          unique: item.unique || false,
          trait: item.trait
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