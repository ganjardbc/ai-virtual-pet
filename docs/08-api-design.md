# API Design

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`, `04-memory-system.md`, `05-growth-and-skills.md`, `06-technical-architecture.md`, `07-data-model.md`

---

# 1. Purpose

Dokumen ini mendefinisikan kontrak API antara Client dan Backend untuk MVP AI Virtual Pet.

API harus mendukung:

* pet creation,
* hatch,
* naming,
* pet snapshot,
* Feed,
* Play,
* Sleep,
* Chat,
* growth,
* skills,
* memories,
* Search,
* dan debug workflow untuk development.

API tidak boleh memindahkan game authority ke client.

Backend tetap menjadi source of truth.

---

# 2. API Principles

Prinsip utama:

```text
Client requests intent.

Backend decides outcome.
```

Contoh:

Client tidak mengirim:

```json
{
  "hunger": 100,
  "bond": 50
}
```

Client mengirim:

```json
{
  "action": "FEED"
}
```

Backend menghitung hasil.

---

# 3. Transport

MVP direkomendasikan menggunakan:

```text
HTTPS
+
JSON
```

Pattern awal:

```text
REST-style API
```

WebSocket belum diperlukan untuk MVP.

Chat dan pet actions dapat berjalan dengan normal request-response.

---

# 4. API Base

Conceptual:

```text
/api/v1
```

Versioning dilakukan dari awal agar contract dapat berkembang.

Contoh:

```text
GET /api/v1/pet
```

---

# 5. Authentication

Semua player-facing endpoint membutuhkan authenticated user.

Conceptual:

```text
Authorization: Bearer <token>
```

Exact authentication provider belum ditentukan.

Backend menentukan:

```text
currentUserId
```

dari authentication context.

Client tidak boleh bebas mengirim `userId` untuk ownership authorization.

---

# 6. Resource Ownership

Semua pet operation harus memverifikasi:

```text
Pet.userId == authenticatedUser.id
```

Jika tidak:

```text
403 FORBIDDEN
```

atau `404` jika produk memilih menyembunyikan resource existence.

Consistency lebih penting daripada pilihan kode tertentu.

---

# 7. Single Pet MVP

Karena MVP menggunakan satu active pet per user, endpoint dapat sederhana:

```text
/pet
```

daripada:

```text
/pets/:petId
```

Namun service layer sebaiknya tetap mendukung `petId` secara internal.

Future multi-pet dapat memperkenalkan:

```text
/pets/:petId
```

---

# 8. Standard Response Envelope

Successful response:

```json
{
  "data": {},
  "meta": {}
}
```

`meta` optional.

Example:

```json
{
  "data": {
    "name": "Momo"
  }
}
```

---

# 9. Standard Error Envelope

Recommended:

```json
{
  "error": {
    "code": "PET_TOO_TIRED",
    "message": "Pet is too tired to play.",
    "details": {}
  }
}
```

Fields:

```text
code
message
details
```

Client should primarily branch on:

```text
error.code
```

Not human-readable message.

---

# 10. Domain Error vs HTTP Error

HTTP status indicates transport/application category.

Domain error explains game reason.

Example:

Play rejected because tired:

Could still return:

```text
200
```

with domain result:

```json
{
  "status": "REJECTED",
  "reason": "TOO_TIRED"
}
```

This is not necessarily an HTTP failure.

Recommended distinction:

```text
HTTP errors
=
request could not be processed

