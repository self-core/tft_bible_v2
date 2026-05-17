import { ChampionModel } from '../../models/Champion';
import { TraitModel } from '../../models/Trait';
import { ItemModel } from '../../models/Item';
import { SetModel } from '../../models/Set';
import { ISetData } from '../../interfaces';

export class Repository {
  async getSetData(setId: number): Promise<ISetData | null> {
    const setDoc = await SetModel.findOne({ setId }).exec();
    if (!setDoc) return null;

    const champions = await ChampionModel.find({ id: { $in: setDoc.champions || [] } }).lean();
    const traits = await TraitModel.find({ key: { $in: setDoc.traits || [] } }).lean();
    const items = await ItemModel.find({ id: { $in: setDoc.items || [] } }).lean();

    return {
      setId: setDoc.setId,
      setName: setDoc.setName,
      champions: champions.map(doc => ({
        id: doc.id,
        name: doc.name,
        cost: doc.cost,
        traits: doc.traits,
        stats: doc.stats,
        ability: doc.ability,
        imageUrl: doc.imageUrl,
        splashUrl: doc.splashUrl,
        iconUrl: doc.iconUrl,
      })),
      traits: traits.map(doc => ({
        key: doc.key,
        name: doc.name,
        description: doc.description,
        breakpoints: doc.breakpoints,
      })),
      items: items.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        components: doc.components,
        imageUrl: doc.imageUrl,
        unique: doc.unique,
        trait: doc.trait,
      })),
      augments: (setDoc as any).augments || [],
      mechanics: (setDoc as any).mechanics || {},
    };
  }

  async saveSetData(setId: number, setName: string, championIds: string[], traitKeys: string[], itemIds: string[], augments: any[]): Promise<void> {
    await SetModel.findOneAndUpdate(
      { setId },
      {
        setId,
        setName,
        champions: championIds,
        traits: traitKeys,
        items: itemIds,
        augments,
        mechanics: {},
      },
      { upsert: true, new: true }
    );
  }

  async saveChampions(champions: any[]): Promise<void> {
    for (const c of champions) {
      await ChampionModel.findOneAndUpdate(
        { id: c.id },
        { $set: c },
        { upsert: true }
      );
    }
  }

  async saveTraits(traits: any[]): Promise<void> {
    for (const t of traits) {
      await TraitModel.findOneAndUpdate(
        { key: t.key },
        { $set: t },
        { upsert: true }
      );
    }
  }

  async saveItems(items: any[]): Promise<void> {
    for (const i of items) {
      await ItemModel.findOneAndUpdate(
        { id: i.id },
        { $set: i },
        { upsert: true }
      );
    }
  }

  async hasSet(setId: number): Promise<boolean> {
    const doc = await SetModel.exists({ setId });
    return doc !== null;
  }
}
