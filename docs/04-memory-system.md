# Memory System Design

## AI Virtual Pet

**Version:** 0.1
**Status:** Draft
**Phase:** Pre-production
**Depends On:** `00-vision.md`, `01-mini-gdd.md`, `02-game-systems.md`, `03-ai-behavior.md`

---

# 1. Purpose

Dokumen ini mendefinisikan bagaimana pet:

* mengingat informasi,
* menyimpan pengalaman,
* mengambil memory yang relevan,
* memperbarui memory,
* melupakan informasi yang sudah tidak berguna,
* dan menggunakan memory dalam conversation.

Memory System bukan chat history tanpa batas.

Tujuan utamanya adalah menciptakan:

```text
Continuity
+
Relationship
+
Personalization
+
Shared History
```

Pet tidak perlu mengingat semuanya.

Pet perlu mengingat hal-hal yang membuat hubungan terasa berlanjut.

---

# 2. Core Memory Principle

Prinsip utama:

> **Remember what matters, not everything that happened.**

Memory harus bersifat selektif.

Sistem sebaiknya menghindari:

```text
every message
every Feed
every Play
every tiny interaction
```

sebagai permanent memory.

Sebagian besar interaction cukup menjadi recent event atau event log.

---

# 3. Memory vs Event Log

Memory dan Event Log adalah dua hal berbeda.

## Event Log

Menyimpan fakta mekanis.

Contoh:

```text
PET_FED
PET_PLAYED
PLAYER_RETURNED
PET_GREW
```

Tujuan:

* debugging,
* analytics,
* progression,
* simulation history.

---

## Memory

Menyimpan hal yang berguna untuk future relationship atau conversation.

Contoh:

```text
User works as frontend developer.

User has an interview tomorrow.

User likes cats.

User named the pet Momo.
```

Event dapat menghasilkan memory.

Tetapi tidak semua event menjadi memory.

---

# 4. Memory Layers

MVP menggunakan tiga lapisan context.

```text
Conversation Window
↓
Recent Memory
↓
Long-Term Memory
```

Masing-masing memiliki fungsi berbeda.

---

# 5. Conversation Window

Conversation Window menyimpan pesan terbaru secara temporer.

Contoh:

```text
User: Aku lagi pusing sama bug.
Pet: Bug apa?
User: State-nya ke-reset terus.
```

Tujuan:

* menjaga coherence dalam percakapan aktif,
* memahami pronoun dan follow-up,
* menghindari mengambil memory permanen untuk konteks yang baru saja terjadi.

Suggested initial size:

```text
10-20 messages
```

Ini bukan long-term memory.

---

# 6. Recent Memory

Recent Memory menyimpan ringkasan kejadian terbaru yang mungkin masih relevan.

Contoh:

```text
User discussed a bug at work.

User returned after 8 hours.

Pet became Child yesterday.

User said they were tired this evening.
```

Recent Memory bersifat sementara.

Suggested initial capacity:

```text
20-50 entries
```

atau berdasarkan time window.

Contoh:

```text
last 7 days
```

Exact limit perlu playtesting.

---

# 7. Long-Term Memory

Long-Term Memory menyimpan informasi yang bernilai untuk future relationship.

Contoh:

```text
User works as frontend developer.

User enjoys pop-punk music.

User prefers coffee.

User named pet Momo.

User often works late.

User once helped Momo during its first growth event.
```

Long-Term Memory tidak harus memiliki expiration cepat.

Namun tetap dapat di-update atau dilupakan.

---

# 8. Memory Categories

Initial categories:

```text
USER_FACT
PREFERENCE
IMPORTANT_EVENT
PROMISE
RELATIONSHIP_EVENT
PET_EXPERIENCE
ROUTINE
```

Kategori dibuat terbatas agar sistem konsisten.

---

# 9. USER_FACT

Fakta relatif stabil mengenai user.

Contoh:

```text
User works as a frontend developer.
```

```text
User lives with a cat.
```

Hanya simpan jika confidence cukup tinggi.

Hindari inference berlebihan.

---

