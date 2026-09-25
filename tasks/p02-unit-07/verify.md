# Prototype 0.2 — Unit 07: Verification Record

## Status

Passed. Date: 2026-09-25.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | Pass |
| Tests | `pnpm test` | Pass — 594 tests (api 351, domain 93) |
| Build | `pnpm build` | Pass |
| End-to-end | real `dist/server.js` + **test** DB + local OpenAI-compatible stub, curl | "Main yuk!" → PLAY executed, reply "Yay! Lagi, lagi!", Bond 10 → 11; "Aku sayang kamu" → TALK, Bond 11.25; history has 4 messages; startup log `AI provider openai-compatible, model stub-model`. Test DB truncated afterwards. |

## Task 7.19 Coverage (`http/chat.test.ts`, in-memory and PostgreSQL)

| Required | Test |
| --- | --- |
| normal Talk | reply, TALK, no action; reality and current message reach the model |
| FEED / PLAY / SLEEP through chat | engine applied, action events carry `turnMessageId`, prompt states the real result |
| low-energy PLAY rejection | REJECTED TOO_TIRED, no PET_PLAYED, no Happiness or personality change, prompt "did NOT play" |
| ambiguous NONE | 0.6 PLAY → NONE, no action, no Bond, raw intent in metadata |
| malformed interpretation / timeout | reply still produced as NONE, fallback recorded, no action |
| response generation failure | after action: button words, `fallbackUsed`, action kept; after rejection: rejection words; plain Talk: 503 AI_UNAVAILABLE, only USER stored, no rewards |
| sleeping Talk rejection | 409 PET_SLEEPING, no AI call, nothing stored |
| one-action enforcement | two JSON objects → no action at all |
| personality update | AFFECTION → Clingy +0.003, one PERSONALITY_CHANGED |
| rejected action tone | PRAISE on rejected Play → Shy −0.002 |
| Bond Talk gain / cap | +0.25; 10 turns → exactly +2; next UTC day +0.25 again |
| CASUAL / NONE earn nothing | no Bond, personality, or events |
| chat PLAY earns Play Bond only | +1, no PET_TALKED |
| retry completed turn | same reply, no AI call, no new message or reward (Talk and Play) |
| resume failed turn | one USER + one ASSISTANT linked, +0.25 once, one PET_TALKED |
| reused id, different text | VALIDATION_ERROR |
| PetService path | chat Play after a button Play gets 0.75 Bond (shared diminishing) |
| concurrency | second chat while first held → CHAT_IN_PROGRESS; next accepted |
| turn budget | 12 s interpretation → response timeout 3 s |
| metadata | provider, model, summed latency and tokens stored; none in the response body |
| privacy | no message text in events; PET_TALKED / PERSONALITY_CHANGED absent from player snapshot |
| input / lifecycle | missing id, blank, 1001 chars → 400 with no AI call; PET_NOT_FOUND; Egg INVALID_PET_STAGE |
| no provider | Talk AI_UNAVAILABLE, Feed button still 200 |

`ai/character-response.test.ts`: result line for none / each success / each rejection; prompt order; Task 7.11 rules; JSON format; conversation order; failures return null.

`packages/domain` `applyTalk`: gain, remainder, cap, clamp, sleeping.

Web: 40 existing tests unchanged after switching reaction text to the shared table.

## Phase 7 Gate

Passed. Next: Unit 08 — Chat failure hardening.
