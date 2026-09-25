# Decision Log

## AI Virtual Pet

**Version:** 0.1
**Status:** Active
**Phase:** Pre-production
**Purpose:** Record important product, game design, AI, and architecture decisions.

---

# 1. Purpose

Dokumen ini mencatat keputusan penting yang mempengaruhi arah project.

Setiap decision entry sebaiknya menjawab:

* keputusan apa yang dibuat,
* kenapa keputusan itu dipilih,
* alternatif apa yang dipertimbangkan,
* konsekuensinya,
* dan apakah keputusan tersebut masih aktif.

Tujuannya adalah menghindari situasi beberapa bulan kemudian:

> "Kenapa dulu kita bikin begini?"

Decision Log bukan tempat mencatat setiap perubahan kecil.

Gunakan untuk keputusan yang:

* mempengaruhi architecture,
* mempengaruhi core game design,
* sulit dibalik,
* mempengaruhi banyak subsystem,
* atau penting untuk memahami intent project.

---

# 2. Decision Status

Gunakan status:

```text
PROPOSED
ACCEPTED
SUPERSEDED
REJECTED
DEPRECATED
```

Meaning:

`PROPOSED`

Decision sedang dipertimbangkan.

`ACCEPTED`

Decision aktif dan menjadi dasar development.

`SUPERSEDED`

Decision digantikan decision baru.

`REJECTED`

Decision pernah dipertimbangkan tetapi tidak dipilih.

`DEPRECATED`

Masih mungkin ada di implementation lama, tetapi tidak lagi direkomendasikan.

---

# 3. Decision Format

Gunakan template:

```text
## DEC-XXX — Title

Date:
Status:

Context:

Decision:

Reason:

Alternatives Considered:

Consequences:

Related Documents:
```

Nomor decision sebaiknya tidak digunakan ulang.

---

# 4. DEC-001 — Pet First, Assistant Second

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Project memiliki utility AI seperti Search dan kemungkinan Reminder, Calendar, serta Research di masa depan.

Ada risiko produk berkembang menjadi generic AI assistant dengan avatar virtual pet.

## Decision

AI Virtual Pet harus memprioritaskan:

```text
Character
↓
Relationship
↓
Growth
↓
Utility
```

Pet harus terasa sebagai character terlebih dahulu dan assistant kemudian.

## Reason

Core differentiation project berasal dari:

* attachment,
* personality,
* memory,
* history,
* growth.

Jika utility menjadi pusat pengalaman terlalu awal, virtual pet hanya menjadi decorative interface.

## Alternatives Considered

```text
Assistant-first product
with pet-themed UI
```

Rejected karena tidak mendukung core fantasy.

## Consequences

Utility features:

* tidak semuanya tersedia sejak awal,
* harus terhubung dengan growth,
* harus tetap diekspresikan melalui character.

## Related Documents

* `00-vision.md`
* `05-growth-and-skills.md`

---

# 5. DEC-002 — Game Engine Is the Source of Truth

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

LLM mampu menghasilkan flexible behavior, tetapi tidak reliable sebagai persistent simulation engine.

## Decision

Game Engine menjadi authoritative source untuk:

```text
Hunger
Energy
Happiness
Bond
Mood rules
Personality values
Growth
Skill availability
Action outcomes
```

LLM tidak boleh langsung mengubah game state.

## Reason

Kita membutuhkan:

* deterministic rules,
* consistency,
* testability,
* debuggability,
* model independence.

## Alternatives Considered

### LLM-controlled state

LLM menentukan secara bebas:

```text
bond +10
pet hungry
pet grows
```

Rejected.

### Hybrid without clear authority

LLM dan Game Engine sama-sama dapat mutate state.

Rejected karena mudah menghasilkan conflict.

## Consequences

Semua state mutation harus melewati Game Engine.

AI hanya dapat:

```text
interpret
propose
express
```

## Related Documents

* `02-game-systems.md`
* `03-ai-behavior.md`
* `06-technical-architecture.md`

---

# 6. DEC-003 — AI Acts as Actor + Interpreter

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

AI tetap diperlukan untuk natural conversation dan flexible character behavior.

## Decision

LLM berperan sebagai:

```text
Character Actor
+
Intent Interpreter
+
Conversation Interpreter
+
Memory Candidate Detector
+
Tool Request Interpreter
```

## Reason

LLM sangat kuat pada language interpretation dan expression.

Tetapi deterministic game rules lebih cocok ditangani Game Engine.

## Alternatives Considered

### AI only for dialogue

Too limited untuk natural-language action dan memory extraction.

### AI controls entire game

Rejected berdasarkan DEC-002.

## Consequences

AI output harus dipisahkan menjadi:

```text
Machine-facing metadata
+
Player-facing character response
```

## Related Documents

* `03-ai-behavior.md`

---

# 7. DEC-004 — Expression Can Improvise, Facts Cannot

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

AI membutuhkan fleksibilitas agar pet tidak terasa scripted.

Namun hallucination dapat merusak continuity.

