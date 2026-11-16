import type { Trait } from '../lib/api';
import { simulate } from './simulate';
import type { CoverageReport, PredictOptions, PredictionResult, SideInput } from './types';

const DEFAULT_RUNS = 128;

export function predict(
  blue: SideInput,
  red: SideInput,
  traits: Trait[],
  options: PredictOptions = {}
): PredictionResult {
  const runs = Math.max(1, Math.floor(options.runs ?? DEFAULT_RUNS));
  const baseSeed = options.seed ?? 1;

  let blueWins = 0;
  let redWins = 0;
  let draws = 0;
  let durationTotal = 0;
  let coverage: CoverageReport | null = null;

  for (let index = 0; index < runs; index += 1) {
    const result = simulate(blue, red, traits, {
      seed: baseSeed + index,
      maxFightSeconds: options.maxFightSeconds,
    });
    if (result.winner === 'blue') blueWins += 1;
    else if (result.winner === 'red') redWins += 1;
    else draws += 1;
    durationTotal += result.durationMs;
    coverage ??= result.coverage;
  }

  return {
    runs,
    blueWins,
    redWins,
    draws,
    blueWinRate: blueWins / runs,
    redWinRate: redWins / runs,
    drawRate: draws / runs,
    averageDurationMs: Math.round(durationTotal / runs),
    coverage: coverage as CoverageReport,
  };
}
