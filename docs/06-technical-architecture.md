# Technical Architecture

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`, `04-memory-system.md`, `05-growth-and-skills.md`

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur teknis awal untuk AI Virtual Pet.

Tujuannya adalah menerjemahkan desain game menjadi sistem software yang:

* konsisten,
* mudah diuji,
* modular,
* dapat berkembang,
* tidak terlalu kompleks untuk MVP,
* dan tetap menjaga Game Engine sebagai source of truth.

Arsitektur ini harus memungkinkan:

```text id="6gm8jk"
Pet Simulation
+
AI Conversation
+
Memory
+
Growth
+
Skills
+
External Tools
```

berjalan sebagai satu pengalaman yang konsisten.

---

# 2. Core Architecture Principle

Prinsip utama:

> **Game Engine defines reality. AI interprets reality.**

Game Engine menentukan:

* state,
* needs,
* Bond,
* personality,
* mood,
* growth,
* skill availability,
* action outcome.

AI tidak memiliki authority untuk mengubah state secara langsung.

---

# 3. High-Level Architecture

Arsitektur dasar:

```text id="jobl7e"
                    CLIENT
              Web / Mobile App
                     │
                     ▼
                 Backend API
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
  Game Engine     AI Engine     Tool Engine
       │             │             │
       │             │             ├── Search
       │             │             ├── Reminder [Future]
       │             │             ├── Calendar [Future]
       │             │             └── Other Tools [Future]
       │             │
       │             ▼
       │        Memory System
       │
       └─────────────┬─────────────┘
                     ▼
                 Persistence
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      Pet          Events       Memories
```

Backend menjadi orchestration layer antara semua subsystem.

---

# 4. Architecture Goals

Arsitektur MVP harus memenuhi:

```text id="ejosvb"
Deterministic Game State
Clear System Boundaries
Safe AI Integration
Persistent History
Low Operational Complexity
Debuggability
Testability
Future Extensibility
```

---

# 5. Non-Goals

MVP tidak membutuhkan:

```text id="uwva0i"
microservice architecture
event streaming platform
distributed agents
complex message queues
multiple databases
real-time background simulation
multi-region architecture
```

Mulai sederhana.

Scale hanya jika dibutuhkan.

---

# 6. Recommended Initial Deployment Model

Untuk MVP:

```text id="bsb9xf"
Client
↓
Single Backend Application
↓
Database
+
External AI / Tool APIs
```

Backend boleh secara internal memiliki modules:

```text id="dur2xr"
Game
AI
Memory
Tools
Growth
Events
```

tanpa menjadi separate services.

Ini menjaga separation of concerns tanpa operational overhead microservices.

---

# 7. Client Responsibilities

Client bertanggung jawab atas:

* rendering pet,
* displaying state,
* animations,
* user input,
* navigation,
* chat interface,
* optimistic visual feedback where safe,
* local presentation state.

Client tidak menjadi source of truth untuk persistent game state.

---

# 8. Client Must Not Own Game Logic

Client tidak boleh menentukan sendiri:

```text id="o487pr"
Bond gain
Hunger mutation
Growth eligibility
Skill unlock
Personality mutation
```

Client dapat menampilkan hasil.

Backend/Game Engine menentukan hasil sebenarnya.

---

# 9. Client State

Client boleh menyimpan:

```text id="1xkzgp"
current screen
animation state
input draft
temporary loading state
cached pet snapshot
```

Namun persistent authoritative state berasal dari server.

---

# 10. Backend Responsibilities

Backend bertanggung jawab atas:

```text id="ev46zk"
authentication
pet loading
time simulation
game actions
AI orchestration
memory processing
tool execution
growth
skill validation
event persistence
database access
```

Backend menjadi trust boundary utama.

---

# 11. Backend Modules

Initial modules:

```text id="lb4bzb"
Pet Service
Game Engine
Simulation Engine
Growth System
Skill System
Event System
AI Orchestrator
Context Builder
Memory System
Tool Engine
Persistence Layer
```

Semua dapat hidup dalam satu codebase.

---

# 12. Pet Service

Pet Service mengatur lifecycle pet dari sisi application layer.

Responsibilities:

```text id="yad9bn"
create pet
load pet
name pet
retrieve current state
coordinate simulation before reads/actions
```

Pet Service tidak berisi semua game formulas.

Formula tetap berada di Game Engine / Simulation Engine.

---

# 13. Game Engine

Game Engine adalah pusat rules.

Responsibilities:

```text id="x9jlml"
validate actions
apply state mutations
calculate action effects
apply diminishing returns
apply Bond rules
apply personality signals
calculate derived state
```

Game Engine harus bisa diuji tanpa AI.

---

# 14. Game Engine Input

Conceptual:

```json id="7z54wk"
{
  "petState": {},
  "action": {},
  "timestamp": "..."
}
```

Output:

```json id="vk7nya"
{
  "newState": {},
  "events": [],
  "result": {}
}
```

---

# 15. Game Engine Must Be Deterministic

Dengan input yang sama:

```text id="ir30dq"
same state
same action
same timestamp
same random seed
```

Game Engine harus menghasilkan outcome yang sama.

AI wording tidak perlu deterministic.

---

# 16. Simulation Engine

Simulation Engine menangani perubahan berbasis waktu.

Responsibilities:

```text id="bd0b6w"
Hunger decay
Energy decay
Sleep recovery
Happiness pressure
offline progression
autonomous activity resolution
```

Input utama:

```text id="5we6v5"
pet state
lastSimulatedAt
current time
```

---

# 17. Simulation Flow

```text id="n9wns6"
Load Pet
↓
Read lastSimulatedAt
↓
Calculate elapsed time
↓
Run simulation
↓
Update state
↓
Generate summarized events
↓
Set lastSimulatedAt = now
```

Simulation dilakukan sebelum state digunakan untuk action penting.

---

# 18. No Continuous Background Simulation

MVP tidak membutuhkan pet process yang hidup terus.

Tidak perlu:

```text id="bgut05"
cron every minute
background worker per pet
long-running process
```

Simulation menggunakan elapsed-time calculation.

Ini jauh lebih murah dan scalable untuk MVP.

---

# 19. Growth System

Growth System bertanggung jawab atas:

```text id="klq86q"
growth eligibility
stage transition
growth readiness
stage history
growth event generation
```

Growth System membaca:

```text id="q3rvkb"
Age
Bond
Meaningful Interactions
Current Stage
```

---

# 20. Growth Is Not Directly AI-Controlled

AI tidak boleh mengeluarkan:

```text id="706y8z"
stage = ADULT
```

Growth System yang menentukan perubahan.

AI hanya menerima:

```text id="y4o8zm"
PET_GREW
Baby → Child
```

dan menghasilkan reaction.

---

# 21. Skill System

Skill System bertanggung jawab atas:

```text id="6jaq8r"
skill ownership
skill unlock
skill level
skill authorization
skill usage history
```

Untuk MVP:

```text id="h5dsr6"
SEARCH Lv.1
```

---

# 22. Skill Authorization Flow

```text id="yrjg71"
AI proposes Search
↓
Skill System
↓
Does pet have Search Lv.1?
↓
Yes → authorize
No  → reject
```

Tool Engine tidak boleh menerima request tanpa authorization.

---

# 23. Event System

Event System menyimpan history dari meaningful state changes.

Examples:

```text id="crkpif"
PET_HATCHED
PET_NAMED
PET_FED
PET_PLAYED
PET_GREW
PLAYER_RETURNED
SKILL_UNLOCKED
SKILL_USED
```

Events digunakan untuk:

* debugging,
* analytics,
* growth,
* memory,
* AI context.

---

# 24. State + Event Log Model

MVP menggunakan:

```text id="qiwbhm"
Current State
+
Append-Only Event Log
```

Bukan full event sourcing.

Current State menjadi authoritative snapshot.

Event Log menyimpan historical context.

---

# 25. Why Not Full Event Sourcing

Full event sourcing menambah kompleksitas seperti:

```text id="8yxir9"
state reconstruction
event migration
event versioning
replay consistency
```

MVP belum membutuhkannya.

State + event log cukup.

---

# 26. AI Engine

AI Engine bertanggung jawab atas integrasi LLM.

Responsibilities:

```text id="w7chh6"
intent interpretation
conversation classification
memory candidate extraction
character dialogue
tool request generation
tool-result summarization
```

AI Engine tidak berinteraksi langsung dengan database secara bebas.

---

# 27. AI Orchestrator

AI Orchestrator mengatur flow antara:

```text id="n8yakl"
Context Builder
LLM
Game Engine
Memory System
Tool Engine
```

Contoh:

```text id="8mbkq4"
User Message
↓
Context Builder
↓
LLM Interpretation
↓
Action Validation
↓
Game Engine
↓
Tool Execution if needed
↓
Final Context
↓
LLM Character Response
```

---

# 28. Context Builder

Context Builder adalah komponen penting.

Responsibilities:

```text id="1vqvfz"
load relevant state
select personality context
select recent events
retrieve relevant memories
include available skills
include action/tool results
build bounded AI prompt context
```

AI tidak boleh menerima seluruh database.

---

# 29. Context Builder Input

Possible inputs:

```text id="w6pueg"
petId
userMessage
currentAction
session context
```

---

# 30. Context Builder Output

Conceptual:

```json id="6kfipl"
{
  "identity": {},
  "state": {},
  "personality": {},
  "relationship": {},
  "recentEvents": [],
  "memories": [],
  "skills": [],
  "conversation": [],
  "userMessage": ""
}
```

---

# 31. Context Budget

Context harus bounded.

Suggested structure:

```text id="l0njje"
Stable Identity
+
Current State
+
Dominant Personality
+
3-8 Recent Events
+
0-5 Relevant Memories
+
Recent Conversation Window
```

Jangan mengirim seluruh history.

---

# 32. AI Provider Abstraction

AI Engine sebaiknya tidak tightly coupled ke satu provider.

Use conceptual interface:

```text id="k86zmt"
AIProvider
├── interpret()
├── respond()
└── extractMemory()
```

Underlying provider dapat berubah.

---

# 33. Why AI Provider Abstraction

Benefits:

```text id="l0sz6u"
swap models
cost optimization
fallback
testing
provider migration
```

Pet identity tidak boleh bergantung pada vendor tertentu.

---

# 34. Model Routing

Future architecture dapat menggunakan model berbeda untuk task berbeda.

Example:

```text id="ugzs98"
Intent classification
→ small model

