# ZELIC Guard — Build Week Evidence

## Session identity

- Primary Codex session ID: `019f75e8-0ba6-71c2-995d-fd75382cfb1b`
- Model: `gpt-5.6-sol`
- Build date: 2026-07-18
- Current authorized scope: completed Phases 2-4 plus Phase 5 T031-T036 only

## Pre-session baseline

The primary implementation session began after these commits already existed:

| Commit | Description | Boundary |
| --- | --- | --- |
| `c2d047b` | `chore: bootstrap Build Week project` | `create-next-app` scaffold created before the primary Codex implementation session. |
| `b90e92b` | `docs: define ZELIC Guard Build Week brief` | Engineering brief only; no product implementation. |
| `abc152c` | `docs: add ZELIC Guard Spec Kit plan` | Reviewed Phase 1 planning documents and `AGENTS.md`; approved before Phase 2. |
| `07016fb` | `test: establish guard schema contract` | Independently verified Phase 2 harness, schemas, inferred types, reason codes, and evidence. |
| `b56c136` | `feat: add deterministic contract fingerprints` | Independently verified Phase 3 canonical serialization and contract identity. |
| `f055419` | `feat: add deterministic guard policy engine` | Independently verified Phase 4 pure evaluator and fixed policy rules; clean Phase 5 baseline. |

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

## Phase 5 — Approval, history, audit, and fixtures

Every focused GREEN was followed by the exact full-suite command:

```bash
npm run test:run
```

### T031-T032 approval

Focused command:

```bash
npm run test:run -- tests/unit/guard/approve-contract.test.ts
```

- **RED:** 2026-07-18 11:58 America/Bogota, exit 1 because `@/lib/guard/approve-contract` did not exist.
- **GREEN:** 11:58, exit 0 with 6/6 focused tests; full suite exit 0 with 54/54 tests.
- **REFACTOR:** approvable-snapshot validation was extracted while green; 6/6 focused and 54/54 full remained green at 11:58.

The approval function strictly parses input, accepts only `proposed`, verifies the stored fingerprint against the authority payload, returns a new `approved` copy, and leaves the input unchanged. Invalid lifecycle transitions, malformed input, and stale fingerprints throw before approval.

### T033-T034 isolated demo history

Focused command:

```bash
npm run test:run -- tests/unit/guard/history.test.ts
```

- **RED:** 2026-07-18 11:59 America/Bogota, exit 1 because `@/lib/guard/history` did not exist.
- **GREEN:** 11:59, exit 0 with 6/6 focused tests; at 12:00 the full suite passed 60/60.
- **REFACTOR:** snapshot validation was centralized in the shared schema and reused by the pure evaluator; 6/6 focused and 60/60 full remained green at 12:00.
- **Verdict-integrity RED:** 12:04, exit 1 with 1 failed and 6 passed because a forged `ALLOW` containing failed checks did not throw.
- **Verdict-integrity GREEN:** 12:04, exit 0 with 7/7 focused tests and 75/75 full tests.

Each `InMemoryExecutionHistory` instance owns an isolated Set and counter. Snapshots are defensive copies. `recordVerdict` validates the full verdict aggregate and execution ID before mutation, ignores valid `DENY`, records a unique ID and increments exactly once after consistent `ALLOW`, and rejects duplicate or forged allowance. Evaluation schema/integrity exceptions never reach the mutation step. `evaluateExecution` remains pure.

### T035 deterministic audit events

Focused command:

```bash
npm run test:run -- tests/unit/guard/audit.test.ts
```

- **RED:** 2026-07-18 12:00 America/Bogota, exit 1 because `@/lib/guard/audit` did not exist.
- **GREEN:** 12:01, exit 0 with 6/6 focused tests; full suite exit 0 with 66/66 tests.
- **REFACTOR:** deterministic event-ID formatting was extracted while green; 6/6 focused and 66/66 full remained green at 12:01.