Domain rejection
=
game successfully processed request,
but action was not allowed
```

---

# 11. HTTP Error Examples

Use HTTP errors for:

```text
400 invalid payload
401 unauthenticated
403 unauthorized
404 resource missing
409 concurrency conflict
422 schema/domain request malformed
429 rate limited
500 unexpected server failure
503 dependency unavailable
```

---

# 12. Domain Action Status

Game action result:

```text
SUCCESS
REJECTED
```

Possible rejected reasons:

```text
TOO_TIRED
TOO_FULL
SLEEPING
INVALID_STATE
SKILL_LOCKED
```

---

# 13. Request ID

Every request should have or receive:

```text
requestId
```

Backend may generate it.

Returned in:

```json
{
  "meta": {
    "requestId": "req_123"
  }
}
```

Useful for debugging.

---

# 14. Idempotency Key

State-changing requests should support:

```text
Idempotency-Key
```

Example header:

```text
Idempotency-Key: 1c1f...
```

Important for:

* Feed,
* Play,
* Sleep,
* Hatch,
* Name,
* Chat actions,
* Search invocation.

Retry with same key should not duplicate mutation.

---

# 15. Pet Snapshot

Core endpoint:

```text
GET /api/v1/pet
```

Purpose:

* load current pet,
* simulate elapsed time,
* return authoritative snapshot.

---

# 16. Snapshot Flow

Backend:

```text
authenticate
↓
load pet
↓
simulate until now
↓
persist simulation if state changed
↓
calculate derived state
↓
return snapshot
```

---

# 17. Snapshot Response

Conceptual:

```json
{
  "data": {
    "pet": {
      "id": "pet_123",
      "name": "Momo",
      "species": "DEFAULT",
      "stage": "CHILD",
      "createdAt": "...",
      "hatchedAt": "...",
      "version": 12
    },

    "state": {
      "hunger": 72,
      "energy": 64,
      "happiness": 81,
      "bond": 55,
      "currentActivity": "IDLE"
    },

    "personality": {
      "dominantTraits": [
        "PLAYFUL",
        "CURIOUS"
      ]
    },

    "growth": {
      "eligible": false,
      "progress": "GROWING_STEADILY"
    },

    "skills": [],

    "derived": {
      "mood": "HAPPY",
      "relationship": "FAMILIAR"
    }
  }
}
```

Raw internal personality values do not need to be exposed to normal player UI.

---

# 18. Raw Debug Snapshot

Development-only endpoint may expose:

```text
raw stats
raw personality
growth numbers
recent events
```

Never expose debug route in production without protection.

---

# 19. Create Pet

If account has no pet:

```text
POST /api/v1/pet
```

Request:

```json
{}
```

Backend creates:

```text
Pet
PetState
PetPersonality
PetGrowth
PET_CREATED event
```

Initial stage:

```text
EGG
```

---

# 20. Create Pet Response

```json
{
  "data": {
    "pet": {
      "id": "pet_123",
      "stage": "EGG",
      "species": "DEFAULT"
    }
  }
}
```

If active pet already exists:

```text
PET_ALREADY_EXISTS
```

---

# 21. Hatch Pet

Endpoint:

```text
POST /api/v1/pet/hatch
```

Request:

```json
{}
```

Backend validates:

```text
stage == EGG
```

Then:

```text
EGG → BABY
set hatchedAt
create PET_HATCHED
```

---

# 22. Hatch Result

```json
{
  "data": {
    "status": "SUCCESS",
    "event": {
      "type": "PET_HATCHED"
    },
    "pet": {}
  }
}
```

Naming can happen after Hatch.

---

# 23. Naming Pet

Endpoint:

```text
PATCH /api/v1/pet/name
```

Request:

```json
{
  "name": "Momo"
}
```

Validation:

```text
non-empty
length limit
allowed characters
content policy if required
```

---

# 24. Naming Rules

Possible initial constraints:

```text
1-30 characters
```

Trim whitespace.

Reject blank-only input.

Exact allowed character policy should support international names.

---

# 25. Naming Result

Backend:

```text
update Pet.name
insert PET_NAMED
create deterministic relationship memory
```

Response:

```json
{
  "data": {
    "name": "Momo"
  }
}
```

---

# 26. Core Action API

Recommended generic endpoint:

```text
POST /api/v1/pet/actions
```

Request:

```json
{
  "type": "FEED"
}
```

Possible types:

```text
FEED
PLAY
SLEEP
```

This avoids separate endpoint explosion.

---

# 27. Why Generic Action Endpoint

Core game actions share the same lifecycle:

```text
simulate
validate
mutate
event
derived state
reaction
```

A single action endpoint keeps contract consistent.

---

# 28. Feed Request

```json
{
  "type": "FEED"
}
```

No stat values sent.

Backend computes:

```text
Hunger change
Happiness change
Bond change
```

---

# 29. Play Request

```json
{
  "type": "PLAY"
}
```

Backend handles:

```text
Energy validation
diminishing returns
personality signal
Bond
Happiness
Hunger
```

---

# 30. Sleep Request

```json
{
  "type": "SLEEP"
}
```

Backend sets:

```text
currentActivity = SLEEPING
sleepStartedAt = now
```

No immediate arbitrary Energy jump.

---

# 31. Action Response

Recommended:

```json
{
  "data": {
    "status": "SUCCESS",

    "action": {
      "type": "PLAY"
    },

    "changes": {
      "hunger": -4,
      "energy": -10,
      "happiness": 12,
      "bond": 1
    },

    "pet": {},

    "reaction": {
      "message": "Lagi! Lagi!",
      "emotion": "EXCITED",
      "animation": "BOUNCE"
    },

    "events": [
      {
        "type": "PET_PLAYED"
      }
    ]
  }
}
```

---

# 32. Action Rejection Response

Example:

```json
{
  "data": {
    "status": "REJECTED",

    "action": {
      "type": "PLAY"
    },

    "reason": "TOO_TIRED",

    "pet": {},

    "reaction": {
      "message": "Aku udah ngantuk banget...",
      "emotion": "SLEEPY"
    }
  }
}
```

This remains successful request processing.

---

# 33. Reaction Optionality

AI reaction may be:

```text
LLM-generated
template-based
```

API contract should not care.

Client receives normalized:

```text
message
emotion
animation
```

---

# 34. No Reaction Failure Cascade

If reaction generation fails after game mutation:

game mutation must remain valid.

Backend can return fallback:

```json
{
  "reaction": {
    "message": "Momo reacts happily.",
    "emotion": "HAPPY"
  }
}
```

Do not rollback Feed because LLM failed.

---

# 35. Chat Endpoint

Endpoint:

```text
POST /api/v1/pet/chat
```

Request:

```json
{
  "message": "Momo, main yuk."
}
```

---

# 36. Chat Flow

Backend:

```text
authenticate
↓
simulate pet
↓
store/prepare user message
↓
retrieve AI context
↓
interpret message
↓
validate proposed action
↓
execute max one game action
↓
authorize/execute tool if applicable
↓
update state/events
↓
generate final response
↓
process memory candidates
↓
persist messages
↓
return result
```

---

# 37. Chat Request Fields

MVP:

```json
{
  "message": "..."
}
```

Possible future:

```text
conversationId
clientMessageId
attachment
```

Do not add until needed.

---

# 38. Chat Message Limits

Set bounded input.

Example initial:

```text
1-4000 characters
```

Exact value depends model/provider constraints.

Reject empty input.

---

# 39. Chat Response

Conceptual:

```json
{
  "data": {
    "interactionId": "interaction_123",

    "message": {
      "id": "message_pet_123",
      "role": "PET",
      "content": "Main? Gas!"
    },

    "expression": {
      "emotion": "EXCITED",
      "animation": "BOUNCE"
    },

    "action": {
      "type": "PLAY",
      "status": "SUCCESS"
    },

    "tool": null,

    "pet": {}
  }
}
```

---

# 40. Chat Without Game Action

Example casual:

User:

> "Hari ini capek banget."

Response:

```json
{
  "data": {
    "message": {
      "role": "PET",
      "content": "Kerjaan lagi berat?"
    },
    "action": null,
    "tool": null,
    "pet": {}
  }
}
```

---

# 41. Chat With Rejected Action

User:

> "Main yuk."

Pet too tired.

Response:

```json
{
  "data": {
    "message": {
      "content": "Pengen... tapi aku udah capek."
    },
    "action": {
      "type": "PLAY",
      "status": "REJECTED",
      "reason": "TOO_TIRED"
    },
    "pet": {}
  }
}
```

---

# 42. Maximum One Game Action

For MVP:

```text
max 1 state-changing game action per chat request
```

If user says:

> "Makan terus tidur."

AI may identify multiple intents internally, but backend should not execute multiple mutations automatically.

Possible behavior:

* execute first clear action,
* respond about second,
* or request follow-up.

---

# 43. Chat Conversation ID

Backend can manage active conversation automatically.

Response may include:

```text
conversationId
```

Example:

```json
{
  "data": {
    "conversationId": "conv_123"
  }
}
```

Client can reuse it if conversation model requires.

---

# 44. Conversation History

Endpoint:

```text
GET /api/v1/pet/conversations/current/messages
```

or simpler:

```text
GET /api/v1/pet/chat/history
```

MVP may use cursor pagination.

---

# 45. History Response

```json
{
  "data": {
    "messages": [
      {
        "id": "msg_1",
        "role": "USER",
        "content": "Hai",
        "createdAt": "..."
      },
      {
        "id": "msg_2",
        "role": "PET",
        "content": "Hai!",
        "createdAt": "..."
      }
    ]
  },
  "meta": {
    "nextCursor": null
  }
}
```

---

# 46. Cursor Pagination

Prefer cursor over page number for message/event history.

Example:

```text
?cursor=...
&limit=30
```

More robust as new rows are appended.

---

# 47. Growth Status API

Growth status can be part of Pet Snapshot.

No separate endpoint required for normal UI.

Could expose:

```json
{
  "growth": {
    "eligible": true,
    "progress": "READY_TO_GROW"
  }
}
```

---

# 48. Trigger Growth

If growth is ready, client needs way to start presentation.

Endpoint:

```text
POST /api/v1/pet/grow
```

Backend validates:

```text
growthEligible == true
```

Then performs transition transaction.

---

# 49. Growth Request

```json
{}
```

Do not send desired target stage.

Backend determines:

```text
BABY → CHILD
or
CHILD → ADULT
```

---

# 50. Growth Response

```json
{
  "data": {
    "status": "SUCCESS",

    "growth": {
      "fromStage": "CHILD",
      "toStage": "ADULT"
    },

    "unlockedSkills": [
      {
        "type": "SEARCH",
        "level": 1
      }
    ],

    "reaction": {
      "message": "Kayaknya sekarang aku bisa bantu nyari sesuatu juga.",
      "emotion": "EXCITED"
    },

    "pet": {}
  }
}
```

---

# 51. Growth Idempotency

If request retries with same Idempotency Key:

must return same completed result.

Must not:

```text
ADULT → imaginary next stage
```

---

# 52. Skill List

Endpoint:

```text
GET /api/v1/pet/skills
```

Could also be included in Pet Snapshot.

Useful if Skill screen exists.

---

# 53. Skill Response

```json
{
  "data": {
    "skills": [
      {
        "type": "SEARCH",
        "level": 1,
        "unlockedAt": "...",
        "usageCount": 8
      }
    ]
  }
}
```

---

# 54. Search Through Chat

Primary UX:

```text
POST /pet/chat
```

User says:

> "Cari artikel soal WebAssembly."

AI detects Search intent.

This is preferred player experience.

---

# 55. Direct Search Endpoint

A direct skill endpoint may still be useful internally:

```text
POST /api/v1/pet/skills/search
```

Request:

```json
{
  "query": "WebAssembly articles"
}
```

Use cases:

* testing,
* skill UI,
* internal orchestration.

Normal product can still invoke through Chat.

---

# 56. Search Validation

Backend checks:

```text
SEARCH Lv.1 exists
```

If not:

domain result:

```text
SKILL_LOCKED
```

No Search provider call occurs.

---

# 57. Search Request

```json
{
  "query": "latest React Server Components articles"
}
```

Potential future:

```text
recency
source filters
language
```

Not needed for initial API.

---

# 58. Search Response

```json
{
  "data": {
    "status": "SUCCESS",

    "skill": {
      "type": "SEARCH",
      "level": 1
    },

    "message": {
      "content": "Aku nemu tiga artikel..."
    },

    "results": [
      {
        "title": "...",
        "source": "...",
        "url": "...",
        "snippet": "..."
      }
    ]
  }
}
```

Whether raw results are shown to player depends on UI.

Backend can still return them.

---

# 59. Search Failure

Example:

```json
{
  "data": {
    "status": "FAILED",
    "reason": "PROVIDER_UNAVAILABLE",
    "message": {
      "content": "Aku coba nyari, tapi jalannya lagi macet."
    }
  }
}
```

No fabricated results.

---

# 60. Memory List

Endpoint:

```text
GET /api/v1/pet/memories
```

Returns player-visible memories.

Do not necessarily expose every internal memory.

---

# 61. Memory Query

Potential filters:

```text
type
status
cursor
limit
```

Default:

```text
ACTIVE
player-visible
```

---

# 62. Memory Response

```json
{
  "data": {
    "memories": [
      {
        "id": "memory_1",
        "type": "PREFERENCE",
        "content": "You like cats.",
        "createdAt": "..."
      }
    ]
  },
  "meta": {
    "nextCursor": null
  }
}
```

---

# 63. Forget Memory

Endpoint:

```text
DELETE /api/v1/pet/memories/:memoryId
```

Semantics:

```text
mark FORGOTTEN
or perform deletion according to implementation policy
```

After success, memory must stop appearing in AI retrieval.

---

# 64. Forget Memory Response

```json
{
  "data": {
    "status": "FORGOTTEN",
    "memoryId": "memory_123"
  }
}
```

---

# 65. Correct Memory

Potential endpoint:

```text
PATCH /api/v1/pet/memories/:memoryId
```

Request:

```json
{
  "content": "You prefer coffee."
}
```

However MVP may choose conversational correction first.

Direct editing is optional.

---

# 66. Memory Security

User can only read/forget memories belonging to owned pet.

Never allow arbitrary `petId` or `memoryId` access without ownership validation.

---

# 67. Event API

Raw Event Log is primarily developer/internal.

Normal player UI likely does not need:

```text
GET /events
```

Player-facing timeline should instead expose curated memories/milestones.

---

# 68. Internal Event Endpoint

Development-only:

```text
GET /api/v1/debug/pet/events
```

Can filter:

```text
type
from
to
limit
```

Production disabled.

---

# 69. Debug State

Development-only:

```text
GET /api/v1/debug/pet/state
```

Returns raw:

```text
stats
personality
growth
skills
lastSimulatedAt
derived mood
```

---

# 70. Debug Time Travel

Development-only:

```text
POST /api/v1/debug/time/advance
```

Request:

```json
{
  "hours": 6
}
```

or:

```json
{
  "days": 7
}
```

Must use injected Clock / simulation offset.

Do not modify operating system clock.

---

# 71. Debug Set State

Potential:

```text
PATCH /api/v1/debug/pet/state
```

Request:

```json
{
  "energy": 10,
  "bond": 39
}
```

Development only.

Useful for edge cases.

---

# 72. Debug Growth

Potential:

```text
POST /api/v1/debug/pet/growth-ready
```

or generic debug mutation.

Allows rapid testing of growth sequence.

---

# 73. Debug Unlock Skill

Development-only:

```text
POST /api/v1/debug/pet/skills/search/unlock
```

Useful for Search testing.

Never production-facing.

---

# 74. API Snapshot Consistency

After any state-changing action, response should include authoritative updated Pet Snapshot or sufficient updated fields.

Recommended:

```text
return full compact snapshot
```

for MVP simplicity.

This reduces client reconciliation complexity.

---

# 75. Why Return Snapshot After Mutation

Without snapshot:

client must manually apply:

```text
+25 Hunger
-10 Energy
```

which duplicates game logic.

Better:

```text
backend mutates
↓
backend returns authoritative state
↓
client renders
```

---

# 76. Snapshot Shape Reuse

Define shared:

```text
PetSnapshot
```

Used by:

```text
GET /pet
POST /actions
POST /chat
POST /grow
```

This keeps client simpler.

---

# 77. PetSnapshot DTO

Conceptual:

```json
{
  "pet": {},
  "state": {},
  "personality": {},
  "growth": {},
  "skills": [],
  "derived": {}
}
```

Use same semantic meaning everywhere.

---

# 78. Exposing Internal Personality

Normal snapshot should likely expose:

```text
dominantTraits
```

not:

```text
playful = 0.723894
```

Debug API may expose raw values.

---

# 79. Exposing Bond

Product decision:

Could expose exact:

```text
55
```

or presentation:

```text
★★★★☆
```

API may return numeric Bond while UI abstracts it.

However if exact numbers encourage grinding, API could expose relationship band only to player client.

Internal data remains numeric.

---

# 80. API DTO vs Database Model

Never directly serialize database row as API contract.

Use DTO/view model.

Reason:

```text
security
future schema changes
derived fields
hide internal metadata
```

---

# 81. Enum Stability

API enums should be explicit.

Examples:

```text
BABY
CHILD
ADULT
```

Avoid using arbitrary human strings such as:

```text
"little kid"
```

UI handles localization.

---

# 82. Localization

API returns semantic enums.

Example:

```json
{
  "mood": "SLEEPY"
}
```

Client may display:

```text
Ngantuk
Sleepy
眠い
```

Character dialogue is separate natural-language content.

---

# 83. Timestamp Format

Use ISO 8601 UTC.

Example:

```text
2026-09-25T04:00:00Z
```

Client converts to local timezone.

---

# 84. Input Time

Client generally should not provide authoritative timestamps for game action.

Backend uses server clock.

Client timestamp may be accepted for diagnostics but not trusted for simulation.

---

# 85. Optimistic Concurrency

Optional request header:

```text
If-Match: <petVersion>
```

or body:

```json
{
  "expectedVersion": 12
}
```

If stale:

```text
409 PET_STATE_CONFLICT
```

For MVP, backend can also handle mutations transactionally without exposing this to client immediately.

---

# 86. Conflict Response

```json
{
  "error": {
    "code": "PET_STATE_CONFLICT",
    "message": "Pet state changed. Refresh and retry."
  }
}
```

Client reloads snapshot.

---

# 87. Rate Limits

Rate limits should primarily protect costly endpoints.

Examples:

```text
/chat
/search
```

Core actions may use abuse limits but should not feel artificially restricted.

---

# 88. Rate Limit Response

HTTP:

```text
429
```

Body:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests.",
    "details": {
      "retryAfterSeconds": 30
    }
  }
}
```

