import mongoose, { Schema } from 'mongoose';

export interface IBoardUnit {
  championId: string;
  position: { row: number; col: number };
  starLevel: number;
  items: string[];
}

export interface ICompositionDocument extends mongoose.Document {
  id: string;
  title: string;
  description: string;
  setId: number;
  championIds: string[];
  units?: IBoardUnit[];
  traitBonuses: string[];
  augmentRecommendations: string[];
  difficulty: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardUnitSchema = new Schema<IBoardUnit>({
  championId: { type: String, required: true },
  position: {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
  },
  starLevel: { type: Number, required: true },
  items: [{ type: String }],
}, { _id: false });

const compositionSchema = new Schema<ICompositionDocument>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  setId: { type: Number, required: true },
  championIds: [{ type: String }],
  units: [boardUnitSchema],
  traitBonuses: [{ type: String }],
  augmentRecommendations: [{ type: String }],
  difficulty: { type: String, required: true },
  region: { type: String, required: true },
}, {
  timestamps: true,
});

export const CompositionModel = mongoose.model<ICompositionDocument>('Composition', compositionSchema);
