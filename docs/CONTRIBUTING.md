## Branching strategy

- Default branches: `main` (stable), `dev` (integration)
- Working branches:
  - `feature/<short-description>`
  - `bugfix/<issue-id>-<short-description>`
  - `deploy/<env>-<release>` (when needed)

## Workflow

1. Branch from `dev` for all work.
2. Open PRs into `dev` with concise description and checklist.
3. `dev` is regularly merged into `main` via reviewed PRs.
4. Tag releases on `main`.

## Commit conventions

- Use conventional commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`, `test: ...`.

## PR checks

- CI must pass (build/lint/tests).
- One approval required to merge into `dev`, two approvals into `main`.

## Coding standards

- Rust: follow `rustfmt` and clippy where applicable.
- Keep changes scoped; update docs and todos.
