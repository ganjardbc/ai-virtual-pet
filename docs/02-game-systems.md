# Game Systems Design

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft / Initial Balancing
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`

---

# 1. Purpose

Dokumen ini mendefinisikan aturan sistem utama AI Virtual Pet.

Jika Mini GDD menjelaskan:

> "Pet memiliki Hunger."

Game Systems Design menjawab:

> "Bagaimana Hunger berubah, apa efeknya, kapan dianggap lapar, dan bagaimana interaction mempengaruhinya?"

Dokumen ini menjadi referensi utama untuk implementasi **Game Engine**.

Sistem yang dibahas:

* time simulation,
* Hunger,
* Energy,
* Happiness,
* Bond,
* actions,
* interaction cooldown,
* mood,
* personality,
* autonomous activity,
* offline simulation,
* growth,
* event system,
* dan state normalization.

Detail AI conversation, memory implementation, dan skill tools dibahas pada dokumen terpisah.

---

# 2. Core System Principle

Game state adalah source of truth.

```text
Player Action
      ↓
Validate Action
      ↓
Game Rules
      ↓
State Mutation
      ↓
Generate Event
      ↓
Recalculate Derived State
      ↓
AI / UI Reaction
```

LLM tidak boleh secara langsung mengubah:

```text
Hunger
Energy
Happiness
Bond
Personality
Growth
Skills
```

Semua perubahan melewati Game Engine.

---

# 3. State Categories

Pet state dibagi menjadi tiga kategori.

## Persistent State

Disimpan secara permanen.

Contoh:

```text
name
createdAt
stage
bond
personality
growth progress
skills
interaction history
```

---

## Dynamic State

Berubah berdasarkan waktu dan interaction.

```text
hunger
energy
happiness
current activity
last interaction time
sleep state
```

---

## Derived State

Tidak perlu menjadi source of truth.

Dihitung dari state lain.

```text
mood
dominant personality traits
growth eligibility
action availability
```

Jika memungkinkan, derived state dihitung ulang daripada disimpan.

---

# 4. Core Numeric Range

Core stats menggunakan range:

```text
0 - 100
```

Meliputi:

```text
Hunger
Energy
Happiness
Bond
```

Semua mutation harus di-clamp.

Formula:

```text
value = clamp(value + delta, 0, 100)
```

Tidak boleh ada:

```text
Hunger = 108
Energy = -14
```

---

# 5. Hunger Semantics

Hunger menggunakan semantic:

```text
100 = fully satisfied
0   = extremely hungry
```

Dengan demikian istilah internal alternatif yang lebih akurat sebenarnya adalah:

```text
satiety
```

Namun untuk player-facing UI tetap dapat disebut:

```text
Hunger / Food
```

Terminologi final ditentukan saat UI design.

---

# 6. Hunger Decay

Initial balancing:

```text
Hunger decay:
-2 points / hour
```

Contoh:

```text
08:00 Hunger = 90

12:00

elapsed = 4 hours

90 - (4 × 2)

= 82
```

Decay berjalan selama pet:

* awake,
* sleeping,
* offline.

Namun saat Sleep dapat menggunakan modifier.

Initial modifier:

```text
Sleeping Hunger Decay:
50% normal rate
```

Sehingga:

```text
Awake:
-2 / hour

Sleeping:
-1 / hour
```

---

# 7. Hunger Thresholds

Initial thresholds:

```text
76-100
Full

51-75
Satisfied

26-50
Hungry

1-25
Very Hungry

0
Starving
```

`Starving` di sini bukan death state.

Tidak ada permanent damage.

---

# 8. Hunger Effects

Hunger mempengaruhi behavior.

## Hunger > 50

Tidak ada penalty.

---

## Hunger 26-50

Possible effects:

```text
Hungry mood candidate
slight happiness pressure
more food-related reactions
```

---

## Hunger <= 25

Possible effects:

```text
Hungry mood receives high priority
Play effectiveness reduced
pet may mention food
```

---

## Hunger = 0

Pet tidak mati.

Possible behavior:

```text
Play unavailable
Happiness slowly pressured downward
pet strongly prefers Feed
```

---

# 9. Energy

Energy merepresentasikan stamina.

```text
100 = fully rested
0   = exhausted
```

Initial passive decay:

```text
-1.5 / hour while awake
```

Energy tidak menggunakan passive decay ketika sleeping.

Sleep justru memulihkannya.

---

# 10. Energy Thresholds

```text
76-100
Energetic

