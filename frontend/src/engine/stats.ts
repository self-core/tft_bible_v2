import type { AbilityVariable, Champion, Trait } from '../lib/api';
import { resolveTraitStates } from '../lib/traitEngine';
import { ENGINE_CONFIG } from './config';
import { emblemTraitName } from './data/emblems';
import { augmentModifier } from './data/augments';
import { effectToModifier, isMetaEffect, mergeModifier } from './data/effects';
import type {
  AbilityPlan,
  CombatUnitInput,
  CoverageReport,
  PreparedSide,
  PreparedUnit,
  Side,
  SideInput,
  StatModifier,
  UnitStats,
} from './types';

const DAMAGE_EXCLUDE =
  /amp|modifier|reduction|increase|decrease|threshold|percent|pct|duration|cap|chance|ratio|persecond|split|tier|secondary|bonus|repeat|missile|nova|shred|resist|heal|shield|mana/i;

const STAR_TABLE_LENGTH = 7;

export function pickStarValue(values: number[] | undefined, stars: number): number | null {
  if (!values || values.length === 0) return null;
  const star = Math.max(1, Math.min(3, Math.round(stars)));
  let value: number | undefined;
  if (values.length >= STAR_TABLE_LENGTH || values.length === 5) {
    value = values[star];
  } else if (values.length === 4 || values.length === 3) {
    value = values[star - 1];
  } else if (values.length === 2) {
    value = star === 1 ? values[0] : values[1];
  } else {
    value = values[0];
  }
  return value !== undefined && Number.isFinite(value) ? value : null;
}

function findVariable(variables: AbilityVariable[], pattern: RegExp): AbilityVariable | undefined {
  return variables.find(variable => pattern.test(variable.name));
}

function damageCandidates(variables: AbilityVariable[]): AbilityVariable[] {
  return variables.filter(
    variable => /damage/i.test(variable.name) && !DAMAGE_EXCLUDE.test(variable.name)
  );
}

function damageTypeFor(name: string): AbilityPlan['damageType'] {
  if (/^ad|damagead|physical/i.test(name)) return 'physical';
  if (/true/i.test(name)) return 'true';
  return 'magic';
}

export function buildAbilityPlan(champion: Champion, stars: number): AbilityPlan {
  const name = champion.ability?.name || 'Ability';
  const variables = champion.ability?.variables ?? [];
  const empty: AbilityPlan = {
    name,
    damageType: 'magic',
    flatDamage: 0,
    adRatio: 1,
    shield: 0,
    heal: 0,
    targets: 1,
    modeled: false,
    note: 'No numeric ability variables in set data',
  };
  if (variables.length === 0) return empty;

  const candidates = damageCandidates(variables);
  const primary =
    candidates.find(variable => /^(modified)?damage$/i.test(variable.name)) ??
    candidates.find(variable => /^magicdamage$/i.test(variable.name)) ??
    candidates[0];

  let flatDamage = 0;
  for (const candidate of candidates) {
    const value = pickStarValue(candidate.values, stars);
    if (value !== null) flatDamage += value;
  }

  let adRatio = 1;
  if (primary && /ad/i.test(primary.name)) {
    const ratio = primary.values?.[0];
    if (ratio !== undefined && ratio > 0 && ratio <= 5) adRatio = ratio;
  }

  const shieldVariable = findVariable(variables, /shield/i);
  const shieldValue = shieldVariable ? pickStarValue(shieldVariable.values, stars) : null;

  const healVariable = findVariable(variables, /heal/i);
  const healValue = healVariable ? pickStarValue(healVariable.values, stars) : null;

  const targetVariable = findVariable(variables, /^(numenemies|numtargets|maxtargets)/i);
  const targetValue = targetVariable ? pickStarValue(targetVariable.values, stars) : null;

  const modeled = flatDamage > 0 || (shieldValue ?? 0) > 0 || (healValue ?? 0) > 0;

  return {
    name,
    damageType: primary ? damageTypeFor(primary.name) : 'magic',
    flatDamage,
    adRatio,
    shield: shieldValue ?? 0,
    heal: healValue ?? 0,
    targets: Math.max(
      1,
      Math.min(ENGINE_CONFIG.maxAbilityTargets, Math.round(targetValue ?? 1))
    ),
    modeled,
    note: modeled
      ? undefined
      : `Ability variables not interpretable: ${variables.map(v => v.name).join(', ')}`,
  };
}

