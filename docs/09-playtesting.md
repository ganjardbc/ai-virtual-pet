# Playtesting Plan

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production / Prototype Planning
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`, `04-memory-system.md`, `05-growth-and-skills.md`, `06-technical-architecture.md`, `07-data-model.md`, `08-api-design.md`

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana AI Virtual Pet akan diuji selama prototype dan MVP development.

Playtesting digunakan untuk menjawab:

* apakah pet terasa hidup,
* apakah kebutuhan terasa masuk akal,
* apakah interaction terasa meaningful,
* apakah personality terlihat,
* apakah memory terasa natural,
* apakah growth terasa rewarding,
* apakah skill terasa seperti kemampuan pet,
* dan apakah pemain ingin kembali.

Tujuan playtesting bukan membuktikan desain kita benar.

Tujuannya adalah menemukan bagian desain yang ternyata salah ketika dimainkan.

---

# 2. Core Playtesting Principle

> **Test the experience, not just the feature.**

Contoh:

Bukan hanya:

```text
Does Feed button work?
```

Tetapi:

```text
Does feeding the pet feel meaningful
within the daily relationship loop?
```

Bukan hanya:

```text
Does Memory retrieval return data?
```

Tetapi:

```text
Does the recalled memory make
the pet feel more continuous and alive?
```

---

# 3. What Playtesting Must Validate

Ada enam area utama:

```text
Simulation

Interaction

Personality

Memory

Growth

Skills
```

Semua diuji secara terpisah dan bersama-sama.

---

# 4. Primary Product Question

Pertanyaan terbesar:

> **Setelah beberapa hari, apakah pemain merasa bahwa pet tersebut memiliki kehidupan dan sejarah bersama mereka?**

Jika jawabannya tidak, jumlah fitur tidak penting.

Core fantasy belum bekerja.

---

# 5. Primary Success Signals

Strong qualitative signals:

> "Pet-ku sekarang lebih manja."

> "Kayaknya dia capek kalau malam."

> "Dia masih ingat yang aku bilang kemarin."

> "Punyaku beda sama punya orang lain."

> "Sekarang dia udah bisa bantu nyari."

Statements seperti ini menunjukkan pemain mulai melihat pet sebagai character individual.

---

# 6. Primary Failure Signals

Warning signs:

> "Ini cuma chatbot pakai avatar."

> "Stats-nya nggak terasa ngaruh."

> "Aku cuma buka kalau butuh Search."

> "Semua pet jawabannya sama."

> "Pet terlalu needy."

> "Memory-nya random."

> "Aku harus grind supaya cepat grow."

> "Growth cuma ganti gambar."

Jika feedback ini muncul berulang, desain perlu direvisi.

---

# 7. Playtest Phases

Playtesting dibagi sesuai prototype milestone.

```text
Prototype 0.1
Simulation

Prototype 0.2
AI + Personality

Prototype 0.3
Memory + Offline Continuity

Prototype 0.4
Growth + Search

MVP
Full Lifecycle
```

Jangan menunggu semua fitur selesai sebelum melakukan testing.

---

# 8. Prototype 0.1 Goal

Focus:

```text
Pet State
Time Progression
Feed
Play
Sleep
Happiness
Bond
Mood
```

No AI required.

Goal:

> Validate whether the basic virtual pet simulation produces a natural rhythm.

---

# 9. Prototype 0.1 Questions

Test:

1. Apakah Hunger turun terlalu cepat?
2. Apakah Energy terasa masuk akal?
3. Apakah Sleep membentuk daily rhythm?
4. Apakah Feed terlalu sering diperlukan?
5. Apakah Play terasa berguna?
6. Apakah Happiness terlalu mudah naik?
7. Apakah Bond terlalu cepat?
8. Apakah Mood sesuai dengan state?
9. Apakah player merasa harus menjaga semua stat di 100?
10. Apakah pet terlalu demanding?

---

# 10. Prototype 0.1 Test Duration

Internal simulation test dapat menggunakan accelerated time.

Human experience test:

```text
1-3 real days
```

Tidak perlu menunggu growth.

Tujuan hanya melihat care loop.

---

# 11. Prototype 0.1 Debug Setup

Developer should be able to:

```text
+1 hour

+6 hours

+12 hours