51-75
Normal

26-50
Tired

1-25
Very Tired

0
Exhausted
```

---

# 11. Sleep Recovery

Initial recovery:

```text
+12 Energy / hour
```

Maximum:

```text
100
```

Example:

```text
Energy before sleep:
32

Sleep duration:
4 hours

Recovery:
4 × 12 = 48

Energy:
80
```

Recovery dapat dihentikan ketika Energy mencapai 100.

---

# 12. Automatic Wake

Pet dapat bangun jika:

```text
Energy >= 95
```

atau:

```text
maximum sleep duration reached
```

Initial maximum:

```text
8 hours
```

Ini mencegah pet tidur selamanya karena player tidak membuka app.

---

# 13. Autonomous Sleep

Jika pet awake dan:

```text
Energy <= 10
```

pet dapat otomatis tidur.

Condition:

```text
not currently performing another critical activity
```

Generate event:

```text
PET_FELL_ASLEEP
```

---

# 14. Happiness

Happiness merepresentasikan short-term emotional wellbeing.

```text
100 = very happy
0   = very unhappy
```

Happiness berbeda dari Bond.

Happiness:

* volatile,
* affected by recent activity.

Bond:

* slow,
* long-term relationship.

---

# 15. Happiness Passive Drift

Happiness tidak sebaiknya turun terus hanya karena waktu.

Jika tidak ada masalah:

```text
Happiness remains relatively stable.
```

Namun unmet needs dapat memberikan pressure.

Initial pressure:

```text
Hunger <= 25:
-1 Happiness / 2 hours

Energy <= 20 while awake:
-1 Happiness / 2 hours
```

Penalty tidak stack tanpa batas.

Maximum passive Happiness loss:

```text
-12 / day
```

Tujuannya menghindari punishment berlebihan.

---

# 16. Happiness Thresholds

```text
76-100
Happy

51-75
Okay

26-50
Low

0-25
Unhappy
```

Threshold hanya membantu rule evaluation.

Tidak semuanya harus ditampilkan.

---

# 17. Bond

Bond merepresentasikan relationship strength.

Range:

```text
0 - 100
```

Starting value:

```text
10
```

Alasan tidak dimulai dari 0:

Pet sudah memiliki basic familiarity setelah hatch dan naming.

---

# 18. Bond Philosophy

Bond harus:

* tumbuh lambat,
* sulit di-spam,
* mencerminkan repeated interaction,
* tidak menghukum casual player.

Bond bukan XP.

Player tidak seharusnya bisa melakukan:

```text
Feed × 100
→ Bond 100
```

---

# 19. Bond Gain

Initial values:

```text
Feed:
+0.3

Play:
+1.0

Meaningful Talk:
+0.5 to +1.5

Sleep command:
+0.1
```

Values dapat menggunakan decimal secara internal.

UI tidak perlu menampilkan angka presisi.

---

# 20. Daily Bond Soft Cap

Untuk mencegah farming:

```text
Normal Bond Gain Cap:
+8 / rolling 24 hours
```

Setelah mencapai cap:

```text
Bond gains × 0.2
```

Bukan benar-benar berhenti.

Ini memungkinkan interaction tetap terasa meaningful tanpa farming.

---

# 21. Bond Decay

Untuk MVP:

```text
No passive Bond decay.
```

Player tidak kehilangan relationship hanya karena beberapa hari offline.

Namun extremely long absence dapat mempengaruhi personality dan behavior.

Bond tetap merepresentasikan shared history.

---

# 22. Long Absence

Initial definition:

```text
Short absence:
< 12 hours

Normal absence:
12-48 hours

Long absence:
2-7 days

Very long absence:
> 7 days
```

Tidak ada Bond penalty langsung.

Possible effects:

```text
Independent tendency +
Clingy expression may trigger
special return event
```

---

# 23. Feed Action

Base effect:

```text
Hunger:
+25

Happiness:
+2

