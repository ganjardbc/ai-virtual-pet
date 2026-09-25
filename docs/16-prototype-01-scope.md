# Prototype 0.1 Scope

## 1. Purpose

Dokumen ini mendefinisikan scope resmi **Prototype 0.1** untuk AI Virtual Pet.

Prototype 0.1 merupakan prototype pertama yang dapat dimainkan.

Tujuannya bukan membangun seluruh produk dalam versi kecil.

Tujuannya adalah menjawab pertanyaan fundamental:

> **Can the pet feel alive before we add AI?**

Prototype harus membuktikan bahwa kombinasi:

```text
persistent state
+
time
+
needs
+
autonomous behavior
+
player actions
+
character reactions
```

sudah dapat menciptakan dasar virtual pet yang believable.

Jika pet belum terasa hidup tanpa LLM, menambahkan AI hanya akan menutupi masalah fundamental.

---

# 2. Prototype Hypothesis

Primary hypothesis:

> **A deterministic pet simulation with persistent state, elapsed-time simulation, autonomous behavior, and expressive reactions can already create a meaningful sense that the pet has a life of its own.**

Secondary hypotheses:

1. Player dapat memahami kebutuhan pet tanpa bergantung pada raw numbers.
2. Feed, Play, dan Sleep terasa seperti interaction dengan character, bukan manipulasi stat.
3. Kondisi pet berubah secara masuk akal ketika waktu berlalu.
4. Return experience membuat player penasaran terhadap apa yang terjadi selama mereka pergi.
5. Long absence tidak menghasilkan pengalaman yang menghukum atau guilt-driven.

---

# 3. Prototype Question

Prototype 0.1 terutama harus menjawab:

> **Does the pet feel alive?**

Bukan:

```text
Is the AI smart?
```

Bukan:

```text
Does memory work?
```

Bukan:

```text
Is Search useful?
```

Bukan:

```text
Is growth satisfying?
```

Pertanyaan tersebut akan diuji pada prototype berikutnya.

---

# 4. Experience Principles Under Test

Prototype 0.1 terutama menguji empat Product Experience Principles:

```text
The Pet Lives Between Visits

Behavior Before Numbers

Every Meaningful Action Deserves a Reaction

Care Without Guilt
```

Supporting principles:

```text
Character First, Assistant Second

Convenience Removes Friction, Not Character

Protect the Illusion Without Lying
```

---

# 5. Prototype Player Fantasy

Walaupun sangat sederhana, player harus dapat merasakan:

> **“Aku punya makhluk kecil yang hidup dan perlu aku perhatikan.”**

Bukan:

> **“Aku sedang menguji simulator angka.”**

Debug Mode memang memperlihatkan simulator tersebut.

Player Mode harus menyembunyikan machinery secukupnya agar character tetap menjadi pusat experience.

---

# 6. Prototype Lifecycle Scope

Prototype 0.1 hanya membutuhkan:

```text
Egg
 ↓
Hatch
 ↓
Name
 ↓
Baby
```

Prototype tidak membutuhkan:

```text
Child
Adult
```

sebagai playable production-quality stages.

Growth system belum menjadi focus Prototype 0.1.

---

# 7. Prototype Start

Normal first-time flow:

```text
Launch
 ↓
Egg
 ↓
Hatch
 ↓
Name Pet
 ↓
Pet Home
```

Development/debug flow dapat menyediakan shortcut langsung menuju Baby Pet.

---

# 8. Egg Scope

Egg merupakan onboarding experience sederhana.

Required behavior:

* visible egg,
* subtle idle movement,
* player dapat memulai hatch,
* hatch transition terjadi,
* Baby Pet muncul.

Egg tidak membutuhkan:

* needs simulation,
* autonomous behavior,
* AI,
* conversation,
* personality.

---

# 9. Hatch Scope

Hatch merupakan deterministic milestone.

Required:

```text
Egg
 ↓
Hatch Trigger
 ↓
Hatch Reaction / Transition
 ↓
Baby Appears
```

System menghasilkan event:

```text
PET_HATCHED
```

Hatch harus terasa seperti moment, bukan form submission.

---

# 10. Naming Scope

Setelah hatch:

```text
Baby appears
 ↓
Naming prompt
 ↓
Player enters name
 ↓
Name persisted
 ↓
Pet reacts
 ↓
Pet Home
```

Required validation:

* non-empty name,
* reasonable maximum length,
* whitespace normalization.

Exact naming rules dapat tetap sederhana.

---

# 11. Pet Home

Pet Home merupakan primary gameplay screen.

Required visual hierarchy:

```text
Pet Identity
      ↓
Pet / Habitat
      ↓
Current Reaction / Condition
      ↓
Core Actions
      ↓
Supporting Status
```

Pet harus mendapatkan visual space terbesar.

---

# 12. Pet Identity

Pet Home minimal menampilkan:

```text
Pet Name
```

Stage dapat ditampilkan jika berguna, tetapi bukan requirement visual utama.

Raw internal ID tidak pernah tampil di Player Mode.

---

# 13. Pet Visual

Prototype menggunakan satu Baby Pet.

Pet harus memiliki cukup visual state untuk mengkomunikasikan:

```text
Neutral
Happy
Hungry
Sleepy
Excited
```

Tidak membutuhkan production-quality animation.

Allowed prototype techniques:

```text
pose swapping
simple CSS animation
sprite changes
simple transforms
small animation loops
```

Readability lebih penting daripada polish.

---

# 14. Habitat

Pet Home memiliki simple habitat.

Minimum:

```text
Pet Space
Rest / Sleep Area
Basic environmental context
```

Optional if cheap:

```text
Food Area
Play Object
```

Environment tidak perlu interactive sebagai independent game system.

Tujuannya adalah memberi pet sebuah tempat untuk hidup.

---

# 15. Authoritative Pet State

Prototype menggunakan authoritative state:

```text
Hunger
Energy
Happiness
Bond

currentActivity

lastInteractionAt
lastSimulatedAt
sleepStartedAt
```

Stats berada pada range:

```text
0–100
```

Internal Hunger semantics tetap:

```text
100 = full
0 = very hungry
```

Player-facing UI tidak boleh menyebut angka tinggi tersebut sebagai "more hungry".

Jika ditampilkan kepada player, gunakan konsep:

```text
Fullness
```

atau descriptive state.

---

# 16. Initial State

Prototype harus memiliki deterministic/default initial Baby state.

Exact values dapat menjadi configuration.

Example conceptual state:

```text
Hunger      healthy
Energy      healthy
Happiness   healthy
Bond        low initial relationship

Activity    IDLE
```

Nilai final berada di simulation configuration, bukan tersebar di UI.

---

# 17. Core Needs

Prototype mengimplementasikan:

```text
Hunger
Energy
Happiness
```

sebagai active needs.

Bond disimpan tetapi bukan primary survival need.

---

# 18. Hunger Simulation

Initial balancing hypothesis:

While awake:

```text
Hunger -2 / hour
```

While sleeping:

```text
Hunger -1 / hour
```

Nilai dapat di-tune setelah scenario testing.

Hunger tidak boleh turun di bawah:

```text
0
```

---

# 19. Energy Simulation

While awake:

```text
Energy -1.5 / hour
```

While sleeping:

```text
Energy +12 / hour
```

Energy selalu clamped:

```text
0–100
```

---

# 20. Happiness Simulation

Happiness tidak mengalami passive decay konstan.

Happiness dapat menurun karena prolonged severe unmet needs.

Initial constraint:

```text
maximum passive happiness penalty
≈ -12 / day
```

Tujuannya menghindari punishment spiral.

Exact formula dapat ditentukan di implementation plan berdasarkan game-system rules.

---

# 21. Bond Simulation

Tidak ada passive Bond decay.

Prototype menyimpan Bond agar action rules dan future progression tetap kompatibel.

Player Mode tidak perlu menampilkan raw Bond.

---

# 22. Core Player Actions

Prototype 0.1 memiliki tiga functional care actions:

```text
Feed
Play
Sleep
```

Talk dapat terlihat sebagai placeholder jika diperlukan untuk menguji layout, tetapi bukan functional system Prototype 0.1.

---

# 23. Feed

Required flow:

```text
Player selects Feed
 ↓
Backend validates
 ↓
Elapsed time simulated
 ↓
Feed action applied
 ↓
State persisted
 ↓
Event generated
 ↓
Pet reacts
 ↓
Updated snapshot displayed
```

