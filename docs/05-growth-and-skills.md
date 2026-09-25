# Growth and Skills Design

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`, `04-memory-system.md`

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana pet:

* tumbuh dari Egg hingga Adult,
* memenuhi syarat growth,
* mengalami growth event,
* memperoleh capability baru,
* menggunakan skill,
* meningkatkan skill,
* dan nantinya berkembang ke specialization.

Prinsip utama:

> **Growth must change what the pet can be and what the pet can do.**

Growth tidak boleh hanya berupa perubahan visual.

---

# 2. Core Growth Philosophy

Growth memiliki empat dimensi:

```text
Physical Growth
+
Behavioral Growth
+
Relationship Growth
+
Capability Growth
```

Physical Growth:

```text
Egg
↓
Baby
↓
Child
↓
Adult
```

Behavioral Growth:

```text
simple reactions
↓
clear personality
↓
complex behavior
```

Relationship Growth:

```text
new
↓
familiar
↓
close
↓
trusted
```

Capability Growth:

```text
basic interaction
↓
memory use
↓
skills
↓
specialization
```

Semua dimensi tersebut harus terasa sebagai perjalanan karakter yang sama.

---

# 3. Growth Is Not Player Level

Project tidak menggunakan player level sebagai progression utama.

Tidak ada:

```text
Player Lv. 12
```

sebagai pusat progression.

Yang berkembang adalah pet.

Player progression dirasakan melalui:

```text
Pet Stage
Pet Bond
Pet Personality
Pet Memories
Pet Skills
```

---

# 4. Growth Inputs

Growth ditentukan oleh kombinasi:

```text
Age
+
Meaningful Interaction
+
Bond
```

Untuk MVP, ketiga faktor diperlukan.

Tujuannya:

* Age mencegah grinding instan.
* Interaction memastikan player benar-benar bermain.
* Bond memastikan growth terkait relationship.

---

# 5. Growth Rule Principle

Growth tidak boleh terjadi hanya karena:

```text
time passed
```

dan tidak boleh terjadi hanya karena:

```text
player spammed interactions
```

Idealnya:

```text
Time
+
Care
+
Relationship
```

---

# 6. MVP Growth Stages

MVP memiliki:

```text
Egg
Baby
Child
Adult
```

Tidak ada evolution branch pada MVP.

Semua pet melewati lifecycle yang sama.

Branching growth dapat dipertimbangkan setelah core system terbukti.

---

# 7. Egg Stage

Egg adalah tahap onboarding.

Capabilities:

```text
Simple Reaction
Hatch Interaction
```

Tidak memiliki:

```text
normal conversation
personality expression
skills
complex needs
```

Egg harus terasa singkat.

---

# 8. Egg Growth Condition

Growth:

```text
Egg → Baby
```

Condition:

```text
Hatch sequence completed
```

Tidak membutuhkan:

* Age,
* Bond,
* Meaningful Interaction count.

Hatch merupakan deliberate onboarding event.

---

# 9. Hatch Event

Hatch sequence dapat terdiri dari:

```text
Egg movement
↓
Player interaction
↓
Crack
↓
Hatch animation
↓
Pet appears
↓
Naming
```

Setelah selesai:

```text
stage = BABY
```

Generate:

```text
PET_HATCHED
PET_NAMED
```

---

# 10. Baby Stage

Baby adalah attachment phase.

Capabilities:

```text
Feed
Play
Talk
Sleep
Basic Memory
Basic Mood
Basic Personality Development
```

Tidak memiliki utility skills.

Primary purpose:

> pemain belajar merawat dan mengenal pet.

---

# 11. Baby Behavioral Characteristics

Baby:

* vocabulary sederhana,
* sangat expressive,
* behavior relatif langsung,
* belum terlalu sophisticated,
* personality baru mulai terbentuk.

Baby tidak boleh terasa seperti AI assistant mini.

---

# 12. Baby → Child Requirements

Initial balancing:

```text
Age >= 3 days

