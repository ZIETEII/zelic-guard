# ZELIC Guard — Build Week Evidence

## Session identity

- Primary Codex session ID: `019f75e8-0ba6-71c2-995d-fd75382cfb1b`
- Model: `gpt-5.6-sol`
- Build date: 2026-07-18
- Current authorized scope: completed Phase 2 plus Phase 3 T015-T019 and Phase 4 T020-T030 only

## Pre-session baseline

The primary implementation session began after these commits already existed:

| Commit | Description | Boundary |
| --- | --- | --- |
| `c2d047b` | `chore: bootstrap Build Week project` | `create-next-app` scaffold created before the primary Codex implementation session. |
| `b90e92b` | `docs: define ZELIC Guard Build Week brief` | Engineering brief only; no product implementation. |
| `abc152c` | `docs: add ZELIC Guard Spec Kit plan` | Reviewed Phase 1 planning documents and `AGENTS.md`; approved before Phase 2. |
| `07016fb` | `test: establish guard schema contract` | Independently verified Phase 2 harness, schemas, inferred types, reason codes, and evidence. |

Git history is preserved. This sandbox exposes `.git` as read-only, so the session records intended commit messages but does not attempt commits.

## Phase 1 approval

ZELIC confirmed under ZIETE's explicit instruction that Phase 1 was reviewed and approved. Task T009 was therefore marked complete before production code was added.

## Phase 2 dependency and harness setup

Runtime dependency: Zod. Test dependencies: Vitest, jsdom, React Testing Library, DOM Testing Library, user-event, jest-dom, the Vite React plugin, and TypeScript path resolution. Coverage tooling was not installed because Phase 2 does not require a coverage report.

The installed Next.js 16.2.10 guide at `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` was reviewed before configuration.

### Harness cycle

**RED command**

```bash
npm run test:run -- tests/harness.test.ts
```

**Observed RED:** Exit 1 on 2026-07-18 at 11:04 America/Bogota. Vitest 4.1.10 started successfully in jsdom and ran one test. The deliberate assertion failed with `expected '' to be 'ZELIC Guard test environment'`, proving the expected behavior was absent rather than exposing a harness/configuration failure.

The assertion was then corrected to verify that jsdom's `document.body` is present using the matcher loaded from `src/test/setup.ts`.

**GREEN command**

```bash
npm run test:run -- tests/harness.test.ts
```

**Observed GREEN:** Exit 0 on 2026-07-18 at 11:04 America/Bogota; 1 test file and 1 test passed.

## Phase 2 schema cycle

**Focused RED command**

```bash
npm run test:run -- tests/unit/guard/schemas.test.ts
```

**Observed RED:** Exit 1 on 2026-07-18 at 11:05 America/Bogota. Vitest reported `Failed to resolve import "@/lib/guard/reason-codes"`; zero tests ran because the Phase 2 domain modules did not yet exist. This was the expected missing-behavior failure before schema implementation.

**Focused GREEN command**

```bash
npm run test:run -- tests/unit/guard/schemas.test.ts
```

**Observed GREEN:** Exit 0 on 2026-07-18 at 11:06 America/Bogota; 1 test file and 17 tests passed. The matrix covered strict unknown-key rejection, timezone-required timestamps, lowercase SHA-256 fingerprints, nonnegative costs, positive integer max runs, normalized unique email recipients, and the exact reason-code vocabulary.

**Full-suite GREEN command before refactor**

```bash
npm run test:run
```

**Observed GREEN:** Exit 0 on 2026-07-18 at 11:06 America/Bogota; 2 test files and 18 tests passed.

### Refactor

While green, repeated cost and timestamp schemas were extracted and all domain records were expressed with the Zod strict-object factory. Vitest also reported that Vite now resolves TypeScript aliases natively, so the deprecated `vite-tsconfig-paths` plugin was replaced with `resolve.tsconfigPaths: true` and removed from dependencies. Post-refactor outcomes are recorded below.

**Post-refactor focused command**

```bash
npm run test:run -- tests/unit/guard/schemas.test.ts
```

**Observed:** Exit 0 on 2026-07-18 at 11:07 America/Bogota; 1 test file and 17 tests passed with no Vite deprecation warning.

**Post-refactor full-suite command**