Memory extraction
→ small model

Casual conversation
→ conversational model

Complex Search summary
→ stronger model
```

MVP dapat mulai dengan satu model jika lebih sederhana.

---

# 35. AI Structured Output

AI interpretation harus menggunakan structured schema.

Conceptually:

```json id="bp8jrn"
{
  "intent": {},
  "interaction": {},
  "personalitySignals": [],
  "memoryCandidates": [],
  "toolRequest": null,
  "expression": {},
  "message": ""
}
```

Backend harus validate output.

---

# 36. Never Trust Raw LLM Output

All structured AI output must pass:

```text id="qt0v4g"
schema validation
enum validation
skill validation
action validation
tool validation
```

Invalid fields harus diabaikan atau fallback.

---

# 37. AI Failure Boundary

Jika AI gagal:

```text id="pa9c45"
Game Engine continues
Simulation continues
Core Actions continue
```

AI outage tidak boleh corrupt game state.

Possible fallback:

* predefined reactions,
* generic pet dialogue,
* retry.

---

# 38. Memory System

Memory System bertanggung jawab atas:

```text id="0ut0dr"
candidate validation
storage
deduplication
retrieval
superseding
archiving
forgetting
```

AI hanya mengusulkan candidate.

---

# 39. Memory Subcomponents

Conceptually:

```text id="3j1iqa"
Memory Extractor
Memory Store
Memory Retriever
Memory Maintenance
```

Memory Extractor dapat menggunakan AI.

Yang lain sebaiknya deterministic sebanyak mungkin.

---

# 40. Memory Retrieval Flow

```text id="1svwy6"
User Message
↓
Context Query
↓
Memory Retriever
↓
Metadata Filter
↓
Semantic Match
↓
Ranking
↓
Top Relevant Memories
```

---

# 41. Vector Search

Long-term semantic retrieval kemungkinan membutuhkan embeddings/vector search.

MVP options:

```text id="j6x7au"
Database with vector extension
or
dedicated vector store
```

Prefer satu database jika cukup.

Operational simplicity lebih penting.

---

# 42. Persistence Layer

Persistence bertanggung jawab atas database access.

Other modules sebaiknya tidak menulis query langsung secara sembarangan.

Conceptual repositories:

```text id="bva2un"
PetRepository
EventRepository
MemoryRepository
ConversationRepository
SkillRepository
```

---

# 43. Initial Data Groups

Primary persistent data:

```text id="bo4naq"
Users
Pets
Pet State
Personality
Growth
Skills
Events
Memories
Conversations
```

Detail schema akan dibahas di:

```text id="j1sn8d"
07-data-model.md
```

---

# 44. Database Strategy

Untuk MVP, prefer:

```text id="ufbzah"
single relational database
```

Potentially with:

```text id="codsnw"
JSON columns
vector extension
```

Advantages:

* transactions,
* relational integrity,
* simple operations,
* fewer moving parts.

---

# 45. Relational Database Fit

Game memiliki banyak relational data:

```text id="1gm9iy"
User → Pets
Pet → Skills
Pet → Events
Pet → Memories
Pet → Conversations
```

Relational database cocok untuk MVP.

---

# 46. Transaction Boundary

Game action sebaiknya atomic.

Example Play:

```text id="j0y4o5"
validate
↓
update pet state
↓
update Bond
↓
update personality
↓
insert PET_PLAYED event
↓
commit
```

Tidak boleh terjadi:

```text id="c71q8v"
state changed
but event missing
```

jika bisa dihindari.

---

# 47. Growth Transaction

Growth lebih penting lagi untuk atomicity.

```text id="8as08s"
update stage
+
insert PET_GREW
+
unlock Search
+
insert SKILL_UNLOCKED
+
update history
```

Harus diproses sebagai satu logical transaction.

---

# 48. Concurrency

Potential issue:

User membuka app di dua device.

Dua action dapat terjadi hampir bersamaan.

Backend harus menangani concurrency.

Possible approaches:

```text id="scsawh"
database transaction
optimistic locking
state version
```

---

# 49. State Version

Pet state dapat memiliki:

```text id="tkcedo"
version
```

Setiap mutation:

```text id="s7p7qe"
version += 1
```

Client dapat mendeteksi stale state.

---

# 50. Idempotency

Action request sebaiknya memiliki:

```text id="rpwe3s"
actionId
```

Jika network retry mengirim action yang sama:

backend dapat mengenali duplicate.

Important for:

```text id="6b2myz"
Feed
Play
Growth
Tool execution
```

---

# 51. API Boundary

Client hanya berkomunikasi dengan Backend API.

Client tidak langsung memanggil:

```text id="w9t2es"
LLM provider
database
Search provider
```

Backend menjaga:

* secrets,
* authorization,
* state integrity.

---

# 52. Conceptual API Areas

Future API surface:

```text id="m2fksu"
/pet
/actions
/chat
/memories
/skills
/profile
```

Detail endpoint akan dibahas di:

```text id="gvzbzt"
08-api-design.md
```

---

# 53. Core Action Request Flow

Example Feed:

```text id="gexwwt"
Client
↓
POST Feed
↓
Backend
↓
Load Pet
↓
Simulate Until Now
↓
Game Engine Validate
↓
Apply Feed
↓
Persist State + Event
↓
Generate Reaction
↓
Return Updated Pet Snapshot
```

---

# 54. Chat Request Flow

```text id="43o4rn"
Client
↓
Send User Message
↓
Backend
↓
Load Pet
↓
Simulate Until Now
↓
Retrieve Memories
↓
Build AI Context
↓
Interpret User Message
↓
Validate Proposed Action
↓
Execute Game Action if needed
↓
Execute Tool if authorized
↓
Update State / Events
↓
Build Final Context
↓
Generate Pet Response
↓
Process Memory Candidates
↓
Persist Conversation
↓
Return Response
```

---

# 55. Chat Does Not Need One Giant LLM Call

Architecture should allow multiple strategies.

Simple:

```text id="i23emw"
single structured call
```

More reliable:

```text id="r7dg2x"
interpretation call
↓
game/tool resolution
↓
response call
```

For MVP, reliability should be favored over cleverness.

---

# 56. Button Action Flow

Button action is cheaper.

Example Play:

```text id="bjvz7g"
Client taps Play
↓
Game Engine
↓
State update
↓
Event
↓
optional lightweight AI reaction
```

No intent interpretation required.

---

# 57. Tool Engine

Tool Engine exposes external capabilities.

MVP:

```text id="ltfp5r"
Search
```

Future:

```text id="f5q9b6"
Reminder
Calendar
Notes
Research
```

---

# 58. Tool Engine Responsibilities

Tool Engine handles:

```text id="7iie7a"
input validation
authorization
provider invocation
timeouts
errors
normalized result
audit event
```

AI does not directly call arbitrary APIs.

---

# 59. Tool Registry

Conceptually:

```text id="gg6h45"
ToolRegistry
├── SEARCH
├── REMINDER [Future]
├── CALENDAR [Future]
└── ...
```

Each tool defines:

```text id="80qb2r"
required skill
input schema
output schema
permission level
```

---

# 60. Search Tool

Search Tool input:

```text id="xy0wkh"
query
optional filters
```

Output normalized to:

```text id="8mih14"
results
sources
snippets
metadata
```

AI receives normalized result.

---

# 61. Tool Grounding

AI factual response after tool execution must use tool result.

Flow:

```text id="hwcfk0"
Tool Result
↓
AI Context
↓
Grounded Summary
```

Never:

```text id="xo9272"
tool failed
↓
AI invents answer
```

---

# 62. Tool Timeout

Tool Engine must handle external API latency.

Potential result:

```text id="ex0q3a"
SUCCESS
FAILED
TIMEOUT
RATE_LIMITED
```

AI reacts based on real outcome.

---

# 63. Read-Only First

MVP tool is intentionally read-only.

Search does not modify external systems.

This avoids early complexity around:

```text id="1y5gjo"
permissions
confirmation
undo
side effects
```

---

# 64. Future Write Tools

Reminder or Calendar will require stronger flow:

```text id="yf6dx5"
AI proposes action
↓
system validates
↓
user confirmation if required
↓
tool executes
↓
provider confirms
↓
pet reports success
```

Never report success before external confirmation.

---

# 65. Authentication

MVP should have application-level user identity.

Pet belongs to user.

Conceptually:

```text id="fqogum"
User
↓
Pet
```

Every API action validates ownership.

---

# 66. Authorization

Backend must ensure:

```text id="htq0ai"
user can only access own pet
```

Skill authorization is separate:

```text id="y437k7"
pet allowed to use Search?
```

Both checks matter.

---

# 67. Single Pet MVP

Even if data model supports multiple pets later, MVP can enforce:

```text id="xilrjs"
1 active pet / user
```

This simplifies experience.

Schema may still avoid assumptions that make multiple pets impossible later.

---

# 68. Session Model

Backend session may track:

```text id="4krjiz"
sessionStartedAt
lastInteractionAt
proactivePromptUsed
```

Useful for AI behavior such as:

```text id="3opm62"
maximum one major proactive prompt per session
```

---

# 69. Conversation Storage

Conversation history should be stored separately from long-term memory.

Data:

```text id="ejggcz"
conversation
messages
timestamps
role
metadata
```

Do not use raw conversation table as memory system.

---

# 70. Conversation Retention

Exact retention policy is product/privacy decision.

From architecture perspective, system should support:

```text id="a8e6sr"
conversation trimming
summary
deletion
```

Memory should remain independently manageable.

---

# 71. Event Storage

Event Log should be append-oriented.

Each event includes:

```text id="yn2yvv"
id
petId
type
timestamp
data
```

Events should be easy to query by:

```text id="1m0o2s"
pet
time range
type
```

---

# 72. Observability

Prototype should have strong debug visibility.

Need ability to inspect:

```text id="2r5yi2"
current pet state
lastSimulatedAt
events
personality values
growth eligibility
skills
memory retrieval
AI input
AI output
tool request/result
```

AI systems are otherwise difficult to debug.

---

# 73. Structured Logging

Backend logs should distinguish:

```text id="cr0vrv"
GAME
SIMULATION
AI
MEMORY
TOOL
API
```

Avoid relying only on freeform log strings.

---

# 74. Correlation ID

Each request can have:

```text id="f80d6k"
requestId
```

Complex chat flow may also use:

```text id="3vtl0q"
interactionId
```

All related logs share it.

This makes tracing easier.

---

# 75. Analytics vs Debug Events

Game Event Log and technical logs are different.

Game event:

```text id="sntt6w"
PET_PLAYED
```

Technical log:

```text id="s63t89"
AI_RESPONSE_PARSE_FAILED
```

Do not mix them.

---

# 76. Configuration

Game balance constants should live outside hardcoded domain logic.

Conceptual:

```text id="3g6t9s"
config/
├── needs
├── actions
├── mood
├── personality
├── growth
└── skills
```

Could initially be source-controlled constants.

---

# 77. Versioning Game Balance

Eventually pet state may need to know which balance version applies.

Possible:

```text id="2a44g0"
balanceVersion
```

Not mandatory for earliest prototype.

Useful once real players exist.

---

# 78. Domain Layer

Recommended backend separation:

```text id="7m3z69"
domain/
application/
infrastructure/
interfaces/
```

Conceptually:

`domain`

* game rules,
* entities,
* value objects.

`application`

* use cases,
* orchestration.

`infrastructure`

* database,
* AI provider,
* Search provider.

`interfaces`

* HTTP/API.

Exact framework can vary.

---

# 79. Example Module Structure

Conceptual:

```text id="bayzfd"
src/
├── modules/
│   ├── pet/
│   ├── game/
│   ├── growth/
│   ├── skills/
│   ├── events/
│   ├── ai/
│   ├── memory/
│   └── tools/
│
├── infrastructure/
│   ├── database/
│   ├── ai/
│   └── search/
│
└── api/
```

Do not over-nest too early.

---

# 80. Game Domain Should Be Framework-Agnostic

Core formulas should ideally not depend directly on:

```text id="73wm89"
HTTP
database ORM
React
LLM SDK
```

Example:

```text id="o01fbq"
applyPlayAction(state)
```

should be testable as pure domain logic.

---

# 81. Pure Functions Where Possible

Good candidate:

```text id="2wb4m2"
calculateHungerDecay()
calculateMood()
calculatePlayEffect()
evaluateGrowth()
```

Pure functions make balancing safer.

---

# 82. Side Effects Belong Outside Core Rules

Side effects:

```text id="6lzh0p"
database writes
AI calls
Search calls
logging
```

should not be mixed into calculation functions.

This improves testability.

---

# 83. Testing Architecture

Testing layers:

```text id="ylcdyb"
Unit Tests
↓
Domain Integration Tests
↓
API Tests
↓
AI Evaluation Tests
↓
End-to-End Tests
```

---

# 84. Game Engine Unit Tests

Should cover:

```text id="6co82k"
Feed effects
Play effects
Sleep recovery
decay
Bond cap
diminishing returns
mood priority
personality caps
growth eligibility
```

These should not call external APIs.

---

# 85. Simulation Tests

Use fixed clock.

Example:

```text id="633pbh"
initial time:
08:00

