# Technology Stack

## 1. Purpose

Dokumen ini mendefinisikan technology stack awal untuk **AI Virtual Pet**, khususnya untuk **Prototype 0.1: Simulation**.

Tujuan Prototype 0.1 bukan membangun seluruh produk atau AI companion secara lengkap.

Prototype ini bertujuan membuktikan bahwa pet dapat memiliki kehidupan yang konsisten melalui:

* persistent state,
* player actions,
* elapsed time,
* offline simulation,
* autonomous behavior,
* deterministic game rules,
* dan event history.

Prototype 0.1 harus dapat berjalan dan diuji **tanpa LLM, Search provider, atau external AI services**.

---

# 2. Technology Principles

Pemilihan teknologi mengikuti prinsip berikut.

## 2.1 Domain First

Game rules tidak boleh bergantung pada framework, database, HTTP, atau AI provider.

Core domain harus dapat dijalankan sebagai pure TypeScript.

```text
Input State
    +
Game Action / Elapsed Time
    ↓
Game Engine
    ↓
New State + Events
```

---

## 2.2 Backend Authoritative

Backend merupakan authority terhadap game state.

Client tidak boleh melakukan authoritative state mutation sendiri.

Contoh yang salah:

```text
Feed button
    ↓
Client: hunger += 25
```

Flow yang benar:

```text
Feed button
    ↓
POST /pet/actions
    ↓
Game Engine
    ↓
Authoritative mutation
    ↓
PetSnapshot
    ↓
Client renders result
```

---

## 2.3 Frameworks Stay Outside the Domain

Core domain tidak boleh mengetahui keberadaan:

* React
* Fastify
* Drizzle
* PostgreSQL
* HTTP
* LLM provider
* Search provider

Dependency harus mengarah menuju domain, bukan sebaliknya.

---

## 2.4 External Providers Are Replaceable

Future external services seperti:

* LLM,
* Search,
* embeddings,
* notification,
* analytics,

harus berada di belakang abstraction/interface.

Game rules tidak boleh bergantung langsung pada provider tertentu.

---

## 2.5 Simulation Must Be Fast

Prototype harus dapat mensimulasikan waktu tanpa menunggu real time.

Contoh:

```text
advance 1 hour
advance 6 hours
advance 1 day
advance 3 days
advance 30 days
```

Simulation tersebut harus dapat dijalankan dalam hitungan milidetik saat testing.

---

# 3. Initial Platform

Initial platform:

**Web**

Web dipilih sebagai platform pertama untuk mempercepat:

* development,
* debugging,
* balancing,
* simulation testing,
* playtesting,
* dan iteration.

Keputusan ini tidak berarti produk final harus tetap berbasis web.

Domain dan backend harus tetap portable sehingga future client dapat berupa:

* mobile,
* desktop,
* atau platform lain.

---

# 4. Technology Stack

## 4.1 Language

**TypeScript**

TypeScript digunakan sebagai bahasa utama pada:

* domain,
* simulation,
* backend,
* shared contracts,
* dan frontend.

Tujuannya adalah menjaga konsistensi type system di seluruh codebase.

Contoh domain types:

```ts
type PetStage =
  | 'EGG'
  | 'BABY'
  | 'CHILD'
  | 'ADULT';

type PetActivity =
  | 'IDLE'
  | 'SLEEPING'
  | 'PLAYING'
  | 'RESTING';

type GameAction =
  | FeedAction
  | PlayAction
  | SleepAction;
```

---

# 5. Runtime

Backend runtime:

**Node.js**

Node.js dipilih karena:

* TypeScript ecosystem matang,
* integrasi web sederhana,
* cocok untuk modular monolith,
* ecosystem testing baik,
* dan future AI/tool integrations umumnya memiliki JavaScript/TypeScript SDK.

---

# 6. Repository Structure

Project menggunakan:

**pnpm workspace**

dengan struktur monorepo.