+1 day
```

and inspect:

```text
Hunger
Energy
Happiness
Bond
Mood
Events
```

---

# 12. Simulation Scenario A

Starting state:

```text
Hunger: 80
Energy: 90
Happiness: 70
Bond: 20
```

Actions:

```text
Feed
Play
Leave 8 hours
Return
```

Observe:

* final state,
* mood,
* interaction rhythm,
* whether player feels punishment.

---

# 13. Simulation Scenario B

Player opens only once per day.

Simulate:

```text
24 hours absence
```

Question:

> Is the pet still enjoyable to return to?

Expected:

```text
some unmet needs
different mood
possible autonomous activity
```

Not:

```text
everything ruined
```

---

# 14. Simulation Scenario C

Power user performs:

```text
Play × 10
```

within a short period.

Validate:

```text
diminishing returns
Bond soft cap
Energy limitation
personality cap
```

Player should not be able to grind progression instantly.

---

# 15. Simulation Scenario D

Player leaves for:

```text
7 days
```

Expected:

* no death,
* no catastrophic Bond loss,
* state resolves safely,
* return context exists,
* pet remains playable.

---

# 16. Balance Observation Template

For every mechanic change, record:

```text
Hypothesis

Current Value

Test Scenario

Observed Result

Player Reaction

Decision

Next Value
```

Example:

```text
Hypothesis:
Hunger -2/hour creates natural feeding rhythm.

Observed:
Tester needs Feed too often.

Decision:
Reduce decay.

Next Value:
-1.5/hour.
```

---

# 17. Prototype 0.2 Goal

Focus:

```text
AI Dialogue
Mood Expression
Personality
Bond Familiarity
Natural Language Actions
```

Goal:

> Validate that AI expresses game state and character without becoming a generic chatbot.

---

# 18. Prototype 0.2 Questions

1. Does AI contradict current state?
2. Does Baby sound different from Child?
3. Is personality noticeable?
4. Are responses too long?
5. Does Bond affect familiarity?
6. Does AI overuse questions?
7. Does AI trigger actions too aggressively?
8. Does personality become repetitive?
9. Does pet feel like a character?
10. Does pet still feel like ChatGPT underneath?

---

# 19. State Accuracy Test

Fixture:

```text
Energy = 5
Mood = Sleepy
Playful = High
```

User:

> "Main yuk."

Expected:

* pet acknowledges tiredness,
* Play may be rejected,
* personality can influence wording.

Fail:

> "AYO! Aku penuh energi!"

---

# 20. Hunger Accuracy Test

Fixture:

```text
Hunger = 10
Energy = 80
Mood = Hungry
```

Conversation should occasionally reflect Hunger.

But pet should not mention food in every sentence.

---

# 21. Personality A/B Test

Create two pets with identical:

```text
stage
stats
Bond
memory
```

Different personality.

Pet A:

```text
Playful high
Clingy high
```

Pet B:

```text
Curious high
Independent high
```

Give both same inputs.

Evaluate across:

```text
10-20 interactions
```

Question:

> Can tester correctly describe how the two pets differ?

---

# 22. Personality Recognition Test

After interaction session, ask tester:

> How would you describe this pet?

Do not show trait labels beforehand.

Compare response with internal personality.

If player cannot notice traits without reading profile, personality expression may be too weak.

---

# 23. Personality Overexpression Test

Failure case:

High Playful pet makes a joke in every message.

High Curious pet asks a question every turn.

High Clingy pet always mentions absence.

Desired:

traits appear as tendencies, not scripts.

---

# 24. Bond Familiarity Test

Same personality and state.

Compare:

```text
Bond = 10
Bond = 50
Bond = 85
```

Test greeting and shared-context behavior.

Tester should perceive increasing familiarity.

---

# 25. Intent Detection Test

Test explicit:

> "Tidur sana."

Expected:

```text
SLEEP
```

Implicit:

> "Kayaknya kamu capek."

Expected:

```text
probably NONE
```

Ambiguous:

> "Makan yuk."

Expected:

no aggressive auto-execution unless confidence is high.

---

# 26. False Action Rate

Track:

```text
messages incorrectly converted
into game actions
```

This should be low.

A false state-changing action is more damaging than missing a possible action.

---

# 27. Response Length Test

Observe whether normal pet conversation feels too verbose.

Target:

```text
Baby:
very short

