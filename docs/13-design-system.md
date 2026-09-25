# Design System

## 1. Purpose

Dokumen ini mendefinisikan fondasi design system untuk **AI Virtual Pet**.

Design system digunakan untuk menjaga konsistensi antara:

* Pet Home,
* onboarding,
* care actions,
* conversation,
* growth,
* skills,
* memory,
* future utility features,
* dan prototype/debug tooling.

Design system harus mendukung prinsip utama produk:

> **Character first, assistant second.**

UI bukan pusat perhatian.

UI merupakan panggung tempat pet hidup.

---

# 2. Design Goals

Design system memiliki lima tujuan utama.

## 2.1 Character First

Pet harus menjadi visual focus utama.

UI tidak boleh bersaing dengan:

* pet,
* expression,
* animation,
* reaction,
* dialogue.

---

## 2.2 Warm, Not Childish

Game harus terasa:

* friendly,
* warm,
* playful,
* soft,
* approachable.

Tetapi tidak terlalu infantil.

Target visual bukan:

```text
children's learning app
```

dan bukan:

```text
enterprise dashboard
```

Melainkan:

```text
digital companion
+
cozy game
+
modern interface
```

---

## 2.3 Simple at First, Rich Over Time

Early experience harus sederhana.

```text
Egg
 ↓
Baby
 ↓
simple interactions
```

Seiring pet berkembang:

```text
Child
 ↓
conversation
 ↓
memories
 ↓
Adult
 ↓
skills
```

UI dapat secara bertahap memperlihatkan complexity.

Player tidak perlu melihat seluruh sistem sejak hari pertama.

---

## 2.4 State Through Character

Kondisi pet sebaiknya disampaikan melalui:

1. Character
2. Animation
3. Dialogue
4. Semantic indicator
5. Numeric value

Urutan tersebut disengaja.

Raw numbers bukan communication layer utama.

---

## 2.5 Calm Interface

Pet merupakan sumber utama personality.

Karena itu UI surrounding pet sebaiknya relatif tenang.

Hindari:

* terlalu banyak gradient,
* terlalu banyak badge,
* excessive shadows,
* excessive animation,
* terlalu banyak competing colors,
* dashboard-like information density.

---

# 3. Design Layers

Design system dibagi menjadi dua visual layer.

## Player Layer

Digunakan oleh normal player experience.

Characteristics:

```text
warm
soft
spacious
character-driven
low information density
```

Digunakan pada:

* onboarding,
* Pet Home,
* care actions,
* Talk,
* growth,
* memories,
* skills.

---

## Debug Layer

Digunakan untuk development dan playtesting.

Characteristics:

```text
neutral
compact
information-dense
explicit
technical
```

Digunakan pada:

* raw stats,
* event logs,
* time travel,
* simulation controls,
* personality values,
* growth debugging.

Debug Layer tidak menentukan visual direction final game.

---

# 4. Visual Personality

Target visual personality:

```text
Cozy
Playful
Soft
Clean
Alive
Modern
```

Avoid:

```text
Corporate
Clinical
Aggressively Gamified
Hyper-colorful
Toy-like
Futuristic AI Dashboard
```

AI aspect tidak perlu divisualisasikan melalui:

* neon gradients,
* glowing brains,
* circuit patterns,
* robot dashboard aesthetics.

Pet adalah AI karena behavior dan capability-nya, bukan karena UI harus terlihat seperti sci-fi console.

---

# 5. Color Philosophy

Color memiliki tiga fungsi utama:

```text
Atmosphere
Semantic State
Interaction
```

Color tidak digunakan hanya sebagai decoration.

Palette awal sebaiknya menggunakan:

```text
Warm Neutral Base
+
Primary Accent
+
Semantic Colors
```

---

# 6. Color Tokens

Exact color values dapat disesuaikan saat visual exploration.

Design system menggunakan semantic token terlebih dahulu.

## Surface

```text
color.surface.background
color.surface.primary
color.surface.secondary
color.surface.elevated
```

## Text

```text
color.text.primary
color.text.secondary
color.text.muted
color.text.inverse
```

