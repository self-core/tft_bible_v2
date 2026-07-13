import 'reflect-metadata';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { container } from '../services/container';
import { ImportService } from '../services/ImportService';
import { PathResolver } from '../services/_internal/PathResolver';
import { SetModel } from '../models/Set';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible_simple';

interface MigrationArgs {
  archiveSetId?: number;
  importSetId?: number;
}

function parseArgs(): MigrationArgs {
  const args = process.argv.slice(2);
  const result: MigrationArgs = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--archive' && args[i + 1]) {
      const val = parseInt(args[i + 1], 10);
      if (isNaN(val)) {
        console.error(`Invalid set ID for --archive: ${args[i + 1]}`);
        process.exit(1);
      }
      result.archiveSetId = val;
      i++;
    } else if (args[i] === '--import' && args[i + 1]) {
      const val = parseInt(args[i + 1], 10);
      if (isNaN(val)) {
        console.error(`Invalid set ID for --import: ${args[i + 1]}`);
        process.exit(1);
      }
      result.importSetId = val;
      i++;
    }
  }

  if (!result.archiveSetId && !result.importSetId) {
    console.error('Usage: npm run migrate:set -- --archive <setId> --import <setId>');
    console.error('  --archive <setId>   Archive the specified set (mark as archived, move files)');
    console.error('  --import <setId>    Import a new set from Dragontail files');
    process.exit(1);
  }

  return result;
}

async function main() {
  const args = parseArgs();

  console.log('=== TFT Set Migration ===');
  console.log(`Archive set: ${args.archiveSetId ?? '(none)'}`);
  console.log(`Import set:  ${args.importSetId ?? '(none)'}`);
  console.log('');

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  const importService = container.resolve(ImportService);
  const pathResolver = container.resolve(PathResolver);

  // Step 1: Archive current set
  if (args.archiveSetId) {
    console.log(`\n--- Archiving Set ${args.archiveSetId} ---`);

    const setDoc = await SetModel.findOne({ setId: args.archiveSetId });
    if (!setDoc) {
      console.error(`Set ${args.archiveSetId} not found in database`);
    } else {
      // Update status
      await SetModel.findOneAndUpdate(
        { setId: args.archiveSetId },
        { status: 'archived' }
      );
      console.log(`Set ${args.archiveSetId} marked as archived in database`);

      // Move Dragontail files
      const { moved, errors } = pathResolver.archiveSetFiles(args.archiveSetId);
      if (moved.length > 0) {
        console.log(`Moved ${moved.length} file(s) to archive: ${moved.join(', ')}`);
      }
      if (errors.length > 0) {
        console.warn(`Archive warnings: ${errors.join('; ')}`);
      }
    }
  }

  // Step 2: Import new set
  if (args.importSetId) {
    console.log(`\n--- Importing Set ${args.importSetId} ---`);

    try {
      const result = await importService.importSet(args.importSetId);
      console.log(`Imported: ${result.champions} champions, ${result.traits} traits, ${result.items} items`);

      // Mark new set as active
      await SetModel.findOneAndUpdate(
        { setId: args.importSetId },
        { status: 'active' }
      );
      console.log(`Set ${args.importSetId} marked as active`);
    } catch (error) {
      console.error(`Failed to import Set ${args.importSetId}:`, error);
      console.warn('Rolling back: deleting partially-imported set data');

      await SetModel.findOneAndDelete({ setId: args.importSetId });

      const { ChampionModel } = require('../models/Champion');
      const { TraitModel } = require('../models/Trait');
      const { ItemModel } = require('../models/Item');

      const prefix = `TFT${args.importSetId}_`;
      await ChampionModel.deleteMany({ id: { $regex: `^${prefix}` } });
      await TraitModel.deleteMany({ key: { $regex: `^${prefix}` } });
      await ItemModel.deleteMany({ id: { $regex: `^${prefix}` } });

      console.log('Rolled back imported champions, traits, and items');
    }
  }

  // Report
  console.log('\n--- Migration Summary ---');
  const allSets = await SetModel.find({}).sort({ setId: -1 }).lean();
  for (const set of allSets) {
    console.log(`  Set ${set.setId} (${(set as any).setName}): ${set.status || 'active'}`);
  }

  const activeSet = allSets.find((s: any) => s.status === 'active');
  if (activeSet) {
    console.log(`\nActive set: ${activeSet.setName} (Set ${activeSet.setId})`);
    console.log(`Recommended TFT_CURRENT_SET=${activeSet.setId}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
