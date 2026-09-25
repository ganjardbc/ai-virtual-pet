# Prototype 0.1 Implementation Plan

## 1. Purpose

Dokumen ini menerjemahkan:

```text
Product Foundation
+
Prototype 0.1 Scope
+
Prototype 0.1 Wireframe
```

menjadi execution plan yang dapat dikerjakan secara bertahap menggunakan Codex.

Tujuan utama:

> **Build the smallest reliable system that can prove whether the pet feels alive before AI is introduced.**

Implementation dilakukan melalui task kecil yang:

* memiliki dependency jelas,
* dapat diuji,
* dapat diverifikasi secara independen,
* tidak memperluas scope,
* menghasilkan working software secara bertahap.

---

# 2. Source of Truth

Sebelum mengimplementasikan task, Codex harus membaca dokumentasi yang relevan.

Primary implementation references:

```text
docs/00-vision.md
docs/02-game-systems.md
docs/06-technical-architecture.md
docs/07-data-model.md
docs/08-api-design.md
docs/10-decisions.md
docs/11-tech-stack.md
docs/12-game-ux.md
docs/13-design-system.md
docs/14-art-direction.md
docs/15-product-experience-principles.md
docs/16-prototype-01-scope.md
docs/17-prototype-01-wireframe.md
```

Jika implementation detail bertentangan dengan dokumen:

```text
latest specific document
>
older general document
```

Namun Codex tidak boleh diam-diam mengubah product decision.

Jika ditemukan contradiction yang materially memengaruhi implementation, stop dan surface contradiction.

---

# 3. Implementation Rule

Setiap task mengikuti loop:

```text
Read relevant docs
      ↓
Inspect existing code
      ↓
Implement smallest change
      ↓
Add / update tests
      ↓
Run validation
      ↓
Review diff
      ↓
Commit checkpoint
```

Jangan mengerjakan task berikutnya sebelum current task memenuhi acceptance criteria.

---

# 4. Scope Rule

Prototype 0.1 hanya membangun:

```text
Egg
Hatch
Naming
Baby Pet

Persistent State

Hunger
Energy
Happiness
Bond

Feed
Play
Sleep

Elapsed-Time Simulation

Autonomous Behavior

Mood

Events

Return Experience

Debug Tools
```

Tidak membangun:

```text
LLM
AI Conversation
Memory
Personality Progression
Baby → Child Growth
Skills
Search
Authentication
Multiple Pets
Inventory
Shop
Currency
Notifications
Social
```

Rule:

> **Do not implement future architecture unless Prototype 0.1 actually requires it.**

---

# 5. Technical Stack

Frozen Prototype 0.1 stack:

```text
TypeScript
Node.js

pnpm workspace

React
Vite
TanStack Query

Fastify
Zod

PostgreSQL
Drizzle ORM

Vitest

Local PostgreSQL
```

---

# 6. Target Repository

Target:

```text
ai-virtual-pet/

apps/
├── api/
└── web/

packages/
├── domain/
├── simulation/
├── contracts/
└── config/

docs/
```

Additional internal folders are allowed when they clarify responsibility.

Avoid creating packages without concrete need.

---

# 7. Dependency Direction

Target dependency direction:

```text
domain
  ↑
simulation
  ↑
application / API

contracts
  ↑
API + Web
```

Infrastructure may depend inward.

Domain must not depend outward.

Forbidden dependencies inside `packages/domain`:

```text
React
Vite
Fastify
Drizzle
PostgreSQL
TanStack Query
LLM SDK
Search SDK
```

Forbidden dependencies inside `packages/simulation`:

```text
React
Fastify
Drizzle
PostgreSQL
HTTP
LLM
Search
```

---

# 8. Implementation Phases

Prototype development is divided into:

```text
Phase 0
Repository Baseline

Phase 1
Domain Foundation

Phase 2
Simulation Engine

Phase 3
Persistence

Phase 4
Application + API

Phase 5
Debug Harness

Phase 6
Player Experience

Phase 7
Integration & Hardening

Phase 8
Playtest Preparation
```

---

# 9. Phase 0 — Repository Baseline

Goal:

> Establish a minimal working development environment.

At the end of Phase 0:

```text
pnpm install
pnpm test
pnpm typecheck
```

must work from repository root.

Web and API must both start locally.

---

# 10. Task 0.1 — Workspace Configuration

Create/configure pnpm workspace.

Expected:

```text
pnpm-workspace.yaml

apps/*
packages/*
```

Root package scripts should eventually expose:

```text
dev
test
typecheck
build
```

Linting may be added if already part of repository conventions.

Do not introduce large tooling ecosystems without need.

### Acceptance Criteria

* dependencies install from root,
* workspace packages resolve,
* root scripts can invoke workspace scripts.

---

# 11. Task 0.2 — Shared TypeScript Configuration

Create shared TypeScript baseline.

Possible location:

```text
packages/config/
```

or root configs if simpler.

Requirements:

* strict TypeScript,
* predictable module resolution,
* compatible with Node and Vite packages,
* no duplicated compiler configuration where avoidable.

### Acceptance Criteria

```text
pnpm typecheck
```

can eventually check all workspaces.

---

# 12. Task 0.3 — Web Skeleton

Create:

```text
apps/web
```

using:

```text
React
Vite
TypeScript
```

Initial page only needs to prove app boots.

Do not implement game UI yet.

### Acceptance Criteria

