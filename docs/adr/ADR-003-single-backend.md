# ADR-003: Single Backend Service

**Status:** Accepted
**Date:** 2026-05-17
**Context:** The original architecture had Rust microservices, a Go API
gateway, etcd, and a MongoDB cluster. This was difficult to deploy,
maintain, and debug — especially on Vercel/Railway.

**Decision:** Run a single Node.js + TypeScript backend with Apollo Server
and Express. One MongoDB connection. One deployment artifact.

**Consequences:**
- Positive: Simple deployment (one Docker container).
- Positive: Easy debugging — one process to inspect.
- Positive: Lower resource usage.
- Negative: Single point of failure. Acceptable for a companion app with
  no critical uptime requirements.
- Negative: Cannot scale components independently. Not a concern at this
  scale.
