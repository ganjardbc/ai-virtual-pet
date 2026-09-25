# Product Vision

## AI Virtual Pet

AI Virtual Pet adalah game companion berbasis AI di mana pemain membesarkan sebuah makhluk digital yang memiliki kehidupan, kebutuhan, personality, memory, dan kemampuan yang berkembang dari waktu ke waktu.

Project ini bertujuan membuat pengalaman yang terasa lebih dekat dengan **membesarkan karakter hidup** daripada menggunakan chatbot.

> **Core vision:** Raise your own AI companion.

---

# 1. Vision Statement

AI Virtual Pet ingin menciptakan companion digital yang:

* hidup dalam dunia dan aturan yang persisten,
* memiliki sejarah bersama pemain,
* membentuk personality berdasarkan interaksi,
* mengingat pengalaman penting,
* tumbuh secara visual dan behavioral,
* serta memperoleh kemampuan baru seiring perkembangannya.

Pet tidak dirancang sebagai AI assistant yang langsung mengetahui dan mampu melakukan semuanya sejak awal.

Kemampuan pet harus terasa **dipelajari dan diperoleh melalui perjalanan bersama pemain**.

---

# 2. Core Idea

Konsep dasarnya berasal dari virtual pet klasik:

```text
Hatch
↓
Care
↓
Interact
↓
Grow
```

AI menambahkan lapisan baru:

```text
Hatch
↓
Care
↓
Interact
↓
Remember
↓
Develop Personality
↓
Grow
↓
Learn Skills
↓
Become a Companion
```

Perbedaan utamanya adalah pet tidak hanya berubah secara visual.

Pet juga berkembang dalam:

* cara berbicara,
* cara bereaksi,
* hubungan dengan pemain,
* memory,
* kebiasaan,
* dan kemampuan.

---

# 3. Product Promise

Pengalaman ideal yang ingin diberikan adalah:

> "Pet ini menjadi seperti ini karena cara aku membesarkannya."

Dua pemain yang memulai dari kondisi yang sama seharusnya dapat memiliki pet yang berbeda setelah beberapa waktu.

Perbedaan tersebut dapat terlihat melalui:

* personality,
* communication style,
* attachment level,
* memories,
* habits,
* reactions,
* growth path,
* dan skills.

Keunikan pet harus muncul dari **history**, bukan dari randomization semata.

---

# 4. Player Fantasy

Player fantasy utama:

> Membesarkan makhluk AI kecil hingga menjadi companion unik yang mengenal, mengingat, dan membantu pemain.

Perjalanan tersebut dapat terasa seperti:

```text
Day 1

"Ini pet baruku."

↓

Day 3

"Dia mulai punya kebiasaan."

↓

Day 7

"Kayaknya dia jadi lebih playful."

↓

Day 14

"Dia masih ingat yang aku ceritakan kemarin."

↓

Day 30

"Dia sudah mulai benar-benar mengenalku."

↓

Later

"Pet-ku bisa melakukan hal yang dulu belum bisa."
```

Tujuan akhirnya bukan menciptakan AI yang selalu sempurna.

Tujuannya menciptakan **sense of growth and shared history**.

---

# 5. Emotional Goals

Game dirancang untuk menghasilkan beberapa emosi utama.

## Care

Pemain ingin memperhatikan kondisi pet karena merasa peduli, bukan hanya karena mengejar angka.

Contoh:

> "Kayaknya dia capek. Aku tidurin dulu."

---

## Curiosity

Pemain ingin kembali untuk melihat:

* apa yang sedang dilakukan pet,
* apakah mood berubah,
* apakah personality berkembang,
* apakah pet mengingat sesuatu,
* apa yang akan dikatakan pet.

Pertanyaan yang ingin muncul:

> "Sekarang dia lagi ngapain, ya?"

---

## Attachment

Seiring waktu, pemain mulai melihat pet sebagai karakter individual.

Bukan hanya:

> "pet nomor 18492"

tetapi:

> "ini Momo."

Attachment muncul melalui:

* history,
* memory,
* repeated interaction,
* personality,
* dan growth.