Bond:
+0.3
```

Energy:

```text
no direct change
```

---

# 24. Feed Effectiveness

Jika Hunger sangat tinggi:

```text
Hunger >= 90
```

pet dapat menolak Feed.

Response state:

```text
ACTION_REJECTED_FULL
```

No stat mutation.

---

Jika:

```text
Hunger 75-89
```

diminishing effect:

```text
Hunger +10
Happiness +1
Bond +0.1
```

---

Jika:

```text
Hunger < 75
```

full Feed effect.

---

# 25. Feed Cooldown

Feed tidak membutuhkan hard cooldown.

Namun repeated feeding diminishes berdasarkan satiety.

Game state sendiri menjadi anti-spam mechanism.

---

# 26. Play Action

Base effect:

```text
Happiness:
+12

Energy:
-10

Hunger:
-4

Bond:
+1
```

Personality signal:

```text
Playful +
```

---

# 27. Play Availability

Play dapat dilakukan jika:

```text
Energy > 15
```

dan:

```text
pet is awake
```

Jika Energy <= 15:

```text
ACTION_REJECTED_TOO_TIRED
```

Jika pet sleeping:

```text
ACTION_REJECTED_SLEEPING
```

---

# 28. Play Diminishing Return

Repeated Play dalam waktu sangat dekat tidak memberikan full effect.

Track:

```text
playCountWithin2Hours
```

Effect multiplier:

```text
1st Play:
1.0

2nd:
0.75

3rd:
0.5

4th+:
0.25
```

Bond menggunakan multiplier yang sama.

Tujuannya:

* mencegah farming,
* mendorong natural sessions.

---

# 29. Talk Action

Talk tidak memiliki fixed stat mutation sederhana.

Conversation diproses melalui interaction evaluator.

Possible classifications:

```text
Greeting
Casual
Meaningful
Supportive
Question
Exploration
Command
Spam
Abusive
```

Game system tidak perlu memahami full semantics sendiri.

AI Behavior system dapat memberikan structured interpretation.

---

# 30. Talk Bond Effect

Initial mapping:

```text
Greeting:
+0.1

Casual:
+0.3

Meaningful:
+0.8

Supportive:
+1.0

Exploration:
+0.5

Command:
0

Spam:
0
```

Final classification rules dibahas di:

```text
03-ai-behavior.md
```

---

# 31. Conversation Anti-Spam

Repeated low-information messages tidak memberikan Bond.

Examples:

```text
"hi"
"hi"
"hi"
"hi"
```

Setelah repeated pattern terdeteksi:

```text
Bond Gain = 0
```

Pet tetap dapat merespons secara character-aware.

---

# 32. Sleep Action

Player dapat meminta pet tidur.

Condition:

```text
pet is awake
```

Effect:

```text
activity = SLEEPING

sleepStartedAt = now
```

Generate event:

```text
PET_WENT_TO_SLEEP
```

Tidak perlu langsung memberikan Energy.

Recovery dihitung berdasarkan elapsed sleep time.

---

# 33. Wake Action

Untuk MVP, user tidak perlu memiliki explicit Wake button.

Pet bangun melalui:

* automatic recovery,
* reopening after sufficient sleep,
* future interaction rules.

Jika player mencoba interaction saat sleeping:

pet dapat tetap tidur.

---

# 34. Action Validation Order

Semua actions harus mengikuti urutan:

```text
1. Is pet state valid?
2. Is action available?
3. Is cooldown / diminishing rule applicable?
4. Calculate mutations.
5. Clamp state.
6. Generate event.
7. Recalculate derived state.
8. Return result.
```

---

# 35. Mood System

Mood adalah derived state.

Mood tidak sebaiknya dimutasi secara arbitrary oleh LLM.

Mood ditentukan oleh rules + context.

MVP moods:

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

---

# 36. Mood Candidate System

Setiap rule menghasilkan:

```text
mood candidate
+
priority score
```

Mood dengan priority tertinggi menjadi current mood.

Example:

```text
Energy = 8

→ Sleepy
priority 90
```

```text
Hunger = 20

→ Hungry
priority 80
```

Result:

```text
Sleepy
```

---

# 37. Initial Mood Priorities

Suggested priorities:

```text
Sleepy
90

Hungry
80

Lonely
65

Excited
60

Curious
55

Bored
50

Happy
40