# 10. PREFERENCE

Hal yang disukai atau tidak disukai user.

Contoh:

```text
User likes cats.
```

```text
User prefers dark mode.
```

Preference dapat berubah.

Memory category ini harus mendukung update.

---

# 11. IMPORTANT_EVENT

Event dengan relevance waktu atau emotional significance.

Contoh:

```text
User has an interview tomorrow at 09:00.
```

```text
User is launching a project next week.
```

Biasanya memiliki:

```text
eventAt
expiresAt
```

Setelah event lewat, memory dapat diubah menjadi historical memory.

---

# 12. PROMISE

Janji atau commitment yang relevan dengan relationship.

Contoh:

```text
User said they would play with Momo tonight.
```

Promise harus digunakan dengan hati-hati.

Jangan menjadikannya mekanisme guilt.

---

# 13. RELATIONSHIP_EVENT

Milestone antara pet dan player.

Contoh:

```text
User named the pet Momo.
```

```text
User was present when Momo became Adult.
```

```text
Momo learned Search for the first time.
```

Relationship Event biasanya memiliki importance tinggi.

---

# 14. PET_EXPERIENCE

Hal penting yang dialami pet.

Contoh:

```text
Momo first learned to play alone during a long absence.
```

```text
Momo became Adult on day 14.
```

Ini membantu pet memiliki autobiographical continuity.

---

# 15. ROUTINE

Pola yang muncul berulang kali.

Contoh:

```text
User usually checks Momo in the morning.
```

```text
User often talks before putting Momo to sleep.
```

Routine tidak diambil dari satu event.

Routine harus berasal dari repeated evidence.

---

# 16. Memory Structure

Conceptual memory object:

```json
{
  "id": "memory_123",
  "type": "USER_FACT",
  "content": "User works as a frontend developer",
  "importance": 0.8,
  "confidence": 0.95,
  "createdAt": "...",
  "updatedAt": "...",
  "lastUsedAt": "...",
  "sourceEventIds": [],
  "status": "ACTIVE"
}
```

Additional optional fields:

```text
expiresAt
eventAt
reinforcementCount
tags
embedding
```

Implementation detail akan ditentukan kemudian.

---

# 17. Memory Importance

Importance membantu menentukan:

* retention,
* retrieval priority,
* compression priority.

Suggested range:

```text
0.0 - 1.0
```

Example:

```text
0.2
minor preference

0.5
useful personal fact

0.8
important event

1.0
major relationship milestone
```

---

# 18. Importance Is Not Confidence

Importance dan confidence berbeda.

Example:

```text
"User may like jazz."
```

Could be:

```text
importance = 0.6
confidence = 0.4
```

Informasi mungkin penting jika benar, tetapi belum pasti.

---

# 19. Memory Confidence

Confidence:

```text
0.0 - 1.0
```

Merepresentasikan seberapa yakin sistem bahwa memory benar.

Initial candidate rule:

```text
confidence < 0.6
→ do not store as factual long-term memory
```

Nilai final bisa berubah.

---

# 20. Memory Creation Pipeline

Flow:

```text
Conversation / Event
↓
Memory Candidate Extraction
↓
Candidate Validation
↓
Deduplication
↓
Importance Calculation
↓
Confidence Check
↓
Store / Update / Ignore
```

AI hanya melakukan candidate extraction.

Memory System memutuskan hasil akhir.

---

# 21. Memory Candidate Sources

Memory candidate dapat berasal dari:

```text
Conversation
Game Event
Growth Event
Skill Event
Repeated Behavior
```

Contoh Game Event:

```text
PET_NAMED
```

dapat otomatis menghasilkan:

```text
RELATIONSHIP_EVENT
```

tanpa LLM.

---

# 22. Deterministic Memory

Beberapa memory sebaiknya dibuat secara deterministic.

Examples:

```text
pet name
hatch date
growth milestones
skill unlock
```

Tidak perlu AI extraction.

---

# 23. AI-Extracted Memory

AI extraction cocok untuk:

```text
user facts
preferences
important events
promises
```

Example:

User:

> "Besok aku interview jam sembilan."

Candidate:

```json
{
  "type": "IMPORTANT_EVENT",
  "content": "User has an interview tomorrow at 09:00",
  "confidence": 0.97,
  "importance": 0.85
}
```

---

# 24. Candidate Validation

Before storing, validate:

```text
known category?
content non-empty?
confidence valid?
duplicate?
contradiction?
temporary?
sensitive?
```

Invalid candidates are discarded.

---

# 25. Deduplication

Example existing memory:

```text
User likes cats.
```

New candidate:

```text
User really likes cats.
```

Should not create two separate permanent memories.

Possible action:

```text
reinforce existing memory
```

---

# 26. Reinforcement

Repeated evidence can strengthen memory.

Example:

```text
User mentions liking cats repeatedly.
```

Possible effect:

```text
confidence +
reinforcementCount +
```

Do not increase importance endlessly.

---

# 27. Memory Update

Existing:

```text
User prefers tea.
```

Later:

> "Sekarang aku lebih sering minum kopi."

Potential update:

```text
User currently prefers coffee.
```

Old information may become:

```text
SUPERSEDED
```

rather than deleted immediately.

---

# 28. Contradiction Handling

When new information contradicts old memory:

```text
old:
User works at Company A.

new:
User moved to Company B.
```

Do not retain both as simultaneously current.

Possible states:

```text
ACTIVE
SUPERSEDED
ARCHIVED
```

Old memory can remain historical but should not be retrieved as current fact.

---

# 29. Temporal Facts

Memory should support time-sensitive information.

Example:

```text
User has an interview tomorrow.
```

Fields:

```text
eventAt
expiresAt
```

After the interview:

Memory should no longer be retrieved as future event.

It can become:

```text
User had an interview on Friday.
```

if it remains relevant.

---

# 30. Relative Dates

Relative time must be normalized when possible.

User:

> "Besok aku interview."

Store:

```text
User has an interview on 2026-09-26.
```

Not permanently:

```text
tomorrow
```

This prevents temporal drift.

---

# 31. Promise Lifecycle

Example:

```text
User said they would play tonight.
```

Status:

```text
OPEN
FULFILLED
EXPIRED
```

If player plays later:

```text
FULFILLED
```

If not:

```text
EXPIRED
```

Pet should not punish the player for expired promise.

---

# 32. Promise Retrieval

Promise can trigger light continuity.

Example:

> "Katanya tadi mau main lagi."

Allowed if:

* promise is still relevant,
* personality supports it,
* not repeated aggressively.

Avoid guilt-heavy language.

---

# 33. Routine Detection

Routine memory should be derived from repeated events.

Example:

User opens app around 08:00 on:

```text
5 of last 7 days
```

System may infer:

```text
User often checks pet in the morning.
```

Routine requires threshold.

Never infer from one occurrence.

---

# 34. Routine Confidence

Routine confidence may depend on:

```text
frequency
consistency
recency
```

Example conceptual formula:

```text
confidence =
frequency × consistency × recency
```

Exact formula belongs to later implementation/balancing.

---

# 35. Memory Retrieval

Before AI response:

```text
User Message
+
Current State
+
Recent Context
↓
Memory Retrieval
↓
Relevant Memories
↓
Context Builder
```

Only a small number of memories should be injected.

---

# 36. Retrieval Goal

Retrieve memories that improve:

```text
relevance
continuity
personalization
relationship
```

Not:

```text
everything vaguely connected
```

---

# 37. Retrieval Inputs

Potential signals:

```text
semantic similarity
memory importance
recency
relationship relevance
current event relevance
memory type
```

---

# 38. Retrieval Score

Conceptual:

```text
retrievalScore =
semantic relevance
+
importance weight
+
recency weight
+
relationship relevance
```

Exact formula is implementation detail.

---

# 39. Retrieval Limit

Initial suggestion:

```text
3-5 long-term memories per AI turn
```

plus recent events.

More is not always better.

Too much context increases:

* cost,
* noise,
* weird callbacks.

---

