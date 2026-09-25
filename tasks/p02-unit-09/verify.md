# Prototype 0.2 — Unit 09: Verification Record

## Status

Automated verification passed. Live: Phase 4 gate passed, interpretation evaluated, personality comparison done; truth corpus (state / memory / injection) **pending** — 9router returned HTTP 503 from case 38 on. Date: 2026-09-25.

Model: `ag/gemini-3.8-flash-medium` via 9router.

## Automated

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass — 641 tests (api 392, domain 99) |
| `pnpm build` | Pass |

## Live

| Run | Result |
| --- | --- |
| `pnpm ai:smoke` | Initially failed (SSE body) → adapter fixed → `OK reply: Halo juga! Apa kabar?`, 3,826 ms, 2,229 input / 16 output tokens |
| `pnpm ai:eval:interpretation` (5 s timeout) | 24 pass / 0 FP / 1 FN — but 8 cases timed out (passes by fallback) |
| same, 10 s timeout override | 24 pass / **0 false positives** / 1 FN (one call > 10 s); injection, ambiguous, multi-action all correct |
| `pnpm ai:eval:character` | personality: 36/36 replies, **no flags**; truth: very-hungry ✓, 10 cases 503 |

Report: `live-character-eval-personality.md`.

## Findings (for docs/21 findings)

1. **Latency:** interpretation 3.2–6.5 s (avg ≈ 4.5 s), reply ≈ 4 s → a turn ≈ 8–10 s. The frozen 5 s interpretation timeout is too tight for this model: 8/25 timed out. Options: a faster non-reasoning model, or `AI_INTERPRETATION_TIMEOUT_MS≈8000` (budget 15 s still caps the turn). Decision for the owner.
2. **Token overhead:** a one-line prompt reports ~2,200 input tokens — the router or upstream adds a large hidden prompt. Relevant for cost.
3. **Personality legibility is strong** from presets: Playful proposes play, Shy hesitates ("M-makasih... Momo jadi malu..."), Curious asks back, Independent is relaxed, Clingy seeks closeness without guilt.
4. **Voice:** short, Indonesian, third-person "Momo" self-reference is common — fits Baby stage.
5. **Router:** returned 503 after ~40 sequential calls; evaluation runs should be retried later rather than hammered.

## To Finish

`AI_INTERPRETATION_TIMEOUT_MS=10000 pnpm ai:eval:character --groups STATE,MEMORY,INJECTION --out tasks/p02-unit-09/live-character-eval-truth.md` once 9router responds (`pnpm ai:smoke`).

## Update — Model Testing Skipped

Per owner decision, further live model testing is skipped for now. The truth corpus (state / memory / injection) remains unrun live; run it later with the command above. Partial `ag/gemini-3.8-flash-low` probe: 6 successful interpretations at 1.5–2.8 s (fits the 5 s timeout) before its per-model quota was hit. Eval scripts now wait ~2 min and retry once on a rate-limited call (`ai/evaluation/rate-limit.ts`).