```bash
npm run test:run
```

**Observed:** Exit 0 on 2026-07-18 at 11:07 America/Bogota; 2 test files and 18 tests passed with no Vite deprecation warning.

## Phase 2 final quality gates

```bash
npm run lint
```

Observed: exit 0 on 2026-07-18 at 11:07 America/Bogota with clean ESLint output.

```bash
npm run typecheck
```

Observed: exit 0 on 2026-07-18 at 11:07 America/Bogota with clean `tsc --noEmit` output.

```bash
npm run test:run
```

Observed: exit 0 on 2026-07-18 at 11:07 America/Bogota; 2 test files and 18 tests passed.

## Intended Phase 2 commit

`test: establish guard schema contract`

The commit was not attempted because the user explicitly instructed this session not to write Git metadata in the read-only sandbox.

## Phase 3 — Stable contract identity

All Phase 3 focused RED/GREEN runs used:

```bash
npm run test:run -- tests/unit/guard/fingerprint.test.ts
```

Every GREEN was followed by:

```bash
npm run test:run
```

| Slice | Observed RED | Observed focused GREEN | Observed full-suite GREEN |
| --- | --- | --- | --- |
| T015-T016 canonical serialization | 2026-07-18 11:33 America/Bogota, exit 1: import `@/lib/guard/canonicalize` could not resolve because implementation did not exist. | 11:33, exit 0: 7/7 tests passed, including recursive object-key sorting, significant array order, unsupported values, and cycles. | 11:33, exit 0: 25/25 tests passed. |
| T017-T018 SHA-256 fingerprint | 11:34, exit 1: import `@/lib/guard/fingerprint` could not resolve because implementation did not exist. | 11:34, exit 0: 12/12 tests passed; digest format, insertion-order stability, derived-field exclusion, authority mutation, recipient order, and malformed input were covered. | 11:34, exit 0: 30/30 tests passed. |
| T019 authority-payload refactor | Refactor began only after the fingerprint slice was green; no behavior was added. | 11:35, exit 0: 12/12 tests passed after extracting `contractAuthorityPayload`. | 11:35, exit 0: 30/30 tests passed. |

Canonical serialization accepts only finite JSON primitives, arrays without holes/custom keys, and plain enumerable data objects. Object keys are sorted recursively; array order is never sorted. Contract fingerprints are lowercase SHA-256 digests over the canonical authority payload and exclude `status` and the derived `fingerprint` field.

## Phase 4 — Pure deterministic policy engine

All Phase 4 focused RED/GREEN runs used:

```bash
npm run test:run -- tests/unit/guard/evaluate-execution.test.ts
```

Every focused GREEN was followed by the exact full-suite command:

```bash
npm run test:run
```

