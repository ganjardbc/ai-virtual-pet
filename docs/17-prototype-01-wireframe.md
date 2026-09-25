# Prototype 0.1 Wireframe

## 1. Purpose

Dokumen ini mendefinisikan functional wireframe untuk **AI Virtual Pet Prototype 0.1**.

Wireframe ini menerjemahkan:

```text id="0h2gbj"
Game UX
+
Design System
+
Art Direction
+
Product Experience Principles
+
Prototype 0.1 Scope
```

menjadi struktur layar dan interaction flow yang dapat diimplementasikan.

Wireframe bukan final visual design.

Dokumen ini tidak mengunci:

* final colors,
* final typography,
* final character illustration,
* production animation,
* detailed visual polish.

Dokumen ini mengunci:

* screen hierarchy,
* primary interactions,
* information priority,
* UI states,
* action flow,
* debug separation.

---

# 2. Prototype Experience

Core playable flow:

```text id="dnnrqo"
First Launch

Egg
 ↓
Hatch
 ↓
Naming
 ↓
Pet Home
 ↓
Care
 ↓
Time Passes
 ↓
Return
 ↓
Observe Changed Pet
 ↓
Care Again
```

Prototype harus dapat dimainkan tanpa membuka Debug Mode.

Debug Mode hanya digunakan untuk mempercepat testing.

---

# 3. Application Structure

Prototype hanya memiliki satu primary game experience.

Conceptually:

```text id="5zbm04"
┌───────────────────────────────────────────┐
│                                           │
│                GAME                      │
│                                           │
│                           [ Debug ]       │
└───────────────────────────────────────────┘
```

Tidak diperlukan navigation bar.

Tidak ada:

```text id="4nx95p"
Home
Memory
Skills
Profile
Settings
```

pada Prototype 0.1.

---

# 4. Game Container

Desktop web menggunakan bounded game container.

```text id="12j6v9"
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              ┌─────────────────────┐                │
│              │                     │                │
│              │      GAME AREA      │                │
│              │                     │                │
│              └─────────────────────┘                │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Game tidak perlu memenuhi seluruh desktop viewport.

Target feeling:

```text id="hnm8pp"
personal
focused
intimate
```

bukan dashboard.

---

# 5. Responsive Structure

Pada viewport sempit:

```text id="wzajpr"
┌──────────────────┐
│                  │
│      GAME        │
│                  │
└──────────────────┘
```

Core hierarchy tetap sama.

Tidak ada desktop-only gameplay interaction.

Debug Panel dapat memiliki layout berbeda pada narrow viewport.

---

# 6. Screen State Model

Normal player flow memiliki state utama:

```text id="hbr39v"
EGG
 ↓
HATCHING
 ↓
NAMING
 ↓
PET_HOME
```

`PET_HOME` memiliki presentation states:

```text id="ueo0e1"
IDLE
ACTION_REACTION
SLEEPING
RETURNING
ERROR
```

Ini tidak harus menjadi frontend state machine literal.

Ini adalah UX states.

---

# 7. Screen 01 — Egg

## Goal

Menciptakan first contact dengan pet sebelum player mengetahui bentuknya.

Player harus memahami:

> Ada sesuatu di dalam egg dan aku bisa memulai kehidupannya.

---

# 8. Egg Wireframe

```text id="wpfg7g"
┌─────────────────────────────────────────┐
│                                         │
│                              [ Debug ]  │
│                                         │
│                                         │
│                  ◯                      │
│               ╭─────╮                   │
│              │  EGG  │                  │
│               ╰─────╯                   │
│                                         │
│            * subtle movement *          │
│                                         │
│                                         │
│        Something is waiting...          │
│                                         │
│             [ Hatch ]                   │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

Egg merupakan visual focus.

---

# 9. Egg Interaction

Primary action:

```text id="71bg2a"
Hatch
```

Interaction:

```text id="j46a28"
Hatch
 ↓
button temporarily unavailable
 ↓
HATCHING
```

Tidak ada secondary action yang diperlukan.

---

# 10. Egg Idle

Egg harus memiliki subtle sign of life.

Contoh prototype:

```text id="0gce5x"
small shake
tiny bounce
subtle pulse
```

Tidak perlu terus bergerak.

Occasional movement lebih efektif daripada constant animation.

---

# 11. Screen State — Hatching

Hatching merupakan transition, bukan full screen baru.