advance:
8 hours
```

Expected state can be asserted exactly.

Never depend on real current time inside unit tests.

---

# 86. Clock Abstraction

Backend should use conceptual:

```text id="91u8ri"
Clock.now()
```

instead of directly scattering:

```text id="7etgaw"
Date.now()
```

Benefits:

* time simulation,
* deterministic tests,
* debug mode.

---

# 87. Random Abstraction

Autonomous behavior may use randomness.

Use injectable random source.

Conceptual:

```text id="b8fkkj"
Random.next()
```

Testing can use seeded random.

---

# 88. AI Evaluation Tests

AI tests should focus on properties.

Example:

State:

```text id="6m321i"
Energy = 5
```

Expected:

```text id="3oqukn"
response should acknowledge tiredness
```

Not exact sentence match.

---

# 89. Memory Tests

Test:

```text id="jbeza2"
candidate extraction
deduplication
superseding
temporal expiration
retrieval
missing memory
```

Memory precision is especially important.

---

# 90. Tool Tests

Search tool tests should include:

```text id="xn3vkp"
success
empty result
timeout
provider failure
invalid query
locked skill
```

---

# 91. End-to-End Scenario

Important E2E scenario:

```text id="ve1eye"
Create Egg
↓
Hatch
↓
Name Momo
↓
Feed
↓
Play
↓
Talk
↓
Advance Time
↓
Return
↓
Grow to Child
↓
Create Memory
↓
Grow to Adult
↓
Unlock Search
↓
Use Search
```

This represents MVP journey.

---

# 92. Debug Architecture

Development environment should support debug endpoints/tools for:

```text id="ocdm6a"
advance time
set stats
set Bond
set personality
trigger growth
unlock skill
inspect memories
inspect events
```

These must be disabled in production.

---

# 93. Time Travel Debugging

Instead of changing system clock, developer may use:

```text id="z0jayv"
simulation offset
```

or injectable clock.

Example:

```text id="thq7uv"
+6 hours
+1 day
+14 days
```

Essential for testing virtual pet progression.

---

# 94. Security Boundary

External user input enters through:

```text id="ildbxy"
API
```

Must validate:

```text id="as1ayx"
IDs
message length
action types
tool parameters
```

AI output is also considered untrusted input.

---

# 95. Prompt Injection Awareness

Search content or user content may attempt to influence AI behavior.

Architecture should keep:

```text id="jngz39"
system rules
game state
tool output
user text
```

clearly separated in prompt/context structure.

External Search result must not be treated as trusted instructions.

---

# 96. Tool Result Sanitization

Tool Engine should normalize external results before AI consumption.

Avoid passing uncontrolled provider payloads directly if unnecessary.

Normalized search result:

```text id="vrox6n"
title
url/source
snippet
publishedAt
```

---

# 97. Secrets

API keys belong server-side.

Never expose:

```text id="mqt91k"
LLM keys
Search provider keys
database credentials
```

to client.

---

# 98. Rate Limiting

AI and Search are cost-sensitive.

Backend should eventually support:

```text id="7ix5s1"
per-user rate limits
tool usage limits
abuse protection
```

But rate limiting should not interfere with normal core pet actions.

---

# 99. Cost Boundary

Actions such as:

```text id="ejx2kz"
Feed
Play
Sleep
```

should ideally cost no AI invocation or only optional lightweight response generation.

Main AI cost should come from:

```text id="dxwe7u"
Talk
Memory Extraction
Search Summary
```

---

# 100. AI Cost Optimization

Potential optimizations:

```text id="ao0jjx"
templates for simple reactions
small model for classification
bounded conversation history
memory retrieval instead of full history
response caching where appropriate
```

Do not optimize prematurely at cost of experience.

---

# 101. Latency Budget Philosophy

Core care actions:

```text id="vleaw7"
should feel immediate
```

Conversation:

```text id="jruig3"
can tolerate thinking latency
```

Search:

```text id="ghm4wq"
can tolerate longer latency
```

UI should reflect task type.

---

# 102. Optimistic UI

Safe optimistic examples:

```text id="oql92p"
button animation
pet reaction animation
loading indicator
```

Be careful optimistic-updating authoritative stats before server confirmation.

If used:

client must reconcile with server response.

---

# 103. Cache Strategy

Client may cache pet snapshot for startup speed.

But after reconnect:

```text id="bj5zmu"
server simulation
↓
authoritative snapshot
↓
client reconcile
```

Offline client gameplay is not required for MVP.

---

# 104. Offline App vs Offline Pet

Important distinction:

```text id="tb7nfx"
Pet offline simulation
≠
app supports gameplay without internet
```

MVP can require network connection.

Pet still conceptually lives while user is absent.

---

# 105. Notifications

Notifications are future infrastructure concern.

For MVP, if implemented, notifications should come from deterministic conditions or scheduled events.

Not from autonomous LLM running in background.

---

# 106. Background Tasks

Potential later tasks:

```text id="2h99nu"
scheduled reminders
notification delivery
memory maintenance
analytics aggregation
```

These may eventually need workers/queues.

Do not introduce queue infrastructure before required.

---

# 107. Future Queue Boundary

If needed later:

```text id="krh2v0"
API
↓
Job Queue
↓
Worker
```

Good candidates:

* Reminder execution,
* heavy memory consolidation,
* long research tasks.

Not basic Feed/Play.

---

# 108. Scalability Philosophy

Initial scalability comes primarily from:

```text id="jrt93o"
stateless API
database indexing
bounded AI context
elapsed-time simulation
```

Not microservices.

---

# 109. Stateless Backend

Backend API instances should ideally not hold authoritative pet state in memory.

Persistent state remains in database.

This allows horizontal scaling later.

---

# 110. Database Index Priorities

Likely important indexes:

```text id="dg37r4"
pets.userId
events.petId + timestamp
memories.petId + status
messages.conversationId + timestamp
skills.petId + type
```

Vector index later for semantic memory.

---

# 111. Failure Recovery

Architecture should tolerate partial external failure.

## AI down

Core simulation works.

## Search down

Search reports failure.

## Memory retrieval failure

Conversation can continue without memory.

## Analytics failure

Game action should not fail.

---

# 112. Critical vs Non-Critical Components

Critical:

```text id="k13qjy"
database
Game Engine
pet state
```

Important but degradable:

```text id="32e94r"
AI
Memory Retrieval
Search
Analytics
```

This prioritization informs error handling.

---

# 113. Interaction Transaction Strategy

Chat can involve slow external calls.

Do not keep database transaction open during LLM/Search calls.

Recommended:

```text id="fjfuka"
Load + simulate
↓
commit simulation
↓
AI interpretation
↓
execute game mutation in short transaction
↓
tool call
↓
persist final conversation/events
```

Need careful concurrency handling.

---

# 114. State Revalidation

Because AI call can take time, proposed game action should be revalidated against latest state before mutation.

Example:

```text id="eipjq3"
AI proposes PLAY
↓
state may have changed
↓
reload / lock
↓
validate PLAY
```

Important with multi-device concurrency.

---

# 115. Interaction ID

Complex chat request can use unique:

```text id="5ah526"
interactionId
```

Link:

```text id="1jv2uq"
user message
AI interpretation
game action
tool request
pet response
memory candidates
```

Excellent for debugging.

---

# 116. Suggested Runtime Boundaries

Conceptually:

```text id="rx7asi"
HTTP Controller