* Vite dev server starts,
* React renders,
* production build succeeds.

---

# 13. Task 0.4 — API Skeleton

Create:

```text
apps/api
```

using:

```text
Fastify
TypeScript
```

Add minimal health endpoint.

Conceptual:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Acceptance Criteria

* API starts,
* health endpoint responds,
* API can be tested without opening real network port where possible.

Use Fastify injection for tests.

---

# 14. Task 0.5 — PostgreSQL Development Environment

Configure the application to use the existing local PostgreSQL service.

Prototype requirement:

```text
PostgreSQL
```

Do not install or configure PostgreSQL through this repository.

No Redis.

No queue.

No vector database.

### Acceptance Criteria

* local PostgreSQL accepts connections,
* the project database exists,
* local API can connect using environment configuration,
* secrets are not committed,
* `.env.example` documents required variables.

---

# 15. Phase 0 Gate

Before continuing:

```text
Web boots              ✓
API boots              ✓
PostgreSQL boots       ✓
Tests execute          ✓
Typecheck executes     ✓
```

No game feature should exist yet.

---

# 16. Phase 1 — Domain Foundation

Goal:

> Model the pet and core care rules without HTTP, database, or UI.

This is the first real game layer.

---

# 17. Task 1.1 — Domain Primitive Types

Create domain primitives as needed.

Examples:

```ts
PetId
PetName
StatValue
Timestamp
```

Avoid excessive value-object abstraction.

Only create abstractions that protect actual invariants or improve clarity.

Stat invariant:

```text
0 <= stat <= 100
```

### Acceptance Criteria

* domain primitives compile independently,
* stat clamp/validation behavior is tested.

---

# 18. Task 1.2 — Pet Model

Create domain representation for identity.

Minimum conceptual fields:

```ts
Pet {
  id
  name
  stage
  createdAt
  hatchedAt
}
```

Prototype stages:

```text
EGG
BABY
```

Name may be absent before naming.

### Acceptance Criteria

Domain can represent:

```text
Egg
Hatched unnamed Baby
Named Baby
```

without invalid ambiguity.

---

# 19. Task 1.3 — Pet State Model

Create:

```ts
PetState
```

Minimum:

```text
hunger
energy
happiness
bond

currentActivity

lastInteractionAt
lastSimulatedAt
sleepStartedAt
```

All stats:

```text
0–100
```

Activities initially:

```text
IDLE
SLEEPING
PLAYING_ALONE
RESTING
LOOKING_AROUND
WAITING
```

### Acceptance Criteria

* valid state can be constructed,
* invalid stat values cannot leak through normal domain operations,
* sleeping state semantics are representable.

---

# 20. Task 1.4 — Clock Abstraction

Create:

```ts
interface Clock {
  now(): Date;
}
```

Implement:

```text
SystemClock
FakeClock
```

Domain/application logic must not hide direct calls to:

```ts
Date.now()
```

### Acceptance Criteria

Tests can deterministically control current time.

---

# 21. Task 1.5 — Random Abstraction

Create:

```ts
interface Random {
  next(): number;
}
```

Provide:

```text
production random implementation
deterministic test implementation
```

Do not use uncontrolled:

```ts
Math.random()
```

inside simulation rules.

### Acceptance Criteria

Autonomous decisions can be reproduced in tests.

---

# 22. Task 1.6 — Game Configuration

Centralize balancing values.

Conceptual:

```ts
GameRules {
  hungerDecayAwakePerHour
  hungerDecaySleepingPerHour

  energyDecayAwakePerHour
  energyRecoverySleepingPerHour

  feed
  play

  sleep

  happiness
}
```

Do not scatter values such as:

```text
25
12
1.5
```

through route handlers or UI.

### Acceptance Criteria

Core balancing can be changed from one configuration layer.

---

# 23. Task 1.7 — Feed Domain Rule

Implement pure Feed action.

Base:

```text
Hunger      +25
Happiness   +2
Bond        +0.3
```

Support diminishing effect when already full according to Game Systems.

Clamp results.

Return structured action result.

Conceptual:

```ts
applyFeed(state, rules)
→ {
    state,
    events,
    result
  }
```

### Tests

At minimum:

```text
normal feed
near-full feed
full pet
stat clamping
```

---

# 24. Task 1.8 — Play Domain Rule

Base:

```text
Happiness   +12
Energy      -10
Hunger      -4
Bond        +1
```

Validation:

```text
Energy > 15
```

Implement domain rejection when insufficient Energy.

Support diminishing returns.

Do not throw generic infrastructure errors for expected rejection.

Conceptual result:

```ts
{
  accepted: false,
  reason: "TOO_TIRED"
}
```

### Tests

```text
normal play
minimum valid energy
invalid low energy
clamping
diminishing return
```

---

# 25. Task 1.9 — Play Diminishing Window

Define the exact repeat-play window required by the existing design.

Prefer the smallest state representation necessary.

Do not add a generalized buff/cooldown framework.

### Acceptance Criteria

Sequence:

```text
play 1 → 1.00
play 2 → 0.75
play 3 → 0.50
play 4 → 0.25
```

is deterministic within the defined window.

The multiplier resets according to documented rule.

If the previous docs do not define the window precisely, flag this as a small balancing decision before implementation rather than inventing a complex system.

---

# 26. Task 1.10 — Sleep Domain Rule

Implement:

```text
START_SLEEP
```