## Decision

AI boleh improvisasi pada:

```text
wording
tone
humor
questions
emotional expression
```

AI tidak boleh mengarang:

```text
game state
memories
past events
skills
tool results
user facts
```

## Reason

Character variation membutuhkan freedom.

World consistency membutuhkan constraints.

## Consequences

Context Builder harus memberikan factual state secara eksplisit.

AI prompt harus membedakan:

```text
known facts
memory
tool results
user input
```

## Related Documents

* `03-ai-behavior.md`
* `04-memory-system.md`

---

# 8. DEC-005 — Personality Is Persistent Game State

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Personality merupakan bagian utama differentiation antar-pet.

Jika personality hanya berasal dari prompt, karakter dapat berubah-ubah antar-conversation.

## Decision

Personality disimpan sebagai persistent numeric game state.

Initial traits:

```text
Playful
Curious
Shy
Independent
Clingy
```

## Reason

Persistent state memberikan:

* consistency,
* gradual growth,
* debugging,
* predictable influence.

## Alternatives Considered

### Let LLM infer personality from chat history

Rejected karena unstable dan mahal.

### Fixed personality chosen at creation

Rejected karena mengurangi fantasy bahwa player membesarkan personality.

## Consequences

AI membaca personality.

AI tidak menulis personality secara langsung.

Game rules menentukan personality drift.

## Related Documents

* `02-game-systems.md`
* `03-ai-behavior.md`
* `07-data-model.md`

---

# 9. DEC-006 — Personality Develops Through Interaction

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Player fantasy utama adalah:

> "Pet ini jadi seperti ini karena aku membesarkannya."

## Decision

Personality berubah perlahan berdasarkan interaction history.

Examples:

```text
Play
→ Playful signal

Exploration / conversation
→ Curious signal

Long independent periods
→ Independent signal
```

## Reason

Ini menciptakan causal relationship antara player behavior dan pet identity.

## Consequences

Personality change harus:

* kecil,
* gradual,
* capped,
* resistant to spam.

## Related Documents

* `02-game-systems.md`

---

# 10. DEC-007 — No Permanent Death in MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Traditional virtual pets sering menggunakan death sebagai punishment.

Project ini berorientasi pada long-term AI relationship.

## Decision

MVP tidak memiliki permanent death.

Low needs dapat menyebabkan:

```text
mood changes
behavior changes
action limitations
```

tetapi tidak menghapus pet.

## Reason

Permanent death berisiko menghancurkan:

* memory,
* attachment,
* history,
* long-term relationship.

## Alternatives Considered

### Traditional Tamagotchi death

Rejected untuk MVP.

### Reset after severe neglect

Rejected karena terlalu punitive.

## Consequences

Game membutuhkan alternative consequences yang tetap meaningful tanpa destructive punishment.

## Related Documents

* `00-vision.md`
* `02-game-systems.md`

---

# 11. DEC-008 — No Passive Bond Decay in MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

User mungkin tidak membuka app setiap hari.

Mengurangi Bond karena absence dapat terasa seperti emotional punishment.

## Decision

Bond tidak turun secara pasif hanya karena waktu berlalu.

Long absence dapat mempengaruhi:

```text
mood
return dialogue
Independent tendency
```

tetapi bukan Bond secara langsung.

## Reason

Bond merepresentasikan shared history, bukan daily streak.

## Consequences

Return experience harus tetap meaningful tanpa mengandalkan relationship loss.

## Related Documents

* `02-game-systems.md`

---

# 12. DEC-009 — No Guilt-Driven Retention

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Virtual pets mudah menggunakan emotional guilt untuk memaksa retention.

Contoh:

> "Aku sedih karena kamu meninggalkanku."

## Decision

Retention tidak boleh bergantung pada emotional pressure.

Primary return motivations:

```text
Curiosity
Attachment
Growth
Discovery
Utility
```

## Reason

Project ingin relationship terasa enjoyable, bukan obligation.

## Consequences

Clingy personality harus tetap memiliki batas.

Notifications juga harus ringan.

## Related Documents

* `00-vision.md`
* `03-ai-behavior.md`

---

# 13. DEC-010 — Offline Simulation Uses Elapsed Time

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Pet harus terasa tetap hidup ketika app ditutup.

Continuous background simulation untuk setiap pet terlalu kompleks dan mahal untuk MVP.

## Decision

Simulation dihitung ketika state dimuat:

```text
now - lastSimulatedAt
```

Game Engine kemudian menyelesaikan perubahan yang terjadi selama absence.

## Reason

Pendekatan ini:

* sederhana,
* murah,
* deterministic,
* scalable.

## Alternatives Considered

### Permanent background process

Rejected untuk MVP.

### Cron every minute per pet

Rejected karena unnecessary infrastructure.

## Consequences

Offline events harus diringkas.

Very long absence menggunakan approximation.

## Related Documents

* `02-game-systems.md`
* `06-technical-architecture.md`

---

# 14. DEC-011 — Growth Requires Time + Interaction + Bond

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Growth hanya berdasarkan waktu dapat terjadi tanpa relationship.