function starScaled(base: number, stars: number, perStar: number): number {
  return base * Math.pow(perStar, Math.max(0, Math.min(2, stars - 1)));
}

function baseStats(champion: Champion, stars: number): UnitStats {
  const raw = champion.stats ?? ({} as Champion['stats']);
  const manaCost = raw.mana && raw.mana > 0 ? raw.mana : ENGINE_CONFIG.defaultManaCost;
  return {
    maxHp: starScaled(raw.hp ?? ENGINE_CONFIG.defaultHp, stars, ENGINE_CONFIG.hpPerStar),
    attackDamage: starScaled(raw.damage ?? ENGINE_CONFIG.defaultAd, stars, ENGINE_CONFIG.adPerStar),
    abilityPower: 0,
    armor: raw.armor ?? ENGINE_CONFIG.defaultArmor,
    magicResist: raw.magicResist ?? ENGINE_CONFIG.defaultMagicResist,
    attackSpeed: raw.attackSpeed && raw.attackSpeed > 0 ? raw.attackSpeed : ENGINE_CONFIG.defaultAttackSpeed,
    critChance: raw.critChance ?? ENGINE_CONFIG.baseCritChance,
    critMultiplier: raw.critMultiplier && raw.critMultiplier > 0
      ? raw.critMultiplier
      : ENGINE_CONFIG.baseCritMultiplier,
    range: Math.max(1, Math.round(raw.range ?? ENGINE_CONFIG.defaultRange)),
    manaCost,
    startingMana: Math.max(0, raw.initialMana ?? 0),
    manaRegenPerSecond: 0,
    omnivamp: 0,
    damageAmp: 0,
  };
}

function applyModifiers(stats: UnitStats, mods: StatModifier): void {
  stats.maxHp = (stats.maxHp + (mods.hpFlat ?? 0)) * (1 + (mods.hpPercent ?? 0));
  stats.attackDamage =
    (stats.attackDamage + (mods.adFlat ?? 0)) * (1 + (mods.adPercent ?? 0));
  stats.abilityPower = stats.abilityPower * (1 + (mods.apPercent ?? 0)) + (mods.apFlat ?? 0);
  stats.armor = Math.max(0, stats.armor + (mods.armor ?? 0));
  stats.magicResist = Math.max(0, stats.magicResist + (mods.magicResist ?? 0));
  stats.attackSpeed = stats.attackSpeed * (1 + (mods.asPercent ?? 0));
  stats.critChance = Math.min(1, Math.max(0, stats.critChance + (mods.critChance ?? 0)));
  stats.critMultiplier += mods.critMultiplier ?? 0;
  stats.range = Math.max(1, stats.range + (mods.range ?? 0));
  stats.manaRegenPerSecond += mods.manaRegen ?? 0;
  stats.omnivamp = Math.min(1, stats.omnivamp + (mods.omnivamp ?? 0));
  stats.damageAmp = Math.max(0, stats.damageAmp + (mods.damageAmp ?? 0));
  stats.startingMana = Math.min(
    stats.manaCost,
    stats.startingMana + (mods.startingMana ?? 0)
  );
}

function itemModifiers(unit: CombatUnitInput): {
  mods: StatModifier;
  unmodeledItems: string[];
  unmodeledEffects: string[];
} {
  const mods: StatModifier = {};
  const unmodeledItems: string[] = [];
  const unmodeledEffects: string[] = [];

  for (const item of unit.items) {
    const effects = item.effects ?? [];
    let recognized = 0;
    for (const effect of effects) {
      const modifier = effectToModifier(effect.name, effect.value);
      if (modifier) {
        mergeModifier(mods, modifier);
        recognized += 1;
      } else if (!isMetaEffect(effect.name)) {
        unmodeledEffects.push(`${item.name}: ${effect.name}`);
      }
    }
    if (effects.length === 0 || recognized === 0) {
      unmodeledItems.push(item.name);
    }
  }

  return { mods, unmodeledItems, unmodeledEffects };
}