Initial structure:

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
├── 00-vision.md
├── 01-mini-gdd.md
├── 02-game-systems.md
├── 03-ai-behavior.md
├── 04-memory-system.md
├── 05-growth-and-skills.md
├── 06-technical-architecture.md
├── 07-data-model.md
├── 08-api-design.md
├── 09-playtesting.md
├── 10-decisions.md
└── 11-tech-stack.md
```

Monorepo tooling tambahan seperti Nx atau Turborepo belum diperlukan untuk Prototype 0.1.

Complexity baru ditambahkan jika kebutuhan nyata muncul.

---

# 7. Domain Package

Package:

```text
packages/domain
```

berisi core game concepts dan rules.

Contoh:

```text
domain/

pet/
├── pet.ts
├── pet-state.ts
├── pet-personality.ts
└── pet-growth.ts

actions/
├── feed.ts
├── play.ts
└── sleep.ts

mood/
└── derive-mood.ts

events/
├── game-event.ts
└── event-types.ts

rules/
├── stat-rules.ts
├── action-rules.ts
└── balancing.ts

ports/
├── clock.ts
└── random.ts
```

Domain tidak melakukan:

```text
HTTP calls
database queries
LLM calls
Search calls
filesystem access
```

---

# 8. Simulation Package

Package:

```text
packages/simulation
```

bertanggung jawab terhadap elapsed-time simulation.

Responsibilities:

* stat decay,
* sleep recovery,
* offline simulation,
* autonomous behavior,
* simulation boundaries,
* long-absence approximation.

Conceptual API:

```ts
simulateElapsedTime({
  pet,
  from,
  to,
  random,
});
```

Output:

```ts
interface SimulationResult {
  state: PetState;
  events: GameEvent[];
}
```

Simulation tidak melakukan persistence secara langsung.

---

# 9. Clock Abstraction

Core domain tidak boleh menggunakan `Date.now()` secara langsung untuk menentukan game behavior.

Gunakan abstraction:

```ts
interface Clock {
  now(): Date;
}
```

Production:

```text
SystemClock
```

Testing:

```text
FakeClock
```

Contoh:

```ts
const clock = new FakeClock(
  new Date('2026-09-25T10:00:00Z')
);

clock.advance({
  hours: 6,
});
```

Ini memungkinkan deterministic time travel saat testing.

---

# 10. Random Abstraction

Game logic tidak boleh bergantung langsung pada uncontrolled `Math.random()`.

Gunakan abstraction:

```ts
interface Random {
  next(): number;
}
```

Production menggunakan normal random implementation.

Testing dapat menggunakan:

```text
SeededRandom
FixedRandom
SequenceRandom
```

Tujuannya agar autonomous behavior dapat diuji secara reproducible.

---

# 11. Backend Framework

Backend menggunakan:

**Fastify**

Fastify berfungsi sebagai HTTP/application boundary.

Responsibilities:

* HTTP routing,
* request validation,
* authentication di masa depan,
* application orchestration,
* repository access,
* transaction management,
* response serialization.

Fastify tidak menjadi tempat game rules.

Contoh flow:

```text
POST /api/v1/pet/actions
        ↓
Validate Request
        ↓
Load Pet
        ↓
Simulate Elapsed Time
        ↓
Apply Game Action
        ↓
Persist State
        ↓
Append Events
        ↓
Return PetSnapshot
```

Route handlers harus tetap tipis.

---

# 12. Validation

Boundary validation menggunakan:

**Zod**

Zod digunakan untuk:

* HTTP request validation,
* environment variables,
* external provider responses,
* future AI structured output validation.

Contoh:

```text
Untrusted Input
      ↓
Zod Schema
      ↓
Validated DTO
      ↓
Application Layer
      ↓
Domain Command
```

Domain validation tetap menjadi tanggung jawab domain.

Valid JSON tidak otomatis berarti valid game action.

---

# 13. Database

Primary database:

**PostgreSQL**

PostgreSQL menjadi source of persistence utama.

Prototype 0.1 terutama menggunakan:

```text
Pet
PetState
PetPersonality
PetGrowth
Event
```

Future phases dapat menambahkan:

```text
PetSkill
Memory
Conversation
Message
```

Tanpa perlu mengganti database utama.

---

# 14. ORM / Database Layer

Database access menggunakan:

**Drizzle ORM**

Drizzle digunakan untuk:

* schema definition,
* migrations,
* queries,
* relational persistence.

Domain tidak bergantung pada Drizzle.

Gunakan repository abstraction antara application/domain dan persistence.

Contoh:

```ts
interface PetRepository {
  findById(id: PetId): Promise<Pet | null>;

