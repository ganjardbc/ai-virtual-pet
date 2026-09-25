# AI Virtual Pet

AI Virtual Pet adalah eksperimen game virtual pet berbasis AI di mana pemain membesarkan sebuah makhluk digital yang memiliki kebutuhan, personality, memory, growth, dan kemampuan yang berkembang seiring waktu.

Tujuan utamanya bukan membuat chatbot dengan avatar pet, melainkan membangun sebuah **persistent AI companion** yang terasa memiliki kehidupan dan sejarah bersama pemain.

> **Core idea:** Raise your own AI companion.

---

## Project Status

**Current Phase:** Pre-production / Game Design

Saat ini project masih berada pada tahap mendefinisikan:

* product vision,
* game pillars,
* core gameplay loop,
* pet lifecycle,
* MVP scope,
* game systems,
* AI behavior,
* memory,
* growth,
* dan skill progression.

Belum ada keputusan final mengenai implementation stack.

Prototype akan mulai dibuat setelah aturan dasar game cukup jelas untuk diuji.

---

## Product Concept

Pemain memulai dengan sebuah telur digital.

Telur tersebut kemudian menetas menjadi AI pet yang dapat:

* diberi nama,
* diberi makan,
* diajak bermain,
* diajak berbicara,
* tidur,
* mengingat pengalaman,
* mengembangkan personality,
* tumbuh,
* dan memperoleh skill baru.

Pet tidak memiliki personality final sejak awal.

Personality berkembang berdasarkan bagaimana pemain berinteraksi dengannya.

Contohnya:

```text
Frequently Play
↓
More Playful

Frequently Talk
↓
More Curious

Frequently Together
↓
More Clingy

Often Left Alone
↓
More Independent
```

Seiring pertumbuhan, pet juga dapat memperoleh kemampuan AI nyata.

Contoh:

```text
Baby
↓
Talk

Child
↓
Remember

Adult
↓
Search

Future Growth
↓
Reminder
Research
Calendar
Planning
```

Dengan demikian, growth tidak hanya bersifat visual.

Pet juga menjadi semakin mampu membantu pemain.

---

## Core Product Principle

Game harus selalu mengikuti prinsip:

> **Pet terasa seperti makhluk yang tumbuh bersama pemain.**

Setiap fitur harus mendukung setidaknya salah satu dari hal berikut:

* membuat pet terasa hidup,
* memperkuat hubungan pemain dengan pet,
* memperlihatkan perkembangan pet,
* atau membuat kemampuan pet berkembang.

Fitur yang tidak mendukung pengalaman tersebut sebaiknya tidak menjadi prioritas.

---

## Game Pillars

Project menggunakan empat game pillars utama.

### Alive

Pet memiliki state dan kehidupan sendiri.

Pet dapat:

* lapar,
* lelah,
* bahagia,
* bosan,
* tidur,
* bermain sendiri,
* dan bereaksi terhadap waktu.

Pet tetap berkembang meskipun pemain sedang offline.

---

### Bond

Hubungan antara pemain dan pet merupakan pusat pengalaman.

Interaksi mempengaruhi:

* Bond,
* reaction,
* personality,
* memory,
* dan growth.

Hubungan berkembang secara bertahap, bukan dari satu atau dua interaksi.

---

### Growth

Pet berkembang seiring waktu.

Growth mencakup:

* visual evolution,
* personality development,
* behavioral changes,
* memory,
* dan skill unlock.

Growth harus terasa sebagai hasil perjalanan bersama pemain.

---

### Useful

Pet secara bertahap memperoleh kemampuan AI yang berguna.

Contoh kemampuan:

* Search,
* Reminder,
* Research,
* Calendar,
* Notes,
* Planning.

Kemampuan tidak semuanya tersedia sejak awal.

Pet harus tumbuh sebelum dapat menggunakan kemampuan tertentu.

---

## Core Gameplay Loop

Loop utama:

```text
Check Pet
    ↓
Observe Needs / Mood
    ↓
Interact
    ↓
Feed / Play / Talk / Sleep
    ↓
Pet Reacts
    ↓
State Changes
    ↓
Bond / Personality Changes
    ↓
Time Passes
    ↓
Return Later
    ↺
```

Long-term progression:

```text
Interaction
    ↓
Bond
    ↓
Personality
    ↓
Growth
    ↓
New Skills
    ↓
More Ways To Interact
    ↓
Deeper Relationship
    ↺
```

---

## AI Philosophy

LLM bukan source of truth untuk kehidupan pet.

Game state tetap dikontrol oleh game engine.

```text
Player Action
      ↓
Game Engine
      ↓
Pet State
      ↓
Context Builder
      ↓
LLM
      ↓
Dialogue / Reaction
```

Game engine menentukan:

* Hunger,
* Energy,
* Happiness,
* Bond,
* Personality,
* Growth,
* dan Skills.

LLM membantu menentukan:

* dialogue,
* reaction,
* conversational behavior,
* intent interpretation,
* dan personality expression.

Dengan pendekatan ini, pet tetap konsisten meskipun model AI berubah.

---

## MVP Goal

