# Feature Specification: ZELIC Guard

**Feature branch:** `001-zelic-guard` (spec identifier; implementation currently remains on the checked-out repository branch)  
**Created:** 2026-07-18  
**Status:** Draft for review  
**Category:** Developer Tools

## Product statement

ZELIC Guard is a visual execution lab for intent contracts. It converts a risky natural-language request into a typed proposal, requires a human approval, and deterministically evaluates whether later execution attempts remain inside the approved scope.

Tagline: **AI agents can plan freely. They can act only inside an approved contract.**

The public demo is simulation-only. It sends no email, makes no payment, and mutates no third-party system.

## Users

- **Primary:** a developer or platform engineer evaluating controls around agent actions.
- **Secondary:** a Build Week judge who needs a complete, reproducible flow in five minutes.
- **Operator:** a human reviewer who edits constraints and explicitly approves or rejects a contract.

## User stories and acceptance scenarios

### US1 — Compile an intent into a reviewable contract (P1)

As a developer, I can enter the seeded invoice intent and receive a structured proposed contract so I can inspect the authority an agent is requesting.

**Independent test:** With no API key, submit the sample intent and observe a deterministic proposed contract and `Deterministic demo` badge.

**Acceptance scenarios:**

1. Given the initial lab, when the sample intent is compiled, then the UI shows action, channel, target, allowed recipients, resource fingerprint, max cost, max runs, expiration, `proposed` status, and a stable contract fingerprint.
2. Given no `OPENAI_API_KEY`, when compilation runs, then no network credential is required and identical seeded input produces identical contract content.
3. Given invalid or unsupported intent input, when compilation is requested, then the UI enters an accessible error state and no approvable contract is created.
4. Given optional valid server credentials, when the verified OpenAI adapter is enabled, then output is schema-validated before it can become a proposal and the UI badge reads `GPT-5.6`.

### US2 — Review, edit, and approve constraints (P1)

As a human reviewer, I can edit material constraints and explicitly approve a proposal so execution authority is intentional and inspectable.

**Independent test:** Change the max cost, verify fingerprint/status refresh, then approve and observe an approved immutable snapshot.

**Acceptance scenarios:**

1. Given a proposed contract, when the reviewer changes a material constraint, then the contract remains or returns to `proposed` and its fingerprint is recomputed.
2. Given a valid proposed contract, when the reviewer activates Approve, then status becomes `approved` and the approved fingerprint is visible.
3. Given an approved contract, when a material constraint changes, then the previous approval is invalidated before any attempt can be allowed.
4. Given malformed edited data, when approval is attempted, then Zod rejects it and the UI identifies the invalid field without approving.

### US3 — Allow a valid execution attempt (P1)

As a developer, I can run a matching attempt and see every policy check pass so I can trust why it was allowed.

**Independent test:** Approve the seed contract, run Valid execution, and observe `ALLOW`, `ALL_RULES_PASSED`, one allowed count, and ordered audit evidence.

**Acceptance scenarios:**

1. Given an approved unexpired contract, unused execution ID, matching fields, cost at or below the limit, and remaining run capacity, when evaluated, then the verdict is `ALLOW`.
2. The result lists each applicable rule in a stable order with pass state and human-readable evidence.
3. The allowed attempt is recorded through an injected history adapter only after evaluation succeeds.
4. The UI never claims that the simulated email was sent.

### US4 — Deny drift and lifecycle violations (P1)

As a developer, I can run adversarial scenarios and see deterministic denials with exact reason codes.

**Independent test:** Run each required scenario and verify that its corresponding rule fails and the blocked counter increments.

**Acceptance scenarios:**

