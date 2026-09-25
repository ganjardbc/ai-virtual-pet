# Product Experience Principles

## 1. Purpose

Dokumen ini mendefinisikan prinsip pengalaman utama **AI Virtual Pet**.

Dokumen ini bukan specification fitur dan bukan game rules.

Fungsinya adalah menjadi **decision framework** ketika terdapat beberapa pilihan desain, UX, AI behavior, atau implementation yang sama-sama memungkinkan.

Pertanyaan utamanya:

> Apakah keputusan ini membuat pet terasa lebih seperti companion yang hidup, atau justru lebih seperti aplikasi dengan avatar?

Jika sebuah fitur technically useful tetapi merusak core fantasy, fitur tersebut harus didesain ulang.

---

# 2. North Star

Core fantasy:

> **Raise your own AI companion.**

Player bukan sekadar menggunakan AI.

Player:

```text id="y1j3sh"
meets
 ↓
cares for
 ↓
learns about
 ↓
builds history with
 ↓
watches grow
 ↓
and eventually relies on
```

sebuah companion.

Target experience jangka panjang:

> **“This is my pet.”**

bukan:

> **“This is my AI app.”**

---

# 3. Experience Hierarchy

Ketika terjadi konflik desain, gunakan hierarchy berikut:

```text id="32nbeg"
Character
   ↓
Relationship
   ↓
Life Simulation
   ↓
Growth
   ↓
Utility
   ↓
Convenience
```

Hierarchy ini bukan berarti convenience tidak penting.

Artinya convenience tidak boleh menghancurkan layer yang berada di atasnya.

Contoh:

Jika sebuah shortcut membuat Search lebih cepat tetapi membuat pet sepenuhnya tidak relevan terhadap experience, shortcut tersebut perlu ditinjau ulang.

---

# 4. Principle 01 — Character First, Assistant Second

Pet adalah character terlebih dahulu.

Utility merupakan kemampuan yang dimiliki character tersebut.

Bukan sebaliknya.

Wrong framing:

```text id="wjq2aa"
AI Assistant
+
Pet Avatar
```

Correct framing:

```text id="ve3yqe"
Pet
+
learned capabilities
```

Search bukan fitur aplikasi yang kebetulan memiliki mascot.

Search adalah kemampuan yang dipelajari pet.

---

# 5. Decision Test

Untuk setiap future feature, tanyakan:

> Jika pet dihapus dari layar, apakah experience masih hampir sama?

Jika jawabannya:

```text id="jy1yp5"
Yes
```

maka fitur tersebut berisiko menjadi application feature yang hanya ditempeli character.

Feature perlu dicari cara agar:

```text id="f59tl4"
Pet
→ participates
→ reacts
→ remembers when relevant
→ expresses personality
```

tanpa membuat interaction menjadi lambat atau gimmicky.

---

# 6. Principle 02 — The Pet Lives Between Visits

Pet tidak hanya ada ketika aplikasi terbuka.

Player harus memiliki impression:

> Kehidupan pet terus berjalan ketika aku pergi.

Ini dicapai melalui:

* elapsed-time simulation,
* sleep,
* autonomous behavior,
* current activity,
* state changes,
* recent events.

Bukan melalui continuous AI agent.

---

# 7. Return Is a Core Moment

Membuka game kembali bukan hanya:

```text id="0nmxh6"
load saved state
```

tetapi bagian dari core experience.

Player idealnya bertanya:

> “Sekarang dia lagi apa?”

Return experience harus memberikan evidence bahwa waktu telah berlalu.

Namun evidence tersebut tidak perlu selalu berupa recap panjang.

Kadang cukup:

```text id="lx7tju"
pet sedang tidur
```

atau:

```text id="wmdssn"
pet sedang bermain sendiri
```

---

# 8. Principle 03 — Behavior Before Numbers

Player seharusnya memahami pet terutama melalui:

```text id="m4wh1d"
expression
movement
activity
dialogue
context
```

bukan:

```text id="it82qu"
Hunger = 23.7
Energy = 16.2
```

Numbers penting untuk engine dan debugging.

Character behavior penting untuk player.

---

# 9. State Legibility Still Matters

Behavior-first tidak berarti membuat game cryptic.

Jika player tidak memahami kebutuhan pet, tambahkan supporting UI.

Priority:

```text id="4eocp9"
Character Cue
     ↓
Descriptive Indicator
     ↓
Simple Meter
     ↓
Raw Number
```

Gunakan informasi sebanyak yang dibutuhkan, tetapi sesedikit mungkin untuk mempertahankan character focus.

---

