# ZELIC Guard Build Plan — 2026-07-18

**Objective:** Produce a complete, deterministic, judge-testable Developer Tools submission while preserving an auditable Build Week implementation trail.  
**Current gate:** Phase 1 documentation only. Stop for review after committing this file and its companion Spec Kit documents.

## Working protocol

For every vertical behavior:

1. Add exactly one focused test or one tightly related table of cases.
2. Run the focused command and capture the expected failure in `BUILD_WEEK_EVIDENCE.md`.
3. Confirm the failure is behavioral (missing export, failing assertion, or schema rejection), not a broken test harness.
4. Implement the smallest production change.
5. Run the focused command; expect exit 0 and the new test green.
6. Run `npm run test:run`; expect the entire suite green.
7. Refactor without changing behavior; repeat focused and full commands.
8. Commit a coherent checkpoint with a normal commit. Never amend.

Generic focused command once Vitest exists:

```bash
npm run test:run -- tests/unit/guard/<file>.test.ts
```

Expected RED: exit non-zero and the newly introduced assertion fails for the named missing behavior.  
Expected GREEN: exit 0, focused file passes, then full `npm run test:run` exits 0.

## Step 0 — Planning gate (current phase)

**Paths:**

- `.specify/memory/constitution.md`
- `specs/001-zelic-guard/spec.md`
- `specs/001-zelic-guard/plan.md`
- `specs/001-zelic-guard/tasks.md`
- `docs/plans/2026-07-18-zelic-guard.md`
- `AGENTS.md`

Validate:

```bash
git diff --check
rg -n "HermeSpec|ag-kit|RED|GREEN|gpt-5.6|Simulation only|c2d047b" \
  AGENTS.md .specify specs docs/plans
git status --short
```

Expected: no whitespace errors; required safety/evidence terms exist; only the five planning documents and `AGENTS.md` are changed. Commit:

```bash
git add AGENTS.md .specify/memory/constitution.md \
  specs/001-zelic-guard/spec.md specs/001-zelic-guard/plan.md \
  specs/001-zelic-guard/tasks.md docs/plans/2026-07-18-zelic-guard.md
git commit -m "docs: add ZELIC Guard Spec Kit plan"
```

Then stop for human review.

## Step 1 — Test harness and schema slice

**Paths:** `package.json`, `package-lock.json`, `vitest.config.ts`, `src/test/setup.ts`, `src/lib/guard/schemas.ts`, `src/lib/guard/types.ts`, `src/lib/guard/reason-codes.ts`, `tests/unit/guard/schemas.test.ts`.

1. Install the minimal test/runtime dependencies and expose `typecheck`, `test`, and `test:run` scripts.
2. Create a temporary harness assertion and run it once failing, once passing; remove only the deliberate failure after proof.
3. Write malformed contract/attempt tests first, including unknown keys, invalid timestamps/fingerprints, negative cost, non-positive runs, and duplicate/invalid recipients.
4. RED:

   ```bash
   npm run test:run -- tests/unit/guard/schemas.test.ts
   ```

   Expected: missing schema exports or invalid inputs incorrectly accepted.
5. Implement strict Zod schemas and inferred types. GREEN focused then full.
6. Refactor reusable primitives while green.
7. Commit: `test: establish guard schema contract`.

## Step 2 — Canonical serialization and fingerprint slice

**Paths:** `src/lib/guard/canonicalize.ts`, `src/lib/guard/fingerprint.ts`, `tests/unit/guard/fingerprint.test.ts`.

1. Test that different object insertion orders and nested key orders serialize identically while array order remains meaningful.
2. RED focused; expected missing canonicalizer.
3. Implement recursive canonical JSON for schema-valid JSON values.
4. Test SHA-256 stability, fingerprint-field exclusion, and material mutation changes.
5. RED focused; expected missing/incorrect digest.
6. Implement hash boundary and authority payload helper. GREEN focused/full.
7. Commit: `feat: add deterministic contract fingerprints`.

## Step 3 — Allow path

**Paths:** `src/lib/guard/evaluate-execution.ts`, `tests/unit/guard/evaluate-execution.test.ts`.