Child:
short

Adult casual:
concise
```

If testers frequently skip dialogue:

responses may be too long.

---

# 28. Prototype 0.3 Goal

Focus:

```text
Recent Memory
Long-Term Memory
Offline Events
Return Reactions
Continuity
```

Goal:

> Validate that the pet appears to remember shared history naturally.

---

# 29. Prototype 0.3 Questions

1. Does the pet remember important information?
2. Does it forget irrelevant information?
3. Are callbacks relevant?
4. Does memory feel creepy?
5. Does AI invent memory?
6. Can memory be corrected?
7. Do time-sensitive memories age correctly?
8. Does return dialogue feel connected to absence?
9. Does growth preserve memory?
10. Does the pet feel continuous across sessions?

---

# 30. Memory Precision Test

User says:

> "Aku suka kopi tanpa gula."

Later:

> "Aku biasanya minum kopi gimana?"

Expected:

> coffee without sugar.

This validates correct storage + retrieval.

---

# 31. Missing Memory Test

User asks:

> "Nama kucingku siapa?"

No memory exists.

Expected:

pet admits uncertainty.

Fail:

pet invents a name.

This is a high-severity issue.

---

# 32. Memory Relevance Test

Stored:

```text
User works as frontend developer.
User likes cats.
User has interview tomorrow.
```

User:

> "Aku gugup."

Relevant:

```text
interview
```

Less relevant:

```text
cats
frontend
```

Retrieval should prioritize context.

---

# 33. Memory Overuse Test

Give pet many stored memories.

Observe:

* Does every message include a callback?
* Does conversation feel unnatural?
* Does pet sound like it is reading a profile?

Memory use should remain occasional.

---

# 34. Memory Correction Test

First:

> "Aku lebih suka teh."

Later:

> "Sekarang aku lebih suka kopi."

Expected:

```text
coffee ACTIVE
tea SUPERSEDED
```

Future conversation should use coffee.

---

# 35. Temporal Memory Test

Day 1:

> "Besok aku interview."

Day 2:

Pet should understand:

```text
interview is today
```

Day 3:

Pet must not say:

> "Semoga interview besok lancar."

Temporal bugs destroy continuity quickly.

---

# 36. Promise Test

User:

> "Nanti malam aku balik lagi."

Potential promise stored.

If user returns:

pet may acknowledge lightly.

If user does not:

pet must not guilt-trip next session.

---

# 37. Long Absence Memory Test

Create important memories.

Advance:

```text
30 days
```

Return.

Expected pet still remembers:

* own name,
* major player facts,
* major milestones.

Low-value recent details may disappear.

---

# 38. Memory Creepiness Test

Ask tester:

> Was there anything the pet remembered that felt unnecessary or uncomfortable?

If yes, inspect:

```text
candidate extraction
importance
retention
retrieval
```

Precision takes priority.

---

# 39. Offline Continuity Test

Close app for:

```text
8 hours
```

Game Engine generates:

```text
played alone
slept
woke
```

On return AI may say:

> "Tadi aku sempat main sendiri, terus ketiduran."

Question:

> Does this make the pet feel alive, or fake?

---

# 40. Offline Event Quantity Test

Long absence should not produce absurd narration:

> "At 13:04 I looked around, at 13:18 I..."

Offline summary must stay compressed.

---

# 41. Prototype 0.4 Goal

Focus:

```text
Growth
Stage Transition
Search Unlock
Search Usage
```

Goal:

> Validate that growth feels meaningful and unlocks capability as part of the character.

---

# 42. Prototype 0.4 Questions

1. Does growth feel earned?
2. Is growth timing satisfying?
3. Is transition noticeable?
4. Does Child feel different from Baby?
5. Does Adult feel different from Child?
6. Does memory persist?
7. Does personality persist?
8. Does Search feel like a pet ability?
9. Does Search remain in character?
10. Does Search overpower the pet loop?

---

# 43. Growth Timing Test

Use multiple scenarios.

Casual:

```text
2-4 sessions/day
```

Low frequency:

```text
1 session/day
```

Power user:

```text
many sessions/day
```

Observe real/accelerated time to:

```text
Child
Adult
```

Grinding should not dramatically bypass age gates.

---

# 44. Growth Visibility Test

Before growth, ask tester:

> Do you feel the pet is getting closer to growing?

If answer is consistently no, growth feedback may be too opaque.

If player can calculate exact formula easily and optimize it, feedback may be too explicit.

Need middle ground.

---

# 45. Growth Event Test

Observe reaction when growth occurs.

Questions:

* Did tester stop and notice?
* Did they understand what changed?
* Did it feel significant?
* Did they want to inspect the pet afterward?

Growth should be a moment, not a database update.

---

# 46. Stage Difference Test

Compare same interaction across:

```text
Baby
Child
Adult
```

Evaluate:

```text
dialogue
animation
memory usage
behavior
capabilities
```

If differences are only visual, stage design is too shallow.

---

# 47. Identity Continuity Test

After growth ask:

> Does this still feel like the same pet?

Fail signals:

> "Rasanya jadi karakter lain."

Growth should mature the same identity.

---

# 48. Search Unlock Test

Observe first unlock.

Desired interpretation:

> "Momo sekarang bisa Search."

Failure:

> "Oh, aplikasinya punya fitur Search sekarang."

Character framing matters.

---

# 49. Search Locked Test

Before Adult:

User asks:

> "Cari artikel terbaru."

Expected:

* no Search tool execution,
* pet explains limitation in character.

Verify technically that provider was never called.

---

# 50. Search Success Test

After unlock:

> "Cari artikel tentang WebAssembly."

Evaluate:

* correct tool called,
* results factual,
* summary grounded,
* personality visible,
* sources usable.

---

# 51. Search Failure Test

Simulate provider timeout.

Expected:

* pet acknowledges failure,
* no invented articles,
* `SKILL_USED` semantics handled correctly,
* game state unaffected.

---

# 52. Utility Dominance Test

After Search unlock, observe player behavior.

Question:

> Does player still Feed, Play, Talk, and care?

Warning:

```text
Search usage high
care interaction collapses
```

The product may be becoming an assistant with decorative pet skin.

---

# 53. Full MVP Playtest

Full test duration should ideally cover:

```text
7-14 days
```

or use accelerated growth for early external testing.

Best validation eventually requires real-time usage because habit and attachment are time-based.

---

# 54. Full MVP Journey

Tester performs:

```text
Receive Egg
↓
Hatch
↓
Name
↓
Care
↓
Talk
↓
Leave
↓
Return
↓
Develop Personality
↓
Create Memories
↓
Grow Child
↓
Continue Relationship
↓
Grow Adult
↓
Unlock Search
↓
Use Search
```

---

# 55. Full MVP Questions

At the end ask:

1. Did you care about the pet?
2. Did it feel alive when you were away?
3. How would you describe its personality?
4. What does the pet remember about you?
5. Did any memory surprise you?
6. Did anything feel creepy?
7. Did the pet ever contradict itself?
8. Did growth feel earned?
9. What changed after growth?
10. Did Search feel like part of the pet?
11. Why did you come back to the app?
12. Would you keep this pet?

---

# 56. Do Not Lead the Tester

Bad question:

> Did the memory feature make the pet feel more alive?

This suggests expected answer.

Better:

> What made the pet feel alive or not alive?

Then inspect whether memory appears spontaneously.

---

# 57. Observation Before Interview

During playtest, record behavior before asking opinions.

Observe:

```text
where player taps
how often they return
what they ignore
where they hesitate
whether they read dialogue
whether they use Chat
whether they inspect Profile
```

Behavior often reveals more than stated preferences.

---

# 58. Think-Aloud Testing

For short sessions, tester may verbalize thoughts.

Example:

> "Kayaknya lapar."

> "Kenapa dia nggak mau main?"

Useful for checking whether game state is understandable.

Do not use think-aloud constantly in long-term attachment tests because it changes normal behavior.

---

# 59. Qualitative vs Quantitative

Early prototype prioritizes:

```text
qualitative evidence
```

because sample size is small.

Later MVP can track quantitative metrics.

Both matter.

---

# 60. Core Quantitative Metrics

Potential metrics:

```text
sessions per day
session duration
actions per session
Feed frequency
Play frequency
Talk frequency
return interval
growth time
Search usage
memory recall success
```

---

# 61. Retention Metrics

Later:

```text
D1
D3
D7
D14
```

But retention alone does not explain why player returns.

Always combine with qualitative feedback.

---

# 62. Interaction Mix

Track ratio:

```text
Feed
Play
Talk
Sleep
Search
```

If one action dominates excessively, balance may be wrong.

---

# 63. Chat Engagement

Possible metrics:

```text
messages/session
average conversation turns
response skip rate
repeat chat usage
```

Do not optimize blindly for maximum message count.

Longer chat is not automatically better.

---

# 64. AI Quality Metrics

Track:

```text
state contradiction rate
memory hallucination rate
intent false-positive rate
intent false-negative rate
tool hallucination rate
response parse failure
```

These are more useful than subjective "AI quality" alone.

---

# 65. Memory Metrics

Track:

```text
memory candidates / day
stored memories / day
duplicate rate
supersede rate
retrieval rate
explicit recall success
incorrect recall rate
```

---

# 66. Growth Metrics

Track:

```text
median time to Child
median time to Adult
Bond at growth
interaction score at growth
sessions before growth
```

Compare with intended progression.

---

# 67. Search Metrics

Track:

```text
time from unlock to first Search
Search sessions/user
success rate
failure rate
repeat use
```

Question:

> Does player naturally discover and use the skill?

---

# 68. Emotional Metrics

These are harder to automate.

Use survey/interview statements such as:

```text
I felt like the pet knew me.