Growth hanya berdasarkan interaction mudah digrind.

## Decision

Growth menggunakan:

```text
Age
+
Meaningful Interaction
+
Bond
```

## Reason

Ketiganya mewakili:

```text
Time
+
Participation
+
Relationship
```

## Consequences

Player tidak dapat mempercepat growth secara ekstrem melalui spam.

Growth formulas perlu balancing melalui playtest.

## Related Documents

* `02-game-systems.md`
* `05-growth-and-skills.md`

---

# 15. DEC-012 — Growth Must Be Player-Present

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Growth adalah emotional milestone.

Jika terjadi saat player offline, moment tersebut hilang.

## Decision

Pet dapat menjadi:

```text
GROWTH_READY
```

saat offline.

Namun actual stage transition hanya terjadi saat player hadir.

## Reason

Growth harus menjadi experience, bukan silent state update.

## Consequences

API memiliki explicit growth trigger/presentation flow.

## Related Documents

* `05-growth-and-skills.md`
* `08-api-design.md`

---

# 16. DEC-013 — Growth Does Not Reset Identity

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Stage change harus terasa sebagai maturation, bukan replacement.

## Decision

Growth mempertahankan:

```text
Personality
Bond
Memory
History
```

## Reason

Pet Baby, Child, dan Adult harus terasa sebagai karakter yang sama.

## Consequences

Stage-specific AI behavior mengubah expression, bukan identity.

## Related Documents

* `04-memory-system.md`
* `05-growth-and-skills.md`

---

# 17. DEC-014 — Skills Are Pet Capabilities, Not App Features

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Skill seperti Search dapat mudah terasa sebagai feature menu biasa.

## Decision

Skill diposisikan sebagai kemampuan yang dipelajari pet.

Player-facing language menggunakan konsep:

```text
learned
can now
new skill
```

bukan:

```text
feature enabled
module activated
```

## Reason

Capability progression harus memperkuat character fantasy.

## Consequences

Skill unlock terhubung dengan growth.

Dialogue dan UI harus menjaga framing tersebut.

## Related Documents

* `05-growth-and-skills.md`

---

# 18. DEC-015 — Search Is the First Utility Skill

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Kita membutuhkan satu capability untuk membuktikan:

```text
Growth → Useful AI Capability
```

## Decision

MVP menggunakan:

```text
Search Lv.1
```

sebagai utility skill pertama.

## Reason

Search bersifat:

* useful,
* understandable,
* read-only,
* low-risk,
* natural through conversation.

## Alternatives Considered

### Reminder

Useful tetapi membutuhkan scheduler dan notifications.

Deferred.

### Calendar

Membutuhkan external permissions dan write actions.

Deferred.

### Research

Terlalu kompleks sebagai skill pertama.

Deferred.

## Consequences

Adult stage unlocks Search Lv.1.

## Related Documents

* `05-growth-and-skills.md`

---

# 19. DEC-016 — Search Must Be Skill-Authorized

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

LLM dapat mengetahui kapan Search berguna, tetapi capability progression akan rusak jika AI bisa memanggil Search kapan saja.

## Decision

Tool execution harus melalui:

```text
AI Request
↓
Skill Authorization
↓
Tool Engine
```

## Reason

Skill System adalah source of truth untuk capability.

## Consequences

Locked Search must never invoke external provider.

## Related Documents

* `03-ai-behavior.md`
* `05-growth-and-skills.md`
* `06-technical-architecture.md`

---

# 20. DEC-017 — Memory Is Selective

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Storing all conversation creates:

* noise,
* cost,
* privacy concerns,
* unnatural callbacks.

## Decision

Memory system follows:

> Remember what matters, not everything that happened.

Long-term storage prioritizes:

```text
important user facts
preferences
important events
relationship milestones
meaningful shared history
```

## Reason

Memory exists to strengthen continuity, not maximize retention.

## Consequences

Memory candidate filtering must be conservative.

## Related Documents

* `04-memory-system.md`

---

# 21. DEC-018 — Memory and Chat History Are Separate

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Conversation history contains raw interaction.

Long-term memory contains selected normalized facts.

## Decision

Store:

```text
Conversation / Message
```

separately from:

```text
Memory
```

## Reason

They have different:

* lifecycle,
* retrieval,
* retention,
* semantics.

## Consequences

Deleting/trimming chat history does not necessarily require losing all long-term memory, subject to user controls/privacy policies.

## Related Documents

* `04-memory-system.md`
* `07-data-model.md`

---

# 22. DEC-019 — Memory Precision Over Recall

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Wrong permanent memory damages trust more than forgetting minor details.

## Decision

Memory storage favors:

```text
Precision > Recall
```

It is acceptable to miss some low-value memories.

It is not acceptable to confidently remember false facts.

## Consequences

Automatic long-term storage uses relatively high confidence threshold.

Ambiguous information remains recent context or is ignored.

## Related Documents

* `04-memory-system.md`

---