---

## Surprise

Pet harus sesekali melakukan sesuatu yang tidak sepenuhnya diprediksi pemain, tetapi tetap masuk akal berdasarkan history dan personality.

Contoh:

* menggunakan nickname baru,
* mengingat percakapan lama,
* mengomentari kebiasaan pemain,
* memiliki aktivitas sendiri,
* menunjukkan reaction berbeda dari sebelumnya.

Surprise tidak boleh terasa random tanpa konteks.

---

## Pride

Pemain harus merasa ikut berperan dalam perkembangan pet.

Contoh:

> "Sekarang dia bisa Search."

Yang penting bukan hanya capability-nya.

Yang penting adalah:

> "Aku membesarkannya sampai dia bisa melakukan itu."

---

# 6. Game Pillars

Empat pillars menjadi dasar seluruh keputusan desain.

---

## Pillar 1: Alive

Pet harus terasa hidup.

Pet bukan UI yang menunggu input.

Pet memiliki:

* needs,
* mood,
* activity,
* internal state,
* time progression,
* dan autonomous behavior.

Waktu tetap berjalan saat pemain tidak berada di aplikasi.

Ketika pemain kembali, dunia pet seharusnya terasa telah bergerak.

Contoh:

```text
User closes app.

↓

Pet becomes tired.

↓

Pet sleeps.

↓

Pet wakes up.

↓

User returns.

↓

Pet reacts to what happened.
```

### Design Test

Sebuah fitur mendukung pillar ini jika membuat pemain merasa:

> "Pet-ku melakukan sesuatu walaupun aku tidak sedang melihatnya."

---

# 7. Pillar 2: Bond

Hubungan pemain dengan pet adalah pusat gameplay.

Bond bukan sekadar angka friendship.

Bond harus terlihat melalui behavior.

Contoh:

Low Bond:

> "Halo."

Higher Bond:

> "Kamu balik!"

Higher Bond + Memory:

> "Kemarin kamu bilang hari ini bakal sibuk. Gimana tadi?"

Hubungan terbentuk melalui:

* interaction history,
* consistency,
* shared events,
* memory,
* dan time.

### Design Test

Sebuah fitur mendukung pillar ini jika membuat pemain merasa:

> "Pet ini mengenalku."

---

# 8. Pillar 3: Growth

Pet harus berubah seiring perjalanan.

Growth mencakup beberapa dimensi.

### Physical Growth

```text
Egg
↓
Baby
↓
Child
↓
Adult
```

### Personality Growth

Contoh:

```text
Neutral
↓
Playful
↓
Very Playful
```

atau:

```text
Dependent
↓
More Independent
```

### Relationship Growth

Pet menjadi semakin familiar dengan pemain.

### Behavioral Growth

Cara pet berinteraksi menjadi lebih kompleks.

### Capability Growth

Pet memperoleh skill baru.

### Design Test

Sebuah fitur mendukung pillar ini jika pemain dapat melihat perbedaan yang jelas antara:

> "pet-ku dulu"

dan:

> "pet-ku sekarang."

---

# 9. Pillar 4: Useful

Growth pet tidak hanya menghasilkan kosmetik.

Seiring perkembangan, pet dapat memperoleh kemampuan yang berguna dalam kehidupan nyata.

Contoh:

```text
Search
Reminder
Research
Notes
Calendar
Planning
```

Kemampuan tersebut harus terasa sebagai sesuatu yang dipelajari oleh pet.

Bukan sekadar menu aplikasi yang tiba-tiba muncul.

Contoh pengalaman unlock:

```text
✨ New Skill Learned

Search Lv.1

Pet:
"Aku kayaknya sekarang sudah cukup pintar
buat bantu nyari sesuatu."
```

### Design Test

Sebuah fitur mendukung pillar ini jika:

> perkembangan pet memperluas apa yang dapat dilakukan pemain bersama pet tersebut.

---

# 10. What Makes This Different

AI Virtual Pet bukan hanya:

```text
Tamagotchi + LLM
```

dan bukan:

```text
Chatbot + Cute Avatar
```

