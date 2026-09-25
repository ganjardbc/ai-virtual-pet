# Task 01 — Phase 0 Repository Baseline

## Status

Ready for implementation.

## Goal

Establish the smallest working repository baseline required by Prototype 0.1 so later domain work can be implemented and verified without changing the selected stack.

## Scope

- Create a pnpm workspace.
- Add root development scripts for `dev`, `build`, `typecheck`, and `test`.
- Add shared strict TypeScript configuration.
- Create a minimal React + Vite web application.
- Create a minimal Fastify API with `GET /health`.
- Add Vitest baselines for the web and API workspaces.
- Configure the project for an existing local PostgreSQL installation.
- Add environment documentation without committing secrets.
- Add the minimum Drizzle configuration required by the Phase 0 immediate-action contract, without implementing game tables or repositories.

## Out of Scope

- Pet domain models or game rules.
- Simulation.
- Persistence schema for Pet, PetState, or Event.
- Gameplay API routes.
- Player or debug UI.
- AI, memory, skills, Search, authentication, or multiple pets.

## Dependencies

- Node.js 22 or compatible.
- pnpm 9 or compatible.
- PostgreSQL 16 or compatible running locally.

## Target Structure

```text
apps/
├── api/
└── web/

packages/
└── config/
```

## Constraints

- Keep the baseline minimal.
- Use TypeScript strict mode.
- Do not add game behavior.
- Do not expose committed secrets.
- Keep Drizzle limited to configuration and an empty schema entry point.
- API tests must use Fastify injection and must not open a real network port.

## Implementation Steps

1. Create root workspace and repository configuration.
2. Create shared TypeScript configurations.
3. Create the Fastify API and health-route test.
4. Create the React/Vite web skeleton and smoke test.
5. Add local PostgreSQL environment documentation in `.env.example`.
6. Add minimal Drizzle configuration.
7. Install dependencies and generate the lockfile.
8. Run formatting-independent validation: typecheck, tests, and production builds.
9. Verify the installed local PostgreSQL service and project database connection.

## Required Verification

```text
pnpm install
pnpm typecheck
pnpm test
pnpm build
pg_isready -h localhost -p 5432
psql "$DATABASE_URL" -c "SELECT current_database();"
```

## Acceptance Criteria

- Dependencies install from the repository root.
- Workspace packages resolve correctly.
- Root `typecheck`, `test`, and `build` commands pass.
- Vite can build the React application.
- Fastify can build and its health route passes an injection test.
- The local PostgreSQL server accepts connections and the project database exists.
- Required environment variables are documented in `.env.example`.
- No Prototype 0.1 gameplay feature is implemented.

## Approved Deviation

The project owner explicitly requested local PostgreSQL instead of Docker. The implementation documents were aligned with that decision, and verification targets the installed local PostgreSQL service.