1. Proposed or rejected contract -> `DENY` / `CONTRACT_NOT_APPROVED`.
2. Expired contract or evaluation after `expiresAt` -> `DENY` / `CONTRACT_EXPIRED`.
3. Action drift -> `DENY` / `ACTION_MISMATCH`.
4. Channel drift -> `DENY` / `CHANNEL_MISMATCH`.
5. Target drift -> `DENY` / `TARGET_MISMATCH`.
6. Recipient drift -> `DENY` / `RECIPIENT_NOT_ALLOWED`.
7. Resource drift -> `DENY` / `RESOURCE_FINGERPRINT_MISMATCH`.
8. Cost overrun -> `DENY` / `COST_LIMIT_EXCEEDED`.
9. Successful-run count at max -> `DENY` / `MAX_RUNS_EXCEEDED`.
10. Reused execution ID -> `DENY` / `REPLAY_DETECTED`.

### US5 — Inspect evidence and reset the lab (P2)

As a judge, I can inspect machine-readable and human-readable evidence, then reset to a known initial state.

**Independent test:** Generate allowed and denied events, inspect contract JSON and counters, reset, and observe the clean seed state.

**Acceptance scenarios:**

1. Every compile, edit, approval, evaluation, denial, allowance, expiration simulation, and reset is represented in a deterministic audit timeline.
2. Contract JSON is copy-readable and matches the structured contract shown in the form.
3. Allowed and blocked counters reflect evaluation results, not UI clicks.
4. Reset clears the approved contract, consumed IDs, counters, verdict, and audit events, then restores the initial seeded intent.

### US6 — Use the lab accessibly across viewport sizes (P2)

As a user, I can operate the complete lab by keyboard and on mobile without losing evidence or controls.

**Independent test:** Complete the core flow at desktop and mobile widths using keyboard navigation and reduced-motion preference.

**Acceptance scenarios:**

1. Desktop presents the Intent, Contract, and Execution Gate stages as one coherent flow; mobile stacks them in logical order.
2. Focus is visible, labels are programmatic, status changes are announced appropriately, and color is not the only status signal.
3. Reduced-motion disables nonessential movement.
4. No horizontal overflow hides controls or evidence at the target mobile viewport.

## Functional requirements

- **FR-001:** The system must validate all domain objects with Zod and infer their TypeScript types from schemas.
- **FR-002:** The contract must include schema version, ID, action, channel, target, allowed recipients, resource fingerprint, max cost, max runs, expiration, status, and contract fingerprint.
- **FR-003:** Approval must operate on a validated, fingerprinted contract snapshot.
- **FR-004:** Canonical serialization must sort object keys recursively, preserve array order, reject unsupported values, and produce stable UTF-8 JSON.
- **FR-005:** Contract fingerprinting must use SHA-256 over the canonical authority payload and exclude the fingerprint field itself.
- **FR-006:** `evaluateExecution` must be pure and accept the contract, attempt, evaluation time, and a replay/history snapshot or interface as explicit inputs.
- **FR-007:** Evaluation must emit ordered `RuleCheck` values with rule identifier, pass/fail, reason code, and human-readable message.
- **FR-008:** A verdict is `ALLOW` only when every required rule passes; otherwise it is `DENY` and exposes all failed checks.
- **FR-009:** The demo must provide valid, recipient-drift, cost-overrun, replay, and expired controls plus reset.
- **FR-010:** Seed fixtures must use `INV-2048`, `finance@northstar.test`, non-secret fingerprints, and no external-action capability.
- **FR-011:** The deterministic compiler must work without environment variables.
- **FR-012:** The optional compiler must execute server-side, validate structured output, and never expose or log credentials.
- **FR-013:** Route handlers, if used, must validate request JSON with Zod and return stable error envelopes with appropriate 4xx/5xx status.
- **FR-014:** The app must display compiler mode, contract status/fingerprint, verdict, checks, audit events, counters, JSON, and the simulation disclosure.
- **FR-015:** Demo history must be isolated to the running lab session. Its non-durable, single-instance limitation and production adapter contract must be documented.
- **FR-016:** Practical security headers must be configured without wildcard CORS.
- **FR-017:** The repo must expose all required npm scripts and pass the defined quality gates.

## Domain concepts

