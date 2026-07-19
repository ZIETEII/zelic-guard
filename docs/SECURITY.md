# Security Boundaries

## Public sandbox

ZELIC Guard is a simulation lab. It never sends email, creates a payment, or mutates a third-party service. Fixtures use reserved `.test` recipients and synthetic payment amounts.

The public demo deliberately has no login or database. It stores no user account data, and the evaluator receives time and replay history explicitly. A production integration should persist replay consumption transactionally behind the existing history interface; it must not add mutable state to the pure evaluator.

## Server-only secrets

- `OPENAI_API_KEY` and `OPENAI_MODEL` are read only by `openai-compiler.server.ts`.
- Neither variable may use a `NEXT_PUBLIC_` prefix.
- Provider errors are sanitized; credentials, authorization headers, and raw provider payloads are not logged.
- `.env.local` and all secret-bearing `.env.*.local` files remain ignored.

## Route boundaries

- Compile, approve, and evaluate inputs are strict Zod objects.
- Model-produced values and successful route responses are also parsed through strict schemas.
- Unknown fields and malformed JSON fail closed.
- Routes are same-origin and do not opt into wildcard CORS.
- Security headers apply to every route through `next.config.ts`.

## Recommended Vercel Firewall rule

The public `/api/compile` route can incur model cost when GPT‑5.6 is enabled. Before enabling the production key, configure a Vercel WAF rule:

1. Open the linked project in Vercel and choose **Firewall → Configure → New Rule**.
2. Match request path `/api/compile` and method `POST`.
3. Choose **Rate Limit**, fixed window, counted by IP or JA4 digest.
4. Start in **Log** mode, inspect legitimate traffic, then use the default `429` response.
5. A conservative demo starting point is 10 requests per minute per source; adjust only after observing traffic.
6. Review and publish the firewall change separately from application code.

Rate limiting is a billed Vercel feature, so this repository documents the control but does not silently enable or purchase it. Current platform instructions: [Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Dependency advisory remediation

Next.js 16.2.10 pins PostCSS 8.4.31, which is affected by `GHSA-qx2v-qp2m-jg93`. The repository uses an npm override to resolve all consumers to PostCSS 8.5.19, staying within major version 8. An architecture regression test resolves PostCSS from Next.js's module context and requires a version containing the fix. The complete test suite and production build must remain green after every lockfile update.
