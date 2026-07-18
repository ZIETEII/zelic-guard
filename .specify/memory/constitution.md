# ZELIC Guard Constitution

**Project:** ZELIC Guard — Intent Contracts for AI Agents  
**Version:** 1.0.0  
**Ratified:** 2026-07-18  
**Last amended:** 2026-07-18

## Purpose

ZELIC Guard demonstrates one enforceable boundary: an AI agent may propose any plan, but an execution attempt is allowed only when it satisfies a typed contract that a human approved. The submission must be independently judge-testable, deterministic without credentials, and honest about its simulation-only behavior and Build Week provenance.

## I. Contracts are the authority

The approved, fingerprinted contract is the sole authority for an execution verdict. Natural-language intent, UI state, model output, and operator expectations are inputs or representations; none may bypass the contract.

- A contract begins as `proposed` and cannot authorize execution until explicitly approved.
- Approval occurs only after the human can inspect and edit constraints.
- Any material contract edit after approval invalidates the prior approval and fingerprint and returns the contract to `proposed`.
- Rejected, expired, malformed, or unapproved contracts always deny execution.
- Every verdict includes explicit per-rule checks and machine-readable reason codes.

## II. Determinism before persuasion

The policy engine under `src/lib/guard/` must be pure, framework-independent, and deterministic.

- Identical validated inputs, clock value, and history state must produce identical verdict data and ordered rule checks.
- Time, replay records, and successful-run counts are dependency-injected inputs; hidden mutable module state is forbidden in the pure evaluator.
- Canonical serialization is stable across object key order, and SHA-256 fingerprints are derived only from the canonical contract payload.
- Audit ordering and demo timestamps are deterministic. Presentation may animate, but animation cannot affect policy results.
- The engine evaluates all applicable rules so a denial remains explainable; it does not hide later failures behind an early return.

## III. Deny safely at every boundary

Malformed, ambiguous, missing, stale, or out-of-scope data fails closed.

- Zod validates contracts, constraints, attempts, compiler inputs, compiler outputs, and route bodies.
- Rules cover approval, expiry, action, channel, target, recipient allowlist, resource fingerprint, cost ceiling, max runs, and replayed execution IDs.
- Route handlers are same-origin and do not add wildcard CORS.
- No database, authentication product, external action service, real recipient, or real payment is part of the public demo.
- The application must visibly state: “Simulation only — no email or payment is sent.”

## IV. Offline operation is a release requirement

The judge path must work from a clean checkout without `OPENAI_API_KEY`.

- A seeded deterministic intent compiler is the mandatory default when credentials are absent.
- Optional OpenAI compilation is server-only, selected through `OPENAI_API_KEY` and `OPENAI_MODEL`, and defaults in documentation to `gpt-5.6` as required by the Build Week brief.
- The current official SDK/API shape must be verified immediately before implementation. If it cannot be verified, the OpenAI implementation remains behind an unimplemented or disabled adapter rather than using invented calls.
- The UI accurately labels the active compiler as `GPT-5.6` or `Deterministic demo`.
- Secrets and raw authorization headers are never logged, serialized to the client, or committed.

## V. Test-first evidence is part of the product

Every new domain behavior follows one vertical RED -> GREEN -> REFACTOR cycle.

1. Add one focused failing test.
2. Run it and confirm the failure is caused by missing behavior.
3. Implement only enough behavior to pass.
4. Run the focused test and the full non-watch suite.
5. Refactor only while green.
6. Create a normal, dated commit at a coherent checkpoint.

`BUILD_WEEK_EVIDENCE.md` must record commands and observed RED/GREEN outcomes. Tests must cover schema rejection, canonical fingerprint stability, each policy rule, replay dependency injection, routes when present, and the core UI flow.

## VI. Judge experience is the acceptance surface

The first screen is a usable mission-control application, not a marketing page. A judge must be able to compile the sample intent, inspect and approve a contract, allow one valid attempt, deny adversarial attempts, inspect JSON and audit evidence, reset the lab, and reproduce these results within five minutes.

The UI must provide:

- a desktop three-stage flow and a stacked mobile flow;
- initial, loading, error, proposed, approved, allowed, denied, expired, and reset states;
- keyboard operation, visible focus, accessible contrast, semantic status messaging, and reduced-motion support;
- contract status and fingerprint, verdict, rule-by-rule evidence, deterministic audit order, and allowed/blocked counters;
- a premium graphite, ivory, acid-green, amber, and signal-red visual system without purple gradients or generic AI imagery.

## VII. Security and provenance are non-negotiable

- Add practical security headers in `next.config.ts`; keep CSP compatible with the actual Next.js 16 rendering mode.
- Public compiler routes require documented Vercel Firewall/WAF rate-limit guidance.
- Investigate the two moderate PostCSS advisories reported transitively through Next.js 16.2.10. Do not downgrade Next.js; use only a proven compatible override, otherwise document the exact residual risk and upstream dependency path.
- Preserve scaffold commit `c2d047b` and all later dated commits. Do not amend or rewrite history.
- `PRIOR_WORK.md` must disclose HermeSpec as third-party prior inspiration and describe the independent implementation boundary.
- `BUILD_WEEK_EVIDENCE.md` must name `gpt-5.6-sol`, reserve a primary Codex session ID placeholder, and distinguish pre-session scaffold output from new work.
- Entrant-owned source is MIT licensed; third-party dependencies retain their own licenses.

## Quality gates

A release candidate is incomplete until all of these pass cleanly:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

The app must also be exercised in a real browser at desktop and mobile dimensions with no console errors. If Playwright is reliable, it owns the core browser-flow regression. Otherwise, a deterministic smoke script plus recorded browser verification is required.

## Governance

This constitution overrides conflicting convenience decisions in plans and tasks. Amendments require a dated change, rationale, migration impact, and a normal Git commit. Versioning follows semantic intent:

- **MAJOR:** removes or weakens a governing safety or evidence principle;
- **MINOR:** adds a new principle or materially expands a requirement;
- **PATCH:** clarifies language without changing obligations.

Every implementation review must confirm compliance with the constitution and the Build Week brief before work is declared complete.