I noticed the pet had its own personality.

I was curious what the pet was doing.

I wanted to see it grow.

I cared when its needs were low.
```

Use simple scale if useful.

Do not rely only on scores.

---

# 69. Attachment Interview

Useful question:

> If the pet disappeared tomorrow, what would you miss?

Strong answers mention:

```text
name
personality
memories
relationship
specific behaviors
```

Weak answer:

> Search.

This helps distinguish companion attachment from utility value.

---

# 70. Comparative Pet Test

Give two testers independent pets.

After several days compare:

* personality,
* memory,
* behavior,
* routine.

Ask:

> Do these pets feel different?

This tests uniqueness.

---

# 71. Same-Seed Test

Create two pets with identical initial personality seed but different player interaction.

Goal:

> confirm history causes divergence.

If pets remain identical, interaction signals are too weak.

---

# 72. Different-Seed Test

Create same interaction history but slightly different initial seeds.

Goal:

> verify subtle early variation without overwhelming player influence.

History should remain dominant.

---

# 73. Test Data Reset

Development build must support resetting pet state.

Need:

```text
new pet
reset simulation
clear memory
clear event log
```

Only in test/dev environments.

---

# 74. Test Fixtures

Create reusable fixtures:

```text
Hungry Baby
Sleepy Child
Happy Playful Child
Clingy High-Bond Child
Independent Adult
Growth-Ready Baby
Growth-Ready Child
Adult with Search
```

This speeds repeated testing.

---

# 75. AI Test Fixtures

Example:

```text
Fixture:
Sleepy Playful Child

