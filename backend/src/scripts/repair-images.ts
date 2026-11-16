import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ChampionModel } from '../models/Champion';
import { TraitModel } from '../models/Trait';
import { ItemModel } from '../models/Item';
import { SetModel } from '../models/Set';
import { sanitizeDescription, sanitizeName } from '../services/_internal/CDragonTransformer';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LATEST = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';
const PBE = 'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default';
const BASES = [LATEST, PBE];

const LIVE_JSON = [
  'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json',
  'https://raw.communitydragon.org/pbe/cdragon/tft/en_us.json',
];

const SNAPSHOTS = [
  path.resolve(__dirname, '../../../data/cdragon_en_us.json'),
  path.resolve(__dirname, '../../../data/cdragon_pbe_en_us.json'),
];

interface ChampionAssets {
  tileIcon?: string;
  squareIcon?: string;
}

interface ItemMeta {
  name?: string;
  description?: string;
  icon?: string;
}

export interface AssetMaps {
  champions: Map<string, ChampionAssets>;
  traits: Map<string, string>;
  items: Map<string, string>;
  itemMeta: Map<string, ItemMeta>;
  championSets: Map<string, Set<number>>;
  traitSets: Map<string, Set<number>>;
}

function addToSets(map: Map<string, Set<number>>, key: string, setId: number): void {
  const existing = map.get(key);
  if (existing) existing.add(setId);
  else map.set(key, new Set([setId]));
}

function collectAssetMaps(raw: any, maps: AssetMaps): void {
  for (const item of raw.items || []) {
    if (!item.apiName) continue;
    if (item.icon) maps.items.set(item.apiName, item.icon);
    const prev = maps.itemMeta.get(item.apiName);
    maps.itemMeta.set(item.apiName, {
      name: prev?.name || item.name,
      description: prev?.description || item.description || item.desc,
      icon: item.icon || prev?.icon,
    });
  }
  for (const set of raw.setData || []) {
    const setId = Number(/TFT_Set(\d+)/i.exec(set.mutator || '')?.[1] ?? /TFTSet(\d+)/i.exec(set.mutator || '')?.[1] ?? 0);
    for (const c of set.champions || []) {
      const prev = maps.champions.get(c.apiName);
      maps.champions.set(c.apiName, {
        tileIcon: c.tileIcon || prev?.tileIcon,
        squareIcon: c.squareIcon || prev?.squareIcon,
      });
      if (setId) addToSets(maps.championSets, c.apiName, setId);
    }
    for (const t of set.traits || []) {
      if (t.icon) maps.traits.set(t.apiName, t.icon);
      if (setId) addToSets(maps.traitSets, t.apiName, setId);
    }
  }
}