# 23. DEC-020 — AI Cannot Invent Memories

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

LLM may hallucinate plausible shared history.

## Decision

AI may claim to remember something only if supplied through:

```text
Recent Events
Relevant Memories
```

If absent:

AI expresses uncertainty.

## Reason

Memory hallucination directly breaks persistent-character illusion.

## Consequences

Context Builder and prompt constraints must enforce grounding.

## Related Documents

* `03-ai-behavior.md`
* `04-memory-system.md`

---

# 24. DEC-021 — Memory Must Be Correctable and Forgettable

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Pet may store outdated or unwanted information.

## Decision

Memory model supports:

```text
SUPERSEDED
FORGOTTEN
ARCHIVED
```

Player must eventually have a way to correct or forget memory.

## Reason

Long-term personalization should remain transparent and controllable.

## Consequences

Forgotten memories must be excluded from retrieval.

Data model must not make deletion impossible.

## Related Documents

* `04-memory-system.md`
* `07-data-model.md`
* `08-api-design.md`

---

# 25. DEC-022 — Current State + Event Log, Not Full Event Sourcing

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Historical events are useful, but full event sourcing adds significant complexity.

## Decision

MVP stores:

```text
Authoritative Current State
+
Append-Oriented Event Log
```

## Reason

Provides:

* easy state reads,
* historical debugging,
* analytics,
* memory sources,

without requiring state reconstruction from every event.

## Alternatives Considered

### Full Event Sourcing

Rejected for MVP due to unnecessary complexity.

### State only

Rejected because history is important.

## Related Documents

* `06-technical-architecture.md`
* `07-data-model.md`

---

# 26. DEC-023 — Relational Database First

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Game data includes strong relationships and transactional state mutations.

## Decision

MVP should prefer one relational database.

Optional capabilities:

```text
JSON columns
vector extension
```

can be used where useful.

## Reason

Benefits:

* transactions,
* constraints,
* straightforward querying,
* operational simplicity.

## Alternatives Considered

### Dedicated document DB

No strong need yet.

### Multiple specialized databases from day one

Rejected as premature.

## Related Documents

* `06-technical-architecture.md`
* `07-data-model.md`

---

# 27. DEC-024 — Modular Monolith for MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Systems are logically separate:

* Game,
* AI,
* Memory,
* Tools,
* Growth,
* Skills.

But deploying them as microservices immediately adds overhead.

## Decision

Build MVP as a modular monolith.

```text
Single Backend
+
Clear Internal Modules
```

## Reason

Provides architectural boundaries without distributed-system complexity.

## Alternatives Considered

### Microservices

Rejected for MVP.

## Consequences

Modules should maintain explicit ownership and interfaces so they can be extracted later if necessary.

## Related Documents

* `06-technical-architecture.md`

---

# 28. DEC-025 — No Continuous Per-Pet AI Agent

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

The product should feel alive while offline.

One possible implementation is an AI agent continuously thinking in background.

## Decision

MVP does not run continuous AI agents per pet.

Offline life is generated through deterministic simulation + summarized events.

AI narrates them when required.

## Reason

Continuous agents would create:

* high cost,
* complexity,
* unpredictable behavior,
* difficult debugging.

## Consequences

Pet can still feel autonomous without actually running LLM continuously.

## Related Documents

* `02-game-systems.md`
* `03-ai-behavior.md`
* `06-technical-architecture.md`

---

# 29. DEC-026 — Core Care Actions Should Not Require LLM

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Feed, Play, and Sleep are deterministic game actions.

Calling LLM before every action would increase latency and cost.

## Decision

Core action flow:

```text
Game Engine first
```

AI reaction is optional/presentation layer.

Simple reactions may use templates.

## Reason

Care actions should feel immediate.

## Consequences

AI outage does not block basic pet gameplay.

## Related Documents

* `03-ai-behavior.md`
* `06-technical-architecture.md`

---

# 30. DEC-027 — Natural-Language Actions Require Validation

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

User may say:

> "Momo, tidur."

AI can understand the intent.

But interpretation may be wrong.

## Decision

AI produces:

```text
proposed action
+
confidence
```

Game Engine validates before any mutation.

## Reason

Intent detection and action authority must remain separate.

## Consequences

Natural language becomes flexible without sacrificing state consistency.

## Related Documents

* `03-ai-behavior.md`
* `08-api-design.md`

---

# 31. DEC-028 — Maximum One State-Changing Action Per Chat Turn

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Messages can contain multiple commands:

> "Makan terus tidur."

Executing several automatically increases unexpected mutation risk.

## Decision

MVP executes a maximum of:

```text
1 state-changing game action
per chat request
```

## Reason

Keeps intent/action behavior predictable.

## Consequences

Multi-step commands can be handled sequentially in future versions.

## Related Documents

* `03-ai-behavior.md`
* `08-api-design.md`

---

# 32. DEC-029 — Backend Is Authoritative

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Client can be manipulated and may exist on multiple devices.

## Decision

Backend controls:

```text
simulation
action validation
state mutation
growth
skills
memory persistence
```

Client primarily renders and submits intent.

## Reason

Needed for consistency and future multi-device support.

## Consequences

Frontend must not duplicate core game formulas as authority.

## Related Documents

* `06-technical-architecture.md`
* `08-api-design.md`

---

# 33. DEC-030 — API Returns Authoritative Snapshot After Mutation

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

If client computes local deltas, game rules become duplicated.

## Decision

After core mutation, API returns updated Pet Snapshot.

## Reason

Client remains thin.

Backend remains authoritative.

## Consequences

UI reconciles against returned state rather than reimplementing game formulas.

## Related Documents

* `08-api-design.md`

---

# 34. DEC-031 — State-Changing Requests Must Be Idempotent

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Network retries can duplicate Feed, Play, Growth, or Search usage.

## Decision

State-changing API requests support idempotency.

## Reason

Duplicate mutation can corrupt progression and user trust.

## Consequences

API design uses idempotency keys or equivalent mechanism.

## Related Documents

* `06-technical-architecture.md`
* `08-api-design.md`

---

# 35. DEC-032 — Core Domain Logic Must Be Testable Without Infrastructure

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Game balancing requires frequent iteration.

## Decision

Core Game Engine logic should be runnable without:

```text
database
HTTP
LLM
Search
```

Pure functions preferred where practical.

## Reason

Enables:

* fast unit tests,
* deterministic balancing,
* simulation tooling.

## Consequences

Infrastructure side effects stay outside domain calculations.

## Related Documents

* `06-technical-architecture.md`

---

# 36. DEC-033 — Use Injectable Clock

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Virtual pet mechanics heavily depend on elapsed time.

Waiting several real days for testing is impractical.

## Decision

Game code uses an abstract/injectable Clock.

## Reason

Enables:

```text
+1 hour
+1 day
+14 days
```

during tests and debug mode.

## Consequences

Domain logic should not scatter direct system-time calls.

## Related Documents

* `06-technical-architecture.md`
* `09-playtesting.md`

---

# 37. DEC-034 — Use Seedable/Injectable Randomness Where Needed

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Autonomous activities may use weighted randomness.

Random behavior complicates debugging.

## Decision

Random source should be injectable/seedable.

## Reason

Allows reproducible tests.

## Consequences

Randomness can add texture without making tests flaky.

## Related Documents

* `06-technical-architecture.md`

---

# 38. DEC-035 — Randomness Must Not Control Core Progression

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Randomness can help pet feel less mechanical.

## Decision

Randomness may influence:

```text
autonomous activity
minor behavioral variation
```

but not:

```text
Bond loss
growth eligibility
skill disappearance
major progression
```

## Reason

Player history should matter more than luck.

## Related Documents

* `02-game-systems.md`

---

# 39. DEC-036 — One Active Pet Per User for MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Multiple pets would increase:

* UI complexity,
* memory isolation complexity,
* progression complexity.

## Decision

MVP supports one active pet per user.

Data model should not permanently prevent multiple pets later.

## Reason

Focus development on core relationship.

## Related Documents

* `06-technical-architecture.md`
* `07-data-model.md`
* `08-api-design.md`

---

# 40. DEC-037 — One Species for MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Multiple species multiply art and behavioral content requirements.

## Decision

MVP starts with one species / one base lifecycle.

## Reason

The experiment is about:

```text
simulation
relationship
memory
personality
growth
```

not content quantity.

## Consequences

Species field may still exist in data model for future expansion.

## Related Documents

* `01-mini-gdd.md`
* `07-data-model.md`

---

# 41. DEC-038 — No Economy in MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Currency, shops, and item systems could add game depth but do not validate the core fantasy.

## Decision

MVP has no:

```text
coins
gems
shop
lootboxes
paid food
```

## Reason

Avoid distracting from relationship and simulation.

## Related Documents

* `01-mini-gdd.md`

---

# 42. DEC-039 — No Inventory in MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Food varieties, toys, and gifts introduce more content systems.

## Decision

Feed and Play remain generic core interactions.

## Reason

Reduce scope.

## Consequences

Inventory can be layered later if core care loop works.

## Related Documents

* `01-mini-gdd.md`

---

# 43. DEC-040 — No Complex Skill Tree in MVP

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Explorer / Keeper / Creator paths are promising but unvalidated.

## Decision

MVP only implements:

```text
Search Lv.1
```

No XP, level-up, specialization, or branching tree.

## Reason

First prove:

```text
Growth
→
Capability
```

## Related Documents

* `05-growth-and-skills.md`

---

# 44. DEC-041 — Specialization Should Eventually Emerge From History

**Date:** 2026-09-25
**Status:** PROPOSED

## Context

Future skill categories may include:

```text
Explorer
Keeper
Creator
```

## Decision

If specialization is implemented, prefer it emerging from:

```text
skill usage
personality
interaction patterns
```

rather than rigid class selection.

## Reason

Supports the core fantasy that interaction creates identity.

## Consequences