Audit construction accepts strict caller-supplied sequence, timestamp, kind, summary, reason codes, and optional IDs. It derives only `schemaVersion` and the padded event ID. Tests replace `Date.now` and `Math.random` with throwing spies, proving neither is consulted.

### T036 deterministic invoice simulations

Focused command:

```bash
npm run test:run -- tests/unit/guard/fixtures.test.ts
```

- **RED:** 2026-07-18 12:02 America/Bogota, exit 1 because `@/lib/guard/fixtures` did not exist.
- **GREEN:** 12:03, exit 0 with 8/8 focused tests; full suite exit 0 with 74/74 tests.
- **REFACTOR:** history snapshot copying was centralized while green; 8/8 focused and 74/74 full remained green at 12:03.

The factory returns fresh deterministic proposed/approved invoice contracts and scenarios for valid ALLOW, recipient drift, cost overrun, replay, and expiry. Replay intentionally reports both max-run exhaustion and replay detection because the one-run contract already has a consumed successful execution. The module declares a server-only boundary because fingerprint creation imports `node:crypto`; future Client Components must receive serialized DTOs and must not import `fixtures.ts`. All scenarios display the simulation disclosure and perform no email, payment, network request, or external mutation.

## Intended Phase 5 commits

- `feat: enforce contract approval integrity`
- `feat: add isolated execution history`
- `feat: add deterministic audit events`
- `feat: add deterministic guard lab state`

No commit was attempted because `.git` is read-only in this sandbox and the user explicitly prohibited commit attempts.

## Phase 5 final verification

Focused approval:

```bash
npm run test:run -- tests/unit/guard/approve-contract.test.ts
```

Observed: exit 0 on 2026-07-18 at 12:05 America/Bogota; 1 file and 6 tests passed.

Focused history:

```bash
npm run test:run -- tests/unit/guard/history.test.ts
```

Observed: exit 0 at 12:05; 1 file and 7 tests passed.

Focused audit:

```bash
npm run test:run -- tests/unit/guard/audit.test.ts
```

Observed: exit 0 at 12:05; 1 file and 6 tests passed.

Focused fixtures:

```bash
npm run test:run -- tests/unit/guard/fixtures.test.ts
```

Observed: exit 0 at 12:05; 1 file and 8 tests passed.

Full suite:

```bash
npm run test:run
```

Observed: exit 0 at 12:05; 8 files and 75 tests passed.

Quality gates:

```bash
npm run lint
npm run typecheck
npm run build
```

Observed: all exited 0. ESLint and `tsc --noEmit` produced clean output. Next.js 16.2.10 compiled successfully, completed TypeScript validation, generated 4/4 static pages, and reported `/` plus `/_not-found` as static routes.

## Scope boundary

Completed scope now includes the Phase 2 harness/schemas, Phase 3 canonical identity, Phase 4 pure policy evaluation, and Phase 5 approval/history/audit/fixtures. It does not implement a compiler, routes, UI, browser coverage, release documentation, or any external action.

## Phase 6 — Intent compiler and validated server routes

### T037 official OpenAI Responses structured-output verification

Verified on 2026-07-18 (America/Bogota), before writing the optional adapter:

- Authoritative source: OpenAI, “Structured model outputs,” JavaScript/Zod example at `https://developers.openai.com/api/docs/guides/structured-outputs`. The documented shape imports `OpenAI` from `openai` and `zodTextFormat` from `openai/helpers/zod`, calls `client.responses.parse({ model: "gpt-5.6", input, text: { format: zodTextFormat(schema, name) } })`, and reads `response.output_parsed`.
- Installed package: exact `openai@6.48.0`, published in the official `openai/openai-node` releases on 2026-07-17.
- Installed type surface: `node_modules/openai/resources/responses/responses.d.ts` declares `Responses.parse<...>(body, options): APIPromise<ParsedResponse<ParsedT>>` and `ParsedResponse.output_parsed: ParsedT | null`; `node_modules/openai/helpers/zod.d.ts` declares `zodTextFormat(zodObject, name, props?): AutoParseableTextFormat<...>`.