# 40. High-Priority Memory

Some memories may override retrieval ranking.

Examples:

```text
important event happening today
recent promise
major relationship milestone
```

But even high-priority memory should be contextually relevant.

---

# 41. Memory Usage Frequency

AI should not mention stored memory every turn.

Memory should feel natural.

A rough principle:

```text
Most messages:
no explicit memory reference

Some messages:
subtle personalization

Occasionally:
direct callback
```

This prevents the pet from sounding like it is constantly reading a dossier.

---

# 42. Explicit Recall Request

User:

> "Kamu ingat aku kerja sebagai apa?"

Retrieval should prioritize relevant user facts.

If memory exists:

> "Frontend developer, kan?"

If absent:

> "Aku nggak yakin aku masih ingat."

Do not invent.

---

# 43. Recent Memory Promotion

Recent Memory can become Long-Term Memory.

Example:

```text
Recent:
User mentioned their new job.
```

If:

* repeated,
* important,
* or explicitly meaningful,

promote to Long-Term Memory.

---

# 44. Long-Term Memory Demotion

Long-Term memory may become inactive when:

* outdated,
* superseded,
* low relevance,
* never reinforced,
* no longer useful.

Possible state:

```text
ARCHIVED
```

---

# 45. Forgetting Philosophy

Forgetting is healthy.

Without forgetting:

```text
memory grows forever
retrieval becomes noisy
context becomes expensive
pet feels creepy
```

Goal:

> preserve identity while allowing details to fade.

---

# 46. Memory Decay

Not all memory should decay equally.

High importance:

```text
slow or no decay
```

Low importance:

```text
faster decay
```

Possible conceptual formula:

```text
retentionScore =
importance
× confidence
× recency factor
× reinforcement factor
```

---

# 47. Permanent / Near-Permanent Memories

Examples:

```text
pet name
hatch event
major growth milestones
major relationship events
```

These generally should not decay.

---

# 48. Decay Candidates

Examples:

```text
minor temporary preference
one-off casual event
old low-importance topic
temporary frustration
```

These may disappear naturally.

---

# 49. Memory Consolidation

Many small memories can be summarized into one stronger memory.

Example:

```text
User talked about React bugs.
User talked about CSS issues.
User discussed frontend work.
```

Can consolidate to:

```text
User often talks about frontend development work.
```

This reduces memory clutter.

---

# 50. Consolidation Timing

Do not consolidate every turn.

Possible triggers:

```text
memory count threshold
periodic maintenance
repeated related memories
```

Could run:

```text
once per day
or
when needed
```

Exact implementation later.

---

# 51. Memory Compression

Old recent memories may be summarized.

Example:

Before:

```text
User discussed work Monday.
User discussed work Tuesday.
User mentioned deadline Wednesday.
```

After:

```text
User had a busy work week involving a deadline.
```

Compression should preserve useful meaning.

---

# 52. Memory and Personality

Memory should not directly define personality.

Example:

```text
User left pet alone for 3 days.
```

This is an event.

Game System may produce:

```text
Independent signal +
```

Memory may retain:

```text
Pet spent several days playing independently.
```

Personality remains managed by Game Engine.

---

# 53. Memory and Bond

Memory does not directly increase Bond.

Bond changes through game rules.

However memory enables better expression of Bond.

Example:

High Bond + relevant memory:

> "Gimana interview kamu tadi?"

The memory does not create relationship by itself.

It reveals continuity.

---

# 54. Memory and Mood

Current mood may affect whether memory is expressed.

Example:

Pet is extremely sleepy.

Even if a relevant memory exists, response might be brief.

State has priority.

---

# 55. Memory and Growth Stage

Memory usage complexity may depend on stage.

Baby:

```text
very limited explicit recall
```

Child:

```text
simple callbacks
```

Adult:

```text
richer contextual recall
```

Memory storage can still occur before pet knows how to articulate it.

---

# 56. Baby Memory

Baby may remember basic relationship events:

```text
name
frequent player presence
simple preferences
```

But dialogue should stay age-appropriate.

Example:

Instead of:

> "You mentioned your professional deadline yesterday."

Baby might say:

> "Kerja lagi?"

---

# 57. Child Memory

Child may directly recall:

```text
recent promises
user preferences
recent important events
```

Example:

> "Bukannya hari ini ada interview?"

---

# 58. Adult Memory

Adult can combine:

```text
memory
current context
tool results
```

Example:

> "Kemarin kamu bilang lagi belajar WebAssembly. Aku nemu artikel baru soal itu."

Only if both:

* memory exists,
* Search result supports current factual claim.

---

# 59. Pet Autobiographical Memory

Pet should remember major things about itself.

Examples:

```text
when it hatched
its name
growth stages
skills learned
major shared experiences
```

This creates self-continuity.

---

# 60. Shared Memory

Some memories belong to the relationship, not only user or pet.

Example:

```text
User was present when Momo became Adult.
```

This should feel different from:

```text
Momo became Adult.
```

Shared events can become strong relationship memories.

---

# 61. Memory Source Tracking

Each memory should ideally track source.

Example:

```text
sourceEventIds
sourceConversationId
```

Benefits:

* debugging,
* confidence auditing,
* updating,
* deletion later.

---

# 62. Memory Provenance

Pet should not need to expose provenance to player.

Internally it helps answer:

> Why does this memory exist?

This becomes important when debugging hallucination-like behavior.

---

# 63. Memory Candidate Example

User:

> "Aku dari dulu lebih suka Vue daripada React."

AI candidate:

```json
{
  "type": "PREFERENCE",
  "content": "User prefers Vue over React",
  "importance": 0.6,
  "confidence": 0.96
}
```

Memory System checks existing preferences.

If none:

```text
STORE
```

---

# 64. Ambiguous Candidate Example

User:

> "Vue lumayan enak."

Possible candidate confidence:

```text
0.45
```

Likely result:

```text
IGNORE
```

Do not overfit casual statements.

---

# 65. Temporary Emotional State

User:

> "Aku benci kerjaan ini hari ini."

Do not automatically store:

```text
User hates their job.
```

Could store recent context:

```text
User was frustrated with work today.
```

as Recent Memory only.

---

# 66. Memory Promotion Criteria

Possible promotion from Recent to Long-Term if:

```text
importance high
OR
repeated multiple times
OR
explicit stable fact
OR
relationship milestone
```

---

# 67. Explicit User Memory Requests

If user says to pet:

> "Ingat ya, aku suka kopi tanpa gula."

This should strongly increase:

```text
confidence
importance
```

Potential result:

```text
PREFERENCE
User likes coffee without sugar.
```

---

# 68. Explicit Forget Request

If the in-game player asks:

> "Lupakan soal interview tadi."

Product behavior should allow memory removal or suppression.

Exact UX and privacy design will be defined later.

Memory System should support:

```text
FORGOTTEN
```

or deletion.

---

# 69. Memory Status

Suggested statuses:

```text
ACTIVE
SUPERSEDED
ARCHIVED
FORGOTTEN
```

Possible future:

```text
PENDING
```

---

# 70. Forgotten Memory

A forgotten memory must not be retrieved.

If deletion semantics require complete deletion later, storage implementation must support it.

This is an important architectural requirement.

---

# 71. Privacy Principle

Memory must be understandable and controllable.

Players should eventually be able to inspect important memories.

Potential Memory screen:

```text
Momo remembers:

• You work as a frontend developer.
• You like cats.
• You prefer coffee without sugar.
```

This improves transparency.

---

# 72. Memory Screen

MVP may display selected Long-Term Memories.

Not necessarily every internal memory.

Possible sections:

```text
About You
Shared Moments
Things Coming Up
About Me
```

---

# 73. Memory Editing

Future UX may allow:

```text
correct
forget
```

Example:

Pet remembers:

```text
You prefer tea.
```

Player can correct:

```text
Actually, coffee.
```

Whether this is direct UI or conversation will be decided later.

---

# 74. Memory Visibility

Internal memory may include metadata.

Player-facing memory should avoid:

```text
confidence 0.87
embedding score 0.72
```

Instead show human-readable content.

---

# 75. Sensitive Memory

Not every personal detail should become durable memory.

Memory System should use conservative storage for sensitive personal information.

For MVP, avoid proactively storing highly sensitive facts unless they are clearly necessary to the requested experience.

The principle is:

> personalization should not become surveillance.

---

# 76. Data Minimization

Store only what helps the pet experience.

Do not store information merely because it can be extracted.

Question:

> Will remembering this improve future interaction?

If no:

```text
do not store
```

---

# 77. Memory Retention by Type

Initial conceptual policy:

```text
RELATIONSHIP_EVENT
very long

PET_EXPERIENCE
long

USER_FACT
long, until updated

PREFERENCE
medium-long

ROUTINE
medium, frequently revalidated

IMPORTANT_EVENT
time-bound

PROMISE
time-bound
```

---

# 78. Important Event Lifecycle

Example:

```text
User has an interview Friday at 09:00.
```

Before event:

```text
UPCOMING
```

After event:

```text
PAST
```

System may then decide:

```text
archive
summarize
or keep
```

---

# 79. Follow-Up Opportunity

After event passes, memory may create a natural prompt.

Example:

> "Interview-nya gimana?"

Only if:

* pet is awake,
* no stronger interaction context exists,
* event is recent,
* proactive prompt budget allows it.

---

# 80. Reminder vs Memory

Important distinction:

```text
Memory
=
pet can recall information later
```

```text
Reminder
=
system actively triggers at a specific future time
```

Memory does not guarantee notification.

---

# 81. No False Reminder Promise

Without Reminder skill:

Pet must not say:

> "Besok jam 9 aku pasti ingetin."

It may say:

> "Aku bakal ingat kalau kita ngobrol lagi."

Or:

> "Aku simpan dulu di ingatan."

---

# 82. Retrieval During Return Session

When player returns, retrieval can consider:

```text
recent absence
unresolved promise
upcoming event
recent milestone
```

Example:

Player returns Friday afternoon.

Memory:

```text
Interview Friday 09:00
```

Potential response:

> "Kamu balik! Interview tadi gimana?"

Natural continuity emerges.

---

# 83. Memory Injection Format

Context Builder should provide concise structured memory.

Example:

```text
Relevant Memories:

1. [IMPORTANT_EVENT]
User had an interview today at 09:00.

2. [USER_FACT]
User works as a frontend developer.
```

Avoid dumping raw chat logs.

---

# 84. Memory Context Priority

Suggested priority:

```text
1. Explicit recall request
2. Current/upcoming important event
3. Active promise
4. Highly relevant long-term fact
5. Relationship event
6. General preference
```

Still subject to conversational relevance.

---

# 85. Memory Count Budget

Initial target per conversation turn:

```text
Recent Events:
3-8

Long-Term Memories:
0-5
```

Do not inject maximum every time.

---

# 86. Semantic Search

Long-Term retrieval will likely need semantic search.

Potential architecture:

```text
memory text
↓
embedding
↓
vector search
↓
relevance ranking
```

Exact database/tooling belongs to technical architecture.

---

# 87. Hybrid Retrieval

Pure semantic similarity may miss important temporal memories.

Recommended future approach:

```text
Semantic Search
+
Metadata Filters
+
Importance
+
Recency
+
Temporal Priority
```

---

# 88. Example Hybrid Retrieval

User:

> "Aku gugup banget."

Semantic search may retrieve:

```text
interview
presentation
deadline
```

Metadata can prioritize:

```text
upcoming event today
```

Result:

```text
User has an interview today.
```

---

# 89. Memory Maintenance

Memory maintenance tasks may include:

```text
deduplicate
consolidate
expire
archive
reinforce
supersede
```

These do not need to run on every message.

---

# 90. Maintenance Schedule

Possible MVP strategy:

```text
light validation:
every candidate

cleanup:
on load when threshold exceeded

consolidation:
periodically
```

Avoid building complex background infrastructure too early.

---

# 91. Maximum Memory Count