Base balancing:

```text
Hunger      +25
Happiness   +2
Bond        +0.3
```

Diminishing return berlaku jika pet sudah sangat full.

Exact formula berasal dari Game Systems configuration.

---

# 24. Feed Feedback

Feed harus memiliki character feedback.

Minimum:

```text
Eating reaction
+
post-action expression
```

Jika pet sudah sangat full, reaction harus berbeda.

Avoid:

```text
Feed successful!
```

sebagai primary feedback.

---

# 25. Play

Required flow:

```text
Player selects Play
 ↓
Backend validates Energy
 ↓
Play applied or rejected
 ↓
State persisted if applicable
 ↓
Event generated
 ↓
Pet reacts
```

Base balancing:

```text
Happiness   +12
Energy      -10
Hunger      -4
Bond        +1
```

Requirement:

```text
Energy > 15
```

untuk normal Play.

---

# 26. Play Diminishing Returns

Repeated Play menggunakan diminishing return.

Initial multipliers:

```text
1st   1.00
2nd   0.75
3rd   0.50
4th+  0.25
```

Implementation membutuhkan definition window yang jelas.

Window exact akan dikunci dalam implementation plan.

Prototype harus memungkinkan scenario ini diuji secara deterministic.

---

# 27. Play Rejection

Jika pet terlalu lelah:

```text
PLAY
 ↓
Domain Rejection
 ↓
No invalid state mutation
 ↓
Pet shows tired/refusal reaction
```

Player tidak melihat raw domain error sebagai primary feedback.

Debug Mode dapat menampilkan rejection reason.

---

# 28. Sleep

Sleep merupakan persistent activity.

Flow:

```text
Sleep
 ↓
currentActivity = SLEEPING
 ↓
sleepStartedAt recorded
 ↓
Pet enters sleep state
```

Selama sleeping:

```text
Energy recovers
Hunger decays more slowly
```

Pet dapat auto-wake ketika condition terpenuhi.

---

# 29. Wake Behavior

Prototype harus mendukung wake transition.

Wake dapat terjadi karena:

* sufficient Energy,
* maximum sleep duration,
* debug action.

Exact automatic wake threshold harus configurable.

Wake menghasilkan event jika relevant.

---

# 30. Current Activity

Minimum activity set:

```text
IDLE
SLEEPING
PLAYING_ALONE
RESTING
LOOKING_AROUND
WAITING
```

Tidak semua activity membutuhkan complex animation.

Prototype cukup menggunakan visual state atau short loop.

---

# 31. Autonomous Behavior

Pet harus dapat melakukan limited autonomous behavior ketika waktu berlalu.

Required candidate behaviors:

```text
Sleep
Rest
Play Alone
Look Around
Wait
```

Optional:

```text
Small Snack
Think
```

Autonomous behavior tidak menggunakan LLM.

---

# 32. Autonomous Decision Rules

Autonomous behavior harus berasal dari:

```text
state
+
rules
+
controlled randomness
```

Bukan arbitrary frontend animation.

Jika simulation menghasilkan:

```text
PLAYING_ALONE
```

UI boleh menunjukkan pet bermain sendiri.

UI tidak boleh secara independen mengarang bahwa pet bermain jika simulation mengatakan pet tidur.

---

# 33. Randomness

Random behavior harus menggunakan injectable:

```ts
interface Random {
  next(): number;
}
```

Production dapat menggunakan standard random implementation.

Tests menggunakan deterministic/seeded random.

Game logic tidak menggunakan uncontrolled:

```ts
Math.random()
```

---

# 34. Time

Semua domain time menggunakan injectable:

```ts
interface Clock {
  now(): Date;
}
```

Production:

```text
SystemClock
```

Tests/debug:

```text
FakeClock
```

Game domain tidak boleh memiliki hidden direct dependency terhadap:

```ts
Date.now()
```

---

# 35. Elapsed-Time Simulation

Simulation core:

```text
previous state
+
elapsed duration
+
rules
+
controlled random
 ↓
new state
+
generated events
```

Conceptual API:

```ts
simulateElapsedTime(
  state,
  duration,
  rules,
  random
)
```