AND

Meaningful Interactions >= 12

AND

Bond >= 18
```

Semua conditions required.

---

# 13. Why Multiple Growth Requirements

Jika hanya menggunakan Age:

player bisa tidak pernah berinteraksi dan pet tetap berkembang.

Jika hanya menggunakan Interaction:

player bisa grinding dalam satu jam.

Jika hanya menggunakan Bond:

sistem dapat dieksploitasi melalui action tertentu.

Gabungan ketiganya menciptakan:

```text
Time
+
Participation
+
Relationship
```

---

# 14. Growth Readiness

Ketika requirements terpenuhi:

```text
growthEligible = true
```

Tapi stage belum berubah.

Generate:

```text
GROWTH_READY
```

Growth menunggu session yang sesuai.

---

# 15. Growth Should Not Happen Offscreen

Pet tidak boleh berubah dari Baby ke Child ketika player tidak melihat.

Contoh yang harus dihindari:

```text
Close app:
Baby

Return tomorrow:
Adult
```

Growth adalah emotional milestone.

Player harus hadir saat transition.

---

# 16. Growth Trigger

Jika:

```text
growthEligible = true
```

pada session berikutnya, game dapat memicu:

```text
Growth Sequence
```

Possible trigger:

* setelah opening greeting,
* setelah action pertama,
* atau immediately setelah state load.

Exact UX ditentukan nanti.

---

# 17. Growth Sequence

Conceptual flow:

```text
Pet acts unusual
↓
Visual cue
↓
Growth animation
↓
New Stage Reveal
↓
Behavior change
↓
Capability update
↓
Memory / event created
```

Growth harus terasa spesial.

---

# 18. Growth Event Data

Example:

```json
{
  "type": "PET_GREW",
  "fromStage": "BABY",
  "toStage": "CHILD",
  "timestamp": "..."
}
```

May generate deterministic memory:

```text
Momo became Child.
```

---

# 19. Child Stage

Child adalah personality phase.

Capabilities:

```text
Everything from Baby
+
Stronger Memory Usage
+
More Complex Dialogue
+
More Visible Personality
+
Richer Autonomous Behavior
```

Child belum memiliki utility skill untuk MVP.

---

# 20. Child Behavioral Characteristics

Child:

* more verbal,
* more curious,
* more expressive,
* begins using callbacks,
* has clearer preferences,
* personality traits more noticeable.

This is the stage where player should start saying:

> "Pet-ku punya sifat."

---

# 21. Child → Adult Requirements

Initial balancing:

```text
Age >= 14 days

AND

Meaningful Interactions >= 45

AND

Bond >= 40
```

All conditions required.

---

# 22. Adult Stage

Adult merupakan tahap pertama ketika pet menjadi:

```text
Companion
+
Useful AI
```

Capabilities:

```text
Everything from Child
+
More Complex Conversation
+
Stable Personality Expression
+
Search Lv.1
```

Adult bukan akhir progression jangka panjang.

Untuk MVP, Adult adalah end-state progression.

---

# 23. Adult Growth Event

Child → Adult harus terasa lebih besar daripada Baby → Child.

Possible sequence:

```text
Growth animation
↓
Adult appearance
↓
Pet reacts
↓
New skill discovered
↓
Search Lv.1 unlocked
```

Growth dan skill unlock boleh terjadi dalam satu emotional sequence.

---

# 24. Growth Memory

Major growth should create:

```text
RELATIONSHIP_EVENT
```

Example:

```text
Momo became Adult while the player was present.
```

If player is present during event.

This strengthens shared history.

---

# 25. Growth Effects

Changing stage can update:

```text
visual form
dialogue complexity
autonomous behavior pool
memory expression
skill availability
animation set
```

It should not reset:

```text
Bond
Personality
Memory
History
```

Same character, new stage.

---

# 26. Personality Persistence Across Growth

Example:

Baby:

```text
Playful = 0.74
Curious = 0.63
```

After becoming Child:

```text
Playful = 0.74
Curious = 0.63
```

Growth does not reroll personality.

The expression may become richer.

---

# 27. Memory Persistence Across Growth

All relevant memory persists across:

```text
Baby
↓
Child
↓
Adult
```

Pet should remember things from earlier life stages.

Example Adult callback:

> "Kamu yang kasih nama aku waktu baru netas."

This creates autobiographical continuity.

---

# 28. Meaningful Interaction Count

Growth uses:

```text
meaningfulInteractionCount
```

Not raw click count.

Counts may include:

```text
successful Feed
successful Play
meaningful Talk
Sleep interaction
important shared event
```

Does not include:

```text
rejected action
spam
repeated meaningless message
failed tool request
```

---

# 29. Interaction Count Anti-Grind

Multiple repeated actions can still count, but diminishing rules apply.

Example:

```text
Play #1
counts 1.0