1. Add one approved, unexpired, exact-match, within-cost, capacity-available, unused-ID case.
2. RED focused; expected missing evaluator or wrong aggregate.
3. Implement ordered checks and `ALLOW` only when all pass.
4. Verify result includes `ALL_RULES_PASSED` and does not mutate history.
5. GREEN focused/full; refactor only check construction.
6. Commit: `feat: allow contracted execution`.

## Step 4 — Lifecycle denials

**Paths:** same evaluator/test plus `src/lib/guard/approve-contract.ts`, `tests/unit/guard/approve-contract.test.ts`.

1. Add proposed, rejected, and `now >= expiresAt` cases.
2. RED; expected lifecycle cases incorrectly allow.
3. Add `CONTRACT_NOT_APPROVED` and `CONTRACT_EXPIRED` checks.
4. Add approval snapshot tests: validated proposal approves; material edit invalidates prior fingerprint/status.
5. RED then implement approval helper; GREEN focused/full.
6. Commit: `feat: enforce contract lifecycle`.

## Step 5 — Scope-denial slices

Each bullet is its own RED/GREEN/full-suite checkpoint:

1. Action/channel/target mismatches -> `ACTION_MISMATCH`, `CHANNEL_MISMATCH`, `TARGET_MISMATCH`. Commit `feat: enforce action scope`.
2. Recipient drift and normalization tricks -> `RECIPIENT_NOT_ALLOWED`. Commit `feat: enforce recipient scope`.
3. Resource fingerprint drift -> `RESOURCE_FINGERPRINT_MISMATCH`. Commit `feat: enforce resource identity`.

Focused command remains the evaluator test. Every GREEN run is followed by `npm run test:run`.

## Step 6 — Budget, capacity, and replay slices

**Paths:** evaluator/test plus `src/lib/guard/history.ts`, `tests/unit/guard/history.test.ts`.

1. Test equality at max cost passes and greater cost fails. Implement `COST_LIMIT_EXCEEDED`. Commit `feat: enforce execution cost`.
2. Test prior successful runs below/at max. Implement injected `MAX_RUNS_EXCEEDED`. Commit `feat: enforce run allowance`.
3. Test unused/reused IDs. Implement injected `REPLAY_DETECTED`. Commit `feat: block execution replay`.
4. Test allowed-only consumption and no mutation inside the pure evaluator. Implement demo history snapshot/adapter.
5. Test combined failures to prove fixed check order and no explanatory early exit.
6. GREEN focused/full and commit `refactor: stabilize guard evidence`.

## Step 7 — Fixtures and deterministic audit

**Paths:** `src/lib/guard/fixtures.ts`, `src/lib/guard/audit.ts`, `tests/unit/guard/fixtures.test.ts`, `tests/unit/guard/audit.test.ts`.

1. RED exact fixture assertions for valid, recipient, cost, replay, and expired scenarios using `.test` data only.
2. GREEN invoice fixture implementation.
3. RED ordered sequence and injected-clock audit assertions.
4. GREEN deterministic audit implementation; no `Date.now()` hidden in domain functions.
5. Commit: `feat: add deterministic guard lab state`.

## Step 8 — Offline compiler

**Paths:** `src/lib/guard/compiler.ts`, `src/lib/guard/deterministic-compiler.ts`, `tests/unit/guard/compiler.test.ts`.

1. RED sample intent -> exact valid proposed contract; invalid input -> typed failure.
2. Implement compiler interface and seeded compiler; validate its output through the same schema.
3. GREEN focused/full.
4. Commit: `feat: add offline intent compiler`.

Before optional GPT work, consult current official OpenAI documentation for the supported SDK, Responses API structured-output shape, and the requested model ID. Record the verification date/source in evidence. If not verifiable, stop that optional slice and document it; do not guess.

## Step 9 — Validated API routes

**Paths:** `src/app/api/compile/route.ts`, `src/app/api/approve/route.ts`, `src/app/api/evaluate/route.ts`, `src/lib/guard/errors.ts`, `tests/integration/api/*.test.ts`.

For each route separately:

1. RED valid request and malformed JSON/schema cases.
2. Implement POST handler using installed Next.js 16 Route Handler conventions and web `Request`/`Response`.
3. Assert stable success/error envelopes, content type, and no permissive CORS.
4. GREEN focused route test/full suite.

After all three: commit `feat: expose validated guard routes`.

