# Art Direction

## 1. Purpose

Dokumen ini mendefinisikan arah visual awal untuk **AI Virtual Pet**.

Art Direction menjawab:

> Dunia seperti apa yang ditempati pet, bagaimana pet terlihat dan bergerak, serta bagaimana visual membantu pet terasa hidup sebagai character?

Dokumen ini bukan final art bible.

Tujuannya adalah memberikan arah yang cukup jelas untuk:

* wireframe,
* prototype assets,
* character exploration,
* environment exploration,
* animation,
* dan future production art.

Prinsip utama tetap:

> **Character first, assistant second.**

---

# 2. Art Direction Goals

Visual harus mendukung empat core pillars:

```text
Alive
Bond
Growth
Useful
```

Prioritas visual:

```text
Character
   ↓
Emotion
   ↓
State
   ↓
Environment
   ↓
Interface
```

Pet adalah pusat experience.

---

# 3. Core Visual Fantasy

Core fantasy:

> **Raise your own AI companion.**

Visual tidak boleh terlalu menekankan bahwa pet adalah software atau AI.

Player seharusnya pertama-tama melihat:

```text
a little living companion
```

bukan:

```text
an AI assistant represented by an avatar
```

AI identity muncul melalui:

* intelligence,
* memory,
* personality,
* conversation,
* learned skills,

bukan melalui visual sci-fi yang berlebihan.

---

# 4. Visual Keywords

Primary visual keywords:

```text
Cozy
Soft
Playful
Expressive
Intimate
Alive
Modern
```

Secondary keywords:

```text
Curious
Whimsical
Calm
Personal
Evolving
```

Avoid:

```text
Cyberpunk
Neon AI
Corporate
Clinical
Hyper-gamified
Overly childish
Overly realistic
```

---

# 5. Character Direction

Pet harus memiliki bentuk yang:

* mudah dikenali,
* expressive,
* readable pada ukuran kecil,
* mudah dianimasikan,
* dapat berkembang antar lifecycle stage,
* cukup abstract untuk memiliki identity sendiri.

Pet tidak harus menyerupai hewan nyata secara langsung.

Direction yang disarankan:

> **Original creature with familiar emotional language.**

Artinya bentuk pet dapat unik, tetapi player tetap mudah membaca:

* mata,
* posture,
* movement,
* emotion.

---

# 6. Character Silhouette

Silhouette harus sederhana dan recognizable.

Pet harus tetap mudah dikenali ketika:

```text
full color
silhouette
small icon
sleeping
moving
```

Avoid terlalu banyak:

* accessories,
* tiny details,
* complex anatomy,
* visual noise.

Prototype sebaiknya menguji silhouette sebelum detail.

---

# 7. Character Proportion

Initial direction:

```text
large head / expressive face
compact body
short limbs
soft silhouette
```

Tetapi tidak perlu ekstrem seperti mascot untuk anak kecil.

Tujuan proportion adalah memperbesar emotional readability.

Face merupakan communication surface utama.

---

# 8. Face

Face harus mampu menampilkan state dengan sedikit elemen.

Minimum expressive features:

```text
Eyes
Mouth
Body posture
```

Optional:

```text
Ears
Tail
Antenna
Markings
```

jika membantu personality.

Eyes kemungkinan menjadi channel ekspresi paling penting.

---

# 9. Expression System

Pet membutuhkan reusable expression vocabulary.

Initial expression set:

```text
Neutral
Happy
Excited
Hungry
Sleepy
Curious
Bored
Lonely
Surprised
Content
```

Expression tidak harus 1:1 dengan Mood enum.

Mood adalah game state.

Expression adalah presentation.

Contoh:

```text
Mood: Hungry

possible expressions:
slightly concerned
looking at food
low-energy stare
```

Hal ini mencegah pet terlihat seperti emoji yang hanya memiliki satu wajah per state.

---

# 10. Body Language

Emotion tidak boleh bergantung hanya pada wajah.

Gunakan:

```text
posture
movement speed
head angle
body bounce
distance to player/camera
idle behavior
```

Contoh:

```text
High Energy
→ faster movement
→ larger gestures

Low Energy
→ slower movement
→ lower posture

Curious
→ leaning forward
→ looking around
```

---

# 11. Lifecycle Visual Progression

Lifecycle:

```text
Egg
 ↓
Baby
 ↓
Child
 ↓
Adult
```

Growth harus terlihat sebagai perkembangan **character yang sama**.

Avoid membuat setiap stage terlihat seperti species yang tidak berhubungan.

Persistent identity dapat dijaga melalui:

* core colors,
* eyes,
* markings,
* silhouette motif,
* movement personality.

---

# 12. Egg

Egg harus memiliki personality bahkan sebelum hatch.

Possible visual properties:

```text
simple shape
small marking
subtle movement
soft glow or pulse
occasional shake
```

Egg tidak perlu memiliki face.

Tujuannya:

> Membuat player merasa ada sesuatu di dalamnya.

---

# 13. Baby

Baby merupakan stage paling vulnerable dan sederhana.

Visual qualities:

```text
small
round
soft
slightly clumsy
high emotional readability
```

Movement dapat terasa:

```text
uncertain
bouncy
curious
```

Baby belum terlihat highly capable.

---

# 14. Child

Child menunjukkan personality lebih kuat.

Visual development dapat berupa:

```text
slightly larger body
more confident posture
more expressive movement
distinctive features becoming clearer
```

Pada stage ini perbedaan personality dapat mulai terasa lebih jelas melalui animation.

---

# 15. Adult

Adult bukan berarti menjadi serious atau humanoid.

Adult berarti:

```text
more capable
more confident
more expressive
more independent
```

Visual harus tetap terasa seperti companion yang sama.

Adult dapat memiliki sedikit lebih banyak visual complexity dibanding Baby.

---

# 16. Personality Through Animation

Personality tidak perlu mengubah anatomy secara drastis.

Sebaliknya, personality terutama muncul melalui:

```text
animation
timing
idle behavior
reaction intensity
proximity
```

Contoh:

### Playful

```text
more bounce
quick reactions
frequent playful idle
```

### Curious

```text
looks around
examines objects
leans toward new things
```

### Shy

```text
smaller movements
hesitation
occasionally looks away
```

### Independent

```text
comfortable doing activities alone
less constant attention-seeking
```

### Clingy

```text
moves closer
strong greeting reactions
frequent attention-seeking
```

Dengan demikian personality dapat berkembang tanpa membutuhkan character model baru.

---

# 17. Environment Direction

Pet sebaiknya memiliki **place**, bukan berada di empty application canvas.

Recommended direction:

> **A small personal habitat / room belonging to the pet.**

Environment menjadi panggung utama Pet Home.

Ini mendukung illusion bahwa pet tetap memiliki kehidupan ketika player pergi.

---

# 18. Pet Habitat

Habitat tidak perlu menjadi complex simulation.

Prototype cukup memiliki:

```text
floor / base
resting area
food area
play area
small environmental details
```

Environment berfungsi sebagai visual context untuk autonomous behavior.

Contoh:

```text
Sleep
→ pet moves/rests near sleeping area

Play Alone
→ pet interacts near play area

Look Around
→ pet observes environment
```

---

# 19. Environment Philosophy

Environment harus:

```text
support pet
not compete with pet
```

Gunakan:

* simple shapes,
* low detail density,
* restrained colors,
* generous negative space.

Pet tetap memiliki strongest contrast dan visual priority.

---

# 20. Environment Progression

Future possibility:

Environment dapat berubah perlahan bersama pet.

Contoh:

```text
Egg
→ minimal habitat

Baby
→ basic cozy room

Child
→ more personal objects

Adult
→ objects related to skills/personality
```

Namun environment progression bukan requirement Prototype 0.1.

---

# 21. Environment and Memory