Play #2 within same short window
counts 0.75

Play #3
counts 0.5

Play #4+
counts 0.25
```

Implementation may use weighted count internally.

---

# 30. Growth Progress Visibility

Player should know that pet is growing.

But exact requirements do not necessarily need to be exposed.

Possible UI:

```text
Growth

███████░░░
Growing well
```

Instead of:

```text
Interaction 37 / 45
Bond 38 / 40
Age 12.4 / 14 days
```

Exact numbers may encourage optimization rather than relationship.

---

# 31. Growth Feedback

System can provide qualitative hints:

```text
Still very young
Growing steadily
Getting more independent
Almost ready to grow
```

This gives direction without turning pet into progress spreadsheet.

---

# 32. Growth Block Explanation

If player asks why pet has not grown yet, UI may explain broadly:

> Spend time together and let your pet grow naturally.

Avoid exposing hidden exploit-friendly formulas unless product direction changes.

---

# 33. Skill Definition

A Skill is an unlocked capability that allows pet to perform a useful action beyond core care interactions.

Examples:

```text
Search
Reminder
Research
Calendar
Notes
Planning
```

Core actions are not Skills.

Core actions:

```text
Feed
Play
Talk
Sleep
```

---

# 34. Skill Model

Conceptual skill state:

```json
{
  "type": "SEARCH",
  "level": 1,
  "unlockedAt": "...",
  "xp": 0,
  "usageCount": 0
}
```

For MVP, XP may not yet be required.

Data model should allow it.

---

# 35. Skill Unlock Principle

Skills unlock because pet has grown or learned.

Not because:

```text
user opened settings
```

Unlock must have character meaning.

---

# 36. Skill Unlock Event

Example:

```text
SKILL_UNLOCKED

skill:
SEARCH

level:
1
```

Create relationship/pet experience memory:

```text
Momo learned Search.
```

---

# 37. Search Lv.1

MVP first utility skill.

Purpose:

> allow pet to find external information requested by player.

Examples:

```text
"Carikan artikel tentang WebAssembly."

"Cari berita terbaru tentang React."