Valid result:

```text
currentActivity = SLEEPING
sleepStartedAt = current time
```

Generate relevant domain event.

### Tests

```text
awake → sleeping
already sleeping behavior
sleepStartedAt recorded correctly
```

---

# 27. Task 1.11 — Wake Domain Rule

Implement wake transition.

Result:

```text
currentActivity
→ suitable awake activity / IDLE

sleepStartedAt
→ null
```

### Tests

```text
sleeping → awake
wake when already awake
timestamp consistency
```

---

# 28. Task 1.12 — Domain Events

Create minimum event representation.

Conceptual:

```ts
DomainEvent {
  type
  occurredAt
  payload
}
```

Prototype event types:

```text
PET_HATCHED
PET_NAMED

PET_FED
PET_PLAYED

PET_STARTED_SLEEPING
PET_WOKE_UP

PET_ACTIVITY_CHANGED

ACTION_REJECTED
```

Avoid building full event sourcing infrastructure.

### Acceptance Criteria

Domain operations can return events without knowing how events are persisted.

---

# 29. Phase 1 Gate

Before simulation work:

```text
Pet model               ✓
Pet state               ✓
Clock abstraction       ✓
Random abstraction      ✓
Game rules config       ✓
Feed                     ✓
Play                     ✓
Sleep                    ✓
Wake                     ✓
Domain events            ✓
Domain tests             ✓
```

Domain tests must not require PostgreSQL.

---

# 30. Phase 2 — Simulation Engine

Goal:

> Make time matter.

Simulation must remain runnable as pure code.

---

# 31. Task 2.1 — Simulation Contract

Define clear simulation contract.

Conceptually:

```ts
simulateElapsedTime({
  state,
  from,
  to,
  rules,
  random
})
```

returns:

```ts
{
  state,
  events
}
```

Requirements:

* no persistence,
* no HTTP,
* no wall-clock lookup hidden inside,
* no uncontrolled randomness.

---

# 32. Task 2.2 — Awake Need Decay

Implement elapsed awake simulation.

Initial balancing:

```text
Hunger  -2/hour
Energy  -1.5/hour
```

Support fractional durations if useful.

Clamp stats.

### Tests

```text
1 hour
6 hours
12 hours
24 hours
```

---

# 33. Task 2.3 — Sleeping Simulation

While sleeping:

```text
Hunger  -1/hour
Energy  +12/hour
```

Simulation must be able to detect wake threshold.

### Tests

```text
1 hour sleep
multiple hours
energy clamp
wake threshold crossed
```

---

# 34. Task 2.4 — Auto Wake

Implement configurable automatic wake.

Possible conditions based on frozen game rules:

```text
Energy near full
OR
maximum sleep duration reached
```

When wake occurs within elapsed interval:

simulation must correctly handle:

```text
sleep segment
+
remaining awake segment
```

rather than treating entire duration as sleeping.

### Acceptance Criteria

Example:

```text
Pet needs 4h to recover
Elapsed time = 10h
```

Simulation applies:

```text
4h sleeping rules
+
6h awake rules
```

---

# 35. Task 2.5 — Happiness Passive Effects

Implement happiness penalties caused only by severe unmet needs.

Requirements:

```text
No constant passive happiness decay
Maximum passive penalty ≈ -12/day
```

Keep implementation simple and deterministic.

### Tests

```text
healthy needs
severe hunger
severe exhaustion
long duration cap
```

---

# 36. Task 2.6 — No Passive Bond Decay

Add explicit invariant tests proving:

```text
elapsed time alone
≠
Bond loss
```

This is important enough to test directly.

---

# 37. Task 2.7 — Autonomous Activity Selection

Implement limited autonomous behavior.

Required candidates:

```text
SLEEPING
RESTING
PLAYING_ALONE
LOOKING_AROUND
WAITING
```

Decision inputs:

```text
state
rules
controlled random
```

Do not use LLM.

Do not build planner/agent architecture.

---

# 38. Task 2.8 — Autonomous Activity Effects

Only implement state effects needed by Prototype 0.1.

Avoid turning each activity into a large subsystem.

Examples:

```text
RESTING
→ low-impact activity

PLAYING_ALONE
→ small happiness/energy effect if defined

LOOKING_AROUND
→ primarily activity/event presentation

WAITING
→ neutral
```

All effects must be explicit and testable.

---

# 39. Task 2.9 — Simulation Events

Generate relevant events during elapsed-time simulation.

Examples:

```text
PET_STARTED_SLEEPING
PET_WOKE_UP
PET_ACTIVITY_CHANGED
```

Avoid event spam.

Do not generate one event per simulation tick.

---

# 40. Task 2.10 — Detailed Simulation Horizon

Implement efficient handling for long elapsed durations.

Target:

```text
detailed simulation
≤ approximately 48h
```

Longer periods may use summarized calculation.

Important requirement:

```text
+7 days
```

must execute quickly.

Do not simulate every second/minute.

---

# 41. Task 2.11 — Mood Derivation

Implement derived mood.

Initial moods:

```text
NEUTRAL
HAPPY
HUNGRY
SLEEPY
EXCITED
BORED
```

Optional only if straightforward:

```text
LONELY
CURIOUS
```

Mood should use priority/scoring and basic stability.

Mood is derived.

Do not treat it as primary authoritative state.

---

# 42. Task 2.12 — Need Labels

Create presentation-friendly derived values.

