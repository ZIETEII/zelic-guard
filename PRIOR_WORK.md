# Prior Work and Build Week Boundary

## HermeSpec

HermeSpec is a third-party, MIT-licensed MCP project that existed before OpenAI Build Week 2026. It inspired the high-level **propose → approve → execute** lifecycle. The entrant does not own HermeSpec and did not copy its implementation.

ZELIC Guard is an independent implementation created for Build Week. Its policy engine, Zod schemas, canonical serializer, SHA‑256 contract identity, deterministic replay interface, fixtures, Next.js routes, mission-control UI, tests, and documentation were written in this repository.

## Pre-session scaffold

Commit `c2d047b` contains the initial `create-next-app` scaffold. Before the primary Codex implementation session, the repository contained framework boilerplate rather than the ZELIC Guard product.

## Build Week implementation

The preserved commits after the scaffold show the progression from project constitution and specification through:

- strict domain schemas and reason codes;
- canonical serialization and stable fingerprints;
- the pure ten-rule policy evaluator;
- approval, replay history, audit evidence, and adversarial fixtures;
- deterministic and optional GPT‑5.6 intent compilers;
- validated compile, approve, and evaluate routes;
- the responsive mission-control application and one-click threat suite;
- security headers, judge documentation, and release verification.

The authoritative command and RED/GREEN evidence is recorded in [`BUILD_WEEK_EVIDENCE.md`](./BUILD_WEEK_EVIDENCE.md).
