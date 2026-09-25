# Game UX / Functional Game Design

## 1. Purpose

Dokumen ini mendefinisikan bagaimana player **mengalami AI Virtual Pet sebagai game**.

Dokumen sebelumnya menjelaskan bagaimana sistem bekerja.

Dokumen ini menjawab:

> Apa yang player lihat, pahami, lakukan, dan rasakan ketika berinteraksi dengan pet?

Target utama UX:

**Pet harus terasa sebagai character first, assistant second.**

Player seharusnya merasa sedang mengunjungi dan merawat sebuah makhluk digital, bukan membuka chatbot yang memiliki avatar.

---

# 2. UX Principles

## 2.1 Pet Is the Center

Pet merupakan pusat dari experience.

Home screen tidak boleh terasa seperti dashboard aplikasi.

Secara konseptual:

```text
┌─────────────────────────────┐
│                             │
│                             │
│             PET             │
│                             │
│                             │
│         current mood        │
│                             │
│                             │
│    Feed   Play   Talk       │
│           Sleep             │
│                             │
└─────────────────────────────┘
```

Pet harus memiliki ruang visual untuk:

* idle,
* bereaksi,
* tidur,
* bermain,
* menunjukkan kebutuhan,
* dan menunjukkan personality.

---

## 2.2 Show Character Before Numbers

Player tidak seharusnya harus membaca angka untuk mengetahui kondisi pet.

Game harus lebih dahulu berkomunikasi melalui:

* expression,
* animation,
* activity,
* dialogue,
* mood,
* descriptive state.

Contoh:

```text
Pet terlihat lemas.

"Kayaknya aku butuh istirahat..."
```

lebih penting daripada hanya:

```text
Energy: 14
```

Raw numeric values tetap tersedia dalam debug mode.

---

## 2.3 Actions Should Produce Reactions

Setiap meaningful player action harus menghasilkan feedback.

Flow:

```text
Player Action
     ↓
Game Result
     ↓
Pet Reaction
     ↓
Visual / Dialogue Feedback
```

Contoh:

```text
Feed
 ↓
pet makan
 ↓
expression berubah
 ↓
"Hmm! Enak."
```

Pet tidak boleh terasa seperti form yang menerima input lalu mengubah progress bar.

---

## 2.4 State Should Be Legible

Character-first tidak berarti menyembunyikan seluruh game state.

Player tetap perlu memahami:

* apakah pet lapar,
* apakah pet lelah,
* apakah pet senang,
* apa yang sedang dilakukan pet.

Tetapi informasi tersebut harus disajikan secara natural.

---

## 2.5 No Guilt-Driven UX

Long absence tidak boleh menghasilkan pengalaman seperti:

```text
"Kamu meninggalkan aku."

"Aku sudah menunggumu selama 7 hari."

"Kenapa kamu tidak kembali?"
```

Return experience harus mengundang player kembali tanpa punishment emosional.

Pet boleh memiliki reaksi terhadap waktu yang berlalu, tetapi tidak melakukan emotional coercion.

---

# 3. Primary Player Journey

Primary journey:

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
   ↓
Observe
   ↓
Interact
   ↓
Pet Reacts
   ↓
State Changes
   ↓
Leave
   ↓
Time Passes
   ↓
Return
   ↓
Observe What Changed
```

Setelah onboarding selesai, loop utama menjadi:

```text
Open Game
   ↓
See Pet
   ↓
Understand Current State
   ↓
Interact
   ↓
Receive Reaction
   ↓
Continue / Leave
```

---

# 4. First Launch

First launch harus sederhana.

Player tidak langsung dihadapkan pada:

* account dashboard,
* AI settings,
* personality configuration,
* skill tree,
* stat tables.

Experience dimulai dengan:

```text
Egg
```

Tujuannya membangun hubungan sebelum memperkenalkan kompleksitas sistem.

---

# 5. Egg Experience

Egg merupakan introduction terhadap pet.

Initial screen secara konseptual:

```text
┌─────────────────────────────┐
│                             │
│                             │
│             🥚              │
│                             │
│                             │
│        something moves      │
│                             │
│                             │
│          [ Touch ]          │
│                             │
└─────────────────────────────┘
```

Egg dapat memberikan feedback sederhana:

* movement,
* shake,
* sound,
* visual reaction.

Normal conversation belum diperlukan pada stage ini.

Tujuan Egg stage:

> Membuat player penasaran terhadap siapa yang akan lahir.

---

# 6. Hatch

Hatch harus menjadi **moment**, bukan sekadar perubahan database.

Flow:

```text
Egg reacts
    ↓