Example:

```ts
deriveFullnessLabel(state)
deriveEnergyLabel(state)
deriveHappinessLabel(state)
```

Potential outputs:

```text
Very Hungry
Hungry
Okay
Full
Very Full
```

These may live in domain/presentation logic depending on responsibility.

Avoid coupling domain to React.

---

# 43. Task 2.13 — Scenario Test Suite

Create reusable scenario test helpers.

Required scenarios:

```text
Daily Active

Frequent Player

Overfeeding

Hyperactive

Sleep Heavy

Casual

Long Absence
```

Scenario tests should expose unexpected balancing behavior early.

---

# 44. Task 2.14 — Simulation Invariant Tests

Explicitly test:

```text
stats stay 0–100

Bond does not passively decay

pet never dies

last simulated time moves forward

sleep restores Energy

rejected action does not mutate invalid state

long absence remains recoverable
```

---

# 45. Phase 2 Gate

Before persistence:

```text
Elapsed time works        ✓
Awake decay works         ✓
Sleep recovery works      ✓
Auto wake works           ✓
Happiness effects work    ✓
Bond invariant works      ✓
Autonomous behavior       ✓
Mood derivation           ✓
+7 days fast enough       ✓
Scenario tests pass       ✓
```

At this point Prototype should already be playable through tests/code even without UI.

---

# 46. Phase 3 — Persistence

Goal:

> Preserve authoritative pet reality across process/application lifecycle.

---

# 47. Task 3.1 — Drizzle Setup

Configure Drizzle for PostgreSQL.

Requirements:

* schema location clear,
* migration workflow documented,
* environment configuration isolated.

Do not let Drizzle types become domain models.

---

# 48. Task 3.2 — Pet Table

Persist identity.

Minimum:

```text
id
name
stage
createdAt
hatchedAt
```

Exact schema follows `docs/07-data-model.md`.

---

# 49. Task 3.3 — Pet State Table

Persist:

```text
hunger
energy
happiness
bond

currentActivity

lastInteractionAt
lastSimulatedAt
sleepStartedAt
```

Include concurrency/version field if defined by API/data-model decisions.

---

# 50. Task 3.4 — Event Table

Persist append-oriented events.

Minimum:

```text
id
petId
type
occurredAt
payload
```

Payload can use JSON where appropriate.

Events do not reconstruct authoritative state.

---

# 51. Task 3.5 — Repository Interfaces

Define application-facing repository contracts.

Conceptually:

```ts
interface PetRepository {
  findCurrent(): Promise<...>;
  save(...): Promise<void>;
}
```

and event repository if separate.

Do not over-generalize for multiple users/pets if Prototype does not need it.

---

# 52. Task 3.6 — Drizzle Repository Implementation

Implement repository interfaces using Drizzle.

Mapping:

```text
Database Row
↔
Domain Model
```

must happen at infrastructure boundary.

---

# 53. Task 3.7 — Persistence Integration Tests

Use a real test PostgreSQL database where practical for persistence behavior.

Required:

```text
create pet
load pet
update state
persist events
reload state
```

Tests must prove reload does not reset the pet.

---

# 54. Phase 3 Gate

```text
Schema/migrations       ✓
Pet persistence         ✓
State persistence       ✓
Event persistence       ✓
Repository abstraction  ✓
Reload works            ✓
```

---

# 55. Phase 4 — Application + API

Goal:

> Expose game operations without leaking domain mechanics into HTTP routes.

---

# 56. Task 4.1 — Application Service

Create application-level orchestration.

Responsibilities:

```text
load pet
simulate elapsed time
execute action
persist state
persist events
return snapshot
```

This logic should not be duplicated across routes.

---

# 57. Task 4.2 — Pet Snapshot Contract

Define shared contract in:

```text
packages/contracts
```

Conceptually:

```ts
PetSnapshot {
  pet
  state
  derived
  reaction?
  recentEvents?
}
```

Only expose fields required by Prototype.

Do not expose database row shape directly.

---

# 58. Task 4.3 — GET Pet

Implement:

```text
GET /api/v1/pet
```

Behavior:

```text
load pet
 ↓
simulate elapsed time
 ↓
persist result if needed
 ↓
return authoritative snapshot
```

Handle no-pet/egg state consistently.

---

# 59. Task 4.4 — Create / Initialize Pet

Implement minimum flow required to establish Egg.

Could use:

```text
POST /api/v1/pet
```

according to existing API design.

Must be idempotent enough to avoid accidental duplicate prototype pets.

Prototype supports one current pet.

---

# 60. Task 4.5 — Hatch Pet

Implement:

```text
POST /api/v1/pet/hatch
```

Requirements:

```text
valid Egg required
stage becomes BABY
hatchedAt recorded
PET_HATCHED event
```

Do not implement Baby → Child.

---

# 61. Task 4.6 — Name Pet

Implement:

```text
PATCH /api/v1/pet/name
```

Use Zod at HTTP boundary.

Requirements:

```text
trim whitespace
non-empty
maximum length
```

Generate:

```text
PET_NAMED
```

---

# 62. Task 4.7 — Action Endpoint

Implement:

```text
POST /api/v1/pet/actions
```

Supported:

```text
FEED
PLAY
SLEEP
```

Flow:

```text
validate request
 ↓
load pet
 ↓
simulate elapsed time
 ↓
apply action
 ↓
persist
 ↓
append events
 ↓
return snapshot/result
```