Simulation Engine harus pure domain logic.

Tidak bergantung pada:

* browser,
* React,
* Fastify,
* PostgreSQL,
* Drizzle,
* LLM,
* Search provider.

---

# 36. Offline Simulation

Ketika pet dimuat:

```text
now - lastSimulatedAt
 ↓
simulate elapsed time
 ↓
persist updated state
 ↓
return current snapshot
```

Simulation tidak berjalan terus-menerus ketika player offline.

---

# 37. Simulation Horizon

Detailed simulation tidak perlu berjalan step-by-step tanpa batas.

Initial target:

```text
detailed simulation
≤ approximately 48 hours
```

Untuk elapsed duration yang lebih panjang:

```text
summary / approximation
```

dapat digunakan.

Prototype harus dapat mensimulasikan:

```text
hours
days
weeks
```

tanpa performance issue signifikan.

---

# 38. Long Absence

Required scenario:

```text
Player leaves pet
 ↓
7+ days pass
 ↓
Player returns
```

Expected:

* pet still exists,
* no death,
* no permanent damage,
* no passive Bond loss,
* needs reflect elapsed time,
* pet may be hungry/tired/etc.,
* return remains recoverable.

Long absence merupakan required playtest case.

---

# 39. Mood

Mood merupakan derived state.

Prototype minimum moods:

```text
Neutral
Happy
Hungry
Sleepy
Excited
Bored
```

Optional if rules are ready:

```text
Lonely
Curious
```

Mood bukan authoritative database field kecuali cached for presentation.

---

# 40. Mood Stability

Mood tidak boleh flicker setiap kali stat berubah sedikit.

Mood calculation membutuhkan:

* scoring/priority,
* threshold,
* persistence/hysteresis where useful.

Exact algorithm dapat diimplementasikan sederhana pada Prototype 0.1.

Requirement utama:

> Pet tidak terlihat mengganti emosi secara acak.

---

# 41. Player-Facing Need Presentation

Raw numbers tidak menjadi primary Player UI.

Prototype harus menguji descriptive presentation.

Possible starting vocabulary:

### Fullness

```text
Very Hungry
Hungry
Okay
Full
Very Full
```

### Energy

```text
Exhausted
Tired
Okay
Energetic
```

### Happiness

```text
Low
Okay
Happy
Very Happy
```

Exact copy dapat berubah saat wireframe.

---

# 42. Character Reaction System

Prototype membutuhkan presentation mapping:

```text
Game State / Event
 ↓
Reaction
```

Examples:

```text
PET_FED
→ eating reaction

PET_PLAYED
→ excited reaction

PLAY_REJECTED_LOW_ENERGY
→ tired refusal

PET_STARTED_SLEEPING
→ sleep transition

PET_WOKE_UP
→ wake reaction

HUNGRY_STATE
→ hungry idle

SLEEPY_STATE
→ sleepy idle
```

Reaction System pada Prototype 0.1 dapat deterministic.

Tidak membutuhkan LLM.

---

# 43. Reaction Priority

Jika beberapa signals tersedia sekaligus, presentation harus memiliki priority.

Example:

```text
Immediate Action Reaction
        >
Important State Change
        >
Current Mood
        >
Default Idle
```

Ini mencegah reaction saling menimpa secara membingungkan.

---

# 44. Events

Prototype menggunakan append-oriented Event Log.

Required event categories dapat mencakup:

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

Event names final mengikuti domain conventions saat implementation.

---

# 45. Event Purpose

Events digunakan untuk:

```text
debugging
recent activity
future memory integration
playtesting
```

Event Log bukan full event sourcing.

Current State tetap authoritative.

---

# 46. Return Experience

Return experience merupakan required Prototype 0.1 feature.

Ketika player kembali:

```text
Load
 ↓
Simulate elapsed time
 ↓
Observe current pet
 ↓
Optional relevant recent activity
```

Player harus dapat melihat bahwa sesuatu telah berubah.

---

# 47. Recent Activity

Prototype boleh menampilkan lightweight recent activity.

Contoh:

```text
While you were away...

• Slept for a while
• Played alone
```

Tetapi ini bukan permanent activity dashboard.

Wireframe akan menentukan apakah informasi lebih baik muncul melalui:

* short recap,
* environment,
* dialogue-like reaction,
* combination.

---

# 48. Persistence

Prototype membutuhkan real persistence.

Minimum persisted entities:

```text
Pet
PetState
Event
```

Additional entities dapat digunakan jika implementation mengikuti existing data model.

Prototype tidak membutuhkan:

```text
Memory
Conversation
Message
PetSkill
```

sebagai functional systems.

Schema boleh mempersiapkan future compatibility, tetapi jangan membangun behavior yang belum diperlukan.

---

# 49. Backend Authority

Backend merupakan source of truth.

Frontend mengirim:

```text
intent
```

Backend menentukan:

```text
validity
state mutation
events
result
```

Frontend tidak menghitung authoritative stat changes sendiri.

---

# 50. Pet Snapshot

Setelah state-changing action, backend mengembalikan authoritative PetSnapshot.

Conceptually:

```ts
{
  pet,
  state,
  derived,
  reaction,
  recentEvents?
}
```

Exact contract mengikuti API implementation.

---

# 51. API Scope

Prototype membutuhkan subset API yang relevan.

Minimum conceptual endpoints:

```text
POST /api/v1/pet

GET /api/v1/pet

POST /api/v1/pet/hatch

PATCH /api/v1/pet/name

POST /api/v1/pet/actions
```

Debug routes dapat ditambahkan secara terpisah.

---

# 52. Prototype Action Types

Required:

```text
FEED
PLAY
SLEEP
```

Optional internal/debug:

```text
WAKE
```

Not required:

```text
TALK
SEARCH
```

---

# 53. Player Screens

Prototype 0.1 membutuhkan empat player-facing states/screens:

```text
1. Egg

2. Naming

3. Pet Home

4. Sleeping State
```

Hatch dapat menjadi transition di antara Egg dan Naming.

Sleeping State dapat berupa variation dari Pet Home, bukan route terpisah.

---

# 54. Debug Mode

Prototype membutuhkan Debug Mode.

Debug Mode bukan optional polish.

Ia merupakan core development tool.

Debug Mode harus memperlihatkan:

```text
Hunger
Energy
Happiness
Bond

currentActivity
derived Mood

lastInteractionAt
lastSimulatedAt
sleepStartedAt

recent events
```

Jika personality/growth field sudah ada di schema, boleh ditampilkan tetapi tidak wajib.

---

# 55. Time Travel Controls

Required:

```text
+1 hour
+6 hours
+12 hours
+1 day
+3 days
+7 days
```

Setiap action:

```text
advance fake/debug time
 ↓
run simulation
 ↓
persist state
 ↓
refresh UI
```

Ini merupakan salah satu feature terpenting Prototype 0.1.

---

# 56. Additional Debug Actions

Required:

```text
Reset Pet
Force Sleep
Wake Pet
```

Recommended:

```text
Set Hunger
Set Energy
Set Happiness
```

Optional:

```text
Set Bond
Force Activity
Set Random Seed
```

Debug operations tidak boleh tersedia di production player experience.

---

# 57. Debug / Player Separation

Debug controls harus secara visual dan architectural terpisah dari normal Player Mode.

Player should never accidentally interpret:

```text
+7 days
```

sebagai normal game mechanic.

---

# 58. Technical Stack

Prototype 0.1 menggunakan frozen stack:

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

# 59. Repository Scope

Expected structure:

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

Exact internal folders dapat berkembang saat implementation plan.

---

# 60. Domain Boundary

`packages/domain` tidak boleh bergantung pada:

```text
React
Vite
Fastify
Drizzle
PostgreSQL
LLM provider
Search provider
```

Domain berisi concepts dan rules.

---

# 61. Simulation Boundary

`packages/simulation` tidak boleh bergantung pada:

```text
React
Fastify
Database
HTTP
LLM
Search
```

Simulation harus dapat dijalankan langsung melalui tests.

---

# 62. API Responsibility

Fastify berfungsi sebagai orchestration layer.

Typical flow:

```text
Request
 ↓
Validate input
 ↓
Load pet
 ↓
Simulate elapsed time
 ↓
Apply domain action
 ↓
Persist
 ↓
Append events
 ↓
Return PetSnapshot
```

