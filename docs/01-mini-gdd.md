# Mini Game Design Document

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Genre:** AI Companion / Virtual Pet / Life Simulation
**Mode:** Single Player
**Session Style:** Short sessions with persistent progression
**Core Fantasy:** Raise your own AI companion.

---

# 1. Purpose

Dokumen ini menerjemahkan product vision menjadi struktur game yang lebih konkret.

Mini GDD menjawab pertanyaan:

* apa yang dilakukan pemain,
* apa yang dilakukan pet,
* bagaimana waktu mempengaruhi dunia,
* bagaimana pet tumbuh,
* bagaimana personality berkembang,
* bagaimana memory bekerja,
* bagaimana AI digunakan,
* dan apa saja yang masuk ke MVP pertama.

Dokumen ini belum menentukan formula final, balancing final, atau detail implementasi teknis.

Hal-hal tersebut akan dibahas pada dokumen berikutnya.

---

# 2. Game Summary

AI Virtual Pet adalah game di mana pemain membesarkan sebuah makhluk digital berbasis AI.

Pet memiliki:

* needs,
* mood,
* bond,
* personality,
* memory,
* growth,
* dan skills.

Pemain berinteraksi dengan pet melalui aktivitas sederhana seperti:

* Feed,
* Play,
* Talk,
* Sleep.

Waktu tetap berjalan ketika pemain meninggalkan aplikasi.

Seiring waktu dan interaksi, pet akan:

* berubah perilaku,
* membentuk personality,
* mengingat pengalaman,
* tumbuh,
* dan membuka kemampuan baru.

---

# 3. Core Player Experience

Pengalaman utama pemain adalah:

```text
Receive Pet
↓
Care
↓
Interact
↓
Observe Reaction
↓
Build Relationship
↓
See Personality Develop
↓
Watch Pet Grow
↓
Unlock New Capabilities
↓
Continue Relationship
```

Tujuan desain bukan membuat pemain mengejar angka setinggi mungkin.

Tujuan desain adalah membuat pemain merasa bahwa pet berkembang karena kehidupan yang mereka jalani bersama.

---

# 4. Core Gameplay Loop

Loop utama:

```text
Open App
↓
Check Pet
↓
Observe Needs / Mood
↓
Choose Interaction
↓
Pet Reacts
↓
State Changes
↓
Bond / Personality Changes
↓
Memory / Event Recorded
↓
Time Passes
↓
Return Later
↺
```

Interaction utama MVP:

```text
Feed
Play
Talk
Sleep
```

Loop harus tetap menarik meskipun pemain hanya membuka aplikasi selama satu atau dua menit.

---

# 5. Long-Term Progression Loop

```text
Interaction
↓
Bond
↓
Personality Development
↓
Growth
↓
Skill Unlock
↓
More Ways To Interact
↓
Deeper Relationship
↺
```

Long-term loop adalah alasan pemain kembali selama beberapa hari atau minggu.

---

# 6. Pet Lifecycle

MVP menggunakan empat tahap pertumbuhan:

```text
Egg
↓
Baby
↓
Child
↓
Adult
```

Setiap tahap harus terasa berbeda dalam:

* visual,
* behavior,
* language,
* needs,
* dan capability.

---

# 7. Egg Stage

Egg merupakan onboarding.

Tujuan utama Egg Stage adalah menciptakan ownership.

Player experience:

```text
Receive Egg
↓
Observe Egg
↓
Interact
↓
Egg Hatches
↓
Name Pet
```

Target durasi:

```text
1-5 minutes
```

Egg Stage tidak perlu memiliki sistem gameplay kompleks.

Fokusnya adalah:

> "Ini pet-ku."

---

# 8. Baby Stage

Baby adalah tahap attachment awal.

Karakteristik:

* expressive,
* dependent,
* simple communication,
* limited vocabulary,
* personality belum kuat,
* belum memiliki utility skill.

Available actions:

```text
Feed
Play
Talk
Sleep
```

Pada tahap ini, pemain belajar memahami kebutuhan pet.

---

# 9. Child Stage

Pada Child Stage, personality mulai terlihat lebih jelas.

Pet mulai:

* menunjukkan preferensi,
* merujuk kejadian sebelumnya,
* mengenali pola interaksi,
* memiliki reaksi lebih beragam,
* menggunakan memory dengan lebih natural.

Contoh:

> "Kemarin katanya mau main lagi."

atau:

> "Kamu biasanya datang lebih pagi."

Child Stage harus menjadi titik ketika pemain mulai berpikir:

> "Pet-ku punya sifat."

---

# 10. Adult Stage

Adult adalah tahap ketika pet mulai menjadi companion yang lebih mampu.

Karakteristik:

* communication lebih kompleks,
* personality lebih stabil,
* memory lebih kaya,
* autonomy lebih tinggi,
* skill mulai tersedia.

Untuk MVP:

```text
Adult
↓
Unlock Search Lv.1
```

Growth setelah Adult belum masuk MVP.

---

# 11. Core Pet Stats

MVP menggunakan empat state utama:

```text
Hunger
Energy
Happiness
Bond
```

Range:

```text
0 - 100
```

Semua angka masih bersifat internal dan dapat berubah selama balancing.

---

# 12. Hunger

Interpretasi:

```text
100 = kenyang
0   = sangat lapar
```

Hunger menurun seiring waktu.

Hunger dapat mempengaruhi:

* mood,
* reaction,
* willingness to play,
* conversation tone.

Feed meningkatkan Hunger.

Pet dapat menolak makan jika sudah terlalu kenyang.

---

# 13. Energy

Energy merepresentasikan stamina pet.

Energy berkurang akibat:

* waktu,
* Play,
* aktivitas tertentu.

Energy meningkat melalui Sleep.

Energy rendah dapat menyebabkan:

* Sleepy mood,
* shorter responses,
* refusal to Play,
* autonomous Sleep.

---

# 14. Happiness

Happiness adalah kondisi emosional jangka pendek.

Dipengaruhi oleh:

* Play,
* Talk,
* Hunger,
* Energy,
* boredom,
* recent events.

Happiness dapat berubah relatif cepat.

Happiness bukan pengganti Bond.

---

# 15. Bond

Bond adalah representasi hubungan jangka panjang antara pet dan pemain.

Bond mempengaruhi:

* familiarity,
* intimacy,
* trust,
* growth,
* dialogue style,
* memory usage.

Bond tumbuh perlahan.

Bond tidak boleh mudah dimaksimalkan melalui spam action.

Contoh behavior:

```text
Low Bond

"Hi."

↓

Medium Bond

"Kamu balik!"

↓

High Bond + Relevant Memory

"Kemarin kamu bilang bakal sibuk hari ini.
Gimana tadi?"
```

---

# 16. Core Actions

MVP menyediakan:

```text
Feed
Play
Talk
Sleep
```

Setiap action:

* mengubah game state,
* dapat menghasilkan event,
* dapat mempengaruhi personality,
* dan memicu reaction.

---

# 17. Feed

Tujuan:

memenuhi Hunger.

Initial effect example:

```text
Hunger     +
Happiness  small +
Bond       very small +
```

Possible rules:

* Feed memiliki diminishing return.
* Pet dapat menolak jika terlalu kenyang.
* Mood dapat mempengaruhi reaction.

Contoh:

> "Masih kenyang..."

atau:

> "Makan! 🍎"

---

# 18. Play

Tujuan:

meningkatkan Happiness dan relationship.

Initial effect example:

```text
Happiness  +
Energy     -
Hunger     -
Bond       +
Playful tendency +
```

Play dapat memiliki beberapa reaction berdasarkan personality.

Playful pet mungkin meminta bermain lagi.

Sleepy pet mungkin menolak.

---

# 19. Talk

Talk adalah interaction AI utama.

Melalui conversation, pet dapat:

* berinteraksi bebas,
* memahami pesan pemain,
* membangun Bond,
* membentuk personality,
* menghasilkan memory candidate,
* merujuk history,
* menggunakan skill.

Tidak semua message harus menghasilkan Bond.

Talk harus dinilai berdasarkan context, bukan hanya message count.

---

# 20. Sleep

Sleep memulihkan Energy.

Saat pet tidur:

* sebagian action tidak tersedia,
* time progression tetap berjalan.

Pet dapat:

* tidur karena user command,
* atau tidur secara autonomous.