# 10. Principle 04 — Every Meaningful Action Deserves a Reaction

Player action tidak boleh terasa seperti database mutation.

Wrong:

```text id="wjfwyp"
Feed
 ↓
Hunger +25
```

Desired:

```text id="0qmb14"
Feed
 ↓
Pet receives food
 ↓
Pet reacts
 ↓
Game state changes
 ↓
Player understands result
```

Reaction dapat berupa:

* expression,
* animation,
* movement,
* short dialogue,
* environmental response.

---

# 11. Reaction Is Not Decoration

Reaction memiliki fungsi gameplay.

Reaction membantu player memahami:

```text id="bvw5ss"
Was the action accepted?

How did the pet feel?

Did something change?

Was the pet already satisfied?

Was the action rejected?
```

Animation dan character feedback merupakan bagian dari communication system.

---

# 12. Principle 05 — Care Without Guilt

Pet boleh memiliki kebutuhan.

Player boleh gagal memenuhi kebutuhan secara optimal.

Tetapi game tidak menggunakan emotional guilt sebagai retention mechanic.

Avoid:

```text id="n71x7g"
"Kamu meninggalkan aku."

"Aku menunggu sendirian selama seminggu."

"Kamu sudah tidak sayang aku?"
```

Tidak ada passive Bond decay hanya karena player tidak membuka game.

Tidak ada permanent death karena absence.

---

# 13. Absence Has Consequences, Not Punishment

No guilt bukan berarti waktu tidak memiliki efek.

Jika player pergi:

```text id="01vmso"
time passes
 ↓
pet sleeps
 ↓
pet becomes hungry
 ↓
pet rests
 ↓
pet does autonomous activities
```

Ketika kembali, state dapat berbeda.

Namun sistem menghindari:

```text id="u2ztbx"
catastrophic punishment
irreversible loss
emotional coercion
```

---

# 14. Principle 06 — Relationship Is Earned Through History

Bond bukan sekadar meter yang di-grind.

Relationship muncul dari:

```text id="4f2grq"
time
+
interaction
+
shared events
+
memory
+
personality
```

Bond value membantu engine.

Tetapi player experience harus lebih kaya daripada angka Bond.

---

# 15. Shared History Matters

Pet harus dapat memiliki continuity.

Contoh:

```text id="yzs40m"
player names pet
pet grows
player shares preference
pet learns skill
important interaction happens
```

Sebagian pengalaman tersebut dapat menjadi shared history.

Memory digunakan untuk membuat:

> “Kita pernah mengalami ini.”

bukan:

> “Database menyimpan semua yang pernah kamu katakan.”

---

# 16. Principle 07 — Remember Less, Remember Better

Memory menggunakan:

```text id="6ufcmj"
precision > recall
```

Tidak semua conversation layak diingat.

Memory harus:

* relevant,
* useful,
* meaningful,
* correctable,
* forgettable.

Pet tidak boleh membuat player merasa terus-menerus diawasi.

---

# 17. Memory Must Be Grounded

Pet hanya boleh mengklaim ingatan yang benar-benar diberikan kepada AI melalui:

* recent events,
* retrieved memory,
* current context.

Pet tidak boleh improvisasi:

```text id="2nt57p"
"Kamu pernah bilang..."
```

tanpa evidence.

False memory lebih merusak relationship daripada lupa.

---

# 18. Principle 08 — Personality Is Experienced, Not Configured

Personality bukan character customization slider.

Player tidak memulai dengan:

```text id="vj5x43"
Playful     70%
Curious     50%
Shy         20%
```

Personality muncul dan berkembang melalui interaction.

Player menemukan:

> “Pet-ku ternyata suka main.”

bukan mengatur:

> “Playfulness = 0.8.”

---

# 19. Personality Changes Expression, Not Reality

Personality boleh mempengaruhi:

```text id="1bqfqa"
dialogue
animation
autonomous preference
reaction intensity
interaction style
```

Tetapi personality tidak boleh mengubah factual game result secara sembarangan.

Contoh:

Dua pet dapat menerima action yang sama:

```text id="dk5c4c"
PLAY
```

dan mendapatkan valid game mutation yang sama.

Namun satu bereaksi sangat energetic, sementara yang lain lebih reserved.

---

# 20. Principle 09 — Growth Should Feel Like Growing Up

Growth bukan conventional level system.

Avoid framing utama seperti:

```text id="3ru7ya"
Level 4
XP 850 / 1000
```

Growth merupakan:

> Perubahan character yang telah dirawat player.

Growth berasal dari:

```text id="r3nnfu"
Age
+
Meaningful Interaction
+
Bond
```