```text id="a0j86e"
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                  ◯                      │
│               ╭─────╮                   │
│              │ EGG   │                  │
│               ╰─────╯                   │
│                                         │
│                 ↓                       │
│                                         │
│             ✦  ✦  ✦                    │
│                                         │
│                 ↓                       │
│                                         │
│               BABY PET                  │
│                                         │
└─────────────────────────────────────────┘
```

No additional input selama short hatch transition.

---

# 12. Hatch Duration

Prototype hatch sequence harus singkat.

Target conceptual duration:

```text id="mkd82i"
~2–4 seconds
```

Cukup panjang untuk terasa sebagai moment.

Tidak cukup panjang untuk terasa seperti loading screen.

---

# 13. Hatch Result

Setelah hatch:

```text id="2fd4m4"
PET_HATCHED event
 ↓
Baby appears
 ↓
Naming state
```

Pet harus terlihat sebelum naming input menjadi focus.

Player bertemu pet sebelum memberi nama.

---

# 14. Screen 02 — Naming

## Goal

Membuat naming terasa sebagai first relationship moment, bukan setup form.

---

# 15. Naming Wireframe

```text id="mhnau8"
┌─────────────────────────────────────────┐
│                                         │
│                              [ Debug ]  │
│                                         │
│               BABY PET                  │
│                                         │
│               ( •ᴗ• )                   │
│                                         │
│        "What will you call me?"         │
│                                         │
│        ┌───────────────────────┐        │
│        │ Pet name              │        │
│        └───────────────────────┘        │
│                                         │
│              [ Name Pet ]               │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

Pet tetap memiliki visual priority.

Input tidak boleh mengambil seluruh layar.

---

# 16. Naming Interaction

Flow:

```text id="yy8jhr"
Enter Name
 ↓
Name Pet
 ↓
Validate
 ↓
Persist
 ↓
PET_NAMED
 ↓
Pet reacts
 ↓
Pet Home
```

---

# 17. Naming Validation

Required states:

### Empty

Primary action disabled atau validation message.

### Invalid

Short system message dekat input.

### Valid

Submit allowed.

Avoid modal/error toast untuk normal validation.

---

# 18. Naming Reaction

Setelah nama berhasil disimpan, beri short character reaction.

Conceptual:

```text id="jwnyt9"
"That's me!"
```

atau reaction non-verbal.

Exact copy bukan bagian wireframe.

Reaction singkat:

```text id="62yjgr"
~1–2 seconds
```

lalu masuk Pet Home.

---

# 19. Screen 03 — Pet Home

Pet Home merupakan pusat Prototype 0.1.

Hierarchy:

```text id="gmwwfc"
Pet Identity
     ↓
Habitat + Pet
     ↓
Reaction / Condition
     ↓
Care Actions
     ↓
Need Indicators
```

---

# 20. Pet Home Desktop Wireframe

```text id="iuz9ag"
┌──────────────────────────────────────────────┐
│                                              │
│  Momo                              [ Debug ] │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │                                        │  │
│  │               HABITAT                  │  │
│  │                                        │  │
│  │                (•ᴗ•)                   │  │
│  │                 PET                    │  │
│  │                                        │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│           "I'm feeling good."                │
│                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │  Feed  │  │  Play  │  │ Sleep  │         │
│  └────────┘  └────────┘  └────────┘         │
│                                              │
│       Fullness      Okay                     │
│       Energy        Energetic                │
│       Mood          Happy                    │
│                                              │
└──────────────────────────────────────────────┘
```

Pet/habitat harus menjadi area terbesar.

---

# 21. Pet Home Narrow Wireframe

```text id="xej4uk"
┌──────────────────────┐
│ Momo        [ Debug ]│
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │      HABITAT     │ │
│ │                  │ │
│ │       (•ᴗ•)      │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ "I'm feeling good."  │
│                      │
│ [ Feed ]             │
│ [ Play ]             │
│ [ Sleep ]            │
│                      │
│ Fullness   Okay      │
│ Energy     Energetic │
│ Mood       Happy     │
└──────────────────────┘
```

Actual implementation dapat menempatkan action buttons horizontal jika width memungkinkan.

---

# 22. Pet Identity Area

Pet identity minimal:

```text id="b0f9fp"
Pet Name
```

Tidak perlu menampilkan:

```text id="dix4oa"
Level
XP
Age
Bond
Stage badge
```

Prototype berfokus pada pet condition dan care.

---

# 23. Debug Entry

Debug entry dibuat low emphasis.

Example:

```text id="y0k0nm"
Debug
```

bukan bright primary button.

Debug merupakan development affordance.

---

# 24. Habitat Area

Habitat harus memiliki fixed/minimum height agar layout tidak berubah drastis ketika pet state berubah.

Habitat dapat berisi:

```text id="h4jgyk"
background
sleep area
pet
small prop
```

Tidak perlu interactive hotspots.

---

# 25. Pet Placement

Default:

```text id="55kckf"
center / slightly lower center
```

Activity dapat mengubah position sedikit.

Examples:

```text id="7j3lyy"
SLEEPING
→ near sleep area