Game rules tidak ditulis langsung di route handler.

---

# 63. Database Responsibility

PostgreSQL menyimpan authoritative persisted state.

Drizzle berada di infrastructure layer.

Domain logic tidak bergantung langsung pada ORM models.

Repository abstraction digunakan di antara domain/application logic dan persistence.

---

# 64. Prototype Testing Scope

Prototype membutuhkan automated tests untuk:

```text
Domain Rules
Simulation
Scenario Tests
API
```

UI automated tests bukan priority awal kecuali murah untuk critical flows.

---

# 65. Required Domain Tests

Minimum:

```text
Feed modifies state correctly

Feed clamps values

Play modifies state correctly

Play rejected when Energy too low

Sleep enters sleeping activity

Sleep recovery works

Wake works

No stat leaves 0–100 range
```

---

# 66. Required Simulation Tests

Minimum:

```text
1 hour awake

6 hours awake

12 hours awake

24 hours

48 hours

7 days

sleep duration

auto wake

severe unmet needs

long absence
```

Simulation tests menggunakan FakeClock / deterministic duration dan controlled Random.

---

# 67. Required Scenario Tests

Prototype harus memiliki scenario-level tests untuk beberapa player archetypes.

### Daily Active Player

```text
opens daily
feeds
plays
sleeps
```

### Frequent Player

```text
many interactions per day
```

### Overfeeding Player

```text
repeated Feed
```

### Hyperactive Player

```text
repeated Play
```

### Sleep-Heavy Pet

```text
frequent low Energy
```

### Casual Player

```text
returns every few days
```

### Long Absence Player

```text
returns after 7+ days
```

---

# 68. Simulation Invariants

Prototype simulation harus menjaga invariants:

```text
0 <= stats <= 100

Bond never decays passively

Pet never dies

Time never moves backward through normal simulation

lastSimulatedAt moves forward

Sleeping recovers Energy

No impossible state mutation after rejected action
```

Additional invariants dapat ditemukan selama implementation.

---

# 69. Performance Expectation

Prototype tidak membutuhkan production-scale optimization.

Namun:

```text
+7 days
```

debug simulation harus terasa cepat.

Simulation tidak boleh melakukan millions of tiny ticks hanya untuk mensimulasikan beberapa hari.

---

# 70. AI Scope

Prototype 0.1:

```text
NO LLM
```

Tidak ada:

```text
AI dialogue
intent classification
memory candidate detection
AI reactions
tool interpretation
```

Reaction menggunakan deterministic presentation rules.

---

# 71. Talk Scope

Talk bukan functional feature Prototype 0.1.

Jika wireframe membutuhkan Talk untuk menjaga future layout:

```text
Talk
```

boleh tampil sebagai:

```text
disabled
coming later
prototype placeholder
```

atau tidak ditampilkan sama sekali.

Keputusan final dibuat saat wireframe.

Talk tidak boleh diam-diam berkembang menjadi Prototype 0.2 di dalam scope ini.

---

# 72. Memory Scope

Prototype 0.1:

```text
NO Memory System
```

Tidak ada:

* memory extraction,
* memory retrieval,
* embeddings,
* long-term memory,
* memory UI.

Event Log bukan Memory.

---

# 73. Personality Scope

Prototype 0.1 tidak mengimplementasikan evolving personality system.

Pet dapat memiliki fixed presentation personality agar tidak terasa steril.

Contoh:

```text
slightly curious
slightly playful
```

Tetapi tidak ada trait progression.

Full personality system dimulai Prototype 0.2.

---

# 74. Growth Scope

Prototype 0.1 tidak menguji full growth system.

Only:

```text
Egg → Baby
```

Baby → Child tidak required.

Growth eligibility, Meaningful Interaction Score, dan full lifecycle testing ditunda.

---

# 75. Skills Scope

Prototype 0.1:

```text
NO Skills
```

Tidak ada:

```text
Search
Reminder
Research
Calendar
Notes
```

---

# 76. Search Scope

Prototype 0.1:

```text
NO Search provider
```

Tidak ada external Search integration.

---

# 77. Infrastructure Exclusions

Prototype tidak membutuhkan:

```text
Redis

Queue

Background Worker

Vector Database

Microservices

Kubernetes

WebSockets

Continuous Agent
```

