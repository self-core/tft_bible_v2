import mongoose from 'mongoose';

export interface ISetDocument extends mongoose.Document {
  setId: number;
  setName: string;
  status: 'upcoming' | 'active' | 'archived';
  champions: string[]; // Array of champion IDs
  traits: string[]; // Array of trait keys
  items: string[]; // Array of item IDs
  augments: any[];
  mechanics: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const setSchema = new mongoose.Schema<ISetDocument>({
  setId: { type: Number, required: true, unique: true },
  setName: { type: String, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'archived'],
    default: 'active',
    required: true,
  },
  champions: [{ type: String }], // IDs of champions in this set
  traits: [{ type: String }], // Keys of traits in this set
  items: [{ type: String }], // IDs of items in this set
  augments: { type: mongoose.Schema.Types.Mixed, default: [] },
  mechanics: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export const SetModel = mongoose.model<ISetDocument>('Set', setSchema);