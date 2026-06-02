# ADR-001: Document-per-Set Data Model

**Status:** Accepted
**Date:** 2026-05-17
**Context:** TFT releases new sets quarterly, each with different champions,
traits, items, and mechanics. The same champion name (e.g., Ahri) has
different stats, cost, and abilities across sets. Historical set data must
remain accessible after a new set ships.

**Decision:** Store each TFT set as a complete MongoDB document with
reference IDs to child entities. Champion IDs are prefixed with the set
number (e.g., `TFT16_Ahri`). A Set document holds arrays of champion IDs,
trait keys, and item IDs rather than embedding them.

**Consequences:**
- Positive: Adding Set 17 doesn't touch Set 16 data at all.
- Positive: Queries can load one set at a time without filtering.
- Negative: Loading a full set requires N+1 lookups (Set → champions →
  traits → items). Mitigated by the repository layer which batches queries.