Tambahkan hanya jika requirement baru terbukti membutuhkan.

---

# 78. Product Exclusions

Prototype tidak mencakup:

```text
Authentication

Multiple Pets

Multiple Users

Inventory

Shop

Currency

Achievements

Daily Rewards

Streaks

Notifications

Customization

Social Features

Monetization

Pet Death

Complex Food Types

Complex Toys

Room Decoration
```

---

# 79. Visual Exclusions

Prototype tidak membutuhkan:

```text
final character art

production animation set

final illustration system

final sound design

full responsive polish

dark mode

advanced visual effects
```

Prototype tetap harus memiliki cukup visual personality untuk menguji character readability.

---

# 80. Prototype Asset Budget

Keep asset requirements intentionally small.

Suggested maximum initial set:

```text
1 Egg

1 Baby character

~5 emotional states

~6 basic action/state animations

1 simple habitat
```

Jika prototype mulai membutuhkan puluhan assets, scope perlu diperiksa kembali.

---

# 81. Wireframe Scope

Wireframe setelah dokumen ini hanya perlu mendesain:

```text
Egg

Hatch Transition

Naming

Pet Home

Feed Interaction

Play Interaction

Play Rejection

Sleep State

Return Experience

Debug Panel
```

Tidak perlu wireframe:

```text
Memory
Search
Skills
Child
Adult
Profile
Settings
Shop
Inventory
```

kecuali placeholder navigation benar-benar dibutuhkan.

---

# 82. Prototype Success Criteria

Prototype dianggap berhasil secara product hypothesis jika playtest menunjukkan sebagian besar signals berikut:

* player melihat pet sebelum stats,
* player dapat memperkirakan basic need dari pet presentation,
* Feed/Play/Sleep menghasilkan feedback yang jelas,
* player memahami ketika pet terlalu lelah bermain,
* pet terasa berubah ketika waktu dimajukan,
* player penasaran terhadap activity pet setelah absence,
* long absence tidak terasa menghukum,
* player berbicara tentang pet sebagai character.

Desired player language:

```text
"Dia lapar."

"Kayaknya dia capek."

"Dia lagi tidur."

"Tadi dia ngapain pas aku tinggal?"

"Kasih makan dulu."
```

---

# 83. Prototype Failure Criteria

Prototype membutuhkan redesign jika common feedback:

```text
"Aku cuma naikin bar."
```

```text
"Ini dashboard."
```

```text
"Pet-nya cuma gambar."
```

```text
"Aku nggak ngerti dia butuh apa."
```

```text
"Nggak ada bedanya kalau waktu maju."
```

```text
"Kenapa aku perlu peduli sama pet-nya?"
```

---

# 84. Technical Acceptance Criteria

Prototype technical implementation dianggap valid jika:

* monorepo berjalan,
* web dan API dapat dijalankan locally,
* PostgreSQL lokal dapat diakses melalui environment configuration,
* schema dapat dibuat/migrated,
* pet dapat dibuat dan persisted,
* reload tidak menghapus pet,
* elapsed-time simulation berjalan,
* Feed bekerja,
* Play bekerja,
* invalid Play ditolak,
* Sleep bekerja,
* auto wake bekerja,
* autonomous activity bekerja,
* events persisted,
* debug time travel bekerja,
* +7 days dapat disimulasikan,
* domain tests pass,
* simulation tests pass,
* API tests pass.

---

# 85. UX Acceptance Criteria

Prototype UX dianggap valid jika:

* Egg → Hatch → Name → Pet Home dapat diselesaikan tanpa debug tools,
* pet merupakan visual focus terbesar,
* Feed/Play/Sleep mudah ditemukan,
* action feedback terlihat,
* sleeping state jelas,
* player dapat membedakan Hungry dan Sleepy secara reasonable,
* technical error berbeda dari character rejection,
* debug UI jelas terpisah dari Player UI.

---

# 86. Definition of Done

Prototype 0.1 dianggap **Done** ketika:

### Experience

```text
Egg → Hatch → Name → Care → Leave → Time Passes → Return
```

dapat dimainkan end-to-end.

### Simulation

Needs berubah berdasarkan elapsed time dan activity.

### Actions