Wake event dapat menghasilkan reaction.

---

# 21. Mood System

Mood adalah kondisi emosional dominan pet saat ini.

Mood MVP:

```text
Neutral
Happy
Hungry
Sleepy
Excited
Bored
Lonely
Curious
```

Mood berasal dari kombinasi:

```text
Needs
+
Recent Events
+
Personality
+
Current Activity
```

Contoh:

```text
Energy low
→ Sleepy

Hunger low
→ Hungry

Recent Play
+
high Playful
→ Excited

Long absence
+
high Clingy
→ Lonely
```

Mood bukan personality.

Mood bersifat sementara.

---

# 22. Personality System

Personality berkembang berdasarkan pola interaksi.

MVP traits:

```text
Playful
Curious
Shy
Independent
Clingy
```

Internal range dapat menggunakan:

```text
0.0 - 1.0
```

Personality tidak berubah secara drastis.

Perubahan harus gradual.

---

# 23. Personality Development

Contoh hubungan behavior dengan personality:

```text
Frequently Play
↓
Playful tendency increases
```

```text
Frequently Talk / Explore
↓
Curious tendency increases
```

```text
Very frequent interaction
↓
Clingy tendency may increase
```

```text
Long periods of independent activity
↓
Independent tendency may increase
```

```text
Low social interaction
↓
Shy tendency may increase
```

Rules final akan didefinisikan pada Game Systems Document.

---

# 24. Personality Expression

Personality harus terlihat melalui behavior.

Contoh situasi:

User kembali setelah beberapa jam.

High Clingy:

> "Kamu lama banget."

High Independent:

> "Kamu balik. Aku tadi sibuk sendiri."

High Playful:

> "Akhirnya! Main?"

High Shy:

> "Hai... kamu balik."

Personality tidak boleh hanya berupa angka di profile.

---

# 25. Personality Visibility

Player tidak perlu melihat angka internal.

Possible presentation:

```text
Personality

Playful      ●●●●○
Curious      ●●●○○
Independent  ●●○○○
```

Atau hanya menampilkan traits dominan.

Detail UI ditentukan kemudian.

---

# 26. Memory System

Memory membuat pet memiliki continuity.

MVP menggunakan dua lapisan:

```text
Recent Memory
Long-Term Memory
```

---

# 27. Recent Memory

Recent Memory berisi event atau percakapan terbaru.

Contoh:

```text
User fed pet.
User played with pet.
User talked about work.
User returned after 8 hours.
```

Recent Memory memiliki jumlah terbatas.

Contoh awal:

```text
10-20 recent events
```

Recent Memory dapat dibuang ketika tidak lagi relevan.

---

# 28. Long-Term Memory

Long-Term Memory menyimpan informasi yang penting untuk hubungan.

Contoh:

```text
User works as a frontend developer.

User likes cats.

User named pet Momo.

User has an important event tomorrow.

User promised to play again later.
```

Memory memiliki metadata seperti:

```text
type
importance
createdAt
lastUsedAt
```

---

# 29. Memory Categories

Initial categories:

```text
User Fact
Preference
Relationship Event
Promise
Important Event
Pet Experience
```

Tidak semua conversation harus menjadi long-term memory.

---

# 30. Memory Retrieval

Saat conversation terjadi:

```text
User Message
↓
Context Analysis
↓
Retrieve Relevant Memories
↓
Combine with Pet State
↓
LLM Response
```

Memory retrieval harus relevan dengan topic.

Pet tidak perlu memunculkan memory secara paksa.

---

# 31. Memory Design Principle

Pet tidak harus mengingat semuanya.

Pet sebaiknya mengingat hal yang:

* penting,
* relevan,
* berulang,
* atau punya emotional significance.

Memory berfungsi untuk relationship continuity, bukan surveillance.

---

# 32. Autonomous Behavior

Pet dapat melakukan aktivitas tanpa player input.

MVP autonomous activities:

```text
Sleeping
Playing Alone
Waiting
Looking Around
Thinking
Resting
Eating Small Snack
```

Activity dipilih berdasarkan:

```text
State
+
Mood
+
Personality
+
Elapsed Time
```

Contoh:

```text
High Energy
+
High Playful
+
User Offline
↓
Playing Alone
```

---