"Ada artikel bagus soal accessibility?"
```

---

# 38. Search Unlock Condition

For MVP:

```text
stage == ADULT
```

Then:

```text
unlock SEARCH Lv.1
```

No separate quest required yet.

---

# 39. Search Lv.1 Capability

Search Lv.1 can:

```text
perform basic web search
return a few relevant results
summarize them
provide source references
```

Should support:

```text
simple explicit search requests
```

---

# 40. Search Lv.1 Limitations

To preserve progression, Search Lv.1 does not need to support:

```text
long autonomous research projects
continuous monitoring
complex multi-step research
deep source synthesis
```

Those belong to later levels/skills.

---

# 41. Search Skill Flow

```text
User Request
↓
AI detects Search intent
↓
Game checks Search skill
↓
Search Lv.1 available
↓
Tool executes
↓
Results returned
↓
AI summarizes in character
↓
SKILL_USED event
```

---

# 42. Locked Search

If Search is locked:

```text
SEARCH intent
↓
Skill check fails
```

No external search performed.

AI can respond:

> "Aku belum bisa nyari ke luar sana."

This reinforces growth.

---

# 43. Skill Usage Event

Each successful use creates:

```text
SKILL_USED
```

Example:

```json
{
  "type": "SKILL_USED",
  "skill": "SEARCH",
  "level": 1,
  "timestamp": "..."
}
```

Useful for:

* future XP,
* analytics,
* specialization,
* memory.

---

# 44. Skill Usage Does Not Automatically Increase Bond

Using Search is useful.

It is not necessarily an emotional interaction.

Therefore:

```text
Search usage
≠ automatic Bond gain
```

Conversation around the result may still affect Bond.

---

# 45. Skill Personality Expression

Capability remains the same.

Presentation differs.

Curious pet:

> "Aku nemu tiga artikel. Yang kedua menarik banget."

Playful pet:

> "Aku berburu ke internet dan bawa pulang tiga hasil 👀"

Shy pet:

> "Aku nemu beberapa... yang ini kayaknya cukup bagus."

Personality must not distort factual result.

---

# 46. Skill Reliability

Skills should feel reliable.

Character quirks may affect wording.

They should not create:

* fake results,
* intentionally wrong data,
* random refusal without mechanical reason.

Useful AI capability must preserve trust.

---

# 47. Skill Level Philosophy

Future skills may have levels:

```text
Lv.1
Lv.2
Lv.3
...
```

Higher levels should increase capability, not only numeric power.

Example Search progression:

```text
Search Lv.1
basic search

Search Lv.2
search + better filtering

Search Lv.3
multi-source summary

Search Lv.4
deeper comparison

Search Lv.5
research workflow
```

---

# 48. MVP Skill Leveling

For MVP:

```text
Search remains Lv.1
```

No skill leveling required.

Reason:

Need to validate:

```text
growth
→
capability unlock
```

before designing full skill progression.

---

# 49. Future Skill XP

Potential later model:

```text
skill use
+
successful completion
+
user feedback
↓
skill XP
```

Skill XP should not encourage meaningless spam.

---

# 50. Skill Practice

Future concept:

Pet can improve a skill by using it.

Example:

```text
Search usage
↓
Search experience
↓
Search level
```

But only successful or meaningful usage should count.

---

# 51. Skill Training

Future mechanic:

User may actively teach pet.

Example:

> "Aku mau ngajarin kamu ngatur jadwalku."

Could start:

```text
Training Path:
Keeper
```

Training may involve:

* repeated use,
* feedback,
* growth conditions.

Not required for MVP.

---

# 52. Future Skill Categories

Potential categories:

```text
Explorer
Keeper
Creator
```

These are working concepts, not final classes.

---

# 53. Explorer

Focus:

```text
discovering
searching
researching
analyzing
```

Potential progression:

```text
Search
↓
Research
↓
Analysis
```

---

# 54. Keeper

Focus:

```text
remembering
scheduling
organizing
```

Potential progression:

```text
Reminder
↓
Calendar
↓
Planning
```

---

# 55. Creator

Focus:

```text
brainstorming
writing
creating
```

Potential progression:

```text
Ideas
↓
Writing
↓
Creative Assistance
```

---

# 56. Specialization Philosophy

Pet should not necessarily select a rigid RPG class.

Instead specialization may emerge from skill usage.

Example:

```text
frequent Search use
+
high Curious
↓
Explorer tendency
```

Another pet may use:

```text
Reminder
+
Calendar
↓
Keeper tendency
```

---

# 57. Hybrid Specialization

Future pet can potentially become:

```text
Explorer + Keeper
```

or:

```text
Creator + Explorer
```

Avoid forcing mutually exclusive class choices too early.

The goal remains:

> user's interaction history shapes the pet.

---

# 58. Skills and Personality

Personality may influence specialization tendencies.

Example:

```text
Curious
→ Explorer affinity
```

```text
Independent
→ possibly autonomous research affinity
```

But personality should not hard-lock skill access.

Player agency matters.

---

# 59. Skills and Growth

Future model may require:

```text
Growth Stage
+
Skill Experience
+
Relationship
```

for advanced skills.

Example:

```text
Research
requires:
Adult
Search Lv.3
minimum experience
```

Not needed in MVP.

---

# 60. Skills and Memory

Some skills interact strongly with Memory.

Example Reminder:

```text
remembering event
+
scheduled action
```

But these remain separate systems.

Memory can know:

```text
User has an interview Friday.
```

Reminder can actively notify:

```text
Friday 08:30
```

---

# 61. Skills and Tools

Skill represents in-game capability.

Tool represents technical execution.

Conceptually:

```text
Skill:
Search Lv.1

