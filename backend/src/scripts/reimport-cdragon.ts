import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { CDragonTransformer } from '../services/_internal/CDragonTransformer';
import { TftRawData } from '../services/_internal/CDragonService';
import { ISetChampion, ITrait, IItem } from '../interfaces';
import { ChampionModel } from '../models/Champion';
import { TraitModel } from '../models/Trait';
import { ItemModel } from '../models/Item';
import { SetModel } from '../models/Set';
import { buildAssetMaps, repairImages } from './repair-images';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_FILE = path.resolve(__dirname, '../../../data/cdragon_en_us.json');
const DEFAULT_CDN_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';
const PBE_CDN_BASE =
  'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default';
const LIVE_URL = 'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json';
const PBE_URL = 'https://raw.communitydragon.org/pbe/cdragon/tft/en_us.json';

export function parseJsonWithBom(text: string): TftRawData {
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

export interface TransformedSet {
  setName: string;
  champions: ISetChampion[];
  traits: ITrait[];
  items: IItem[];
  augments: any[];
}

export function selectAndTransform(
  raw: TftRawData,
  setId: number,
  cdnBase: string = DEFAULT_CDN_BASE,
): TransformedSet {
  return CDragonTransformer.transformSet(raw, setId, cdnBase);
}

function fetchJson(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Fetch failed: ${res.statusCode} ${url}`));
          return;
        }
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

async function persist(setId: number, data: TransformedSet, status: 'upcoming' | 'active' | 'archived') {
  for (const c of data.champions) {
    await ChampionModel.updateOne({ id: c.id }, { $set: c }, { upsert: true });
  }
  for (const t of data.traits) {
    await TraitModel.updateOne({ key: t.key }, { $set: t }, { upsert: true });
  }
  for (const i of data.items) {
    await ItemModel.updateOne({ id: i.id }, { $set: i }, { upsert: true });
  }
  await SetModel.updateOne(
    { setId },
    {
      $set: {
        setId,
        setName: data.setName,
        status,
        champions: data.champions.map((c) => c.id),
        traits: data.traits.map((t) => t.key),
        items: data.items.map((i) => i.id),
        augments: data.augments,
      },
    },
    { upsert: true },
  );
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.indexOf('--file');
  const usePbe = args.includes('--pbe');
  const dryRun = args.includes('--dry-run');
  const setIds = args
    .filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--file')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

  if (setIds.length === 0) {
    console.error('Usage: npm run reimport -- [--file <path>] [--pbe] [--dry-run] <setId...>');
    process.exit(1);
  }

  const text = usePbe
    ? await fetchJson(PBE_URL)
    : fs.readFileSync(fileArg >= 0 ? args[fileArg + 1] : DEFAULT_FILE, 'utf8');
  const raw = parseJsonWithBom(text);
  const cdnBase = usePbe ? PBE_CDN_BASE : DEFAULT_CDN_BASE;

  if (!dryRun) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible';
    await mongoose.connect(uri);
  }

  for (const setId of setIds) {
    const data = selectAndTransform(raw, setId, cdnBase);
    console.log(
      `[reimport] set ${setId}: ${data.champions.length} champions, ${data.traits.length} traits, ${data.items.length} items, ${data.augments.length} augments`,
    );
    if (data.champions.length === 0) {
      console.warn(`[reimport] WARNING: set ${setId} has 0 champions — skipping persist`);
      continue;
    }
    if (!dryRun) await persist(setId, data, usePbe ? 'upcoming' : 'active');
  }

  if (!dryRun) {
    // cdragon asset paths vary (with/without .TFT_SetNN suffix, missing files),
    // so validate the generated URLs once after storing the set.
    await repairImages(setIds, false, buildAssetMaps(raw));
  }

  if (!dryRun) await mongoose.disconnect();
  console.log('[reimport] done');
}

if (require.main === module) {
  main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[reimport] failed: ${message}`);
    process.exit(1);
  });
}