---

# 89. AI Provider Failure

If `/chat` cannot generate response:

Possible:

```text
503 AI_UNAVAILABLE
```

But if a game action already committed through chat, API must communicate that state changed.

Safer design:

separate game mutation from final AI dependency internally and provide fallback response.

---

# 90. Partial Success

Complex interaction may partially succeed.

Example:

User chat triggered Feed successfully, but AI final response failed.

Response should prefer:

```json
{
  "data": {
    "action": {
      "status": "SUCCESS"
    },
    "message": {
      "content": "..."
    },
    "degraded": true,
    "pet": {}
  }
}
```

Do not pretend action failed.

---

# 91. Search Partial Failure

Search tool may return some results plus errors.

Normalized Tool Engine can decide:

```text
SUCCESS
PARTIAL
FAILED
```

API can expose:

```json
{
  "status": "PARTIAL"
}
```

if useful.

Not required for first prototype.

---

# 92. Memory Processing Failure

If chat response succeeds but memory extraction fails:

Conversation should still succeed.

Memory processing is degradable.

Technical logs record failure.

Player does not need 500 error.

---

# 93. Analytics Failure

Never fail user action because analytics event delivery failed.

Game Event persistence is different and may be critical.

External analytics is non-critical.

---

# 94. Action Event Guarantee