The official documentation and installed declarations agree, so T042-T043 may proceed behind a `.server.ts` boundary. No API call was made and no credential was present or required for verification.

### T038-T039 deterministic seeded compiler

Focused command:

```bash
npm run test:run -- tests/unit/guard/compiler.test.ts
```

- **RED:** 2026-07-18 12:21 America/Bogota, exit 1 before test collection because `@/lib/guard/compiler` did not exist.
- **GREEN:** 12:21, exit 0 with 1 file and 3 tests passed; the full suite then passed 9 files and 78 tests.
- **REFACTOR:** fallback metadata became an explicit argument for provider orchestration; the focused compiler/provider/route set and full suite remained green at 12:25.

The deterministic compiler accepts the exact seeded invoice intent, rejects unsupported input, constructs a fresh proposed contract, computes the authority fingerprint locally, and labels the result `deterministic` / `seeded`. It performs no external action.

### T040-T041 strict route handlers

Focused commands and vertical results:

```bash
npm run test:run -- tests/integration/api/compile-route.test.ts
npm run test:run -- tests/integration/api/approve-route.test.ts
npm run test:run -- tests/integration/api/evaluate-route.test.ts
```

- **Compile RED:** 2026-07-18 12:22 America/Bogota, exit 1 before collection because `@/app/api/compile/route` did not exist. **GREEN:** 12:22, exit 0 with 2/2 tests.
- **Approve RED:** 12:22, exit 1 before collection because `@/app/api/approve/route` did not exist. **GREEN:** 12:23, exit 0 with 2/2 tests.
- **Evaluate RED:** 12:23, exit 1 before collection because `@/app/api/evaluate/route` did not exist. **GREEN:** 12:23, exit 0 with 3/3 tests.
- **REFACTOR:** shared strict request/response schemas and sanitized error responses were centralized. At 12:23 all three route files passed together: 3 files and 7 tests; full suite: 12 files and 85 tests.

All POST bodies are parsed from JSON and validated with strict Zod objects; successful responses are also parsed through strict response schemas. No route opts into CORS. Approval reuses the fingerprint/lifecycle guard. Evaluation computes the verdict server-side from contract, attempt, caller-supplied time, and caller-supplied history. It instantiates isolated history only after its own `ALLOW`, returns a defensive `nextHistory` only for that outcome, and returns `null` after `DENY`. Unknown client verdict fields are rejected before evaluation. Schema and integrity errors fail closed and never consume history. No handler sends email, makes payment, writes files, or calls any non-OpenAI third party.

### T042-T043 optional OpenAI compiler

Focused command:

```bash
npm run test:run -- tests/unit/guard/openai-compiler.test.ts
```

- **RED:** 2026-07-18 12:24 America/Bogota, exit 1 before collection because `@/lib/guard/openai-compiler.server` did not exist.
- **GREEN:** 12:24, exit 0 with 1 file and 6 tests passed; `npm run typecheck` also exited 0.
- **Route-selection RED:** 12:25, focused compile-route run collected 3 tests and failed 1 because `auto` without a key returned 422 instead of the required deterministic fallback.
- **Route-selection GREEN/REFACTOR:** 12:25, compile route passed 3/3; provider plus all route tests passed 4 files and 14 tests; full suite passed 13 files and 92 tests.

The adapter lives in `openai-compiler.server.ts`, uses the verified `responses.parse` / `zodTextFormat` shape, and injects a narrow Responses client for tests. It forces `status: proposed`, computes the fingerprint locally, and validates `output_parsed` before returning. `OPENAI_API_KEY` and `OPENAI_MODEL` are read only in this server module; the default model is `gpt-5.6`. `deterministic` never calls the provider; `auto` labels absent-key and provider-error fallbacks; explicit `openai` fails closed when unavailable. Provider exceptions are sanitized and neither credentials nor raw provider payloads are logged.