Optional verified GPT slice paths: `src/lib/guard/openai-compiler.server.ts`, compiler route tests with a fake injected client, `.env.example`. Test no-key deterministic selection, validated structured output, mode labeling, and sanitized failures before implementation. Commit separately: `feat: add optional GPT intent compiler`.

## Step 10 — Core UI flow

**Paths:** `src/app/page.tsx`, `src/components/guard/*.tsx`, `tests/integration/ui/mission-control.test.tsx`.

1. RED compile -> edit -> approve -> valid ALLOW -> recipient DENY flow using user-event.
2. Build semantic functional components with labeled fields/buttons and accessible status output.
3. GREEN focused/full; commit `feat: build guard execution lab`.
4. RED cost, replay, expired, JSON, counters, timeline, and reset assertions.
5. Implement each control and state transition in small green increments.
6. Ensure every visible claim derives from response/domain data, not decorative hard-coded verdicts.

## Step 11 — Visual, responsive, and accessibility refinement

**Paths:** `src/app/globals.css`, `src/app/layout.tsx`, guard components and UI tests.

1. Implement tokens for graphite, warm ivory, acid green, amber, and signal red; add restrained grid/noise without external imagery.
2. Add desktop three-stage layout and mobile stacking.
3. Add visible focus, non-color icons/text, live-region status, error association, touch targets, and reduced-motion override.
4. Test required application states and semantic names.
5. Run `npm run lint`, `npm run typecheck`, `npm run test:run`.
6. Commit: `style: refine accessible mission control`.

## Step 12 — Browser proof

Attempt Playwright only if it installs and launches reliably within the schedule. If successful, add a core end-to-end spec and `test:e2e`. If not, add `scripts/smoke.mjs` for deterministic HTTP checks and record manual browser proof.

Required real-browser matrix:

- Desktop around 1440x900: full core flow, all scenarios, JSON, audit, reset.
- Mobile around 390x844: stacked flow, no hidden controls/horizontal overflow.
- Keyboard: compile, edit, approve, scenario selection, reset.
- Reduced motion enabled.
- Console: zero errors at both sizes.

Commit browser automation only after it passes locally.

## Step 13 — Security and dependency audit

**Paths:** `next.config.ts`, `.env.example`, relevant route tests, later README security section.

1. RED header assertions or deterministic config test where practical.
2. Add a CSP compatible with actual emitted resources plus nosniff, referrer, permissions, and framing controls.
3. Confirm no wildcard CORS, secret logging, `NEXT_PUBLIC_OPENAI_*`, or external action calls.
4. Run `npm audit --json`; trace the reported PostCSS advisories through `npm ls postcss`.
5. Test a safe override only if semver/API compatibility is supported. After any lockfile change, run install, focused tests, full tests, and build.
6. If no safe fixed dependency exists for Next.js 16.2.10, remove the override and document exact dependency path, advisory scope, demo exposure, and mitigation. Never downgrade Next.js.
7. Document Vercel Firewall/WAF rate limits for `/api/compile`.
8. Commit: `security: harden public demo boundaries`.

## Step 14 — Judge documentation and provenance

**Paths:** `README.md`, `PRIOR_WORK.md`, `BUILD_WEEK_EVIDENCE.md`, `LICENSE`, `docs/DEMO_SCRIPT.md`, `docs/JUDGE_TEST_PLAN.md`.

- README: problem, screenshots placeholder, architecture, setup, scripts, sample flow, optional GPT mode, security boundaries, Vercel deploy.
- Prior work: HermeSpec third-party MIT inspiration; no copied implementation; exact files present in `c2d047b`; exact Codex/GPT-built additions after scaffold.
- Evidence: `gpt-5.6-sol`, primary session ID placeholder, dated commit table, RED/GREEN observations, commands, and scope boundary.
- Demo script: public YouTube target under three minutes and explicit Codex/GPT explanation.
- Judge plan: five-minute clean deterministic path.
- License: MIT only for entrant-owned code.

Validate every statement against Git, tests, and package state. Commit: `docs: prepare judge-ready Build Week submission`.

## Step 15 — Final local release gate

Run in this order:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Expected: every command exits 0 with clean output. Then repeat the desktop/mobile browser matrix and confirm zero console errors. Record exact command results and commit SHAs in `BUILD_WEEK_EVIDENCE.md`.

Do not push, deploy, upload a video, create an account, or submit anything. Stop with a reviewable local repository unless the user gives a later explicit instruction.