If action state mutation commits, corresponding core Event should commit in same transaction.

Example:

```text
PET_PLAYED
```

should not be optional analytics.

It is domain history.

---

# 95. API-Level Transaction Boundaries

Simple action:

```text
simulate
+
mutation
+
domain events
```

one short transaction.

Do not include LLM call in database transaction.

---

# 96. Chat Transaction Strategy

Recommended:

```text
simulate and persist
↓
AI interpretation
↓
short mutation transaction
↓
tool execution
↓
AI final response
↓
persist messages/memory work
```

State-changing intent must be revalidated before mutation.

---

# 97. Chat Retry Safety

Chat request should accept Idempotency Key.

Important because it may trigger:

```text
PLAY
SEARCH
```

on retry.

Without idempotency, duplicate natural-language actions could occur.

---

# 98. Message Client ID

Future robust messaging may use:

```text
clientMessageId
```

Request:

```json
{
  "clientMessageId": "uuid",
  "message": "..."
}
```

This can also aid duplicate detection.

Optional for initial prototype.

---

# 99. API Validation

Every request passes:

```text
authentication
schema validation
ownership validation
domain validation
```

AI is never used to compensate for malformed API input.

---

# 100. Action Schema Validation

Invalid:

```json
{
  "type": "BECOME_ADULT"
}
```

