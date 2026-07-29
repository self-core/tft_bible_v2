import mongoose from 'mongoose';

export interface IItemDocument extends mongoose.Document {
  id: string;
  name: string;
  description: string;
  components: string[];
  imageUrl?: string;
  unique?: boolean;
  trait?: string | null;
}

const itemSchema = new mongoose.Schema<IItemDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  components: [{ type: String }],
  imageUrl: String,
  unique: Boolean,
  trait: String
});

export const ItemModel = mongoose.model<IItemDocument>('Item', itemSchema);