Neutral
0
```

Priority tidak selalu fixed.

Intensity dapat menambah score.

---

# 38. Sleepy Mood Rule

Example:

```text
Energy <= 20
```

Score:

```text
70 + (20 - Energy)
```

Energy 5:

```text
70 + 15 = 85
```

Energy 0:

```text
90
```

---

# 39. Hungry Mood Rule

If:

```text
Hunger <= 35
```

Score:

```text
60 + ((35 - Hunger) × 0.7)
```

Example:

Hunger 15:

```text
60 + 14
= 74
```

---

# 40. Excited Mood Rule

Possible conditions:

```text
recent Play within 30 minutes
AND
Happiness >= 70
```

Base score:

```text
60
```

Playful personality can add:

```text
+ Playful × 10
```

---

# 41. Lonely Mood Rule

Lonely should not trigger simply because player closes the app.

Possible condition:

```text
absence >= 18 hours
AND
Clingy >= 0.6
```

Score:

```text
55 + Clingy × 15
```

Maximum around:

```text
70
```

This intentionally stays below urgent physical needs.

---

# 42. Bored Mood

Possible condition:

```text
awake
AND
no meaningful interaction >= 8 hours
AND
Energy > 40
```

Score:

```text
45 + Playful × 10
```

---

# 43. Curious Mood

Possible triggers:

```text
recent conversation topic
new environment event
new growth stage
new skill
```

Curious trait modifies likelihood.

Base score:

```text
50 + Curious × 10
```

---

# 44. Happy Mood

If:

```text
Happiness >= 75
```

and no stronger candidate exists:

```text
Happy
```

Score:

```text
40
```

---

# 45. Neutral Mood

Fallback:

```text
Neutral
```

Score:

```text
0
```

---

# 46. Mood Persistence

Mood should not flicker after every small stat change.

Use minimum mood duration:

```text
15 minutes
```

Exception:

critical needs may override immediately.

Example:

```text
Energy suddenly drops to 0
→ Sleepy override
```

---

# 47. Personality Model

MVP personality traits:

```text
Playful
Curious
Shy
Independent
Clingy
```

Range:

```text
0.0 - 1.0
```

Starting values should not all be identical.

Initial seed range:

```text
0.35 - 0.55
```

Small random variation makes pets slightly different from birth.

This seed should be subtle.

History remains the dominant factor.

---

# 48. Personality Delta Philosophy

Personality changes must be very small.

Typical delta:

```text
0.001 - 0.01
```

Not:

```text
+0.2 from one interaction
```

Personality is long-term accumulated behavior.

---

# 49. Playful Signals

Positive signals:

```text
Play action
playful conversation
games
frequent fun interactions
```

Example delta:

```text
Play:
+0.004 Playful
```

Repeated Play diminishing multiplier also applies.

---

# 50. Curious Signals

Positive signals:

```text
long conversation
questions
exploration
Search usage
learning-related interactions
```

Example:

```text
Meaningful exploratory Talk:
+0.003 Curious
```

---

# 51. Clingy Signals

Potential positive signals:

```text
very frequent interaction
rapid response patterns
high Bond
little independent time
```

Example:

```text
many sessions across a day:
+small Clingy
```

Clingy should develop slowly.

---

# 52. Independent Signals

Potential positive signals:

```text
long offline periods
successful autonomous activities
less frequent interaction
```

Example:

```text
Long absence with autonomous activity:
+0.003 Independent
```

---

# 53. Shy Signals

Potential signals:

```text
low interaction frequency
short conversations
limited social engagement
```

Shy must not simply mean:

```text
player abandoned pet
```

It should represent interaction style.

---

# 54. Trait Competition

Some traits may naturally oppose each other.

Initial relationship:

```text
Independent ↔ Clingy
```

When Independent increases:

```text
Clingy may receive very small negative drift
```

Example:

```text
Independent +0.004

Clingy -0.001
```

Not all traits need opposites.

---

# 55. Personality Clamp

Personality values:

```text
min = 0.05
max = 0.95
```

Avoid absolute:

```text
0
1
```

This preserves behavioral flexibility.

---

# 56. Personality Daily Change Cap

Maximum change per trait:

```text
±0.03 / rolling 24h
```

This prevents manipulation through action spam.

---

# 57. Dominant Traits

Trait becomes visibly dominant when:

```text
value >= 0.65
```

Strong trait:

```text
>= 0.8
```

Low trait:

```text
<= 0.25
```

Player-facing Profile may show only:

```text
top 2 or 3 traits
```

---

# 58. Autonomous Activity

Pet can have one current activity.

Initial activities:

```text
IDLE
SLEEPING
PLAYING_ALONE
RESTING
LOOKING_AROUND
THINKING
EATING_SNACK
WAITING
```

---

# 59. Autonomous Activity Selection

Activity is selected based on weighted rules.

Example:

```text
If Energy <= 10:
SLEEPING weight = very high