Reject.

Only known core actions allowed.

Growth has dedicated server-controlled flow.

---

# 101. Chat Schema Validation

Reject:

```text
empty message
oversized message
invalid encoding
```

Normalize whitespace where appropriate.

---

# 102. Search Query Validation

Reject:

```text
empty query
excessive length
```

Tool Engine can also sanitize input.

---

# 103. File Uploads

Not part of MVP API.

No:

```text
images
documents
voice files
```

in initial Chat endpoint.

Future expansion can add attachments deliberately.

---

# 104. Streaming Chat

Potential improvement:

```text
SSE
```

for streaming pet response.

Not required for MVP 1.

Start with normal JSON response.

---

# 105. If Streaming Is Added

Do not stream game mutation decisions before validation.

Possible flow:

```text
action resolved first
↓
then stream final dialogue
```

Client should not infer tool success from partial text.

---

# 106. API Versioning

Breaking contract change:

```text
/api/v2
```

Non-breaking additions can remain v1.

Avoid changing enum meaning silently.

---

# 107. Backward Compatibility

Once real clients exist:

* add fields safely,
* avoid removing fields abruptly,
* keep enum compatibility,
* version breaking semantics.

During prototype this can be looser.

---

# 108. API Documentation Source

When implementation begins, API contract should ideally be represented as:

```text
OpenAPI / generated schema
```

This markdown remains design source.

Actual implementation contract should become machine-readable.

---

# 109. Shared Types

If frontend/backend both use TypeScript, shared DTO types can be useful.

But avoid sharing domain implementation directly with UI accidentally.

Good to share:

```text
API DTO
enums
schemas
```

Not necessarily:

```text
database entities
repository objects
```

---

# 110. Endpoint Summary

MVP public endpoints:

```text
POST   /api/v1/pet
GET    /api/v1/pet

POST   /api/v1/pet/hatch
PATCH  /api/v1/pet/name

POST   /api/v1/pet/actions

POST   /api/v1/pet/chat
GET    /api/v1/pet/chat/history

POST   /api/v1/pet/grow

GET    /api/v1/pet/skills
POST   /api/v1/pet/skills/search

GET    /api/v1/pet/memories
DELETE /api/v1/pet/memories/:memoryId
```

Some may be omitted from final UI if accessed indirectly.

---

# 111. Minimal Prototype API

Prototype 0.1 only needs:

```text
POST /pet
GET  /pet
POST /pet/hatch
PATCH /pet/name
POST /pet/actions
```

No AI.

---

# 112. AI Prototype API

Then add:

```text
POST /pet/chat
GET  /pet/chat/history
```