  save(pet: Pet): Promise<void>;
}
```

Implementation:

```text
DrizzlePetRepository
```

Dependency:

```text
Application
     ↓
PetRepository
     ↑
DrizzlePetRepository
     ↓
PostgreSQL
```

---

# 15. Frontend

Frontend Prototype 0.1 menggunakan:

**React + Vite**

Prototype tidak membutuhkan:

* SSR,
* SEO,
* server components,
* complex routing infrastructure.

Client berfungsi sebagai presentation layer dan user intent surface.

---

# 16. Server State

Client-server state menggunakan:

**TanStack Query**

Client mendapatkan authoritative state dari backend.

Contoh:

```text
Player presses Feed
        ↓
mutation
        ↓
POST /pet/actions
        ↓
PetSnapshot
        ↓
Query Cache
        ↓
UI Render
```

Client tidak mengasumsikan hasil mutation berdasarkan local calculation.

---

# 17. Prototype Debug UI

Prototype 0.1 membutuhkan debug controls sebagai first-class development feature.

Contoh:

```text
PET

Hunger       ███████░
Energy       ██████░░
Happiness    ████████
Bond         ███░░░░░

Mood:
Hungry

Activity:
Idle

ACTIONS

[Feed]
[Play]
[Sleep]

TIME TRAVEL

[+1 hour]
[+6 hours]
[+1 day]
[+3 days]

DEBUG

Current Time
Last Simulated At
Raw State
Recent Events
```

Debug UI bukan bagian dari final player experience.

Tujuannya untuk mempercepat:

* balancing,
* simulation inspection,
* bug reproduction,
* dan playtesting.

---

# 18. Testing

Primary test framework:

**Vitest**

Testing dibagi menjadi beberapa layer.

## 18.1 Domain Unit Tests

Contoh:

```text
Feed increases Hunger
Play consumes Energy
Play fails when Energy <= 15
Sleep changes activity
Stats remain inside 0-100
```

---

## 18.2 Simulation Tests

Contoh:

```text
simulate 1 hour awake
simulate 8 hours sleeping
simulate 24 hours
simulate 48 hours
simulate 7 days
simulate 30 days
```

---

## 18.3 Scenario Tests

Scenario tests mensimulasikan player behavior.

Contoh scenarios:

```text
daily active player

twice-per-week player

hyperactive player

constant feeding

constant playing

long absence

sleep-heavy pet
```

Tujuannya bukan hanya correctness, tetapi menemukan balancing problems.

---

## 18.4 API Tests

Fastify routes dapat diuji menggunakan Fastify injection tanpa menjalankan external HTTP server.

Contoh:

```text
POST /pet/actions
GET /pet
POST /pet/hatch
```

---

# 19. Local Infrastructure

Prototype menggunakan:

**Local PostgreSQL**

Initial infrastructure hanya membutuhkan PostgreSQL.

Conceptually:

```text
PostgreSQL 16+
running on localhost

DATABASE_URL
configured through local environment
```

Application sendiri dapat dijalankan langsung melalui:

```text
pnpm dev
```

Docker tidak digunakan untuk local development project ini.

---

# 20. Explicitly Not Included in Prototype 0.1

Prototype 0.1 tidak menggunakan:

* LLM provider,
* Search provider,
* vector database,
* Redis,
* message queue,
* background workers,
* microservices,
* Kubernetes,
* continuous AI agent.

Komponen tersebut hanya ditambahkan ketika prototype phase membutuhkannya.

---

# 21. Future AI Integration Boundary

Walaupun AI belum digunakan pada Prototype 0.1, architecture harus mempersiapkan boundary yang benar.

Future flow:

```text
User Message
      ↓
AI Orchestrator
      ↓
Intent Interpretation
      ↓
Validated GameAction
      ↓
Game Engine
      ↓
Actual Result
      ↓