T044 is not applicable because T037 succeeded. The adapter is enabled only when explicit mode selection and credentials permit it; the credential-free deterministic path remains the judging fallback.

## Intended Phase 6 commits

- `feat: add offline intent compiler`
- `feat: expose validated guard routes`
- `feat: add optional GPT intent compiler`

No commit was attempted because `.git` is read-only in this sandbox and the user explicitly prohibited commit attempts.

## Phase 6 final verification

Focused compiler and route suite:

```bash
npm run test:run -- tests/unit/guard/compiler.test.ts tests/unit/guard/openai-compiler.test.ts tests/integration/api/compile-route.test.ts tests/integration/api/approve-route.test.ts tests/integration/api/evaluate-route.test.ts
```

Observed 2026-07-18 12:26 America/Bogota: exit 0; 5 files and 17 tests passed.

Full and static quality gates:

```bash
npm run test:run
npm run lint
npm run typecheck
```

Observed at 12:26: all exited 0. Vitest passed 13 files and 92 tests; ESLint and `tsc --noEmit` produced clean output.

The sandbox denied the unchanged scaffold's Google Fonts network fetch during plain Turbopack `npm run build`, then its offline-font retry hit a sandbox-only Turbopack worker port restriction. No application file was changed to work around either environmental restriction. The production build was therefore verified using Next.js 16's font-response test hook and supported webpack build flag:

```bash
NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/tmp/zelic-next-font-mocks.cjs npm run build -- --webpack
```

Observed at 12:26: exit 0. Next.js 16.2.10 compiled successfully, completed TypeScript, generated 7/7 static pages, finalized traces, and reported `/api/approve`, `/api/compile`, and `/api/evaluate` as dynamic server routes. The mock file remained in `/tmp` outside the repository and is not an application dependency.

Diff, secret, external-action, package, and scope validation:

```bash
git diff --check
rg secret patterns over src/tests/package files (negative assertion)
rg external-action/CORS patterns over Phase 6 production files (negative assertion)
npm ls openai --depth=0
git diff --name-only
git ls-files --others --exclude-standard
```

Observed at 12:27: exit 0. Diff whitespace was clean; no secret-shaped value, `NEXT_PUBLIC_OPENAI` name, explicit CORS header, file write, email send, payment creation, or generic `fetch` call exists in the Phase 6 implementation. The exact installed SDK is `openai@6.48.0`. The changed/untracked inventory is limited to Phase 6 compiler/routes/tests, the package manifests, task checklist, and this evidence file; no Phase 7+ UI, Playwright, security-header, or release-document file was added.

### T043 review remediation — enforced server-only import

Verified on 2026-07-18 at 12:49 America/Bogota:

- Local Next.js 16.2.10 documentation: `node_modules/next/dist/docs/01-app/02-guides/data-security.md`, “Preventing client-side execution of server-only code,” requires `import 'server-only'` and states that a client-environment import then causes a build error.
- Cached npm registry metadata: `npm view server-only version dist-tags --offline --cache /tmp/zelic-guard-npm-cache` returned `version = '0.0.1'` and `latest = '0.0.1'`.
- Installed package: exact `server-only@0.0.1`; `package.json` and the lockfile pin the same version.

Focused architecture command:

```bash
npm run test:run -- tests/architecture/server-only-boundary.test.ts
```

- **RED:** 2026-07-18 12:49 America/Bogota, exit 1 with 1 failed test because the marker source position was `-1`.
- **GREEN:** 12:49, exit 0 with 1 file and 1 test passed after adding `import "server-only";` before the OpenAI SDK import.
- **REFACTOR:** `vitest.config.ts` maps only test resolution of `server-only` to `src/test/server-only.stub.ts`; production resolution remains the official package. The focused provider/route suite then passed 4 files and 14 tests.