dan terjadi ketika player hadir.

---

# 21. Growth Preserves Identity

Ketika:

```text id="mhk53n"
Baby → Child → Adult
```

pet tetap character yang sama.

Yang tetap:

```text id="md8qft"
name
personality
bond
memory
history
identity
```

Growth memperluas character.

Bukan menggantinya.

---

# 22. Principle 10 — Capability Is Learned

Utility features harus masuk melalui konsep:

**Skill**

Contoh:

```text id="46zv4n"
Search Lv.1
```

bukan:

```text id="l3em50"
Search Feature Enabled
```

Framing ini menghubungkan utility dengan growth.

Player merasakan:

> “Sekarang pet-ku bisa melakukan ini.”

---

# 23. Utility Must Not Replace Care

Future capabilities seperti:

```text id="p0vq7w"
Search
Reminder
Research
Calendar
Notes
Planning
```

tidak boleh membuat care loop menjadi irrelevant.

Target relationship:

```text id="6k5s5x"
Care
   ↓
Bond
   ↓
Growth
   ↓
Capability
   ↓
More ways to interact
```

bukan:

```text id="sf96eu"
Utility
   ↓
Care becomes decorative
```

---

# 24. Principle 11 — AI Performs the Character, It Does Not Run the World

LLM berfungsi sebagai:

```text id="9q14s7"
actor
+
interpreter
```

Game Engine adalah:

```text id="y7vjd6"
reality
```

AI boleh improvisasi:

```text id="y77vyu"
wording
tone
expression
reaction style
```

AI tidak boleh improvisasi:

```text id="9w6zho"
stats
memory
events
skills
growth
tool results
game history
```

---

# 25. Reality Before Performance

Flow selalu:

```text id="0g75ro"
Intent
 ↓
Game Engine
 ↓
Actual Result
 ↓
Character Performance
```

bukan:

```text id="e14ikx"
AI imagines what happened
 ↓
database tries to follow
```

Jika AI mengatakan sesuatu yang bertentangan dengan engine, engine menang.

---

# 26. Principle 12 — Never Fake Capability

Jika Search gagal:

pet tidak boleh berpura-pura menemukan hasil.

Jika Memory tidak tersedia:

pet tidak boleh berpura-pura ingat.

Jika Skill locked:

pet tidak boleh menggunakan skill tersebut.

Jika action rejected:

pet tidak boleh bertindak seolah action berhasil.

Trust lebih penting daripada illusion.

---

# 27. Failure Can Still Have Character

Technical truth tetap dapat disampaikan dengan character framing setelah failure diketahui.

Contoh:

```text id="bcxkbm"
Search failed
```

System mengetahui failure.

Pet dapat mengatakan:

> “Aku belum berhasil nemuin itu.”

Tetapi tidak boleh membuat hasil pencarian palsu untuk menjaga immersion.

---

# 28. Principle 13 — Complexity Is Earned

Player tidak perlu melihat seluruh produk pada hari pertama.

Experience berkembang bersama pet.

Conceptually:

```text id="cbyd8s"
Egg

very little
 ↓

Baby

care
simple interaction
 ↓

Child

richer conversation
personality
history
 ↓

Adult

skills
greater utility
```

Progressive disclosure menjadi bagian dari growth fantasy.

---

# 29. Empty Space Is Allowed

Tidak setiap screen harus penuh fitur.

Early Pet Home yang hanya memiliki:

```text id="z67apv"
Pet

Feed
Play
Talk
Sleep
```

bukan masalah.

Kesederhanaan membantu player membangun perhatian terhadap pet.

---

# 30. Principle 14 — Convenience Should Remove Friction, Not Character

Convenience tetap penting.

Kita tidak sengaja membuat semua interaction panjang demi immersion.

Contoh:

Feed tidak perlu:

```text id="7pc6jy"
open inventory
 ↓
choose category
 ↓
choose food
 ↓
confirm
 ↓
wait animation
 ↓
close modal
```

jika satu action sudah cukup.

Target:

```text id="uea4lq"
low friction
+
meaningful reaction
```

---

# 31. Character Friction vs Product Friction

Bedakan:

**Character friction**

Contoh:

```text id="4k2azb"
pet terlalu lelah untuk bermain
```

Ini bagian dari game.

**Product friction**

Contoh:

```text id="esxg45"
empat layar untuk memberi makan
```

Ini biasanya harus dikurangi.

---

# 32. Principle 15 — Surprise Should Come From Character, Not Randomness

Pet boleh mengejutkan player melalui:

* personality,
* autonomous behavior,
* remembered context,
* reactions.

Tetapi surprise tidak berarti uncontrolled randomness.

Good:

```text id="krubfx"
Curious pet investigates something.
```

Bad:

```text id="vehrc5"
Random stat changes with no understandable cause.
```

Player harus dapat membangun mental model tentang pet.

---

# 33. Principle 16 — The Player Should Learn the Pet

Salah satu progression paling penting bukan stat.

Melainkan:

> Player semakin memahami siapa pet ini.

Awalnya:

```text id="pbov3l"
"Aku belum tahu sifatnya."
```

Kemudian:

```text id="vrs4i6"
"Dia suka main."
```

Lalu:

```text id="pxt5os"
"Kalau dia penasaran, biasanya dia begini."
```

Ini merupakan progression emosional yang tidak membutuhkan XP bar.

---

# 34. Principle 17 — The Pet Should Learn the Player Carefully

Relationship berjalan dua arah.

Seiring waktu pet dapat mengetahui:

* selected preferences,
* routines,
* meaningful facts,
* shared events.

Tetapi learning harus selective.

Target:

```text id="6cb28r"
recognition
```

bukan:

```text id="mx6o84"
surveillance
```

Player harus dapat memperbaiki atau melupakan memory.

---

# 35. Principle 18 — Important Moments Need Space

Beberapa moment tidak boleh tenggelam di antara normal interactions.

Contoh:

```text id="2m6uyh"
Hatch

Naming

Growth

Skill Unlock

Important Relationship Event
```

Moment tersebut layak mendapatkan:

* pacing,
* visual emphasis,
* reaction,
* persistence sebagai event/memory jika relevan.

Tidak semua interaction membutuhkan spectacle.

Contrast membuat milestone terasa penting.

---

# 36. Principle 19 — Don't Gamify Everything

Tidak semua sistem membutuhkan:

```text id="1z79ts"
XP
streak
badge
achievement
currency
daily quest
progress bar
```

Tambahkan game mechanic hanya jika memperkuat core fantasy.

Retention harus datang terutama dari:

```text id="3rj7ga"
curiosity
attachment
growth
shared history
```

bukan obligation loops.

---

# 37. Principle 20 — Protect the Illusion Without Lying

Virtual pet membutuhkan illusion of life.

Kita boleh menggunakan:

* simulation,
* animation,
* contextual dialogue,
* autonomous activities,

untuk menciptakan illusion tersebut.

Tetapi kita tidak memalsukan:

* events yang tidak terjadi,
* memory yang tidak tersimpan,
* tool results,
* activity yang tidak disimulasikan,
* relationship history.

Target:

> **Believable fiction grounded in real system state.**

---

# 38. Design Conflict Framework

Ketika ada dua desain yang bersaing, evaluasi menggunakan pertanyaan berikut.

### Character

Apakah pet tetap menjadi participant utama?

### Relationship

Apakah ini memperkuat atau melemahkan sense of relationship?

### Legibility

Apakah player memahami apa yang terjadi?

### Agency

Apakah player memiliki meaningful choice atau control?

### Trust

Apakah sistem jujur tentang state, memory, dan capability?

### Friction

Apakah complexity benar-benar diperlukan?

### Longevity

Apakah interaction tetap nyaman setelah dilakukan berkali-kali?

---

# 39. Example Trade-off — Visible Stats

Option A:

```text id="8pzty4"
Hunger: 72
Energy: 44
Happiness: 81
Bond: 36
```

Option B:

```text id="y2a91v"
only character animation
```

Experience principles tidak otomatis memilih salah satu extreme.

Solusi dapat berupa:

```text id="65bv34"
character cues
+
lightweight descriptive status
```

sementara raw numbers tersedia di debug.

Tujuannya:

```text id="kpd9ki"
legibility
without turning pet into dashboard
```

---

# 40. Example Trade-off — Search

Option A:

```text id="4nz35w"
Large Search tab
```

membuat feature sangat accessible tetapi berisiko mengubah product menjadi assistant app.

Option B:

```text id="lkt1e6"
Search hanya dapat dipanggil melalui hidden conversation intent
```

menjaga immersion tetapi dapat membuat capability sulit ditemukan.

Better direction dapat berupa:

```text id="svy01i"
pet learns Search
 ↓
player discovers skill
 ↓
skill becomes accessible
 ↓
pet remains part of execution/presentation
```

---

# 41. Example Trade-off — Offline Return

Option A:

```text id="1ic5o6"
large event log
```

sangat informative tetapi terasa seperti analytics.

Option B:

```text id="1tpk1f"
no information
```

