# ADR-005: Single TFTBoard Component with editMode

**Status:** Accepted
**Date:** 2026-05-17
**Context:** Three divergent board implementations existed (draggable DnD
board, read-only composition board, builder board). Each had its own
positioning logic, rendering approach, and state management, leading to
fragmented bug fixes.

**Decision:** Consolidate into a single `TFTBoard.tsx` SVG hex board
component driven by an `editMode` boolean prop. In read mode, the board
is static. In edit mode, it supports drag-and-drop, star cycling, and
champion removal.

**Consequences:**
- Positive: Fix positioning once, fixed everywhere.
- Positive: Newcomers learn one board component.
- Positive: editMode toggle is simpler than separate implementations.
- Negative: The component has conditional rendering for both modes
  (acceptable complexity for the consolidation gains).
