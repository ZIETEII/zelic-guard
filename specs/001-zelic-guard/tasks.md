# Tasks: ZELIC Guard

**Input:** `specs/001-zelic-guard/spec.md`, `specs/001-zelic-guard/plan.md`  
**Rule:** Tasks execute sequentially unless explicitly marked `[P]`; every behavior task starts with its test and recorded RED result.

## Phase 1 — Planning baseline

- [x] T001 Preserve and inspect scaffold commit `c2d047b`.
- [x] T002 Read installed Next.js 16.2.10 guidance relevant to routes, environment variables, data security, CSP, and headers.
- [x] T003 Create `.specify/memory/constitution.md`.
- [x] T004 Create `specs/001-zelic-guard/spec.md`.
- [x] T005 Create `specs/001-zelic-guard/plan.md`.
- [x] T006 Create `specs/001-zelic-guard/tasks.md`.
- [x] T007 Create `docs/plans/2026-07-18-zelic-guard.md`.
- [x] T008 Update `AGENTS.md` with repository rules and the verified `@vudovn/ag-kit@2026.7.18` incompatibility.
- [ ] T009 Obtain human review of Phase 1 before production work.

## Phase 2 — Test harness and typed contracts

- [ ] T010 Install only required packages: Zod, Vitest, jsdom, Testing Library, user-event, and coverage support if needed; update `package.json` scripts.
- [ ] T011 Add `vitest.config.ts` and `src/test/setup.ts`; prove a deliberate harness test goes RED then GREEN.
- [ ] T012 RED malformed contract and attempt tests in `tests/unit/guard/schemas.test.ts`.
- [ ] T013 GREEN strict schemas in `src/lib/guard/schemas.ts`, inferred exports in `src/lib/guard/types.ts`, and reason codes in `src/lib/guard/reason-codes.ts`.
- [ ] T014 REFACTOR schema factories and run focused/full suite; commit `test: establish guard schema contract`.

## Phase 3 — Stable contract identity

- [ ] T015 RED object-key-order fingerprint test in `tests/unit/guard/fingerprint.test.ts`.
- [ ] T016 GREEN recursive JSON canonicalization in `src/lib/guard/canonicalize.ts`.
- [ ] T017 RED fingerprint exclusion and mutation tests.
- [ ] T018 GREEN SHA-256 contract fingerprint in `src/lib/guard/fingerprint.ts`.
- [ ] T019 REFACTOR authority-payload helper; run focused/full suite; commit `feat: add deterministic contract fingerprints`.

## Phase 4 — Policy engine vertical slices

- [ ] T020 RED valid approved execution test in `tests/unit/guard/evaluate-execution.test.ts`.
- [ ] T021 GREEN ordered checks and `ALLOW` aggregate in `src/lib/guard/evaluate-execution.ts`; commit after focused/full green.
- [ ] T022 RED proposed/rejected/expired matrix, then GREEN approval and expiry rules; commit `feat: enforce contract lifecycle`.
- [ ] T023 RED action/channel/target mismatches, then GREEN exact scope rules; commit `feat: enforce action scope`.
- [ ] T024 RED recipient drift, then GREEN normalized exact allowlist rule; commit `feat: enforce recipient scope`.
- [ ] T025 RED resource fingerprint drift, then GREEN resource rule; commit `feat: enforce resource identity`.
- [ ] T026 RED cost overrun/equality boundary, then GREEN cost rule; commit `feat: enforce execution cost`.
- [ ] T027 RED max-runs behavior, then GREEN injected successful-run count; commit `feat: enforce run allowance`.
- [ ] T028 RED reused execution ID, then GREEN injected replay lookup; commit `feat: block execution replay`.
- [ ] T029 RED multiple simultaneous failures and fixed order, then GREEN all-check evaluation without early-return hiding.
- [ ] T030 REFACTOR shared check constructors while green; commit `refactor: stabilize guard evidence`.

## Phase 5 — Approval, history, fixtures, and audit

- [ ] T031 RED approval-invalidates-on-edit and bad-fingerprint tests in `tests/unit/guard/approve-contract.test.ts`.
- [ ] T032 GREEN `src/lib/guard/approve-contract.ts`.
- [ ] T033 RED allowed-only history consumption tests in `tests/unit/guard/history.test.ts`.
- [ ] T034 GREEN `src/lib/guard/history.ts` interface and demo adapter/snapshot implementation.
- [ ] T035 RED deterministic audit sequence/timestamp tests, then GREEN `src/lib/guard/audit.ts`.
- [ ] T036 Add and test invoice/adversarial fixtures in `src/lib/guard/fixtures.ts`; commit `feat: add deterministic guard lab state`.