Feed, Play, dan Sleep memiliki deterministic domain rules.

### Life

Pet dapat melakukan limited autonomous behavior.

### Persistence

Pet state tetap ada setelah reload/server restart.

### Feedback

Pet memiliki readable visual reactions terhadap state dan actions.

### Debugging

Developer dapat memajukan waktu dan memeriksa raw state/events.

### Testing

Core domain, simulation, scenario, dan API tests tersedia dan passing.

### Playtesting

Prototype dapat diberikan kepada tester tanpa membutuhkan developer untuk menjelaskan core interaction.

---

# 87. Not Definition of Done

Prototype tidak perlu menunggu:

```text
perfect balancing

perfect animation

perfect art

full responsiveness

AI integration

Memory

Growth

Search

production deployment

production observability

production security hardening
```

Prototype adalah learning instrument.

Bukan production release.

---

# 88. Scope Change Rule

Setelah scope ini di-freeze, feature baru hanya boleh masuk Prototype 0.1 jika:

1. feature diperlukan untuk menguji primary hypothesis,
2. prototype tidak dapat diuji secara meaningful tanpanya,
3. atau ditemukan technical blocker yang membutuhkan perubahan.

Feature tidak masuk hanya karena:

```text
"sekalian gampang"
```

atau:

```text
"nanti juga butuh"
```

Future need bukan alasan otomatis untuk current complexity.

---

# 89. Scope Parking Lot

Ide yang muncul selama Prototype 0.1 tetapi berada di luar scope dicatat untuk prototype berikutnya.

### Prototype 0.2 candidates

```text
LLM Conversation
Personality
AI Reaction
Natural Language Intent
```

### Prototype 0.3 candidates

```text
Memory
Offline Continuity Refinement
Shared History
```

### Prototype 0.4 candidates

```text
Growth
Child
Adult
Search Lv.1
```

Urutan dapat berubah berdasarkan hasil playtest.

---

# 90. Prototype 0.1 Deliverables

Required deliverables:

```text
1. Frozen Prototype Scope

2. Wireframes

3. Implementation Plan

4. Runnable Web Client

5. Runnable API

6. Database Schema / Migration

7. Simulation Engine

8. Domain Action Rules

9. Debug Time Controls

10. Automated Tests

11. Playtest Build

12. Playtest Notes / Findings
```

---

# 91. Build Order

Recommended implementation sequence setelah wireframe:

```text
Domain Model
      ↓
Simulation Engine
      ↓
Domain Tests
      ↓
Scenario Tests
      ↓
Persistence
      ↓
API
      ↓
Debug UI
      ↓
Player UI
      ↓
Character Reactions
      ↓
Playtest
```

Simulation sebaiknya terbukti terlebih dahulu sebelum UI menjadi terlalu kompleks.

---

# 92. Prototype 0.1 Boundary

The boundary can be summarized as:

```text
INSIDE

Pet
State
Time
Needs
Care
Sleep
Autonomous Behavior
Reaction
Persistence
Debugging


OUTSIDE

LLM
Conversation
Memory
Personality Growth
Lifecycle Growth
Skills
Search
Utility
Monetization
Social
```

---

# 93. Final Prototype Contract

Prototype 0.1 memiliki satu kontrak utama:

> **Prove the pet before proving the AI.**

Jika Prototype 0.1 berhasil, kita memiliki dasar bahwa virtual creature-nya sendiri cukup kuat.

Barulah AI ditambahkan sebagai layer yang membuat character:

```text
more expressive
more personal
more memorable
more capable
```

bukan sebagai teknologi yang menopang seluruh illusion sendirian.

---

# 94. Next Step

Scope Prototype 0.1 sekarang dianggap **frozen baseline**.

Tahap berikutnya:

```text
Prototype 0.1 Scope
        ↓
Wireframe
        ↓
Wireframe Review
        ↓
Implementation Plan
        ↓
Development
        ↓
Playtest
        ↓
Findings
        ↓
Prototype 0.2 Decision
```

Wireframe harus mengikuti scope ini.

Jika sebuah screen atau interaction pada wireframe membutuhkan sistem yang tidak tercantum dalam Prototype 0.1, requirement tersebut harus dipertanyakan sebelum ditambahkan.
