import type { StatModifier } from '../types';

/**
 * Maps cdragon effect/variable names onto engine stat modifiers.
 *
 * cdragon carries plain numbers; percentage-flavoured stats appear both as
 * fractions (AD: 0.1) and whole percents (CritChance: 35), so every percentage
 * mapping normalizes through `asFraction`.
 */
export type EffectStatKey =
  | 'hpFlat'
  | 'hpPercent'
  | 'adPercent'
  | 'apFlat'
  | 'armor'
  | 'magicResist'
  | 'asPercent'
  | 'critChance'
  | 'critMultiplier'
  | 'startingMana'
  | 'manaRegen'
  | 'omnivamp'
  | 'damageAmp';

function asFraction(value: number): number {
  return value > 1 ? value / 100 : value;
}

const EFFECT_MAP: Record<string, { key: EffectStatKey; normalize?: 'fraction' }> = {
  health: { key: 'hpFlat' },
  maxhealth: { key: 'hpFlat' },
  bonushealth: { key: 'hpFlat' },
  flathealth: { key: 'hpFlat' },
  bonuspercenthp: { key: 'hpPercent', normalize: 'fraction' },
  healthincrease: { key: 'hpPercent', normalize: 'fraction' },
  ad: { key: 'adPercent', normalize: 'fraction' },
  attackdamage: { key: 'adPercent', normalize: 'fraction' },
  adincrease: { key: 'adPercent', normalize: 'fraction' },
  ap: { key: 'apFlat' },
  abilitypower: { key: 'apFlat' },
  armor: { key: 'armor' },
  magicresist: { key: 'magicResist' },
  mr: { key: 'magicResist' },
  as: { key: 'asPercent', normalize: 'fraction' },
  attackspeed: { key: 'asPercent', normalize: 'fraction' },
  attackspeedincrease: { key: 'asPercent', normalize: 'fraction' },
  critchance: { key: 'critChance', normalize: 'fraction' },
  critdamage: { key: 'critMultiplier', normalize: 'fraction' },
  mana: { key: 'startingMana' },
  manaregen: { key: 'manaRegen' },
  omnivamp: { key: 'omnivamp', normalize: 'fraction' },
  statomnivamp: { key: 'omnivamp', normalize: 'fraction' },
  lifesteal: { key: 'omnivamp', normalize: 'fraction' },
  damageamp: { key: 'damageAmp', normalize: 'fraction' },
  bonusdamage: { key: 'damageAmp', normalize: 'fraction' },
  bonusmagicdamage: { key: 'damageAmp', normalize: 'fraction' },
};

/**
 * Non-stat parameters that ride along with effects (durations, stack caps,
 * target counts). They are ignored without marking the effect as unmodeled.
 */
const META_PATTERN =
  /^(duration|icd|interval|intervalseconds|cooldown|maxstacks|stackcap|hexrange|hexduration|spellhexradius|numenemies|numtargets|maxtargets|numattacks|attacks(to|per)|tickspersecond|monstercap|refreshseconds|activationdelay|trigger|threshold|chance|delay|radius|range|time|seconds|count|cost|size|distance|healinterval|auratrialtime)$/i;

export function isMetaEffect(name: string): boolean {
  return META_PATTERN.test(normalizeEffectName(name));
}

export function normalizeEffectName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function effectToModifier(name: string, value: number): StatModifier | null {
  if (!Number.isFinite(value)) return null;
  const normalized = normalizeEffectName(name);
  if (normalized === 'resists' || normalized === 'resistances') {
    return { armor: value, magicResist: value };
  }
  const entry = EFFECT_MAP[normalized];
  if (!entry) return null;
  return { [entry.key]: entry.normalize === 'fraction' ? asFraction(value) : value };
}

export function mergeModifier(target: StatModifier, extra: StatModifier): StatModifier {
  for (const key of Object.keys(extra) as Array<keyof StatModifier>) {
    const value = extra[key];
    if (value === undefined) continue;
    target[key] = (target[key] ?? 0) + value;
  }
  return target;
}

export function scaleModifier(modifier: StatModifier, factor: number): StatModifier {
  const scaled: StatModifier = {};
  for (const key of Object.keys(modifier) as Array<keyof StatModifier>) {
    const value = modifier[key];
    if (value === undefined) continue;
    scaled[key] = value * factor;
  }
  return scaled;
}