MVP pertama bertujuan membuktikan satu hal:

> Apakah kombinasi game simulation, personality, memory, dan AI conversation dapat membuat virtual pet terasa hidup dan memiliki hubungan dengan pemain?

MVP tidak bertujuan memiliki banyak fitur.

MVP harus cukup untuk menguji pengalaman inti.

---

## Initial MVP Scope

MVP direncanakan mencakup:

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

Recent Memory
Long-Term Memory

Offline Progression

Growth

Search Lv.1
```

Fitur lain akan dipertimbangkan setelah core gameplay terbukti bekerja.

---

## Out of Scope for Initial MVP

Belum menjadi prioritas:

```text
Multiple species
Breeding
Combat
Multiplayer
Marketplace
Pet trading
Currency
Lootbox
Inventory
Complex food system
Accessories
Room decoration
Achievements
Daily quests
Leaderboard
Voice chat
AR
Complex skill tree
```

Prinsipnya:

> Jangan memperbesar game sebelum core loop terbukti menarik.

---

## Development Philosophy

Project akan dibangun menggunakan pendekatan iterative game development.

```text
Design
↓
Prototype
↓
Playtest
↓
Observe
↓
Adjust
↓
Prototype Again
```

Tidak semua keputusan desain dianggap permanen.

Angka seperti:

* stat decay,
* Bond gain,
* growth requirement,
* personality modifier,
* dan interaction cooldown

akan diuji melalui prototype.

---

## Documentation

Dokumentasi project berada di directory:

```text
docs/
```

Struktur awal:

```text
docs/
├─ 00-vision.md
├─ 01-mini-gdd.md
├─ 02-game-systems.md
├─ 03-ai-behavior.md
├─ 04-memory-system.md
├─ 05-growth-and-skills.md
├─ 06-technical-architecture.md
├─ 07-data-model.md
├─ 08-api-design.md
├─ 09-playtesting.md
└─ 10-decisions.md
```

### Document Purpose

`00-vision.md`

Menjelaskan product vision, player fantasy, game pillars, dan pengalaman yang ingin dibangun.

`01-mini-gdd.md`

Game Design Document awal yang menjelaskan bagaimana game bekerja secara keseluruhan.

`02-game-systems.md`

Menentukan aturan simulation seperti Needs, Bond, Mood, Personality, dan offline progression.

`03-ai-behavior.md`

Menentukan bagaimana AI berperilaku dan bagaimana LLM berinteraksi dengan game state.

`04-memory-system.md`

Menentukan jenis memory, memory lifecycle, retrieval, dan hubungan memory dengan conversation.

`05-growth-and-skills.md`

Menentukan lifecycle pet, evolution, progression, dan skill system.

`06-technical-architecture.md`

Menjelaskan arsitektur aplikasi dan pemisahan antara game engine, AI engine, tools, dan persistence.

`07-data-model.md`

Mendefinisikan struktur data utama.

`08-api-design.md`

Mendefinisikan contract antara client dan backend.

`09-playtesting.md`

Mendokumentasikan test scenario, observation, feedback, dan balancing result.

`10-decisions.md`

Mencatat keputusan desain dan engineering penting beserta alasannya.

---

## Documentation Workflow

Dokumentasi digunakan sebagai living documentation.

Workflow:

```text
Idea
↓
Document
↓
Define Rules
↓
Prototype
↓
Playtest
↓
Record Findings
↓
Revise Documentation
↓
Implement / Iterate
```

Dokumentasi tidak perlu mencatat setiap perubahan kecil.

Yang perlu dicatat terutama:

* design decisions,
* system rules,
* architectural decisions,
* experiments,
* balancing changes penting,
* dan hasil playtesting.

---

## Implementation Phase Documentation

Setiap implementation phase wajib memiliki satu folder dokumentasi di:

```text
tasks/
└── task-XX/
    ├── plan.md
    ├── implementation.md
    └── verify.md
```

Nama folder harus menggunakan prefix `task-` dan nomor berurutan, misalnya:

```text
task-01
task-02
task-03
```

Setiap folder task wajib berisi:

`plan.md`

Mendefinisikan tujuan, scope, dependencies, file atau module yang terlibat, constraints, langkah implementasi, tests yang diperlukan, dan acceptance criteria. Dokumen ini harus dibuat sebelum implementation dimulai.

`implementation.md`

Mencatat implementation yang benar-benar dilakukan, keputusan teknis, file yang berubah, perbedaan dari plan, serta known limitations. Dokumen ini diperbarui selama atau segera setelah implementation.

`verify.md`

Mencatat cara verification, command yang dijalankan, hasil test/typecheck/build, pemeriksaan acceptance criteria, dan masalah yang masih tersisa. Dokumen ini harus diselesaikan sebelum task dianggap selesai.

Required workflow:

```text
Create task-XX/
      ↓
Write plan.md
      ↓
Implement
      ↓
Update implementation.md
      ↓
Run validation
      ↓
Complete verify.md
      ↓