| Slice | Observed RED | Observed focused GREEN | Observed full-suite GREEN |
| --- | --- | --- | --- |
| T020-T021 valid approved execution | 2026-07-18 11:35 America/Bogota, exit 1: import `@/lib/guard/evaluate-execution` could not resolve. | 11:36, exit 0: 1/1 test passed with `ALLOW`, `ALL_RULES_PASSED`, and ten ordered passing checks. | 11:36, exit 0: 31/31 tests passed. |
| T022 approval | 11:36, exit 1: 2 tests failed because proposed/rejected contracts incorrectly returned `ALLOW`. | 11:37, exit 0: 3/3 tests passed. | 11:37, exit 0: 33/33 tests passed. |
| T022 expiration | 11:37, exit 1: 2 tests failed because explicit/exact-boundary expiration was not reported. | 11:37, exit 0: 5/5 tests passed. | 11:37, exit 0: 35/35 tests passed. |
| T023 action | 11:37, exit 1: action drift incorrectly returned `ALLOW`. | 11:37, exit 0: 6/6 tests passed. | 11:37, exit 0: 36/36 tests passed. |
| T023 channel | 11:38, exit 1: channel drift incorrectly returned `ALLOW`. | 11:38, exit 0: 7/7 tests passed. | 11:38, exit 0: 37/37 tests passed. |
| T023 target | 11:38, exit 1: target drift incorrectly returned `ALLOW`. | 11:38, exit 0: 8/8 tests passed. | 11:38, exit 0: 38/38 tests passed. |
| T024 recipient | 11:38, exit 1: recipient drift incorrectly returned `ALLOW`. | 11:39, exit 0: 9/9 tests passed. | 11:39, exit 0: 39/39 tests passed. |
| T025 resource fingerprint | 11:39, exit 1: resource drift incorrectly returned `ALLOW`. | 11:39, exit 0: 10/10 tests passed. | 11:39, exit 0: 40/40 tests passed. |
| T026 cost | 11:39, exit 1: a cost of 0.26 against a 0.25 limit incorrectly returned `ALLOW`; the existing valid case retained equality-at-limit coverage. | 11:39, exit 0: 11/11 tests passed. | 11:39, exit 0: 41/41 tests passed. |
| T027 max runs | 11:40, exit 1: `successfulRuns === maxRuns` incorrectly returned `ALLOW`. | 11:40, exit 0: 12/12 tests passed. | 11:40, exit 0: 42/42 tests passed. |
| T028 replay | 11:40, exit 1: a consumed execution ID incorrectly returned `ALLOW`. | 11:40, exit 0: 13/13 tests passed. | 11:40, exit 0: 43/43 tests passed. |
| T029 all checks and fail-closed integrity | 11:41, exit 1: 17/18 tests passed; the missing behavior was that an attempt referencing a different contract did not throw. The simultaneous ten-failure case already proved all checks were evaluated in fixed order. | 11:41, exit 0: 18/18 tests passed, including malformed schema, tampered contract fingerprint, contract association, all ten simultaneous failures, and input non-mutation. | 11:41, exit 0: 48/48 tests passed. |
| T030 shared-check refactor | Refactor began only while green; predicates were calculated once and a shared `createRuleCheck` constructor replaced repetition without changing order. | 11:42, exit 0: 18/18 tests passed. | 11:42, exit 0: 48/48 tests passed. |

`evaluateExecution` parses strict input, verifies the contract fingerprint and contract association, then evaluates all ten rules in a fixed array order. It receives `now` and the read-only history snapshot explicitly, does not mutate its inputs, does not consume an execution ID, and has no hidden global state. Schema and integrity failures throw before a policy verdict is constructed.

## Intended Phase 3-4 commits

- `feat: add deterministic contract fingerprints`
- `feat: allow contracted execution`
- `feat: enforce contract lifecycle`
- `feat: enforce action scope`
- `feat: enforce recipient scope`
- `feat: enforce resource identity`
- `feat: enforce execution cost`
- `feat: enforce run allowance`
- `feat: block execution replay`
- `refactor: stabilize guard evidence`

No commit was attempted because `.git` is read-only in this sandbox and the user explicitly prohibited commit attempts.

## Phase 3-4 final verification

Focused canonical identity:

```bash
npm run test:run -- tests/unit/guard/fingerprint.test.ts
```

Observed: exit 0 on 2026-07-18 at 11:43 America/Bogota; 1 test file and 12 tests passed.

Focused policy engine:

```bash
npm run test:run -- tests/unit/guard/evaluate-execution.test.ts
```

Observed: exit 0 on 2026-07-18 at 11:43 America/Bogota; 1 test file and 18 tests passed.

Full suite:

```bash
npm run test:run
```

Observed: exit 0 on 2026-07-18 at 11:43 America/Bogota; 4 test files and 48 tests passed.

Lint:

```bash
npm run lint
```

Observed: exit 0 on 2026-07-18 at 11:43 America/Bogota with clean ESLint output. An earlier verification pass exposed one unused test helper warning; the helper was removed before this clean recorded gate.

Type check:

```bash
npm run typecheck
```

Observed: exit 0 on 2026-07-18 at 11:43 America/Bogota with clean `tsc --noEmit` output.

Production build:

```bash
npm run build
```

Observed: exit 0 on 2026-07-18 after 8.8 seconds. Next.js 16.2.10 compiled successfully, completed TypeScript validation, generated 4/4 static pages, and reported `/` plus `/_not-found` as static routes.

## Scope boundary

Completed scope now includes the Phase 2 harness/schemas, Phase 3 canonical identity, and Phase 4 pure policy evaluation only. It does not implement approval behavior, mutable history, fixtures, audit events, compiler adapters, routes, UI, or any external action.