## Border

```text
color.border.default
color.border.subtle
color.border.strong
```

## Interaction

```text
color.action.primary
color.action.primaryHover
color.action.secondary
color.action.disabled
```

## Semantic

```text
color.semantic.positive
color.semantic.warning
color.semantic.critical
color.semantic.info
```

## Pet State

Jika diperlukan:

```text
color.pet.happy
color.pet.hungry
color.pet.sleepy
color.pet.excited
color.pet.curious
```

Namun mood tidak boleh bergantung pada color saja.

Expression dan animation tetap primary signal.

---

# 7. Initial Color Direction

Initial direction dapat menggunakan warm neutral background dengan saturated accent secukupnya.

Conceptual palette:

```text
Background
warm off-white

Surface
soft white

Primary Accent
warm coral / orange family

Secondary Accent
soft blue / teal family

Positive
soft green

Warning
warm amber

Critical
soft red

Text
warm near-black
```

Exact HEX values belum dianggap final sampai visual exploration dilakukan.

Design implementation harus menggunakan semantic tokens sehingga palette dapat diganti tanpa mengubah component logic.

---

# 8. Dark Mode

Dark mode bukan requirement Prototype 0.1.

Architecture token harus memungkinkan dark theme di masa depan.

Tetapi prototype tidak perlu menghabiskan waktu untuk mendukung dua visual themes.

Priority:

```text
Good Light Theme
>
Incomplete Light + Dark Theme
```

---

# 9. Typography

Typography harus mendukung dua kebutuhan:

```text
Character
+
Readability
```

UI typography sebaiknya menggunakan sans-serif yang:

* friendly,
* highly readable,
* tidak terlalu geometric,
* tidak terlalu corporate.

Pet dialogue dapat menggunakan typography yang sama dengan treatment berbeda.

Tidak perlu menggunakan decorative font khusus untuk dialogue pada MVP.

---

# 10. Typography Scale

Gunakan semantic typography tokens.

```text
text.display
text.heading.lg
text.heading.md
text.heading.sm

text.body.lg
text.body.md
text.body.sm

text.label
text.caption
```

Contoh hierarchy:

```text
Pet Name
Heading MD

Pet Dialogue
Body LG

Action Label
Label

Status
Body SM

Metadata
Caption
```

---

# 11. Font Weight

Gunakan sedikit variasi weight.

Recommended conceptual set:

```text
Regular
Medium
Semibold
```

Avoid excessive use of bold.

Visual hierarchy sebaiknya berasal dari:

* size,
* spacing,
* placement,
* weight,

bukan bold pada semua elemen.

---

# 12. Spacing System

Gunakan spacing scale berbasis:

**4px**

Conceptual tokens:

```text
space.0 = 0
space.1 = 4
space.2 = 8
space.3 = 12
space.4 = 16
space.5 = 20
space.6 = 24
space.8 = 32
space.10 = 40
space.12 = 48
space.16 = 64
```

Tidak semua spacing harus digunakan.

Tujuan scale adalah menghindari arbitrary values seperti:

```text
13px
19px
27px
```

tanpa alasan.

---

# 13. Layout Philosophy

Pet Home menggunakan **character-centered layout**.

Conceptual hierarchy:

```text
Secondary Information

        ↓

     PET SPACE

        ↓

Pet Reaction / Dialogue

        ↓

Primary Actions
```

Pet mendapatkan area visual terbesar.

---

# 14. Content Width

Desktop web tidak berarti game harus memenuhi seluruh layar.

Player experience sebaiknya memiliki bounded content area.

Conceptually:

```text
Desktop

┌─────────────────────────────────────────┐
│                                         │
│          ┌───────────────────┐          │
│          │                   │          │
│          │     GAME AREA     │          │
│          │                   │          │
│          └───────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

Ini membantu menjaga experience tetap intimate dan memungkinkan future mobile adaptation.

---

# 15. Responsive Philosophy

Walaupun Prototype 0.1 adalah Web, layout harus responsive sejak awal.

Priority:

```text
Desktop
+
Tablet
+
Reasonable Mobile Web
```

Namun tidak perlu mengejar pixel-perfect mobile experience pada Prototype 0.1.

Core layout harus tetap usable pada narrow viewport.

---

# 16. Shape Language

UI menggunakan rounded shapes.

Tujuan:

```text
friendly
soft
approachable
```

bukan:

```text
bubble everywhere
```

Conceptual radius tokens:

```text
radius.sm
radius.md
radius.lg
radius.xl
radius.full
```

Suggested starting values:

```text
sm   = 6px
md   = 10px
lg   = 16px
xl   = 24px
full = 999px
```

---

# 17. Borders

Gunakan subtle borders untuk memisahkan surfaces.

Default:

```text
1px subtle border
```

Hindari heavy borders kecuali:

* selected state,
* strong focus state,
* debug UI.

---

# 18. Elevation

Elevation digunakan secara minimal.

Conceptual levels:

```text
elevation.none
elevation.low
elevation.medium
elevation.overlay
```

Normal cards sebaiknya menggunakan:

```text
border
+
very subtle shadow
```

daripada floating card dengan shadow berat.

---

# 19. Iconography

Icon style harus:

```text
simple
rounded
recognizable
consistent
```

Core action icons:

```text
Feed
Play
Talk
Sleep
```

Icon harus selalu memiliki accessible label ketika meaning tidak obvious.

Jangan bergantung pada icon saja untuk critical actions.

---

# 20. Motion Principles

Motion sangat penting karena pet harus terasa hidup.

Tetapi ada perbedaan antara:

```text
Pet Motion
```

dan:

```text
UI Motion
```

Pet Motion boleh expressive.

UI Motion harus restrained.

---

# 21. UI Motion

UI motion digunakan untuk:

* state transitions,
* button feedback,
* modal appearance,
* content changes,
* navigation.

Characteristics:

```text
quick
soft
purposeful
```

Avoid decorative motion pada setiap interaction.

---

# 22. Pet Motion

Pet motion dapat digunakan untuk:

* idle,
* breathing,
* eating,
* playing,
* sleeping,
* curiosity,
* excitement,
* refusal,
* growth.

Pet motion merupakan salah satu communication channels utama game.

Contoh:

```text
Low Energy
 ↓
slower idle
 ↓
drooping posture
 ↓
sleepy expression
```

tanpa player harus membaca angka Energy.

---

# 23. Reduced Motion

Future production version harus menghormati user preference terhadap reduced motion.

Critical state information tidak boleh hanya disampaikan melalui animation.

---

# 24. Core Components

Initial component vocabulary:

```text
Button
IconButton
ActionButton

Card
Panel

TextInput

Dialog
BottomSheet / Modal

StatusIndicator
ProgressIndicator

Tooltip

Toast

Badge

Avatar / PetPortrait

DialogueBubble
```

Tidak semua component perlu dibangun pada Prototype 0.1.

Build components when needed.

---

# 25. Button Hierarchy

Gunakan tiga hierarchy utama.

## Primary

Untuk action paling penting pada context tertentu.

```text
[ Continue ]
```

## Secondary

Untuk supporting action.

```text
[ Cancel ]
```

## Ghost

Untuk low-emphasis action.

```text
Settings
```

Hindari banyak Primary Buttons dalam satu context.

---

# 26. Care Action Button

Core pet actions memiliki specialized component:

```text
ActionButton
```

Contoh:

```text
[ 🍎 Feed ]

[ ⚽ Play ]

[ 💬 Talk ]

[ 🌙 Sleep ]
```

ActionButton dapat memiliki:

* icon,
* label,
* disabled state,
* pressed feedback,
* contextual state.

ActionButton tidak menampilkan internal game formula.

Jangan tampilkan:

```text
Feed
+25 Hunger
+2 Happiness
+0.3 Bond
```

pada normal player UI.

---

# 27. Action Availability

Unavailable action harus menjelaskan alasannya melalui character feedback bila relevan.

Contoh Play saat Energy terlalu rendah:

```text
Play button
   ↓
Pet reacts tired
   ↓