export function prepareSide(side: Side, input: SideInput, traits: Trait[]): PreparedSide {
  const units = input.units;
  const emblemTraits = units.map(unit =>
    unit.items.map(item => emblemTraitName(item)).filter((name): name is string => Boolean(name))
  );

  const resolvedTraits = resolveTraitStates(
    units.map((unit, index) => ({
      id: unit.id,
      traitNames: unit.champion.traits ?? [],
      emblemTraits: emblemTraits[index],
    })),
    traits
  );

  const traitMods: StatModifier[] = units.map(() => ({}));
  let traitVariablesApplied = 0;
  let traitVariablesIgnored = 0;

  for (const state of resolvedTraits) {
    const variables = state.activeBreakpoint?.variables ?? [];
    for (const variable of variables) {
      const modifier = effectToModifier(variable.name, variable.value);
      if (modifier) {
        traitVariablesApplied += 1;
        for (const index of state.unitIndexes) mergeModifier(traitMods[index], modifier);
      } else if (!isMetaEffect(variable.name)) {
        traitVariablesIgnored += 1;
      }
    }
  }

  const augmentMods: StatModifier = {};
  const unmodeledAugments: string[] = [];
  for (const augment of input.augments ?? []) {
    const modifier = augmentModifier(augment);
    if (modifier) mergeModifier(augmentMods, modifier);
    else unmodeledAugments.push(augment.id);
  }

  const unmodeledItemEffects = new Set<string>();
  const prepared: PreparedUnit[] = units.map((unit, index) => {
    const stats = baseStats(unit.champion, unit.stars);
    const mods: StatModifier = {};
    mergeModifier(mods, augmentMods);
    mergeModifier(mods, traitMods[index]);
    const itemResult = itemModifiers(unit);
    mergeModifier(mods, itemResult.mods);
    applyModifiers(stats, mods);
    itemResult.unmodeledEffects.forEach(entry => unmodeledItemEffects.add(entry));

    return {
      id: unit.id,
      side,
      championId: unit.championId,
      name: unit.champion.name,
      stars: unit.stars,
      row: unit.row,
      col: unit.col,
      traits: [...(unit.champion.traits ?? []), ...emblemTraits[index]],
      stats,
      ability: buildAbilityPlan(unit.champion, unit.stars),
      unmodeledItems: itemResult.unmodeledItems,
    };
  });

  return {
    units: prepared,
    unmodeledAugments,
    unmodeledItemEffects: Array.from(unmodeledItemEffects),
    traitVariablesApplied,
    traitVariablesIgnored,
  };
}

export function buildCoverage(blue: PreparedSide, red: PreparedSide): CoverageReport {
  const sides = [blue, red];
  const units = sides.flatMap(side =>
    side.units.map(unit => ({
      id: unit.id,
      name: unit.name,
      stars: unit.stars,
      abilityModeled: unit.ability.modeled,
      abilityNote: unit.ability.note,
      unmodeledItems: unit.unmodeledItems,
    }))
  );
  const unmodeledAugments = sides.flatMap(side => side.unmodeledAugments);
  const unmodeledItemEffects = sides.flatMap(side => side.unmodeledItemEffects);
  const traitVariablesApplied = sides.reduce((sum, side) => sum + side.traitVariablesApplied, 0);
  const traitVariablesIgnored = sides.reduce((sum, side) => sum + side.traitVariablesIgnored, 0);

  const checks: boolean[] = [];
  for (const unit of units) {
    checks.push(unit.abilityModeled);
    checks.push(unit.unmodeledItems.length === 0);
  }
  for (const side of sides) {
    checks.push(side.unmodeledAugments.length === 0);
    checks.push(side.unmodeledItemEffects.length === 0);
  }
  if (traitVariablesApplied + traitVariablesIgnored > 0) {
    checks.push(traitVariablesIgnored === 0);
  }
  const score = checks.length === 0
    ? 1
    : checks.filter(Boolean).length / checks.length;

  return {
    units,
    unmodeledAugments,
    unmodeledItemEffects,
    traitVariablesApplied,
    traitVariablesIgnored,
    score,
  };
}
