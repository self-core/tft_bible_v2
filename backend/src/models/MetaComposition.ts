import mongoose, { Schema } from 'mongoose';

export interface IMetaStats {
  matchesAnalyzed: number;
  winRate: number;
  top4Rate: number;
  avgPlacement: number;
  pickRate: number;
}

export interface IMetaCompositionDocument extends mongoose.Document {
  id: string;
  setId: number;
  patchVersion: string;
  champions: Array<{ championId: string; count: number; pickRate: number; items: Array<{ itemId: string; count: number }> }>;
  traits: Array<{ key: string; breakpoint: number; count: number }>;
  stats: IMetaStats;
  playstyle: string;
  lastUpdated: Date;
}

const championItemSchema = new Schema({ itemId: String, count: Number }, { _id: false });
const metaChampionSchema = new Schema({
  championId: String,
  count: Number,
  pickRate: Number,
  items: [championItemSchema],
}, { _id: false });
const metaTraitSchema = new Schema({ key: String, breakpoint: Number, count: Number }, { _id: false });

const metaCompSchema = new Schema<IMetaCompositionDocument>({
  id: { type: String, required: true, unique: true },
  setId: { type: Number, required: true },
  patchVersion: { type: String, required: true },
  champions: [metaChampionSchema],
  traits: [metaTraitSchema],
  stats: {
    matchesAnalyzed: Number,
    winRate: Number,
    top4Rate: Number,
    avgPlacement: Number,
    pickRate: Number,
  },
  playstyle: String,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

metaCompSchema.index({ setId: 1, patchVersion: 1, 'stats.pickRate': -1 });

export const MetaCompositionModel = mongoose.model<IMetaCompositionDocument>('MetaComposition', metaCompSchema);