Future environment dapat menjadi subtle representation dari shared history.

Contoh:

```text
favorite toy
small souvenir
growth keepsake
skill-related object
```

Ini memungkinkan Memory memiliki physical echo di dunia pet tanpa mengubah game menjadi decoration simulator.

Bukan requirement MVP.

---

# 22. Camera

Recommended default:

**Fixed character-focused camera.**

Prototype tidak membutuhkan:

* free camera,
* zoom controls,
* complex navigation,
* 3D camera system.

Composition harus memastikan pet mudah terlihat dalam berbagai activity.

---

# 23. Dimensional Direction

Untuk MVP, recommended direction:

**2D / 2.5D visual presentation.**

Alasan:

* lebih cepat diprototype,
* expressive animation lebih mudah dikontrol,
* lower asset complexity,
* cocok untuk Web,
* mudah beradaptasi ke mobile.

Full 3D tidak diperlukan untuk membuktikan core fantasy.

---

# 24. Illustration Style

Initial direction:

```text
clean shapes
soft forms
limited detail
expressive silhouette
minimal texture
```

Visual dapat menggunakan:

```text
flat illustration
+
subtle dimensional shading
```

daripada pure flat vector atau highly rendered painting.

Exact style akan diputuskan melalui visual exploration.

---

# 25. Line Treatment

Possible direction:

```text
minimal outline
```

atau:

```text
soft colored outline
```

daripada heavy black comic outline.

Tujuannya menjaga visual terasa soft dan modern.

Namun final line treatment belum dikunci.

---

# 26. Color Direction

Mengikuti Design System:

```text
Warm Neutral Base
+
Controlled Accent Colors
```

Environment menggunakan saturation lebih rendah.

Pet dapat menggunakan saturation lebih tinggi agar menjadi focal point.

Conceptually:

```text
Environment
soft / muted

Pet
clear / recognizable

UI
calm / neutral

Feedback
semantic accent
```

---

# 27. Pet Color Identity

Pet sebaiknya memiliki recognizable core palette.

Growth tidak mengganti warna secara acak.

Contoh:

```text
Baby
primary color + simple marking

Child
same primary color
+ developed secondary feature

Adult
same identity
+ richer accent
```

Ini menjaga visual continuity.

---

# 28. Color and Personality

Personality tidak sebaiknya direpresentasikan secara langsung dengan warna tetap.

Avoid:

```text
Playful = orange
Shy = purple
Curious = blue
```

Personality harus terutama muncul melalui behavior.

Color dapat mendukung, tetapi bukan menentukan personality.

---

# 29. Lighting

Lighting direction:

```text
soft
warm
low contrast
```

Environment tidak perlu menggunakan realistic lighting.

Lighting berfungsi untuk:

* mood,
* time,
* focus.

Future possibility:

```text
morning
day
evening
night
```

dapat memberi sense of time.

Tetapi dynamic day/night cycle bukan requirement Prototype 0.1.

---

# 30. Time of Day

Future visual time-of-day dapat membantu pillar:

**Alive**

Contoh:

```text
Morning
soft bright light

Evening
warmer light

Night
dim calm environment
```

Namun game state tidak boleh bergantung pada client visual time.

Backend tetap authoritative terhadap time-related simulation.

---

# 31. Animation Philosophy

Animation adalah bagian fundamental dari character design.

Pet tidak boleh terasa seperti static illustration dengan dialogue bubble.

Animation harus membantu menjawab:

```text
What is the pet feeling?

What is the pet doing?

How energetic is the pet?

How does this pet behave?
```

---

# 32. Animation Layers

Pet animation dapat dibagi menjadi:

```text
Base Motion
State Motion
Action Motion
Personality Variation
Special Moments
```

---

# 33. Base Motion

Base motion menjaga pet terasa hidup bahkan ketika idle.

Contoh:

```text
breathing
blinking
small posture shifts
looking around
```

Idle bukan berarti frozen.

---

# 34. State Motion

State memodifikasi base motion.

