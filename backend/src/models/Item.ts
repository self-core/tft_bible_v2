import mongoose from 'mongoose';

export interface IItemDocument extends mongoose.Document {
  id: string;
  name: string;
  description: string;
  components: string[];
  effects: Array<{ name: string; value: number }>;
  rawEffects: Array<{ key: string; value: number }>;
  imageUrl?: string;
  unique?: boolean;
  trait?: string | null;
}

const itemSchema = new mongoose.Schema<IItemDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  components: [{ type: String }],
  effects: { type: [{ name: String, value: Number }], default: [] },
  rawEffects: { type: [{ key: String, value: Number }], default: [] },
  imageUrl: String,
  unique: Boolean,
  trait: String
});

export const ItemModel = mongoose.model<IItemDocument>('Item', itemSchema);