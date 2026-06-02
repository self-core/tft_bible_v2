# ADR-004: Board Positions as (row, col)

**Status:** Accepted
**Date:** 2026-05-17
**Context:** The game board is a 4×7 hexagonal grid. Champions need
placement positions. The old code used pixel (x, y) coordinates which
required layout calculations in every consumer.

**Decision:** Store champion positions as (row, col) grid coordinates
where row ∈ [0,3] and col ∈ [0,6]. The TFTBoard component renders the
grid and calculates pixel positions from grid coordinates. Auto-assignment
fills empty cells by cost tier (higher-cost champions get priority).

**Consequences:**
- Positive: Positions are meaningful without knowing SVG layout details.
- Positive: Consumers can reason about placement independently of
  rendering.
- Positive: One auto-assignment algorithm in the store layer serves all
  consumers.
- Negative: Board rendering is coupled to the grid coordinate system.