# 33. Offline Simulation

Game tidak perlu menjalankan simulation terus-menerus.

Saat player kembali:

```text
Current Time
-
Last Active Time
↓
Elapsed Time
↓
Update Needs
↓
Resolve Offline Activity
↓
Generate Relevant Events
↓
Update Pet State
```

Tujuannya adalah membuat waktu terasa berjalan.

---

# 34. Offline Philosophy

Offline progression tidak boleh terlalu punitive.

Pemain yang sibuk tidak boleh merasa dihukum.

Absence dapat mempengaruhi:

* needs,
* activity,
* mood,
* personality tendency.

Namun tidak menyebabkan:

* permanent death,
* irreversible damage,
* extreme Bond loss.

---

# 35. Growth System

Growth ditentukan oleh kombinasi:

```text
Age
+
Interaction
+
Bond
```

Growth tidak hanya berdasarkan waktu.

Initial conceptual requirements:

```text
Egg → Baby
Hatch

Baby → Child
Minimum Age
+
Minimum Interaction

Child → Adult
Minimum Age
+
Minimum Bond
+
Minimum Interaction
```

Nilai final belum ditentukan.

---

# 36. Growth Event

Growth harus menjadi moment penting.

Growth tidak terjadi diam-diam.

Example:

```text
✨ Momo is growing...

🐥
↓
🦊

Momo became Adult.
```

Growth dapat disertai:

* animation,
* sound,
* new dialogue,
* capability unlock.

---

# 37. Skill System

Skill adalah kemampuan nyata yang dapat digunakan pet.

Skill berbeda dari interaction.

Interaction:

```text
Feed
Play
Talk
Sleep
```

Skill:

```text
Search
Reminder
Research
Calendar
Notes
Planning
```

Skill dapat menggunakan external tools.

---

# 38. MVP Skill

MVP hanya membutuhkan:

```text
Search Lv.1
```

Unlock condition:

```text
Adult Stage
```

Tujuannya adalah membuktikan konsep:

> Growth unlocks capability.

---

# 39. Search Lv.1

Example request:

> "Carikan artikel tentang React Server Components."

Flow:

```text
User Request
↓
Intent Detection
↓
Check Skill Availability
↓
Search Tool
↓
Retrieve Results
↓
Pet Summarizes
↓
Pet Responds In Character
```

Tool result harus tetap faktual.

Personality hanya mempengaruhi presentation.

---

# 40. Skill Expression

Curious pet:

> "Aku nemu sesuatu yang menarik."

Playful pet:

> "Aku berburu sebentar dan pulang bawa tiga artikel."

Shy pet:

> "Aku nemu beberapa... mungkin yang ini berguna."

Capability sama.

Character delivery berbeda.

---

# 41. Future Skill Direction

Bukan bagian MVP.

Potential future paths:

```text
             Pet
              │
     ┌────────┼────────┐
     │        │        │
 Explorer   Keeper   Creator
     │        │        │
 Search   Reminder   Ideas
     │        │        │
Research  Calendar  Writing
```

Pet nantinya tidak harus terkunci pada satu class.

Hybrid progression dapat dipertimbangkan.

---

# 42. AI Role

LLM digunakan untuk:

```text
Dialogue Generation
Reaction Generation
Intent Understanding
Memory Candidate Extraction
Tool Request Interpretation
```

LLM tidak menjadi source of truth.

---

# 43. Game Engine Role

Game engine menentukan:

```text
Needs
Mood Rules
Bond
Personality State
Growth
Skill Availability
Time Progression
Offline Simulation
```

LLM hanya membaca state yang diberikan.

---

# 44. AI Context

Context minimal conversation dapat mencakup:

```text
Pet Identity
Growth Stage
Current Needs
Mood
Personality
Bond
Recent Events
Relevant Memories
Available Skills
Current Activity
User Message
```

Example:

```text
Name:
Momo

Stage:
Child

Mood:
Curious

Hunger:
62

Energy:
73

Happiness:
80

Bond:
58

Personality:
Playful 0.72
Curious 0.65
Independent 0.24

Recent Event:
User returned after 7 hours.

Relevant Memory:
User is learning React.
```

---

# 45. AI Response Style

Pet response harus:

* relatively short,
* expressive,
* consistent,
* stage appropriate,
* personality aware,
* context aware.

Baby sebaiknya lebih sederhana.

Adult dapat lebih kompleks.

---

# 46. AI Consistency

AI tidak boleh mengarang state.

Contoh yang harus dihindari:

* mengaku lapar ketika Hunger tinggi,
* mengaku pernah melakukan sesuatu yang tidak ada di history,
* menggunakan skill yang belum unlocked,
* mengatakan growth stage berbeda.

Semua factual state berasal dari game engine.

---

# 47. Pet Home

Pet Home adalah main screen.

Primary elements:

```text
Pet Visual

Current Activity

Mood

Needs

Feed
Play
Talk
Sleep
```

Pet harus menjadi focal point.

UI tidak boleh terasa seperti analytics dashboard.

---

# 48. Chat Screen

Chat memungkinkan conversation lebih panjang.

Chat menampilkan:

* player messages,
* pet responses,
* potentially simple pet reactions.

Chat tetap terikat pada game state.

Conversation tidak boleh terasa seperti aplikasi terpisah dari game.

---

# 49. Pet Profile

Pet Profile dapat menampilkan:

```text
Name
Age
Stage
Bond
Personality
Skills
```

Example:

```text
Momo

Age
18 days

Stage
Adult

Bond
★★★★☆

Traits
Playful
Curious

Skills
Search Lv.1
```

---

# 50. Memory View

Memory screen bersifat optional untuk prototype awal.

Potential format:

```text
Day 1
You named me Momo.

Day 3
You told me you build websites.

Day 8
We talked about your project.

Day 14
I became Adult.
```

Memory View membantu menciptakan sense of shared history.

---

# 51. Notifications

Notifications harus ringan.

Possible examples:

```text
"Momo woke up."

"Momo seems hungry."

"Momo learned something new."
```

Notification tidak boleh menjadi emotional pressure.

---

# 52. No Permanent Death

MVP tidak menggunakan permanent death.

Jika kebutuhan sangat rendah:

* mood berubah,
* response berubah,
* pet dapat memilih istirahat,
* interaction tertentu menjadi terbatas.

Namun pet tidak hilang.

---

# 53. Return After Long Absence

Jika pemain lama tidak membuka game:

Possible result:

```text
Needs recalculated
↓
Offline activities resolved
↓
Independent tendency may increase
↓
Special return dialogue
```

Example:

> "Lama nggak ketemu. Aku tadi banyak main sendiri."

Return experience harus mengundang pemain kembali, bukan memarahi mereka.

---

# 54. Economy

MVP tidak memiliki economy.

Out:

```text
Coins
Gems
Premium Currency
Loot Boxes
Paid Food
Energy Purchases
```

Economy belum diperlukan untuk menguji core loop.

---

# 55. Inventory

Tidak masuk MVP.

Potential future content:

```text
Food
Toys
Gifts
Accessories
Furniture
```

Untuk MVP, Feed dapat menjadi generic action.

---

# 56. Customization

MVP customization minimal:

```text
Pet Name
```

Future possibilities:

```text
Accessories
Room
Decoration
Pet Variants
```

Customization bukan prioritas sebelum attachment loop terbukti.

---

# 57. Audio

Prototype dapat berjalan tanpa audio lengkap.

Potential vertical slice sounds:

```text
Hatch
Feed
Happy Reaction
Sleep
Wake
Growth
Skill Unlock
```

Audio bertujuan memperkuat emotional feedback.

---

# 58. Animation

Prototype animation minimal.

Vertical slice candidate animations:

```text
Idle
Happy
Eating
Playing
Sleeping
Talking
Thinking
Growth
```

Animation harus membantu pet terasa hidup.

---

# 59. Session Examples

Morning session:

```text
Open App
↓
Pet Wakes / Greets
↓
Feed
↓
Short Talk
↓
Close
```

Evening session:

```text
Open App
↓
Play
↓
Conversation
↓
Sleep
↓
Close
```

Target session:

```text
30 seconds - 5 minutes
```

Longer sessions tetap mungkin melalui Talk.

---

# 60. MVP Scope

MVP mencakup:

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

Basic Personality

Recent Memory
Long-Term Memory

Autonomous Activity

Offline Progression