↓ authorizes

Tool:
web_search()
```

Pet should not directly know technical tool implementation.

---

# 62. Skill Authorization

Before tool execution:

```text
AI requests tool
↓
Skill System checks capability
↓
Authorized?
```

If no:

```text
reject
```

AI never bypasses skill lock.

---

# 63. Skill State Is Source of Truth

LLM may say:

```text
"I can search."
```

only if Skill System confirms:

```text
SEARCH unlocked
```

Skill state is authoritative.

---

# 64. Skill Failure vs Skill Lock

Important distinction.

Locked:

```text
Pet has not learned Search.
```

Failure:

```text
Pet knows Search,
but tool failed.
```

Responses should differ.

Locked:

> "Aku belum bisa nyari."

Failure:

> "Aku coba nyari, tapi gagal dapet hasil."

---

# 65. Skill Discovery

Skill unlock should feel discovered by the character.

Example:

```text
Momo became Adult.

...

Momo:
"Kayaknya sekarang aku bisa nyari sesuatu dari luar sini."
```

This reinforces character progression.

---

# 66. Skill Unlock UI

Possible UI:

```text
✨ NEW SKILL

Search Lv.1

Find information from the web.
```

Followed by character reaction.

Avoid generic app language such as:

```text
Feature enabled successfully.
```

---

# 67. Skill Profile

Pet Profile can show:

```text
Skills

Search Lv.1
```

Future:

```text
Search Lv.3
Reminder Lv.2
Writing Lv.1
```

---

# 68. Locked Skill Visibility

Two possible approaches:

### Hidden

Player only discovers skills when unlocked.

Advantage:

* mystery,
* surprise.

### Silhouette / teaser

Example:

```text
Search Lv.1
???

???
```

Advantage:

* progression anticipation.

Decision can wait until UI testing.

---

# 69. Growth Reward Layers

Growth event should ideally reward player on multiple layers:

```text
Visual
+
Behavior
+
Dialogue
+
Capability
```

Example Adult:

```text
new visual form
+
more mature dialogue
+
richer memory callbacks
+
Search Lv.1
```

This makes growth feel substantial.

---

# 70. Avoid Empty Growth

Bad growth:

```text
Baby → Child

only sprite changed
```

Good growth:

```text
Baby → Child

new visual
+
new animation
+
more complex language
+
stronger personality
+
richer memory use
```

---

# 71. Growth Pace Philosophy

Growth should be slow enough to create attachment.

But not so slow that prototype testers never reach Adult.

MVP default:

```text
Baby → Child:
~3+ days