Hatch begins
    ↓
Pet appears
    ↓
First reaction
    ↓
Naming
```

Hatch merupakan salah satu deterministic important events.

Event:

```text
PET_HATCHED
```

harus disimpan.

Future memory system juga dapat menjadikan hatch sebagai shared history.

---

# 7. Naming

Setelah hatch, player memberi nama pet.

Flow:

```text
Pet appears
     ↓
Naming prompt
     ↓
Player enters name
     ↓
Pet reacts to its name
```

Nama menjadi bagian dari identity pet dan bersifat persistent.

Naming sebaiknya terasa seperti interaction dengan character, bukan account setup form.

---

# 8. Pet Home

Setelah onboarding, **Pet Home** menjadi primary screen.

Pet Home merupakan tempat player:

* melihat pet,
* memahami state,
* melakukan care actions,
* berbicara,
* melihat current activity,
* dan menerima contextual feedback.

Conceptual layout:

```text
┌─────────────────────────────┐
│ Pet Name              ☰     │
│                             │
│                             │
│             PET             │
│                             │
│          expression         │
│                             │
│       "..." / reaction      │
│                             │
│      current condition      │
│                             │
│  Feed   Play   Talk  Sleep  │
│                             │
└─────────────────────────────┘
```

Pet memiliki visual priority terbesar.

---

# 9. Needs Presentation

Core stats:

* Hunger
* Energy
* Happiness
* Bond

Tidak semua harus dipresentasikan dengan cara yang sama.

## Hunger

Player-facing Hunger harus menggunakan semantics:

```text
higher = more full / satisfied
```

Walaupun internal field saat ini disebut `hunger`, UX tidak boleh mengatakan:

```text
Hunger 90%
```

karena secara natural dapat dibaca sebagai "sangat lapar".

Player-facing label sebaiknya menggunakan konsep seperti:

```text
Fullness
```

atau descriptive condition.

Contoh:

```text
Very Hungry
Hungry
Okay
Full
Very Full
```

Final terminology dapat diputuskan setelah wireframe/playtest.

---

## Energy

Energy dapat disampaikan melalui:

* posture,
* animation,
* expression,
* sleepiness,
* descriptive indicator.

Possible states:

```text
Exhausted
Tired
Okay
Energetic
```

---

## Happiness

Happiness tidak harus selalu ditampilkan sebagai explicit meter.

Character expression dan mood dapat menjadi primary representation.

Possible descriptive states:

```text
Unhappy
Okay
Happy
Very Happy
```

---

## Bond

Bond berbeda dari survival/care stats.

Bond tidak perlu menjadi constantly visible progress bar.

Player sebaiknya **merasakan Bond melalui behavior pet**.

Contoh:

* lebih dekat,
* lebih expressive,
* lebih banyak callback,
* greeting berubah,
* interaction berubah.

Jika progress ditampilkan, sebaiknya melalui relationship label daripada raw value.

Contoh:

```text
New Friend
Friend
Close Friend
Best Friend
```

Label tersebut bersifat derived, bukan authoritative state.

---

# 10. Mood Presentation

Mood merupakan derived state.

MVP moods:

* Neutral
* Happy
* Hungry
* Sleepy
* Excited
* Bored
* Lonely
* Curious

Mood dapat mempengaruhi:

* expression,
* idle animation,
* short dialogue,
* interaction reaction.

Mood tidak harus selalu ditampilkan sebagai explicit text.

Player idealnya dapat menebak mood dari pet sebelum membaca label.

---

# 11. Primary Actions

Primary care actions:

```text
Feed
Play
Talk
Sleep
```

Actions harus mudah dijangkau dari Pet Home.

Tidak perlu membuka submenu kompleks untuk core loop.

---

# 12. Feed UX

Player memilih:

```text
Feed
```

Flow:

```text
Feed
 ↓
Backend validates
 ↓
Hunger changes
 ↓
Event generated
 ↓
Pet performs eating reaction
 ↓