Growth

Search Lv.1
```

---

# 61. Out of Scope

Tidak termasuk MVP:

```text
Multiple Species

Breeding

Combat

Multiplayer

Friends

Trading

Marketplace

Inventory

Complex Food System

Accessories

Room Decoration

Currency

Achievements

Daily Quests

Leaderboard

Voice Chat

AR

Complex Skill Tree

Multiple Pets
```

Fitur-fitur ini dapat dipertimbangkan setelah core experience terbukti.

---

# 62. Prototype Strategy

Prototype dibuat bertahap.

## Prototype 0.1

Focus:

```text
Pet State
Time Progression
Feed
Play
Sleep
Basic UI
```

No AI required.

Goal:

> prove simulation works.

---

## Prototype 0.2

Add:

```text
Talk
LLM
Mood
Personality Context
```

Goal:

> prove the pet can express state and character.

---

## Prototype 0.3

Add:

```text
Memory
Offline Events
Growth
```

Goal:

> prove continuity across sessions.

---

## Prototype 0.4

Add:

```text
Search Lv.1
```

Goal:

> prove growth can unlock useful capability.

---

# 63. MVP Success Criteria

MVP dianggap berhasil secara desain jika pemain:

* memahami kondisi pet,
* kembali untuk mengecek pet,
* memperhatikan perubahan behavior,
* melihat personality yang konsisten,
* merasa pet mengingat mereka,
* tertarik melihat growth,
* menggunakan unlocked skill.

Strong qualitative signals:

> "Pet-ku sekarang lebih manja."

> "Dia masih ingat obrolan kemarin."

> "Punyaku beda dari punya orang lain."

> "Sekarang dia sudah bisa bantu nyari sesuatu."

---

# 64. Failure Signals

Core design perlu dievaluasi jika pemain mengatakan:

> "Ini cuma chatbot pakai avatar."

> "Stats-nya nggak berpengaruh."

> "Semua pet rasanya sama."

> "Aku cuma buka kalau butuh Search."

> "Pet terlalu demanding."

> "Memory-nya terasa random."

> "Growth cuma ganti gambar."

---

# 65. Definition of Done for MVP

MVP pertama dianggap selesai ketika pemain dapat:

1. menerima Egg,
2. menetaskan pet,
3. memberi nama,
4. Feed,
5. Play,
6. Talk,
7. Sleep,
8. meninggalkan aplikasi,
9. kembali setelah waktu berlalu,
10. melihat state berubah,
11. melihat pet bereaksi terhadap absence,
12. membangun Bond,
13. melihat personality berkembang,
14. membuat pet mengingat beberapa informasi,
15. melihat autonomous behavior,
16. melihat pet tumbuh,
17. mencapai Adult,
18. membuka Search Lv.1,
19. meminta pet melakukan Search,
20. menerima hasil Search melalui personality pet.

Yang paling penting:

> Setelah beberapa hari, pemain merasa bahwa pet tersebut memiliki sejarah bersama mereka.

---

# 66. Open Design Questions

Beberapa pertanyaan belum dijawab pada versi ini:

* Seberapa cepat Needs turun?
* Apakah Hunger dan Energy berubah saat Sleep?
* Berapa banyak Bond yang ideal per hari?
* Apakah Bond dapat turun?
* Bagaimana anti-spam interaction bekerja?
* Bagaimana mood priority ditentukan?
* Bagaimana personality traits saling mempengaruhi?
* Berapa lama setiap growth stage?
* Bagaimana memilih autonomous activity?
* Bagaimana menentukan memory importance?
* Berapa memory yang disimpan?
* Bagaimana personality mempengaruhi AI prompt?
* Apa batas Search Lv.1?
* Apa yang terjadi jika user meminta skill yang belum unlocked?

Pertanyaan tersebut akan dibahas pada:

`02-game-systems.md`

dan dokumen sistem terkait.

---

# 67. North Star

Semua mechanics di Mini GDD harus mendukung satu tujuan:

> **Membuat pet terasa seperti makhluk yang hidup, berkembang, dan memiliki sejarah bersama pemain.**

Jika sebuah mechanic menambah kompleksitas tetapi tidak memperkuat pengalaman tersebut, mechanic itu bukan prioritas.