menjaga simplicity tetapi continuity tidak terlihat.

Better direction:

```text id="tdo6du"
current pet activity
+
1–3 relevant recent events when useful
```

---

# 42. Prototype Decision Rule

Prototype tidak harus membuktikan semua principles sekaligus.

Setiap prototype memiliki pertanyaan sendiri.

Prototype 0.1 terutama harus membuktikan:

```text id="i4w3vc"
The Pet Lives Between Visits

Behavior Before Numbers

Every Action Deserves a Reaction

Care Without Guilt
```

Prototype berikutnya menambah:

```text id="8oob21"
Personality Is Experienced

Relationship Is Earned

Remember Less, Remember Better
```

Kemudian:

```text id="6df3k5"
Growth Should Feel Like Growing Up

Capability Is Learned
```

---

# 43. Red Flags

Sebuah feature harus ditinjau ulang jika menghasilkan pola:

```text id="l0q9md"
"It's basically ChatGPT with a pet."
```

```text id="j4k9yj"
"I just keep the bars full."
```

```text id="ztyc76"
"I have to open it every day or I feel punished."
```

```text id="o5qqdv"
"It remembers weird things."
```

```text id="l8z67j"
"The pet doesn't matter once Search unlocks."
```

```text id="gibpys"
"All pets feel the same."
```

---

# 44. Desired Player Language

Strong product signals muncul ketika player secara natural mengatakan:

```text id="k18jvm"
"Dia lapar."
```

```text id="1c7lpv"
"Dia lagi tidur."
```

```text id="f8nq47"
"Punyaku lebih manja."
```

```text id="0x6j07"
"Dia masih ingat itu."
```

```text id="45fhpv"
"Dia udah gede."
```

```text id="jxfk1x"
"Sekarang dia bisa nyari."
```

Bahasa tersebut menunjukkan bahwa systems diterjemahkan menjadi character experience.

---

# 45. Product Test

Untuk major feature baru, lakukan test sederhana:

> **Apakah fitur ini membuat player lebih mengenal, merawat, tumbuh bersama, atau mengandalkan pet mereka?**

Jika tidak melakukan salah satunya, tanyakan:

> **Mengapa fitur ini ada di AI Virtual Pet?**

Tidak semua feature harus memenuhi semua aspek.

Tetapi setiap major feature harus memiliki hubungan yang jelas dengan core fantasy.

---

# 46. Experience North Star Summary

AI Virtual Pet harus terasa seperti:

```text id="yxt7y8"
A creature
that lives,

a character
you learn,

a relationship
you build,

a companion
that grows,

and eventually,

a capable friend
that can help.
```

Urutannya penting.

```text id="a1sjqg"
Life
 ↓
Character
 ↓
Relationship
 ↓
Growth
 ↓
Capability
```

Bukan:

```text id="1xeyrq"
AI tools
 ↓
wrapped in pet graphics
```

---

# 47. Accepted Product Experience Principles

The following principles are considered foundational:

1. Character first, assistant second.
2. The pet lives between visits.
3. Behavior before numbers.
4. Every meaningful action deserves a reaction.
5. Care without guilt.
6. Relationship is earned through history.
7. Remember less, remember better.
8. Personality is experienced, not configured.
9. Growth should feel like growing up.
10. Capability is learned.
11. AI performs the character; Game Engine runs reality.
12. Never fake capability.
13. Complexity is earned.
14. Convenience removes friction, not character.
15. Surprise comes from character, not meaningless randomness.
16. The player should learn the pet.
17. The pet should learn the player carefully.
18. Important moments need space.
19. Don't gamify everything.
20. Protect the illusion without lying.

These principles should remain relatively stable even if individual mechanics, technologies, UI layouts, or providers change.

---

# 48. Next Step

Pre-prototype foundation now consists of:

```text id="7b8skq"
Vision
Game Systems
AI Behavior
Memory
Growth & Skills
Architecture
Data Model
API
Playtesting
Tech Stack
Game UX
Design System
Art Direction
Product Experience Principles
```

The next document should move from product foundation into execution:

```text id="s7y76g"
docs/16-prototype-01-scope.md
```

Its responsibility is to define:

* exact Prototype 0.1 objective,
* included systems,
* excluded systems,
* required screens,
* required simulation scenarios,
* acceptance criteria,
* playtest criteria,
* technical deliverables,
* and Definition of Done.

After Prototype 0.1 scope is frozen:

```text id="8mpf2a"
Prototype Scope
      ↓
Wireframe
      ↓
Implementation Plan
      ↓
Development
      ↓
Playtest
```