"Main nanti ya..."
```

Tidak hanya:

```text
Button disabled
```

Jika button disabled digunakan, reason harus tetap dapat dipahami.

---

# 28. Dialogue Bubble

DialogueBubble digunakan untuk short pet expressions.

Contoh:

```text
┌─────────────────────────┐
│ "Aku lapar sedikit..."  │
└─────────────────────────┘
```

DialogueBubble bukan replacement untuk full conversation history.

Pet Home menggunakan dialogue untuk contextual reactions.

---

# 29. Status Indicator

Player-facing status menggunakan descriptive information.

Prefer:

```text
Hungry
Tired
Happy
```

over:

```text
Hunger 31.8
Energy 14.2
Happiness 77.1
```

Numeric stats tersedia dalam debug mode.

---

# 30. Progress Indicators

Progress bar tidak boleh mendominasi Pet Home.

Jika digunakan untuk needs, tampilannya harus secondary terhadap pet.

Example:

```text
Fullness   ●●●○
Energy     ●●○○
```

atau bentuk semantic indicator lainnya.

Exact representation akan diuji melalui wireframe.

---

# 31. Bond Presentation

Bond tidak menggunakan permanent visible progress bar pada Pet Home.

Bond terutama terlihat melalui:

* behavior,
* greeting,
* dialogue,
* animation,
* personality expression.

Future profile dapat menunjukkan relationship label.

Example:

```text
Close Friend
```

Raw Bond:

```text
63.42
```

hanya untuk debug.

---

# 32. Mood Presentation

Mood harus memiliki multiple signals.

Contoh:

```text
Sleepy

expression
+
animation
+
dialogue
+
optional label
```

Jangan gunakan:

```text
yellow = happy
blue = sleepy
```

sebagai satu-satunya signal.

---

# 33. Pet Stage Presentation

Lifecycle:

```text
Egg
Baby
Child
Adult
```

Stage tidak perlu selalu tampil sebagai badge.

Player seharusnya dapat mengenali growth terutama melalui perubahan pet.

Profile dapat menyimpan explicit stage information jika dibutuhkan.

---

# 34. Feedback System

Interaction feedback dibagi menjadi:

```text
Character Feedback
UI Feedback
System Feedback
```

## Character Feedback

Contoh:

```text
animation
expression
dialogue
```

## UI Feedback

Contoh:

```text
button press
loading state
transition
```

## System Feedback

Contoh:

```text
network failure
server unavailable
retry
```

Character feedback tidak boleh digunakan untuk menyembunyikan technical failure.

---

# 35. Success Feedback

Normal care action tidak membutuhkan toast:

```text
Feed successful!
```

Pet reaction sudah menjadi success feedback.

Toast digunakan untuk system-level information yang tidak dapat disampaikan melalui character.

---

# 36. Error Feedback

Bedakan:

```text
Domain Rejection
```

dan:

```text
Technical Failure
```

Domain rejection:

```text
PLAY rejected:
energy too low
```

dapat diterjemahkan menjadi character response.

Technical failure:

```text
server unreachable
```

harus tampil sebagai system error.

Pet tidak boleh mengatakan:

```text
"Aku tidak mau makan."
```

jika penyebab sebenarnya database sedang gagal.

---

# 37. Loading States

Avoid membuat pet terlihat frozen ketika request pendek sedang berjalan.

Possible UI feedback:

```text
button temporarily busy
subtle action state
```

Untuk slow external operations di future versions seperti Search:

```text
Pet is looking for something...
```

boleh digunakan jika tool execution benar-benar sedang berlangsung.

Pet tidak boleh berpura-pura melakukan action yang sebenarnya gagal dimulai.

---

# 38. Empty States

Empty states sebaiknya tetap terasa bagian dari game.

Contoh future Memory screen:

Instead of:

```text
No records found.
```

prefer:

```text
Belum ada banyak cerita bersama.
```

Namun copy tetap harus jelas dan tidak berlebihan.

---

# 39. Accessibility

Design system harus menjaga accessibility sejak awal.

Minimum principles:

* readable contrast,
* keyboard-accessible controls,
* visible focus states,
* semantic HTML,
* reasonable touch targets,
* labels for icons,
* state not communicated by color alone,
* reduced motion support in production.

Target minimum touch/click area:

```text
44 × 44 px
```

untuk primary interactive controls.

---

# 40. Focus States

Keyboard focus harus terlihat jelas.

Focus indicator tidak boleh dihilangkan demi visual aesthetics.

Gunakan semantic token:

```text
color.focus
```

dan consistent focus ring.

---

# 41. Copy Principles

UI copy harus:

```text
short
clear
warm
natural
```

System UI tidak perlu berpura-pura menjadi pet.

Contoh:

System:

```text
Connection lost. Try again.
```

Pet:

```text
"Aku ngantuk..."
```

Keduanya memiliki voice berbeda.

---

# 42. Character Voice vs System Voice

Design harus menjaga separation:

```text
PET VOICE
personality-driven
expressive
contextual