---

# 63. Task 4.8 — Domain Rejection Contract

Expected rejection such as low Energy must not become:

```text
500 Internal Server Error
```

Create explicit API representation.

Example conceptual:

```json
{
  "accepted": false,
  "reason": "TOO_TIRED",
  "pet": {}
}
```

Exact shape should follow API conventions.

---

# 64. Task 4.9 — API Error Model

Differentiate:

```text
Validation Error
Domain Rejection
Not Found / Invalid Lifecycle
Technical Failure
```

Frontend must be able to tell:

```text
pet doesn't want/can't do action
```

from:

```text
server broke
```

---

# 65. Task 4.10 — API Tests

Use Fastify injection.

Required flows:

```text
create egg

get egg

hatch

name

get Baby

feed

play

play rejection

sleep

get after elapsed time
```

No browser required.

---

# 66. Task 4.11 — Concurrency Safety

Implement smallest practical protection against duplicate/conflicting state mutation.

Follow existing architecture/API decisions.

Potential mechanisms:

```text
state version
transaction
conditional update
idempotency key
```

Do not build distributed locking infrastructure.

Important scenario:

```text
two Feed requests
```

must not silently corrupt state.

---

# 67. Transaction Boundary

Database transaction may cover:

```text
state update
+
event append
```

Do not hold transaction during external slow operations.

Prototype has no LLM/Search, so this should remain straightforward.

---

# 68. Phase 4 Gate

Verify full API journey:

```text
Create Egg
 ↓
Hatch
 ↓
Name
 ↓
Feed
 ↓
Play
 ↓
Sleep
 ↓
Time Passes
 ↓
GET Pet
```

All through HTTP/API tests.

---

# 69. Phase 5 — Debug Harness

Goal:

> Make game balancing and time simulation extremely fast to inspect.

Debug tooling is a required Prototype feature.

---

# 70. Task 5.1 — Debug Safety Boundary

Debug endpoints/features must only exist in allowed development/test environment.

Do not expose debug mutation accidentally as normal production API.

Use explicit environment gating.

---

# 71. Task 5.2 — Advance Time

Implement debug time travel.

Required:

```text
+1h
+6h
+12h
+1d
+3d
+7d
```

Preferred architecture:

Fake/debug clock changes time.

Normal application simulation path then runs.

Avoid special-case logic such as:

```text
if debug +1d:
  directly subtract stats
```

Debug should exercise real simulation.

---

# 72. Task 5.3 — Force Sleep

Debug command:

```text
Force Sleep
```

Use normal domain sleep transition where possible.

---

# 73. Task 5.4 — Wake Pet

Debug command:

```text
Wake Pet
```

Use normal domain wake rule or explicit debug orchestration around it.

---

# 74. Task 5.5 — Set Stats

Recommended debug operations:

```text
Set Hunger
Set Energy
Set Happiness
```

Optional:

```text
Set Bond
```

These are debug-only mutations.

Clamp values.

---

# 75. Task 5.6 — Reset Pet

Implement full Prototype reset.

Expected result:

```text
current pet progress removed/reset
 ↓
application returns to Egg experience
```

Use confirmation in UI.

---

# 76. Task 5.7 — Debug State Endpoint

Expose required debug data:

```text
raw stats
activity
mood
lastInteractionAt
lastSimulatedAt
sleepStartedAt
recent events
```

Could reuse normal snapshot plus debug-specific data.

Avoid exposing persistence internals unnecessarily.

---

# 77. Task 5.8 — Debug API Tests

Test:

```text
advance time
force sleep
wake
set stat
reset
```

Most important:

```text
advance +7d
```

must use real simulation and produce valid state.

---

# 78. Phase 5 Gate

A developer must be able to test:

```text
healthy pet
 ↓
+12h
 ↓
hungry/tired pet
 ↓
sleep
 ↓
+6h
 ↓
recovered pet
 ↓
+7d
 ↓
long absence state
```

without editing database records manually.

---

# 79. Phase 6 — Player Experience

Goal:

> Turn the working simulation into a character-centered playable prototype.

Only now should significant UI work begin.

---

# 80. Task 6.1 — Web Application Foundation

Configure:

```text
TanStack Query
API client
shared contracts
error handling
```

Keep API client small.

No large frontend state library required.

Server state belongs to TanStack Query.

Local UI state can remain React state.

---

# 81. Task 6.2 — Design Tokens

Implement minimum tokens from Design System.

Required categories:

```text
color
spacing
radius
typography
shadow
motion
```

Do not spend time perfecting final palette.

Use semantic variables.

Example:

```text
--color-surface-background
--color-text-primary
--color-action-primary
--space-4
--radius-lg
```

---

# 82. Task 6.3 — Core UI Components

Implement only components needed by wireframe.

Likely:

```text
Button
ActionButton
Panel
TextInput
StatusIndicator
ReactionBubble
```

Avoid building a generic enterprise component library.

---

# 83. Task 6.4 — Game Shell

Implement bounded responsive game container.

Requirements:

* centered on desktop,
* usable on narrow viewport,
* debug entry low emphasis,
* no primary navigation.

---

# 84. Task 6.5 — Egg Screen

Implement wireframe:

```text
Egg
Hatch action
subtle idle movement
```

No needs UI.

No navigation.

---

# 85. Task 6.6 — Hatch Sequence

Implement simple:

```text
Egg
 ↓
short transition
 ↓
Baby
```

Target:

```text
~2–4 seconds
```

Use simple CSS/asset transition.

Do not create elaborate animation pipeline.

---

# 86. Task 6.7 — Naming Screen

Implement:

```text
Baby visual
reaction/copy
name input
Name Pet action
validation
```

After successful persistence:

```text
Pet Home
```

---

# 87. Task 6.8 — Habitat

Implement simple habitat presentation.

Requirements:

```text
pet visual center
rest/sleep context
stable dimensions
```

No free movement.

No pathfinding.

No interactive decoration.

---

# 88. Task 6.9 — Pet Character Presentation

Implement mapping:

```text
PetSnapshot
 ↓
PetVisualState
```

Minimum visual states:

```text
Neutral
Happy
Hungry
Sleepy
Excited
Tired/Refusal
Sleeping
```

Placeholder art is allowed.

Pet should not be represented only by text.

---

# 89. Task 6.10 — Reaction System

Frontend maps actual result/event to presentation.

Priority:

```text
Action Reaction
>
Return Reaction
>
Important State
>
Mood / Idle
```

Do not invent game facts.

Reaction copy may be deterministic.

---

# 90. Task 6.11 — Pet Status

Display:

```text
Fullness
Energy
Mood
```

using descriptive labels.

Do not display:

```text
raw Hunger
raw Energy
raw Happiness
raw Bond
```

in Player Mode.

---

# 91. Task 6.12 — Care Actions

Implement:

```text
Feed
Play
Sleep
```

No Talk.

Action flow:

```text
click
 ↓
busy state
 ↓
API
 ↓
authoritative snapshot
 ↓
reaction
```

No optimistic stat mutation.

---

# 92. Task 6.13 — Feed Presentation

Required:

```text
normal eating reaction
full/less-enthusiastic reaction
```

No success toast.

---

# 93. Task 6.14 — Play Presentation

Required:

```text
successful Play reaction
```

Update status from authoritative response.

---

# 94. Task 6.15 — Play Rejection Presentation

For:

```text
TOO_TIRED
```

show:

```text
tired/refusal character state
+
short character message
```

Do not show technical red error.

---

# 95. Task 6.16 — Sleeping Presentation

When:

```text
currentActivity = SLEEPING
```

render sleeping variant.

Requirements:

```text
sleep visual
Sleeping label
Energy: Recovering or appropriate label

Feed disabled
Play disabled
Sleep active/disabled state
```

No player Wake button.

---

# 96. Task 6.17 — Autonomous Activity Presentation

Support at least:

```text
PLAYING_ALONE
RESTING
LOOKING_AROUND
WAITING
```

Simple pose/text variation is enough.

No pathfinding required.

---

# 97. Task 6.18 — Return Experience

Detect meaningful return presentation based on server response/recent events.

Possible:

```text
current activity
+
short greeting
+
1–3 recent relevant events
```

Do not expose raw Event Log.

Do not moralize absence.

---

# 98. Task 6.19 — Technical Error UI

Implement System Voice error presentation.

Examples:

```text
Couldn't connect to the game server.

[ Retry ]
```

No fake pet reaction when request fails technically.

---

# 99. Task 6.20 — Loading States

Implement:

```text
initial loading
action busy
```

Avoid full-screen loading for every care action.

---

# 100. Phase 6 Gate

Manual player journey:

```text
Launch
 ↓
Egg
 ↓
Hatch
 ↓
Name
 ↓
Pet Home
 ↓
Feed
 ↓
Play
 ↓
Sleep
```

must work without opening Debug Mode.

Pet must remain visual focus.

---

# 101. Phase 7 — Debug UI

Debug backend already exists.

Now expose it through UI.

---

# 102. Task 7.1 — Debug Toggle

Low-emphasis:

```text
Debug
```

opens/closes panel.

Opening panel must not change game state.

---

# 103. Task 7.2 — Debug Stats

Display raw:

```text
Hunger
Energy
Happiness
Bond
```

Use enough precision for balancing.

---

# 104. Task 7.3 — Debug Derived State

Display:

```text
Mood
Current Activity
```

---

# 105. Task 7.4 — Debug Time State

Display:

```text
lastInteractionAt
lastSimulatedAt
sleepStartedAt
```

---

# 106. Task 7.5 — Time Travel UI

Buttons:

```text
+1h
+6h
+12h
+1d
+3d
+7d
```

After operation:

```text
refresh snapshot
refresh events
```

Game should visibly respond to resulting state.

---

# 107. Task 7.6 — Debug Commands UI

Implement:

```text
Force Sleep
Wake Pet
Reset Pet
```

Recommended:

```text
Set Hunger
Set Energy
Set Happiness
```

---

# 108. Task 7.7 — Event List

Display recent events:

```text
timestamp
type
```

Newest first.

Payload expansion optional.

---

# 109. Task 7.8 — Debug Responsive Behavior

Desktop:

```text
side panel
```

Narrow viewport:

```text
drawer
or
full-screen debug panel
```

Do not spend excessive time polishing.

---

# 110. Phase 7 Gate

Developer should complete this loop in under a few minutes:

```text
Open Debug
 ↓
Set Energy low
 ↓
Close Debug
 ↓
Try Play
 ↓
Observe refusal
 ↓
Advance +1d
 ↓
Observe changed pet
 ↓
Force Sleep
 ↓
Advance +6h
 ↓
Observe recovery
 ↓
Advance +7d
 ↓
Observe long absence
```