export function buildAssetMaps(raw: any): AssetMaps {
  const maps: AssetMaps = {
    champions: new Map(),
    traits: new Map(),
    items: new Map(),
    itemMeta: new Map(),
    championSets: new Map(),
    traitSets: new Map(),
  };
  collectAssetMaps(raw, maps);
  return maps;
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch (err) {
    console.warn(`[repair-images] live source unavailable (${url}): ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function loadAssetMaps(): Promise<AssetMaps> {
  const maps: AssetMaps = {
    champions: new Map(),
    traits: new Map(),
    items: new Map(),
    itemMeta: new Map(),
    championSets: new Map(),
    traitSets: new Map(),
  };
  // Live data first: local snapshots can predate the current set's roster.
  for (const url of LIVE_JSON) {
    const raw = await fetchJson(url);
    if (raw) collectAssetMaps(raw, maps);
  }
  for (const file of SNAPSHOTS) {
    if (!fs.existsSync(file)) continue;
    try {
      collectAssetMaps(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')), maps);
    } catch {
      // ignore corrupt snapshot
    }
  }
  return maps;
}

function setHintsFrom(asset: string, setIdHint?: number): number[] {
  const hints = new Set<number>();
  if (setIdHint) hints.add(setIdHint);
  const lower = asset.toLowerCase();
  const tft = /tft_?(\d{1,2})/.exec(lower);
  if (tft) hints.add(Number(tft[1]));
  const delimited = /(?:^|[_/])(\d{2})(?:[_/.]|$)/.exec(lower);
  if (delimited) {
    const n = Number(delimited[1]);
    if (n > 0 && n < 100) hints.add(n);
  }
  return [...hints];
}

// CommunityDragon file naming is inconsistent: some builds append `.tft_setN`
// to the png name, others expect the plain name. Probe both.
function slugVariants(asset: string, setIdHint?: number): string[] {
  const cleaned = asset.replace(/\.(tex|png)$/i, '').toLowerCase();
  const stripped = cleaned.replace(/\.tft_set\d+$/i, '');
  const variants = new Set<string>([cleaned, stripped]);
  for (const n of setHintsFrom(cleaned, setIdHint)) {
    variants.add(`${stripped}.tft_set${n}`);
  }
  return [...variants];
}

function candidates(asset: string, setIdHint?: number): string[] {
  const urls: string[] = [];
  for (const base of BASES) {
    for (const variant of slugVariants(asset, setIdHint)) urls.push(`${base}/${variant}.png`);
  }
  return urls;
}

const statusCache = new Map<string, Promise<boolean>>();

function exists(url: string): Promise<boolean> {
  const cached = statusCache.get(url);
  if (cached) return cached;
  const check = (async () => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TFT-Bible/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      await res.body?.cancel();
      return res.ok;
    } catch {
      return false;
    }
  })();
  statusCache.set(url, check);
  return check;
}

async function firstWorking(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await exists(url)) return url;
  }
  return null;
}

function setIdFromDocId(id: string): number | undefined {
  const m = /^(?:TFT|DA_)(\d{1,2})_/i.exec(id) ?? /TFT_?Set(\d{1,2})/i.exec(id);
  if (m) return Number(m[1]);
  const trailing = /_(\d{1,2})(?:_|$)/.exec(id);
  return trailing ? Number(trailing[1]) : undefined;
}

function urlVariants(url: string | null | undefined): string[] {
  if (!url) return [];
  const m = /\/global\/default\/(?:v1\/)?(.+)$/i.exec(url);
  if (!m) return [];
  const cleaned = m[1].replace(/\.(png|tex|jpe?g)$/i, '').toLowerCase();
  const variants = new Set<string>([cleaned]);
  variants.add(cleaned.replace(/\.tft_set\d+(?:_postlaunchaugments)?$/i, ''));
  variants.add(cleaned.replace(/\.tft_\d+_\d+$/i, ''));
  variants.add(cleaned.replace(/_postlaunchaugments$/i, ''));
  return [...variants];
}

function itemCandidates(mappedIcon: string | undefined, currentUrl: string | null | undefined): string[] {
  const urls = mappedIcon ? candidates(mappedIcon) : [];
  for (const base of BASES) {
    for (const variant of urlVariants(currentUrl)) urls.push(`${base}/${variant}.png`);
  }
  return [...new Set(urls)];
}

function inSets(setIds: number[] | undefined, docId: string, setsMap: Map<string, Set<number>>): boolean {
  if (!setIds || setIds.length === 0) return true;
  const memberships = setsMap.get(docId);
  if (!memberships) return false;
  return setIds.some((id) => memberships.has(id));
}

function humanizeAugmentId(id: string): string {
  const stripped = id.replace(/^TFT\d*_Augment_/i, '').replace(/^TFT\d*_/i, '');
  return stripped.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim() || id;
}

export async function repairImages(
  setIds?: number[],
  dryRun = false,
  providedMaps?: AssetMaps,
): Promise<void> {
  const maps = providedMaps ?? (await loadAssetMaps());
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible';
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);

  const counts = {
    champions: 0,
    traits: 0,
    items: 0,
    setAugments: 0,
    missingPortrait: 0,
    missingTrait: 0,
    missingItem: 0,
    missingAugment: 0,
  };

  const champions = await ChampionModel.find({}).lean();
  for (const doc of champions) {
    if (!inSets(setIds, doc.id, maps.championSets)) continue;

    const setId = setIdFromDocId(doc.id) ?? [...(maps.championSets.get(doc.id) ?? [])][0];
    const mapped = maps.champions.get(doc.id);

    let portrait = doc.iconUrl && (await exists(doc.iconUrl)) ? doc.iconUrl : null;
    let splash = doc.splashUrl && (await exists(doc.splashUrl)) ? doc.splashUrl : null;

    if (!portrait || !splash) {
      const portraitCandidates: string[] = [];
      if (mapped?.tileIcon) portraitCandidates.push(...candidates(mapped.tileIcon, setId));
      portraitCandidates.push(
        ...candidates(`ASSETS/Characters/${doc.id}/HUD/${doc.id}_Square.tex`, setId),
      );

      const splashCandidates = mapped?.squareIcon ? candidates(mapped.squareIcon, setId) : [];

      portrait = portrait ?? (await firstWorking(portraitCandidates));
      splash = splash ?? (await firstWorking(splashCandidates));
      portrait = portrait ?? splash;
      splash = splash ?? portrait;
    }

    if (!portrait) {
      counts.missingPortrait++;
      // Clear dead links so the UI falls back to its initials/placeholder tile.
      if (doc.iconUrl || doc.imageUrl || doc.splashUrl) {
        if (!dryRun) {
          await ChampionModel.updateOne(
            { _id: doc._id },
            { $unset: { iconUrl: '', imageUrl: '', splashUrl: '' } },
          );
        }
      }
      continue;
    }

    if (doc.iconUrl !== portrait || doc.imageUrl !== portrait || doc.splashUrl !== splash) {
      counts.champions++;
      if (!dryRun) {
        await ChampionModel.updateOne(
          { _id: doc._id },
          { $set: { iconUrl: portrait, imageUrl: portrait, splashUrl: splash } },
        );
      }
    }
  }

  const traits = await TraitModel.find({}).lean();
  for (const doc of traits) {
    if (!inSets(setIds, doc.key, maps.traitSets)) continue;

    if (doc.imageUrl && (await exists(doc.imageUrl))) continue;

    const icon = maps.traits.get(doc.key);
    const resolved = icon ? await firstWorking(candidates(icon, setIdFromDocId(doc.key))) : null;
    if (!resolved) {
      counts.missingTrait++;
      continue;
    }
    counts.traits++;
    if (!dryRun) await TraitModel.updateOne({ _id: doc._id }, { $set: { imageUrl: resolved } });
  }

  const items = await ItemModel.find({}).lean();
  for (const doc of items) {
    if (doc.imageUrl && (await exists(doc.imageUrl))) continue;

    const resolved = await firstWorking(itemCandidates(maps.items.get(doc.id), doc.imageUrl));
    if (!resolved) {
      counts.missingItem++;
      continue;
    }
    counts.items++;
    if (!dryRun) await ItemModel.updateOne({ _id: doc._id }, { $set: { imageUrl: resolved } });
  }

  // Augment icons live on the embedded set payload, not on an augment collection.
  const sets = await SetModel.find({}).lean();
  for (const set of sets) {
    if (setIds && setIds.length > 0 && !setIds.includes(set.setId)) continue;
    const augments = Array.isArray(set.augments) ? set.augments : [];
    let changed = false;
    for (const augment of augments) {
      const id = augment?.id;
      if (!id) continue;
      const meta = maps.itemMeta.get(id);

      const generatedName = !augment.name || augment.name === humanizeAugmentId(id);
      const metaName = meta?.name ? sanitizeName(meta.name) : '';
      if (generatedName && metaName && augment.name !== metaName) {
        augment.name = metaName;
        counts.setAugments++;
        changed = true;
      }

      if (!augment.description && meta?.description) {
        const description = sanitizeDescription(meta.description);
        if (description) {
          augment.description = description;
          changed = true;
        }
      }

      if (augment.imageUrl && (await exists(augment.imageUrl))) continue;

      const resolved = await firstWorking(itemCandidates(maps.items.get(id), augment.imageUrl));
      if (!resolved) {
        counts.missingAugment++;
        continue;
      }
      augment.imageUrl = resolved;
      counts.setAugments++;
      changed = true;
    }
    if (changed && !dryRun) {
      await SetModel.updateOne({ _id: set._id }, { $set: { augments } });
    }
  }

  console.log(`[repair-images] ${JSON.stringify(counts)}${dryRun ? ' (dry run)' : ''}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const setIds = process.argv
    .filter((a) => !a.startsWith('--'))
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  await repairImages(setIds.length > 0 ? setIds : undefined, dryRun);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[repair-images] failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