---

# 113. Memory Prototype API

Then:

```text
GET /pet/memories
DELETE /pet/memories/:id
```

Memory candidate processing happens internally through Chat.

---

# 114. Growth and Skill Prototype API

Add:

```text
POST /pet/grow
GET  /pet/skills
POST /pet/skills/search
```

---

# 115. API Example Journey

Create:

```text
POST /pet
```

↓

Hatch:

```text
POST /pet/hatch
```

↓

Name:

```text
PATCH /pet/name
```

↓

Interact:

```text
POST /pet/actions
```

↓

Talk:

```text
POST /pet/chat
```

↓

Return later:

```text
GET /pet
```

↓

Growth ready:

```text
POST /pet/grow
```

↓

Adult:

```text
Search unlocked
```

↓

Search:

```text
POST /pet/chat
```

with:

> "Cari artikel tentang WebAssembly."

---

# 116. API Response Design Goal

Client should never need to understand the hidden mechanics of:

```text
Bond formula
personality formula
mood priority
growth requirement
```

Client asks for action and renders authoritative response.

This keeps game rules centralized.

---

# 117. Domain Error Codes

Initial set:

```text
PET_NOT_FOUND
PET_ALREADY_EXISTS

INVALID_PET_STAGE

PET_SLEEPING
PET_TOO_TIRED
PET_TOO_FULL

ACTION_NOT_ALLOWED

GROWTH_NOT_READY

SKILL_LOCKED
TOOL_FAILED

MEMORY_NOT_FOUND

PET_STATE_CONFLICT
RATE_LIMITED
```