This remediation changes only boundary enforcement and test plumbing. The architecture test reads the server module source and proves the marker precedes runtime dependencies; it does not simulate or expand into client-bundle coverage.

Remediation verification commands:

```bash
npm run test:run
npm run lint
npm run typecheck
npm run build
```

Observed 2026-07-18 at 12:50 America/Bogota: Vitest exited 0 with 14 files and 93 tests passed; ESLint and `tsc --noEmit` exited 0 with clean output. Normal Turbopack `npm run build` was attempted and again reached production compilation but exited 1 solely because the restricted sandbox could not connect to Google Fonts for the unchanged scaffold's Geist imports.

The established offline production-build verification was then repeated:

```bash
NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/tmp/zelic-next-font-mocks.cjs npm run build -- --webpack
```

Observed at 12:51: exit 0. Next.js 16.2.10 compiled successfully, completed TypeScript and 7/7 static-page generation, and emitted `/api/approve`, `/api/compile`, and `/api/evaluate` as dynamic server routes with the real `server-only` package resolution intact.

Final checks:

```bash
git diff --check
rg secret patterns over src/tests/package/config files (negative assertion)
npm ls server-only --depth=0
git diff --name-only
git ls-files --others --exclude-standard
```

Observed at 12:51: exit 0. Diff whitespace and secret scans were clean, npm reported only exact `server-only@0.0.1` at depth zero, and the additional remediation inventory is limited to the package manifests, `vitest.config.ts`, the test-only stub, the architecture test, task evidence, the marker import, and this evidence update. No UI, security-header, deployment, or release-document work was added.

## Phase 7 — Mission-control UI

### T045-T046 core state-machine flow

Focused command:

```bash
npm run test:run -- tests/integration/ui/mission-control.test.tsx
```

- **RED:** 2026-07-18 13:11 America/Bogota, exit 1 before collection because `@/components/guard/mission-control` did not exist.
- **GREEN:** 13:13, exit 0 with 1 file and 1 test passed. The full suite then passed 15 files and 94 tests.
- **REFACTOR:** the client orchestrator retained state/API ownership while contract inspection, execution evidence, audit timeline, and the original inline-SVG brand mark moved into focused presentational components. The focused flow remained green.

The test proves the editable seeded intent starts with approval and scenarios locked, compilation produces a visible proposed contract, approval unlocks execution, Safe run displays ALLOW plus `ALL_RULES_PASSED`, and Recipient drift displays DENY plus `RECIPIENT_NOT_ALLOWED`. Every network boundary is mocked as strict JSON and the exact simulation disclosure remains visible.

### T047-T048 scenarios, evidence, reset, and errors

Focused command:

```bash
npm run test:run -- tests/integration/ui/mission-control.test.tsx
```

- **Harness correction:** the first 13:13 run exposed missing explicit RTL cleanup between Vitest cases; cleanup was added before assessing behavior.
- **RED:** 13:14, exit 1 with 1 failed and 2 passed because the expired evaluation had no explicit `Expired window` presentation.
- **GREEN:** 13:14, exit 0 with 1 file and 3 tests passed after adding expiry state and deterministic `AUD-0001` ordering.
- **REFACTOR:** visible per-check reason codes required reason assertions to target one-or-more matching evidence elements. At 13:20 the focused tests, lint, and typecheck were clean; the full suite passed 15 files and 96 tests.

The expanded tests prove Cost overrun, Replay, and Expired contract reason visibility; Replay shows both `MAX_RUNS_EXCEEDED` and `REPLAY_DETECTED`; every result displays all 10 ordered checks with Pass/Fail text; counters update; approved authority JSON is collapsible; compiled/approved/denied/expired/reset audit events use deterministic IDs and timestamps; reset restores locked pristine state; API failures are announced without consuming state; and the UI never claims email, payment, or delivery occurred.

### T049-T051 visual, responsive, and accessibility system

