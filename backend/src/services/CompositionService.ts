import { CompositionModel } from '../models/Composition';
import { IComposition, IBoardUnit } from '../interfaces';

interface CreateCompositionInput {
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
}

type UpdateCompositionInput = Partial<CreateCompositionInput>;

export class CompositionService {
  async getAll(): Promise<IComposition[]> {
    const docs = await CompositionModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  async getById(id: string): Promise<IComposition | null> {
    const doc = await CompositionModel.findOne({ id }).lean();
    return doc ? this.toInterface(doc) : null;
  }

  async getBySet(setId: number): Promise<IComposition[]> {
    const docs = await CompositionModel.find({ setId }).sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  async create(input: CreateCompositionInput): Promise<IComposition> {
    const id = input.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
    const doc = await CompositionModel.create({ ...input, id });
    return this.toInterface(doc.toObject());
  }

  async update(id: string, input: UpdateCompositionInput): Promise<IComposition | null> {
    const doc = await CompositionModel.findOneAndUpdate(
      { id },
      { $set: input },
      { new: true }
    ).lean();
    return doc ? this.toInterface(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await CompositionModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async search(term: string): Promise<IComposition[]> {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const docs = await CompositionModel.find({
      $or: [
        { title: regex },
        { description: regex },
        { traitBonuses: regex },
      ],
    }).sort({ createdAt: -1 }).lean();
    return docs.map(this.toInterface);
  }

  private toInterface(doc: Record<string, any>): IComposition {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      setId: doc.setId,
      championIds: doc.championIds || [],
      units: doc.units || undefined,
      traitBonuses: doc.traitBonuses || [],
      augmentRecommendations: doc.augmentRecommendations || [],
      difficulty: doc.difficulty,
      region: doc.region,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }
}
