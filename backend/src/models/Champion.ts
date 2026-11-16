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
    armor: number;
    magicResist: number;
    attackSpeed: number;
    range: number;
    initialMana: number;
    critChance: number;
    critMultiplier: number;
  };
  ability: {
    name: string;
    description?: string;
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
    damage: { type: Number, required: true },
    armor: { type: Number, default: 40 },
    magicResist: { type: Number, default: 40 },
    attackSpeed: { type: Number, default: 0.55 },
    range: { type: Number, default: 1 },
    initialMana: { type: Number, default: 0 },
    critChance: { type: Number, default: 0.25 },
    critMultiplier: { type: Number, default: 1.4 },
  },
  ability: {
    name: { type: String, required: true },
    description: String,
    variables: { type: [{ name: String, values: [Number] }], default: [] }
  },
  imageUrl: String,
  splashUrl: String,
  iconUrl: String
});

export const ChampionModel = mongoose.model<IChampionDocument>('Champion', championSchema);