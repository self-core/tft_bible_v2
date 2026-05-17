interface ParticipantBoard {
  units: string[];
  placement: number;
  level: number;
  traits: Array<{ name: string; num_units: number }>;
}

export class CompAnalyzer {
  private readonly CO_OCCURRENCE_THRESHOLD = 0.6;

  buildCoOccurrence(boards: { units: string[] }[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    const champCount: Record<string, number> = {};

    for (const board of boards) {
      for (const unit of board.units) {
        champCount[unit] = (champCount[unit] || 0) + 1;
        if (!matrix[unit]) matrix[unit] = {};
        for (const other of board.units) {
          if (unit !== other) {
            matrix[unit][other] = (matrix[unit][other] || 0) + 1;
          }
        }
      }
    }

    // Normalize to co-occurrence rate
    for (const champ of Object.keys(matrix)) {
      for (const other of Object.keys(matrix[champ])) {
        matrix[champ][other] = matrix[champ][other] / champCount[champ];
      }
    }

    return matrix;
  }

  cluster(matrix: Record<string, Record<string, number>>, threshold: number = this.CO_OCCURRENCE_THRESHOLD): string[][] {
    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const champ of Object.keys(matrix)) {
      if (visited.has(champ)) continue;
      const cluster: string[] = [champ];
      visited.add(champ);
      for (const other of Object.keys(matrix[champ])) {
        if (!visited.has(other) && matrix[champ][other] >= threshold) {
          cluster.push(other);
          visited.add(other);
        }
      }
      if (cluster.length >= 3) clusters.push(cluster);
    }

    return clusters;
  }

  computeStats(boards: ParticipantBoard[], totalMatches: number) {
    if (boards.length === 0) return { matchesAnalyzed: 0, winRate: 0, top4Rate: 0, avgPlacement: 0, pickRate: 0 };

    const wins = boards.filter(b => b.placement === 1).length;
    const top4 = boards.filter(b => b.placement <= 4).length;
    const avgPlacement = boards.reduce((sum, b) => sum + b.placement, 0) / boards.length;

    return {
      matchesAnalyzed: boards.length,
      winRate: wins / boards.length,
      top4Rate: top4 / boards.length,
      avgPlacement: Math.round(avgPlacement * 100) / 100,
      pickRate: boards.length / totalMatches,
    };
  }
}
