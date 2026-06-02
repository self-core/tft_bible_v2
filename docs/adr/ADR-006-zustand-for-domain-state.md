# ADR-006: Zustand for Frontend Domain State

**Status:** Accepted
**Date:** 2026-05-17
**Context:** The frontend needs shared state for champions, traits, items,
augments, and compositions across many components and pages. Redux is
overkill for this scope. React Context would cause unnecessary re-renders.

**Decision:** Use Zustand for domain state (data from the backend). React
Context for UI-only state (theme). Apollo Client's InMemoryCache serves
as the backend cache layer.

**Consequences:**
- Positive: Zustand stores are simple — no reducers, no actions, no
  boilerplate.
- Positive: Components subscribe to slices via hooks, no provider nesting.
- Positive: Easy to add derived state (e.g., champion auto-positioning).
- Negative: Stores bypass React's rendering lifecycle — must use
  Zustand's hooks or subscribe methods correctly to avoid stale closures.
