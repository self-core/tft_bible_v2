import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sanitizeDescription, sanitizeName } from '../services/_internal/CDragonTransformer';
import { TraitModel } from '../models/Trait';
import { ItemModel } from '../models/Item';
import { SetModel } from '../models/Set';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// One-off repair for rows imported before name/description sanitization existed.
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible';
  await mongoose.connect(uri);

  const counts = { traitNames: 0, traitDescriptions: 0, itemNames: 0, itemDescriptions: 0, augmentNames: 0, augmentDescriptions: 0 };

  for (const t of await TraitModel.find({}).lean()) {
    const name = sanitizeName(t.name) || t.key;
    const description = sanitizeDescription(t.description);
    const patch: Record<string, string> = {};
    if (name !== t.name) { counts.traitNames++; if (!dryRun) patch.name = name; }
    if (description !== t.description) { counts.traitDescriptions++; if (!dryRun) patch.description = description; }
    if (Object.keys(patch).length) await TraitModel.updateOne({ _id: t._id }, { $set: patch });
  }

  for (const i of await ItemModel.find({}).lean()) {
    const name = sanitizeName(i.name) || i.id || 'Unknown Item';
    const description = sanitizeDescription(i.description);
    const patch: Record<string, string> = {};
    if (name !== i.name) { counts.itemNames++; if (!dryRun) patch.name = name; }
    if (description !== i.description) { counts.itemDescriptions++; if (!dryRun) patch.description = description; }
    if (Object.keys(patch).length) await ItemModel.updateOne({ _id: i._id }, { $set: patch });
  }

  for (const s of await SetModel.find({ 'augments.0': { $exists: true } }).lean()) {
    let touched = false;
    const augments = ((s as any).augments || []).map((a: any) => {
      const name = sanitizeName(a.name) || a.id;
      const description = sanitizeDescription(a.description);
      if (name === a.name && description === a.description) return a;
      touched = true;
      if (name !== a.name) counts.augmentNames++;
      if (description !== a.description) counts.augmentDescriptions++;
      return { ...a, name, description };
    });
    if (touched && !dryRun) await SetModel.updateOne({ _id: s._id }, { $set: { augments } });
  }

  console.log(`[sanitize-stored] ${JSON.stringify(counts)}${dryRun ? ' (dry run)' : ''}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[sanitize-stored] failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