---

# 111. Phase 8 — Integration & Hardening

Goal:

> Make the prototype reliable enough for someone else to test.

---

# 112. Task 8.1 — Full Lifecycle Integration Test

Test:

```text
Create Egg
 ↓
Hatch
 ↓
Name
 ↓
Feed
 ↓
Play
 ↓
Sleep
 ↓
Elapsed Time
 ↓
Return
```

Prefer API-level integration for deterministic validation.

---

# 113. Task 8.2 — Reload Test

Required manual/automated verification:

```text
perform actions
 ↓
reload browser
 ↓
same pet exists
 ↓
state preserved
```

---

# 114. Task 8.3 — Server Restart Test

Verify:

```text
pet exists
 ↓
API stops
 ↓
API restarts
 ↓
pet still exists
```

Database is authoritative persistence.

---

# 115. Task 8.4 — Long Absence Verification

Test:

```text
+7d
```

Verify:

```text
no death
no passive Bond loss
valid stats
recoverable condition
reasonable current activity
reasonable event count
```

---

# 116. Task 8.5 — Repeated Action Stress

Test:

```text
Feed repeatedly

Play repeatedly

rapid action attempts
```

Verify:

* no stat overflow,
* no invalid concurrent mutation,
* diminishing behavior works,
* low-Energy rejection works.

---

# 117. Task 8.6 — Sleep Boundary Tests

Test:

```text
sleep at low energy
sleep near full energy
advance past auto-wake
long elapsed sleep request
```

Verify correct segmented simulation.

---

# 118. Task 8.7 — Error Path Review

Verify:

```text
API unavailable

invalid request

domain rejection

database failure where practical
```

Player-facing presentation must distinguish expected character/game rejection from technical failure.

---

# 119. Task 8.8 — Accessibility Baseline

Check:

```text
keyboard navigation
visible focus
button labels
input labels
status not color-only
sleep state has text
minimum reasonable click targets
```

Production accessibility audit is not required.

Baseline usability is.

---

# 120. Task 8.9 — Responsive Smoke Test

Test at minimum:

```text
desktop
narrow desktop/tablet
mobile-sized viewport
```

Goal:

```text
usable
```

not:

```text
perfect production mobile design
```

---

# 121. Task 8.10 — Scope Audit

Before declaring Done, search code/UI for accidental future features.

There should be no implementation of:

```text
LLM
Memory
Search
Skills
Inventory
Currency
Authentication
Multiple Pets
```

unless required infrastructure existed beforehand and remains unused.

Delete unnecessary speculative abstractions.

---

# 122. Phase 8 Gate

Prototype must satisfy technical and UX acceptance criteria from:

```text
docs/16-prototype-01-scope.md
```

before playtest.

---

# 123. Phase 9 — Playtest Preparation

Goal:

> Turn the development build into a learning instrument.

---

# 124. Task 9.1 — Seed / Reset Workflow

Tester setup must be predictable.

Provide easy way to:

```text
reset
 ↓
start from Egg
```

Developer should not need database console.

---

# 125. Task 9.2 — Playtest Scenario

Prepare basic test flow without over-instructing the player.

Suggested observation:

```text
Hatch pet

Name pet

Interact naturally

Observe needs

Try Feed / Play / Sleep

Leave / simulate time

Return
```

For developer-led testing, Debug Mode can simulate absence.

---

# 126. Task 9.3 — Observation Questions

Observe:

```text
What does player look at first?

Do they understand the pet's condition?

Do they know what actions are available?

Do they understand why Play was rejected?

Do they notice time has passed?

Do they care what the pet was doing?
```

Avoid explaining mechanics before player encounters them.

---

# 127. Task 9.4 — Post-Test Questions

Primary:

> Did the pet feel alive?

Supporting:

```text
How did you know what the pet needed?

Did anything feel like you were just managing bars?

What did you think happened while you were away?

Was anything confusing?

Did you feel punished for leaving?

What would you want to do with the pet next?
```

---

# 128. Task 9.5 — Record Findings

Create future:

```text
docs/19-prototype-01-findings.md
```

after actual playtesting.

Separate:

```text
Observation
Interpretation
Decision
```

Do not immediately turn every tester suggestion into feature requirement.

---

# 129. Recommended Codex Execution Units

Do not give Codex one instruction:

```text
Build Prototype 0.1.
```

Recommended execution units:

```text
Unit 01
Phase 0

Unit 02
Tasks 1.1–1.6

Unit 03
Tasks 1.7–1.12

Unit 04
Tasks 2.1–2.6

Unit 05
Tasks 2.7–2.14

Unit 06
Phase 3

Unit 07
Tasks 4.1–4.6

Unit 08
Tasks 4.7–4.11

Unit 09
Phase 5

Unit 10
Tasks 6.1–6.8

Unit 11
Tasks 6.9–6.20

Unit 12
Phase 7

Unit 13
Phase 8

Unit 14
Playtest Preparation
```

A unit may be split further if the diff becomes large.

---

# 130. Codex Task Template

Each Codex execution request should approximately use:

```text
Goal

Implement [specific task/unit].

Read First

- relevant docs
- relevant existing modules

Requirements

- explicit behavior
- expected interfaces
- scope

Constraints

- architecture boundaries
- forbidden dependencies
- no future features

Tests

- tests to add/update
- commands to run

Acceptance Criteria

- observable completion conditions

Do Not

- refactor unrelated code
- add speculative abstractions
- expand product scope
```