Requires more playtesting before acceptance.

## Related Documents

* `05-growth-and-skills.md`

---

# 45. DEC-042 — Use Human-Readable Growth Progress, Not Exact Formula

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Showing:

```text
Bond 39/40
Interactions 44/45
```

may encourage grinding.

## Decision

Player-facing growth UI should initially use qualitative progress.

Examples:

```text
Growing steadily
Almost ready to grow
```

## Reason

Relationship should feel organic.

## Consequences

Debug view still exposes exact numbers.

## Related Documents

* `05-growth-and-skills.md`
* `09-playtesting.md`

---

# 46. DEC-043 — Raw Personality Values Are Debug-Only

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Numeric values like:

```text
Playful = 0.723
```

encourage optimization and expose implementation details.

## Decision

Player sees:

* traits,
* simple qualitative indicators,

not raw values.

## Reason

Pet personality should feel descriptive rather than min-maxable.

## Related Documents

* `02-game-systems.md`
* `07-data-model.md`
* `08-api-design.md`

---

# 47. DEC-044 — Mood Is Derived State

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Mood depends on:

```text
needs
recent events
personality
activity
```

Storing it independently risks inconsistency.

## Decision

Mood is primarily calculated from authoritative state.

## Reason

Avoid:

```text
Mood = Happy
Energy = 0
```

because stale stored mood was not updated.

## Consequences

Mood may be cached later, but rules remain authoritative.

## Related Documents

* `02-game-systems.md`
* `07-data-model.md`

---

# 48. DEC-045 — Tool Results Must Be Grounded

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Search introduces external facts.

LLM may invent missing results.

## Decision

Factual tool response must be based on real normalized tool output.

If tool fails:

AI must communicate failure.

## Reason

Utility requires trust.

## Related Documents

* `03-ai-behavior.md`
* `06-technical-architecture.md`

---

# 49. DEC-046 — Read-Only Tool First

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Write tools like Calendar create external side effects.

## Decision

MVP begins with read-only Search.

## Reason

Reduces need for:

```text
permissions
confirmation
rollback
external side-effect handling
```

## Related Documents

* `05-growth-and-skills.md`
* `06-technical-architecture.md`

---

# 50. DEC-047 — Reminder and Memory Are Separate Concepts

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Pet may remember an upcoming event.

That does not mean it can actively notify the user later.

## Decision

```text
Memory
=
stored information
```

```text
Reminder
=
scheduled future action
```

These remain separate.

## Reason

Avoid capability hallucination.

## Consequences

Without Reminder skill, pet must not promise guaranteed future notifications.

## Related Documents

* `03-ai-behavior.md`
* `04-memory-system.md`

---

# 51. DEC-048 — Simple Actions May Use Templates Instead of LLM

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Calling AI for every Feed reaction is unnecessary.

## Decision

Simple reactions may use:

```text
templates
rules
small models
```

LLM is used where flexible language provides meaningful value.

## Reason

Improves:

* latency,
* cost,
* reliability.

## Related Documents

* `03-ai-behavior.md`

---

# 52. DEC-049 — AI Provider Must Be Abstracted

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

AI providers and models may change.

## Decision

Backend AI layer should expose provider-independent interfaces.

Conceptually:

```text
interpret()
respond()
extractMemory()
```

## Reason

Pet identity should not be tied to one vendor/model.

## Consequences

Changing model must not reset state, personality, or memory.

## Related Documents

* `06-technical-architecture.md`

---

# 53. DEC-050 — Search Provider Must Be Abstracted

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Search implementation may change over time.

## Decision

Search provider lives behind Tool Engine abstraction.

Skill System knows:

```text
SEARCH
```

not provider identity.

## Reason

Keeps capability model stable.

## Related Documents

* `06-technical-architecture.md`

---

# 54. DEC-051 — API Uses Intent, Not State Mutation

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Client should not submit desired stat values.

## Decision

Client submits:

```text
FEED
PLAY
SLEEP
```

Backend calculates actual effect.

## Reason

Maintains authoritative game rules.

## Related Documents

* `08-api-design.md`

---

# 55. DEC-052 — REST/JSON First

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

MVP does not require realtime multiplayer or continuous server push.

## Decision

Initial API uses:

```text
HTTPS
REST-style routes
JSON
```

## Alternatives Considered

### WebSocket-first

Deferred.

### GraphQL

No strong need identified.

## Consequences

Streaming chat can be added later if beneficial.

## Related Documents

* `08-api-design.md`

---

# 56. DEC-053 — Do Not Hold DB Transactions During LLM Calls

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

LLM/Search calls may take seconds.

Holding DB transaction across external network calls creates contention.

## Decision

Use short database transactions.

Revalidate state before mutation after AI interpretation.

## Reason

Improves concurrency and reliability.

## Related Documents

* `06-technical-architecture.md`

---

# 57. DEC-054 — Debug Time Travel Is Required

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Real progression spans days.

Development cannot wait two weeks to test Adult stage.

## Decision

Development build includes safe time acceleration/debug tooling.