PLAYING_ALONE
→ near play prop
```

Prototype tidak membutuhkan free movement/pathfinding.

---

# 26. Reaction Area

Di bawah habitat:

```text id="7gvbcr"
┌─────────────────────────────┐
│ "I'm getting sleepy..."     │
└─────────────────────────────┘
```

Reaction area memiliki stable minimum height.

Tujuan:

* layout tidak meloncat,
* action reaction punya tempat,
* current condition dapat dikomunikasikan.

---

# 27. Reaction Priority

Display priority:

```text id="hqqkk4"
Action Reaction
      ↓
Return Reaction
      ↓
Important State
      ↓
Mood / Idle
```

Action reaction hanya temporary.

Setelah selesai, UI kembali menampilkan current state/mood reaction.

---

# 28. Care Actions

Prototype action row:

```text id="7g6vzt"
[ Feed ] [ Play ] [ Sleep ]
```

Setiap button menggunakan `ActionButton`.

Button terdiri dari:

```text id="e2xf2a"
Icon
+
Label
```

jika icon tersedia.

Text label tetap wajib.

---

# 29. Talk

Talk tidak masuk functional Prototype 0.1.

Wireframe awal **tidak menampilkan Talk**.

Alasan:

Jika Talk ditampilkan disabled, player dapat menganggap conversation merupakan bagian prototype yang rusak/belum selesai.

Prototype 0.1 harus terasa intentional dengan tiga care actions:

```text id="yzv34q"
Feed
Play
Sleep
```

Talk ditambahkan ketika Prototype 0.2 mulai menguji AI conversation.

---

# 30. Need Indicators

Prototype menggunakan compact descriptive needs.

Recommended initial wireframe:

```text id="6hvvh7"
Fullness      Okay
Energy        Energetic
Mood          Happy
```

Tidak menggunakan progress bars sebagai default.

---

# 31. Why Descriptive Needs

Kita ingin menguji apakah combination berikut cukup:

```text id="0gwe2p"
pet behavior
+
expression
+
descriptive status
```

Jika tester masih kesulitan memahami state, simple meter dapat diuji pada iteration berikutnya.

---

# 32. Bond

Bond tidak ditampilkan di Pet Home.

Bond hanya tersedia di Debug Mode.

Reason:

Prototype 0.1 tidak sedang menguji relationship progression.

---

# 33. Feed Interaction — Normal

Initial state:

```text id="09nyb8"
Pet
 ↓
[ Feed ]
```

Player selects Feed.

UI:

```text id="84xd0q"
Feed pressed
 ↓
Action temporarily busy
 ↓
Backend action
 ↓
Pet eating reaction
 ↓
Updated snapshot
 ↓
Idle/current mood
```

---

# 34. Feed Reaction Wireframe

```text id="2k9vcd"
┌────────────────────────────────────┐
│                                    │
│              HABITAT               │
│                                    │
│             ( •ڡ• )                │
│             eating...              │
│                                    │
└────────────────────────────────────┘

            "Yum!"

[ Feed ]   [ Play ]   [ Sleep ]
```

Buttons may be temporarily disabled during short action presentation to prevent accidental spam.

Domain still protects against duplicate requests.

---

# 35. Feed While Full

If pet is already very full:

```text id="kg3v0n"
Feed
 ↓
Domain determines reduced result / response
 ↓
Pet reacts less enthusiastically
```

Conceptual presentation:

```text id="64e0iw"
"I'm pretty full..."
```

No numeric diminishing-return formula shown.

---

# 36. Play Interaction — Normal

Flow:

```text id="47anbp"
Play
 ↓
Validate
 ↓
State mutation
 ↓
PET_PLAYED
 ↓
Play animation
 ↓
Excited reaction
 ↓
Updated state
```

---

# 37. Play Reaction Wireframe

```text id="vrxd9c"
┌────────────────────────────────────┐
│                                    │
│              HABITAT               │
│                                    │
│           \ (•ᴗ•) /                │
│              PET                   │
│                                    │
└────────────────────────────────────┘

          "Again! Again!"