If Playful high and Energy > 50:
PLAYING_ALONE weight increases

If Curious high:
LOOKING_AROUND / THINKING weights increase
```

Use weighted randomness within valid options.

This provides variation without pure chaos.

---

# 60. Activity Duration

Each activity has an approximate duration.

Example:

```text
PLAYING_ALONE
20-60 minutes

RESTING
30-90 minutes

LOOKING_AROUND
10-30 minutes

THINKING
10-45 minutes

SLEEPING
dynamic
```

Offline simulation does not need to reconstruct every minute.

---

# 61. Offline Simulation Principle

Do not run full realtime simulation in background.

When pet state is loaded:

```text
elapsed = now - lastSimulatedAt
```

Then simulate elapsed time.

---

# 62. Offline Simulation Order

Recommended order:

```text
1. Determine elapsed time.
2. Apply passive Hunger decay.
3. Resolve Sleep recovery if applicable.
4. Apply awake Energy decay.
5. Apply passive Happiness pressure.
6. Resolve autonomous activities.
7. Apply personality signals.
8. Generate summarized offline events.
9. Update timestamps.
10. Recalculate mood.
11. Check growth eligibility.
```

Order must remain deterministic.

---

# 63. Offline Simulation Cap

Very long absences should not generate thousands of events.

Detailed simulation window:

```text
maximum 48 hours
```

After 48 hours:

use summarized approximation.

Example:

```text
User absent:
30 days
```

Do not simulate:

```text
720 hourly ticks
```

Instead:

```text
apply bounded stat outcomes
generate long-absence summary
apply small Independent signal
```

---

# 64. Minimum Offline State

Stats should have safety floors after long absence.

Suggested:

```text
Hunger minimum:
0

Energy:
depends on sleep simulation

Happiness passive minimum:
30
```

Happiness should not become 0 simply because user took a vacation.

---

# 65. Return Event

Absence can generate one return context.

Example:

```text
RETURN_SHORT

RETURN_NORMAL

RETURN_LONG

RETURN_VERY_LONG
```

This becomes input for AI reaction.

Game engine stores factual event.

AI chooses wording.

---

# 66. Growth Inputs

Growth depends on:

```text
Age
Meaningful Interaction Count
Bond
```

Potential future variables:

```text
skill use
care quality
personality
```

Not required for MVP.

---

# 67. Stage: Egg → Baby

Condition:

```text
Hatch sequence completed
```

No age requirement.

---

# 68. Stage: Baby → Child

Initial balancing:

```text
Age >= 3 days
AND
Meaningful Interactions >= 12
AND
Bond >= 18
```

All conditions required.

This prevents passive waiting.

---

# 69. Stage: Child → Adult

Initial balancing:

```text
Age >= 14 days
AND
Meaningful Interactions >= 45
AND
Bond >= 40
```

Values intentionally conservative.

Playtesting decides final pace.

---

# 70. Meaningful Interaction

Counts:

```text
successful Feed
successful Play
Meaningful Talk
Sleep interaction
important shared event
```

Does not count:

```text
rejected actions
spam Talk
repeated meaningless interaction
```

---

# 71. Growth Eligibility

When requirements are met:

```text
growthEligible = true
```

Growth does not immediately occur silently.

Instead create:

```text
GROWTH_READY
```

Next appropriate player session can trigger growth sequence.

---

# 72. Growth Lock

During growth animation/event:

```text
normal actions temporarily unavailable
```

After completion:

```text
stage updated
new rules applied
skill unlock evaluated
```

---

# 73. Search Unlock

Condition:

```text
stage becomes ADULT
```

Generate:

```text
SKILL_UNLOCKED
{
  skill: SEARCH,
  level: 1
}
```

Skill detail belongs in:

```text
05-growth-and-skills.md
```

---

# 74. Event System

Every meaningful mutation generates event.

Basic event structure:

```json
{
  "type": "PET_PLAYED",
  "timestamp": "...",
  "data": {}
}
```

Events enable:

* debugging,
* analytics,
* memory creation,
* AI context,
* progression tracking,
* playtesting.

---

# 75. Core Event Types

Initial events:

```text
PET_CREATED
PET_HATCHED
PET_NAMED