Examples:

```text
+1 hour
+1 day
+7 days
```

## Reason

Essential for simulation and growth iteration.

## Consequences

Debug controls must be unavailable in production.

## Related Documents

* `06-technical-architecture.md`
* `08-api-design.md`
* `09-playtesting.md`

---

# 58. DEC-055 — Playtesting Is Part of Design, Not Final QA

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Many game mechanics cannot be validated from code correctness alone.

## Decision

Workflow:

```text
Design
↓
Prototype
↓
Playtest
↓
Observe
↓
Revise
```

before adding large amounts of content.

## Reason

A working feature may still produce a bad game experience.

## Related Documents

* `09-playtesting.md`

---

# 59. DEC-056 — Qualitative Signals Matter Early

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Early prototype sample sizes will be small.

## Decision

Early validation prioritizes qualitative evidence such as:

> "Dia jadi manja."

> "Dia ingat."

> "Punyaku beda."

alongside basic metrics.

## Reason

These statements directly indicate whether core character illusion works.

## Related Documents

* `09-playtesting.md`

---

# 60. DEC-057 — Avoid Optimizing for Maximum Engagement

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Metrics such as message count or session duration can encourage unhealthy or annoying design.

## Decision

Do not optimize blindly for:

```text
maximum messages
maximum session length
maximum notification opens
```

Primary focus remains:

```text
relationship quality
return curiosity
meaningful interaction
```

## Reason

More usage is not automatically better experience.

## Related Documents

* `00-vision.md`
* `09-playtesting.md`

---

# 61. DEC-058 — Prototype Game Simulation Before AI

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

AI can hide weaknesses in underlying game systems.

## Decision

Implementation starts with simulation:

```text
Pet State
Time
Feed
Play
Sleep
Bond
Mood
```

before integrating AI.

## Reason

We need to verify there is a game underneath the chatbot layer.

## Consequences

Prototype 0.1 requires no LLM.

## Related Documents

* `02-game-systems.md`
* `06-technical-architecture.md`
* `09-playtesting.md`

---

# 62. DEC-059 — Prototype Sequence

**Date:** 2026-09-25
**Status:** ACCEPTED

## Decision

Prototype order:

```text
0.1
Simulation

0.2
AI + Personality

0.3
Memory + Offline Continuity

0.4
Growth + Search
```

## Reason

Each stage validates one additional layer without masking problems from previous stages.

## Related Documents

* `01-mini-gdd.md`
* `09-playtesting.md`

---

# 63. DEC-060 — MVP Is About Proving the Relationship Loop

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Many future features are possible.

## Decision

MVP exists to test:

> Can simulation + personality + memory + AI create a pet that feels alive and develops a relationship with the player?

Not:

> How many AI tools can we ship?

## Consequences

Any feature that does not help answer the core question is lower priority.

## Related Documents

* all design documents.

---

# 63.1. DEC-061 — Prototype 0.2 Uses an OpenAI-Compatible Provider

**Date:** 2026-09-25
**Status:** ACCEPTED

## Context

Prototype 0.2 needs one real AI provider (scope §106). DEC-049 requires provider abstraction. Development uses 9router, which exposes an OpenAI-compatible API in front of multiple models.

## Decision

The single Prototype 0.2 provider adapter targets the **OpenAI-compatible Chat Completions API** (`POST {baseURL}/chat/completions`).

Endpoint and model are configuration, not code:

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=<9router or any OpenAI-compatible endpoint>
AI_MODEL=<model id as exposed by the endpoint>
AI_API_KEY=<key for that endpoint>
```

Development default endpoint: 9router.

Structured output:

* Do not rely on provider-specific features (`json_schema` strict mode, tool/function calling), because support varies across models routed through 9router.
* Request JSON via prompt; send `response_format: { type: "json_object" }` only when enabled by config (`AI_JSON_MODE=true`).
* Always parse + validate with Zod; invalid output follows existing fallback rules.

Usage metadata (`usage.prompt_tokens`, `usage.completion_tokens`) is read when present and treated as optional.

## Reason

* one adapter works with 9router and any other OpenAI-compatible endpoint,
* switching model = changing `AI_MODEL`, no code change,
* no vendor lock-in (DEC-049).

## Alternatives Considered

### Native vendor SDK (single vendor)

Rejected for 0.2: ties adapter to one vendor and bypasses 9router.

### Multi-provider adapters / routing in app

Rejected: scope §106 forbids provider marketplaces and fallback chains; routing is 9router's job, not the app's.

## Consequences

* Model choice is still evaluated with scope §107 criteria (structured output reliability, latency, Indonesian quality, instruction following, cost) and recorded in Prototype 0.2 findings.
* Behavior may differ per routed model; live evaluation (Phase 5/8) must record which `AI_MODEL` was used.
* Resolves the Prototype 0.2 part of OPEN-005. Long-term model/routing strategy stays open.

## Related Documents

* `06-technical-architecture.md`
* `19-prototype-02-scope.md`
* `20-prototype-02-implementation-plan.md`

---

# 64. Open Decisions

The following decisions are intentionally not final yet.

---

## OPEN-001 — Final Technology Stack

Need to decide:

```text
frontend framework
backend runtime/framework
database
ORM/query layer
deployment
```

Decision should happen before implementation begins.

---

## OPEN-002 — Initial Platform

Options:

```text
Web
Mobile
Cross-platform
```

Prototype needs may differ from final product.

---

## OPEN-003 — Hunger Player-Facing Label

Internal semantic:

```text
100 = full
0 = hungry
```

Potential labels:

```text
Fullness
Food
Hunger
Satiety
```

Needs UI/playtesting.

---

## OPEN-004 — Exact Growth Timing

Initial:

```text
Baby → Child:
3+ days