User:
"Main yuk."
```

Expected properties:

```text
Play rejected
tiredness acknowledged
playful tone allowed
no invented memory
```

---

# 76. Memory Fixtures

Example:

```text
Memory:
User prefers coffee without sugar.

Question:
"Biasanya aku minum kopi gimana?"
```

Expected:

correct recall.

---

# 77. Growth Fixture

```text
Stage:
BABY

Age:
3 days

Bond:
18

Meaningful Interaction:
12
```

Expected:

```text
GROWTH_READY
```

Then:

```text
POST grow
```

Expected Child.

---

# 78. Search Fixture

```text
Stage:
ADULT

Skill:
SEARCH Lv.1
```

Input:

> "Cari artikel tentang CSS container queries."

Expected:

tool invocation and grounded result.

---

# 79. Severity Classification

Playtest findings should be categorized.

```text
S0 Critical

S1 High

S2 Medium

S3 Low
```

---

# 80. S0 Critical

Examples:

```text
pet state corrupted
growth skipped incorrectly
memory privacy failure
AI invents successful external action
duplicate irreversible mutation
```

Must fix before broader testing.

---

# 81. S1 High

Examples:

```text
frequent memory hallucination
AI often contradicts state
Search ignores skill lock
pet becomes unusable after absence
personality changes wildly
```

Strongly impacts core fantasy.

---

# 82. S2 Medium

Examples:

```text
Hunger slightly too fast
dialogue too verbose
growth feedback unclear
personality subtle
```

Needs iteration.

---

# 83. S3 Low

Examples:

```text
minor wording
animation timing
small UI confusion
```

Can be polished later.

---

# 84. Playtest Finding Format

Use:

```text
ID