PET_FED
PET_PLAYED

PET_WENT_TO_SLEEP
PET_WOKE_UP

USER_TALKED
MEANINGFUL_CONVERSATION

PET_ACTIVITY_STARTED
PET_ACTIVITY_COMPLETED

PLAYER_RETURNED

GROWTH_READY
PET_GREW

SKILL_UNLOCKED
SKILL_USED
```

---

# 76. Event Immutability

Once created, historical events should generally not be edited.

Game state changes.

History does not.

This makes debugging easier.

---

# 77. Current State vs History

Example:

Current state:

```text
Hunger = 72
```

History:

```text
09:00 PET_FED
12:00 PET_PLAYED
```

Do not rebuild every state from events for MVP unless event sourcing is intentionally chosen later.

Simple state + event log is enough.

---

# 78. Time Source

All server-side simulation should use:

```text
UTC timestamps
```

UI may convert to player local timezone.

Do not use device time as unquestioned source of truth if backend exists.

---

# 79. Simulation Timestamp

Pet should store:

```text
lastSimulatedAt
```

Whenever state is loaded for meaningful interaction:

```text
simulateUntil(now)
```

Then update:

```text
lastSimulatedAt = now
```

---

# 80. Action Idempotency

If client retries a request due to network issues, action should not accidentally run twice.

Future API should support:

```text
actionId / idempotency key
```

This is technical architecture detail, but game rules rely on it.

---

# 81. Derived Action Availability

Example structure:

```text
Feed:
available if awake or design allows waking for food

Play:
Energy > 15
AND awake

Talk:
awake

Sleep:
awake
```

For MVP, Feed while sleeping should be rejected.

---

# 82. Rejected Action Philosophy

Rejected actions should still produce character feedback.

Game engine returns reason:

```text
TOO_TIRED
TOO_FULL
SLEEPING
INVALID_STATE
```

AI/UI translates it into personality-aware response.

Example:

Engine:

```text
TOO_FULL
```

Pet:

> "Nggak muat lagi..."

---

# 83. Stat Mutation Response

Game action should return both before and after state.

Conceptually:

```json
{
  "action": "PLAY",
  "before": {
    "energy": 60,
    "happiness": 55
  },
  "after": {
    "energy": 50,
    "happiness": 67
  }
}
```

Useful for:

* animation,
* UI feedback,
* analytics,
* debugging.

---

# 84. Interaction Quality

Game should optimize for:

```text
meaningful repeated interaction
```

not:

```text
maximum number of clicks
```

Therefore many systems intentionally use:

* diminishing returns,
* daily caps,
* context,
* slow personality drift.

---

# 85. No Hard Daily Chores

MVP should avoid:

```text
daily quest checklist
mandatory login reward
streak punishment
```

Core interaction itself should be reason to return.

---

# 86. Balance Goal: Casual Player

Target casual pattern:

```text
2-4 sessions / day
```

Pet should remain healthy and interesting.

Player should not need hourly maintenance.

---

# 87. Balance Goal: Low Frequency Player

Pattern:

```text
1 session / day
```

Pet remains playable.

Possible:

```text
Hungry
Bored
Different mood
```

but not:

```text
ruined
dead
relationship destroyed
```

---

# 88. Balance Goal: Power User

Pattern:

```text
many interactions per day
```

Game remains responsive.

But progression is protected by:

```text
diminishing returns
Bond soft cap
personality daily cap
growth age requirement
```

Therefore grinding cannot instantly mature pet.

---

# 89. Initial Daily Simulation Example

Pet starts morning:

```text
08:00

Hunger:
80

Energy:
90

Happiness:
75

Bond:
30
```

Player Feed:

```text
Hunger:
100

Happiness:
77

Bond:
30.3
```

Player Play:

```text
Hunger:
96

Energy:
80

Happiness:
89

Bond:
31.3
```

User leaves for 8 hours.

Approximate state:

```text
Hunger:
80

Energy:
68

Happiness:
89

Bond:
31.3
```

Pet may perform autonomous activity.

User returns.

Game generates:

```text
PLAYER_RETURNED
PET_ACTIVITY_COMPLETED
```

Mood determined from state.

No arbitrary punishment.

---

# 90. Initial Overnight Example

Player puts pet to Sleep:

```text
23:00

Energy:
30