[ Feed ]   [ Play ]   [ Sleep ]
```

Exact reaction depends on fixed prototype personality/state.

---

# 38. Play Rejection

Required important state.

Condition:

```text id="8qpc93"
Energy <= required threshold
```

Player selects Play.

Backend rejects action.

UI must distinguish domain rejection from technical error.

---

# 39. Play Rejection Wireframe

```text id="jy6l8r"
┌────────────────────────────────────┐
│                                    │
│              HABITAT               │
│                                    │
│              (-﹏-)                 │
│               PET                  │
│                                    │
└────────────────────────────────────┘

        "I'm too tired..."

[ Feed ]   [ Play ]   [ Sleep ]
```

No red error banner.

No:

```text id="nuvfbi"
ENERGY_TOO_LOW
```

in Player Mode.

Debug Mode may record exact rejection reason.

---

# 40. Sleep Interaction

Player selects:

```text id="fzdyk4"
Sleep
```

Flow:

```text id="a46ypw"
Sleep
 ↓
Backend
 ↓
currentActivity = SLEEPING
 ↓
sleepStartedAt
 ↓
PET_STARTED_SLEEPING
 ↓
Sleeping presentation
```

---

# 41. Sleeping State

Sleeping is a variation of Pet Home.

```text id="jip7q8"
┌──────────────────────────────────────────────┐
│                                              │
│  Momo                              [ Debug ] │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │              HABITAT                   │  │
│  │                                        │  │
│  │        sleep area                      │  │
│  │            ( -ᴗ- )  zZ                 │  │
│  │                                        │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│               Sleeping...                    │
│                                              │
│  [ Feed ]        [ Play ]       [ Sleeping ] │
│                                              │
│       Fullness      Okay                     │
│       Energy        Recovering               │
│       Mood          Sleepy                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 42. Actions While Sleeping

Prototype rule:

When pet is sleeping:

```text id="pfnxkx"
Feed
Play
```

tidak menjadi normal active actions.

Recommended UI:

```text id="z4pxg1"
Feed     disabled
Play     disabled
Sleep    active-state / disabled
```

Prototype tidak membutuhkan manual player-facing Wake button.

Pet wakes according to simulation rules.

Debug Mode memiliki Wake Pet.

---

# 43. Sleeping Feedback

Disabled actions harus tetap understandable.

Possible tooltip/helper:

```text id="zw8vqv"
Momo is sleeping.
```

Pada touch/mobile, visual sleeping state sudah menjadi primary explanation.

Jangan menampilkan intrusive modal.

---

# 44. Auto Wake

Ketika simulation menentukan pet sudah bangun:

```text id="vt2tqh"
SLEEPING
 ↓
WAKE
 ↓
PET_WOKE_UP
 ↓
normal Pet Home
```

Jika player sedang membuka app ketika wake terjadi, simple wake transition dapat dimainkan.

Jika player kembali setelah pet sudah bangun, return experience cukup menunjukkan current state + relevant event.

---

# 45. Autonomous Activity Presentation

Possible activity:

```text id="zq0tqj"
PLAYING_ALONE
```

Wireframe:

```text id="a6j3xi"
┌────────────────────────────────────┐
│                                    │
│             HABITAT                │
│                                    │
│      toy        (•ᴗ•)              │
│                   ↘                │
│                                    │
└────────────────────────────────────┘

        Playing by itself
```

Current activity may appear as temporary descriptive text.

---

# 46. Resting

```text id="b9mzz1"
┌────────────────────────────────────┐
│                                    │
│             HABITAT                │
│                                    │
│              (•‿•)                 │
│              resting               │
│                                    │
└────────────────────────────────────┘

             Resting
```

Resting berbeda dari sleeping.

---

# 47. Looking Around

```text id="p5xkpb"
┌────────────────────────────────────┐
│                                    │
│             HABITAT                │
│                                    │
│             (•o• ) →               │
│                                    │
└────────────────────────────────────┘

          Looking around
```

Tujuannya memberi evidence bahwa pet memiliki autonomous life.

---

# 48. Return Experience

Return merupakan salah satu interaction paling penting Prototype 0.1.

Flow:

```text id="pm2wvv"
Open App
 ↓
Fetch Pet
 ↓
Backend Simulates Elapsed Time
 ↓
Pet Snapshot Returned
 ↓
Current Activity Shown
 ↓
Relevant Recent Activity Optional
```

---

# 49. Return State — Short Absence

Untuk absence singkat:

```text id="q34xwb"
~1–3 hours
```

tidak selalu perlu recap.

Pet Home dapat langsung menunjukkan current condition.

Example:

```text id="atg13s"
Pet looks slightly hungry.
```

---

