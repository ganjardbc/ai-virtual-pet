# Prototype 0.2 — Unit 11: AI + Personality Debug Tooling — Verification

## Commands run

```text
pnpm typecheck   → all 6 workspace projects pass
pnpm test        → contracts 25, domain 99, simulation 92, web 66, api 412 (all pass)
pnpm build       → contracts/domain/simulation/api tsc, web vite build, all succeed
```

Baseline before this unit: api 395, web 61, contracts 18. After: api 412 (+17), web 66 (+5),
contracts 25 (+7). PostgreSQL integration tests ran (both `TEST_DATABASE_URL` describes executed).

## Acceptance criteria

| Task | Criterion | Result |
| --- | --- | --- |
| 10.1 | Personality section shows traits + dominant | Pass — raw traits, dominant/primary/strength/social style in `GET /debug/ai`; panel test asserts. |
| 10.2 | Daily delta display vs cap | Pass — `+0.018 / 0.030`; test asserts. |
| 10.3 | Debug trait set route | Pass — `PATCH /debug/personality`, clamped/normalized, daily tracking untouched; route tests. |
| 10.4 | Presets | Pass — six domain presets, exposed and applied; route + panel tests. |
| 10.5 | AI debug section from latest ASSISTANT metadata | Pass — `GET /debug/ai`; DB-backed test seeds a reply and reads it back (survives restart by design). |
| 10.6 | Context inspection | Pass — mood, relationship, levels, recent message/event counts; bounded window matches the AI context builder. |
| 10.7 | Optional test-prompt control | Skipped by plan (optional). |
| 10.8 | Reset clears personality/conversation/messages | Pass — PostgreSQL test asserts no orphan rows after reset. |

## Phase 10 Gate

```text
Set Playful preset → Talk → Observe response
Set Shy preset → Talk (same prompt) → Observe difference
Inspect intent → confidence → action result
```

Automated coverage proves the tooling half: presets set personality, `GET /debug/ai` reports the
last turn's intent/confidence/action and the personality/context. The live response-difference half
needs a configured AI provider (9router credentials in `.env`) and a browser session; not run in
this environment, consistent with Unit 04/05/09 gates.

## Remaining issues

- Live browser gate pending provider credentials.
- None open from review: all Important findings and the actionable Minor findings were fixed (see
  `implementation.md` "Post-review fixes"); the cosmetic cap-sign difference (plan §123 shows
  `+0.030`, the panel shows `0.030`) is retained.
