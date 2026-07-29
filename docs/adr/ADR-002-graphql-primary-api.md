# ADR-002: GraphQL as Primary API

**Status:** Accepted
**Date:** 2026-05-17
**Context:** The frontend needs to query champions, traits, items, augments,
sets, compositions, and search across all entities. The backend data model
is graph-shaped (champions → traits, sets → champions → items). REST
endpoints from the old microservices architecture (api.ts) are dead code.

**Decision:** Frontend talks to backend exclusively through a single
GraphQL endpoint at `/graphql`. Apollo Client on the frontend, Apollo
Server + Express on the backend.

**Consequences:**
- Positive: Frontend queries exactly the fields it needs, no over-fetching.
- Positive: One endpoint instead of N REST routes.
- Positive: GraphQL schema serves as living documentation and
  auto-generates TypeScript types.
- Negative: Requires Apollo Client setup and cache management.
- Negative: File uploads and heavy computations are awkward in GraphQL
  (not relevant for current scope).