Updated state displayed
```

Jika pet sudah sangat kenyang, diminishing effect harus terasa melalui reaction.

Contoh:

```text
Pet eats enthusiastically
```

versus:

```text
Pet takes a tiny bite.
```

Game tidak perlu menjelaskan formula diminishing returns kepada player.

---

# 13. Play UX

Player memilih:

```text
Play
```

Flow:

```text
Play
 ↓
Check Energy
 ↓
Valid?
 ├─ Yes → Play interaction
 └─ No  → Pet refuses naturally
```

Jika energy terlalu rendah, jangan hanya tampilkan:

```text
ERROR: ENERGY_TOO_LOW
```

Domain rejection dapat diterjemahkan menjadi character reaction.

Contoh:

```text
Pet terlihat kelelahan.

"Main nanti ya... aku ngantuk."
```

Game rule tetap deterministic.

Presentation boleh expressive.

---

# 14. Talk UX

Talk membuka conversation interaction dengan pet.

Talk harus tetap terasa sebagai bagian dari game, bukan berpindah ke aplikasi chatbot yang berbeda.

Pet tetap menjadi visual anchor.

Conceptually:

```text
┌─────────────────────────────┐
│                             │
│             PET             │
│                             │
│      "Hari ini seru!"       │
│                             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Say something...        │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

Pada Prototype 0.1, full LLM conversation belum diperlukan.

Talk dapat:

* disabled,
* mocked,
* atau menggunakan predefined responses.

AI conversation mulai menjadi focus pada Prototype 0.2.

---

# 15. Sleep UX

Sleep berbeda dari normal button action karena menghasilkan persistent activity.

Flow:

```text
Sleep
 ↓
currentActivity = SLEEPING
 ↓
sleepStartedAt recorded
 ↓
Pet visual changes
```

Pet Home saat sleeping harus terasa berbeda.

Contoh:

```text
        z Z

       sleeping pet

       Sleeping...
```

Player dapat meninggalkan game.

Saat kembali:

```text
elapsed time
    ↓
sleep recovery
    ↓
possible auto wake
```

---

# 16. Autonomous Behavior

Pet dapat melakukan autonomous activities seperti:

* Sleep
* Play Alone
* Rest
* Look Around
* Think
* Eat Small Snack
* Wait

Autonomous behavior harus terlihat sebagai tanda kehidupan.

Player tidak perlu melihat internal simulation detail.

Sebaliknya, player dapat menemukan pet:

```text
looking around
```

atau:

```text
playing alone
```

ketika membuka game.

Ini mendukung pillar:

**Alive**

---

# 17. Return Experience

Return experience adalah salah satu UX paling penting.

Player membuka game setelah beberapa waktu.

Backend melakukan:

```text
now - lastSimulatedAt
        ↓
Offline Simulation
        ↓
Current State
        ↓
Recent Relevant Events
```

Player kemudian melihat kondisi pet saat ini.

Jika ada event menarik, game dapat memberikan lightweight recap.

Contoh:

```text
While you were away...

• Pet took a nap.
• Pet played for a while.
• Pet woke up recently.
```

Final UI tidak harus menggunakan literal event list.

Informasi tersebut dapat disampaikan melalui character reaction atau environmental clues.

---

# 18. Long Absence

Long absence tidak menghasilkan catastrophic punishment.

Contoh:

```text
Player returns after 14 days.
```

Pet tidak:

* mati,
* kehilangan Bond secara pasif,
* mengalami irreversible punishment,
* menyalahkan player.

Simulation tetap menghasilkan plausible current state.

Return experience lebih dekat ke:

```text
"Oh, you're here!"
```

daripada:

```text
"Where have you been?!"
```

---

# 19. Event Feedback

Internal Event Log bukan player-facing activity log secara langsung.

Events digunakan sebagai source untuk:

* reactions,
* recent activity,
* future memory,
* debugging,
* analytics.

Player hanya melihat event yang relevan.

Contoh:

```text
PET_PLAYED
```

tidak perlu ditampilkan sebagai:

```text
2026-09-25 14:32 PET_PLAYED
```

Sebaliknya:

```text
Pet terlihat puas setelah bermain.
```

---

# 20. Growth UX

Growth tidak terjadi secara diam-diam saat player offline.

Jika growth requirements terpenuhi:

```text
growthEligible = true
```

kemudian:

```text
growthReadyAt = timestamp
```

Saat player kembali, pet tetap berada pada current stage sampai growth moment dijalankan.

Conceptual flow:

```text
Player returns
      ↓
Something feels different
      ↓
Growth cue
      ↓
Player acknowledges
      ↓
Growth sequence
      ↓
New Stage
```

Growth harus terasa seperti milestone hubungan.

Bukan:

```text
Level Up!
+10 stats
```

Tetapi:

> Pet yang dirawat player tumbuh.

---

# 21. Growth Reveal

Growth reveal dapat menggunakan:

* animation,
* transition,
* sound,
* pet reaction,
* short dialogue.

Contoh:

```text
Baby
  ↓
Growth Moment
  ↓
Child
```

Personality, Bond, memory, dan shared history tetap sama.

Character berubah, tetapi bukan menjadi character baru.

---

# 22. Personality UX

Raw personality values tidak ditampilkan kepada player.

Player tidak melihat:

```text
Playful: 0.734
Curious: 0.481
Shy: 0.222
```

Personality harus muncul melalui behavior.

Contoh Playful tinggi:

* lebih sering mengajak bermain,
* energetic reactions,
* playful dialogue.

Curious tinggi:

* banyak mengamati,
* bertanya,
* tertarik terhadap hal baru.

Clingy tinggi:

* lebih enthusiastic saat player datang,
* lebih sering mencari interaction.

Player dapat melihat descriptive traits pada profile di masa depan.

Contoh:

```text
Playful
Curious
A Little Shy
```

---

# 23. Skills UX

Skills bukan primary navigation pada early game.

Skill merupakan kemampuan yang dipelajari pet.

Contoh:

```text
Adult
 ↓
Search Lv.1 unlocked
```

Unlock harus terasa sebagai bagian dari growth.

Contoh:

```text
Your pet learned something new.
```

Bukan sekadar:

```text
Feature unlocked.
```

Ini menjaga framing:

> Pet belajar kemampuan.

bukan:

> SaaS account mendapat fitur baru.

---

# 24. Search UX

Search baru tersedia setelah skill unlocked.

User dapat meminta secara natural:

```text
"Carikan artikel tentang..."
```

atau menggunakan future explicit skill interaction.

Flow:

```text
Request
  ↓
Pet understands Search intent
  ↓
Skill validation
  ↓
Search execution
  ↓
Pet presents result
```

Search result UI harus tetap menjaga pet sebagai participant.

Pet bukan menghilang lalu digantikan search engine page.

Detailed Search result UX akan ditentukan pada phase berikutnya.

---

# 25. Navigation

MVP navigation harus minimal.

Possible structure:

```text
Pet Home
   │
   ├── Talk
   │
   ├── Memories
   │
   └── Profile
```

Namun Prototype 0.1 hanya membutuhkan:

```text
Pet Home
Debug
```

Navigation tambahan hanya ditambahkan ketika system terkait sudah tersedia.

---

# 26. Debug Mode

Prototype membutuhkan Debug Mode yang jelas terpisah dari player-facing UX.

Debug panel dapat menampilkan:

```text
Raw Stats

Hunger
Energy
Happiness
Bond

Personality Values

Current Activity

Mood Scores

lastInteractionAt
lastSimulatedAt
sleepStartedAt

Recent Events
```

Time controls:

```text
+1 hour
+6 hours
+12 hours
+1 day
+3 days
+7 days
```

Possible debug commands:

```text
Reset Pet
Force Sleep
Wake Pet
Set Stat
Advance Time
```

Debug tools tidak mengikuti final game UX restrictions.

Tujuannya adalah mempercepat development dan balancing.

---

# 27. Prototype 0.1 Screens

Prototype 0.1 cukup memiliki beberapa state/screen utama.

## Egg

```text
Egg
Touch interaction
Hatch trigger
```

## Naming

```text
Pet visual
Name input
Confirm
```

## Pet Home

```text
Pet
Current condition
Feed
Play
Sleep
Talk placeholder
```

## Sleeping State

```text
Sleeping pet
Sleep status
```

## Debug Panel

```text
Raw state
Time travel
Recent events
Simulation controls
```

Tidak perlu membangun seluruh future navigation.

---

# 28. Prototype 0.1 UX Loop

Final Prototype 0.1 loop:

```text
Open
 ↓
See Pet
 ↓
Read Current Condition
 ↓
Feed / Play / Sleep
 ↓
See Reaction
 ↓
State Changes
 ↓
Advance Time / Leave
 ↓
Simulation
 ↓
Return
 ↓
Pet Is Doing Something
 ↓
Interact Again
```

Prototype berhasil jika loop sederhana ini sudah membuat pet terasa memiliki kondisi dan kehidupan sendiri.

---

# 29. What Prototype 0.1 Does Not Need

Prototype 0.1 tidak membutuhkan:

* polished art,
* final animation,
* full conversation UI,
* LLM integration,
* memory management UI,
* Search UI,
* skill tree,
* store,
* inventory system,
* social features,
* notifications,
* customization,
* monetization,
* complex navigation.

Temporary assets dan placeholder animation diperbolehkan.

---

# 30. UX Validation Questions

Playtest Prototype 0.1 harus mencoba menjawab:

### State Legibility

Apakah player dapat mengetahui kondisi pet tanpa membaca debug numbers?

### Action Feedback

Apakah Feed, Play, dan Sleep terasa menghasilkan reaction yang jelas?

### Alive

Apakah pet terasa melakukan sesuatu ketika player tidak berinteraksi?

### Return

Apakah membuka game kembali terasa menarik?

### Care

Apakah player mulai memiliki dorongan natural untuk memperhatikan kondisi pet?

### Character

Apakah pet mulai terasa seperti character, bukan kumpulan progress bar?

---

# 31. Failure Signals

UX perlu direvisi jika player mengatakan atau menunjukkan:

```text
"Aku cuma pencet tombol buat naikin bar."
```

```text
"Aku nggak ngerti dia butuh apa."
```

```text
"Nggak ada bedanya kalau aku tinggal."
```

```text
"Ini kayak dashboard."
```

```text
"Pet-nya cuma dekorasi."
```

atau jika player terus-menerus membuka debug stats karena player-facing feedback tidak cukup jelas.

---

# 32. Strong Signals

Prototype menunjukkan arah yang benar jika player mengatakan atau menunjukkan:

```text
"Kayaknya dia lapar."
```

```text
"Dia capek, tidur dulu."
```

```text
"Tadi pas aku buka dia lagi ngapain?"
```

```text
"Dia sekarang lebih happy."
```

atau mulai berbicara tentang pet menggunakan bahasa character:

```text
"Dia..."
```

bukan hanya:

```text
"Stat-nya..."
```

---

# 33. Design Boundary

Dokumen ini mendefinisikan **functional game UX**.

Belum termasuk final:

* visual identity,
* character art,
* animation style,
* color palette,
* typography,
* sound design,
* environment art,
* detailed motion design.

Hal tersebut akan dibahas dalam visual/art direction setelah functional experience cukup stabil.

---

# 34. Accepted UX Direction

Untuk MVP dan Prototype:

* Pet Home menjadi pusat experience.
* Pet memiliki visual priority terbesar.
* Character feedback lebih utama daripada numeric stats.
* Core care actions tersedia langsung.
* Every meaningful action produces a reaction.
* Mood disampaikan terutama melalui pet.
* Bond tidak menjadi constantly visible raw meter.
* Personality ditunjukkan melalui behavior, bukan angka.
* Offline simulation harus terlihat melalui current state dan relevant activity.
* Long absence tidak menggunakan guilt.
* Growth harus terjadi saat player hadir.
* Growth merupakan character milestone.
* Skills dipresentasikan sebagai kemampuan yang dipelajari pet.
* Talk tetap berada dalam framing game.
* Debug UI dipisahkan dari player-facing UX.
* Prototype 0.1 memprioritaskan game feel dibanding visual polish.

---

# 35. Next Step

Dengan functional Game UX didefinisikan, tahap berikutnya adalah:

```text
Game UX
   ↓
Prototype 0.1 Wireframe
   ↓
Prototype Scope Freeze
   ↓
Implementation Plan
   ↓
Development
```

Wireframe berikutnya harus menerjemahkan dokumen ini menjadi struktur layar konkret, terutama:

```text
Egg
Hatch
Naming
Pet Home
Care Actions
Sleeping
Return Experience
Debug Panel
```

Wireframe harus menguji **hierarchy dan interaction flow**, bukan visual style final.