Contoh:

```text
Hungry
→ occasional food-seeking gesture

Sleepy
→ slower blink
→ yawn

Happy
→ lighter posture

Bored
→ repetitive idle
```

---

# 35. Action Motion

Core actions membutuhkan clear animation response.

Prototype set:

```text
Eat
Play
Sleep
Wake
Refuse
React
```

Action animation tidak perlu panjang.

Priority:

```text
readability
>
spectacle
```

---

# 36. Personality Variation

Future animation dapat memiliki variants.

Example:

```text
PLAY reaction
```

Playful pet:

```text
big energetic reaction
```

Shy pet:

```text
smaller but happy reaction
```

Game result tetap sama.

Presentation berbeda.

Ini merupakan salah satu cara personality terasa emergent.

---

# 37. Animation Timing

Pet movement dapat menggunakan expressive timing.

UI movement tetap restrained.

Pet:

```text
organic
slightly exaggerated
characterful
```

UI:

```text
fast
predictable
quiet
```

---

# 38. Growth Animation

Growth merupakan special moment.

Growth sequence harus terasa berbeda dari normal action.

Conceptually:

```text
Pet pauses
 ↓
Visual cue
 ↓
Transformation
 ↓
New stage revealed
 ↓
Pet reacts
```

Tidak perlu menggunakan:

```text
LEVEL UP
```

atau RPG effects yang tidak sesuai tone.

---

# 39. Sound Direction

Sound bukan requirement utama Prototype 0.1, tetapi arah dasarnya perlu konsisten.

Target:

```text
soft
small
tactile
warm
```

Possible sound categories:

```text
UI feedback
pet vocalization
care actions
sleep
hatch
growth
```

Avoid:

* loud arcade sounds,
* excessive notification sounds,
* constant audio stimulation.

---

# 40. Pet Vocalization

Pet dapat memiliki non-verbal vocalizations.

Contoh:

```text
chirp
hum
tiny laugh
sleep sound
surprised sound
```

Vocalization dapat memperkuat character tanpa harus menggunakan full voice acting.

Future dialogue tidak harus voiced.

---

# 41. Visual Effects

VFX digunakan secara restrained.

Possible uses:

```text
Hatch
Growth
Excitement
Skill Unlock
Special Bond Moment
```

Normal care action tidak membutuhkan particle explosion.

---

# 42. Care Action Visual Feedback

### Feed

```text
food cue
→ eating motion
→ satisfied reaction
```

### Play

```text
play cue
→ movement
→ energetic reaction
```

### Sleep

```text
transition to resting position
→ slower movement
→ sleeping loop
```

### Talk

```text
attention shift
→ listening pose
→ expression/dialogue
```

Pet harus terlihat benar-benar melakukan action, bukan hanya menerima UI state update.

---

# 43. Need Visualization

Needs tidak perlu divisualisasikan dengan floating icons terus-menerus.

Avoid permanent:

```text
🍖
⚡
❤️
💬
```

di atas kepala pet seperti simulation game dashboard.

Gunakan contextual cues.

Contoh:

```text
Hungry
→ glance toward food area

Sleepy
→ yawn

Bored
→ idle behavior
```

UI status tetap dapat membantu jika cue belum cukup jelas.

---

# 44. Dialogue Presentation

Dialogue merupakan bagian dari character presentation.

Short dialogue dapat muncul dekat pet.

Conceptually:

```text
          ┌─────────────────┐
          │ "Aku ngantuk."  │
          └─────────────────┘

                 PET
```

Bubble tidak boleh menutupi pet atau environment secara berlebihan.

Long conversation dapat menggunakan dedicated layout sambil tetap mempertahankan pet sebagai visual anchor.

---

# 45. Emotional Range

Pet tidak harus selalu bahagia.

Pet dapat terlihat:

```text
tired
bored
lonely
uncertain
hungry
```

Tetapi negative state tidak dibuat disturbing atau guilt-inducing.

Tone:

```text
needs care
```