# 50. Return State — Meaningful Absence

Jika relevant events terjadi:

```text id="fbfkyh"
sleep
wake
autonomous play
```

UI dapat menampilkan lightweight recap.

---

# 51. Return Recap Wireframe

```text id="xys0bo"
┌──────────────────────────────────────────────┐
│                                              │
│  Momo                              [ Debug ] │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │               HABITAT                  │  │
│  │                                        │  │
│  │               (•ᴗ•)                    │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│             "You're back!"                   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ While you were away                    │  │
│  │                                        │  │
│  │ • Slept for a while                    │  │
│  │ • Played alone                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [ Feed ]        [ Play ]        [ Sleep ]   │
│                                              │
└──────────────────────────────────────────────┘
```

---

# 52. Return Recap Rules

Recap harus:

```text id="9bj7lr"
short
relevant
optional
```

Maximum initial target:

```text id="uv7ibn"
1–3 items
```

Jangan dump Event Log.

---

# 53. Return Recap Dismissal

Recap tidak membutuhkan modal.

It can be:

```text id="bmecqp"
small temporary card
```

yang dapat:

* disappear after interaction,
* collapse,
* atau hanya muncul pada first render.

Exact behavior dapat dipilih saat implementation.

---

# 54. Long Absence Return

Example:

```text id="wexbm6"
7 days later
```

Wireframe tetap sama.

Yang berubah:

* current needs,
* current activity,
* relevant summarized events.

Tidak ada:

```text id="umg5n4"
"You abandoned me!"
```

Tidak ada giant warning.

Tidak ada red punishment screen.

---

# 55. Long Absence Example

```text id="n11jtp"
┌──────────────────────────────────────┐
│                                      │
│              HABITAT                 │
│                                      │
│              (•﹏•)                   │
│                                      │
└──────────────────────────────────────┘

          "I'm pretty hungry."

While you were away
• Slept several times
• Spent some time playing

[ Feed ]   [ Play ]   [ Sleep ]

Fullness       Very Hungry
Energy         Okay
Mood           Hungry
```

The state matters.

The absence is not moralized.

---

# 56. Loading State

Initial application loading should be minimal.

```text id="rw9otk"
┌────────────────────────────────────┐
│                                    │
│                                    │
│             loading...             │
│                                    │
│                                    │
└────────────────────────────────────┘
```

Future polish dapat menggunakan habitat skeleton atau pet-themed loading.

Not required.

---

# 57. Action Loading

Untuk normal Feed/Play/Sleep:

Avoid global loading screen.

Action button dapat:

```text id="qlcj3j"
show busy state
```

sementara existing Pet Home tetap terlihat.

---

# 58. Technical Error

Technical error memiliki System Voice.

Example:

```text id="2qkclu"
┌────────────────────────────────────────┐
│ Couldn't connect to the game server.   │
│                                        │
│              [ Retry ]                 │
└────────────────────────────────────────┘
```

Pet tidak dibuat sedih karena database/network failure.

---

# 59. Action Technical Error

Jika Feed request gagal karena network:

```text id="3ehy53"
Feed
 ↓
Request fails
 ↓
System feedback
 ↓
No fake eating reaction
```

Example:

```text id="cth96c"
Something went wrong. Try again.
```

Pet remains in previous authoritative state.

---

# 60. Debug Panel

Debug Mode merupakan separate presentation layer.

Desktop recommendation:

```text id="qvvdml"
Game
+
side debug panel
```

---

# 61. Debug Desktop Wireframe

```text id="4xrm7h"
┌───────────────────────────────┬────────────────────────────┐
│                               │ DEBUG                      │
│                               │                            │
│           GAME                │ Hunger        72.40        │
│                               │ Energy        43.20        │
│          (•ᴗ•)                │ Happiness     81.00        │
│                               │ Bond          12.30        │
│                               │                            │
│ [ Feed ] [ Play ] [ Sleep ]   │ Activity      IDLE         │
│                               │ Mood          HAPPY        │
│                               │                            │
│                               │ lastSimulatedAt            │
│                               │ 2026-...                   │
│                               │                            │
│                               │ TIME                       │
│                               │ [ +1h ] [ +6h ]            │
│                               │ [ +12h ] [ +1d ]           │
│                               │ [ +3d ] [ +7d ]            │
│                               │                            │
│                               │ ACTIONS                    │
│                               │ [ Force Sleep ]            │
│                               │ [ Wake Pet ]               │
│                               │ [ Reset Pet ]              │
│                               │                            │
│                               │ RECENT EVENTS              │
│                               │ PET_PLAYED                 │
│                               │ PET_FED                    │
│                               │ ...                        │
└───────────────────────────────┴────────────────────────────┘
```