AI Character Response
```

AI tidak pernah menjadi authority terhadap game state.

---

# 22. Future Search Integration Boundary

Future Search skill mengikuti pattern:

```text
AI detects SEARCH
       ↓
Skill System
       ↓
Check unlock
       ↓
Tool Engine
       ↓
Search Provider
       ↓
Normalized ToolResult
       ↓
AI Response
```

Search provider tidak menjadi dependency dari domain.

---

# 23. Dependency Direction

Target dependency direction:

```text
                    domain
                       ↑
                  simulation
                       ↑
                 application
                  ↑         ↑
           persistence     API
                             ↑
                            web
```

External systems berada di pinggir architecture.

```text
PostgreSQL
Fastify
React
LLM
Search
```

Core domain berada di tengah.

---

# 24. Prototype 0.1 Architecture

```text
┌──────────────────────────────────────┐
│                WEB                   │
│                                      │
│ React + Vite                         │
│ TanStack Query                       │
│ Debug / Playtest UI                  │
└──────────────────┬───────────────────┘
                   │
                REST/JSON
                   │
┌──────────────────▼───────────────────┐
│                API                   │
│                                      │
│ Fastify                              │
│ Zod                                  │
│ Application Services                 │
└──────────────────┬───────────────────┘
                   │
        ┌──────────┴───────────┐
        │                      │
┌───────▼────────┐    ┌────────▼────────┐
│  Game Domain   │    │   Simulation    │
│                │    │     Engine      │
│ Pure TS        │    │                 │
│ Game Rules     │    │ Elapsed Time    │
│ Actions        │    │ Offline Logic   │
│ Mood           │    │ Autonomy        │
└────────────────┘    └─────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│             Persistence              │
│                                      │
│ Drizzle                              │
│ PostgreSQL                           │
└──────────────────────────────────────┘
```

---

# 25. Prototype 0.1 Stack Summary

| Area                 | Technology     |
| -------------------- | -------------- |
| Platform             | Web            |
| Language             | TypeScript     |
| Runtime              | Node.js        |
| Monorepo             | pnpm workspace |
| Frontend             | React          |
| Build Tool           | Vite           |
| Server State         | TanStack Query |
| Backend              | Fastify        |
| Validation           | Zod            |
| Database             | PostgreSQL     |
| ORM                  | Drizzle ORM    |
| Testing              | Vitest         |
| Local Infrastructure | Local PostgreSQL |
| AI                   | Not included   |
| Search               | Not included   |
| Vector DB            | Not included   |
| Redis                | Not included   |
| Queue                | Not included   |

---

# 26. Accepted Decisions

The following decisions are considered accepted for Prototype 0.1:

* Initial platform is Web.
* TypeScript is the primary language.
* Node.js is the backend runtime.
* Project uses a pnpm workspace monorepo.
* React + Vite is used for the prototype client.
* TanStack Query manages client/server state synchronization.
* Fastify is the backend framework.
* Zod validates external/boundary input.
* PostgreSQL is the primary database.
* Drizzle ORM is the persistence implementation.
* Vitest is the primary testing framework.
* An existing local PostgreSQL service is used for development.
* Game domain remains framework-independent.
* Simulation remains independently testable.
* Clock is injectable.
* Randomness is controllable and seedable.
* Backend remains authoritative.
* Client never performs authoritative game-state mutation.
* No LLM is required for core care actions.
* Prototype 0.1 contains no AI provider.
* Prototype 0.1 contains no Search provider.
* Infrastructure complexity is added only when required.

---

# 27. Next Step

Technology stack is now sufficiently defined for Prototype 0.1.

Before implementation begins, the next design phase should define:

**Game UX / Functional Game Design**

This should establish how the player experiences the existing systems, including:

* first launch,
* egg and hatch flow,
* naming,
* Pet Home,
* presentation of needs,
* player actions,
* pet reactions,
* mood feedback,
* sleep,
* offline return,
* event feedback,
* navigation,
* and debug/playtest interactions.

After Game UX is defined:

```text
Game UX
    ↓
Prototype 0.1 Wireframe
    ↓
Prototype Scope Freeze
    ↓
Implementation Plan
    ↓
Prototype 0.1 Development
```