bukan:

```text
suffering because of you
```

---

# 46. Failure States

Technical failure tidak divisualisasikan sebagai emotional suffering pet.

Jika backend gagal:

```text
System UI
→ connection error
```

bukan:

```text
Pet crying
```

Character emotion harus berasal dari game state, bukan infrastructure state.

---

# 47. Prototype 0.1 Art Scope

Prototype 0.1 tidak membutuhkan final production assets.

Minimum art set:

```text
Egg

Baby Pet
├── Neutral
├── Happy
├── Hungry
├── Sleepy
└── Excited

Core Animations
├── Idle
├── Eat
├── Play
├── Sleep
├── Wake
└── Refuse

Environment
└── Simple Habitat
```

Child dan Adult final assets tidak wajib untuk Simulation Prototype.

---

# 48. Prototype Animation Strategy

Jika full animation terlalu mahal untuk Prototype 0.1, gunakan:

```text
pose changes
+
simple transforms
+
small loops
```

Contoh:

```text
Idle
→ breathing scale

Happy
→ bounce

Sleepy
→ slow sway

Eat
→ short repeated movement
```

Tujuan prototype adalah menguji readability dan feeling, bukan animation production quality.

---

# 49. Placeholder Quality

Placeholder tidak boleh terlalu abstract sampai character feedback tidak dapat diuji.

Bad placeholder:

```text
[ PET ]
```

Better prototype placeholder:

```text
simple character
+
recognizable eyes
+
several expressions
+
basic movement
```

Kita perlu cukup personality untuk menguji apakah player membaca pet sebagai makhluk hidup.

---

# 50. Art Production Principle

Asset complexity harus mengikuti kebutuhan gameplay.

Jangan membuat:

```text
50 expressions
30 animations
20 environment props
```

sebelum diketahui mana yang benar-benar dibutuhkan.

Gunakan:

```text
prototype
↓
observe
↓
identify important expressions
↓
expand
```

---

# 51. Visual Progression Beyond MVP

Possible future progression:

```text
Pet grows
   ↓
Environment develops
   ↓
Personality becomes visually clearer
   ↓
Memories leave subtle traces
   ↓
Skills introduce objects/behaviors
```

Contoh Adult Search skill:

```text
pet examines a small device/book/object
```

sebelum atau selama Search.

Tool tetap technical capability.

Visual membuatnya terasa sebagai kemampuan pet.

---

# 52. Customization

Pet customization bukan MVP requirement.

Future customization dapat mencakup:

```text
accessories
room objects
small visual variants
```

Tetapi customization tidak boleh menghilangkan visual identity pet atau menggantikan growth sebagai primary progression.

---

# 53. Avoiding Generic AI Aesthetics

Hindari visual shorthand seperti:

```text
glowing AI orb
brain icon
circuit board
neon blue-purple gradient everywhere
robot assistant dashboard
```

kecuali ada alasan khusus dalam world design.

AI Virtual Pet tidak perlu terus mengingatkan player:

> "Ini AI."

Behavior pet sudah menunjukkan intelligence.

---

# 54. Avoiding Generic Mobile Game Aesthetics

Hindari tanpa kebutuhan:

```text
currency bar
energy tickets
daily reward chest
red notification dots
battle-pass-like progression
multiple floating buttons
```

UI harus menjaga intimacy antara player dan pet.

---

# 55. Visual Hierarchy

Pet Home visual hierarchy:

```text
1. Pet
2. Pet expression/activity
3. Immediate contextual feedback
4. Core actions
5. Need information
6. Secondary navigation
```

Jika secondary UI lebih menarik perhatian daripada pet, hierarchy perlu diperbaiki.

---

# 56. Reference Evaluation Criteria

Ketika mencari visual references, jangan hanya bertanya:

```text
"Apakah ini lucu?"
```

Evaluasi berdasarkan:

### Character Readability

Apakah emotion mudah dibaca?

### Animation Potential

Apakah bentuk mudah dianimasikan?