---

# 62. Debug Toggle

Debug button toggles panel:

```text id="2nt6gd"
Debug
 ↓
Open panel
```

Close:

```text id="wj0rjm"
×
```

Game state does not change when opening Debug.

---

# 63. Debug Panel Sections

Recommended order:

```text id="8iv2qg"
State

Derived State

Time

Commands

Recent Events
```

---

# 64. Debug State

Required:

```text id="t9m8km"
Hunger
Energy
Happiness
Bond
```

Values shown with enough precision for testing.

Example:

```text id="c5pwzw"
72.40
```

---

# 65. Debug Derived State

Required:

```text id="p2n54b"
Mood
Current Activity
```

Optional:

```text id="kkl5ce"
need labels
mood score breakdown
```

Mood score breakdown can be added only if useful during balancing.

---

# 66. Debug Time

Required values:

```text id="fdfrt9"
lastInteractionAt
lastSimulatedAt
sleepStartedAt
```

Use readable date-time presentation.

Optional raw ISO value via tooltip/details.

---

# 67. Debug Time Travel

Required controls:

```text id="83qqfo"
[ +1h ]

[ +6h ]

[ +12h ]

[ +1d ]

[ +3d ]

[ +7d ]
```

After selection:

```text id="i45s0x"
Advance Clock
 ↓
Run Simulation
 ↓
Persist
 ↓
Refresh Snapshot
```

---

# 68. Time Travel Feedback

After advancing:

```text id="ef6d9d"
+1 day
```

show subtle debug-only confirmation:

```text id="o4ygpa"
Advanced 1 day
```

Game itself simply presents resulting reality.

---

# 69. Debug Commands

Required:

```text id="o6mdgo"
Reset Pet
Force Sleep
Wake Pet
```

Recommended:

```text id="4pt2qp"
Set Hunger
Set Energy
Set Happiness
```

---

# 70. Debug Set Stat

Simple control:

```text id="mbph56"
Energy

[ 0 ][ 25 ][ 50 ][ 75 ][ 100 ]
```

atau numeric input:

```text id="h4k7mo"
Energy [ 15 ]
         [ Set ]
```

Exact control chosen based on implementation simplicity.

Numeric input lebih flexible.

---

# 71. Reset Pet

Reset merupakan destructive debug action.

Require confirmation:

```text id="vd3xke"
Reset pet?

This will remove current prototype progress.

[ Cancel ] [ Reset ]
```

Confirmation hanya dibutuhkan karena destructive effect.

---

# 72. Recent Events

Debug Event Log displays:

```text id="70hnld"
event type
timestamp
minimal payload
```

Example:

```text id="98cyt3"
14:22 PET_FED
14:20 PET_PLAYED
08:11 PET_WOKE_UP
02:03 PET_STARTED_SLEEPING
```

Newest first.

---

# 73. Event Detail

Optional expandable detail:

```text id="5skym7"
PET_PLAYED
{
  happinessDelta: ...
  energyDelta: ...
}
```

Only if event payload already supports it.

Not required for initial UI.

---

# 74. Debug Narrow Layout

Pada narrow viewport:

```text id="0qz7x2"
Debug
```

dapat menjadi:

```text id="vdt0x9"
full-screen drawer
```

atau bottom sheet.

Player game remains underneath/preserved.

---

# 75. Interaction Locking

Prototype should avoid conflicting actions.

During immediate action reaction:

```text id="4grmfe"
Feed/Play/Sleep
```

can briefly become unavailable.

Target lock duration should be short.

UI animation tidak boleh membuat game terasa sluggish.

---

# 76. Reaction Duration

Initial prototype target:

Normal reaction:

```text id="q8dssg"
~1–2 seconds
```

Hatch:

```text id="zty4od"
~2–4 seconds
```

Do not hard-code experience timing deeply into domain.

These are presentation concerns.

---

# 77. Repeated Interaction

After reaction:

```text id="uv31ij"
ACTION_REACTION
 ↓
current mood/activity presentation
```

Player dapat melakukan action berikutnya.

---

# 78. Keyboard Accessibility

Required interaction order should be sensible:

```text id="1txlgo"
Pet Name / Header
Debug
Reaction
Feed
Play
Sleep
Status
```

Actual focus order follows interactive elements only.

Action buttons keyboard accessible.

Debug controls keyboard accessible.

---

# 79. Focus Management — Naming

On Naming screen:

After pet introduction/reaction:

```text id="ic1vgw"
name input
```

can receive focus.

Do not autofocus before pet appears if it causes screen to feel like form-first onboarding.

---

# 80. Focus Management — Errors

Technical errors:

Focus can move to error container when necessary for accessibility.

Domain rejection:

Character reaction is announced through accessible live region if appropriate.

---

# 81. Character Accessibility

Pet state cannot depend solely on visual pose.

For example:

Visual:

```text id="r40hmp"
sleeping pet
```

Supporting text:

```text id="53kr8g"
Sleeping
```

Visual:

```text id="j2m87f"
hungry expression
```

Supporting status:

```text id="ubp7ce"
Fullness: Hungry
```

---

# 82. Prototype Copy

Exact copy is not frozen by wireframe.

Copy should follow:

```text id="f3bhfo"
short
warm
clear
natural
```

Pet copy can have light character.

System copy remains neutral.

---

# 83. State Ownership

Wireframe presentation always follows authoritative snapshot.

Example:

```text id="sczjdo"
UI thinks pet is awake

Backend returns:
currentActivity = SLEEPING
```

Result:

```text id="3o7k99"
UI renders sleeping pet
```

Client does not preserve contradictory local game state.

---

# 84. Optimistic Updates

Prototype should avoid optimistic mutation of authoritative game stats.

Do not:

```text id="14kptc"
click Feed
 ↓
client immediately adds +25
```

Instead:

```text id="1g4wy5"
click Feed
 ↓
busy state
 ↓
server result
 ↓
render authoritative snapshot
```

Short reactions can begin only when action acceptance is sufficiently known.

---

# 85. Screen-to-State Mapping

```text id="fltr30"
No Pet
→ Egg

Pet exists
stage = EGG
→ Egg

Hatching transition
→ Hatch

stage = BABY
name missing
→ Naming

stage = BABY
name exists
activity != SLEEPING
→ Pet Home

stage = BABY
name exists
activity = SLEEPING
→ Pet Home / Sleeping Presentation
```

---

# 86. Prototype Flow Map

```text id="9tyaf4"
┌─────────┐
│ Launch  │
└────┬────┘
     │
     ▼
┌─────────┐
│   Egg   │
└────┬────┘
     │ Hatch
     ▼
┌─────────┐
│ Hatching│
└────┬────┘
     │
     ▼
┌─────────┐
│ Naming  │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│       Pet Home       │◄──────────────┐
└─────┬────┬────┬─────┘               │
      │    │    │                     │
    Feed  Play Sleep                   │
      │    │    │                     │
      ▼    ▼    ▼                     │
   Reaction   Sleeping                 │
      │          │                     │
      └────┬─────┘                     │
           │                           │
           ▼                           │
        Pet Home                       │
                                       │
        Leave App                      │
           │                           │
           ▼                           │
       Time Passes                     │
           │                           │
           ▼                           │
         Return ───────────────────────┘
```

---

# 87. Debug Flow

```text id="1cuwrd"
Pet Home
 ↓
Debug
 ↓
Debug Panel
 ↓
Advance Time
 ↓
Simulation
 ↓
New Snapshot
 ↓
Game UI Changes
```

This loop should be extremely fast.

It is the primary balancing workflow.

---

# 88. Primary Prototype Test Loop

Developer/tester should be able to perform:

```text id="9rd4i4"
Observe Pet
 ↓
Feed
 ↓
Observe Reaction
 ↓
Play
 ↓
Observe Reaction
 ↓
Debug +12h
 ↓
Observe State
 ↓
Debug +1d
 ↓
Observe Autonomous Activity
 ↓
Sleep
 ↓
Debug +6h
 ↓
Observe Recovery
 ↓
Debug +7d
 ↓
Observe Long Absence Result
```

without database manipulation or code changes.

---

# 89. Visual Priority Test

Blur/squint test:

When looking at Pet Home, visual priority should approximately be:

```text id="9z56xa"
PET / HABITAT

       ↓

REACTION

       ↓

ACTIONS

       ↓

STATUS

       ↓

DEBUG
```

If Debug or needs become dominant, hierarchy is wrong.

---

# 90. Prototype Wireframe Constraints

Do not add during implementation:

```text id="bchc6j"
top navigation
sidebar navigation
profile screen
settings screen
inventory
shop
skill UI
memory UI
chat panel
XP
currency
notifications
daily rewards
```

unless Prototype 0.1 scope is explicitly changed.

---

# 91. Component Mapping

Wireframe can map approximately to React components:

```text id="1b1flm"
App

GameShell

EggScreen

HatchSequence

NamingScreen

PetHome
├── PetHeader
├── Habitat
│   └── PetCharacter
├── ReactionBubble
├── CareActions
│   ├── FeedAction
│   ├── PlayAction
│   └── SleepAction
└── PetStatus

DebugToggle

DebugPanel
├── DebugStats
├── DebugDerivedState
├── DebugTime
├── DebugTimeTravel
├── DebugCommands
└── DebugEventList
```

This is conceptual.

Implementation plan may refine boundaries.

---

# 92. State Mapping

Possible frontend server-state mapping:

```text id="2m8wwg"
PetSnapshot
     ↓
PetHome
```

Derived presentation mapping:

```text id="7hph4c"
PetSnapshot
 ↓
PetVisualState

PetSnapshot
 ↓
NeedLabels

PetSnapshot
 ↓
AvailableActions
```

Presentation mapping should remain separate from authoritative domain mutation.

---

# 93. Prototype Visual Asset Needs

Wireframe implies minimum asset requirements:

```text id="u7h1se"
Egg

Baby Pet:
Neutral
Happy
Hungry
Sleepy
Excited
Tired / Refusal
Sleeping

Simple Habitat

Optional:
Food prop
Play prop
Sleep prop
```

Several states can share the same base asset with simple animation variation.

---

# 94. Wireframe Validation Checklist

Before implementation, confirm:

### Egg

* Is Egg clearly the focus?
* Is Hatch obvious?

### Naming

* Does player meet pet before form dominates?
* Is naming simple?

### Pet Home

* Is pet the largest visual element?
* Are care actions immediately discoverable?
* Are needs understandable without numbers?

### Actions

* Does every action have visible feedback?
* Is rejection understandable?

### Sleep

* Is sleeping unmistakable?
* Are unavailable actions understandable?

### Return

* Is elapsed time visible through pet state/activity?
* Is recap lightweight?

### Debug

* Can time be advanced rapidly?
* Can raw state be inspected?
* Is Debug visually separate from Player Mode?

---

# 95. Wireframe Success Condition

Wireframe dianggap berhasil jika seseorang dapat melihatnya dan memahami:

```text id="yoxczm"
I hatch this creature.

I give it a name.

I can see how it's doing.

I can feed it.

I can play with it.

It can get tired.

It can sleep.

Things happen while I'm away.

When I return, it may be different.
```

tanpa penjelasan architecture atau AI.

---

# 96. Frozen Wireframe Decisions

Prototype 0.1 wireframe menetapkan:

* No primary navigation.
* Bounded game container.
* Pet/habitat is visual center.
* Egg is first-launch experience.
* Hatch is a short transition.
* Naming happens after player sees Baby Pet.
* Pet Home is the main gameplay screen.
* Prototype exposes Feed, Play, Sleep.
* Talk is not shown in Prototype 0.1.
* Needs use descriptive labels first.
* Bond is hidden from Player Mode.
* Reaction area is persistent/stable.
* Sleeping is a Pet Home presentation state.
* No player-facing manual Wake action.
* Autonomous activity is visible through pet/habitat.
* Return recap is lightweight and optional.
* Long absence is not guilt-driven.
* Debug is accessible but visually low-priority.
* Debug opens a separate panel.
* Debug includes raw state, time travel, commands, and events.
* Player UI follows authoritative backend state.
* No optimistic authoritative stat mutation.
* Technical errors use System Voice.
* Domain rejection can use Character Voice.
* Raw Event Log remains Debug-only.

---

# 97. Open Visual Decisions

Wireframe intentionally does not decide:

```text id="pp7zrt"
final colors
final fonts
final pet design
final habitat illustration
exact icons
exact animation implementation
exact reaction copy
exact sound
exact desktop container width
exact mobile breakpoints
```

These should not block implementation of structural UI.

---

# 98. Next Step

Dengan wireframe ini, kita sudah memiliki cukup informasi untuk berhenti menambah product-design documentation sebelum coding.

Next:

```text id="kcnppq"
Prototype Scope
      ✓

Wireframe
      ✓

      ↓

Implementation Plan

      ↓

Codex Execution
```

Implementation Plan harus menerjemahkan prototype menjadi task kecil yang:

```text id="5cdpbf"
ordered
testable
independently verifiable
scope-bounded
```

Setiap task harus memberi Codex:

```text id="4aj4ev"
Context
Files / modules involved
Requirements
Constraints
Tests
Acceptance criteria
```

sehingga Codex tidak perlu menebak product decisions ketika mulai menulis code.