↓ Application Use Case

ChatWithPetUseCase

↓
Simulation Engine
Context Builder
AI Interpreter
Game Engine
Tool Engine
Memory System

↓
Repositories / Providers
```

Controller should stay thin.

---

# 117. Example Chat Use Case

Pseudo-flow:

```text id="dukrda"
chatWithPet(userId, petId, message)

1. authorize pet ownership
2. simulate pet to now
3. build interpretation context
4. interpret message
5. validate/execute proposed action
6. execute authorized tool if any
7. recalculate pet state
8. retrieve/update context
9. generate character response
10. process memory candidates
11. persist conversation/events
12. return snapshot + response
```

---

# 118. Example Feed Use Case

```text id="k08z9g"
feedPet(userId, petId)

1. authorize
2. simulate to now
3. validate FEED
4. apply Feed rules
5. persist state
6. insert PET_FED
7. optionally generate reaction
8. return pet snapshot
```

Simple actions should remain simple.

---

# 119. Domain Events vs Persistent Events

Inside code, Game Engine may emit domain events.

Example:

```text id="kjmx5n"
PetFed
PetGrew
```

Application layer maps them to persistent Event Log records.

This keeps domain clean.

---

# 120. Event-Driven Internal Design

Modules can react to domain events.

Example:

```text id="6z3erx"
PET_GREW
↓
Skill System
↓
Unlock Search
```

Or:

```text id="jrvof4"
PET_GREW
↓
Memory System
↓
Create relationship memory
```

This can remain in-process.

No message broker needed.

---

# 121. Internal Event Dispatcher

Optional lightweight component:

```text id="qr1cfv"
DomainEventDispatcher
```

All synchronous during MVP.

Future can migrate specific events to async jobs if needed.

---

# 122. Architectural Boundaries

## Game Engine owns

```text id="bw7n5j"
rules
state mutations
derived state
```

## Growth System owns

```text id="l4vx5q"
stage progression
```

## Skill System owns

```text id="y07af1"
capability authorization
```

## AI Engine owns

```text id="tlj7zb"
interpretation
character expression
```

## Memory System owns

```text id="t7cuk8"
remembering
retrieval
forgetting
```

## Tool Engine owns

```text id="6jyt54"
external capabilities
```

## Persistence owns

```text id="a5rz6r"
storage
```

---

# 123. Forbidden Coupling

Avoid architecture such as:

```text id="plz05z"
LLM
↓
direct database mutation
```

or:

```text id="xp68kh"
Search Tool
↓
change Bond
```

or:

```text id="vs18wi"
Client
↓
unlock skill locally
```

All cross-system effects must pass defined boundaries.

---

# 124. Technical Stack Decision

This document intentionally does not lock final technologies yet.

Technology choice should follow architecture requirements.

Need:

```text id="25yvvp"
frontend framework
backend runtime
database
ORM/query layer
LLM provider
Search provider
vector capability
deployment platform
```

These decisions should be recorded later in:

```text id="3nzl73"
10-decisions.md
```

---

# 125. Stack Selection Criteria

Choose stack based on:

```text id="nljap7"
developer productivity
familiarity
type safety
testing
database support
AI SDK support
deployment simplicity
cost
```

Avoid choosing infrastructure because it looks architecturally impressive.

---

# 126. MVP Architecture

Minimum viable architecture:

```text id="we5uqw"
Client