Task may be marked complete
```

Sebuah implementation phase tidak boleh dimulai tanpa `plan.md` dan tidak boleh dianggap selesai tanpa `implementation.md` serta `verify.md` yang mencerminkan hasil aktual.

---

## Local Development

Prasyarat: Node.js 22+, pnpm 9, dan PostgreSQL 16 lokal.

```bash
pnpm install
cp .env.example .env          # isi DATABASE_URL dan TEST_DATABASE_URL
createdb ai_virtual_pet
createdb ai_virtual_pet_test
pnpm --filter @ai-virtual-pet/api db:migrate
pnpm dev                      # API :3000 + web :5173 (web mem-proxy /api ke API)
```

Buka http://localhost:5173. `pnpm dev` membaca workspace packages langsung dari source, jadi tidak perlu build terlebih dahulu.

Validation:

```bash
pnpm typecheck
pnpm test                     # persistence integration tests memakai TEST_DATABASE_URL (di-skip jika kosong)
pnpm build
```

### Database Migration Workflow

Schema Drizzle berada di `apps/api/src/db/schema.ts`. Migration SQL hasil generate berada di `apps/api/drizzle/` dan di-commit.

```text
Ubah schema.ts
      ↓
pnpm --filter @ai-virtual-pet/api db:generate --name <deskripsi>
      ↓
Review SQL di apps/api/drizzle/
      ↓
pnpm --filter @ai-virtual-pet/api db:migrate      (DATABASE_URL)
```

Integration tests menjalankan migration yang sama secara otomatis ke `TEST_DATABASE_URL` dan melakukan truncate pada semua table. `TEST_DATABASE_URL` tidak boleh sama dengan `DATABASE_URL`.

### Debug API

Debug harness (time travel, set stats, force sleep/wake, reset) aktif hanya jika `ENABLE_DEBUG_API=true`. Flag ini tidak lagi dikunci ke `NODE_ENV`; rute debug dapat menulis ulang state game tanpa autentikasi, jadi nyalakan hanya di mesin lokal atau server playtest privat.

```text
GET    /api/v1/debug/pet/state
POST   /api/v1/debug/time/advance   {"hours": 6} / {"days": 7}
POST   /api/v1/debug/pet/sleep
POST   /api/v1/debug/pet/wake
PATCH  /api/v1/debug/pet/state      {"hunger": 20, "energy": 10}
PATCH  /api/v1/debug/personality    {"preset": "HIGH_PLAYFUL"} / {"playful": 0.8}
GET    /api/v1/debug/ai             last turn metadata, personality, bounded context
POST   /api/v1/debug/pet/reset
```

Time travel hanya memajukan offset debug clock lalu menjalankan simulation normal.

Debug UI (tombol **Debug** di sebelah kanan nameplate pet) hanya muncul jika `ENABLE_DEBUG_API=true` — flag yang sama dengan Debug API. Web membaca flag ini saat dev/build dan meneruskannya ke client sebagai `VITE_ENABLE_DEBUG_API`; tanpa flag tersebut tombol dan kode Debug UI tidak disertakan sama sekali.

Drizzle row types hanya dipakai di `apps/api/src/db` dan `apps/api/src/persistence`; layer lain memakai domain model melalui repository contracts.

---

## Playtest (Prototype 0.1)

Facilitator kit: `docs/playtests/prototype-01-playtest-guide.md`. Session record: `docs/playtests/PT-template.md`.

```bash
pnpm dev                      # jalankan game (ENABLE_DEBUG_API=true di .env)
pnpm playtest:reset           # mulai dari Egg lagi (pet, history, debug time)
pnpm playtest:advance 16h     # simulasikan player pergi (12h, 1d, 7d, ...) tanpa membuka Debug panel
```

---

## Project Roadmap

High-level roadmap:

```text
Phase 1
Pre-production

Vision
↓
Mini GDD
↓
Game Systems Design
↓
AI / Memory Design

────────────────

Phase 2
Prototype

Simulation Prototype
↓
AI Prototype
↓
Memory Prototype
↓
Growth Prototype

────────────────

Phase 3
Playtesting

Internal Playtest
↓
Balancing
↓
Design Iteration

────────────────

Phase 4
Vertical Slice

Visual Identity
↓
Animation
↓
Sound
↓
Polished Core Experience

────────────────

Phase 5
MVP / Alpha

Complete MVP Loop
↓
External Testing
↓
Iteration
```

---

## Current Workflow

Saat ini:

```text
✅ Product Concept

✅ Game Pillars

✅ Core Gameplay Loop

✅ Initial MVP Scope

→ Vision Documentation

→ Mini GDD

→ Game Systems Design

→ Prototype
```

---

## Working Principle

Saat ragu antara menambah fitur atau memperkuat pet simulation:

**perkuat pet simulation.**

Saat ragu antara membuat AI lebih pintar atau membuat personality lebih konsisten:

**buat personality lebih konsisten.**

Saat ragu antara menambah banyak content atau membuat satu interaction terasa meaningful:

**buat interaction lebih meaningful.**

Karena kekuatan utama project ini bukan jumlah fitur.

Kekuatan utamanya adalah:

> **seberapa besar pemain percaya bahwa pet mereka benar-benar tumbuh bersama mereka.**
