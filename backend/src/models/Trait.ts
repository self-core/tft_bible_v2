import mongoose from 'mongoose';

export interface ITraitDocument extends mongoose.Document {
  key: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  breakpoints: Array<{
    count: number;
    bonus: string;
    variables: Array<{ name: string; value: number }>;
    rawVariables: Array<{ key: string; value: number }>;
  }>;
}

const traitSchema = new mongoose.Schema<ITraitDocument>({
  key: { type: String, required: true, unique: true },
  name: String,
  description: String,
  imageUrl: String,
  breakpoints: [{
    count: { type: Number, required: true },
    bonus: { type: String, required: true },
    variables: { type: [{ name: String, value: Number }], default: [] },
    rawVariables: { type: [{ key: String, value: Number }], default: [] },
  }]
});

export const TraitModel = mongoose.model<ITraitDocument>('Trait', traitSchema);