Child → Adult:
~14+ days total age
```

For internal testing:

use time acceleration.

---

# 72. Debug Growth Mode

Developer tools should allow:

```text
advance age +1 day
set Bond
set interaction count
force growth ready
trigger growth sequence
unlock skill
```

This is necessary for rapid iteration.

---

# 73. Production vs Debug Requirements

Production:

```text
Age requirement enforced
Interaction requirement enforced
Bond requirement enforced
```

Debug:

```text
can bypass
```

Debug bypass must never accidentally reach production player state.

---

# 74. Growth and Long Absence

Player should not return after months to find multiple unseen growth stages completed.

Growth may become eligible offline.

But transition waits for player presence.

Example:

```text
Baby
↓
requirements met during absence
↓
GROWTH_READY
↓
player returns
↓
growth sequence
```

---

# 75. Multiple Growth Eligibility

Suppose player leaves Baby for 30 days.

They may technically satisfy both Child and Adult age requirements.

Still:

```text
Baby
↓
Child growth event
```

Then Adult requirements must be evaluated again after Child stage.

No skipping stages in MVP.

---

# 76. Growth Cooldown

To avoid immediate double growth after long absence:

```text
minimum stage presence duration
```

can be required.

Possible initial rule:

```text
at least 1 meaningful session in Child stage
```

before Adult eligibility.

May be added if testing reveals stage skipping feels rushed.

---

# 77. Growth Gate Philosophy

Requirements should encourage healthy interaction.

Not chores.

Avoid:

```text
Feed exactly 50 times
Play exactly 30 times
```

Prefer broad relationship requirements.

---

# 78. No Perfect Growth Path

There should not be a single optimal way to grow pet.

Different users can meet meaningful interaction requirement through different mixes:

```text
Talk-heavy
Play-heavy
Balanced
```

Within reasonable limits.

---

# 79. Growth and Personality Diversity

Growth does not normalize pet.

Two Adult pets can be:

```text
Playful + Clingy
```

and:

```text
Curious + Independent
```

Both are valid.

Growth increases maturity, not sameness.

---

# 80. Growth and Appearance

Future evolution visuals may eventually respond to personality.

Example:

```text
high Curious
→ visual detail A

high Playful
→ visual detail B
```

Not required for MVP.

MVP can use one appearance per stage.

---

# 81. Future Evolution Branches

Possible future:

```text
Child
├── Explorer-like Adult
├── Keeper-like Adult
└── Creator-like Adult
```

However this should not be implemented until:

* personality works,
* skills work,
* progression is fun.

Branching too early multiplies content cost.

---

# 82. Growth History

Store stage transition history:

```text
BABY at timestamp
CHILD at timestamp
ADULT at timestamp
```

Useful for:

* memories,
* analytics,
* profile,
* debugging.

---

# 83. Skill History

Store:

```text
skill unlockedAt
firstUsedAt
usageCount
```

Future:

```text
level-up history
```

This creates capability history.

---

# 84. Growth Analytics

Useful metrics:

```text
time to Child
time to Adult
interactions before growth
Bond at growth
sessions before growth
drop-off by stage
```

These metrics help tune progression.

---

# 85. Skill Analytics

Useful metrics:

```text
Search unlock rate
time from unlock to first use
Search usage frequency
successful searches
failed searches
repeat usage
```

Critical question:

> Does utility become more meaningful because it was earned?

---

# 86. Growth Playtest Questions

Ask:

1. Does Baby feel meaningfully different from Child?
2. Does Child feel meaningfully different from Adult?
3. Does growth happen too quickly?
4. Does growth feel too slow?
5. Does player understand why growth happened?
6. Does player feel involved?
7. Is growth event emotionally noticeable?
8. Does unlocked skill feel earned?
9. Does Adult still feel like the same pet?
10. Does progression encourage grinding?

---

# 87. Skill Playtest Questions

Ask:

1. Does Search feel like pet capability or app feature?
2. Does player understand Search was unlocked through growth?
3. Does personality remain visible while using Search?
4. Is Search reliable enough to trust?
5. Does player want to use it again?
6. Does skill make pet feel more valuable without replacing care gameplay?

---

# 88. Failure Signal: Feature Unlock

Bad player reaction:

> "Oh, app sekarang punya search."

Desired reaction:

> "Momo sekarang bisa search."

That distinction is central to the product.

---

# 89. Failure Signal: Growth Grind

Bad:

> "Aku harus spam Play supaya cepat Adult."

Desired:

> "Kayaknya dia sudah tumbuh karena kita sering bareng."

If players optimize actions mechanically, progression may be too transparent or grindable.

---

# 90. Failure Signal: Utility Dominance

Bad:

> "Aku cuma buka pet kalau mau search."

Utility must not destroy companion loop.

Search is an extension of relationship.

Not replacement.

---

# 91. MVP Growth Scope

MVP includes:

```text
Egg
Baby
Child
Adult