MVP should have bounded long-term memory.

Initial experiment:

```text
100-300 active memories per pet
```

Likely much more than needed initially.

When limit approaches:

```text
consolidate
archive
decay
```

Do not simply reject new important memories.

---

# 92. Memory Ranking for Retention

Possible retention score:

```text
retentionScore =
importance × 0.4
+
confidence × 0.2
+
reinforcement × 0.2
+
recency × 0.2
```

This is conceptual only.

Must be validated later.

---

# 93. Memory Aging

A memory can become less likely to retrieve without being deleted.

Example:

```text
User mentioned a restaurant 6 months ago.
```

Still stored.

But retrieval weight becomes low unless directly relevant.

---

# 94. Relationship Memories Resist Aging

Major shared milestones should remain highly retrievable.

Examples:

```text
naming
hatching
growth
first learned skill
```

These create identity.

---

# 95. Memory Hallucination Prevention

High-severity rule:

> The AI must never present an unprovided memory as remembered fact.

If retrieval returns nothing:

AI should acknowledge uncertainty.

---

# 96. Memory Pollution Prevention

Bad extraction can poison future conversations.

Therefore storing memory should be more conservative than generating dialogue.

It is better to miss a minor memory than store a wrong fact permanently.

---

# 97. Candidate Threshold

Initial suggestion:

```text
confidence >= 0.75
```

for automatic long-term storage.

Exceptions:

```text
deterministic system memories
explicit "remember this" user request
```

can use different rules.

---

# 98. Memory Correction

If player corrects pet:

Pet:

> "Kamu suka teh, kan?"

User:

> "Nggak, kopi."

System should:

```text
mark tea preference superseded
store coffee preference
```

Correction should have high confidence.

---

# 99. Memory Feedback Loop

Pet should acknowledge correction naturally.

> "Oke, kopi. Aku salah ingat tadi."

This reinforces transparency.

---

# 100. Interaction with Event Log

Useful flow:

```text
Event
↓
Memory Rule
↓
Memory Candidate / Deterministic Memory
```

Example:

```text
PET_GREW
↓
RELATIONSHIP_EVENT
Momo became Child.
```

---

# 101. Relationship Timeline

Selected memories can form a player-facing timeline.

Example:

```text
Day 1
Momo hatched.

Day 1
You named it Momo.

Day 4
Momo became Child.

Day 14
Momo became Adult.

Day 14
Momo learned Search.
```

This is stronger than exposing raw Event Log.

---

# 102. Recent Event vs Memory Example

Player taps Feed.

Event:

```text
PET_FED
```

Recent context:

```text
User fed Momo.
```

Long-term memory:

```text
none
```

No reason to permanently remember breakfast number 427.

---

# 103. Meaningful Play Example

During a growth milestone, player plays with pet.

Potential memory:

```text
User played with Momo shortly before its first growth.
```

Only if design considers it emotionally meaningful.

Not every Play interaction.

---

# 104. Memory Quality Test

A stored memory should pass at least one question:

```text
Will this help future conversation?

Will this strengthen relationship continuity?

Will this explain future behavior?

Is this a meaningful shared milestone?

Is this an important future event?
```

If all answers are no:

```text
do not store
```

---

# 105. Memory Retrieval Test

A retrieved memory should answer:

> Why is this relevant right now?

If there is no clear answer, retrieval ranking is probably too broad.

---

# 106. Memory Evaluation Metrics

Prototype should evaluate:

```text
Precision
Recall
Relevance
Hallucination Rate
Duplicate Rate
Correction Accuracy
Retrieval Usefulness
Creepiness / Over-personalization
```

---

# 107. Precision Priority

For long-term memory, prioritize:

```text
precision > recall
```

Meaning:

better to remember fewer correct things than many questionable things.

---

# 108. Duplicate Rate

Target:

Pet should not end up with:

```text
User likes cats.
User really likes cats.
User likes feline animals.
```

as three active memories.

Deduplication is important early.

---

# 109. Retrieval Usefulness

During playtest ask:

* Was the recalled memory relevant?
* Did it make the pet feel more alive?
* Did it feel forced?
* Did the user remember sharing it?
* Did it create a useful follow-up?

---

# 110. Creepiness Check

Important playtest question:

> Did the pet remember something you wished it had forgotten?

If yes, review:

* importance rules,
* memory categories,
* visibility,
* deletion UX,
* retention policy.

---

# 111. Prototype 0.1 Memory Scope

Initial memory prototype should only support:

```text
USER_FACT
PREFERENCE
IMPORTANT_EVENT
RELATIONSHIP_EVENT
```

Do not implement everything at once.

---

# 112. Prototype 0.1 Features

Must support:

```text
candidate extraction
validation
storage
simple deduplication
retrieval
memory injection
manual inspection
```

---

# 113. Prototype 0.2

Add:

```text
temporal expiration
promise lifecycle
routine detection
superseding
```

---

# 114. Prototype 0.3

Add:

```text
consolidation
decay
hybrid semantic retrieval
player-facing memory screen
```

Only if needed.

---

# 115. Debug Memory View

During development, developers should be able to inspect:

```text
memory type
content
importance
confidence
status
createdAt
lastUsedAt
source
```

This is critical for debugging strange AI behavior.

---

# 116. Memory Replay Testing

Create fixtures such as:

```text
User:
"I like cats."

Later:
"What animals do I like?"
```

Expected:

```text
retrieve cat preference
```

---

# 117. Contradiction Fixture

Conversation 1:

```text
"I prefer tea."
```

Conversation 2:

```text
"Actually now I prefer coffee."
```

Expected:

```text
coffee ACTIVE
tea SUPERSEDED
```

---

# 118. Temporal Fixture

Day 1:

```text
"Tomorrow I have an interview."
```

Day 2:

Pet should understand:

```text
interview is today
```

Day 3:

It should not say:

```text
"Good luck tomorrow."
```

---

# 119. Missing Memory Fixture

User:

> "Kamu ingat nama kucingku?"

No memory exists.

Expected:

> pet admits it does not remember.

Fail:

> pet invents a cat name.

---

# 120. Long Absence Memory

A long absence should not erase major memories.

After 30 days away, pet should still remember:

```text
its name
major relationship facts
important user facts
growth history
```

This reinforces persistent relationship.

---

# 121. Cross-Stage Memory

Growth should not reset memory.

```text
Baby
↓
Child
↓
Adult
```

is the same character.

Memories persist unless explicitly forgotten or expired.

---

# 122. Memory Is Character Continuity

Pet identity can be represented conceptually as:

```text
Persistent State
+
Personality
+
Memory
+
History
```

Without memory, growth risks feeling like character replacement.

---

# 123. Technical Boundary

Memory System owns:

```text
storage decision
update
deduplication
retention
retrieval
forgetting
```

AI Behavior owns:

```text
candidate extraction
natural-language use
```

Game Engine owns:

```text
events
stats
personality
growth
```

---

# 124. MVP Memory Definition of Done

Memory System is MVP-ready when:

1. AI can propose memory candidates.
2. Invalid candidates are rejected.
3. Stable user facts can be stored.
4. Preferences can be stored.
5. Important future events can be stored with normalized time.
6. Major relationship events are created deterministically.
7. Duplicate memories are avoided.
8. Contradicting memories can supersede old memories.
9. Relevant memories can be retrieved.
10. Retrieval is limited to a small context set.
11. AI only claims to remember retrieved or recent information.
12. Missing memories result in uncertainty instead of fabrication.
13. Memories persist across sessions and growth stages.
14. Temporary memories can expire or archive.
15. Developers can inspect stored memories.
16. Player-facing memory deletion can be supported by the data model.

---

# 125. North Star

The Memory System should make the player think:

> "Dia masih ingat."

Not:

> "Kenapa dia menyimpan semua yang pernah aku bilang?"

The ideal memory is:

```text
Selective
Relevant
Accurate
Persistent
Correctable
Forgettable
```

Memory exists to create **shared history**, not to maximize data retention.