↓ HTTP

Backend

├── Game Module
├── AI Module
├── Memory Module
├── Skill Module
├── Tool Module
└── Persistence Module

↓
Relational Database

Backend
├── LLM API
└── Search API
```

This is enough for MVP.

---

# 127. Architecture Evolution

Possible later evolution:

```text id="0azrdb"
MVP
Monolith

↓

Higher Load

Background Worker
Notifications

↓

Complex Skills

Async Job System

↓

Heavy AI Workflows

Dedicated AI/Agent Workers
```

Evolution should be driven by actual need.

---

# 128. Recommended Build Order

Architecture implementation order:

```text id="99nmwk"
1. Domain Pet State

2. Game Engine

3. Simulation Engine

4. Event System

5. Persistence

6. Basic API

7. Growth System

8. Skill System

9. AI Integration

10. Memory System

11. Search Tool

12. Full Chat Orchestration
```

This preserves dependency direction.

---

# 129. Prototype Architecture

Prototype 0.1 can be even simpler:

```text id="nrpgnu"
Frontend
↓
Game Engine
↓
Local / Simple Persistence
```

No AI yet.

But production architecture should keep domain logic portable to backend.

---

# 130. Avoid Frontend-Only Game Engine Lock-In

Even if prototype begins in frontend, game rules should live in portable modules.

This avoids rewriting everything when backend becomes authoritative.

Prefer:

```text id="qf0n5a"
shared pure TypeScript game domain
```

if chosen stack allows it.

Technology decision comes later.

---

# 131. Architecture Testing Goal

We should be able to instantiate Game Engine in a test without:

```text id="4op6mz"
database
web server
LLM
Search
```

Example:

```text id="lxesp1"
given pet state
when Play
then expected state
```

This is a key architecture quality test.

---

# 132. AI Replacement Test

Architecture should allow:

```text id="28nxqz"
AI Provider A
↓
AI Provider B
```

without:

* losing pet memories,
* resetting personality,
* changing game state model.

If changing model changes who the pet fundamentally is, boundaries are wrong.

---

# 133. Search Replacement Test

Likewise:

```text id="qz1c7m"
Search Provider A
↓
Search Provider B
```

should not affect Skill System.

Tool Engine abstracts provider differences.

---

# 134. Database Migration Principle

Persistent models will evolve.

Schema migrations must preserve:

```text id="e4235r"
pet state
memory
growth history
skill history
```

These represent player investment.

---

# 135. Data Ownership

User-owned relationship data includes:

```text id="lne4c8"
pet
memories
conversation history
relationship progression
```

Architecture should eventually support deletion/export requirements.

Exact product/privacy design comes later.

---

# 136. MVP Technical Definition of Done

Technical architecture is sufficient for MVP when:

1. Client can load authoritative pet state.
2. Backend simulates elapsed time.
3. Game actions are validated server-side.
4. State mutations are atomic.
5. Event Log records meaningful actions.
6. Growth is server-authoritative.
7. Skill ownership is server-authoritative.
8. AI cannot mutate game state directly.
9. AI structured output is validated.
10. AI failure does not corrupt game state.
11. Memory can persist independently from chat history.
12. Memory retrieval can provide bounded context.
13. Search cannot execute unless Search skill is unlocked.
14. Search result is passed back to AI as grounded tool data.
15. Tool failure cannot become fabricated success.
16. Debug mode can inspect all major systems.
17. Time can be accelerated during development.
18. Core domain logic can be unit-tested without infrastructure.
19. Duplicate requests cannot trivially duplicate important mutations.
20. Architecture can evolve without replacing the pet's persistent identity.

---

# 137. Architecture North Star

The architecture must protect the idea that:

```text id="deglxd"
Game State
=
Reality