Child → Adult:
14+ days total
```

Must be validated through accelerated and real-time testing.

---

## OPEN-005 — Exact AI Provider / Model Strategy

Need to determine:

* one model or routing,
* structured output support,
* cost,
* latency,
* provider abstraction implementation.

**Partially resolved for Prototype 0.2 by DEC-061** (OpenAI-compatible adapter via 9router). Long-term model/routing strategy remains open.

---

## OPEN-006 — Search Provider

Need provider evaluation for:

```text
quality
freshness
citations
cost
latency
API reliability
```

---

## OPEN-007 — Conversation Session Model

Need to decide whether Conversation is:

```text
per app session
per day
long-lived thread
```

Memory architecture does not depend on one choice.

---

## OPEN-008 — Player-Facing Memory Editing UX

Options:

```text
Memory screen
Conversation-based correction
Both
```

For MVP, Forget support is more important than polished editing.

---

## OPEN-009 — Exact Personality Visibility

Possible:

```text
top traits only
star/bar indicators
descriptive labels
```

Raw values remain hidden.

---

## OPEN-010 — Search Result UI

Possible:

```text
pet summary only
summary + result cards
summary + sources
```

Need product/UI decision.

---

# 65. Rejected Direction Summary

Currently rejected or deferred:

```text
LLM as source of truth
continuous AI agent per pet
permanent death
passive Bond decay
guilt-driven retention
full event sourcing
microservices for MVP
multiple pets
multiple species
inventory
economy
complex skill tree
write-capability tools in MVP
exact growth formula in player UI
raw personality numbers
```

These may be reconsidered only with clear evidence.

---

# 66. How to Add a New Decision

When a meaningful decision is made:

1. Assign next `DEC-XXX`.
2. Add date.
3. Add status.
4. Describe context.
5. State decision clearly.
6. Record reasoning.
7. Record significant alternatives.
8. Record consequences.
9. Link relevant docs.

Do not silently rewrite historical decisions.

If decision changes:

```text
old decision:
SUPERSEDED
```

Then create a new decision entry.

---

# 67. Example Superseded Decision

Example future:

```text
DEC-061
Hunger decay is -2/hour
```

If testing proves this wrong:

Do not erase history.

Mark:

```text
DEC-061
SUPERSEDED by DEC-074
```

Then:

```text
DEC-074
Hunger decay changed to -1.5/hour.
```

This preserves why balancing evolved.

For small numeric balancing changes, dedicated experiment/playtest log may be more appropriate than Decision Log.

Use judgment.

---

# 68. What Belongs Here

Good candidates:

```text
architecture choices
major product constraints
system ownership
game philosophy
data ownership
AI boundaries
progression model
```

---

# 69. What Does Not Belong Here

Usually avoid logging:

```text
button moved 8px
typo fixed
minor dialogue wording
one test failed
temporary implementation workaround
every balancing tweak
```

Use:

* issue tracker,
* commits,
* playtest logs,

instead.

---

# 70. Current Architecture Contract

The decisions currently establish:

```text
Game Engine
=
Reality

Memory
=
Selected History

Personality
=
Persistent Behavioral Tendencies

AI
=
Actor + Interpreter

Skills
=
Unlocked Capabilities

Tools
=
External Execution

Backend
=
Authority

Client
=
Presentation + Intent
```

This contract should not be broken casually.

---

# 71. Current Product Contract

The product currently promises:

```text
Pet lives while user is away.

Pet develops through interaction.

Pet remembers selectively.

Pet grows over time.

Pet learns capabilities.

Pet remains the same character through growth.

Player is not punished aggressively for absence.
```

---

# 72. Current MVP Contract

MVP currently includes:

```text
Egg
Hatch
Naming

Baby
Child
Adult

Hunger
Energy
Happiness
Bond

Feed
Play
Talk
Sleep

Mood
Personality

Memory
Offline Simulation

Growth

Search Lv.1
```

Everything beyond this requires explicit justification before entering MVP scope.

---

# 73. North Star

A decision is good when it helps preserve the central fantasy:

> **The player is raising a persistent AI companion whose personality, memories, relationship, and abilities develop through the life they share together.**

When architectural elegance, AI capability, feature count, and this fantasy conflict:

the fantasy should usually win.
