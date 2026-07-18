# Implementation Plan: ZELIC Guard

**Spec:** `specs/001-zelic-guard/spec.md`  
**Constitution:** `.specify/memory/constitution.md`  
**Detailed execution plan:** `docs/plans/2026-07-18-zelic-guard.md`  
**Status:** Awaiting first-phase review

## Technical context

- Next.js 16.2.10 App Router, TypeScript 5, React 19.2.4, Tailwind CSS 4.
- Vitest for domain and route tests; React Testing Library/user-event for the core UI integration.
- Playwright only after a reliable local proof; otherwise deterministic smoke coverage plus manual desktop/mobile browser evidence.
- Zod for all runtime schemas.
- Web Crypto or Node `crypto` behind a small hashing boundary; the domain canonicalizer remains runtime-independent.
- No database or auth. Demo replay state is injected and session-scoped; production durability is an interface/documentation concern only.
- Optional OpenAI server adapter. Mandatory compiler path is deterministic and credential-free.

## Version-matched Next.js decisions

The planning phase reviewed the installed documentation under `node_modules/next/dist/docs/`, including AI-agent guidance, Route Handlers, environment variables, data security, CSP, and `next.config` headers.

- POST Route Handlers live at `src/app/api/**/route.ts` and are uncached by default.
- Non-`NEXT_PUBLIC_` environment variables stay server-only; `.env*` remains ignored while `.env.example` is explicitly committed.
- Route handlers use web `Request`/`Response` APIs and validate parsed bodies before invoking application services.
- Security headers use the supported async `headers()` configuration in `next.config.ts`. A static CSP will be chosen only after checking the built app’s real needs; nonce-based CSP would force dynamic rendering and is unnecessary unless the implementation introduces inline-script requirements.
- Client Components receive only DTOs safe for browser exposure; secrets and server adapters never cross the boundary.

## Proposed source structure

```text
src/
  app/
    api/
      approve/route.ts
      compile/route.ts
      evaluate/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/guard/
    contract-panel.tsx
    execution-gate.tsx
    intent-panel.tsx
    mission-control.tsx
    rule-check-list.tsx
    audit-timeline.tsx
    contract-json.tsx
    status-badge.tsx
  lib/guard/
    canonicalize.ts
    fingerprint.ts
    schemas.ts
    types.ts
    reason-codes.ts
    evaluate-execution.ts
    approve-contract.ts
    compiler.ts
    deterministic-compiler.ts
    openai-compiler.server.ts
    history.ts
    audit.ts
    fixtures.ts
    errors.ts
  test/
    setup.ts
tests/
  unit/guard/
  integration/api/
  integration/ui/
scripts/
  smoke.mjs
```

Routes will be included because they make the judge-visible policy boundary real: compile and approve remain server-validated, and evaluate invokes the shared domain engine. The UI may use the same shared types but must not own the authoritative decision algorithm.

## Contract and evaluation design

1. Zod parses unknown input into normalized domain values.
2. `canonicalize` recursively sorts record keys, preserves arrays, and rejects values outside the JSON-safe schema.
3. `fingerprintContract` hashes the canonical authority payload without its derived fingerprint.
4. `approveContract` revalidates the proposal, verifies/recomputes its fingerprint, and emits an approved snapshot.
5. `evaluateExecution` accepts `{ contract, attempt, now, history }` and emits all rule checks in a constant order.
6. The application layer commits an allowed execution to the injected history adapter and creates deterministic audit events. The pure evaluator never mutates history.

Rule order: approval, expiration, action, channel, target, recipient, resource fingerprint, cost, max runs, replay. The aggregate emits `ALL_RULES_PASSED` only when all checks pass.

## State and API boundary

- The browser owns presentation state and a lab/session identifier.
- A demo history adapter owns consumed IDs and successful-run count for that lab. If server memory cannot provide reliable per-session isolation on Vercel, the route accepts a validated history snapshot and returns the next snapshot; the limitation is explicit and the engine remains honest/deterministic.
- `POST /api/compile`: validates intent, invokes deterministic or verified OpenAI adapter, validates contract output, returns compiler mode.
- `POST /api/approve`: validates contract proposal and returns an approved fingerprinted snapshot.
- `POST /api/evaluate`: validates contract, attempt, clock/history snapshot, evaluates, and returns verdict plus next history/audit data.
- No route enables CORS or performs an external action. OpenAI is the only optional external request and exists only in compile.