## Phase 6 — Intent compiler and server routes

- [ ] T037 Verify official OpenAI SDK/Responses structured-output shape and record the source/date; do not code an unverified call.
- [ ] T038 RED seeded compiler tests in `tests/unit/guard/compiler.test.ts`.
- [ ] T039 GREEN `src/lib/guard/compiler.ts` and `src/lib/guard/deterministic-compiler.ts`; commit `feat: add offline intent compiler`.
- [ ] T040 RED strict request/response tests for `POST /api/compile`, `/api/approve`, and `/api/evaluate`.
- [ ] T041 GREEN Zod-validated handlers under `src/app/api/`; ensure no CORS and no external action; commit `feat: expose validated guard routes`.
- [ ] T042 If and only if T037 succeeds, RED OpenAI adapter output/absence/error tests using a fake client.
- [ ] T043 GREEN server-only `src/lib/guard/openai-compiler.server.ts`, env selection, and fallback labeling; commit `feat: add optional GPT intent compiler`.
- [ ] T044 If T037 fails, document the disabled adapter boundary and keep all offline/route tests green instead of implementing T042-T043.

## Phase 7 — Mission-control UI

- [ ] T045 RED core UI flow test in `tests/integration/ui/mission-control.test.tsx`: compile -> edit/review -> approve -> allow -> recipient denial.
- [ ] T046 GREEN functional `src/components/guard/mission-control.tsx` and stage components with accessible labels/status.
- [ ] T047 RED replay, cost, expiry, reset, counters, JSON, and audit assertions.
- [ ] T048 GREEN all scenario controls and state transitions; commit `feat: build guard execution lab`.
- [ ] T049 Implement graphite/ivory/signal visual system in `src/app/globals.css` and components, preserving semantic status beyond color.
- [ ] T050 Add initial/loading/error/proposed/approved/allowed/denied/expired/reset presentations.
- [ ] T051 Add desktop three-column and mobile stacked layouts, focus-visible states, keyboard flow, and reduced-motion CSS; commit `style: refine accessible mission control`.

## Phase 8 — Browser coverage and security

- [ ] T052 Attempt Playwright only if browser installation/execution is reliable; otherwise add `scripts/smoke.mjs` and document the decision.
- [ ] T053 Verify core desktop flow, mobile flow, keyboard operation, reduced motion, and zero browser-console errors.
- [ ] T054 Add `.env.example` with blank/documented values; verify `.env.local` is ignored.
- [ ] T055 Add and test practical `next.config.ts` security headers and same-origin policy.
- [ ] T056 Run `npm audit`, trace both moderate PostCSS findings, test any safe compatible override, and otherwise document exact residual risk without downgrading Next.js.
- [ ] T057 Document Vercel Firewall/WAF rate limiting for `/api/compile`; commit `security: harden public demo boundaries`.

## Phase 9 — Submission documentation

- [ ] T058 Replace scaffold `README.md` with professional English judge documentation and screenshot placeholders.
- [ ] T059 Add `PRIOR_WORK.md` with HermeSpec disclosure, exact scaffold inventory, and independent work boundary.
- [ ] T060 Add `BUILD_WEEK_EVIDENCE.md` with `gpt-5.6-sol`, primary session ID placeholder, commit timeline, RED/GREEN commands, and scope boundary.
- [ ] T061 Add entrant-owned MIT `LICENSE`.
- [ ] T062 Add `docs/DEMO_SCRIPT.md` for a public video under three minutes.
- [ ] T063 Add `docs/JUDGE_TEST_PLAN.md` for a reproducible five-minute evaluation.
- [ ] T064 Cross-check all claims against actual code/tests/history; commit `docs: prepare judge-ready Build Week submission`.

## Phase 10 — Release verification (no deploy)

- [ ] T065 Run `npm run lint` with clean output.
- [ ] T066 Run `npm run typecheck` with clean output.
- [ ] T067 Run `npm run test:run` with clean output.
- [ ] T068 Run `npm run build` with clean output.
- [ ] T069 Repeat browser verification at desktop/mobile and confirm no console errors.
- [ ] T070 Update evidence with actual results and commit only tracked evidence corrections.
- [ ] T071 Stop before push, deploy, account creation, public video upload, or submission unless explicitly authorized.

## Dependency order

`schemas -> canonical identity -> evaluator rules -> approval/history/audit -> compiler -> routes -> UI -> browser/security -> docs -> release verification`.

Parallel `[P]` work is intentionally omitted from domain phases because strict vertical TDD and shared types make sequential evidence clearer. Documentation files in Phase 9 may be drafted in parallel only after implementation facts stabilize.