---

# 131. Codex Inspection Rule

Before changing files, Codex should:

```text
inspect repository
 ↓
identify existing conventions
 ↓
identify relevant files
 ↓
then edit
```

Do not assume repository is still identical to documentation.

Codebase reality may have evolved.

---

# 132. Codex Change Rule

Prefer:

```text
small focused diff
```

over:

```text
large architectural rewrite
```

If an existing implementation conflicts with plan:

1. identify conflict,
2. determine whether code or documentation is stale,
3. surface material decision,
4. avoid silently rewriting unrelated areas.

---

# 133. Codex Testing Rule

Every implementation unit should run the narrowest relevant tests first.

Example:

```text
domain task
→ domain tests

simulation task
→ simulation tests

API task
→ API tests
```

Then run broader:

```text
typecheck
test
```

before checkpoint.

---

# 134. Codex Completion Report

After each execution unit, Codex should report:

```text
Implemented

Files Changed

Tests Added / Updated

Validation Run

Known Limitations

Next Recommended Unit
```

No long essay required.

The purpose is traceability.

---

# 135. Commit Strategy

Recommended:

```text
one coherent implementation unit
≈
one commit
```

Examples:

```text
chore: initialize prototype workspace

feat(domain): add pet state and care rules

feat(simulation): add elapsed-time needs simulation

feat(simulation): add autonomous behavior

feat(api): add pet lifecycle endpoints

feat(debug): add simulation time controls

feat(web): add pet home care loop
```

Avoid one giant:

```text
feat: build prototype
```

commit.

---

# 136. Definition of Ready for a Task

A task is ready when:

```text
requirements are clear
dependencies are complete
relevant product decision exists
acceptance criteria are testable
```

If not:

```text
clarify first
```

Do not let Codex invent major product rules.

---

# 137. Definition of Done for a Task

A task is done when:

```text
implementation exists

relevant tests pass

typecheck passes for affected code

acceptance criteria satisfied

no unrelated scope expansion

documentation updated if implementation contract changed
```

---

# 138. Prototype Completion Gate

Prototype 0.1 is complete only when all critical paths work together:

```text
FIRST VISIT

Launch
 ↓
Egg
 ↓
Hatch
 ↓
Name
 ↓
Baby


CARE

Feed
Play
Sleep


LIFE

Time passes
Needs change
Pet acts autonomously
Pet wakes/sleeps


RETURN

Reload / revisit
 ↓
Simulation catches up
 ↓
Current pet is believable


DEBUG

Inspect state
Advance time
Force conditions
Inspect events


QUALITY

Tests pass
Persistence works
No scope leakage
```

---

# 139. Stop Conditions

Pause implementation and review if:

### Architecture

Domain starts depending on framework/infrastructure.

### Scope

LLM, Memory, Search, or unrelated features begin entering Prototype 0.1.

### Simulation

Rules become difficult to test deterministically.

### UX

Pet becomes secondary to stats/debug UI.

### Complexity

A simple prototype feature requires generalized infrastructure significantly larger than the feature itself.

### Contradiction

Two frozen documents require incompatible behavior.

---

# 140. Optimization Rule

During Prototype 0.1 optimize for:

```text
Clarity
Testability
Iteration Speed
Observability
```

Do not optimize prematurely for:

```text
massive scale
multi-region deployment
thousands of concurrent pets
plugin ecosystems
generic game engine reuse
```

---

# 141. Architecture Success Condition

A successful implementation should allow this test without web/API/database:

```ts
const result = simulateElapsedTime({
  state,
  from,
  to,
  rules,
  random,
});
```

and allow care rules to be tested similarly as pure domain operations.

If core pet behavior requires booting Fastify or PostgreSQL, architecture has drifted.

---

# 142. Product Success Condition

Technical completion alone does not prove Prototype 0.1.

The final question remains:

> **Does the pet feel alive?**

A perfectly architected simulator that feels like manipulating four numbers has failed the product hypothesis.

A visually charming pet whose state is inconsistent or fabricated has also failed.

Prototype requires both:

```text
Believable Character
+
Reliable Reality
```

---

# 143. Execution Order Summary

Final recommended sequence:

```text
01 Repository
       ↓
02 Domain
       ↓
03 Simulation
       ↓
04 Persistence
       ↓
05 API
       ↓
06 Debug Backend
       ↓
07 Player UI Foundation
       ↓
08 Pet Presentation
       ↓
09 Care Loop
       ↓
10 Return Experience
       ↓
11 Debug UI
       ↓
12 Integration
       ↓
13 Hardening
       ↓
14 Playtest
```

---

# 144. Immediate Next Action

Documentation required to begin Prototype 0.1 implementation is now complete.

The first Codex execution unit should be:

```text
PHASE 0 — Repository Baseline
```

Its goal is only:

```text
pnpm workspace

React + Vite web app

Fastify API

shared TypeScript configuration

Vitest baseline

Local PostgreSQL configuration

Drizzle baseline
```

Do not implement Pet, simulation, UI, or gameplay in the same execution unit.

Once Phase 0 passes its gate, proceed to:

```text
Phase 1 — Domain Foundation
```

This keeps the first implementation checkpoint small, inspectable, and reversible.