SYSTEM VOICE
clear
neutral
reliable
```

Pet tidak menjelaskan infrastructure errors.

System tidak berbicara seperti character.

---

# 43. Information Disclosure

Gunakan progressive disclosure.

Pet Home:

```text
what matters now
```

Profile:

```text
persistent identity
relationship
traits
```

Memory:

```text
shared history
```

Skills:

```text
learned capabilities
```

Debug:

```text
everything
```

Jangan menaruh semua informasi di Pet Home.

---

# 44. Debug Design System

Debug UI menggunakan component layer terpisah.

Possible layout:

```text
┌──────────────────────────────┐
│ DEBUG                        │
├──────────────────────────────┤
│ hunger          72.42        │
│ energy          43.20        │
│ happiness       81.00        │
│ bond            12.30        │
├──────────────────────────────┤
│ activity        IDLE         │
│ mood            HUNGRY       │
│ lastSimulatedAt ...          │
├──────────────────────────────┤
│ +1h +6h +1d +3d +7d         │
├──────────────────────────────┤
│ Recent Events                │
│ ...                          │
└──────────────────────────────┘
```

Debug UI mengutamakan information density daripada emotional presentation.

---

# 45. Design Tokens

Design implementation sebaiknya menggunakan tokens.

Conceptual structure:

```text
tokens/

color
typography
spacing
radius
shadow
motion
breakpoint
```

Example:

```text
color.surface.background
color.text.primary

space.4

radius.lg

text.body.md

motion.duration.fast
```

Components tidak seharusnya menggunakan arbitrary values jika token yang tepat tersedia.

---

# 46. Component Architecture

Conceptual component hierarchy:

```text
Primitives
   ↓
UI Components
   ↓
Game Components
   ↓
Screens
```

Example:

```text
Button
   ↓
ActionButton
   ↓
CareActions
   ↓
PetHome
```

Game-specific semantics tidak dimasukkan ke generic primitives.

---

# 47. Prototype 0.1 Component Scope

Prototype 0.1 kemungkinan hanya membutuhkan:

```text
Button
IconButton
ActionButton

Panel

DialogueBubble

StatusIndicator

PetStage

PetReaction

DebugPanel