Growth eligibility
Growth events
Growth persistence
Stage-based behavior

Search Lv.1 unlock
Skill usage
Skill validation
Skill history
```

---

# 92. Out of Scope for MVP

Not required:

```text
Skill XP
Skill Level Up
Training quests
Multiple specializations
Evolution branches
Skill respec
Skill trees
Skill marketplace
Multiple skill slots
Skill rarity
```

These are intentionally deferred.

---

# 93. Prototype Growth Milestone 0.1

Implement:

```text
Egg → Baby
Baby → Child
Child → Adult
```

with debug time acceleration.

No AI required.

Goal:

validate progression rules.

---

# 94. Prototype Growth Milestone 0.2

Add stage-based:

```text
dialogue constraints
mood expression
personality expression
```

Goal:

growth changes behavior.

---

# 95. Prototype Skill Milestone 0.3

Add:

```text
Adult
↓
Search Lv.1
```

Use real Search tool.

Goal:

validate capability unlock.

---

# 96. Prototype Skill Milestone 0.4

Add:

```text
skill usage history
tool failure handling
locked skill behavior
```

Goal:

validate reliable skill system.

---

# 97. Growth State Example

Conceptual:

```json
{
  "stage": "CHILD",
  "growth": {
    "eligible": false,
    "meaningfulInteractions": 31,
    "stageEnteredAt": "...",
    "lastGrowthAt": "..."
  }
}
```

Derived:

```text
Age = 10 days
Bond = 33
```

Adult:

```text
not eligible
```

---

# 98. Skill State Example

```json
{
  "skills": [
    {
      "type": "SEARCH",
      "level": 1,
      "unlockedAt": "...",
      "usageCount": 8,
      "firstUsedAt": "..."
    }
  ]
}
```

---

# 99. Growth Evaluation Order

Recommended:

```text
1. Simulate current state.
2. Resolve current action.
3. Update interaction metrics.
4. Update Bond.
5. Evaluate growth requirements.
6. Mark GROWTH_READY if eligible.
7. Trigger growth only in appropriate session context.
```

Do not evaluate growth before latest interaction state is applied.

---

# 100. Skill Unlock Evaluation Order

After stage transition:

```text
1. Update stage.
2. Generate PET_GREW.
3. Evaluate stage-based unlocks.
4. Unlock eligible skills.
5. Generate SKILL_UNLOCKED.
6. Build AI reaction context.
7. Present growth + skill result.
```

---

# 101. Growth Failure Safety

If growth animation/UI fails:

persistent state should remain recoverable.

Avoid state where:

```text
stage changed
but skill not unlocked
```

or:

```text
animation played
but stage remained old
```

Stage transition should be atomic at game logic level.

---

# 102. Skill Unlock Atomicity

Search unlock should be idempotent.

Repeated growth processing must not create:

```text
Search Lv.1
Search Lv.1
Search Lv.1
```

Skill identifier must be unique per pet.

---

# 103. Growth Reactions

AI receives:

```text
fromStage
toStage
newCapabilities
relationship context
```

and reacts accordingly.

Example:

> "Eh... aku rasanya beda. Aku makin gede!"

Adult:

> "Kayaknya sekarang aku bisa bantu nyari sesuatu juga."

---

# 104. Growth Reaction Must Be Grounded

AI must not claim:

> "Sekarang aku bisa bikin reminder!"

if only Search was unlocked.

New capabilities are passed explicitly.

---

# 105. Skills as Character Learning

Product language should favor:

```text
learned
discovered
can now
```

rather than:

```text
feature enabled
module activated
```

Player-facing progression belongs to the character.

---

# 106. Growth UX Principle

The growth sequence should answer three questions:

```text
What changed visually?

