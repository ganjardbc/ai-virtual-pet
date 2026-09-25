# Data Model

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`, `04-memory-system.md`, `05-growth-and-skills.md`, `06-technical-architecture.md`

---

# 1. Purpose

Dokumen ini mendefinisikan struktur data utama untuk AI Virtual Pet.

Tujuannya adalah menjawab:

* data apa saja yang perlu disimpan,
* entity apa saja yang menjadi source of truth,
* bagaimana hubungan antar-entity,
* data mana yang persistent,
* data mana yang derived,
* data mana yang immutable,
* dan bagaimana model mendukung growth, memory, AI, serta skill.

Dokumen ini masih bersifat logical data model.

Detail:

* SQL final,
* ORM,
* database engine,
* migration syntax,
* index implementation

akan ditentukan pada tahap implementasi.

---

# 2. Data Model Principles

Prinsip utama:

```text
Current State
≠
History
≠
Memory
≠
Conversation
```

Masing-masing mempunyai tujuan berbeda.

---

# 3. Main Entities

MVP membutuhkan entity utama:

```text
User

Pet
PetState
PetPersonality
PetGrowth

PetSkill

Event

Memory

Conversation
Message
```

Potential future entities:

```text
Reminder
CalendarConnection
Inventory
Item
PetAppearance
Notification
```

Tidak diperlukan untuk MVP 1.

---

# 4. High-Level Relationship

```text
User
 │
 └── Pet
      │
      ├── PetState
      │
      ├── PetPersonality
      │
      ├── PetGrowth
      │
      ├── PetSkills
      │
      ├── Events
      │
      ├── Memories
      │
      └── Conversations
             │
             └── Messages