Perbedaannya terletak pada hubungan antara:

```text
Simulation
+
Time
+
Memory
+
Personality
+
Growth
+
AI
```

LLM menyediakan fleksibilitas komunikasi.

Tetapi game simulation memberikan:

* continuity,
* constraints,
* consequences,
* dan identity.

Tanpa simulation, pet hanya menjadi chatbot yang sedang roleplay.

---

# 11. Character Before Assistant

Pet harus terasa sebagai **character terlebih dahulu, assistant kemudian**.

Jika pemain berkata:

> "Cari artikel tentang WebAssembly."

Pet boleh menggunakan skill Search.

Tetapi hasilnya tetap disampaikan sebagai karakter.

Contoh:

> "Aku nemu tiga yang kelihatannya menarik. Yang pertama cukup teknis, tapi kayaknya cocok buat kamu."

Bukan:

> "Here are the top five search results."

Functional capability harus tetap berada di dalam identity pet.

---

# 12. Relationship Before Productivity

Product tidak boleh berubah terlalu cepat menjadi productivity tool.

Utility merupakan hadiah dari growth.

Urutan pengalaman harus tetap:

```text
Meet
↓
Care
↓
Bond
↓
Grow
↓
Learn
↓
Help
```

Bukan:

```text
Sign Up
↓
AI Assistant Dashboard
```

Jika utility terlalu dominan sejak awal, emotional relationship kehilangan nilai.

---

# 13. Growth Before Unlock

Capability baru sebaiknya memiliki narasi perkembangan.

Contoh yang kurang sesuai:

```text
Account Level 5
→ Search unlocked
```

Pendekatan yang lebih sesuai:

```text
Pet grows into Adult

↓

Pet becomes more capable

↓

Pet learns Search
```

Progression harus terasa terjadi pada karakter, bukan akun.

---

# 14. History Creates Identity

Pet identity tidak hanya ditentukan oleh prompt.

Identity terbentuk dari:

```text
Initial Traits
+
Player Interaction
+
Events
+
Memories
+
Time
+
Growth
```

Contoh:

```text
Pet A

Often played with
Often talked to
Rarely left alone

↓

Playful
Clingy
Talkative
```

Sementara pet lain:

```text
Pet B

Less frequent interaction
Often left alone
Occasional long conversations

↓

Independent
Calm
Thoughtful
```

Keduanya bisa berasal dari spesies awal yang sama.

---

# 15. AI Philosophy

AI digunakan untuk memberikan fleksibilitas pada character behavior.

AI bukan pengganti game design.

LLM terutama digunakan untuk:

* dialogue generation,
* expression,
* contextual reaction,
* intent understanding,
* memory candidate extraction,
* dan tool interaction.

Game engine tetap mengontrol:

* needs,
* stats,
* mood rules,
* growth,
* skill availability,
* progression,
* dan persistent state.

Prinsip:

> **AI interprets the character. The game defines the character.**

---

# 16. Persistence

Pet harus memiliki continuity.

Jika pemain menutup aplikasi hari ini dan kembali besok, game harus memahami bahwa waktu telah berlalu.

Continuity mencakup:

* elapsed time,
* pet activity,
* needs,
* memory,
* recent events,
* dan relationship history.

Pengalaman tidak boleh terasa seperti memulai chat baru setiap kali aplikasi dibuka.

---

# 17. Offline Life

Pet tetap memiliki kehidupan ketika pemain offline.

Namun offline progression tidak boleh digunakan sebagai punishment engine.

Tujuannya:

> membuat dunia terasa hidup.

Bukan:

> menghukum pemain karena punya kehidupan di luar game.

Contoh baik:

> "Tadi aku sempat tidur."

Contoh yang harus dihindari jika berlebihan:

> "Aku sedih sekali karena kamu meninggalkanku selama 6 jam."

---

# 18. No Guilt-Driven Design

Game tidak boleh bergantung pada rasa bersalah untuk mempertahankan pemain.

Hindari desain seperti:

* pet mati karena pemain sibuk,
* constant sadness notifications,
* punishment besar karena absence,
* emotional blackmail,
* aggressive streak systems.