What changed behaviorally?

What can my pet do now?
```

If one is missing, event may feel incomplete.

---

# 107. Skill UX Principle

When skill unlocks, player should understand:

```text
what it does
how to invoke it
why pet can do it now
```

Example:

```text
Search Lv.1

Ask Momo to find information or articles.
```

---

# 108. No Manual Skill Menu Requirement

Skills should preferably be usable through normal conversation.

Example:

> "Cari artikel soal CSS."

Not:

```text
Menu
→ Skills
→ Search
→ Open Search Form
```

A profile/menu may show abilities, but conversation is primary invocation.

---

# 109. Skill Discovery Through Dialogue

Pet may proactively teach user once.

Example:

> "Kalau mau, sekarang kamu bisa suruh aku nyari artikel."

Only once or sparingly.

Avoid repeated tutorial chatter.

---

# 110. Relationship With Future Agents

Advanced skill levels may eventually perform multi-step work.

But this requires stronger:

* permission,
* action confirmation,
* tool safety,
* error handling.

MVP Search remains read-only.

This makes it a safe first capability.

---

# 111. Search Is a Good First Skill

Search is chosen because it is:

```text
useful
easy to understand
read-only
low commitment
natural through conversation
easy to demonstrate
```

It proves the core concept without introducing action permissions like calendar writes.

---

# 112. Future Reminder Skill

Reminder is a likely second capability because it naturally reinforces:

```text
Memory
+
Utility
```

But it introduces:

```text
future scheduling
notifications
permissions
```

Therefore excluded from MVP 1.

---

# 113. Future Skill Unlock Philosophy

Advanced skills may unlock through combination of:

```text
stage
skill use
personality tendency
relationship
training
```

Not all factors need to be mandatory.

Goal:

different pets can develop different strengths.

---

# 114. Example Future Progression

```text
Adult

Search Lv.1
↓
frequent research behavior
↓
Search Lv.2
↓
Research Lv.1
↓
Explorer tendency
```

Alternative:

```text
Adult

Reminder Lv.1
↓
frequent scheduling use
↓
Calendar Lv.1
↓
Keeper tendency
```

---

# 115. Avoid RPG Overload

Although skill trees are useful metaphors, product should not automatically become:

```text
+5 INT
+3 Research Damage
Epic Reminder Skill
```

The progression should feel natural and character-centric.

Utility first.

Numbers second.

---

# 116. Growth and Skill Design Contract

Growth System determines:

```text
when pet changes stage
```

Skill System determines:

```text
what capability is available
```

AI Behavior determines:

```text
how pet expresses that change
```

Tool System determines:

```text
how capability is technically executed
```

Memory System determines:

```text
what part of the milestone is remembered
```

---

# 117. MVP Definition of Done

Growth and Skills are MVP-ready when:

1. Egg can hatch into Baby.
2. Baby can become Child through Age + Interaction + Bond.
3. Child can become Adult through Age + Interaction + Bond.
4. Growth cannot be completed purely through grinding.
5. Growth never occurs invisibly offscreen.
6. Growth preserves personality.
7. Growth preserves memory.
8. Growth creates persistent events/history.
9. Stage changes affect behavior.
10. Adult unlocks Search Lv.1.
11. Search skill state is persistent.
12. Locked Search cannot execute.
13. Unlocked Search can invoke real Search tool.
14. Search success produces grounded results.
15. Search failure does not fabricate results.
16. Search is expressed through pet personality.
17. Growth and skill unlocks are idempotent.
18. Debug tools can accelerate growth for testing.

---

# 118. North Star

Growth should make the player feel:

> "Aku melihat pet ini berkembang."

Skills should make the player feel:

> "Sekarang dia bisa melakukan sesuatu yang dulu belum bisa."

Together they create the larger fantasy:

```text
Care
↓
Relationship
↓
Growth
↓
Learning
↓
Capability
```

The player is not unlocking features.

They are **raising a companion that learns.**