```

Untuk MVP:

```text
User
1
:
1 active Pet
```

Schema sebaiknya tetap memungkinkan multiple pets di masa depan.

---

# 5. Entity Ownership

Semua pet-related entity harus dapat ditelusuri ke:

```text
userId
petId
```

Authorization utama:

```text
User owns Pet.
```

Entity child cukup menggunakan `petId` jika ownership bisa diturunkan melalui Pet.

---

# 6. User

User merepresentasikan account/player.

Conceptual model:

```json
{
  "id": "user_123",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Untuk MVP, user model tidak perlu menyimpan banyak game-specific data.

---

# 7. User Responsibilities

User entity digunakan untuk:

```text
authentication identity
pet ownership
account-level preferences
```

Game state tidak disimpan langsung pada User.

---

# 8. Pet

Pet merepresentasikan persistent identity karakter.

Conceptual model:

```json
{
  "id": "pet_123",
  "userId": "user_123",
  "name": "Momo",
  "species": "DEFAULT",
  "stage": "CHILD",
  "createdAt": "...",
  "hatchedAt": "...",
  "updatedAt": "...",
  "version": 12
}
```

Pet adalah root entity utama game.

---

# 9. Pet Identity Fields

Core fields:

```text
id
userId
name
species
stage
createdAt
hatchedAt
updatedAt
version
```

Future:

```text
appearanceVariant
voiceProfile
origin
```

---

# 10. Species

MVP hanya membutuhkan satu species.

Namun field tetap disiapkan:

```text
species = DEFAULT
```

Tujuannya menghindari migration besar jika multiple species ditambahkan nanti.

---

# 11. Stage

Allowed values:

```text
EGG
BABY
CHILD
ADULT
```

Stage adalah source of truth.

AI tidak boleh menentukan stage.

---

# 12. Pet Version

Field:

```text
version
```

digunakan untuk optimistic concurrency.

Example:

```text
version = 12
```

Mutation berikutnya:

```text
WHERE version = 12
```

Lalu:

```text
version = 13
```

Ini membantu mencegah stale writes.

---

# 13. PetState

PetState menyimpan current dynamic state.

Conceptual:

```json
{
  "petId": "pet_123",

  "hunger": 72,
  "energy": 64,
  "happiness": 81,
  "bond": 55,

  "currentActivity": "IDLE",

  "sleepStartedAt": null,

  "lastInteractionAt": "...",
  "lastSimulatedAt": "...",

  "updatedAt": "..."
}
```

---

# 14. PetState Source of Truth

PetState authoritative untuk:

```text
Hunger
Energy
Happiness
Bond
Current Activity
Simulation timestamps
```

Mood bukan wajib source of truth.

Mood dapat dihitung dari state.

---

# 15. Why PetState Separate from Pet

Identity dan dynamic simulation state mempunyai lifecycle berbeda.

`Pet`:

```text
identity
stage
ownership
```

`PetState`:

```text
needs
relationship value
activity
simulation timing
```

Separation membuat model lebih jelas.

---

# 16. Hunger

Type:

```text
decimal / float
```

Range:

```text
0 - 100
```

Walaupun UI mungkin menampilkan integer, internal model boleh menggunakan decimal.

---

# 17. Energy

Range:

```text
0 - 100
```

Source of truth untuk stamina.

---

# 18. Happiness

Range:

```text
0 - 100
```

Short-term emotional state.

---

# 19. Bond

Range:

```text
0 - 100
```

Long-term relationship strength.

Bond berada di PetState untuk MVP.

Alternative future:

```text
PetRelationship
```

Jika relationship model menjadi lebih kompleks.

Belum diperlukan.

---

# 20. Current Activity

Enum awal:

```text
IDLE
SLEEPING
PLAYING_ALONE
RESTING
LOOKING_AROUND
THINKING
EATING_SNACK
WAITING
```

Activity adalah current resolved activity.

---

# 21. Sleep Started At

Field:

```text
sleepStartedAt
```

nullable.

Digunakan untuk menghitung Sleep recovery.

Jika:

```text
currentActivity != SLEEPING
```

nilai sebaiknya null.

---

# 22. Last Simulated At

Field sangat penting:

```text
lastSimulatedAt
```

Simulation Engine menggunakan:

```text
now - lastSimulatedAt
```

untuk menghitung elapsed time.

Setelah simulation:

```text
lastSimulatedAt = now
```

---

# 23. Last Interaction At

Menunjukkan interaction meaningful terbaru.

Berguna untuk:

```text
offline duration
boredom
return behavior
session reasoning
```

Tidak selalu sama dengan `updatedAt`.

---

# 24. Derived Mood

Mood sebaiknya awalnya dihitung:

```text
calculateMood(PetState, Personality, Events)
```

daripada disimpan sebagai authoritative field.

Possible cache:

```text
currentMood
```

boleh ditambahkan kemudian untuk performance.

Tetapi source of truth tetap rules.

---

# 25. PetPersonality

Conceptual model:

```json
{
  "petId": "pet_123",

  "playful": 0.72,
  "curious": 0.61,
  "shy": 0.24,
  "independent": 0.31,
  "clingy": 0.55,

  "updatedAt": "..."
}
```

---

# 26. Personality Range

Setiap trait:

```text
0.05 - 0.95
```

Initial seed:

```text
0.35 - 0.55
```

Values persistent across growth.

---

# 27. Personality Is State, Not Memory

Important separation:

```text
Memory:
"Pet spent time alone."
```

Game Engine may derive:

```text
Independent +0.003
```

Personality table stores resulting tendency.

Memory does not replace personality state.

---

# 28. Personality Daily Tracking

Game Systems menetapkan daily change cap.

Untuk implementasi, kita mungkin membutuhkan tracking tambahan.

Option A:

```text
calculate from recent events
```

Option B:

store:

```text
dailyPlayfulDelta
dailyCuriousDelta
...
personalityWindowStartedAt
```

Untuk MVP, prefer menghitung dari recent personality mutation events jika feasible.

Jangan menambah field sebelum diperlukan.

---

# 29. Personality Mutation Events

Optional event example:

```json
{
  "type": "PERSONALITY_CHANGED",
  "data": {
    "trait": "PLAYFUL",
    "delta": 0.004,
    "source": "PLAY"
  }
}
```

Apakah event ini perlu persistent untuk setiap tiny delta harus diputuskan saat implementation.

Bisa terlalu noisy.

Alternative:

record delta di action event.

---

# 30. PetGrowth

Growth data dipisahkan agar progression mudah dibaca.

Conceptual:

```json
{
  "petId": "pet_123",

  "meaningfulInteractionScore": 31.5,

  "growthEligible": false,
  "growthReadyAt": null,

  "stageEnteredAt": "...",
  "lastGrowthAt": "...",

  "updatedAt": "..."
}
```

---

# 31. Why Interaction Score Instead of Count

Karena diminishing return dapat menghasilkan:

```text
1.0
0.75
0.5
0.25
```

Maka istilah internal yang lebih tepat:

```text
meaningfulInteractionScore
```

daripada integer count.

---

# 32. Growth Eligible

Field:

```text
growthEligible
```

menunjukkan requirements sudah terpenuhi.

Stage belum otomatis berubah.

---

# 33. Growth Ready At

Saat pet pertama kali eligible:

```text
growthReadyAt
```

berguna untuk:

* debugging,
* analytics,
* scheduling growth presentation.

---

# 34. Stage Entered At

Setiap growth:

```text
stageEnteredAt = transition time
```

Digunakan untuk:

* age-in-stage,
* growth cooldown,
* analytics.

---

# 35. Growth History

Walaupun Pet hanya menyimpan current stage, historical transitions disimpan di Event Log.

Example:

```text
PET_GREW BABY → CHILD
PET_GREW CHILD → ADULT
```

Tidak perlu duplicate stage-history table untuk MVP.

---

# 36. PetSkill

One row per skill owned by pet.

Conceptual:

```json
{
  "id": "skill_123",
  "petId": "pet_123",

  "type": "SEARCH",
  "level": 1,

  "xp": 0,
  "usageCount": 8,

  "unlockedAt": "...",
  "firstUsedAt": "...",
  "lastUsedAt": "...",

  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 37. Skill Unique Constraint

Must have:

```text
UNIQUE(petId, type)
```

Mencegah:

```text
SEARCH Lv.1
SEARCH Lv.1
SEARCH Lv.1
```

---

# 38. MVP Skill Type

Initial:

```text
SEARCH
```

Future:

```text
REMINDER
RESEARCH
CALENDAR
NOTES
PLANNING
WRITING
```

Enum expansion expected.

---

# 39. Skill Level

MVP:

```text
SEARCH level = 1
```

Tetap disimpan agar data model tidak perlu dirombak saat leveling hadir.

---

# 40. Skill XP

Field boleh ada dengan:

```text
0
```

tetapi kalau ingin model MVP lebih minimal, XP dapat ditunda.

Recommended:

include field only when leveling implementation starts.

Logical model tetap mengenali konsep XP.

---

# 41. Skill Usage Count

`usageCount` berguna untuk:

* analytics,
* future leveling,
* specialization.

Increment hanya ketika skill benar-benar dieksekusi.

---

# 42. Event

Event Log menyimpan meaningful historical facts.

Conceptual:

```json
{
  "id": "event_123",
  "petId": "pet_123",

  "type": "PET_PLAYED",

  "occurredAt": "...",

  "interactionId": "interaction_123",

  "data": {},

  "createdAt": "..."
}
```

---

# 43. Event Immutability

Event sebaiknya append-only.

Setelah dibuat:

```text
do not edit
```

kecuali exceptional migration/correction.

History harus stabil.

---

# 44. Core Event Fields

```text
id
petId
type
occurredAt
interactionId
data
createdAt
```

Optional:

```text
source
schemaVersion
```

---

# 45. Event Type

Initial examples:

```text
PET_CREATED
PET_HATCHED
PET_NAMED

PET_FED
PET_PLAYED

PET_WENT_TO_SLEEP
PET_WOKE_UP

USER_TALKED
MEANINGFUL_CONVERSATION

PLAYER_RETURNED

PET_ACTIVITY_STARTED
PET_ACTIVITY_COMPLETED

GROWTH_READY
PET_GREW

SKILL_UNLOCKED
SKILL_USED
```

---

# 46. Event Data

Event-specific metadata disimpan pada:

```text
data
```

Potential JSON column.

Example:

```json
{
  "before": {
    "energy": 60
  },
  "after": {
    "energy": 50
  },
  "bondDelta": 1
}
```

Avoid storing entire pet snapshot on every event unless debugging requires it.

---

# 47. Event Schema Version

Future-proof field:

```text
schemaVersion
```

Example:

```text
1
```

Berguna jika event payload berubah.

Optional for initial prototype.

---

# 48. Interaction ID

`interactionId` links related operations.

Example one chat interaction:

```text
USER_TALKED
PET_PLAYED
SKILL_USED
```

may all belong to:

```text
interaction_abc
```

Useful for traceability.

---

# 49. Request ID vs Interaction ID

Technical:

```text
requestId
```

one HTTP request.

Product/domain:

```text
interactionId
```

one logical player-pet interaction.

Usually related, but not necessarily identical.

---

# 50. Memory

Conceptual:

```json
{
  "id": "memory_123",
  "petId": "pet_123",

  "type": "USER_FACT",

  "content": "User works as a frontend developer",

  "importance": 0.8,
  "confidence": 0.95,

  "status": "ACTIVE",

  "eventAt": null,
  "expiresAt": null,

  "reinforcementCount": 1,

  "createdAt": "...",
  "updatedAt": "...",
  "lastUsedAt": "..."
}
```

---

# 51. Memory Type

Allowed initial:

```text
USER_FACT
PREFERENCE
IMPORTANT_EVENT
PROMISE
RELATIONSHIP_EVENT
PET_EXPERIENCE
ROUTINE
```

MVP prototype dapat mulai dengan subset.

---

# 52. Memory Status

```text
ACTIVE
SUPERSEDED
ARCHIVED
FORGOTTEN
```

Only `ACTIVE` memory participates normally in retrieval.

---

# 53. Memory Content

`content` should store normalized statement.

Good:

```text
User prefers Vue over React.
```

Not raw message:

```text
"aku dari dulu lebih suka vue sih dibanding react wkwk"
```

Raw source remains in conversation if retained.

---

# 54. Importance

Range:

```text
0.0 - 1.0
```

Used for:

* retrieval,
* retention,
* consolidation.

---

# 55. Confidence

Range:

```text
0.0 - 1.0
```

Represents factual confidence.

Do not confuse with importance.

---

# 56. Event At

For temporal memories:

```text
eventAt
```

Example:

```text
interview:
2026-09-26 09:00
```

Nullable for timeless facts.

---

# 57. Expires At

Used for temporary relevance.

Example:

```text
PROMISE
IMPORTANT_EVENT
```

Expired does not always mean delete.

May trigger archive or transformation.

---

# 58. Reinforcement Count

Tracks repeated supporting evidence.

Example:

```text
User likes cats.
```

Repeated confirmation:

```text
reinforcementCount += 1
```

Useful for confidence/retention.

---

# 59. Last Used At

Updated when memory is actually included in useful AI context.

Can help:

* retention,
* diagnostics,
* overuse detection.

---

# 60. Memory Source

Need provenance.

Two options:

### Link table

```text
MemorySource
```

### JSON/array field

```text
sourceEventIds
sourceMessageIds
```

Relational link table is cleaner if many-to-many matters.

MVP can use simpler source fields first.

---

# 61. MemorySource

Optional normalized model:

```json
{
  "memoryId": "memory_123",
  "sourceType": "MESSAGE",
  "sourceId": "message_123"
}
```

or:

```text
EVENT
```

This allows multiple evidence sources.

---

# 62. Memory Embedding

If semantic search used:

```text
embedding
```

can live:

* in same table via vector column,
* or separate storage.

Logical model:

```text
Memory
→ optional embedding
```

Embedding is derived data.

It can be regenerated.

---

# 63. Embedding Is Not Source of Truth

If embeddings are deleted:

memory content remains valid.

Embedding can be recomputed.

This is important for architecture.

---

# 64. Conversation

Conversation groups messages into chat sessions or threads.

Conceptual:

```json
{
  "id": "conversation_123",
  "petId": "pet_123",

  "startedAt": "...",
  "lastMessageAt": "...",

  "summary": null,

  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# 65. Conversation Lifetime

Options:

```text
one conversation forever
```

or:

```text
session-based conversations
```

For data model, multiple conversations are more flexible.

MVP may create conversation per session/day depending UX.

---

# 66. Conversation Summary

Optional:

```text
summary
```

Can be generated when old messages leave active context.

Useful for:

* context compression,
* continuity.

Summary is not equivalent to long-term memory.

---

# 67. Message

Conceptual:

```json
{
  "id": "message_123",
  "conversationId": "conversation_123",

  "role": "USER",

  "content": "Besok aku interview.",

  "interactionId": "interaction_123",

  "createdAt": "..."
}
```

Roles:

```text
USER
PET
SYSTEM
TOOL
```

Potentially avoid storing SYSTEM prompt text permanently.

---

# 68. Pet Message Metadata

Pet messages may contain optional metadata:

```json
{
  "emotion": "CURIOUS",
  "animation": "THINK",
  "model": "..."
}
```

Model metadata useful for debugging.

Should not become core game state.

---

# 69. AI Decision Metadata

Structured AI interpretation should not necessarily be embedded directly inside Message.

Possible separate entity:

```text
AIInteraction
```

or technical logs.

For MVP, could store selected metadata in `Message.metadata`.

Avoid over-modeling initially.

---

# 70. Interaction Entity

Because many systems use `interactionId`, a dedicated `Interaction` entity may eventually be useful.

Conceptual:

```json
{
  "id": "interaction_123",
  "petId": "pet_123",
  "type": "CHAT",
  "startedAt": "...",
  "completedAt": "...",
  "status": "COMPLETED"
}
```

Question:

Is it needed for MVP?

Not necessarily.

A generated UUID used across events/messages/logs may be enough initially.

---

# 71. Session

AI behavior mentions session-level rules.

Potential logical session:

```text
PetSession
```

Fields:

```text
id
petId
startedAt
lastInteractionAt
proactivePromptUsed
```

Could be kept server-side transiently.

For MVP, session can also be derived from inactivity window.

No table required initially.

---

# 72. Data Classification

Important distinction:

## Authoritative

```text
Pet.stage
PetState
PetPersonality
PetGrowth
PetSkill
Memory content/status
```

## Historical

```text
Event
Message
```

## Derived

```text
Mood
dominant personality
growth progress label
memory embedding
conversation summary
```

---

# 73. Derived Data Strategy

Derived values should be recomputable where possible.

Example:

```text
Mood
```

can be recalculated.

Avoid duplicate source-of-truth fields.

---

# 74. Pet Snapshot

API will often need combined representation.

Conceptual response model:

```json
{
  "pet": {},
  "state": {},
  "personality": {},
  "growth": {},
  "skills": [],
  "derived": {
    "mood": "CURIOUS",
    "dominantTraits": [
      "PLAYFUL",
      "CURIOUS"
    ]
  }
}
```

This is API/view model.

Not necessarily one database table.

---

# 75. Database Normalization Philosophy

Normalize core state.

Use flexible JSON where event-specific structure varies.

Suggested:

```text
relational columns:
important searchable fields

JSON:
event payload
optional metadata
```

Avoid one massive JSON pet document as sole storage model.

---

# 76. Why Not One Pet JSON Blob

A single blob such as:

```json
{
  "state": {},
  "personality": {},
  "skills": [],
  "memories": [],
  "events": []
}
```

looks easy initially but becomes problematic for:

* concurrency,
* querying,
* memory retrieval,
* event growth,
* indexing,
* partial mutation.

Separate entities are preferable.

---

# 77. Possible Relational Schema

Conceptually:

```text
users

pets
pet_states
pet_personalities
pet_growth

pet_skills

events

memories
memory_sources

conversations
messages
```

---

# 78. One-to-One Tables

```text
Pet
1:1 PetState

Pet
1:1 PetPersonality

Pet
1:1 PetGrowth
```

These may technically be merged into Pet table.

They remain conceptually separated for domain clarity.

Implementation decision can favor fewer tables if desired.

---

# 79. One-to-Many Tables

```text
Pet
1:N Skills

Pet
1:N Events

Pet
1:N Memories

Pet
1:N Conversations

Conversation
1:N Messages
```

---

# 80. Suggested Unique Constraints

```text
pets:
id PK

pet_states:
petId UNIQUE

pet_personalities:
petId UNIQUE

pet_growth:
petId UNIQUE

pet_skills:
UNIQUE(petId, type)

events:
id PK

memories:
id PK

messages:
id PK
```

---

# 81. Index Strategy

Likely indexes:

```text
pets(userId)

events(petId, occurredAt)
events(petId, type, occurredAt)

memories(petId, status)
memories(petId, type, status)
memories(petId, eventAt)

pet_skills(petId, type)

conversations(petId, lastMessageAt)

messages(conversationId, createdAt)
```

Vector index later:

```text
memories.embedding
```

---

# 82. Event Data Volume

Events will grow faster than current state.

Need bounded query patterns.

Do not load:

```text
all events ever
```

on every request.

Use:

```text
recent event query
```

Example:

```text
last 20
```

or time range.

---

# 83. Conversation Data Volume

Same principle:

Do not send all messages ever to AI.

Conversation table is archive/history.

Context Builder selects only:

```text
recent messages
summary
relevant memories
```

---

# 84. Memory Data Volume

Active memories should remain bounded.

Memory System handles:

```text
archive
consolidation
forgetting
```

Query normally filters:

```text
status = ACTIVE
```

---

# 85. Soft Delete vs Hard Delete

For game state/history:

soft deletion may be useful.

For explicit privacy/forget requests:

hard deletion may be required depending product policy.

Logical model should not make hard deletion impossible.

---

# 86. Forgotten Memory Semantics

If memory status becomes:

```text
FORGOTTEN
```

it must not be retrieved.

Eventually physical deletion may occur.

Implementation policy determined later.

---

# 87. Pet Deletion

Deleting pet should cascade or schedule deletion for:

```text
PetState
Personality
Growth
Skills
Events
Memories
Conversations
Messages
```

Need deliberate retention/privacy policy before production.

---

# 88. User Deletion

Deleting User should remove or detach all owned pet data according to product policy.

Foreign key relationships should make ownership clear.

---

# 89. Time Storage

All timestamps stored as:

```text
UTC
```

Examples:

```text
createdAt
updatedAt
occurredAt
eventAt
expiresAt
```

Client converts for display.

---

# 90. Date vs Timestamp

Important Event may sometimes only know date, not exact time.

Data model should distinguish:

```text
eventAt timestamp nullable
eventDate date nullable
```

or store precision metadata.

Avoid inventing midnight as if exact time were known.

---

# 91. Temporal Precision

Potential field:

```text
temporalPrecision
```

Values:

```text
DATE
DATETIME
UNKNOWN
```

Could be useful for memory.

Not necessary for earliest prototype, but worth noting.

---

# 92. Normalized User Facts

Memory content remains natural-language normalized statement.

We do not need a complex knowledge graph for MVP.

Avoid premature structure like:

```text
subject
predicate
object
ontology
```

unless retrieval needs prove it useful.

---

# 93. Tags

Memory may support lightweight tags:

```text
work
music
preference
frontend
```

Could aid retrieval.

But embeddings + category may already suffice.

Tags are optional.

---

# 94. Data Model for Mood

Recommended MVP:

No mood table.

Calculate:

```text
mood = calculateMood(...)
```

If we need historical mood analytics, create mood events or analytics separately.

---

# 95. Data Model for Autonomous Activity

Current activity stored in PetState.

Historical activities:

```text
PET_ACTIVITY_STARTED
PET_ACTIVITY_COMPLETED
```

in Event Log.

No separate Activity History table required initially.

---

# 96. Autonomous Activity Metadata

Event data can include:

```json
{
  "activity": "PLAYING_ALONE",
  "startedAt": "...",
  "endedAt": "...",
  "durationMinutes": 42
}
```

Useful for return narration.

---

# 97. Meaningful Interaction Tracking

PetGrowth stores aggregate:

```text
meaningfulInteractionScore
```

Events store history.

This allows fast eligibility evaluation without scanning all events.

---

# 98. Bond Daily Cap Tracking

Game System needs rolling 24-hour Bond gain.

Options:

### Query relevant recent events

or

### Aggregate state

Example:

```text
bondGainWindowStartedAt
bondGainInWindow
```

For MVP with small scale, recent event query may be sufficient.

Avoid adding duplicate mutable counters unless performance requires them.

---

# 99. Play Diminishing Tracking

Need:

```text
Play count in previous 2 hours
```

Can query recent `PET_PLAYED` events.

Same principle.

Event Log can support rule windows.

---

# 100. Why Events Matter Mechanically

Events are not only analytics.

Game Engine may use recent events for:

```text
diminishing returns
Bond cap
mood
personality signals
return context
```

Therefore event query performance matters.

---

# 101. Memory Retrieval Metadata

For retrieval efficiency, Memory should expose columns:

```text
type
status
importance
confidence
eventAt
expiresAt
lastUsedAt
```

Do not bury all of these in JSON.

They are queryable fields.

---

# 102. Search Skill Provider Data

Skill model should not store provider-specific credentials.

`PetSkill` knows:

```text
SEARCH unlocked
```

Tool infrastructure knows:

```text
which Search provider to use
```

Keep separation.

---

# 103. Tool Execution History

`SKILL_USED` Event may be enough for MVP.

Future dedicated tool execution table could store:

```text
request
status
latency
provider
cost
```

This is more operational than game data.

Likely belongs to technical observability.

---

# 104. AI Provider Metadata

Message or technical log may record:

```text
provider
model
latency
token usage
```

Do not put these into Pet identity/state.

They are implementation diagnostics.

---

# 105. Data Consistency Rules

Examples:

```text
If Pet.stage = EGG
hatchedAt may be null.

If Pet.stage != EGG
hatchedAt must be set.

If activity = SLEEPING
sleepStartedAt must be set.

If activity != SLEEPING
sleepStartedAt should be null.

Skill level >= 1.

Memory confidence between 0 and 1.

Personality values between 0.05 and 0.95.
```

Database constraints can enforce some.

---

# 106. Referential Integrity

Important foreign keys:

```text
Pet.userId → User.id

PetState.petId → Pet.id

PetPersonality.petId → Pet.id

PetGrowth.petId → Pet.id

PetSkill.petId → Pet.id

Event.petId → Pet.id

Memory.petId → Pet.id

Conversation.petId → Pet.id

Message.conversationId → Conversation.id
```

---

# 107. Transaction: Create Pet

Conceptually:

```text
create Pet
+
create PetState
+
create PetPersonality
+
create PetGrowth
+
insert PET_CREATED
```

One transaction.

---

# 108. Initial Pet State

Possible initial Egg:

```json
{
  "hunger": 100,
  "energy": 100,
  "happiness": 70,
  "bond": 10,
  "currentActivity": "IDLE"
}
```

Whether Egg actually uses all needs can be hidden.

Values still simplify lifecycle transition.

---

# 109. Initial Personality

Generate small seeded variation:

```text
playful:
0.35-0.55

curious:
0.35-0.55

shy:
0.35-0.55

independent:
0.35-0.55

clingy:
0.35-0.55
```

Store generated values immediately.

Do not regenerate later.

---

# 110. Random Seed

Optional:

```text
personalitySeed
```

Could allow reproducibility.

Not strictly required if generated values themselves are persisted.

Persisting actual values is enough.

---

# 111. Naming

Name stored on:

```text
Pet.name
```

Event:

```text
PET_NAMED
```

Memory:

```text
RELATIONSHIP_EVENT
"User named the pet Momo."
```

Name should not live only in memory.

---

# 112. Hatch

When hatch completes:

```text
Pet.stage = BABY
Pet.hatchedAt = now
PetGrowth.stageEnteredAt = now
```

Events:

```text
PET_HATCHED
```

Potential memory created.

---

# 113. Growth Transaction Example

Child → Adult:

```text
Pet.stage = ADULT

PetGrowth:
growthEligible = false
stageEnteredAt = now
lastGrowthAt = now

insert PET_GREW

insert PetSkill SEARCH

insert SKILL_UNLOCKED

create relationship/pet memory
```

All should form one logical transaction.

---

# 114. Search Usage

Successful Search:

```text
PetSkill.usageCount += 1
PetSkill.lastUsedAt = now

if first use:
firstUsedAt = now

insert SKILL_USED
```

Search query/result itself does not need to live in PetSkill.

May exist in Conversation/technical logs.

---

# 115. Memory From Search

Search results should not automatically become long-term pet memory.

Example:

User asks latest React news.

Do not permanently remember all article content.

Potential memory only if conversation produces something meaningful such as:

```text
User is interested in React Server Components.
```

and extraction rules approve it.

---

# 116. Conversation and Memory Separation Example

User:

```text
"I prefer Vue."
```

Message stores exact text.

Memory stores:

```text
User prefers Vue.
```

Conversation can later be deleted while memory remains if product policy allows.

Or both can be deleted together if user requests full deletion.

Architecture supports both.

---

# 117. Memory Correction Transaction

Existing:

```text
Memory A:
User prefers tea.
ACTIVE
```

New correction:

```text
User prefers coffee.
```

Process:

```text
Memory A → SUPERSEDED

create Memory B:
User prefers coffee.
ACTIVE
```

Prefer transaction.

---

# 118. Memory Forget Transaction

User asks to forget memory.

Process:

```text
Memory.status = FORGOTTEN
```

Then ensure:

```text
vector retrieval excludes it
context retrieval excludes it
```

Potential hard deletion later.

---

# 119. Conversation Summary Model

When conversation grows:

```text
summary
```

can represent compressed older context.

Example:

```text
User discussed work stress and a frontend bug.
```

This summary is context aid.

Do not automatically promote it to Long-Term Memory.

---

# 120. Snapshot Consistency

When API returns pet snapshot, data should reflect same logical version.

Avoid:

```text
Pet stage from before growth
Skill list from after growth
```

Read after transaction commit.

---

# 121. State Mutation Audit

For debugging important mutations, events should include enough data to explain state change.

Example Play:

```json
{
  "happinessDelta": 12,
  "energyDelta": -10,
  "hungerDelta": -4,
  "bondDelta": 1
}
```

This makes balancing traceable.

---

# 122. Balance Version

Future optional field on Event:

```text
balanceVersion
```

or Pet:

```text
balanceVersion
```

Useful if formulas change significantly.

Can be deferred until external testing.

---

# 123. AI Behavior Version

Likewise optional metadata:

```text
promptVersion
```

for technical logs/messages.

Helps evaluation.

Not game state.

---

# 124. Schema Evolution

Expect model changes during prototype.

Use migration strategy.

Do not manually mutate production tables without versioned migration once real users exist.

---

# 125. Data Model and Prototype

Prototype 0.1 does not need every table immediately.

Minimum:

```text
Pet
PetState
PetPersonality
PetGrowth
Event
```

Then add:

```text
Conversation
Message
Memory
PetSkill
```

as respective systems are implemented.

---

# 126. Minimal Simulation Schema

For no-AI prototype:

```text
pets
pet_states
pet_personalities
pet_growth
events
```

Enough to validate Game Systems.

---

# 127. AI Prototype Additions

Add:

```text
conversations
messages
```

Then:

```text
memories
```

Later:

```text
pet_skills
```

for Search.

---

# 128. Example Full Logical Pet

```json
{
  "pet": {
    "id": "pet_123",
    "name": "Momo",
    "species": "DEFAULT",
    "stage": "CHILD",
    "hatchedAt": "..."
  },

  "state": {
    "hunger": 72,
    "energy": 64,
    "happiness": 81,
    "bond": 55,
    "currentActivity": "IDLE",
    "lastSimulatedAt": "..."
  },

  "personality": {
    "playful": 0.72,
    "curious": 0.61,
    "shy": 0.24,
    "independent": 0.31,
    "clingy": 0.55
  },

  "growth": {
    "meaningfulInteractionScore": 31.5,
    "growthEligible": false,
    "stageEnteredAt": "..."
  },

  "skills": []
}
```

---

# 129. Example Adult Pet

```json
{
  "pet": {
    "name": "Momo",
    "stage": "ADULT"
  },

  "skills": [
    {
      "type": "SEARCH",
      "level": 1,
      "usageCount": 8
    }
  ]
}
```

Same personality and memories remain.

---

# 130. Data Model Anti-Patterns

Avoid:

```text
one giant pet JSON blob
```

Avoid:

```text
using chat history as memory
```

Avoid:

```text
storing mood as independent truth
while stats say something else
```

Avoid:

```text
AI writing directly into game tables
```

Avoid:

```text
skill state inferred from AI prompt
instead of persisted data
```

---

# 131. Domain Invariants

Important invariants:

```text
0 <= Hunger <= 100

0 <= Energy <= 100

0 <= Happiness <= 100

0 <= Bond <= 100

0.05 <= Personality <= 0.95

PetSkill.level >= 1

One skill type per pet

Forgotten memory is never retrieved

Stage transitions never move backward in MVP

Search only exists after unlock
```

Game Engine + database should protect these.

---

# 132. Stage Transition Constraint

Allowed:

```text
EGG → BABY
BABY → CHILD
CHILD → ADULT
```

Disallowed MVP:

```text
ADULT → CHILD
BABY → ADULT
EGG → ADULT
```

Debug tools may bypass only in development.

---

# 133. Source of Truth Summary

```text
Pet
→ identity + stage

PetState
→ needs + Bond + activity + time

PetPersonality
→ personality values

PetGrowth
→ progression aggregate

PetSkill
→ capabilities

Event
→ history

Memory
→ remembered knowledge

Conversation / Message
→ dialogue history
```

---

# 134. Derived Data Summary

Derived, not authoritative:

```text
Mood

Dominant Traits

Growth Progress %

Relationship Label

Memory Retrieval Score

Conversation Summary

Embeddings
```

These can be recomputed.

---

# 135. Data Model Definition of Done

Data model is sufficient for MVP when it can represent:

1. User ownership.
2. One persistent pet.
3. Egg/Baby/Child/Adult stages.
4. Hunger, Energy, Happiness, Bond.
5. Current activity.
6. Offline simulation timestamps.
7. Persistent personality.
8. Growth eligibility and progress.
9. Search skill ownership.
10. Event history.
11. Conversation history.
12. Long-term memory.
13. Memory status and temporal relevance.
14. Memory correction and forgetting.
15. Growth history through events.
16. Skill unlock and usage history.
17. Optimistic state versioning.
18. Idempotent skill ownership.
19. Relevant indexes for recent history/retrieval.
20. Clear distinction between authoritative and derived data.

---

# 136. Recommended Implementation Order

When implementation starts:

```text
1. User

2. Pet

3. PetState

4. PetPersonality

5. PetGrowth

6. Event

7. Conversation

8. Message

9. Memory

10. PetSkill
```

This follows the prototype roadmap.

---

# 137. North Star

The data model must preserve one important illusion:

> **Momo today is the same Momo the player hatched weeks ago.**

That continuity depends on keeping separate but connected records of:

```text
who the pet is
+
how the pet currently feels
+
how the pet has changed
+
what happened
+
what the pet remembers
+
what the pet has learned
```

The database is not merely storage.

It is the persistent skeleton of the character.