Return motivation sebaiknya datang dari:

```text
Curiosity
Attachment
Growth
Discovery
Utility
```

---

# 19. Failure Philosophy

Untuk MVP, tidak ada permanent death.

Low needs dapat menghasilkan:

* mood changes,
* altered reactions,
* temporary limitations,
* behavioral changes.

Tetapi tidak menghapus pet.

Hubungan jangka panjang adalah asset utama game.

Permanent death berisiko menghapus investasi emosional tersebut.

---

# 20. Session Philosophy

Game harus nyaman dimainkan dalam sesi singkat.

Contoh:

```text
Morning

Open
↓
Feed
↓
Talk briefly
↓
Close
```

atau:

```text
Night

Open
↓
Play
↓
Conversation
↓
Sleep
↓
Close
```

Target umum:

```text
30 seconds
to
5 minutes
```

Conversation yang lebih panjang tetap memungkinkan jika pemain menginginkannya.

---

# 21. Low Friction

Basic interaction harus cepat.

Pemain tidak perlu melewati banyak menu untuk:

* feed,
* play,
* talk,
* atau melihat kondisi pet.

Pet adalah pusat interface.

Bukan menu.

---

# 22. Visual Direction

Detail visual belum diputuskan.

Namun visual harus mendukung:

* readability,
* emotional expression,
* personality,
* growth,
* dan attachment.

Pet harus mudah mengekspresikan:

* happy,
* sleepy,
* hungry,
* curious,
* annoyed,
* excited,
* bored.

Visual complexity bukan prioritas awal.

Prototype dapat menggunakan placeholder atau emoji.

---

# 23. Tone

Tone game secara umum:

* warm,
* playful,
* expressive,
* slightly unpredictable,
* personal.

Pet tidak harus selalu cheerful.

Karakter boleh:

* malas,
* penasaran,
* ngambek ringan,
* excited,
* malu,
* atau cuek.

Variation penting agar karakter tidak terasa plastik.

---

# 24. Personality Philosophy

Tidak ada personality yang secara universal dianggap lebih baik.

Playful bukan upgrade dari shy.

Independent bukan downgrade dari clingy.

Personality menghasilkan perbedaan behavior.

Tujuannya adalah uniqueness, bukan optimization.

Pemain tidak seharusnya merasa harus mengejar "build terbaik".

---

# 25. Emergent Personality

Sebisa mungkin, personality muncul dari pola interaction.

Contoh:

```text
Player frequently chooses Play
↓
Pet becomes more playful
```

Namun perubahan harus gradual.

Satu interaction tidak boleh tiba-tiba mengubah karakter.

Personality adalah hasil akumulasi history.

---

# 26. Memory Philosophy

Memory bukan hanya fitur untuk membuat AI terlihat pintar.

Memory harus memperkuat relationship.

Memory yang bernilai tinggi biasanya berkaitan dengan:

* siapa pemain,
* apa yang pemain sukai,
* pengalaman bersama,
* meaningful events,
* promises,
* milestones.

Game tidak perlu mengingat semua hal.

Memory yang terlalu banyak dapat membuat character terasa mekanis atau menyeramkan.

---

# 27. Memory Must Have Purpose

Sebuah memory sebaiknya disimpan jika dapat membantu:

```text
Future Conversation

Relationship Continuity

Personalization

Pet Behavior

Growth
```

Jika tidak pernah digunakan lagi, memory tersebut mungkin tidak diperlukan.

---

# 28. Skill Philosophy

Skill merepresentasikan perkembangan capability pet.

Skill tidak hanya berupa tombol.

Skill harus dapat:

* digunakan melalui conversation,
* dipengaruhi personality,
* berkembang levelnya,
* dan nantinya membentuk specialization.

Contoh future path:

```text
              Pet

         ┌─────┼─────┐

     Explorer Keeper Creator

        ↓       ↓       ↓

      Search Reminder Ideas

        ↓       ↓       ↓

    Research Calendar Writing
```

MVP tidak membutuhkan seluruh tree tersebut.

---

# 29. Player Agency