- **Intent:** untrusted natural language describing desired authority.
- **Intent contract:** the typed proposed or approved scope against which attempts are evaluated.
- **Authority payload:** contract fields that determine permission; excludes derived fingerprint and presentation metadata.
- **Execution attempt:** a claimed action with a unique execution ID, recipient/resource/cost details, and contract reference.
- **History snapshot/adapter:** injected knowledge of consumed execution IDs and prior successful runs.
- **Rule check:** deterministic result for one policy condition.
- **Verdict:** aggregate `ALLOW` or `DENY` plus ordered checks.
- **Audit event:** presentation-safe evidence with deterministic sequence and timestamp.

## Reason-code vocabulary

`CONTRACT_NOT_APPROVED`, `CONTRACT_EXPIRED`, `ACTION_MISMATCH`, `CHANNEL_MISMATCH`, `TARGET_MISMATCH`, `RECIPIENT_NOT_ALLOWED`, `RESOURCE_FINGERPRINT_MISMATCH`, `COST_LIMIT_EXCEEDED`, `MAX_RUNS_EXCEEDED`, `REPLAY_DETECTED`, and `ALL_RULES_PASSED`.

Schema/input failures use a separate validation error envelope and are not converted into a misleading policy verdict.

## Edge cases

- Cost exactly equal to `maxCost` passes; greater cost fails.
- Evaluation exactly at `expiresAt` is expired (`now >= expiresAt`).
- Recipient matching uses normalized exact addresses; substring, display-name, or case tricks cannot expand scope.
- Empty allowlists, non-finite/negative costs, non-positive max runs, invalid timestamps, duplicate recipients, and malformed fingerprints fail schema validation.
- An execution ID is consumed only by an allowed execution. Repeating a denied attempt is still auditable but does not spend run capacity.
- Replay and max-run checks are both evaluated when both fail.
- A fingerprint mismatch denies approval/evaluation rather than silently recomputing client-supplied authority.
- Compiler timeout or invalid model output falls back only when the mode and event are made explicit; it never labels fallback output as GPT-generated.

## Non-functional requirements

- **NFR-001 Determinism:** repeatable fixtures, clock, serialization, check ordering, and audit sequence.
- **NFR-002 Performance:** offline compile and evaluate interactions should feel immediate; no required third-party round trip.
- **NFR-003 Accessibility:** WCAG-minded contrast, semantic controls, keyboard completion, focus visibility, live status, and reduced motion.
- **NFR-004 Responsiveness:** validated desktop and mobile layouts with no blocked functionality.
- **NFR-005 Security:** least exposure of secrets, strict validation, same origin, practical headers, documented rate limiting, no side effects.
- **NFR-006 Evidence:** dated commits, RED/GREEN records, primary session placeholder, provenance boundary, and reproducible judge plan.

## Success criteria

- **SC-001:** A judge completes compile -> edit/review -> approve -> allow -> deny -> reset in under five minutes from documented setup.
- **SC-002:** The minimum test matrix passes in a clean local run without API credentials.
- **SC-003:** Identical authority objects with different key insertion order produce the same SHA-256 fingerprint.
- **SC-004:** Each required adversarial control yields its exact documented reason code.
- **SC-005:** Desktop and mobile browser verification completes with no console errors.
- **SC-006:** All non-watch validation scripts exit 0 with clean output.
- **SC-007:** Documentation lets a judge distinguish scaffold, new Build Week code, prior inspiration, and optional GPT behavior.

## Out of scope

- Sending email, making payments, or mutating any third-party service.
- Authentication, user accounts, databases, durable distributed replay protection, queues, or webhooks.
- A general-purpose policy language, MCP server, SDK package publication, or production multi-tenant control plane.
- Copying or adapting HermeSpec implementation code.
- Deployment or public submission during the implementation session unless separately authorized.

## Assumptions and dependencies

- Node/npm versions compatible with Next.js 16.2.10 are available.
- Vercel is the intended deployment target, but local judge testing is authoritative.
- `OPENAI_API_KEY` is absent for the mandatory path.
- `OPENAI_MODEL=gpt-5.6` is a Build Week requirement; API availability and SDK surface must be verified from official OpenAI documentation before adapter implementation.
- The public demo’s in-memory state is intentionally non-durable and unsuitable for production replay defense.