### Growth Potential

Apakah character dapat berkembang?

### UI Compatibility

Apakah character tetap menjadi focus dalam interface?

### Longevity

Apakah style masih nyaman dilihat setelah berbulan-bulan?

### Production Cost

Apakah style realistis untuk scope project?

---

# 57. Art Direction Validation

Prototype harus membantu menjawab:

```text
Apakah pet terasa hidup ketika idle?

Apakah mood terbaca tanpa stat?

Apakah care action terasa dilakukan oleh pet?

Apakah environment membuat pet terasa memiliki kehidupan?

Apakah pet masih menjadi focus utama?

Apakah visual terasa terlalu childish?

Apakah UI terasa terlalu seperti aplikasi?
```

---

# 58. Failure Signals

Art direction perlu direvisi jika player mengatakan atau menunjukkan:

```text
"Kayak chatbot pakai maskot."
```

```text
"Pet-nya cuma gambar."
```

```text
"UI-nya lebih menarik daripada pet-nya."
```

```text
"Ini kelihatan seperti aplikasi anak kecil."
```

```text
"Kenapa semuanya terlihat seperti aplikasi AI?"
```

atau player tidak dapat membaca kondisi pet tanpa melihat status UI.

---

# 59. Strong Signals

Direction bekerja jika player:

* melihat pet sebelum UI,
* memperhatikan perubahan expression,
* dapat menebak beberapa kebutuhan dari behavior,
* tertarik melihat apa yang pet lakukan saat kembali,
* mulai mengasosiasikan movement dengan personality,
* merasa growth merupakan perkembangan character yang sama.

---

# 60. Accepted Art Direction

Initial art direction:

* Pet is the visual protagonist.
* Pet merupakan original creature, bukan AI mascot generik.
* Familiar emotional language lebih penting daripada realistic anatomy.
* Silhouette sederhana dan recognizable.
* Face dan body language merupakan primary emotional channels.
* Lifecycle mempertahankan visual identity yang sama.
* Personality terutama muncul melalui animation dan behavior.
* Pet memiliki small personal habitat.
* Environment mendukung pet, tidak bersaing dengannya.
* Fixed character-focused camera digunakan untuk MVP.
* 2D / 2.5D merupakan initial visual direction.
* Clean shapes dan soft forms menjadi starting style.
* Environment menggunakan lower visual intensity daripada pet.
* Animation merupakan bagian fundamental character design.
* Idle state tetap memiliki kehidupan.
* Negative states tidak divisualisasikan secara disturbing atau guilt-driven.
* Generic sci-fi AI aesthetics dihindari.
* Generic hyper-gamified mobile aesthetics dihindari.
* Prototype menggunakan limited but expressive asset set.
* Final character design, exact palette, dan detailed illustration style belum dikunci.

---

# 61. Open Art Decisions

Hal berikut sengaja belum dikunci:

```text
Exact species/form of pet

Exact Baby silhouette

Exact eye/face treatment

Outline vs no-outline

Exact color palette

Exact environment architecture

Sprite vs vector vs skeletal animation

Animation tooling

Sound palette

Day/night visual system

Growth visual differences

Customization direction
```

Keputusan tersebut harus muncul melalui visual exploration dan prototype, bukan asumsi dokumentasi.

---

# 62. Next Step

Art Direction sekarang cukup jelas untuk memandu prototype tanpa terlalu cepat mengunci production art.

Tahap berikutnya:

```text
Game UX
    +
Design System
    +
Art Direction
    ↓
Prototype 0.1 Scope
    ↓
Wireframe
    ↓
Visual Exploration
    ↓
Implementation Plan
```

Sebelum wireframe dibuat, `docs/15-prototype-01-scope.md` harus mengunci secara eksplisit apa yang akan dan tidak akan dibangun dalam Prototype 0.1.

Dengan demikian wireframe tidak ikut mendesain fitur yang sebenarnya berada di Prototype 0.2 atau fase berikutnya.