Pemain tidak memilih seluruh masa depan pet melalui character creation.

Sebagian besar perkembangan muncul melalui tindakan.

Pemain mempengaruhi pet dengan:

* bagaimana mereka merawat,
* bagaimana mereka berbicara,
* seberapa sering mereka berinteraksi,
* jenis aktivitas yang dilakukan,
* dan skill yang digunakan.

Dengan demikian:

> interaction adalah character creation.

---

# 30. No Perfect Pet

Game sebaiknya tidak mendorong pemain menciptakan pet dengan semua stat maksimum.

Pet yang menarik memiliki:

* kekuatan,
* kebiasaan,
* quirks,
* dan kelemahan kecil.

Jika semua personality menuju nilai maksimum yang sama, semua pet akhirnya menjadi identik.

Itu harus dihindari.

---

# 31. Player-Pet Relationship Model

Hubungan idealnya bergerak dari:

```text
Stranger

↓

Familiar

↓

Attached

↓

Trusted Companion
```

Transition tidak perlu ditampilkan sebagai level eksplisit.

Behavior pet dapat menunjukkan perubahan tersebut.

---

# 32. Long-Term Vision

Jika core concept bekerja, pet dapat berkembang dari virtual companion sederhana menjadi personal AI character yang memiliki kombinasi:

```text
Memory
+
Personality
+
Tools
+
History
+
Skills
```

Future experience dapat mencakup:

* richer skill trees,
* custom environments,
* activities,
* voice,
* multiple species,
* collaborative tasks,
* richer autonomous behavior.

Namun semua expansion harus tetap berakar pada:

> relationship dan growth.

---

# 33. What We Are Not Building

Project ini bukan:

### Generic AI Assistant

Tujuan utama bukan menggantikan productivity suite.

---

### Pure Chatbot

Conversation hanyalah salah satu interaction.

---

### Traditional Idle Game

Progression tidak hanya berupa angka yang meningkat otomatis.

---

### Punishment-Based Tamagotchi

Pet tidak dirancang untuk menuntut perhatian terus-menerus.

---

### Feature Marketplace

Jumlah integrations bukan ukuran utama kualitas game.

---

# 34. Design Priority Order

Jika harus memilih, prioritas desain adalah:

```text
1. Pet feels alive

2. Relationship feels persistent

3. Personality feels consistent

4. Growth feels meaningful

5. Skills feel useful

6. More content
```

Jumlah fitur berada di bawah kualitas core experience.

---

# 35. Vision Success Signals

Visi dianggap mulai bekerja jika pemain secara spontan mengatakan hal-hal seperti:

> "Pet-ku jadi manja."

> "Kayaknya dia nggak suka kalau aku ajak main pas ngantuk."

> "Dia masih ingat yang aku ceritain kemarin."

> "Punyaku beda banget sama punya kamu."

> "Dia sekarang sudah bisa bantu nyari artikel."

Pernyataan tersebut menunjukkan pemain mulai melihat pet sebagai individual character.

---

# 36. Vision Failure Signals

Beberapa tanda bahwa desain melenceng:

> "Ini cuma chatbot pakai karakter lucu."

> "Aku cuma buka kalau butuh Search."

> "Semua pet jawabannya sama."

> "Stats-nya nggak ada pengaruh."

> "Personality cuma tulisan di profile."

> "Aku harus buka terus supaya pet nggak rusak."

Jika feedback seperti ini dominan, core vision belum tercapai.

---

# 37. North Star Question

Setiap keputusan besar harus diuji dengan pertanyaan:

> **Apakah ini membuat pet terasa lebih seperti makhluk yang tumbuh bersama pemain?**

Jika jawabannya tidak, fitur tersebut perlu dipertanyakan.

---

# 38. Product Essence

Jika seluruh project harus diringkas menjadi satu perjalanan:

```text
A player receives a small digital creature.

They care for it.

They talk to it.

It remembers.

It changes.

It grows.

It learns.

Eventually, it becomes a companion
that could only have become this way
because of the life they shared.
```

Itulah pengalaman yang ingin dibangun.
