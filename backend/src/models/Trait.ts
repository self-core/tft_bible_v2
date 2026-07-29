import mongoose from 'mongoose';

export interface ITraitDocument extends mongoose.Document {
  key: string;
  name?: string;
  description?: string;
  breakpoints: Array<{
    count: number;
    bonus: string;
  }>;
}

const traitSchema = new mongoose.Schema<ITraitDocument>({
  key: { type: String, required: true, unique: true },
  name: String,
  description: String,
  breakpoints: [{
    count: { type: Number, required: true },
    bonus: { type: String, required: true }
  }]
});

export const TraitModel = mongoose.model<ITraitDocument>('Trait', traitSchema);