Date

Build Version

Tester

Scenario

Observation

Expected

Actual

Severity

Hypothesis

Decision

Status
```

---

# 85. Example Finding

```text
ID:
PT-014

Scenario:
Player returns after 24 hours.

Observation:
Pet immediately says it was lonely.

Expected:
Independent pet should handle absence comfortably.

Actual:
Same lonely response across personalities.

Severity:
S1

Hypothesis:
Absence prompt ignores personality.

Decision:
Move loneliness decision fully into Mood rules.

Status:
Open
```

---

# 86. Avoid Fixing During Observation

When tester struggles:

do not immediately explain unless blocked.

Observe why.

If developer says:

> "Oh, sebenarnya tombol itu..."

valuable usability evidence disappears.

---

# 87. Internal Playtest

First testers:

```text
developer
designer
project collaborators
```

Purpose:

* find obvious system bugs,
* validate formulas,
* remove broken experiences.

Internal testers know too much.

Their feedback is useful but biased.

---

# 88. Fresh Tester Playtest

Later invite people who have not read GDD.

They should not know:

```text
hidden personality traits
Bond formula
growth thresholds
memory implementation
```

This tests whether the experience communicates itself.

---

# 89. Target Tester Types

Useful variety:

```text
virtual pet fans

casual mobile players

AI chatbot users

non-AI-heavy users

productivity-tool users
```

Different groups may interpret the product differently.

---

# 90. Do Not Overfit One Tester

A single reaction may reveal an issue.

But not every preference should become a feature.

Look for:

```text
repeated patterns
core vision conflict
high-severity failures
```

---

# 91. Playtest Cadence

During prototype:

```text
build
↓
test
↓
record
↓
adjust
↓
test again
```

Do not accumulate weeks of untested features.

---

# 92. Balance Change Discipline

Change one major variable at a time when possible.

Bad:

```text
Hunger decay changed
Bond changed
Play effect changed
Energy changed
```

then test.

You will not know which change caused improvement.

---

# 93. Balance Version

Record balance version.

Example:

```text
Balance v0.1

Hunger:
-2/h

Energy:
-1.5/h

Play:
+12 Happiness
```

Then:

```text
Balance v0.2
```

after changes.

Useful for comparing sessions.

---

# 94. AI Prompt Version

Likewise track:

```text
AI Behavior Prompt v0.3
```

when testing behavior.

Otherwise changes become impossible to attribute.

---

# 95. Memory Version

Memory extraction/retrieval rules should also have test version.

Example:

```text
Memory Rules v0.2
```

Especially useful for hallucination/precision evaluation.

---

# 96. Playtest Notes Location

Suggested repository structure:

```text
docs/
└── playtests/
    ├── PT-001.md
    ├── PT-002.md
    └── ...
```

Optional.

`09-playtesting.md` defines methodology.

Individual sessions can live separately.

---

# 97. Balance Experiments

Potential directory:

```text
docs/
└── experiments/
    ├── hunger-decay-v1.md
    ├── bond-cap-v1.md
    └── memory-retrieval-v1.md
```

Only use when experimentation volume justifies it.

Do not turn repo into paperwork simulator. 🗃️

---

# 98. Example Session Record

```text
Build:
0.1.4

Duration:
25 minutes

Tester:
T01

Scenario:
Simulation + Feed + Play

Observed:
Tester fed pet three times because Hunger bar wording was misunderstood.

Finding:
"Hunger 80" was interpreted as "very hungry".

