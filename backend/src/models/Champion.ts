import mongoose from 'mongoose';

export interface IChampionDocument extends mongoose.Document {
  id: string;
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
    variables: Array<{ name: string; values: number[] }>;
  };
  imageUrl?: string;
  splashUrl?: string;
  iconUrl?: string;
}

const championSchema = new mongoose.Schema<IChampionDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  traits: [{ type: String }],
  stats: {
    hp: { type: Number, required: true },
    mana: { type: Number, required: true },
    damage: { type: Number, required: true }
  },
  ability: {
    name: { type: String, required: true },
    variables: { type: [{ name: String, values: [Number] }], default: [] }
  },
  imageUrl: String,
  splashUrl: String,
  iconUrl: String
});

export const ChampionModel = mongoose.model<IChampionDocument>('Champion', championSchema);