Memory
=
History

Personality
=
Behavioral Tendencies

AI
=
Voice + Interpretation

Skills
=
Authorized Capabilities

Tools
=
Execution
```

The systems collaborate, but their responsibilities remain separate.

The result should behave as one coherent character without turning the backend into one giant AI prompt.

---

# 138. Final Architecture Summary

```text id="x21d8n"
                         PLAYER
                           │
                           ▼
                        CLIENT
                           │
                           ▼
                      BACKEND API
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
         GAME ENGINE   AI ORCHESTRATOR  TOOL ENGINE
             │             │             │
             │             │             └── Search
             │             │
       ┌─────┼─────┐       ▼
       │     │     │   CONTEXT BUILDER
       │     │     │       │
       ▼     ▼     ▼       ├── Pet State
 Simulation Growth Skills  ├── Personality
       │     │     │       ├── Recent Events
       │     │     │       ├── Memories
       │     │     │       └── Skills
       │     │     │
       └─────┴─────┴──────────────┐
                                  ▼
                             PERSISTENCE
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
              PETS              EVENTS           MEMORIES
                │                                   │
                ▼                                   ▼
             SKILLS                           CONVERSATIONS
```

One system defines the world.

One system remembers it.

One system gives it a voice.

That separation is what keeps the pet alive without letting the AI become the laws of physics.