The final component system uses the specified `#08090a` canvas, `#0f1011` panels, whisper-white borders, Geist/Geist Mono typography, violet/cyan authority signals, emerald only for ALLOW/pass, and coral-red only for DENY/fail. It includes the compact header and hero, proof chips, three-step workflow rail, dense two-column desktop workspace, stacked mobile panels, initial/loading/error/proposed/approved/allowed/denied/expired/reset states, 44px controls, visible focus, semantic labels/headings, `aria-live`, non-color icons/text, and reduced-motion CSS. `page.tsx` remains a Server Component wrapper around the focused client lab.

`src/lib/guard/demo-seed.ts` contains only client-safe constants, type-only imports, and scenario DTO construction. The Client Component imports neither server-only fixtures, `fingerprint.ts`, `node:crypto`, nor the OpenAI adapter. Existing fixture tests continue to consume re-exported shared intent/disclosure constants.

## Phase 7 final verification

Commands:

```bash
npm run test:run -- tests/integration/ui/mission-control.test.tsx
npm run test:run
npm run lint
npm run typecheck
npm run build
```

Observed 2026-07-18 at 13:20-13:22 America/Bogota: focused UI tests passed 3/3; full Vitest passed 15 files and 96 tests; ESLint and `tsc --noEmit` produced clean output; normal Next.js 16.2.10 Turbopack build exited 0, completed TypeScript and 7/7 page generation, and emitted `/` plus the three dynamic API routes.

Real-browser verification used the actual development routes at desktop 1440×1000 and mobile 375×812. Desktop compile -> approve -> Safe run completed with HTTP 200 responses and a visible ALLOW. Both viewports had non-empty semantic content, no Next.js error overlay, no console warnings/errors, and `scrollWidth === innerWidth`. At 375px the shell was 375px and every major panel measured 351px from x=12 to x=363, proving no horizontal page overflow. No Playwright dependency or test suite was added.

Final `git diff --check`, secret-pattern, external-action, CORS, and client-boundary scans exited 0 at 13:24. New UI/client-safe files contain no secret-shaped value, `NEXT_PUBLIC_OPENAI` name, external URL/action primitive, file mutation, CORS opt-in, fixture/fingerprint/OpenAI-adapter import, `node:crypto`, or `server-only` import. The changed/untracked inventory is limited to the Phase 7 page/layout/styles, guard UI components, client-safe demo seed, fixture constant reuse, UI test, task checklist, and this evidence file; no Playwright, security-header, release, or deployment file changed.

## Intended Phase 7 commits

- `test: cover mission-control state transitions`
- `feat: build guard execution lab`
- `style: refine accessible mission control`

No commit was attempted because `.git` is read-only in this sandbox and the user explicitly prohibited commit attempts.

## Phase 7 presentation corrections

Focused command: `npm run test:run -- tests/integration/ui/mission-control.test.tsx`.

- **RED:** 2026-07-18 13:53 America/Bogota, exit 1 with 2 failed and 2 passed. The ALLOW view had no `PASS` row markers and the resettable audit still exposed `IMMUTABLE EVIDENCE`.
- **GREEN:** 13:53, exit 0 with 1 file and 4 tests passed. All ten passing checks render `PASS` without failure reason codes, the failed recipient rule retains `RECIPIENT_NOT_ALLOWED`, and the audit kicker reads `DETERMINISTIC EVIDENCE`.
- **REFACTOR:** no broader refactor was needed; the production change is limited to the two requested conditional/text render corrections.

Final verification at 13:53-13:54: `npm run test:run` passed 15 files and 97 tests; `npm run lint` and `npm run typecheck` exited 0 with clean output. The first normal `npm run build` attempt failed only while fetching Geist from Google Fonts; an unchanged retry exited 0, compiled successfully, completed TypeScript and 7/7 static pages, and emitted the existing application and three API routes. Final `git diff --check` exited 0.