Hunger:
70
```

Returns at:

```text
07:00
```

Elapsed:

```text
8 hours
```

Energy:

```text
30 + (8 × 12)
→ clamp 100
```

Hunger sleeping decay:

```text
70 - (8 × 1)
= 62
```

Pet wakes rested but somewhat hungry.

This creates natural morning interaction.

---

# 91. Simulation Determinism

Given:

```text
same initial state
same timestamps
same actions
same random seed where applicable
```

core simulation should produce reproducible results.

Important for debugging.

Randomness should mainly affect:

* autonomous activity selection,
* minor behavioral variation.

Not critical progression rules.

---

# 92. Randomness Philosophy

Randomness adds texture.

It should not decide fundamental outcomes such as:

```text
whether Bond randomly drops 20
whether growth randomly fails
whether skill disappears
```

Player history should matter more than dice rolls.

---

# 93. System Boundaries

This document owns:

```text
numeric state
mechanical rules
time progression
state transitions
growth eligibility
```

It does not own:

```text
exact AI prompts
memory summarization
tool implementation
database schema
API endpoints
visual UI
```

Those belong to later documents.

---

# 94. Values Marked for Playtesting

All of these are initial hypotheses:

```text
Hunger decay
Energy decay
Sleep recovery
Happiness pressure
Bond gains
Bond cap
Play diminishing returns
Mood thresholds
Personality deltas
Personality caps
Growth ages
Growth Bond thresholds
Interaction requirements
```

They should not be treated as sacred constants.

---

# 95. Primary Playtest Questions

Game system prototype must answer:

1. Does Hunger decay feel too fast?
2. Does player feel forced to check too often?
3. Does Sleep create a natural rhythm?
4. Is Play useful without becoming spammable?
5. Does Bond feel earned?
6. Does Bond progression feel too slow?
7. Does mood match what player expects?
8. Does personality visibly change after several days?
9. Is personality change too predictable?
10. Does offline behavior make pet feel alive?
11. Does long absence feel forgiving enough?
12. Does growth arrive too early or too late?

---

# 96. Prototype Implementation Order

Recommended implementation order:

```text
1. Pet State

2. Time Simulation

3. Hunger

4. Energy

5. Feed

6. Sleep

7. Happiness

8. Play

9. Bond

10. Mood

11. Event Log

12. Offline Simulation

13. Personality

14. Autonomous Activity

15. Growth
```

AI should not be required to test steps 1-15.

---

# 97. Prototype 0.1 Definition of Done

Game simulation prototype is ready when developer can:

```text
create pet

advance simulated time

Feed pet

Play with pet

put pet to Sleep

wake pet

observe Hunger changes

observe Energy changes

observe Happiness changes

observe Bond changes

inspect Mood

inspect event log

simulate 24+ hours offline
```

All without LLM.

---

# 98. Debug Mode

Prototype should support changing simulation time.

Example:

```text
+1 hour
+6 hours
+1 day
+7 days
```

This prevents testing requiring real-world waiting.

Debug mode can also display:

```text
raw personality values
raw stats
growth progress
recent events
```

Debug controls are not player-facing product features.

---

# 99. Recommended Constants Structure

Game balance values should not be scattered through code.

Conceptually:

```text
GAME_BALANCE
├── needs
├── actions
├── bond
├── mood
├── personality
├── offline
└── growth
```

Example:

```javascript
const GAME_BALANCE = {
  hunger: {
    decayPerHour: 2,
    sleepMultiplier: 0.5,
  },

  energy: {
    decayPerHour: 1.5,
    sleepRecoveryPerHour: 12,
  },

  growth: {
    child: {
      minAgeDays: 3,
      minBond: 18,
      minInteractions: 12,
    },

    adult: {
      minAgeDays: 14,
      minBond: 40,
      minInteractions: 45,
    },
  },
};
```

Values can then be tuned without rewriting game logic.

---

# 100. North Star

Game systems harus membuat pet:

* predictable enough to understand,
* variable enough to feel alive,
* forgiving enough to live with,
* persistent enough to form history,
* dan slow-changing enough to develop identity.

Jika system membuat pemain merasa harus menjaga spreadsheet daripada merawat karakter, balancing-nya salah.

Tujuan akhirnya bukan:

> "Aku berhasil menjaga semua stat di 100."

Tujuannya:

> **"Aku mulai ngerti sifat dan kebiasaan pet-ku."**