The exact replay transport choice will be finalized with a test that proves isolation and repeatability. The production adapter interface will describe an atomic durable consume operation, while the demo clearly states that its adapter is not distributed replay protection.

## OpenAI compiler boundary

`src/lib/guard/compiler.ts` defines an `IntentCompiler` interface. `deterministic-compiler.ts` implements the mandatory seed behavior. `openai-compiler.server.ts` is imported only from server code and must begin with `server-only` protection.

Before implementation, verify current official OpenAI documentation and installed SDK support for structured outputs. Preserve the requested default `OPENAI_MODEL=gpt-5.6`. If official support cannot be established, do not invent an SDK call: keep the optional adapter disabled with a precise configuration error and retain the complete offline experience.

## Security plan

- Zod strict objects and bounded strings/numbers at every boundary.
- Request body size guard for public POST routes and stable non-secret error envelopes.
- Server-only env access; no raw intent/model output logging in production paths.
- Same-origin calls and no wildcard CORS.
- Headers planned: CSP fitted to emitted assets, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and frame protection via CSP `frame-ancestors 'none'` (plus compatibility header if useful).
- Document Vercel Firewall/WAF rate limiting on `/api/compile`, including lower limits for credential-backed mode.
- Run `npm audit` and inspect the two moderate PostCSS paths. A package override is accepted only if `npm install`, tests, and build prove Next.js compatibility. Otherwise retain Next.js 16.2.10 and document affected versions, exploit preconditions, demo exposure, and upstream remediation status.

## Test strategy

- **Unit:** schemas, canonicalization, fingerprint, approval, each evaluation rule, combined failures, deterministic fixtures/audit.
- **Integration:** compile/approve/evaluate route validation and credential-free flow.
- **UI integration:** type/compile, edit, approve, allow once, block recipient drift, inspect evidence, reset.
- **Browser:** desktop and mobile, keyboard, reduced motion, no console errors. Prefer Playwright if installation and browser execution are reliable.

Each behavior is introduced through the exact RED -> GREEN -> REFACTOR protocol in `docs/plans/2026-07-18-zelic-guard.md`. A focused test and full suite are run before each checkpoint commit.

## Delivery phases and commit points

1. **Planning baseline** — Spec Kit documents and `AGENTS.md`.  
   Commit: `docs: add ZELIC Guard Spec Kit plan`
2. **Test foundation and schemas** — scripts, Vitest, Zod, strict schemas.  
   Commit: `test: establish guard schema contract`
3. **Canonical contract identity** — canonicalization and SHA-256.  
   Commit: `feat: add deterministic contract fingerprints`
4. **Policy verticals** — lifecycle, scope, cost/run, replay behaviors in small RED/GREEN commits.  
   Commits split by rule group, never one bulk policy commit.
5. **Compiler and route boundary** — deterministic compile first; optional verified OpenAI adapter separately.  
   Commits: `feat: add offline intent compiler`; `feat: expose validated guard routes`; optional GPT commit only when verified.
6. **Mission-control UI** — core flow, adversarial controls, evidence, responsive/accessibility polish.  
   Commits split between functional flow and visual/accessibility refinement.
7. **Security, docs, and evidence** — headers/audit decision, README, prior work, evidence, demo, judge plan, MIT license.  
   Commit: `docs: prepare judge-ready Build Week submission`
8. **Release verification** — all quality gates and real browser checks; only evidence corrections, no deployment.  
   Commit only if verification produces tracked evidence changes.

## Constitution check

- Contract authority and approval invalidation are explicit: **PASS**.
- Pure evaluator with injected time/history: **PASS**.
- Offline mandatory path and optional server-only GPT adapter: **PASS**.
- Strict TDD and evidence checkpoints: **PASS**.
- Simulation-only, no database/auth/external action: **PASS**.
- Judge-first accessible application and required states: **PASS**.
- Security, audit residual risk, provenance, and history preservation: **PASS**.

No production implementation may begin until this first-phase plan is reviewed.