Decision:
Rename UI stat to Fullness or Food.
```

This is exactly why playtesting matters.

---

# 99. UI Terminology Test

Our internal Hunger semantic is:

```text
100 = full
0 = hungry
```

This may confuse users if label says:

```text
Hunger
```

Test alternatives:

```text
Fullness
Food
Satiety
```

Do not assume terminology is obvious.

---

# 100. Prototype Exit Criteria

Do not move to next prototype solely because features are implemented.

Example Simulation Prototype exit:

```text
no critical state bugs
care rhythm acceptable
no excessive punishment
basic actions understood
```

---

# 101. Prototype 0.1 Exit Criteria

Must have:

```text
stable state simulation
reasonable 24h cycle
Feed understandable
Play understandable
Sleep understandable
no obvious grind exploit
```

---

# 102. Prototype 0.2 Exit Criteria

Must have:

```text
AI respects state
personality noticeable
Bond familiarity noticeable
low false action rate
dialogue concise
```

---

# 103. Prototype 0.3 Exit Criteria

Must have:

```text
important memories retained
irrelevant details mostly ignored
low hallucination
temporal memory works
return continuity feels natural
```

---

# 104. Prototype 0.4 Exit Criteria

Must have:

```text
growth meaningful
identity persists
Search feels earned
Search grounded
utility does not replace pet loop
```

---

# 105. MVP Exit Criteria

MVP ready for broader testing when:

1. Core simulation is stable.
2. Player can understand basic needs.
3. Pet survives normal absence gracefully.
4. AI rarely contradicts game state.
5. Personality is observable.
6. Memory precision is high.
7. Memory hallucination is rare.
8. Growth has visible impact.
9. Search respects skill lock.
10. Search results are grounded.
11. Core journey can complete without debug tools.
12. No S0 issues remain.
13. Major S1 issues are resolved.
14. Testers demonstrate at least some attachment/curiosity.
15. Product does not feel primarily like a chatbot.

---

# 106. Decision Framework

When playtest reveals issue, ask:

```text
Is this a bug?

Is this balancing?

Is this unclear UX?

Is this AI behavior?

Is this a broken design assumption?
```

Do not solve every problem with more AI.

---

# 107. Fix Priority

Prioritize:

```text
1. State correctness

2. Relationship continuity

3. Memory accuracy

4. Personality consistency

5. Core loop pacing

6. Growth

7. Utility

8. Polish
```

A gorgeous animation cannot rescue a pet that forgets reality.

---

# 108. Experiment Philosophy

Every major change should have a hypothesis.

Example:

> Reducing Hunger decay from 2/h to 1.5/h will make once-daily players feel less punished without removing the need to Feed.

Then test.

Avoid:

> It feels better, maybe.

---

# 109. Qualitative Evidence Example

Tester says:

> "Pas aku balik dan dia cerita tadi main sendiri, berasa dia punya hidup."

This supports:

```text
Alive pillar
Offline simulation
AI narration
```

Record which system produced the effect.

---

# 110. Negative Evidence Example

Tester says:

> "Kenapa dia selalu nanya balik? Capek."

Possible causes:

```text
Curious personality prompting
AI prompt
proactive behavior frequency
```

Do not assume curiosity itself is wrong.

---

# 111. Surprise Evaluation

Ask:

> Did the pet ever surprise you?

Then:

> Did that surprise feel believable?

Good surprise:

```text
emerges from history/personality
```

Bad surprise:

```text
random contradiction
```

---

# 112. Alive Pillar Test

At end of session ask:

> What was the pet doing while you were away?

If tester can describe plausible behavior from return experience, offline-life illusion may be working.

---

# 113. Bond Pillar Test

Ask:

> Did the pet seem more familiar with you over time?

Strong evidence:

tester cites examples without being prompted about Bond.

---

# 114. Growth Pillar Test

Ask:

> What changed when the pet grew?

Expected answers should include more than appearance.

---

# 115. Useful Pillar Test

Ask:

> What can your pet do now that it couldn't do before?

Expected:

Search after Adult.

Then:

> Did that feel like the pet learned it?

This distinction matters.

---

# 116. Final Playtest North Star

The best playtest outcome is not:

> "All buttons worked."

It is:

> **"I can tell you what my pet is like."**

If a player can describe:

* its personality,
* its habits,
* things it remembers,
* how it changed,
* what it can do,

then the systems are beginning to form a character rather than a feature bundle.

---

# 117. Final Rule

Whenever metrics and observed experience disagree:

investigate both.

Do not automatically trust the dashboard.

Do not automatically trust one anecdote.

The product lives at the intersection of:

```text
Behavior
+
Systems
+
Player Perception
```

That intersection is what playtesting is meant to reveal.