Keep code list controlled.

---

# 118. Tool Error Codes

Normalized internal/public possibilities:

```text
TOOL_UNAVAILABLE
TOOL_TIMEOUT
TOOL_RATE_LIMITED
TOOL_INVALID_REQUEST
```

Player-facing pet message should not expose technical implementation unnecessarily.

---

# 119. Error Localization

API error code is stable.

Human `message` may be developer-oriented or localized.

UI should use:

```text
error.code
```

for product behavior.

Pet reaction may provide friendlier in-character explanation.

---

# 120. Security Principle

Never trust:

```text
client
AI output
tool output
```

without validation appropriate to each source.

Backend is policy enforcement point.

---

# 121. API Logging

Log:

```text
requestId
interactionId
userId
petId
endpoint
status
latency
domain result
```

Do not indiscriminately log sensitive chat content in production.

---

# 122. AI API Logging

Technical logs may record:

```text
model
latency
token use
parse status
prompt version
```

User message content should follow privacy/logging policy.

---

# 123. Search Logging

Useful:

```text
skill unlocked?
tool invoked?
status
latency
result count
```

Avoid storing unnecessary full external content forever.

---

# 124. Health Endpoint

Infrastructure can expose:

```text
GET /health
```

Checks backend process.

Future readiness checks can include:

```text
database
```

Do not require external LLM/Search to pass basic liveness.

---

# 125. API Testing Strategy

Test levels:

```text
schema tests
authorization tests
domain action tests
idempotency tests
concurrency tests
failure-path tests
E2E journey tests
```

---

# 126. Action API Tests

Must cover:

```text
Feed normal
Feed when full
Play normal
Play too tired
Play diminishing return
Sleep
Action while sleeping
Idempotent retry
```

---

# 127. Chat API Tests

Must cover:

```text
casual conversation
explicit Feed request
explicit Play request
ambiguous message
rejected action
memory candidate
locked Search
unlocked Search
AI failure
```

---

# 128. Growth API Tests

Cover:

```text
growth not eligible
Baby → Child
Child → Adult
Search unlock
retry same request
double growth prevention
```

---

# 129. Memory API Tests

Cover:

```text
list active memory
forget memory
ownership
forgotten memory no longer retrieved
unknown memory ID
```

---

# 130. Search API Tests

Cover:

```text
skill locked
success
empty result
provider timeout
provider error
retry/idempotency if mutation occurs
SKILL_USED event creation
```

---

# 131. E2E API Scenario

Test full lifecycle:

```text
Create pet
↓
Hatch
↓
Name
↓
Feed
↓
Play
↓
Talk
↓
Advance simulated time
↓
Load snapshot
↓
Create memory
↓
Grow Child
↓
Grow Adult
↓
Verify Search unlocked
↓
Search via Chat
↓
Verify result grounded
```

---

# 132. API Definition of Done

API design is sufficient for MVP when:

1. Client can create/load one pet.
2. Hatch is server-authoritative.
3. Naming creates consistent state/history.
4. Feed/Play/Sleep execute through one game action contract.
5. Client never sends stat mutations.
6. Every mutation returns authoritative snapshot.
7. Domain rejection is distinguishable from HTTP failure.
8. Chat supports natural-language actions.
9. Chat executes at most one game action per request.
10. Game action is revalidated after AI interpretation.
11. Growth cannot be client-forced.
12. Adult growth unlocks Search atomically.
13. Locked Search cannot execute.
14. Search failure cannot fabricate success.
15. Memory can be listed and forgotten.
16. Forgotten memory stops being retrieved.
17. State-changing requests support idempotency.
18. API supports concurrency conflict handling.
19. Debug routes allow time acceleration in development.
20. AI/tool failures cannot corrupt core pet state.

---

# 133. North Star

The API should make the Client thin and the Backend authoritative.

The Client says:

> "Player wants to play."

The Backend answers:

> "This is what actually happened."

The AI says:

> "This is how the pet expresses it."

That separation keeps the experience flexible without turning the client or LLM into the laws of the game.