DebugStat
DebugAction
EventList
```

Jangan membangun full component library sebelum kebutuhan muncul.

---

# 48. Prototype Asset Strategy

Prototype boleh menggunakan:

* placeholder pet art,
* simple illustrations,
* temporary icons,
* minimal animation.

Tetapi placeholder harus cukup jelas untuk menguji:

```text
expression
state
reaction
hierarchy
```

Grey box murni mungkin tidak cukup untuk menguji apakah pet terasa hidup.

---

# 49. Design System vs Art Direction

Design System dan Art Direction merupakan dua hal berbeda.

Design System menjawab:

```text
How does the interface behave and stay consistent?
```

Art Direction menjawab:

```text
What does this world and character look and feel like?
```

Dokumen ini terutama mendefinisikan Design System.

Future Art Direction akan menentukan:

* pet visual style,
* character proportions,
* environment,
* illustration style,
* animation character,
* visual motifs,
* detailed palette,
* sound identity.

---

# 50. Prototype Design Rule

Ketika ada konflik antara:

```text
Beautiful UI
```

dan:

```text
Clear Pet Behavior
```

Prototype memilih:

**Clear Pet Behavior.**

Ketika ada konflik antara:

```text
More Information
```

dan:

```text
Character Focus
```

normal player UI memilih:

**Character Focus.**

Debug UI tetap dapat menunjukkan seluruh informasi.

---

# 51. Design Review Questions

Setiap screen harus diperiksa dengan pertanyaan:

### Focus

Apakah pet masih menjadi pusat perhatian?

### Clarity

Apakah player tahu apa yang bisa dilakukan?

### State

Apakah kondisi pet dapat dipahami?

### Feedback

Apakah action menghasilkan reaction yang jelas?

### Density

Apakah terlalu banyak informasi?

### Character

Apakah screen terasa seperti game companion atau dashboard?

### System Boundary

Apakah pet voice dan system voice masih terpisah?

### Accessibility

Apakah interaction tetap usable tanpa bergantung pada color atau animation?

---

# 52. Failure Signals

Design system gagal jika prototype mulai terlihat seperti:

```text
analytics dashboard
```

atau:

```text
chat application with pet avatar
```

atau:

```text
mobile game penuh badge, currency, dan notification dots
```

tanpa alasan gameplay.

Failure signals lain:

* player terus membaca angka daripada melihat pet,
* pet terlalu kecil dibanding UI,
* semua action menghasilkan toast,
* terlalu banyak progress bar,
* personality hanya terlihat melalui labels,
* UI animation lebih mencolok daripada pet animation.

---

# 53. Strong Signals

Design direction bekerja jika:

* player melihat pet terlebih dahulu,
* kebutuhan dapat dipahami dari behavior,
* care actions mudah ditemukan,
* reactions terasa jelas,
* UI menghilang secara visual ketika tidak dibutuhkan,
* pet terasa memiliki ruang untuk hidup,
* interface tetap konsisten ketika fitur bertambah.

---

# 54. Accepted Design Decisions

Untuk initial design system:

* Character first.
* Pet merupakan visual focus utama.
* Player UI menggunakan warm, soft, modern direction.
* Interface tidak boleh terlalu childish.
* Interface tidak menggunakan stereotypical AI/sci-fi aesthetics.
* UI surrounding pet relatif calm.
* Player Layer dan Debug Layer dipisahkan.
* Character feedback lebih utama daripada numeric feedback.
* Raw stats tidak ditampilkan pada normal Pet Home.
* Bond tidak menjadi permanent progress bar.
* Personality tidak ditampilkan sebagai raw numeric traits.
* Pet motion lebih expressive daripada UI motion.
* Core care actions menggunakan specialized ActionButton.
* Normal successful care action tidak membutuhkan toast.
* Domain rejection dan technical failure dipresentasikan berbeda.
* Pet Voice dan System Voice dipisahkan.
* Layout menggunakan progressive disclosure.
* Design implementation menggunakan semantic tokens.
* Spacing menggunakan 4px base scale.
* Rounded shape language digunakan secara restrained.
* Accessibility dipertimbangkan sejak awal.
* Dark mode bukan requirement Prototype 0.1.
* Exact visual palette belum dianggap final.
* Prototype memprioritaskan clear pet behavior dibanding visual polish.

---

# 55. Next Step

Dengan Design System foundation tersedia, tahap berikutnya:

```text
Game UX
   +
Design System
   ↓
Prototype 0.1 Wireframe
   ↓
Visual Exploration
   ↓
Prototype Scope Freeze
   ↓
Implementation Plan
```

Wireframe harus mulai menguji keputusan yang masih terbuka, terutama:

* seberapa banyak needs terlihat di Pet Home,
* bagaimana pet reaction ditampilkan,
* posisi care actions,
* Talk interaction,
* sleeping state,
* return experience,
* dan pemisahan Debug UI.

Wireframe belum menentukan final art style.

Tujuannya adalah menemukan **hierarchy, interaction, dan game feel** sebelum implementation.
